import { TranscribeClient, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/transcribe-poller";

function isNotFound(err: any) {
  const name = err?.name;
  const msg = String(err?.message ?? "");
  return name === "ResourceNotFoundException" || msg.includes("couldn't be found");
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

async function fetchJsonWithRetry(url: string, retries = 3, timeoutMs = 12_000): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ac.signal });
      if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
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
  transcriptFileUri: string
): Promise<{ transcriptText: string; source: "fetch" | "s3" }> {
  // 1) まずは TranscriptFileUri を fetch（IAM不要のことが多い）
  try {
    const json = await fetchJsonWithRetry(transcriptFileUri, 3, 15_000);
    const t = safeString(json?.results?.transcripts?.[0]?.transcript ?? "");
    return { transcriptText: t, source: "fetch" };
  } catch (e: any) {
    console.warn("fetch TranscriptFileUri failed (will try s3 fallback)", {
      msg: e?.message ?? String(e),
    });
  }

  // 2) フォールバック：S3 GetObject（権限が必要）
  const { bucket, key } = parseS3FromUri(transcriptFileUri);
  if (!bucket || !key) throw new Error("could not parse bucket/key from TranscriptFileUri");

  const s3 = new S3Client({ region });
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const text = await readStreamToString(obj.Body);
  const json = JSON.parse(text);
  const t = safeString(json?.results?.transcripts?.[0]?.transcript ?? "");
  return { transcriptText: t, source: "s3" };
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
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

// ✅ jobName末尾の "-<epochMs>" を拾う（あなたの命名 hoiku360-<jobId>-<ms> 想定）
function extractEpochMsFromJobName(jobName: string | undefined | null): number | undefined {
  if (!jobName) return undefined;
  const m = jobName.match(/-(\d{10,})$/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function isoNow() {
  return new Date().toISOString();
}

export const handler = async () => {
  const region = process.env.AWS_REGION || "ap-northeast-1";
  const transcribe = new TranscribeClient({ region, maxAttempts: 2 });

  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
  Amplify.configure(resourceConfig, libraryOptions);
  const dataClient = generateClient<Schema>();

  const TIMEOUT_MS = 60 * 60 * 1000; // ✅ 60分タイムアウト
  const NOTFOUND_GRACE_MS = 10 * 60 * 1000; // ✅ NotFound許容（開始直後用）
  const MAX_PER_RUN = 5; // ✅ 1回で処理する上限（タイムアウト回避）

  const now = Date.now();

  console.info("transcribe-poller start", { region });

  let processed = 0;
  let updated = 0;
  let cleaned = 0;

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

    // =========================================================
    // ✅ 0) 清掃フェーズ（Transcribe APIを叩く前に片付ける）
    // =========================================================
    for (const j of list) {
      // jobNameが無い RUNNING は “永久に処理できない” ので即落とす
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

    // 清掃で落とした分を除いた候補（jobNameありのみ）
    const candidates = list.filter((j) => !!j.transcribeJobName);

    // =========================================================
    // ✅ 1) タイムアウト清掃（IN_PROGRESSが60分超なら落とす）
    // - 目安時刻は jobName末尾のepochMs、無ければ recordedAt を使う
    // =========================================================
    for (const j of candidates) {
      const startedMs =
        extractEpochMsFromJobName(j.transcribeJobName) ||
        (j.recordedAt ? Date.parse(j.recordedAt) : undefined);

      if (!startedMs) continue;

      // transcribeStatusが未設定でも、RUNNINGで長いなら危険なので対象にする
      if (now - startedMs > TIMEOUT_MS) {
        await dataClient.models.AudioJob.update({
          id: j.id,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: `CLEANUP: Transcribe IN_PROGRESS timeout (>60m). started=${new Date(
            startedMs
          ).toISOString()}`,
          completedAt: isoNow(),
        });
        cleaned++;
      }
    }

    // ここまでの清掃が進むだけでも「詰まり」は解消されていきます
    // 次は “まだRUNNINGのものだけ” を処理
    const { data: jobs2, errors: errors2 } = await dataClient.models.AudioJob.list({
      filter: { status: { eq: "RUNNING" } },
      limit: 50,
    });

    if (errors2?.length) {
      console.error("re-list AudioJob errors", errors2);
      return;
    }

    const list2 = jobs2 ?? [];
    const targets = list2
      .filter((j) => !!j.transcribeJobName)
      .slice(0, MAX_PER_RUN);

    // =========================================================
    // ✅ 2) 通常フェーズ（GetTranscriptionJob → COMPLETED/FAILED反映、COMPLETEDなら文字も取得）
    // =========================================================
    for (const j of targets) {
      processed++;

      const jobId = j.id;
      const jobName = j.transcribeJobName!;
      console.info("check job", { jobId, jobName });

      try {
        const resp = await withTimeout(
          transcribe.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })),
          8_000,
          `GetTranscriptionJob ${jobName}`
        );

        const tj = resp.TranscriptionJob;
        const st = tj?.TranscriptionJobStatus; // IN_PROGRESS / COMPLETED / FAILED

        console.info("job status", { jobId, jobName, st });

        if (!st || st === "IN_PROGRESS") {
          // 念のため transcribeStatus は更新しておく（UIに見える）
          await dataClient.models.AudioJob.update({
            id: jobId,
            transcribeStatus: "IN_PROGRESS",
          });
          updated++;
          continue;
        }

        if (st === "FAILED") {
          const reason = tj?.FailureReason || "Transcribe job failed (no FailureReason)";
          await dataClient.models.AudioJob.update({
            id: jobId,
            status: "FAILED",
            transcribeStatus: "FAILED",
            errorMessage: reason,
            completedAt: isoNow(),
          });
          updated++;
          console.error("transcribe failed", { jobId, jobName, reason });
          continue;
        }

        if (st === "COMPLETED") {
          const transcriptFileUri = tj?.Transcript?.TranscriptFileUri;

          if (!transcriptFileUri) {
            await dataClient.models.AudioJob.update({
              id: jobId,
              transcribeStatus: "COMPLETED",
              errorMessage: "COMPLETED but TranscriptFileUri is missing (will retry).",
            });
            updated++;
            console.warn("COMPLETED but missing TranscriptFileUri", { jobId, jobName });
            continue;
          }

          try {
            const { transcriptText, source } = await withTimeout(
              getTranscriptText(region, transcriptFileUri),
              15_000,
              `getTranscriptText ${jobName}`
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
            console.info("transcript saved", {
              jobId,
              jobName,
              source,
              chars: finalTranscript.length,
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
        // NotFound が長引く場合は清掃（開始直後だけ許容）
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
    console.info("transcribe-poller done", { processed, updated, cleaned });
  }
};
