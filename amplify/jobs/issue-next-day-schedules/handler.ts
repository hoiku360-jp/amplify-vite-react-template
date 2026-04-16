import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/issue-next-day-schedules";
import type { Schema } from "../../data/resource";
import { issueDayFromWeekCore } from "../../functions/_shared/issueDayFromWeekCore";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

type ListOptions = Record<string, unknown>;
type ListResponse<TRow> = {
  data?: TRow[] | null;
  nextToken?: string | null;
};

type ScheduleWeekRow = Schema["ScheduleWeek"]["type"];
type ScheduleWeekItemRow = Schema["ScheduleWeekItem"]["type"];

async function listAll<TRow>(
  listFn: (args?: ListOptions) => Promise<ListResponse<TRow>>,
  args?: ListOptions,
): Promise<TRow[]> {
  const rows: TRow[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res = await listFn({
      ...(args ?? {}),
      nextToken,
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      rows.push(...res.data);
    }

    nextToken = res.nextToken ?? null;
  } while (nextToken);

  return rows;
}

function tomorrowJstDateString() {
  const now = new Date();
  const jstNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  jstNow.setDate(jstNow.getDate() + 1);

  const y = jstNow.getFullYear();
  const m = String(jstNow.getMonth() + 1).padStart(2, "0");
  const d = String(jstNow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDayOfWeek(targetDate: string): number {
  const [y, m, d] = targetDate.split("-").map(Number);

  if (!y || !m || !d) {
    throw new Error(`Invalid targetDate: ${targetDate}`);
  }

  return new Date(y, m - 1, d).getDay();
}

function overlapsTargetDate(week: ScheduleWeekRow, targetDate: string) {
  const start = String(week.weekStartDate ?? "");
  const end = String(week.weekEndDate ?? "");
  return start <= targetDate && targetDate <= end;
}

async function loadWeekItemCount(
  scheduleWeekId: string,
  dayOfWeek: number,
): Promise<number> {
  const rows = await listAll<ScheduleWeekItemRow>(
    client.models.ScheduleWeekItem.list,
    {
      filter: {
        scheduleWeekId: { eq: scheduleWeekId },
        dayOfWeek: { eq: dayOfWeek },
      },
    },
  );

  return rows.length;
}

function groupKeyOfWeek(week: ScheduleWeekRow) {
  return [
    String(week.classroomId ?? ""),
    String(week.ageTargetId ?? ""),
    String(week.weekStartDate ?? ""),
    String(week.weekEndDate ?? ""),
  ].join("::");
}

function compareWeeks(
  a: ScheduleWeekRow & { _itemCount: number },
  b: ScheduleWeekRow & { _itemCount: number },
) {
  // 1. その日の item 件数が多い週を優先
  if (b._itemCount !== a._itemCount) {
    return b._itemCount - a._itemCount;
  }

  // 2. sourceScheduleMonthId がある方を優先
  const aHasMonth = a.sourceScheduleMonthId ? 1 : 0;
  const bHasMonth = b.sourceScheduleMonthId ? 1 : 0;
  if (bHasMonth !== aHasMonth) {
    return bHasMonth - aHasMonth;
  }

  // 3. sourceClassWeekPlanId がある方を優先
  const aHasPlan = a.sourceClassWeekPlanId ? 1 : 0;
  const bHasPlan = b.sourceClassWeekPlanId ? 1 : 0;
  if (bHasPlan !== aHasPlan) {
    return bHasPlan - aHasPlan;
  }

  // 4. issueVersion が大きい方を優先
  const aIssueVersion = Number(a.issueVersion ?? 0);
  const bIssueVersion = Number(b.issueVersion ?? 0);
  if (bIssueVersion !== aIssueVersion) {
    return bIssueVersion - aIssueVersion;
  }

  // 5. issuedAt が新しい方を優先
  const aIssuedAt = String(a.issuedAt ?? "");
  const bIssuedAt = String(b.issuedAt ?? "");
  return bIssuedAt.localeCompare(aIssuedAt);
}

export const handler = async () => {
  const targetDate = tomorrowJstDateString();
  const dayOfWeek = toDayOfWeek(targetDate);

  const allWeeks = await listAll<ScheduleWeekRow>(
    client.models.ScheduleWeek.list,
    {
      filter: {
        status: { eq: "ACTIVE" },
      },
    },
  );

  const candidateWeeks = allWeeks.filter((week) =>
    overlapsTargetDate(week, targetDate),
  );

  const enrichedWeeks = await Promise.all(
    candidateWeeks.map(async (week) => ({
      ...week,
      _itemCount: await loadWeekItemCount(week.id, dayOfWeek),
    })),
  );

  const grouped = new Map<
    string,
    Array<ScheduleWeekRow & { _itemCount: number }>
  >();

  for (const week of enrichedWeeks) {
    const key = groupKeyOfWeek(week);
    const current = grouped.get(key) ?? [];
    current.push(week);
    grouped.set(key, current);
  }

  const selectedWeeks = [...grouped.values()]
    .map((rows) => [...rows].sort(compareWeeks)[0])
    .filter((week) => week._itemCount > 0);

  const skippedGroups = [...grouped.values()]
    .map((rows) => [...rows].sort(compareWeeks)[0])
    .filter((week) => week._itemCount <= 0)
    .map((week) => ({
      scheduleWeekId: week.id,
      classroomId: week.classroomId,
      ageTargetId: week.ageTargetId,
      weekStartDate: week.weekStartDate,
      weekEndDate: week.weekEndDate,
      reason: "NO_WEEK_ITEMS",
    }));

  const results = [];

  for (const week of selectedWeeks) {
    const result = await issueDayFromWeekCore(client, {
      scheduleWeekId: week.id,
      targetDate,
      issueType: "AUTO",
    });

    results.push({
      classroomId: week.classroomId,
      ageTargetId: week.ageTargetId,
      weekStartDate: week.weekStartDate,
      weekEndDate: week.weekEndDate,
      scheduleWeekId: week.id,
      selectedItemCount: week._itemCount,
      result,
    });
  }

  return {
    targetDate,
    dayOfWeek,
    scannedWeekCount: allWeeks.length,
    candidateWeekCount: candidateWeeks.length,
    selectedWeekCount: selectedWeeks.length,
    skippedGroupCount: skippedGroups.length,
    skippedGroups,
    results,
  };
};
