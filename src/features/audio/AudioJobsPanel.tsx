import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";

import outputs from "../../../amplify_outputs.json";
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  tenantId: string;
  owner: string;
};

type AudioJob = Schema["AudioJob"]["type"];

type AudioJobWithOptionalFields = AudioJob & {
  jobType?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
};

type GraphQLErrorLike = {
  message?: string | null;
};

type ListJobsByTenantDateInput = {
  tenantId: string;
  sortDirection: "ASC" | "DESC";
  limit: number;
  nextToken?: string;
  filter?: unknown;
};

type ListJobsByTenantDateResult = {
  data?: AudioJob[] | null;
  errors?: GraphQLErrorLike[] | null;
  nextToken?: string | null;
};

type AudioJobModelWithTenantDate = {
  listJobsByTenantDate: (
    input: ListJobsByTenantDateInput,
  ) => Promise<ListJobsByTenantDateResult>;
};

type SummarizeAudioInput = {
  jobId: string;
  audioPath?: string | null;
  audioUrl?: string | null;
  audioS3Uri?: string | null;
};

type SummarizeAudioBody = {
  jobId?: string | null;
  status?: string | null;
  transcribeJobName?: string | null;
  transcriptText?: string | null;
  summaryText?: string | null;
  errors?: GraphQLErrorLike[] | null;
};

type SummarizeAudioResult =
  | {
      data?: SummarizeAudioBody | null;
      errors?: GraphQLErrorLike[] | null;
    }
  | SummarizeAudioBody
  | null
  | undefined;

type MutationsWithSummarizeAudio = {
  summarizeAudio: (input: SummarizeAudioInput) => Promise<SummarizeAudioResult>;
};

const PAGE_SIZE = 20;
const AUTO_REFRESH_MS = 8_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringField(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getStorageBucketName(): string | undefined {
  const root = outputs as unknown;

  if (!isRecord(root)) return undefined;

  const storage = isRecord(root.storage) ? root.storage : {};

  return (
    getStringField(storage, "bucket_name") ||
    getStringField(storage, "bucketName") ||
    getStringField(storage, "bucket") ||
    getStringField(storage, "aws_bucket_name") ||
    getStringField(storage, "aws_bucket") ||
    getStringField(root, "bucket_name") ||
    getStringField(root, "bucketName")
  );
}

function joinErrors(errors: GraphQLErrorLike[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => error.message ?? "")
    .filter(Boolean)
    .join("\n");
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/[\s-]/g, "_")
    .toUpperCase();
}

function isPracticeAudioJob(job: AudioJobWithOptionalFields): boolean {
  const jobType = normalize(job.jobType);
  const sourceEntityType = normalize(job.sourceEntityType);

  if (jobType === "PRACTICE") return true;

  if (
    sourceEntityType === "PRACTICE" ||
    sourceEntityType === "PRACTICE_CODE" ||
    sourceEntityType === "PRACTICECODE"
  ) {
    return true;
  }

  // AudioUpload.tsx で作成した従来Jobは sourceEntityType: "PracticeCode"
  // Practice登録側の古いパス形式にも対応する
  const audioPath = String(job.audioPath ?? "");
  return audioPath.startsWith("practice-audio/");
}

function isRunnableStatus(status: unknown): boolean {
  const normalized = normalize(status);

  return (
    normalized === "PENDING" ||
    normalized === "UPLOADING" ||
    normalized === "FAILED"
  );
}

function getRunBlockReason(job: AudioJobWithOptionalFields): string {
  const status = normalize(job.status);

  if (!isPracticeAudioJob(job)) {
    return "Practice用AudioJobではありません";
  }

  if (status === "RUNNING") {
    return "文字起こし実行中です";
  }

  if (status === "SUCCEEDED") {
    return "文字起こし完了済みです";
  }

  if (!isRunnableStatus(job.status)) {
    return `この状態では実行できません: ${String(job.status ?? "")}`;
  }

  if (!job.audioPath) {
    return "audioPath がありません";
  }

  return "";
}

function unwrapSummarizeResult(result: SummarizeAudioResult): {
  body: SummarizeAudioBody | null;
  errors: GraphQLErrorLike[];
} {
  if (!result || !isRecord(result)) {
    return {
      body: null,
      errors: [],
    };
  }

  const outerErrors = Array.isArray(result.errors)
    ? (result.errors as GraphQLErrorLike[])
    : [];

  const data = "data" in result ? result.data : result;

  const body = isRecord(data) ? (data as SummarizeAudioBody) : null;

  const innerErrors =
    body && Array.isArray(body.errors)
      ? (body.errors as GraphQLErrorLike[])
      : [];

  return {
    body,
    errors: [...outerErrors, ...innerErrors],
  };
}

function toDisplayDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AudioJobsPanel(props: Props) {
  const { tenantId, owner } = props;

  const client = useMemo(() => generateClient<Schema>(), []);
  const audioJobModel = useMemo(
    () =>
      client.models.AudioJob as unknown as AudioJobModelWithTenantDate &
        typeof client.models.AudioJob,
    [client],
  );
  const summarizeMutations = useMemo(
    () => client.mutations as unknown as MutationsWithSummarizeAudio,
    [client],
  );

  const [items, setItems] = useState<AudioJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [currentToken, setCurrentToken] = useState<string | undefined>(
    undefined,
  );
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [prevStack, setPrevStack] = useState<string[]>([]);

  const loadPage = useCallback(
    async (token?: string) => {
      setLoading(true);
      setError("");

      try {
        const {
          data,
          errors,
          nextToken: nt,
        } = await audioJobModel.listJobsByTenantDate({
          tenantId,
          sortDirection: "DESC",
          limit: PAGE_SIZE,
          nextToken: token,
          filter: {
            owner: {
              eq: owner,
            },
          },
        });

        if (errors?.length) {
          throw new Error(joinErrors(errors));
        }

        const rawItems = (data ?? []) as AudioJobWithOptionalFields[];
        const practiceItems = rawItems.filter(isPracticeAudioJob);

        setItems(practiceItems as AudioJob[]);
        setNextToken(nt ?? undefined);
        setCurrentToken(token);
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : String(caught);

        console.error(caught);
        setError(message);
        setItems([]);
        setNextToken(undefined);
      } finally {
        setLoading(false);
      }
    },
    [audioJobModel, owner, tenantId],
  );

  const refresh = useCallback(async () => {
    await loadPage(currentToken);
  }, [currentToken, loadPage]);

  async function goNext() {
    if (!nextToken) return;

    setPrevStack((stack) => [...stack, currentToken ?? ""]);
    await loadPage(nextToken);
  }

  async function goPrev() {
    if (prevStack.length === 0) return;

    const copy = prevStack.slice();
    const prev = copy.pop();

    setPrevStack(copy);
    await loadPage(prev || undefined);
  }

  async function runTranscribe(job: AudioJob) {
    const initialJob = job as AudioJobWithOptionalFields;

    if (!initialJob.id) return;

    setRunning(initialJob.id);
    setError("");

    try {
      const latestResult = await client.models.AudioJob.get({
        id: initialJob.id,
      });

      if (latestResult.errors?.length) {
        throw new Error(joinErrors(latestResult.errors));
      }

      if (!latestResult.data) {
        throw new Error(
          "AudioJob が見つかりません。画面を再読込してください。",
        );
      }

      const latest = latestResult.data as AudioJobWithOptionalFields;
      const blockReason = getRunBlockReason(latest);

      if (blockReason) {
        await refresh();
        throw new Error(blockReason);
      }

      const audioPath = latest.audioPath;

      if (!audioPath) {
        throw new Error("audioPath がありません。");
      }

      const bucket = getStorageBucketName();

      if (!bucket) {
        throw new Error(
          "storage bucket name not found in amplify_outputs.json",
        );
      }

      const urlRes = await getUrl({
        path: audioPath,
        options: {
          expiresIn: 60 * 60,
        },
      });

      const audioUrl = urlRes.url.toString();
      const key = String(audioPath).replace(/^\/+/, "");
      const audioS3Uri = `s3://${bucket}/${key}`;

      const result = await summarizeMutations.summarizeAudio({
        jobId: latest.id,
        audioPath,
        audioUrl,
        audioS3Uri,
      });

      const { body, errors } = unwrapSummarizeResult(result);

      if (errors.length) {
        throw new Error(joinErrors(errors));
      }

      const status = body?.status ?? "";
      const transcribeJobName = body?.transcribeJobName ?? "";

      console.log("summarizeAudio response(raw):", result);
      console.log("summarizeAudio response(parsed):", body);

      if (normalize(status) === "FAILED") {
        const message =
          body?.summaryText ??
          "StartTranscriptionJob failed in summarizeAudio.";

        await client.models.AudioJob.update({
          id: latest.id,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: message,
          completedAt: new Date().toISOString(),
        });

        await refresh();
        throw new Error(message);
      }

      if (!transcribeJobName) {
        const message =
          "No transcribeJobName returned from summarizeAudio. Check audio-summarize handler logs.";

        await client.models.AudioJob.update({
          id: latest.id,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: message,
          completedAt: new Date().toISOString(),
        });

        await refresh();
        throw new Error(message);
      }

      const latestBeforeUpdateResult = await client.models.AudioJob.get({
        id: latest.id,
      });

      if (latestBeforeUpdateResult.errors?.length) {
        throw new Error(joinErrors(latestBeforeUpdateResult.errors));
      }

      const latestBeforeUpdate =
        latestBeforeUpdateResult.data as AudioJobWithOptionalFields | null;

      if (!latestBeforeUpdate) {
        throw new Error(
          "AudioJob が見つかりません。画面を再読込してください。",
        );
      }

      if (normalize(latestBeforeUpdate.status) === "SUCCEEDED") {
        await refresh();
        throw new Error("このAudioJobはすでに文字起こし完了済みです。");
      }

      if (normalize(latestBeforeUpdate.status) === "RUNNING") {
        await refresh();
        throw new Error("このAudioJobはすでに文字起こし実行中です。");
      }

      await client.models.AudioJob.update({
        id: latest.id,
        status: "RUNNING",
        sourceEntityType: latest.sourceEntityType || "PracticeCode",
        transcribeJobName,
        transcribeStatus: "IN_PROGRESS",
        errorMessage: null,
        completedAt: null,
      });

      await refresh();
      alert("Transcribe started.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);

      console.error(caught);
      setError(message);
    } finally {
      setRunning("");
    }
  }

  useEffect(() => {
    setPrevStack([]);
    setCurrentToken(undefined);
    setNextToken(undefined);
    void loadPage(undefined);
  }, [loadPage]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [refresh]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ fontWeight: 600 }}>Audio Jobs</div>

        <button onClick={refresh} disabled={loading}>
          Refresh
        </button>

        <button onClick={goPrev} disabled={loading || prevStack.length === 0}>
          Prev
        </button>

        <button onClick={goNext} disabled={loading || !nextToken}>
          Next
        </button>

        {loading && (
          <span style={{ fontSize: 12, opacity: 0.7 }}>loading...</span>
        )}
      </div>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        tenantId: <code>{tenantId}</code> / owner: <code>{owner}</code> /
        pageSize: <code>{PAGE_SIZE}</code> / 表示対象: <code>PracticeCode</code>{" "}
        系AudioJobのみ
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "crimson" }}>
          error:
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{error}</pre>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          （このページにはPractice用ジョブがありません）
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item) => {
            const j = item as AudioJobWithOptionalFields;
            const blockReason = getRunBlockReason(j);
            const canRun = !blockReason;

            return (
              <div
                key={j.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 10,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{j.status}</div>

                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {toDisplayDate(j.recordedAt)}
                  </div>

                  <div style={{ marginLeft: "auto" }}>
                    <button
                      onClick={() => runTranscribe(j)}
                      disabled={
                        loading || running === j.id || !canRun || !j.audioPath
                      }
                      title={blockReason || "Run Transcribe"}
                    >
                      {running === j.id ? "Running..." : "Run Transcribe"}
                    </button>
                  </div>
                </div>

                {blockReason && (
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Run不可: {blockReason}
                  </div>
                )}

                <div style={{ fontSize: 12 }}>
                  jobId: <code>{j.id}</code>
                </div>

                <div style={{ fontSize: 12 }}>
                  sourceEntityType:{" "}
                  <code>{j.sourceEntityType ?? "(empty)"}</code>
                  {j.sourceEntityId && (
                    <>
                      {" "}
                      / sourceEntityId: <code>{j.sourceEntityId}</code>
                    </>
                  )}
                  {j.jobType && (
                    <>
                      {" "}
                      / jobType: <code>{j.jobType}</code>
                    </>
                  )}
                </div>

                <div style={{ fontSize: 12 }}>
                  audioPath: <code>{j.audioPath}</code>
                </div>

                {j.transcribeJobName && (
                  <div style={{ fontSize: 12 }}>
                    transcribeJobName: <code>{j.transcribeJobName}</code>
                  </div>
                )}

                {j.transcribeStatus && (
                  <div style={{ fontSize: 12 }}>
                    transcribeStatus: <code>{j.transcribeStatus}</code>
                  </div>
                )}

                {j.transcriptText && (
                  <div style={{ fontSize: 12 }}>
                    transcript:
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {j.transcriptText}
                    </pre>
                  </div>
                )}

                {j.summaryText && (
                  <div style={{ fontSize: 12 }}>
                    summary:
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {j.summaryText}
                    </pre>
                  </div>
                )}

                {j.errorMessage && (
                  <div style={{ fontSize: 12, color: "crimson" }}>
                    error:
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {j.errorMessage}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
