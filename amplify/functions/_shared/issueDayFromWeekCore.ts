import type { Schema } from "../../data/resource";

export type IssueDayArgs = {
  scheduleWeekId: string;
  targetDate: string; // YYYY-MM-DD
  issueType?: "AUTO" | "MANUAL" | "MANUAL_REISSUE";
};

type ModelError = {
  message?: string | null;
};

type ListOptions = Record<string, unknown>;
type MutationInput = Record<string, unknown>;

type ListResponse<TRow> = {
  data?: TRow[] | null;
  nextToken?: string | null;
  errors?: ModelError[] | null;
};

type MutationResponse<TRow> = {
  data?: TRow | null;
  errors?: ModelError[] | null;
};

type ListableModel<TRow> = {
  list(options?: ListOptions): Promise<ListResponse<TRow>>;
};

type CreatableModel<TRow> = {
  create(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type UpdatableModel<TRow> = {
  update(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type ScheduleWeekRow = Schema["ScheduleWeek"]["type"];
type ScheduleWeekItemRow = Schema["ScheduleWeekItem"]["type"] & {
  eventLabel?: string | null;
};
type ScheduleDayRow = Schema["ScheduleDay"]["type"];
type ScheduleDayItemRow = Schema["ScheduleDayItem"]["type"] & {
  eventLabel?: string | null;
};
type PracticeCodeRow = Schema["PracticeCode"]["type"];
type AbilityPracticeLinkRow = Schema["AbilityPracticeLink"]["type"];
type AbilityCodeRow = Schema["AbilityCode"]["type"];
type AbilityObservationHintRow = Schema["AbilityObservationHint"]["type"];

type IssueDayClient = {
  models: {
    ScheduleWeek: ListableModel<ScheduleWeekRow>;
    ScheduleWeekItem: ListableModel<ScheduleWeekItemRow>;
    ScheduleDay: ListableModel<ScheduleDayRow> &
      CreatableModel<ScheduleDayRow> &
      UpdatableModel<ScheduleDayRow>;
    ScheduleDayItem: ListableModel<ScheduleDayItemRow> &
      CreatableModel<ScheduleDayItemRow>;
    PracticeCode: ListableModel<PracticeCodeRow>;
    AbilityPracticeLink: ListableModel<AbilityPracticeLinkRow>;
    AbilityCode: ListableModel<AbilityCodeRow>;
    AbilityObservationHint: ListableModel<AbilityObservationHintRow>;
  };
};

function toDayOfWeek(targetDate: string): number {
  const [y, m, d] = targetDate.split("-").map(Number);

  if (!y || !m || !d) {
    throw new Error(`Invalid targetDate: ${targetDate}`);
  }

  const localDate = new Date(y, m - 1, d);
  return localDate.getDay();
}

function formatErrors(
  errors?: ModelError[] | null,
  fallback = "Unknown error",
) {
  const messages = (errors ?? [])
    .map((e) => String(e.message ?? "").trim())
    .filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : fallback;
}

function isNonEmptyString<T extends string>(
  value: T | null | undefined,
): value is T {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueNonEmptyStrings(
  values: Array<string | null | undefined>,
): string[] {
  return [
    ...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean)),
  ];
}

function stableHash(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }

  return hash;
}

function pickStableRandom(
  candidates: string[],
  seedParts: Array<string | number | null | undefined>,
): string | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const seed = seedParts.map((part) => String(part ?? "")).join("::");
  const index = stableHash(seed) % candidates.length;
  return candidates[index] ?? null;
}

function sortHintRows(rows: AbilityObservationHintRow[]) {
  return [...rows].sort((a, b) => {
    const aKey = [a.episode1 ?? "", a.episode2 ?? "", a.episode3 ?? ""].join(
      "||",
    );
    const bKey = [b.episode1 ?? "", b.episode2 ?? "", b.episode3 ?? ""].join(
      "||",
    );
    return aKey.localeCompare(bKey, "ja");
  });
}

function buildRandomizedEpisodes(params: {
  hintRows: AbilityObservationHintRow[];
  practiceCode: string;
  abilityCode: string;
  targetDate: string;
  sourceWeekItemId?: string | null;
  sortOrder?: number | null;
}) {
  const sortedRows = sortHintRows(params.hintRows);
  const episode1Candidates = uniqueNonEmptyStrings(
    sortedRows.map((row) => row.episode1),
  );
  const episode2Candidates = uniqueNonEmptyStrings(
    sortedRows.map((row) => row.episode2),
  );
  const episode3Candidates = uniqueNonEmptyStrings(
    sortedRows.map((row) => row.episode3),
  );

  return [
    pickStableRandom(episode1Candidates, [
      params.targetDate,
      params.sourceWeekItemId,
      params.sortOrder,
      params.practiceCode,
      params.abilityCode,
      "episode1",
    ]),
    pickStableRandom(episode2Candidates, [
      params.targetDate,
      params.sourceWeekItemId,
      params.sortOrder,
      params.practiceCode,
      params.abilityCode,
      "episode2",
    ]),
    pickStableRandom(episode3Candidates, [
      params.targetDate,
      params.sourceWeekItemId,
      params.sortOrder,
      params.practiceCode,
      params.abilityCode,
      "episode3",
    ]),
  ].filter(isNonEmptyString);
}

async function listAll<TRow>(
  listFn: (args?: ListOptions) => Promise<ListResponse<TRow>>,
  args: ListOptions,
): Promise<TRow[]> {
  const rows: TRow[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res = await listFn({
      ...args,
      nextToken,
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      rows.push(...res.data);
    }

    nextToken = res.nextToken ?? null;
  } while (nextToken);

  return rows;
}

async function loadPracticeTitleSnapshot(
  client: IssueDayClient,
  practiceCode?: string | null,
): Promise<string | null> {
  if (!practiceCode) return null;

  const res = await client.models.PracticeCode.list({
    filter: {
      practice_code: { eq: practiceCode },
    },
  });

  return res.data?.[0]?.name ?? null;
}

async function buildObservationSummaryJson(
  client: IssueDayClient,
  params: {
    practiceCode?: string | null;
    targetDate: string;
    sourceWeekItemId?: string | null;
    sortOrder?: number | null;
  },
): Promise<string | null> {
  const practiceCode = params.practiceCode;
  if (!practiceCode) return null;

  const linkRows = await listAll(client.models.AbilityPracticeLink.list, {
    filter: {
      practiceCode: { eq: practiceCode },
    },
  });

  if (linkRows.length === 0) return null;

  const abilityCodes = [
    ...new Set(linkRows.map((x) => x.abilityCode).filter(isNonEmptyString)),
  ];

  const abilities = await Promise.all(
    abilityCodes.map(async (abilityCode) => {
      const codeRes = await client.models.AbilityCode.list({
        filter: {
          code: { eq: abilityCode },
        },
      });

      const hintRows = await listAll(
        client.models.AbilityObservationHint.list,
        {
          filter: {
            abilityCode: { eq: abilityCode },
          },
        },
      );

      const activeHintRows = hintRows.filter((hint) => hint.isActive !== false);
      const hint = sortHintRows(activeHintRows)[0];

      const score = linkRows
        .filter((x) => x.abilityCode === abilityCode)
        .reduce((max, x) => Math.max(max, x.score ?? 0), 0);

      return {
        abilityCode,
        abilityName:
          codeRes.data?.[0]?.name ?? hint?.abilityName ?? abilityCode,
        startingAge: hint?.startingAge ?? 0,
        score,
        episodes: buildRandomizedEpisodes({
          hintRows: activeHintRows,
          practiceCode,
          abilityCode,
          targetDate: params.targetDate,
          sourceWeekItemId: params.sourceWeekItemId,
          sortOrder: params.sortOrder,
        }),
      };
    }),
  );

  return JSON.stringify({
    practiceCode,
    abilities,
  });
}

function byIssueVersionDesc(a: ScheduleDayRow, b: ScheduleDayRow) {
  return (b.issueVersion ?? 0) - (a.issueVersion ?? 0);
}

async function validateReissueAllowed(
  client: IssueDayClient,
  scheduleDayId: string,
) {
  const dayItems = await listAll(client.models.ScheduleDayItem.list, {
    filter: {
      scheduleDayId: { eq: scheduleDayId },
    },
  });

  const nonPlannedItems = dayItems.filter((item) => {
    const status = String(item.status ?? "");
    return status !== "" && status !== "PLANNED";
  });

  return {
    allowed: nonPlannedItems.length === 0,
    itemCount: dayItems.length,
    nonPlannedCount: nonPlannedItems.length,
    nonPlannedStatuses: [
      ...new Set(nonPlannedItems.map((x) => x.status).filter(isNonEmptyString)),
    ],
  };
}

export async function issueDayFromWeekCore(
  client: IssueDayClient,
  args: IssueDayArgs,
) {
  const issueType = args.issueType ?? "MANUAL";

  const weeks = await listAll(client.models.ScheduleWeek.list, {
    filter: {
      id: { eq: args.scheduleWeekId },
    },
  });

  const week = weeks[0];
  if (!week) {
    throw new Error(`ScheduleWeek not found: ${args.scheduleWeekId}`);
  }

  const existingDays = await listAll(client.models.ScheduleDay.list, {
    filter: {
      sourceWeekId: { eq: week.id },
      targetDate: { eq: args.targetDate },
    },
  });

  const latestExisting = [...existingDays].sort(byIssueVersionDesc)[0];

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

    const reissueCheck = await validateReissueAllowed(
      client,
      latestExisting.id,
    );

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
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  if (sortedWeekItems.length === 0) {
    return {
      scheduleWeekId: week.id,
      previousScheduleDayId,
      targetDate: args.targetDate,
      createdDay: false,
      createdItemCount: 0,
      issueVersion: latestExisting?.issueVersion ?? 0,
      status: "NO_WEEK_ITEMS",
      message:
        "対象曜日の ScheduleWeekItem が存在しないため、空の日案は発行しませんでした。",
    };
  }

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
      formatErrors(dayCreateRes.errors, "ScheduleDay create failed"),
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

    const observationSummaryJson = await buildObservationSummaryJson(client, {
      practiceCode: item.practiceCode,
      targetDate: args.targetDate,
      sourceWeekItemId: item.id,
      sortOrder: item.sortOrder,
    });

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
        formatErrors(
          dayItemCreateRes.errors,
          `ScheduleDayItem create failed: ${item.title}`,
        ),
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
      formatErrors(dayUpdateRes.errors, "ScheduleDay total update failed"),
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
