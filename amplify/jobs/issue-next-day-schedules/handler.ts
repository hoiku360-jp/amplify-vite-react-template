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
type ModelError = {
  message?: string | null;
};

type ListResponse<TRow> = {
  data?: TRow[] | null;
  nextToken?: string | null;
  errors?: ModelError[] | null;
};

type MutationResponse<TRow> = {
  data?: TRow | null;
  errors?: ModelError[] | null;
};

type ScheduleWeekRow = Schema["ScheduleWeek"]["type"];
type ScheduleWeekItemRow = Schema["ScheduleWeekItem"]["type"];
type ClassroomRow = Schema["Classroom"]["type"];
type AttendanceSheetRow = Schema["AttendanceSheet"]["type"];

type DemoChild = {
  childKey: string;
  childName: string;
  sortOrder: number;
};

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

    if (res.errors?.length) {
      throw new Error(formatModelErrors(res.errors, "list failed"));
    }

    if (Array.isArray(res.data) && res.data.length > 0) {
      rows.push(...res.data);
    }

    nextToken = res.nextToken ?? null;
  } while (nextToken);

  return rows;
}

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function formatModelErrors(
  errors?: ModelError[] | null,
  fallback = "Unknown error",
) {
  const messages = (errors ?? [])
    .map((e) => String(e.message ?? "").trim())
    .filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : fallback;
}

function assertMutationData<TRow>(
  res: MutationResponse<TRow>,
  fallback: string,
): TRow {
  if (res.errors?.length) {
    throw new Error(formatModelErrors(res.errors, fallback));
  }

  if (!res.data) {
    throw new Error(fallback);
  }

  return res.data;
}

function issueTargetJstDateString() {
  const now = new Date();
  const jstNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );

  const todayDayOfWeek = jstNow.getDay(); // 0=日, 1=月, ... 5=金, 6=土

  if (todayDayOfWeek === 0 || todayDayOfWeek === 6) {
    return null;
  }

  // 月〜木は翌日、金曜は翌週月曜
  const addDays = todayDayOfWeek === 5 ? 3 : 1;
  jstNow.setDate(jstNow.getDate() + addDays);

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
  if (b._itemCount !== a._itemCount) {
    return b._itemCount - a._itemCount;
  }

  const aHasMonth = a.sourceScheduleMonthId ? 1 : 0;
  const bHasMonth = b.sourceScheduleMonthId ? 1 : 0;
  if (bHasMonth !== aHasMonth) {
    return bHasMonth - aHasMonth;
  }

  const aHasPlan = a.sourceClassWeekPlanId ? 1 : 0;
  const bHasPlan = b.sourceClassWeekPlanId ? 1 : 0;
  if (bHasPlan !== aHasPlan) {
    return bHasPlan - aHasPlan;
  }

  const aIssueVersion = Number(a.issueVersion ?? 0);
  const bIssueVersion = Number(b.issueVersion ?? 0);
  if (bIssueVersion !== aIssueVersion) {
    return bIssueVersion - aIssueVersion;
  }

  const aIssuedAt = String(a.issuedAt ?? "");
  const bIssuedAt = String(b.issuedAt ?? "");
  return bIssuedAt.localeCompare(aIssuedAt);
}

const DEFAULT_CHILDREN: DemoChild[] = [
  { childKey: "sakura", childName: "さくら", sortOrder: 1 },
  { childKey: "tarou", childName: "たろう", sortOrder: 2 },
  { childKey: "mio", childName: "みお", sortOrder: 3 },
  { childKey: "yuuto", childName: "ゆうと", sortOrder: 4 },
  { childKey: "rin", childName: "りん", sortOrder: 5 },
];

const ASAGAO_CHILDREN: DemoChild[] = [
  { childKey: "aoi", childName: "あおい", sortOrder: 1 },
  { childKey: "haru", childName: "はる", sortOrder: 2 },
  { childKey: "koto", childName: "こと", sortOrder: 3 },
  { childKey: "souta", childName: "そうた", sortOrder: 4 },
  { childKey: "mei", childName: "めい", sortOrder: 5 },
];

const HIMAWARI_CHILDREN: DemoChild[] = [
  { childKey: "yui", childName: "ゆい", sortOrder: 1 },
  { childKey: "ren", childName: "れん", sortOrder: 2 },
  { childKey: "nana", childName: "なな", sortOrder: 3 },
  { childKey: "kai", childName: "かい", sortOrder: 4 },
  { childKey: "mana", childName: "まな", sortOrder: 5 },
];

function classroomNameOf(row?: ClassroomRow | null) {
  const display = row as
    | (ClassroomRow & {
        name?: string | null;
        title?: string | null;
        className?: string | null;
      })
    | null
    | undefined;

  return s(display?.name || display?.title || display?.className);
}

function demoChildrenForClassroomName(classroomName: string): DemoChild[] {
  if (classroomName.includes("あさがお")) return ASAGAO_CHILDREN;
  if (classroomName.includes("ひまわり")) return HIMAWARI_CHILDREN;

  // さくら組・すみれ組は、これまでのデモと同じ5名
  return DEFAULT_CHILDREN;
}

async function loadClassroomMap(): Promise<Map<string, ClassroomRow>> {
  const classrooms = await listAll<ClassroomRow>(client.models.Classroom.list, {
    limit: 1000,
  });

  return new Map(classrooms.map((row) => [row.id, row]));
}

function latestAttendanceSheetSort(
  a: AttendanceSheetRow,
  b: AttendanceSheetRow,
) {
  const versionDiff = Number(b.issueVersion ?? 0) - Number(a.issueVersion ?? 0);
  if (versionDiff !== 0) return versionDiff;

  return s(b.issuedAt).localeCompare(s(a.issuedAt));
}

async function ensureAttendanceSheetForWeek(params: {
  week: ScheduleWeekRow;
  targetDate: string;
  sourceScheduleDayId?: string;
  classroomMap: Map<string, ClassroomRow>;
}) {
  const { week, targetDate, sourceScheduleDayId, classroomMap } = params;

  const tenantId = s(week.tenantId);
  const owner = s(week.owner);
  const classroomId = s(week.classroomId);

  if (!tenantId || !owner || !classroomId) {
    return {
      createdSheet: false,
      attendanceSheetId: null,
      createdRecordCount: 0,
      skippedReason: "MISSING_REQUIRED_KEYS",
    };
  }

  const existingSheets = await listAll<AttendanceSheetRow>(
    client.models.AttendanceSheet.list,
    {
      filter: {
        tenantId: { eq: tenantId },
        owner: { eq: owner },
        classroomId: { eq: classroomId },
        targetDate: { eq: targetDate },
      },
      limit: 100,
    },
  );

  const latestExisting = existingSheets
    .filter((row) => s(row.status).toUpperCase() !== "ARCHIVED")
    .sort(latestAttendanceSheetSort)[0];

  if (latestExisting) {
    return {
      createdSheet: false,
      attendanceSheetId: latestExisting.id,
      createdRecordCount: 0,
      skippedReason: "ALREADY_EXISTS",
    };
  }

  const now = new Date().toISOString();

  const sheet = assertMutationData(
    await client.models.AttendanceSheet.create({
      tenantId,
      owner,

      classroomId,
      ageTargetId: s(week.ageTargetId) || undefined,

      targetDate,

      status: "ISSUED",
      issueType: "AUTO",
      issueVersion: 1,

      issuedAt: now,
      sourceScheduleDayId: sourceScheduleDayId || undefined,
      memo: "issue-next-day-schedules により日案と同時に自動発行しました。",
    }),
    "AttendanceSheet の作成に失敗しました。",
  );

  const classroom = classroomMap.get(classroomId);
  const children = demoChildrenForClassroomName(classroomNameOf(classroom));

  let createdRecordCount = 0;

  for (const child of children) {
    assertMutationData(
      await client.models.AttendanceRecord.create({
        tenantId,
        owner,

        attendanceSheetId: sheet.id,

        classroomId,
        ageTargetId: s(week.ageTargetId) || undefined,

        targetDate,

        childKey: child.childKey,
        childName: child.childName,
        sortOrder: child.sortOrder,

        status: "ISSUED",
      }),
      `AttendanceRecord の作成に失敗しました。childName=${child.childName}`,
    );

    createdRecordCount += 1;
  }

  return {
    createdSheet: true,
    attendanceSheetId: sheet.id,
    createdRecordCount,
    skippedReason: null,
  };
}

export const handler = async () => {
  const targetDate = issueTargetJstDateString();

  if (!targetDate) {
    return {
      targetDate: null,
      dayOfWeek: null,
      scannedWeekCount: 0,
      candidateWeekCount: 0,
      selectedWeekCount: 0,
      skippedGroupCount: 0,
      skippedGroups: [],
      results: [],
      message: "土日のため、日案・登降園シートの自動発行をスキップしました。",
    };
  }

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

  const classroomMap = await loadClassroomMap();

  const results = [];

  for (const week of selectedWeeks) {
    const dayResult = await issueDayFromWeekCore(client, {
      scheduleWeekId: week.id,
      targetDate,
      issueType: "AUTO",
    });

    const sourceScheduleDayId = s(
      (dayResult as { scheduleDayId?: string | null } | null)?.scheduleDayId,
    );

    const attendanceResult = await ensureAttendanceSheetForWeek({
      week,
      targetDate,
      sourceScheduleDayId,
      classroomMap,
    });

    results.push({
      classroomId: week.classroomId,
      ageTargetId: week.ageTargetId,
      weekStartDate: week.weekStartDate,
      weekEndDate: week.weekEndDate,
      scheduleWeekId: week.id,
      selectedItemCount: week._itemCount,
      dayResult,
      attendanceResult,
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
