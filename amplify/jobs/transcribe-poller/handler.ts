import {
  TranscribeClient,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/transcribe-poller";

type DataClient = ReturnType<typeof generateClient<Schema>>;

type ErrorLike = {
  name?: string;
  message?: string;
  stack?: string;
};

type GraphQLErrorLike = {
  message?: string | null;
};

type NodeReadable = {
  on(event: "data", listener: (chunk: Buffer) => void): unknown;
  on(event: "end", listener: () => void): unknown;
  on(event: "error", listener: (error: Error) => void): unknown;
};

type AudioJobLike = Schema["AudioJob"]["type"] & {
  jobType?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  practiceCode?: string | null;
};

type TranscriptAlternative = {
  content?: string | null;
  confidence?: string | null;
};

type TranscriptItem = {
  type?: string | null;
  alternatives?: TranscriptAlternative[] | null;
  start_time?: string | null;
  end_time?: string | null;
};

type TranscriptJson = {
  results?: {
    transcripts?: Array<{
      transcript?: string | null;
    }> | null;
    items?: TranscriptItem[] | null;
    audio_segments?: unknown[] | null;
  } | null;
};

type TranscriptExtractionDetails = {
  transcriptSource: "transcripts" | "items" | "empty";
  transcriptsCount: number;
  itemsCount: number;
  audioSegmentsCount: number;
  primaryTranscriptChars: number;
  itemTranscriptChars: number;
};

type TranscriptExtractionResult = {
  transcriptText: string;
  details: TranscriptExtractionDetails;
};

type TranscriptReadResult = TranscriptExtractionResult & {
  source: "fetch" | "s3";
};

type ListJobsByStatusDateInput = {
  status: string;
  sortDirection?: "ASC" | "DESC";
  limit?: number;
  nextToken?: string | null;
};

type ListAudioJobsResult = {
  data?: AudioJobLike[] | null;
  errors?: GraphQLErrorLike[] | null;
  nextToken?: string | null;
};

type AudioJobModelWithStatusDate = typeof generateClient<Schema> extends (
  ...args: never[]
) => infer Client
  ? Client extends { models: { AudioJob: infer Model } }
    ? Model & {
        listJobsByStatusDate?: (
          input: ListJobsByStatusDateInput,
        ) => Promise<ListAudioJobsResult>;
      }
    : never
  : never;

function toErrorLike(error: unknown): ErrorLike {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    return {
      name: typeof obj.name === "string" ? obj.name : undefined,
      message: typeof obj.message === "string" ? obj.message : undefined,
      stack: typeof obj.stack === "string" ? obj.stack : undefined,
    };
  }

  return {
    message: String(error),
  };
}

function isNotFound(error: unknown) {
  const e = toErrorLike(error);
  const msg = String(e.message ?? "");
  return (
    e.name === "ResourceNotFoundException" || msg.includes("couldn't be found")
  );
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function truncate(text: string, max = 120_000) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…(truncated)…`;
}

function isoNow() {
  return new Date().toISOString();
}

function normalizeType(value: unknown): string {
  return safeString(value).trim().replace(/[\s-]/g, "_").toUpperCase();
}

function extractEpochMsFromJobName(
  jobName: string | undefined | null,
): number | undefined {
  if (!jobName) return undefined;

  const matched = jobName.match(/-(\d{10,})$/);
  if (!matched) return undefined;

  const parsed = Number(matched[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * legacy audioPath:
 * practice-audio/{tenantId}/{owner}/{practice_code}/{fileName}
 */
function extractPracticeInfoFromAudioPath(
  audioPath: string | undefined | null,
): { tenantId?: string; practiceCode?: string } {
  if (!audioPath) return {};

  const parts = audioPath.split("/").filter(Boolean);

  if (parts.length >= 5 && parts[0] === "practice-audio") {
    return {
      tenantId: parts[1],
      practiceCode: parts[3],
    };
  }

  return {};
}

function resolveJobType(job: AudioJobLike): string {
  const explicit = normalizeType(job.jobType);
  if (explicit) return explicit;

  const sourceEntityType = normalizeType(job.sourceEntityType);

  if (
    sourceEntityType === "PRACTICE" ||
    sourceEntityType === "PRACTICE_CODE" ||
    sourceEntityType === "PRACTICECODE"
  ) {
    return "PRACTICE";
  }

  if (
    sourceEntityType === "SCHEDULE_DAY" ||
    sourceEntityType === "SCHEDULEDAY"
  ) {
    return "SCHEDULE_DAY";
  }

  if (sourceEntityType === "DIGEST") {
    return "DIGEST";
  }

  const legacyPractice = extractPracticeInfoFromAudioPath(job.audioPath);
  if (legacyPractice.tenantId && legacyPractice.practiceCode) {
    return "PRACTICE";
  }

  return "";
}

function resolvePracticeIdentifier(job: AudioJobLike): {
  tenantId?: string;
  identifier?: string;
} {
  const legacyPractice = extractPracticeInfoFromAudioPath(job.audioPath);

  const tenantId =
    safeString(job.tenantId).trim() ||
    safeString(legacyPractice.tenantId).trim();

  const identifier =
    safeString(job.sourceEntityId).trim() ||
    safeString(job.practiceCode).trim() ||
    safeString(legacyPractice.practiceCode).trim();

  return {
    tenantId: tenantId || undefined,
    identifier: identifier || undefined,
  };
}

function joinErrorMessages(
  errors: ReadonlyArray<{ message?: string | null }> | null | undefined,
) {
  return (errors ?? [])
    .map((error) => error.message ?? "")
    .filter(Boolean)
    .join("\n");
}

function isAsciiWord(value: string): boolean {
  return /^[A-Za-z0-9]+$/.test(value);
}

function buildTranscriptFromItems(items: TranscriptItem[]): string {
  let out = "";

  for (const item of items) {
    const content = safeString(item.alternatives?.[0]?.content ?? "").trim();
    if (!content) continue;

    const type = normalizeType(item.type);

    if (type === "PUNCTUATION") {
      out += content;
      continue;
    }

    if (out && isAsciiWord(out.slice(-1)) && isAsciiWord(content[0] ?? "")) {
      out += " ";
    }

    out += content;
  }

  return out.trim();
}

function extractTranscriptTextFromJson(
  json: TranscriptJson,
): TranscriptExtractionResult {
  const transcripts = json.results?.transcripts ?? [];
  const items = json.results?.items ?? [];
  const audioSegments = json.results?.audio_segments ?? [];

  const transcriptTexts = transcripts
    .map((item) => safeString(item?.transcript ?? "").trim())
    .filter(Boolean);

  const primaryTranscript = transcriptTexts.join("\n").trim();

  if (primaryTranscript) {
    return {
      transcriptText: primaryTranscript,
      details: {
        transcriptSource: "transcripts",
        transcriptsCount: transcripts.length,
        itemsCount: items.length,
        audioSegmentsCount: audioSegments.length,
        primaryTranscriptChars: primaryTranscript.length,
        itemTranscriptChars: 0,
      },
    };
  }

  const itemTranscript = buildTranscriptFromItems(items);

  if (itemTranscript) {
    return {
      transcriptText: itemTranscript,
      details: {
        transcriptSource: "items",
        transcriptsCount: transcripts.length,
        itemsCount: items.length,
        audioSegmentsCount: audioSegments.length,
        primaryTranscriptChars: 0,
        itemTranscriptChars: itemTranscript.length,
      },
    };
  }

  return {
    transcriptText: "",
    details: {
      transcriptSource: "empty",
      transcriptsCount: transcripts.length,
      itemsCount: items.length,
      audioSegmentsCount: audioSegments.length,
      primaryTranscriptChars: 0,
      itemTranscriptChars: 0,
    },
  };
}

async function readStreamToString(body: unknown): Promise<string> {
  if (!body) return "";

  if (
    typeof body === "object" &&
    body !== null &&
    "transformToString" in body &&
    typeof (body as { transformToString?: unknown }).transformToString ===
      "function"
  ) {
    return await (
      body as { transformToString: (encoding: string) => Promise<string> }
    ).transformToString("utf-8");
  }

  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = body as NodeReadable;

    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
}

async function fetchJsonWithRetry(
  url: string,
  retries = 3,
  timeoutMs = 12_000,
): Promise<TranscriptJson> {
  let lastError: unknown = new Error("fetchJsonWithRetry failed");

  for (let i = 0; i < retries; i++) {
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(
          `fetch failed: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as TranscriptJson;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) =>
        setTimeout(resolve, 300 * (i + 1) * (i + 1)),
      );
    } finally {
      clearTimeout(timer);
    }
  }

  const e = toErrorLike(lastError);
  throw new Error(e.message ?? String(lastError));
}

function parseS3FromUri(uri: string): { bucket?: string; key?: string } {
  try {
    if (uri.startsWith("s3://")) {
      const withoutScheme = uri.slice("s3://".length);
      const parts = withoutScheme.split("/").filter(Boolean);
      return {
        bucket: parts[0],
        key: parts.slice(1).join("/"),
      };
    }

    const url = new URL(uri);
    const host = url.hostname;

    if (host.includes(".s3.") && host.endsWith(".amazonaws.com")) {
      const bucket = host.split(".s3.")[0];
      const key = url.pathname.replace(/^\/+/, "");
      return { bucket, key };
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return {
        bucket: parts[0],
        key: parts.slice(1).join("/"),
      };
    }

    return {};
  } catch {
    return {};
  }
}

async function getTranscriptText(
  region: string,
  transcriptFileUri: string,
): Promise<TranscriptReadResult> {
  try {
    const json = await fetchJsonWithRetry(transcriptFileUri, 3, 15_000);
    const extracted = extractTranscriptTextFromJson(json);

    return {
      ...extracted,
      source: "fetch",
    };
  } catch (error) {
    const e = toErrorLike(error);
    console.warn("fetch TranscriptFileUri failed; trying S3 fallback", {
      message: e.message,
    });
  }

  const { bucket, key } = parseS3FromUri(transcriptFileUri);

  if (!bucket || !key) {
    throw new Error("could not parse bucket/key from TranscriptFileUri");
  }

  const s3 = new S3Client({ region });
  const object = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  const text = await readStreamToString(object.Body);
  const json = JSON.parse(text) as TranscriptJson;
  const extracted = extractTranscriptTextFromJson(json);

  return {
    ...extracted,
    source: "s3",
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`timeout after ${ms}ms: ${label}`)),
      ms,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function findPracticeByTenantAndIdentifier(
  dataClient: DataClient,
  tenantId: string | undefined,
  identifier: string,
) {
  if (!identifier) return null;

  if (!tenantId) {
    const byId = await dataClient.models.PracticeCode.get({
      id: identifier,
    });

    if (!byId.errors?.length && byId.data) {
      return byId.data;
    }

    return null;
  }

  const result = await dataClient.models.PracticeCode.list({
    filter: {
      tenantId: {
        eq: tenantId,
      },
    },
    limit: 1000,
  });

  if (result.errors?.length) {
    throw new Error(
      `PracticeCode lookup failed: ${joinErrorMessages(result.errors)}`,
    );
  }

  const items = result.data ?? [];

  console.info("PracticeCode lookup by tenantId", {
    tenantId,
    count: items.length,
    targetIdentifier: identifier,
  });

  return (
    items.find(
      (item) =>
        item.id === identifier ||
        item.practice_code === identifier ||
        safeString(item.practice_code).trim() === identifier.trim(),
    ) ?? null
  );
}

async function markAudioJobFailed(
  dataClient: DataClient,
  args: {
    jobId: string;
    transcribeStatus?: string | null;
    errorMessage: string;
  },
) {
  await dataClient.models.AudioJob.update({
    id: args.jobId,
    status: "FAILED",
    transcribeStatus: args.transcribeStatus ?? "FAILED",
    errorMessage: args.errorMessage,
    completedAt: isoNow(),
  });
}

async function listRunningAudioJobs(
  dataClient: DataClient,
  limit: number,
): Promise<AudioJobLike[]> {
  const audioJobModel = dataClient.models
    .AudioJob as unknown as AudioJobModelWithStatusDate;

  if (typeof audioJobModel.listJobsByStatusDate === "function") {
    const collected: AudioJobLike[] = [];
    let nextToken: string | null | undefined;
    let page = 0;

    do {
      page++;

      const result = await audioJobModel.listJobsByStatusDate({
        status: "RUNNING",
        sortDirection: "DESC",
        limit: Math.min(50, limit - collected.length),
        nextToken,
      });

      if (result.errors?.length) {
        throw new Error(
          `listJobsByStatusDate errors: ${joinErrorMessages(result.errors)}`,
        );
      }

      collected.push(...((result.data ?? []) as AudioJobLike[]));
      nextToken = result.nextToken;

      if (collected.length >= limit) break;
    } while (nextToken && page < 5);

    console.info("list RUNNING jobs by status index", {
      count: collected.length,
      pages: page,
      hasNextToken: Boolean(nextToken),
    });

    return collected.slice(0, limit);
  }

  console.warn(
    "listJobsByStatusDate is not available. Falling back to paginated list scan.",
  );

  const fallback: AudioJobLike[] = [];
  let nextToken: string | null | undefined;
  let page = 0;

  do {
    page++;

    const result = await dataClient.models.AudioJob.list({
      limit: 100,
      nextToken,
    });

    if (result.errors?.length) {
      throw new Error(
        `AudioJob.list errors: ${joinErrorMessages(result.errors)}`,
      );
    }

    const data = (result.data ?? []) as AudioJobLike[];

    fallback.push(
      ...data.filter((job) => normalizeType(job.status) === "RUNNING"),
    );

    nextToken = result.nextToken;

    if (fallback.length >= limit) break;
  } while (nextToken && page < 10);

  console.info("list RUNNING jobs by fallback scan", {
    count: fallback.length,
    pages: page,
    hasNextToken: Boolean(nextToken),
  });

  return fallback.slice(0, limit);
}

export const handler = async () => {
  const region = process.env.AWS_REGION || "ap-northeast-1";
  const transcribe = new TranscribeClient({
    region,
    maxAttempts: 2,
  });

  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as never,
  );

  Amplify.configure(resourceConfig, libraryOptions);
  const dataClient = generateClient<Schema>();

  const TIMEOUT_MS = 60 * 60 * 1000;
  const NOT_FOUND_GRACE_MS = 10 * 60 * 1000;
  const MAX_PER_RUN = 10;

  const now = Date.now();

  console.info("transcribe-poller start", { region });

  let processed = 0;
  let updated = 0;
  let cleaned = 0;
  let practiceUpdated = 0;
  let failed = 0;

  try {
    const list = await listRunningAudioJobs(dataClient, 50);

    console.info("list RUNNING jobs", {
      count: list.length,
      errors: 0,
    });

    for (const job of list) {
      const jobName = safeString(job.transcribeJobName).trim();

      if (!jobName) {
        await markAudioJobFailed(dataClient, {
          jobId: job.id,
          transcribeStatus: "FAILED",
          errorMessage: "CLEANUP: RUNNING but transcribeJobName is missing",
        });

        cleaned++;
        failed++;

        console.warn("RUNNING AudioJob without transcribeJobName -> FAILED", {
          jobId: job.id,
          sourceEntityType: job.sourceEntityType,
          jobType: job.jobType,
        });
      }
    }

    const candidates = list.filter((job) =>
      safeString(job.transcribeJobName).trim(),
    );

    for (const job of candidates) {
      if (processed >= MAX_PER_RUN) break;

      processed++;

      const jobId = job.id;
      const jobName = safeString(job.transcribeJobName).trim();
      const resolvedJobType = resolveJobType(job);

      const startedMs =
        extractEpochMsFromJobName(jobName) ||
        (job.recordedAt ? Date.parse(job.recordedAt) : undefined);

      if (startedMs && now - startedMs > TIMEOUT_MS) {
        await markAudioJobFailed(dataClient, {
          jobId,
          transcribeStatus: "FAILED",
          errorMessage: `CLEANUP: Transcribe timeout (>60m). jobName=${jobName}`,
        });

        cleaned++;
        failed++;
        continue;
      }

      try {
        const response = await transcribe.send(
          new GetTranscriptionJobCommand({
            TranscriptionJobName: jobName,
          }),
        );

        const transcribeStatus = safeString(
          response.TranscriptionJob?.TranscriptionJobStatus ?? "",
        );

        const transcriptFileUri = safeString(
          response.TranscriptionJob?.Transcript?.TranscriptFileUri ?? "",
        ).trim();

        console.info("GetTranscriptionJob result", {
          jobId,
          jobName,
          transcribeStatus,
          hasTranscriptFileUri: Boolean(transcriptFileUri),
          jobType: resolvedJobType || "(empty)",
          sourceEntityType: job.sourceEntityType ?? null,
        });

        if (
          transcribeStatus === "IN_PROGRESS" ||
          transcribeStatus === "QUEUED"
        ) {
          await dataClient.models.AudioJob.update({
            id: jobId,
            transcribeStatus,
            errorMessage: null,
          });

          updated++;
          continue;
        }

        if (transcribeStatus === "FAILED") {
          await markAudioJobFailed(dataClient, {
            jobId,
            transcribeStatus: "FAILED",
            errorMessage:
              safeString(response.TranscriptionJob?.FailureReason) ||
              "Transcribe job failed",
          });

          updated++;
          failed++;
          continue;
        }

        if (transcribeStatus !== "COMPLETED") {
          await dataClient.models.AudioJob.update({
            id: jobId,
            transcribeStatus: transcribeStatus || "UNKNOWN",
            errorMessage: `Unexpected Transcribe status: ${
              transcribeStatus || "(empty)"
            }`,
          });

          updated++;
          continue;
        }

        if (!transcriptFileUri) {
          await markAudioJobFailed(dataClient, {
            jobId,
            transcribeStatus: "COMPLETED",
            errorMessage:
              "COMPLETED but TranscriptFileUri is missing. Marked FAILED to avoid infinite RUNNING.",
          });

          updated++;
          failed++;

          console.warn("COMPLETED but missing TranscriptFileUri -> FAILED", {
            jobId,
            jobName,
          });

          continue;
        }

        try {
          const { transcriptText, source, details } = await withTimeout(
            getTranscriptText(region, transcriptFileUri),
            15_000,
            `getTranscriptText ${jobName}`,
          );

          const finalTranscript = truncate(transcriptText.trim());

          console.info("transcript extraction summary", {
            jobId,
            jobName,
            source,
            chars: finalTranscript.length,
            transcriptSource: details.transcriptSource,
            transcriptsCount: details.transcriptsCount,
            itemsCount: details.itemsCount,
            audioSegmentsCount: details.audioSegmentsCount,
            primaryTranscriptChars: details.primaryTranscriptChars,
            itemTranscriptChars: details.itemTranscriptChars,
          });

          if (!finalTranscript) {
            const emptyMessage =
              "Transcribe completed, but no speech was recognized. " +
              "Transcript text is empty and items/audio_segments are empty or unusable. " +
              "Please check audio volume, silence, noise, recording format, and whether Japanese speech is clearly recorded.";

            await markAudioJobFailed(dataClient, {
              jobId,
              transcribeStatus: "COMPLETED",
              errorMessage: emptyMessage,
            });

            updated++;
            failed++;

            console.warn("empty transcript -> FAILED", {
              jobId,
              jobName,
              source,
              transcriptSource: details.transcriptSource,
              transcriptsCount: details.transcriptsCount,
              itemsCount: details.itemsCount,
              audioSegmentsCount: details.audioSegmentsCount,
            });

            continue;
          }

          await dataClient.models.AudioJob.update({
            id: jobId,
            status: "SUCCEEDED",
            transcribeStatus: "COMPLETED",
            transcriptText: finalTranscript,
            errorMessage: null,
            completedAt: isoNow(),
          });

          updated++;

          if (resolvedJobType === "PRACTICE") {
            const { tenantId, identifier } = resolvePracticeIdentifier(job);

            if (!identifier) {
              console.warn("Practice identifier not found for AudioJob", {
                jobId,
                jobName,
                tenantId,
                audioPath: job.audioPath,
                sourceEntityType: job.sourceEntityType,
                sourceEntityId: job.sourceEntityId,
              });
            } else {
              const practice = await findPracticeByTenantAndIdentifier(
                dataClient,
                tenantId,
                identifier,
              );

              if (!practice) {
                console.warn("PracticeCode not found", {
                  jobId,
                  jobName,
                  tenantId,
                  identifier,
                });
              } else {
                const updatePracticeResult =
                  await dataClient.models.PracticeCode.update({
                    id: practice.id,

                    practice_code: practice.practice_code,
                    tenantId: practice.tenantId ?? undefined,
                    owner: practice.owner ?? undefined,
                    ownerType: practice.ownerType ?? undefined,
                    practiceCategory: practice.practiceCategory ?? undefined,
                    visibility: practice.visibility ?? undefined,
                    publishScope: practice.publishScope ?? undefined,

                    name: practice.name ?? "",
                    memo: practice.memo ?? "",
                    source_type: practice.source_type ?? "practiceRegister",
                    version: Number(practice.version ?? 1),

                    status: "REVIEW",
                    transcriptText: finalTranscript,
                    transcribeJobName: jobName,
                    transcribeStatus: "COMPLETED",
                    errorMessage: "",
                    updatedBy: "transcribe-poller",
                  });

                if (updatePracticeResult.errors?.length) {
                  console.error("PracticeCode update errors", {
                    jobId,
                    jobName,
                    tenantId,
                    identifier,
                    practiceId: practice.id,
                    errors: updatePracticeResult.errors,
                  });
                } else {
                  practiceUpdated++;

                  console.info("PracticeCode updated from AudioJob", {
                    jobId,
                    jobName,
                    tenantId,
                    identifier,
                    chars: finalTranscript.length,
                    source,
                  });
                }
              }
            }
          } else {
            console.info("skip PracticeCode update for non-PRACTICE AudioJob", {
              jobId,
              jobName,
              jobType: resolvedJobType || "(empty)",
              sourceEntityType: job.sourceEntityType ?? null,
              chars: finalTranscript.length,
            });
          }

          console.info("transcript saved", {
            jobId,
            jobName,
            source,
            chars: finalTranscript.length,
            jobType: resolvedJobType || "(empty)",
          });
        } catch (error) {
          const e = toErrorLike(error);

          await markAudioJobFailed(dataClient, {
            jobId,
            transcribeStatus: "COMPLETED",
            errorMessage: `Transcript fetch failed: ${
              e.message ?? String(error)
            }. Marked FAILED to avoid infinite RUNNING.`,
          });

          updated++;
          failed++;

          console.error("transcript fetch failed -> FAILED", {
            jobId,
            jobName,
            name: e.name,
            message: e.message,
          });
        }
      } catch (error) {
        if (isNotFound(error)) {
          const notFoundStartedMs =
            extractEpochMsFromJobName(jobName) ||
            (job.recordedAt ? Date.parse(job.recordedAt) : undefined);

          if (
            notFoundStartedMs &&
            now - notFoundStartedMs > NOT_FOUND_GRACE_MS
          ) {
            await markAudioJobFailed(dataClient, {
              jobId,
              transcribeStatus: "FAILED",
              errorMessage: `CLEANUP: GetTranscriptionJob NotFound too long (>10m). jobName=${jobName}`,
            });

            cleaned++;
            failed++;

            console.warn("GetTranscriptionJob NotFound too long -> FAILED", {
              jobId,
              jobName,
            });
          } else {
            const e = toErrorLike(error);

            await dataClient.models.AudioJob.update({
              id: jobId,
              errorMessage: `GetTranscriptionJob not found yet: ${
                e.message ?? String(error)
              }`,
            });

            console.warn("GetTranscriptionJob not found yet; will retry", {
              jobId,
              jobName,
              message: e.message,
            });
          }

          continue;
        }

        const e = toErrorLike(error);

        await dataClient.models.AudioJob.update({
          id: jobId,
          errorMessage: `poller error: ${e.name ?? ""} ${
            e.message ?? String(error)
          }`,
        });

        console.error("poller error", {
          jobId,
          jobName,
          name: e.name,
          message: e.message,
          stack: e.stack,
        });
      }
    }
  } finally {
    console.info("transcribe-poller done", {
      processed,
      updated,
      cleaned,
      failed,
      practiceUpdated,
    });
  }
};
