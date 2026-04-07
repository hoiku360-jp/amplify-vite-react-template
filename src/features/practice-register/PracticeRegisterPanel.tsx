import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl } from "aws-amplify/storage";
import outputs from "../../../amplify_outputs.json";
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  owner: string;
};

type CategoryOption =
  | "outdoor"
  | "indoor"
  | "life"
  | "event"
  | "environment";

type PublishOption = "global" | "tenant" | "private";

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
  return fileName.replace(/[^\w.\-]/g, "_");
}

function toS3Uri(bucketName: string, key: string): string {
  return `s3://${bucketName}/${key}`;
}

function getStorageBucketName(): string {
  const bucketName =
    (outputs as any)?.storage?.bucket_name ??
    (outputs as any)?.storage?.aws_user_files_s3_bucket;

  if (!bucketName) {
    throw new Error("amplify_outputs.json から Storage の bucket 名を取得できませんでした。");
  }

  return bucketName;
}

export default function PracticeRegisterPanel(props: Props) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const tenantId = "demo-tenant";

  const [category, setCategory] = useState<CategoryOption>("outdoor");
  const [publish, setPublish] = useState<PublishOption>("tenant");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [createdPracticeCode, setCreatedPracticeCode] = useState("");
  const [createdStatus, setCreatedStatus] = useState("");
  const [createdName, setCreatedName] = useState("");
  const [uploadedAudioKey, setUploadedAudioKey] = useState("");

  const [createdAudioJobId, setCreatedAudioJobId] = useState("");
  const [createdTranscribeJobName, setCreatedTranscribeJobName] = useState("");
  const [mutationStatus, setMutationStatus] = useState("");

  async function handleCreateDraft() {
    if (!selectedFile) {
      setError("音声ファイルを選択してください。");
      return;
    }

    setSaving(true);
    setError("");
    setMutationStatus("");
    setCreatedAudioJobId("");
    setCreatedTranscribeJobName("");

    try {
      const { visibility, publishScope } = toVisibilityAndScope(publish);
      const practiceCode = buildPracticeCode();
      const nowIso = new Date().toISOString();

      const draftName =
        selectedFile.name.replace(/\.[^/.]+$/, "") || "音声Practice下書き";

      const createPracticeResult = await client.models.PracticeCode.create({
        practice_code: practiceCode,
        name: draftName,
        memo: "",
        source_type: "practiceRegister",
        status: "UPLOADING",
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
        practiceSourceType: "audio",
        audioKey: "",
        recordedAt: nowIso,
        transcriptKey: "",
        transcriptText: "",
        transcribeJobName: "",
        transcribeStatus: "",
        aiStatus: "PENDING",
        aiModel: "",
        aiRawJson: "",
        errorMessage: "",
      });

      if (createPracticeResult.errors?.length) {
        throw new Error(createPracticeResult.errors.map((e) => e.message).join("\n"));
      }

      const createdPracticeId = createPracticeResult.data?.id;
      if (!createdPracticeId) {
        throw new Error("PracticeCode の id を取得できませんでした。");
      }

      const safeFileName = sanitizeFileName(selectedFile.name);
      const audioKey = `practice-audio/${tenantId}/${owner}/${practiceCode}/${safeFileName}`;

      await uploadData({
        path: audioKey,
        data: selectedFile,
        options: {
          contentType: selectedFile.type || "application/octet-stream",
        },
      }).result;

      const updatePracticeResult = await client.models.PracticeCode.update({
        id: createdPracticeId,
        practice_code: practiceCode,
        tenantId,
        owner,
        status: "TRANSCRIBING",
        practiceCategory: category,
        visibility,
        audioKey,
        recordedAt: nowIso,
        updatedBy: owner,
      });

      if (updatePracticeResult.errors?.length) {
        throw new Error(updatePracticeResult.errors.map((e) => e.message).join("\n"));
      }

      const createAudioJobResult = await client.models.AudioJob.create({
        tenantId,
        owner,
        jobType: "PRACTICE",
        sourceEntityType: "PracticeCode",
        sourceEntityId: createdPracticeId,
        audioPath: audioKey,
        recordedAt: nowIso,
        status: "UPLOADING",
        transcribeJobName: "",
        transcribeStatus: "",
        transcriptText: "",
        summaryText: "",
        errorMessage: "",
      });

      if (createAudioJobResult.errors?.length) {
        throw new Error(createAudioJobResult.errors.map((e) => e.message).join("\n"));
      }

      const actualJobId = createAudioJobResult.data?.id;
      if (!actualJobId) {
        throw new Error("AudioJob の id を取得できませんでした。");
      }

      const urlResult = await getUrl({
        path: audioKey,
      });

      const audioUrl = urlResult.url.toString();
      const bucketName = getStorageBucketName();

      const summarizeResult = await client.mutations.summarizeAudio({
        jobId: actualJobId,
        audioPath: audioKey,
        audioUrl,
        audioS3Uri: toS3Uri(bucketName, audioKey),
      });

      if (summarizeResult.errors?.length) {
        throw new Error(summarizeResult.errors.map((e) => e.message).join("\n"));
      }

      setCreatedPracticeCode(practiceCode);
      setCreatedStatus("TRANSCRIBING");
      setCreatedName(draftName);
      setUploadedAudioKey(audioKey);
      setCreatedAudioJobId(actualJobId);
      setCreatedTranscribeJobName(
        summarizeResult.data?.transcribeJobName ?? ""
      );
      setMutationStatus(summarizeResult.data?.status ?? "STARTED");
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Practice 下書き作成または音声登録に失敗しました。";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Practice登録</h2>

      <div
        style={{
          display: "grid",
          gap: 16,
          maxWidth: 720,
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
                  onChange={() => setPublish(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>3. 音声ファイル</div>
          <input
            type="file"
            accept=".m4a,.mp3,.wav,.mp4,audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
          />
          <div style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
            選択中: {selectedFile ? selectedFile.name : "未選択"}
          </div>
        </div>

        <div>
          <button onClick={handleCreateDraft} disabled={saving}>
            {saving ? "作成中..." : "Practice下書きを作成して音声を登録"}
          </button>
        </div>

        <div
          style={{
            padding: 12,
            background: "#fafafa",
            borderRadius: 6,
            fontSize: 14,
            color: "#555",
          }}
        >
          この段階では、Practice 下書き作成・音声アップロード・AudioJob 作成・
          Transcribe 起動までを行います。
        </div>

        {error ? (
          <div
            style={{
              padding: 12,
              background: "#fff3f3",
              color: "#b00020",
              borderRadius: 6,
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </div>
        ) : null}

        {createdPracticeCode ? (
          <div
            style={{
              padding: 12,
              background: "#f6fbff",
              borderRadius: 6,
              whiteSpace: "pre-wrap",
            }}
          >
            <div><strong>下書き作成OK</strong></div>
            <div>practice_code: {createdPracticeCode}</div>
            <div>name: {createdName}</div>
            <div>status: {createdStatus}</div>
            <div>tenantId: {tenantId}</div>
            <div>audioKey: {uploadedAudioKey || "(未設定)"}</div>
            <div>audioJobId: {createdAudioJobId || "(未作成)"}</div>
            <div>transcribeJobName: {createdTranscribeJobName || "(未開始)"}</div>
            <div>mutationStatus: {mutationStatus || "(未実行)"}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}