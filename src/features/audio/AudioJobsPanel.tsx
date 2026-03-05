import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";

// ✅ ここはファイル位置に合わせて：src/features/audio/AudioJobsPanel.tsx → 3つ上がプロジェクト直下
import outputs from "../../../amplify_outputs.json";

// ✅ Schema import も整合させる（このファイル位置なら 3つ上）
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  tenantId: string;
  owner: string;
};

const PAGE_SIZE = 3;

// ✅ outputs から bucket 名をなるべく堅く拾う
function getStorageBucketName(): string | undefined {
  const o: any = outputs as any;
  return (
    o?.storage?.bucket_name ||
    o?.storage?.bucketName ||
    o?.storage?.bucket ||
    o?.storage?.aws_bucket_name ||
    o?.storage?.aws_bucket ||
    o?.bucket_name ||
    o?.bucketName
  );
}

export default function AudioJobsPanel(props: Props) {
  const { tenantId, owner } = props;

  const client = useMemo(() => generateClient<Schema>(), []);
  const [items, setItems] = useState<Array<Schema["AudioJob"]["type"]>>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string>("");
  const [error, setError] = useState<string>("");

  // ページング
  const [currentToken, setCurrentToken] = useState<string | undefined>(undefined);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [prevStack, setPrevStack] = useState<string[]>([]);

  async function loadPage(token?: string) {
    setLoading(true);
    setError("");

    try {
      // ✅ queryField は client.models.AudioJob.<queryField>() に生える（ただし型生成の都合で any）
      const { data, errors, nextToken: nt } = await (client.models.AudioJob as any).listJobsByTenantDate({
        tenantId,
        sortDirection: "DESC",
        limit: PAGE_SIZE,
        nextToken: token,
        filter: { owner: { eq: owner } },
      });

      if (errors?.length) throw new Error(errors.map((e: any) => e.message).join("\n"));

      setItems((data ?? []) as Array<Schema["AudioJob"]["type"]>);
      setNextToken(nt ?? undefined);
      setCurrentToken(token);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? String(e));
      setItems([]);
      setNextToken(undefined);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    await loadPage(currentToken);
  }

  async function goNext() {
    if (!nextToken) return;
    setPrevStack((s) => [...s, currentToken ?? ""]);
    await loadPage(nextToken);
  }

  async function goPrev() {
    if (prevStack.length === 0) return;
    const copy = prevStack.slice();
    const prev = copy.pop(); // "" は先頭ページの印
    setPrevStack(copy);
    await loadPage(prev || undefined);
  }

  async function runTranscribe(job: Schema["AudioJob"]["type"]) {
  if (!job?.id || !job.audioPath) return;

  setRunning(job.id);
  setError("");

  try {
    const urlRes = await getUrl({
      path: job.audioPath,
      options: { expiresIn: 60 * 60 },
    });
    const audioUrl = urlRes.url.toString();

    const bucket = getStorageBucketName();
    if (!bucket) throw new Error("storage bucket name not found in amplify_outputs.json");

    const key = String(job.audioPath).replace(/^\/+/, "");
    const audioS3Uri = `s3://${bucket}/${key}`;

    // ✅ ここが重要：戻り値の形が data ラップされている場合がある
    const res = await (client.mutations as any).summarizeAudio({
      jobId: job.id,
      audioPath: job.audioPath,
      audioUrl,
      audioS3Uri,
    });

    // 可能性①：res.data に本体
    const resp = res?.data ?? res;
    const errs = res?.errors ?? resp?.errors;

    if (Array.isArray(errs) && errs.length) {
      throw new Error(errs.map((e: any) => e.message ?? String(e)).join("\n"));
    }

    const jobName = resp?.transcribeJobName as string | undefined;
    const st = resp?.status as string | undefined;

    // デバッグ用（必要なら一時的に）
    console.log("summarizeAudio response(raw):", res);
    console.log("summarizeAudio response(parsed):", resp);

    if (st === "FAILED") {
      await client.models.AudioJob.update({
        id: job.id,
        status: "FAILED",
        transcribeStatus: "FAILED",
        errorMessage: resp?.summaryText ?? "StartTranscriptionJob failed",
        completedAt: new Date().toISOString(),
      });
      throw new Error(resp?.summaryText ?? "StartTranscriptionJob failed");
    }

    if (!jobName) {
      await client.models.AudioJob.update({
        id: job.id,
        status: "FAILED",
        transcribeStatus: "FAILED",
        errorMessage:
          "No transcribeJobName returned from summarizeAudio (check handler logs; response may be wrapped in {data}).",
        completedAt: new Date().toISOString(),
      });
      throw new Error("No transcribeJobName returned from summarizeAudio");
    }

    await client.models.AudioJob.update({
      id: job.id,
      status: "RUNNING",
      transcribeJobName: jobName,
      transcribeStatus: "IN_PROGRESS",
      errorMessage: null,
      completedAt: null,
    });

    await refresh();
    alert("Transcribe started.");
  } catch (e: any) {
    console.error(e);
    setError(e?.message ?? String(e));
  } finally {
    setRunning("");
  }
}


  useEffect(() => {
    setPrevStack([]);
    setCurrentToken(undefined);
    setNextToken(undefined);
    loadPage(undefined);

    const t = window.setInterval(() => {
      refresh();
    }, 10_000);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, owner]);

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

        {loading && <span style={{ fontSize: 12, opacity: 0.7 }}>loading...</span>}
      </div>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        tenantId: <code>{tenantId}</code> / owner: <code>{owner}</code> / pageSize: <code>{PAGE_SIZE}</code>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "crimson" }}>
          error:
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{error}</pre>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>（このページにはジョブがありません）</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((j) => (
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
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>{j.status}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {j.recordedAt ? new Date(j.recordedAt).toLocaleString() : ""}
                </div>

                <div style={{ marginLeft: "auto" }}>
                  <button onClick={() => runTranscribe(j)} disabled={loading || running === j.id}>
                    {running === j.id ? "Running..." : "Run Transcribe"}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 12 }}>
                jobId: <code>{j.id}</code>
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
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{j.transcriptText}</pre>
                </div>
              )}

              {j.summaryText && (
                <div style={{ fontSize: 12 }}>
                  summary:
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{j.summaryText}</pre>
                </div>
              )}

              {j.errorMessage && (
                <div style={{ fontSize: 12, color: "crimson" }}>
                  error:
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{j.errorMessage}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
