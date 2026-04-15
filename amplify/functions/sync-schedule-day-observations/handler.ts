import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/sync-schedule-day-observations";
import type { Schema } from "../../data/resource";

type SyncArgs = {
  scheduleDayId?: string;
};

type AttendancePayload = {
  kind: "morningAttendance";
  childName: string;
  checked: boolean;
  checkedAt: string | null;
  note: string;
  tags: string[];
};

type PlannedTranscriptPayload = {
  kind: "plannedTranscript";
  practiceCode: string | null;
  childNames: string[];
  transcriptText: string;
  tags: string[];
};

type StructuredObservationPayload = {
  kind: "structuredObservation";
  sourceTranscriptRecordId: string;
  practiceCode: string | null;
  childName: string;
  observedText: string;
  abilityCode: string;
  abilityName: string;
  matchedEpisode?: string;
  confidence?: number;
  tags: string[];
};

type HandlerEvent = {
  arguments?: SyncArgs;
  input?: SyncArgs;
};

type ScheduleDayRow = Schema["ScheduleDay"]["type"];
type ScheduleDayItemRow = Schema["ScheduleDayItem"]["type"];
type ScheduleRecordRow = Schema["ScheduleRecord"]["type"];
type ObservationRecordRow = Schema["ObservationRecord"]["type"];
type ObservationAbilityLinkRow = Schema["ObservationAbilityLink"]["type"];
type AbilityCodeRow = Schema["AbilityCode"]["type"];

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

type ListOptions = Record<string, unknown>;
type CreateInput = Record<string, unknown>;

type ModelListApi<TRow> = {
  list(options?: ListOptions): Promise<ListResponse<TRow>>;
};

type ModelDeleteApi<TRow extends { id?: string | null }> =
  ModelListApi<TRow> & {
    delete(input: { id: string }): Promise<MutationResponse<TRow>>;
  };

type ModelCreateDeleteApi<TRow extends { id?: string | null }> =
  ModelDeleteApi<TRow> & {
    create(input: CreateInput): Promise<MutationResponse<TRow>>;
  };

type SyncClient = {
  models: {
    ScheduleDay: ModelListApi<ScheduleDayRow>;
    ScheduleDayItem: ModelListApi<ScheduleDayItemRow>;
    ScheduleRecord: ModelListApi<ScheduleRecordRow>;
    ObservationRecord: ModelCreateDeleteApi<ObservationRecordRow>;
    ObservationAbilityLink: ModelCreateDeleteApi<ObservationAbilityLinkRow>;
    AbilityCode: ModelListApi<AbilityCodeRow>;
  };
};

type AbilityMeta = {
  abilityName?: string;
  domain?: string;
  category?: string;
};

const clientInitPromise = (async (): Promise<SyncClient> => {
  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env);

  Amplify.configure(resourceConfig, libraryOptions);

  return generateClient<Schema>() as unknown as SyncClient;
})();

async function getClient(): Promise<SyncClient> {
  return clientInitPromise;
}

function formatErrors(
  errors?: ModelError[] | null,
  fallback = "Unknown error",
): string {
  if (!errors || errors.length === 0) return fallback;

  const messages = errors
    .map((error) => String(error.message ?? "").trim())
    .filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : fallback;
}

async function listAll<TRow>(
  modelApi: ModelListApi<TRow>,
  options?: ListOptions,
): Promise<TRow[]> {
  const rows: TRow[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res = await modelApi.list({
      ...(options ?? {}),
      nextToken,
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      rows.push(...res.data);
    }

    nextToken = res.nextToken ?? null;
  } while (nextToken);

  return rows;
}

function safeJsonParse<T>(value?: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeParseAttendancePayload(
  value?: string | null,
): AttendancePayload | null {
  const parsed = safeJsonParse<AttendancePayload>(value);
  if (!parsed || parsed.kind !== "morningAttendance") return null;
  return parsed;
}

function safeParsePlannedTranscriptPayload(
  value?: string | null,
): PlannedTranscriptPayload | null {
  const parsed = safeJsonParse<PlannedTranscriptPayload>(value);
  if (!parsed || parsed.kind !== "plannedTranscript") return null;
  return parsed;
}

function safeParseStructuredObservationPayload(
  value?: string | null,
): StructuredObservationPayload | null {
  const parsed = safeJsonParse<StructuredObservationPayload>(value);
  if (!parsed || parsed.kind !== "structuredObservation") return null;
  return parsed;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [
    ...new Set(values.map((v) => String(v ?? "").trim()).filter(Boolean)),
  ];
}

function buildChildKey(classroomId: string, childName?: string | null) {
  const normalized = String(childName ?? "").trim();
  if (!normalized) return undefined;
  return `${classroomId}#${normalized}`;
}

function normalizeConfidencePct(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value <= 1) return Math.max(0, Math.min(100, Math.round(value * 100)));
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeAbilityCode(value?: string | number | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const noDecimal = raw.replace(/\.0+$/, "");
  const digitsOnly = noDecimal.replace(/[^\d]/g, "");

  return digitsOnly || noDecimal;
}

function domainFromAbilityPrefix(code?: string | null) {
  const normalized = normalizeAbilityCode(code);
  const prefix2 = normalized.slice(0, 2);

  switch (prefix2) {
    case "11":
      return "健康";
    case "21":
      return "人間関係";
    case "31":
      return "環境";
    case "41":
      return "言葉";
    case "51":
      return "表現";
    default:
      return undefined;
  }
}

function categoryFromAbilityPrefix(code?: string | null) {
  const normalized = normalizeAbilityCode(code);
  return normalized.slice(0, 4) || undefined;
}

function pickPracticeCode(
  item?: ScheduleDayItemRow | null,
  transcriptPayload?: PlannedTranscriptPayload | null,
  structuredPayload?: StructuredObservationPayload | null,
) {
  return (
    structuredPayload?.practiceCode ??
    transcriptPayload?.practiceCode ??
    item?.practiceCode ??
    undefined
  );
}

function pickTags(
  recordType: string | null | undefined,
  payloadTags?: string[] | null,
  practiceCode?: string | null,
  itemTitle?: string | null,
  childName?: string | null,
) {
  return uniqueStrings([
    ...(payloadTags ?? []),
    recordType ? `recordType:${recordType}` : undefined,
    practiceCode ? `practiceCode:${practiceCode}` : undefined,
    itemTitle ? `itemTitle:${itemTitle}` : undefined,
    childName ? `childName:${childName}` : undefined,
  ]);
}

function buildObservationTitle(
  item: ScheduleDayItemRow | undefined,
  recordType: string | null | undefined,
  childName?: string | null,
) {
  const itemTitle = String(item?.title ?? "").trim();
  const typeLabel = String(recordType ?? "").trim();
  const child = String(childName ?? "").trim();

  if (itemTitle && child) return `${itemTitle} / ${child}`;
  if (itemTitle && typeLabel) return `${itemTitle} / ${typeLabel}`;
  if (itemTitle) return itemTitle;
  if (child && typeLabel) return `${typeLabel} / ${child}`;
  if (child) return child;
  return typeLabel || "Observation";
}

async function deleteRows<TRow extends { id?: string | null }>(
  modelApi: ModelDeleteApi<TRow>,
  rows: TRow[],
) {
  let deletedCount = 0;

  for (const row of rows) {
    const id = row.id;
    if (!id) continue;

    const res = await modelApi.delete({ id });
    if (res.errors?.length) {
      throw new Error(formatErrors(res.errors, "delete failed"));
    }

    deletedCount += 1;
  }

  return deletedCount;
}

async function createObservationRecord(
  client: SyncClient,
  input: CreateInput,
): Promise<ObservationRecordRow> {
  const res = await client.models.ObservationRecord.create(input);
  if (!res.data) {
    throw new Error(
      formatErrors(res.errors, "ObservationRecord create failed"),
    );
  }

  return res.data;
}

async function createObservationAbilityLink(
  client: SyncClient,
  input: CreateInput,
): Promise<ObservationAbilityLinkRow> {
  const res = await client.models.ObservationAbilityLink.create(input);
  if (!res.data) {
    throw new Error(
      formatErrors(res.errors, "ObservationAbilityLink create failed"),
    );
  }

  return res.data;
}

const abilityMetaCache = new Map<string, AbilityMeta>();

async function findAbilityCodeRow(
  client: SyncClient,
  code?: string | null,
): Promise<AbilityCodeRow | null> {
  const normalized = normalizeAbilityCode(code);
  const raw = String(code ?? "").trim();

  if (!normalized && !raw) return null;

  const candidates = uniqueStrings([normalized, raw]);

  for (const candidate of candidates) {
    const res = await client.models.AbilityCode.list({
      filter: {
        code: { eq: candidate },
      },
      limit: 1,
    });

    const row = res.data?.[0] ?? null;
    if (row) return row;
  }

  return null;
}

async function findAbilityMetaResolved(
  client: SyncClient,
  abilityCode?: string | null,
): Promise<AbilityMeta> {
  const startCode = normalizeAbilityCode(abilityCode);
  if (!startCode) return {};

  const cached = abilityMetaCache.get(startCode);
  if (cached) return cached;

  let currentCode: string | undefined = startCode;
  let abilityName: string | undefined;
  let domain: string | undefined;
  let category: string | undefined;

  for (let depth = 0; depth < 10 && currentCode; depth += 1) {
    const row = await findAbilityCodeRow(client, currentCode);
    if (!row) break;

    if (!abilityName && row.name) {
      abilityName = String(row.name);
    }

    if (!domain && row.domain) {
      domain = String(row.domain);
    }

    if (!category && row.category) {
      category = String(row.category);
    }

    if (domain && category) {
      break;
    }

    const nextParent = normalizeAbilityCode(row.parent_code);
    if (!nextParent || nextParent === currentCode) {
      break;
    }

    currentCode = nextParent;
  }

  const meta: AbilityMeta = {
    abilityName,
    domain: domain || domainFromAbilityPrefix(startCode),
    category: category || categoryFromAbilityPrefix(startCode),
  };

  abilityMetaCache.set(startCode, meta);
  return meta;
}

export const handler = async (event: HandlerEvent) => {
  const client = await getClient();

  const scheduleDayId =
    event.arguments?.scheduleDayId ?? event.input?.scheduleDayId;

  if (!scheduleDayId) {
    return {
      scheduleDayId: "unknown",
      createdObservationCount: 0,
      createdAbilityLinkCount: 0,
      deletedObservationCount: 0,
      deletedAbilityLinkCount: 0,
      status: "ERROR",
      message: "scheduleDayId is required.",
    };
  }

  try {
    const dayRows = await listAll(client.models.ScheduleDay, {
      filter: {
        id: { eq: scheduleDayId },
      },
    });

    const day = dayRows[0];
    if (!day) {
      return {
        scheduleDayId,
        createdObservationCount: 0,
        createdAbilityLinkCount: 0,
        deletedObservationCount: 0,
        deletedAbilityLinkCount: 0,
        status: "ERROR",
        message: `ScheduleDay not found: ${scheduleDayId}`,
      };
    }

    const itemRows = await listAll(client.models.ScheduleDayItem, {
      filter: {
        scheduleDayId: { eq: scheduleDayId },
      },
    });

    const recordRows = await listAll(client.models.ScheduleRecord, {
      filter: {
        scheduleDayId: { eq: scheduleDayId },
      },
    });

    const itemMap = new Map<string, ScheduleDayItemRow>();
    for (const item of itemRows) {
      if (item.id) {
        itemMap.set(item.id, item);
      }
    }

    recordRows.sort((a, b) =>
      String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? "")),
    );

    const existingObservations = await listAll(
      client.models.ObservationRecord,
      {
        filter: {
          scheduleDayId: { eq: scheduleDayId },
        },
      },
    );

    let deletedAbilityLinkCount = 0;

    for (const observation of existingObservations) {
      if (!observation.id) continue;

      const linkRows = await listAll(client.models.ObservationAbilityLink, {
        filter: {
          observationRecordId: { eq: observation.id },
        },
      });

      deletedAbilityLinkCount += await deleteRows(
        client.models.ObservationAbilityLink,
        linkRows,
      );
    }

    const deletedObservationCount = await deleteRows(
      client.models.ObservationRecord,
      existingObservations,
    );

    let createdObservationCount = 0;
    let createdAbilityLinkCount = 0;

    for (const record of recordRows) {
      const item = record.scheduleDayItemId
        ? itemMap.get(record.scheduleDayItemId)
        : undefined;

      const attendancePayload = safeParseAttendancePayload(record.payloadJson);
      const transcriptPayload = safeParsePlannedTranscriptPayload(
        record.payloadJson,
      );
      const structuredPayload = safeParseStructuredObservationPayload(
        record.payloadJson,
      );

      const practiceCode = pickPracticeCode(
        item,
        transcriptPayload,
        structuredPayload,
      );

      const commonBase: CreateInput = {
        tenantId: day.tenantId,
        owner: record.owner ?? day.owner,
        classroomId: day.classroomId,
        ageTargetId: day.ageTargetId ?? undefined,
        scheduleWeekId: day.sourceWeekId ?? undefined,
        scheduleDayId: day.id,
        scheduleDayItemId: record.scheduleDayItemId ?? undefined,
        sourceScheduleRecordId: record.id,
        targetDate: day.targetDate,
        recordedAt: record.recordedAt ?? new Date().toISOString(),
        sourceKind: record.recordType,
        practiceCode: practiceCode ?? undefined,
        practiceTitleSnapshot: item?.practiceTitleSnapshot ?? undefined,
        status: "ACTIVE",
        createdBySub: record.createdBySub ?? undefined,
      };

      if (record.recordType === "CHECK" && attendancePayload) {
        const childName = attendancePayload.childName?.trim();

        const observation = await createObservationRecord(client, {
          ...commonBase,
          scopeType: "CHILD",
          childKey: buildChildKey(day.classroomId, childName),
          childName: childName || undefined,
          title: buildObservationTitle(item, record.recordType, childName),
          body: record.body ?? "",
          tags: pickTags(
            record.recordType,
            attendancePayload.tags,
            practiceCode,
            item?.title,
            childName,
          ),
        });

        if (observation.id) createdObservationCount += 1;
        continue;
      }

      if (record.recordType === "TRANSCRIPT") {
        const childNames = uniqueStrings(transcriptPayload?.childNames ?? []);

        if (childNames.length > 0) {
          for (const childName of childNames) {
            const observation = await createObservationRecord(client, {
              ...commonBase,
              scopeType: "CHILD",
              childKey: buildChildKey(day.classroomId, childName),
              childName,
              title: buildObservationTitle(item, record.recordType, childName),
              body: record.body ?? transcriptPayload?.transcriptText ?? "",
              tags: pickTags(
                record.recordType,
                transcriptPayload?.tags,
                practiceCode,
                item?.title,
                childName,
              ),
            });

            if (observation.id) createdObservationCount += 1;
          }
        } else {
          const observation = await createObservationRecord(client, {
            ...commonBase,
            scopeType: "CLASSROOM",
            title: buildObservationTitle(item, record.recordType),
            body: record.body ?? transcriptPayload?.transcriptText ?? "",
            tags: pickTags(
              record.recordType,
              transcriptPayload?.tags,
              practiceCode,
              item?.title,
            ),
          });

          if (observation.id) createdObservationCount += 1;
        }

        continue;
      }

      if (record.recordType === "STRUCTURED_OBSERVATION" && structuredPayload) {
        const childName = structuredPayload.childName?.trim();
        const observedBody =
          structuredPayload.observedText?.trim() ||
          structuredPayload.matchedEpisode?.trim() ||
          record.body ||
          "";

        const observation = await createObservationRecord(client, {
          ...commonBase,
          scopeType: "CHILD",
          childKey: buildChildKey(day.classroomId, childName),
          childName: childName || undefined,
          title: buildObservationTitle(item, record.recordType, childName),
          body: observedBody,
          tags: pickTags(
            record.recordType,
            structuredPayload.tags,
            practiceCode,
            item?.title,
            childName,
          ),
        });

        if (observation.id) {
          createdObservationCount += 1;

          const normalizedAbilityCode = normalizeAbilityCode(
            structuredPayload.abilityCode,
          );

          const abilityMeta = await findAbilityMetaResolved(
            client,
            normalizedAbilityCode,
          );

          const abilityLink = await createObservationAbilityLink(client, {
            tenantId: day.tenantId,
            owner: record.owner ?? day.owner,
            observationRecordId: observation.id,
            classroomId: day.classroomId,
            childKey: buildChildKey(day.classroomId, childName),
            childName: childName || undefined,
            targetDate: day.targetDate,
            recordedAt: record.recordedAt ?? new Date().toISOString(),
            practiceCode: practiceCode ?? undefined,
            abilityCode: normalizedAbilityCode,
            abilityName:
              structuredPayload.abilityName ||
              abilityMeta.abilityName ||
              normalizedAbilityCode,
            domain:
              abilityMeta.domain ||
              domainFromAbilityPrefix(normalizedAbilityCode),
            category:
              abilityMeta.category ||
              categoryFromAbilityPrefix(normalizedAbilityCode),
            confidencePct: normalizeConfidencePct(structuredPayload.confidence),
            evidenceText:
              structuredPayload.matchedEpisode ||
              structuredPayload.observedText ||
              record.body ||
              undefined,
            status: "ACTIVE",
          });

          if (abilityLink.id) createdAbilityLinkCount += 1;
        }

        continue;
      }

      if (record.recordType === "MEMO" || record.recordType === "APPEND_NOTE") {
        const observation = await createObservationRecord(client, {
          ...commonBase,
          scopeType: "CLASSROOM",
          title: buildObservationTitle(item, record.recordType),
          body: record.body ?? "",
          tags: pickTags(
            record.recordType,
            undefined,
            practiceCode,
            item?.title,
          ),
        });

        if (observation.id) createdObservationCount += 1;
        continue;
      }

      if (record.recordType === "CHECK" && !attendancePayload) {
        const observation = await createObservationRecord(client, {
          ...commonBase,
          scopeType: "CLASSROOM",
          title: buildObservationTitle(item, record.recordType),
          body: record.body ?? "",
          tags: pickTags(
            record.recordType,
            undefined,
            practiceCode,
            item?.title,
          ),
        });

        if (observation.id) createdObservationCount += 1;
        continue;
      }

      const observation = await createObservationRecord(client, {
        ...commonBase,
        scopeType: "CLASSROOM",
        title: buildObservationTitle(item, record.recordType),
        body: record.body ?? "",
        tags: pickTags(record.recordType, undefined, practiceCode, item?.title),
      });

      if (observation.id) createdObservationCount += 1;
    }

    return {
      scheduleDayId,
      createdObservationCount,
      createdAbilityLinkCount,
      deletedObservationCount,
      deletedAbilityLinkCount,
      status: "OK",
      message: `sync completed. createdObservationCount=${createdObservationCount}, createdAbilityLinkCount=${createdAbilityLinkCount}`,
    };
  } catch (error) {
    console.error("syncScheduleDayObservations failed:", error);

    return {
      scheduleDayId,
      createdObservationCount: 0,
      createdAbilityLinkCount: 0,
      deletedObservationCount: 0,
      deletedAbilityLinkCount: 0,
      status: "ERROR",
      message: error instanceof Error ? error.message : String(error),
    };
  }
};
