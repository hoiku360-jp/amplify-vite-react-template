"use client";

import { useMemo, useState } from "react";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

export default function AudioUpload(props: { tenantId: string; owner: string }) {
  const { tenantId, owner } = props;

  const client = useMemo(() => generateClient<Schema>(), []);
  const [busy, setBusy] = useState(false);
  const [lastPath, setLastPath] = useState<string>("");
  const [lastJobId, setLastJobId] = useState<string>("");

  async function onPick(file: File | null) {
    if (!file) return;

    setBusy(true);
    setLastPath("");
    setLastJobId("");

    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const id = crypto.randomUUID();

      // ✅ S3へアップロード（identityId配下）
      const result = await uploadData({
        path: ({ identityId }) =>
          `tenants/${identityId}/${tenantId}/audio/${yyyy}/${mm}/${dd}/${id}-${file.name}`,
        data: file,
        options: {
          contentType: file.type || "audio/m4a",
        },
      }).result;

      setLastPath(result.path);

      // ✅ Upload成功したら AudioJob をDBに作成（PENDING）
      const createdAtIso = new Date().toISOString();

      const resp = await client.models.AudioJob.create({
        tenantId,
        owner,
        audioPath: result.path,
        recordedAt: createdAtIso,
        status: "PENDING",
        transcribeStatus: null,
        transcribeJobName: null,
        transcriptText: null,
        summaryText: null,
        errorMessage: null,
        completedAt: null,
      });

      if (resp.errors?.length) {
        throw new Error(resp.errors.map((e) => e.message).join("\n"));
      }

      // ✅ Amplifyの型差異に強い jobId 取得（単体 or 配列どちらでも潰れるように）
      const jobId =
        (resp.data as any)?.id ??
        (Array.isArray(resp.data) ? (resp.data as any[])[0]?.id : "") ??
        "";

      setLastJobId(jobId);

      alert("Uploaded & Job created!");
    } catch (e: any) {
      console.error(e);
      alert(`Upload failed: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>
        <div>音声ファイル（m4a / wav など）</div>
        <input
          type="file"
          accept="audio/*"
          disabled={busy}
          onChange={(ev) => onPick(ev.target.files?.[0] ?? null)}
        />
      </label>

      {lastPath && (
        <div style={{ fontSize: 12 }}>
          last upload path: <code>{lastPath}</code>
        </div>
      )}
      {lastJobId && (
        <div style={{ fontSize: 12 }}>
          created jobId: <code>{lastJobId}</code>
        </div>
      )}
    </div>
  );
}