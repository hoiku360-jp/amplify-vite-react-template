import type { Schema } from "../../data/resource";

type Client = ReturnType<typeof import("aws-amplify/data").generateClient<Schema>>;

type IssueDayArgs = {
  scheduleWeekId: string;
  targetDate: string; // YYYY-MM-DD
  issueType?: "AUTO" | "MANUAL" | "MANUAL_REISSUE";
};

function toDayOfWeek(targetDate: string): number {
  const [y, m, d] = targetDate.split("-").map(Number);

  if (!y || !m || !d) {
    throw new Error(`Invalid targetDate: ${targetDate}`);
  }

  // Date-only として扱う。UTC/JST変換を挟まない。
  const localDate = new Date(y, m - 1, d);
  return localDate.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
}

async function listAll(listFn: any, args: Record<string, unknown>) {
  const rows: any[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res: any = await listFn({
      ...args,
      nextToken,
    });

    if (Array.isArray(res?.data) && res.data.length > 0) {
      rows.push(...res.data);
    }

    nextToken = res?.nextToken;
  } while (nextToken);

  return rows;
}

async function loadPracticeTitleSnapshot(client: any, practiceCode?: string | null) {
  if (!practiceCode) return null;

  const res = await client.models.PracticeCode.list({
    filter: {
      practice_code: { eq: practiceCode },
    },
  });

  return res.data?.[0]?.name ?? null;
}

async function buildObservationSummaryJson(client: any, practiceCode?: string | null) {
  if (!practiceCode) return null;

  const linkRows = await listAll(client.models.AbilityPracticeLink.list, {
    filter: {
      practiceCode: { eq: practiceCode },
    },
  });

  if (linkRows.length === 0) return null;

  const abilityCodes = [
    ...new Set(linkRows.map((x: any) => x?.abilityCode).filter(Boolean)),
  ];

  const abilities = await Promise.all(
    abilityCodes.map(async (abilityCode) => {
      const codeRes = await client.models.AbilityCode.list({
        filter: {
          code: { eq: abilityCode },
        },
      });

      const hintRes = await client.models.AbilityObservationHint.list({
        filter: {
          abilityCode: { eq: abilityCode },
        },
      });

      const code = codeRes.data?.[0];
      const hint = hintRes.data?.[0];

      const score = linkRows
        .filter((x: any) => x?.abilityCode === abilityCode)
        .reduce((max: number, x: any) => Math.max(max, x?.score ?? 0), 0);

      return {
        abilityCode,
        abilityName: code?.name ?? hint?.abilityName ?? abilityCode,
        startingAge: hint?.startingAge ?? 0,
        score,
        episodes: [hint?.episode1, hint?.episode2, hint?.episode3].filter(Boolean),
      };
    })
  );

  return JSON.stringify({
    practiceCode,
    abilities,
  });
}

function byIssueVersionDesc(a: any, b: any) {
  return (b?.issueVersion ?? 0) - (a?.issueVersion ?? 0);
}

async function validateReissueAllowed(client: any, scheduleDayId: string) {
  const dayItems = await listAll(client.models.ScheduleDayItem.list, {
    filter: {
      scheduleDayId: { eq: scheduleDayId },
    },
  });

  const nonPlannedItems = dayItems.filter((item: any) => {
    const status = String(item?.status ?? "");
    return status !== "" && status !== "PLANNED";
  });

  return {
    allowed: nonPlannedItems.length === 0,
    itemCount: dayItems.length,
    nonPlannedCount: nonPlannedItems.length,
    nonPlannedStatuses: [...new Set(nonPlannedItems.map((x: any) => x?.status).filter(Boolean))],
  };
}

export async function issueDayFromWeekCore(client: any, args: IssueDayArgs) {
  const issueType = args.issueType ?? "MANUAL";

  const weekRes = await client.models.ScheduleWeek.list({
    filter: {
      id: { eq: args.scheduleWeekId },
    },
  });

  const week = weekRes.data?.[0];
  if (!week) {
    throw new Error(`ScheduleWeek not found: ${args.scheduleWeekId}`);
  }

  const existingDaysRes = await client.models.ScheduleDay.list({
    filter: {
      sourceWeekId: { eq: week.id },
      targetDate: { eq: args.targetDate },
    },
  });

  const existingDays = [...(existingDaysRes.data ?? [])].sort(byIssueVersionDesc);
  const latestExisting = existingDays[0];

  let nextIssueVersion = 1;
  let previousScheduleDayId: string | undefined = undefined;

  if (latestExisting) {
    previousScheduleDayId = latestExisting.id;

    if (issueType !== "MANUAL_REISSUE") {
      return {
        scheduleWeekId: week.id,
        scheduleDayId: latestExisting.id,
        targetDate: args.targetDate,
        createdDay: false,
        createdItemCount: 0,
        issueVersion: latestExisting.issueVersion ?? 1,
        status: "ALREADY_ISSUED",
        message: "同日の日案は既に発行済みです。",
      };
    }

    const reissueCheck = await validateReissueAllowed(client, latestExisting.id);

    if (!reissueCheck.allowed) {
      return {
        scheduleWeekId: week.id,
        scheduleDayId: latestExisting.id,
        targetDate: args.targetDate,
        createdDay: false,
        createdItemCount: 0,
        issueVersion: latestExisting.issueVersion ?? 1,
        status: "REISSUE_BLOCKED",
        message:
          "既存の日案にPLANNED以外の状態が含まれるため、再発行できません。",
        reissueCheck,
      };
    }

    nextIssueVersion = (latestExisting.issueVersion ?? 1) + 1;
  }

  const dayOfWeek = toDayOfWeek(args.targetDate);

  const weekItems = await listAll(client.models.ScheduleWeekItem.list, {
    filter: {
      scheduleWeekId: { eq: week.id },
      dayOfWeek: { eq: dayOfWeek },
    },
  });

  const sortedWeekItems = [...weekItems].sort(
    (a: any, b: any) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0)
  );

  const dayCreateRes = await client.models.ScheduleDay.create({
    tenantId: week.tenantId,
    owner: week.owner,
    classroomId: week.classroomId,
    ageTargetId: week.ageTargetId,
    sourceWeekId: week.id,
    sourceClassWeekPlanId: week.sourceClassWeekPlanId ?? undefined,
    targetDate: args.targetDate,
    status: "ISSUED",
    issueType,
    issueVersion: nextIssueVersion,
    issuedAt: new Date().toISOString(),
    totalHealth: 0,
    totalHumanRelations: 0,
    totalEnvironment: 0,
    totalLanguage: 0,
    totalExpression: 0,
  });

  const day = dayCreateRes.data;
  if (!day) {
    throw new Error(
      dayCreateRes.errors?.map((e: any) => e.message).join(", ") ||
        "ScheduleDay create failed"
    );
  }

  let totalHealth = 0;
  let totalHumanRelations = 0;
  let totalEnvironment = 0;
  let totalLanguage = 0;
  let totalExpression = 0;

  for (const item of sortedWeekItems) {
    const practiceTitleSnapshot =
      item.practiceTitleSnapshot ??
      (await loadPracticeTitleSnapshot(client, item.practiceCode));

    const observationSummaryJson = await buildObservationSummaryJson(
      client,
      item.practiceCode
    );

    const dayItemCreateRes = await client.models.ScheduleDayItem.create({
      tenantId: week.tenantId,
      owner: week.owner,
      scheduleDayId: day.id,
      sourceWeekItemId: item.id,
      sourceType: item.sourceType,
      status: "PLANNED",
      title: item.title,
      description: item.description ?? item.eventLabel ?? undefined,
      startTime: item.startTime,
      endTime: item.endTime,
      sortOrder: item.sortOrder,
      practiceCode: item.practiceCode ?? undefined,
      practiceTitleSnapshot: practiceTitleSnapshot ?? undefined,
      observationSummaryJson: observationSummaryJson ?? undefined,
      scoreHealth: item.scoreHealth ?? 0,
      scoreHumanRelations: item.scoreHumanRelations ?? 0,
      scoreEnvironment: item.scoreEnvironment ?? 0,
      scoreLanguage: item.scoreLanguage ?? 0,
      scoreExpression: item.scoreExpression ?? 0,
    });

    if (!dayItemCreateRes.data) {
      throw new Error(
        dayItemCreateRes.errors?.map((e: any) => e.message).join(", ") ||
          `ScheduleDayItem create failed: ${item.title}`
      );
    }

    totalHealth += item.scoreHealth ?? 0;
    totalHumanRelations += item.scoreHumanRelations ?? 0;
    totalEnvironment += item.scoreEnvironment ?? 0;
    totalLanguage += item.scoreLanguage ?? 0;
    totalExpression += item.scoreExpression ?? 0;
  }

  const dayUpdateRes = await client.models.ScheduleDay.update({
    id: day.id,
    totalHealth,
    totalHumanRelations,
    totalEnvironment,
    totalLanguage,
    totalExpression,
  });

  if (!dayUpdateRes.data) {
    throw new Error(
      dayUpdateRes.errors?.map((e: any) => e.message).join(", ") ||
        "ScheduleDay total update failed"
    );
  }

  return {
    scheduleWeekId: week.id,
    scheduleDayId: day.id,
    previousScheduleDayId,
    targetDate: args.targetDate,
    createdDay: true,
    createdItemCount: sortedWeekItems.length,
    issueVersion: nextIssueVersion,
    status: issueType === "MANUAL_REISSUE" ? "REISSUED" : "ISSUED",
    message:
      issueType === "MANUAL_REISSUE"
        ? "日案を再発行しました。"
        : "日案を発行しました。",
  };
}