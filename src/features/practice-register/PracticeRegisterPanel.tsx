import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { getUrl, uploadData } from "aws-amplify/storage";
import outputs from "../../../amplify_outputs.json";
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  owner: string;
};

type CategoryOption = "outdoor" | "indoor" | "life" | "event" | "environment";

type PublishOption = "global" | "tenant" | "private";

type DataClient = ReturnType<typeof generateClient<Schema>>;
type PracticeCodeCreateInput = Parameters<
  DataClient["models"]["PracticeCode"]["create"]
>[0];
type PracticeCodeUpdateInput = Parameters<
  DataClient["models"]["PracticeCode"]["update"]
>[0];
type AudioJobCreateInput = Parameters<
  DataClient["models"]["AudioJob"]["create"]
>[0];
type AudioJobUpdateInput = Parameters<
  DataClient["models"]["AudioJob"]["update"]
>[0];

type ModelError = {
  message?: string | null;
};

type OperationEnvelope<TData> = {
  data?: TData | null;
  errors?: ReadonlyArray<ModelError> | null;
};

type SummarizeAudioResult = {
  jobId?: string | null;
  transcriptText?: string | null;
  summaryText?: string | null;
  status?: string | null;
  transcribeJobName?: string | null;
};

type CleanupTranscriptResult = {
  originalText?: string | null;
  cleanedText?: string | null;
  status?: string | null;
  message?: string | null;
};

type AudioJobLike = {
  id?: string | null;
  status?: string | null;
  transcribeJobName?: string | null;
  transcribeStatus?: string | null;
  transcriptText?: string | null;
  summaryText?: string | null;
  errorMessage?: string | null;
  sourceEntityId?: string | null;
};

type PracticeDraftInfo = {
  id: string;
  practiceCode: string;
};

type SummarizeAudioMutation = (
  args: unknown,
) => Promise<OperationEnvelope<SummarizeAudioResult> | SummarizeAudioResult>;

type CleanupTranscriptMutation = (
  args: unknown,
) => Promise<
  OperationEnvelope<CleanupTranscriptResult> | CleanupTranscriptResult
>;

type MutationClient = {
  summarizeAudio?: SummarizeAudioMutation;
  cleanupTranscriptText?: CleanupTranscriptMutation;
};

type UnknownRecord = Record<string, unknown>;

const CATEGORY_OPTIONS: Array<{ value: CategoryOption; label: string }> = [
  { value: "outdoor", label: "外遊び" },
  { value: "indoor", label: "室内遊び" },
  { value: "life", label: "生活（身支度/食事/排泄など）" },
  { value: "event", label: "行事" },
  { value: "environment", label: "環境構成" },
];

const PUBLISH_OPTIONS: Array<{ value: PublishOption; label: string }> = [
  { value: "global", label: "公開" },
  { value: "tenant", label: "園内" },
  { value: "private", label: "非公開" },
];

function toVisibilityAndScope(publish: PublishOption): {
  visibility: string;
  publishScope: string;
} {
  switch (publish) {
    case "global":
      return { visibility: "public", publishScope: "global" };
    case "tenant":
      return { visibility: "public", publishScope: "tenant" };
    case "private":
    default:
      return { visibility: "private", publishScope: "self" };
  }
}

function buildPracticeCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `PR-${y}${m}${d}-${hh}${mm}${ss}-${rand}`;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w.-]/g, "_");
}

function toS3Uri(bucketName: string, key: string): string {
  return `s3://${bucketName}/${key}`;
}

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null) return null;
  return value as UnknownRecord;
}

function readStringField(record: UnknownRecord | null, key: string): string {
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}

function getStorageBucketName(): string {
  const root = asRecord(outputs);
  const storage = asRecord(root?.storage);

  const bucketName =
    readStringField(storage, "bucket_name") ||
    readStringField(storage, "bucketName") ||
    readStringField(storage, "bucket") ||
    readStringField(storage, "aws_bucket_name") ||
    readStringField(storage, "aws_user_files_s3_bucket") ||
    readStringField(root, "bucket_name") ||
    readStringField(root, "bucketName");

  if (!bucketName) {
    throw new Error(
      "amplify_outputs.json から Storage の bucket 名を取得できませんでした。",
    );
  }

  return bucketName;
}

function formatModelErrors(
  errors: ReadonlyArray<ModelError> | null | undefined,
  fallback: string,
): string {
  if (!errors?.length) return fallback;

  const message = errors
    .map((e) => e.message ?? "")
    .filter(Boolean)
    .join("\n");

  return message || fallback;
}

function getOperationErrors<TData>(
  res: OperationEnvelope<TData> | TData | null | undefined,
): ReadonlyArray<ModelError> | null {
  if (!res || typeof res !== "object") return null;
  const maybeEnvelope = res as OperationEnvelope<TData>;

  return Array.isArray(maybeEnvelope.errors) ? maybeEnvelope.errors : null;
}

function getOperationData<TData>(
  res: OperationEnvelope<TData> | TData | null | undefined,
): TData | null {
  if (!res) return null;

  if (typeof res === "object" && "data" in res) {
    return (res as OperationEnvelope<TData>).data ?? null;
  }

  return res as TData;
}

function normalizeStatus(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toUpperCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildDraftName(file: File | null): string {
  if (!file) return "Practice下書き";
  return file.name.replace(/\.[^/.]+$/, "") || "音声Practice下書き";
}

export default function PracticeRegisterPanel(props: Props) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const tenantId = "demo-tenant";

  const [category, setCategory] = useState<CategoryOption>("outdoor");
  const [publish, setPublish] = useState<PublishOption>("tenant");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState("");

  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [checkingResult, setCheckingResult] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [createdPracticeId, setCreatedPracticeId] = useState("");
  const [createdPracticeCode, setCreatedPracticeCode] = useState("");
  const [createdStatus, setCreatedStatus] = useState("");
  const [createdName, setCreatedName] = useState("");
  const [uploadedAudioKey, setUploadedAudioKey] = useState("");

  const [createdAudioJobId, setCreatedAudioJobId] = useState("");
  const [createdTranscribeJobName, setCreatedTranscribeJobName] = useState("");
  const [mutationStatus, setMutationStatus] = useState("");

  async function ensurePracticeDraft(): Promise<PracticeDraftInfo> {
    if (createdPracticeId && createdPracticeCode) {
      return {
        id: createdPracticeId,
        practiceCode: createdPracticeCode,
      };
    }

    const { visibility, publishScope } = toVisibilityAndScope(publish);
    const practiceCode = buildPracticeCode();
    const nowIso = new Date().toISOString();
    const draftName = buildDraftName(selectedFile);

    const createPayload: PracticeCodeCreateInput = {
      practice_code: practiceCode,
      name: draftName,
      memo: "",
      source_type: "practiceRegister",
      status: "DRAFT",
      version: 1,
      category_name: "",
      category_code: "",
      source_ref: "",
      source_url: "",
      tenantId,
      createdBy: owner,
      updatedBy: owner,
      owner,
      ownerType: "user",
      visibility,
      publishScope,
      practiceCategory: category,
      practiceSourceType: selectedFile ? "audio" : "text",
      audioKey: "",
      recordedAt: nowIso,
      transcriptKey: "",
      transcriptText: transcriptText.trim(),
      transcribeJobName: "",
      transcribeStatus: "",
      aiStatus: "PENDING",
      aiModel: "",
      aiRawJson: "",
      errorMessage: "",
    } as PracticeCodeCreateInput;

    const createPracticeResult =
      await client.models.PracticeCode.create(createPayload);

    if (createPracticeResult.errors?.length) {
      throw new Error(
        formatModelErrors(
          createPracticeResult.errors,
          "PracticeCode の作成に失敗しました。",
        ),
      );
    }

    const id = String(createPracticeResult.data?.id ?? "");
    if (!id) {
      throw new Error("PracticeCode の id を取得できませんでした。");
    }

    setCreatedPracticeId(id);
    setCreatedPracticeCode(practiceCode);
    setCreatedStatus("DRAFT");
    setCreatedName(draftName);

    return {
      id,
      practiceCode,
    };
  }

  async function getAudioJobById(jobId: string): Promise<AudioJobLike | null> {
    const result = await client.models.AudioJob.get({ id: jobId });

    if (result.errors?.length) {
      throw new Error(
        formatModelErrors(result.errors, "AudioJob の取得に失敗しました。"),
      );
    }

    return (result.data ?? null) as AudioJobLike | null;
  }

  async function waitForTranscriptJob(
    jobId: string,
  ): Promise<AudioJobLike | null> {
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i += 1) {
      await sleep(3000);

      const job = await getAudioJobById(jobId);
      const status = normalizeStatus(job?.status);

      if (status === "SUCCEEDED" || status === "FAILED") {
        return job;
      }
    }

    return null;
  }

  async function applyTranscriptJobResult(job: AudioJobLike): Promise<void> {
    const status = normalizeStatus(job.status);

    if (status === "FAILED") {
      const msg = job.errorMessage || "文字起こしに失敗しました。";
      setCreatedStatus("FAILED");
      throw new Error(msg);
    }

    const text = String(job.transcriptText ?? "").trim();
    if (!text) {
      throw new Error(
        "文字起こしは完了していますが、transcriptText が空です。",
      );
    }

    const practiceId = createdPracticeId || String(job.sourceEntityId ?? "");
    const jobName =
      String(job.transcribeJobName ?? "").trim() || createdTranscribeJobName;

    setTranscriptText(text);
    setCreatedStatus("REVIEW");
    setMutationStatus(status);
    setCreatedTranscribeJobName(jobName);

    if (practiceId) {
      const updatePayload: PracticeCodeUpdateInput = {
        id: practiceId,
        practice_code: createdPracticeCode,
        tenantId,
        owner,
        status: "REVIEW",
        practiceCategory: category,
        transcriptText: text,
        transcribeJobName: jobName,
        transcribeStatus: job.transcribeStatus ?? "COMPLETED",
        aiStatus: "PENDING",
        errorMessage: "",
        updatedBy: owner,
      } as PracticeCodeUpdateInput;

      const updatePracticeResult =
        await client.models.PracticeCode.update(updatePayload);

      if (updatePracticeResult.errors?.length) {
        throw new Error(
          formatModelErrors(
            updatePracticeResult.errors,
            "PracticeCode への文字起こし結果反映に失敗しました。",
          ),
        );
      }
    }

    setMessage(
      "文字起こし結果を transcript text に反映しました。必要に応じて AI クリーンアップ後、音声メモを保存してください。",
    );
  }

  async function handleTranscribeAudio() {
    if (!selectedFile) {
      setError("先に音声ファイルを選択してください。");
      return;
    }

    setTranscribing(true);
    setError("");
    setMessage("");
    setMutationStatus("");

    try {
      const draft = await ensurePracticeDraft();
      const { visibility, publishScope } = toVisibilityAndScope(publish);
      const nowIso = new Date().toISOString();

      setMessage("音声ファイルをアップロード中です...");

      const safeFileName = sanitizeFileName(selectedFile.name);
      const uploadId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`;

      const audioKey = `practice-audio/${tenantId}/${owner}/${draft.practiceCode}/${uploadId}-${safeFileName}`;

      await uploadData({
        path: audioKey,
        data: selectedFile,
        options: {
          contentType: selectedFile.type || "application/octet-stream",
        },
      }).result;

      setUploadedAudioKey(audioKey);

      const updatePracticeAudioPayload: PracticeCodeUpdateInput = {
        id: draft.id,
        practice_code: draft.practiceCode,
        tenantId,
        owner,
        status: "TRANSCRIBING",
        practiceCategory: category,
        visibility,
        publishScope,
        practiceSourceType: "audio",
        audioKey,
        recordedAt: nowIso,
        transcriptText: transcriptText.trim(),
        transcribeStatus: "IN_PROGRESS",
        aiStatus: "PENDING",
        errorMessage: "",
        updatedBy: owner,
      } as PracticeCodeUpdateInput;

      const updatePracticeResult = await client.models.PracticeCode.update(
        updatePracticeAudioPayload,
      );

      if (updatePracticeResult.errors?.length) {
        throw new Error(
          formatModelErrors(
            updatePracticeResult.errors,
            "PracticeCode の音声情報更新に失敗しました。",
          ),
        );
      }

      setCreatedStatus("TRANSCRIBING");

      const createAudioJobPayload: AudioJobCreateInput = {
        tenantId,
        owner,
        jobType: "PRACTICE",
        sourceEntityType: "PracticeCode",
        sourceEntityId: draft.id,
        audioPath: audioKey,
        recordedAt: nowIso,
        status: "UPLOADING",
        transcribeJobName: "",
        transcribeStatus: "",
        transcriptText: "",
        summaryText: "",
        errorMessage: "",
      } as AudioJobCreateInput;

      const createAudioJobResult = await client.models.AudioJob.create(
        createAudioJobPayload,
      );

      if (createAudioJobResult.errors?.length) {
        throw new Error(
          formatModelErrors(
            createAudioJobResult.errors,
            "AudioJob の作成に失敗しました。",
          ),
        );
      }

      const audioJobId = String(createAudioJobResult.data?.id ?? "");
      if (!audioJobId) {
        throw new Error("AudioJob の id を取得できませんでした。");
      }

      setCreatedAudioJobId(audioJobId);
      setMessage("文字起こしジョブを開始中です...");

      const urlResult = await getUrl({ path: audioKey });
      const audioUrl = urlResult.url.toString();
      const bucketName = getStorageBucketName();
      const audioS3Uri = toS3Uri(bucketName, audioKey);

      let summarizeResult:
        | OperationEnvelope<SummarizeAudioResult>
        | SummarizeAudioResult;

      const mutationClient = client.mutations as unknown as MutationClient;
      const summarizeRunner = mutationClient.summarizeAudio;
      if (!summarizeRunner) {
        throw new Error(
          "summarizeAudio が client.mutations に見つかりません。",
        );
      }

      const summarizeArgs = {
        jobId: audioJobId,
        audioPath: audioKey,
        audioUrl,
        audioS3Uri,
      };

      try {
        summarizeResult = await summarizeRunner(summarizeArgs);
      } catch {
        summarizeResult = await summarizeRunner({ input: summarizeArgs });
      }

      const summarizeErrors = getOperationErrors(summarizeResult);
      if (summarizeErrors?.length) {
        throw new Error(
          formatModelErrors(summarizeErrors, "summarizeAudio に失敗しました。"),
        );
      }

      const summarizeData =
        getOperationData<SummarizeAudioResult>(summarizeResult);
      const summarizeStatus = normalizeStatus(summarizeData?.status);
      const transcribeJobName = String(
        summarizeData?.transcribeJobName ?? "",
      ).trim();

      if (summarizeStatus === "FAILED") {
        const msg =
          summarizeData?.summaryText ?? "StartTranscriptionJob failed.";

        const failedAudioJobPayload: AudioJobUpdateInput = {
          id: audioJobId,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: msg,
          completedAt: new Date().toISOString(),
        } as AudioJobUpdateInput;

        await client.models.AudioJob.update(failedAudioJobPayload);

        const failedPracticePayload: PracticeCodeUpdateInput = {
          id: draft.id,
          practice_code: draft.practiceCode,
          tenantId,
          owner,
          status: "ERROR",
          errorMessage: msg,
          updatedBy: owner,
        } as PracticeCodeUpdateInput;

        await client.models.PracticeCode.update(failedPracticePayload);

        setCreatedStatus("ERROR");
        throw new Error(msg);
      }

      if (!transcribeJobName) {
        const msg =
          "summarizeAudio から transcribeJobName が返りませんでした。";

        const failedAudioJobPayload: AudioJobUpdateInput = {
          id: audioJobId,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: msg,
          completedAt: new Date().toISOString(),
        } as AudioJobUpdateInput;

        await client.models.AudioJob.update(failedAudioJobPayload);

        const failedPracticePayload: PracticeCodeUpdateInput = {
          id: draft.id,
          practice_code: draft.practiceCode,
          tenantId,
          owner,
          status: "ERROR",
          errorMessage: msg,
          updatedBy: owner,
        } as PracticeCodeUpdateInput;

        await client.models.PracticeCode.update(failedPracticePayload);

        setCreatedStatus("ERROR");
        throw new Error(msg);
      }

      const runningAudioJobPayload: AudioJobUpdateInput = {
        id: audioJobId,
        status: "RUNNING",
        transcribeJobName,
        transcribeStatus: "IN_PROGRESS",
        errorMessage: null,
        completedAt: null,
      } as AudioJobUpdateInput;

      await client.models.AudioJob.update(runningAudioJobPayload);

      const transcribingPracticePayload: PracticeCodeUpdateInput = {
        id: draft.id,
        practice_code: draft.practiceCode,
        tenantId,
        owner,
        status: "TRANSCRIBING",
        transcribeJobName,
        transcribeStatus: "IN_PROGRESS",
        errorMessage: "",
        updatedBy: owner,
      } as PracticeCodeUpdateInput;

      await client.models.PracticeCode.update(transcribingPracticePayload);

      setCreatedTranscribeJobName(transcribeJobName);
      setMutationStatus(summarizeData?.status ?? "RUNNING");

      setMessage(
        "文字起こし中です。完了まで数分かかる場合があります。画面がタイムアウトした場合は「結果を再確認」を押してください。",
      );

      const completedJob = await waitForTranscriptJob(audioJobId);

      if (!completedJob) {
        setMessage(
          "まだ文字起こし中です。少し待ってから「結果を再確認」を押してください。",
        );
        return;
      }

      await applyTranscriptJobResult(completedJob);
    } catch (e) {
      console.error(e);
      const msg =
        e instanceof Error ? e.message : "文字起こしの開始に失敗しました。";
      setError(msg);
      setMessage("");
    } finally {
      setTranscribing(false);
    }
  }

  async function handleCheckTranscriptResult() {
    if (!createdAudioJobId) {
      setError(
        "確認対象の AudioJob がありません。先に文字起こしを実行してください。",
      );
      return;
    }

    setCheckingResult(true);
    setError("");
    setMessage("");

    try {
      const job = await getAudioJobById(createdAudioJobId);

      if (!job) {
        setMessage(`AudioJob がまだ見つかりません: ${createdAudioJobId}`);
        return;
      }

      const status = normalizeStatus(job.status);

      if (status === "SUCCEEDED") {
        await applyTranscriptJobResult(job);
        return;
      }

      if (status === "FAILED") {
        const msg = job.errorMessage || "文字起こしに失敗しました。";
        setCreatedStatus("FAILED");
        setError(`文字起こしエラー: ${msg}`);
        return;
      }

      setMutationStatus(status || "RUNNING");
      setMessage(
        `まだ文字起こし中です。status=${status || "(empty)"}, transcribeStatus=${
          job.transcribeStatus ?? "(empty)"
        }。少し待ってから再度「結果を再確認」を押してください。`,
      );
    } catch (e) {
      console.error(e);
      setError(`結果確認エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCheckingResult(false);
    }
  }

  async function handleCleanupTranscript() {
    const text = transcriptText.trim();

    if (!text) {
      setError(
        "先に文字起こしを実行するか、transcript text を入力してください。",
      );
      return;
    }

    setCleaning(true);
    setError("");
    setMessage("");

    try {
      const mutationClient = client.mutations as unknown as MutationClient;
      const cleanupRunner = mutationClient.cleanupTranscriptText;
      if (!cleanupRunner) {
        throw new Error(
          "cleanupTranscriptText が client.mutations に見つかりません。",
        );
      }

      const args = {
        practiceCode: createdPracticeCode || null,
        childNames: [],
        transcriptText: text,
      };

      let result:
        | OperationEnvelope<CleanupTranscriptResult>
        | CleanupTranscriptResult;

      try {
        result = await cleanupRunner(args);
      } catch {
        result = await cleanupRunner({ input: args });
      }

      const errors = getOperationErrors(result);
      if (errors?.length) {
        throw new Error(
          formatModelErrors(errors, "AIクリーンアップに失敗しました。"),
        );
      }

      const data = getOperationData<CleanupTranscriptResult>(result);
      const cleanedText = String(data?.cleanedText ?? "").trim();

      if (!cleanedText) {
        throw new Error("AIクリーンアップ結果が空です。");
      }

      setTranscriptText(cleanedText);
      setMessage(
        data?.message
          ? `AIクリーンアップを反映しました。${data.message}`
          : "AIクリーンアップを反映しました。",
      );
    } catch (e) {
      console.error(e);
      setError(
        `AIクリーンアップエラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setCleaning(false);
    }
  }

  async function handleSaveTranscript() {
    const text = transcriptText.trim();

    if (!text) {
      setError(
        "transcript text が空です。音声入力、手入力、または文字起こし結果を入力してください。",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const draft = await ensurePracticeDraft();
      const { visibility, publishScope } = toVisibilityAndScope(publish);
      const nowIso = new Date().toISOString();

      const updatePayload: PracticeCodeUpdateInput = {
        id: draft.id,
        practice_code: draft.practiceCode,
        tenantId,
        owner,
        status: "REVIEW",
        name: createdName || buildDraftName(selectedFile),
        source_type: "practiceRegister",
        version: 1,
        practiceCategory: category,
        visibility,
        publishScope,
        practiceSourceType: uploadedAudioKey ? "audio" : "text",
        audioKey: uploadedAudioKey,
        recordedAt: nowIso,
        transcriptText: text,
        transcribeJobName: createdTranscribeJobName,
        transcribeStatus: createdAudioJobId ? "COMPLETED" : "MANUAL",
        aiStatus: "PENDING",
        errorMessage: "",
        updatedBy: owner,
      } as PracticeCodeUpdateInput;

      const updatePracticeResult =
        await client.models.PracticeCode.update(updatePayload);

      if (updatePracticeResult.errors?.length) {
        throw new Error(
          formatModelErrors(
            updatePracticeResult.errors,
            "PracticeCode への保存に失敗しました。",
          ),
        );
      }

      setCreatedStatus("REVIEW");
      setMessage(
        "音声メモを保存しました。次に Practice一覧（確認用）で「AIで名前と要約を作る」を実行してください。",
      );
    } catch (e) {
      console.error(e);
      setError(
        `音声メモ保存エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || transcribing || checkingResult || cleaning;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Practice登録</h2>

      <div
        style={{
          display: "grid",
          gap: 16,
          maxWidth: 840,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>1. カテゴリー</div>
          <div style={{ display: "grid", gap: 8 }}>
            {CATEGORY_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: "flex", gap: 8 }}>
                <input
                  type="radio"
                  name="practice-category"
                  value={opt.value}
                  checked={category === opt.value}
                  disabled={busy}
                  onChange={() => setCategory(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>2. 公開設定</div>
          <div style={{ display: "grid", gap: 8 }}>
            {PUBLISH_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: "flex", gap: 8 }}>
                <input
                  type="radio"
                  name="practice-publish"
                  value={opt.value}
                  checked={publish === opt.value}
                  disabled={busy}
                  onChange={() => setPublish(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            3. 音声ファイルを選択（任意）
          </div>
          <input
            type="file"
            accept="audio/*,.m4a,.mp3,.wav,.mp4,.webm"
            disabled={busy}
            onChange={(e) => {
              setSelectedFile(e.target.files?.[0] ?? null);
              setError("");
              setMessage("");
            }}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Windows PCの音声入力や iPad/Siri
            で直接入力する場合、音声ファイルは不要です。
          </div>
          {selectedFile ? (
            <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>
              選択中: {selectedFile.name}
            </div>
          ) : null}
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            4. transcript text
          </div>
          <textarea
            value={transcriptText}
            disabled={busy}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="音声から自動入力、または手入力できます。Windows PCの音声入力や iPad/Siri でここに入力してください。"
            style={{
              width: "100%",
              minHeight: 220,
              boxSizing: "border-box",
              padding: 10,
              lineHeight: 1.6,
              fontFamily: "inherit",
              fontSize: 14,
            }}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            入力文字数: {transcriptText.trim().length}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={busy || !selectedFile}
            onClick={handleTranscribeAudio}
          >
            {transcribing ? "文字起こし中..." : "文字起こし"}
          </button>

          <button
            type="button"
            disabled={busy || !createdAudioJobId}
            onClick={handleCheckTranscriptResult}
          >
            {checkingResult ? "確認中..." : "結果を再確認"}
          </button>

          <button
            type="button"
            disabled={busy || !transcriptText.trim()}
            onClick={handleCleanupTranscript}
          >
            {cleaning ? "クリーンアップ中..." : "AIによるクリーンアップ"}
          </button>

          <button
            type="button"
            disabled={busy || !transcriptText.trim()}
            onClick={handleSaveTranscript}
          >
            {saving ? "保存中..." : "音声メモを保存"}
          </button>
        </div>

        {error ? (
          <div
            style={{
              color: "#b00020",
              whiteSpace: "pre-wrap",
              border: "1px solid #f2b8b5",
              background: "#fff8f8",
              padding: 10,
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              color: "#0b5",
              whiteSpace: "pre-wrap",
              border: "1px solid #b7e4c7",
              background: "#f6fff8",
              padding: 10,
              borderRadius: 6,
            }}
          >
            {message}
          </div>
        ) : null}

        {createdPracticeCode ? (
          <div
            style={{
              display: "grid",
              gap: 4,
              fontSize: 13,
              borderTop: "1px solid #eee",
              paddingTop: 12,
              color: "#333",
            }}
          >
            <div>
              <strong>PracticeCode:</strong> {createdPracticeCode}
            </div>
            <div>
              <strong>Status:</strong> {createdStatus || "(未設定)"}
            </div>
            <div>
              <strong>Name:</strong> {createdName || "(未設定)"}
            </div>
            {uploadedAudioKey ? (
              <div>
                <strong>AudioKey:</strong> {uploadedAudioKey}
              </div>
            ) : null}
            {createdAudioJobId ? (
              <div>
                <strong>AudioJob:</strong> {createdAudioJobId}
              </div>
            ) : null}
            {createdTranscribeJobName ? (
              <div>
                <strong>TranscribeJob:</strong> {createdTranscribeJobName}
              </div>
            ) : null}
            {mutationStatus ? (
              <div>
                <strong>MutationStatus:</strong> {mutationStatus}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        style={{ maxWidth: 840, marginTop: 16, color: "#555", fontSize: 13 }}
      >
        保存後は、Practice一覧（確認用）で「AIで名前と要約を作る」→
        「Ability候補を生成」→「採用」→「本登録する」の順に進めてください。
      </div>
    </div>
  );
}
