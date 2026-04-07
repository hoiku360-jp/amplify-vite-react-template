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

function isNotFound(err: any) {
  const name = err?.name;
  const msg = String(err?.message ?? "");
  return (
    name === "ResourceNotFoundException" || msg.includes("couldn't be found")
  );
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function truncate(s: string, max = 120_000) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n…(truncated)…";
}

async function readStreamToString(body: any): Promise<string> {
  if (!body) return "";
  if (typeof body.transformToString === "function") {
    return await body.transformToString("utf-8");
  }
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    body.on("data", (c: Buffer) => chunks.push(c));
    body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    body.on("error", reject);
  });
}

async function fetchJsonWithRetry(
  url: string,
  retries = 3,
  timeoutMs = 12_000,
): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ac.signal });
      if (!res.ok) {
        throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (e: any) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1) * (i + 1)));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

function parseS3FromUri(uri: string): { bucket?: string; key?: string } {
  try {
    const u = new URL(uri);
    const host = u.hostname;

    if (host.includes(".s3.") && host.endsWith(".amazonaws.com")) {
      const bucket = host.split(".s3.")[0];
      const key = u.pathname.replace(/^\/+/, "");
      return { bucket, key };
    }

    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const bucket = parts[0];
      const key = parts.slice(1).join("/");
      return { bucket, key };
    }
    return {};
  } catch {
    return {};
  }
}

async function getTranscriptText(
  region: string,
  transcriptFileUri: string,
): Promise<{ transcriptText: string; source: "fetch" | "s3" }> {
  try {
    const json = await fetchJsonWithRetry(transcriptFileUri, 3, 15_000);
    const t = safeString(json?.results?.transcripts?.[0]?.transcript ?? "");
    return { transcriptText: t, source: "fetch" };
  } catch (e: any) {
    console.warn("fetch TranscriptFileUri failed (will try s3 fallback)", {
      msg: e?.message ?? String(e),
    });
  }

  const { bucket, key } = parseS3FromUri(transcriptFileUri);
  if (!bucket || !key) {
    throw new Error("could not parse bucket/key from TranscriptFileUri");
  }

  const s3 = new S3Client({ region });
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const text = await readStreamToString(obj.Body);
  const json = JSON.parse(text);
  const t = safeString(json?.results?.transcripts?.[0]?.transcript ?? "");
  return { transcriptText: t, source: "s3" };
}

async function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`timeout after ${ms}ms: ${label}`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

function extractEpochMsFromJobName(
  jobName: string | undefined | null,
): number | undefined {
  if (!jobName) return undefined;
  const m = jobName.match(/-(\d{10,})$/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function isoNow() {
  return new Date().toISOString();
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

  if (parts.length < 5) return {};
  if (parts[0] !== "practice-audio") return {};

  return {
    tenantId: parts[1],
    practiceCode: parts[3],
  };
}

function resolveJobType(job: any): string {
  const explicit = safeString(job?.jobType).trim().toUpperCase();
  if (explicit) return explicit;

  const legacyPractice = extractPracticeInfoFromAudioPath(job?.audioPath);
  if (legacyPractice.tenantId && legacyPractice.practiceCode) {
    return "PRACTICE";
  }

  return "";
}

async function findPracticeByTenantAndPracticeCode(
  dataClient: ReturnType<typeof generateClient<Schema>>,
  tenantId: string,
  practiceCode: string,
) {
  const result = await dataClient.models.PracticeCode.list({
    filter: {
      tenantId: { eq: tenantId },
    },
    limit: 1000,
  });

  if (result.errors?.length) {
    throw new Error(
      `PracticeCode lookup failed: ${result.errors
        .map((e: { message: string }) => e.message)
        .join("\n")}`,
    );
  }

  const items = result.data ?? [];

  console.info("PracticeCode lookup by tenantId", {
    tenantId,
    count: items.length,
    targetPracticeCode: practiceCode,
  });

  return items.find((x) => x.practice_code === practiceCode) ?? null;
}

export const handler = async () => {
  const region = process.env.AWS_REGION || "ap-northeast-1";
  const transcribe = new TranscribeClient({ region, maxAttempts: 2 });

  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as any,
  );
  Amplify.configure(resourceConfig, libraryOptions);
  const dataClient = generateClient<Schema>();

  const TIMEOUT_MS = 60 * 60 * 1000;
  const NOTFOUND_GRACE_MS = 10 * 60 * 1000;
  const MAX_PER_RUN = 5;

  const now = Date.now();

  console.info("transcribe-poller start", { region });

  let processed = 0;
  let updated = 0;
  let cleaned = 0;
  let practiceUpdated = 0;

  try {
    const { data: jobs, errors } = await dataClient.models.AudioJob.list({
      filter: { status: { eq: "RUNNING" } },
      limit: 50,
    });

    if (errors?.length) {
      console.error("list AudioJob errors", errors);
      return;
    }

    const list = jobs ?? [];
    console.info("list RUNNING jobs", { count: list.length, errors: 0 });

    for (const j of list) {
      if (!j.transcribeJobName) {
        await dataClient.models.AudioJob.update({
          id: j.id,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: "CLEANUP: RUNNING but transcribeJobName is missing",
          completedAt: isoNow(),
        });
        cleaned++;
      }
    }

    const candidates = list.filter((j) => !!j.transcribeJobName);

    for (const j of candidates) {
      if (processed >= MAX_PER_RUN) break;
      processed++;

      const jobId = j.id;
      const jobName = j.transcribeJobName ?? "";
      const resolvedJobType = resolveJobType(j);

      const startedMs =
        extractEpochMsFromJobName(j.transcribeJobName) ||
        (j.recordedAt ? Date.parse(j.recordedAt) : undefined);

      if (!startedMs) continue;

      if (now - startedMs > TIMEOUT_MS) {
        await dataClient.models.AudioJob.update({
          id: j.id,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: `CLEANUP: Transcribe IN_PROGRESS timeout (>60m). jobName=${jobName}`,
          completedAt: isoNow(),
        });
        cleaned++;
        continue;
      }

      try {
        const resp = await transcribe.send(
          new GetTranscriptionJobCommand({
            TranscriptionJobName: jobName,
          }),
        );

        const status = safeString(
          resp.TranscriptionJob?.TranscriptionJobStatus ?? "",
        );
        const transcriptFileUri = safeString(
          resp.TranscriptionJob?.Transcript?.TranscriptFileUri ?? "",
        );

        if (status === "IN_PROGRESS" || status === "QUEUED") {
          await dataClient.models.AudioJob.update({
            id: jobId,
            transcribeStatus: status,
            errorMessage: null,
          });
          updated++;
          continue;
        }

        if (status === "FAILED") {
          await dataClient.models.AudioJob.update({
            id: jobId,
            status: "FAILED",
            transcribeStatus: "FAILED",
            errorMessage:
              safeString(resp.TranscriptionJob?.FailureReason) ||
              "Transcribe job failed",
            completedAt: isoNow(),
          });
          updated++;
          continue;
        }

        if (status === "COMPLETED") {
          if (!transcriptFileUri) {
            await dataClient.models.AudioJob.update({
              id: jobId,
              transcribeStatus: "COMPLETED",
              errorMessage:
                "COMPLETED but TranscriptFileUri is missing (will retry).",
            });
            updated++;
            console.warn("COMPLETED but missing TranscriptFileUri", {
              jobId,
              jobName,
            });
            continue;
          }

          try {
            const { transcriptText, source } = await withTimeout(
              getTranscriptText(region, transcriptFileUri),
              15_000,
              `getTranscriptText ${jobName}`,
            );

            const finalTranscript = truncate(transcriptText || "");

            await dataClient.models.AudioJob.update({
              id: jobId,
              status: "SUCCEEDED",
              transcribeStatus: "COMPLETED",
              transcriptText: finalTranscript || null,
              errorMessage: null,
              completedAt: isoNow(),
            });
            updated++;

            if (resolvedJobType === "PRACTICE") {
              const { tenantId, practiceCode } =
                extractPracticeInfoFromAudioPath(j.audioPath);

              if (!tenantId || !practiceCode) {
                console.warn("practice info not found from audioPath", {
                  jobId,
                  jobName,
                  audioPath: j.audioPath,
                });
              } else {
                const practice = await findPracticeByTenantAndPracticeCode(
                  dataClient,
                  tenantId,
                  practiceCode,
                );

                if (!practice) {
                  console.warn("PracticeCode not found", {
                    jobId,
                    jobName,
                    tenantId,
                    practiceCode,
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
                      publishScope: (practice as any).publishScope ?? undefined,

                      name: practice.name ?? "",
                      memo: practice.memo ?? "",
                      source_type: practice.source_type ?? "practiceRegister",
                      version: Number((practice as any).version ?? 1),

                      status: "REVIEW",
                      transcriptText: finalTranscript || "",
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
                      practiceCode,
                      practiceId: practice.id,
                      errors: updatePracticeResult.errors,
                    });
                  } else {
                    practiceUpdated++;
                    console.info("PracticeCode updated from AudioJob", {
                      jobId,
                      jobName,
                      tenantId,
                      practiceCode,
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
          } catch (e: any) {
            const msg = e?.message ?? String(e);
            await dataClient.models.AudioJob.update({
              id: jobId,
              transcribeStatus: "COMPLETED",
              errorMessage: `Transcript fetch failed (will retry): ${msg}`,
            });
            updated++;
            console.error("transcript fetch failed", { jobId, jobName, msg });
          }
        }
      } catch (e: any) {
        if (isNotFound(e)) {
          const startedMs =
            extractEpochMsFromJobName(jobName) ||
            (j.recordedAt ? Date.parse(j.recordedAt) : undefined);

          if (startedMs && now - startedMs > NOTFOUND_GRACE_MS) {
            await dataClient.models.AudioJob.update({
              id: jobId,
              status: "FAILED",
              transcribeStatus: "FAILED",
              errorMessage: `CLEANUP: GetTranscriptionJob NotFound too long (>10m). jobName=${jobName}`,
              completedAt: isoNow(),
            });
            cleaned++;
            console.warn("NotFound too long -> FAILED", { jobId, jobName });
          } else {
            console.warn("GetTranscriptionJob not found yet (will retry)", {
              jobId,
              jobName,
              msg: e?.message ?? String(e),
            });
          }
          continue;
        }

        console.error("poller error", {
          jobId,
          jobName,
          name: e?.name,
          msg: e?.message ?? String(e),
        });
      }
    }
  } finally {
    console.info("transcribe-poller done", {
      processed,
      updated,
      cleaned,
      practiceUpdated,
    });
  }
};