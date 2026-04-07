import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import outputs from "../../../amplify_outputs.json";
import type { Schema } from "../../../amplify/data/resource";

function todayYYYYMMDD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 仮の子ども一覧（後で Child モデルに置き換え）
const MORNING_CHECK_CHILDREN = [
  "さくら",
  "たろう",
  "みお",
  "ゆうと",
  "りん",
] as const;

type ObservationAbility = {
  abilityCode: string;
  abilityName: string;
  startingAge: number;
  score: number;
  episodes: string[];
};

type ObservationSummary = {
  practiceCode: string;
  abilities: ObservationAbility[];
};

type AttendanceDraft = {
  checked: boolean;
  checkedAt: string;
  note: string;
};

type AttendancePayload = {
  kind: "morningAttendance";
  childName: string;
  checked: boolean;
  checkedAt: string | null;
  note: string;
  tags: string[];
};

type TranscriptDraft = {
  childNamesText: string;
  transcriptText: string;
  audioFile: File | null;
  audioFileName: string;
  audioJobId: string;
  audioStatusText: string;
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

function safeParseObservationSummary(
  value?: string | null
): ObservationSummary | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ObservationSummary;
    if (!parsed || !Array.isArray(parsed.abilities)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeParseAttendancePayload(
  value?: string | null
): AttendancePayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as AttendancePayload;
    if (parsed?.kind !== "morningAttendance") return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeParsePlannedTranscriptPayload(
  value?: string | null
): PlannedTranscriptPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as PlannedTranscriptPayload;
    if (parsed?.kind !== "plannedTranscript") return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeParseStructuredObservationPayload(
  value?: string | null
): StructuredObservationPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StructuredObservationPayload;
    if (parsed?.kind !== "structuredObservation") return null;
    return parsed;
  } catch {
    return null;
  }
}

async function listAll(modelApi: any, options?: Record<string, unknown>) {
  const results: any[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res: any = await modelApi.list({
      ...(options ?? {}),
      nextToken,
    });

    if (Array.isArray(res?.data) && res.data.length > 0) {
      results.push(...res.data);
    }

    nextToken = res?.nextToken;
  } while (nextToken);

  return results;
}

function formatRecordType(type?: string | null) {
  switch (type) {
    case "MEMO":
      return "メモ";
    case "APPEND_NOTE":
      return "追記";
    case "CHECK":
      return "チェック";
    case "TRANSCRIPT":
      return "音声メモ";
    case "STRUCTURED_OBSERVATION":
      return "構造化記録";
    default:
      return type ?? "-";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP");
}

function nowHHmm() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function createEmptyAttendanceRow(): AttendanceDraft {
  return {
    checked: false,
    checkedAt: "",
    note: "",
  };
}

function createEmptyTranscriptDraft(): TranscriptDraft {
  return {
    childNamesText: "",
    transcriptText: "",
    audioFile: null,
    audioFileName: "",
    audioJobId: "",
    audioStatusText: "",
  };
}

function isMorningCheckItem(item: Schema["ScheduleDayItem"]["type"]) {
  return item.title === "朝礼";
}

function buildInitialAttendanceDrafts(
  items: Array<Schema["ScheduleDayItem"]["type"]>,
  records: Array<Schema["ScheduleRecord"]["type"]>
): Record<string, Record<string, AttendanceDraft>> {
  const drafts: Record<string, Record<string, AttendanceDraft>> = {};

  for (const item of items) {
    if (!isMorningCheckItem(item)) continue;

    drafts[item.id] = {};
    for (const childName of MORNING_CHECK_CHILDREN) {
      drafts[item.id][childName] = createEmptyAttendanceRow();
    }

    const itemCheckRecords = records
      .filter((r) => r.scheduleDayItemId === item.id && r.recordType === "CHECK")
      .sort((a, b) =>
        String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
      );

    for (const record of itemCheckRecords) {
      const payload = safeParseAttendancePayload(record.payloadJson);
      if (!payload) continue;
      if (!(payload.childName in drafts[item.id])) continue;

      drafts[item.id][payload.childName] = {
        checked: !!payload.checked,
        checkedAt: payload.checkedAt ?? "",
        note: payload.note ?? "",
      };
    }
  }

  return drafts;
}

function buildAttendanceBody(childName: string, draft: AttendanceDraft) {
  return `${childName} / ${draft.checked ? "OK" : "NG"} / ${
    draft.checkedAt || "-"
  } / ${draft.note || "-"}`;
}

function buildAttendancePayload(
  childName: string,
  draft: AttendanceDraft
): AttendancePayload {
  return {
    kind: "morningAttendance",
    childName,
    checked: draft.checked,
    checkedAt: draft.checked ? draft.checkedAt || null : null,
    note: draft.note,
    tags: [`childName:${childName}`, "attendance", "morning"],
  };
}

function buildTranscriptPayload(
  practiceCode: string | null | undefined,
  childNames: string[],
  transcriptText: string
): PlannedTranscriptPayload {
  return {
    kind: "plannedTranscript",
    practiceCode: practiceCode ?? null,
    childNames,
    transcriptText,
    tags: [
      ...childNames.map((name) => `childName:${name}`),
      "planned",
      "transcript",
    ],
  };
}

function parseChildNamesText(input: string): string[] {
  return input
    .split(/[、,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function getLatestAttendanceByChild(
  itemId: string,
  records: Array<Schema["ScheduleRecord"]["type"]>
) {
  const latestMap = new Map<
    string,
    { record: Schema["ScheduleRecord"]["type"]; payload: AttendancePayload }
  >();

  const itemCheckRecords = records
    .filter((r) => r.scheduleDayItemId === itemId && r.recordType === "CHECK")
    .sort((a, b) =>
      String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
    );

  for (const record of itemCheckRecords) {
    const payload = safeParseAttendancePayload(record.payloadJson);
    if (!payload) continue;
    latestMap.set(payload.childName, { record, payload });
  }

  return MORNING_CHECK_CHILDREN.map((childName) => {
    const latest = latestMap.get(childName);
    return {
      childName,
      payload: latest?.payload ?? null,
      recordedAt: latest?.record.recordedAt ?? null,
    };
  });
}

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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function ScheduleDayPanel(props: { owner: string }) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [targetDate, setTargetDate] = useState(() => todayYYYYMMDD());
  const [loading, setLoading] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [savingAttendanceItemId, setSavingAttendanceItemId] = useState<
    string | null
  >(null);
  const [savingTranscriptItemId, setSavingTranscriptItemId] = useState<
    string | null
  >(null);
  const [analyzingTranscriptItemId, setAnalyzingTranscriptItemId] = useState<
    string | null
  >(null);
  const [transcribingTranscriptItemId, setTranscribingTranscriptItemId] =
    useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [message, setMessage] = useState("");

  const [day, setDay] = useState<Schema["ScheduleDay"]["type"] | null>(null);
  const [items, setItems] = useState<Array<Schema["ScheduleDayItem"]["type"]>>(
    []
  );
  const [records, setRecords] = useState<Array<Schema["ScheduleRecord"]["type"]>>(
    []
  );
  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});
  const [attendanceDrafts, setAttendanceDrafts] = useState<
    Record<string, Record<string, AttendanceDraft>>
  >({});
  const [transcriptDrafts, setTranscriptDrafts] = useState<
    Record<string, TranscriptDraft>
  >({});

  async function loadScheduleDay() {
    setLoading(true);
    setMessage("");
    setDay(null);
    setItems([]);
    setRecords([]);
    setMemoDrafts({});
    setAttendanceDrafts({});
    setTranscriptDrafts({});

    try {
      const dayRes = await client.models.ScheduleDay.list({
        filter: {
          owner: { eq: owner },
          targetDate: { eq: targetDate },
        } as any,
      });

      const foundDay =
        [...(dayRes.data ?? [])]
          .sort((a, b) => {
            const versionDiff = (b.issueVersion ?? 0) - (a.issueVersion ?? 0);
            if (versionDiff !== 0) return versionDiff;
            return String(b.issuedAt ?? "").localeCompare(
              String(a.issuedAt ?? "")
            );
          })[0] ?? null;

      if (!foundDay) {
        setMessage(`対象日 ${targetDate} の日案はありません。`);
        return;
      }

      let normalizedDay = foundDay;

      if (foundDay.status === "ISSUED") {
        const updateRes = await client.models.ScheduleDay.update({
          id: foundDay.id,
          status: "IN_PROGRESS",
          openedAt: new Date().toISOString(),
        } as any);

        if (updateRes.data) {
          normalizedDay = updateRes.data;
        }
      }

      setDay(normalizedDay);

      const itemsRes = await client.models.ScheduleDayItem.list({
        filter: {
          scheduleDayId: { eq: normalizedDay.id },
        } as any,
      });

      const sortedItems = (itemsRes.data ?? []).sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );

      setItems(sortedItems);

      const recordRows = await listAll(client.models.ScheduleRecord, {
        filter: {
          scheduleDayId: { eq: normalizedDay.id },
        } as any,
      });

      recordRows.sort((a, b) =>
        String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
      );
      setRecords(recordRows);

      setAttendanceDrafts(buildInitialAttendanceDrafts(sortedItems, recordRows));

      const initialTranscriptDrafts: Record<string, TranscriptDraft> = {};
      for (const item of sortedItems) {
        if (item.sourceType === "PLANNED") {
          initialTranscriptDrafts[item.id] = createEmptyTranscriptDraft();
        }
      }
      setTranscriptDrafts(initialTranscriptDrafts);

      setMessage(`日案を読み込みました。 itemCount=${sortedItems.length}`);
    } catch (e) {
      console.error(e);
      setMessage(`読込エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function getRecordsForItem(scheduleDayItemId: string) {
    return records.filter((r) => r.scheduleDayItemId === scheduleDayItemId);
  }

  function getTranscriptRecordsForItem(scheduleDayItemId: string) {
    return records
      .filter(
        (r) =>
          r.scheduleDayItemId === scheduleDayItemId &&
          r.recordType === "TRANSCRIPT"
      )
      .sort((a, b) =>
        String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
      );
  }

  function getStructuredObservationRecordsForItem(
    scheduleDayItemId: string
  ) {
    return records
      .filter(
        (r) =>
          r.scheduleDayItemId === scheduleDayItemId &&
          r.recordType === "STRUCTURED_OBSERVATION"
      )
      .sort((a, b) =>
        String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
      );
  }

  function getNonTranscriptRecordsForItem(scheduleDayItemId: string) {
    return records
      .filter(
        (r) =>
          r.scheduleDayItemId === scheduleDayItemId &&
          r.recordType !== "TRANSCRIPT" &&
          r.recordType !== "CHECK" &&
          r.recordType !== "STRUCTURED_OBSERVATION"
      )
      .sort((a, b) =>
        String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
      );
  }

  function updateMemoDraft(itemId: string, value: string) {
    setMemoDrafts((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  }

  function updateTranscriptDraft(
    itemId: string,
    patch: Partial<TranscriptDraft>
  ) {
    setTranscriptDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? createEmptyTranscriptDraft()),
        ...patch,
      },
    }));
  }

  function updateAttendanceChecked(
    itemId: string,
    childName: string,
    checked: boolean
  ) {
    setAttendanceDrafts((prev) => {
      const current = prev[itemId]?.[childName] ?? createEmptyAttendanceRow();
      return {
        ...prev,
        [itemId]: {
          ...(prev[itemId] ?? {}),
          [childName]: {
            ...current,
            checked,
            checkedAt: checked ? current.checkedAt || nowHHmm() : "",
          },
        },
      };
    });
  }

  function updateAttendanceCheckedAt(
    itemId: string,
    childName: string,
    checkedAt: string
  ) {
    setAttendanceDrafts((prev) => {
      const current = prev[itemId]?.[childName] ?? createEmptyAttendanceRow();
      return {
        ...prev,
        [itemId]: {
          ...(prev[itemId] ?? {}),
          [childName]: {
            ...current,
            checkedAt,
          },
        },
      };
    });
  }

  function updateAttendanceNote(
    itemId: string,
    childName: string,
    note: string
  ) {
    setAttendanceDrafts((prev) => {
      const current = prev[itemId]?.[childName] ?? createEmptyAttendanceRow();
      return {
        ...prev,
        [itemId]: {
          ...(prev[itemId] ?? {}),
          [childName]: {
            ...current,
            note,
          },
        },
      };
    });
  }

  async function saveMemo(item: Schema["ScheduleDayItem"]["type"]) {
    if (!day) return;

    const body = (memoDrafts[item.id] ?? "").trim();
    if (!body) {
      setMessage("保存するメモを入力してください。");
      return;
    }

    setSavingItemId(item.id);
    setMessage("");

    try {
      const recordType = day.status === "CLOSED" ? "APPEND_NOTE" : "MEMO";

      const createRes = await client.models.ScheduleRecord.create({
        tenantId: day.tenantId,
        owner,
        scheduleDayId: day.id,
        scheduleDayItemId: item.id,
        recordType,
        body,
        payloadJson: undefined,
        appendOnly: day.status === "CLOSED",
        createdBySub: owner,
        recordedAt: new Date().toISOString(),
      } as any);

      if (!createRes.data) {
        throw new Error(
          createRes.errors?.map((e) => e.message).join(", ") ||
            "ScheduleRecord の保存に失敗しました。"
        );
      }

      setRecords((prev) =>
        [...prev, createRes.data!].sort((a, b) =>
          String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
        )
      );

      setMemoDrafts((prev) => ({
        ...prev,
        [item.id]: "",
      }));

      setMessage(
        day.status === "CLOSED" ? "追記を保存しました。" : "メモを保存しました。"
      );
    } catch (e) {
      console.error(e);
      setMessage(`保存エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingItemId(null);
    }
  }

  async function saveAttendance(item: Schema["ScheduleDayItem"]["type"]) {
    if (!day) return;
    if (day.status === "CLOSED") {
      setMessage("締め後は朝礼チェックを更新できません。");
      return;
    }

    const draftMap = attendanceDrafts[item.id];
    if (!draftMap) {
      setMessage("保存する朝礼チェックがありません。");
      return;
    }

    setSavingAttendanceItemId(item.id);
    setMessage("");

    try {
      const createdRecords: Array<Schema["ScheduleRecord"]["type"]> = [];

      for (const childName of MORNING_CHECK_CHILDREN) {
        const draft = draftMap[childName] ?? createEmptyAttendanceRow();
        const payload = buildAttendancePayload(childName, draft);
        const body = buildAttendanceBody(childName, draft);

        const createRes = await client.models.ScheduleRecord.create({
          tenantId: day.tenantId,
          owner,
          scheduleDayId: day.id,
          scheduleDayItemId: item.id,
          recordType: "CHECK",
          body,
          payloadJson: JSON.stringify(payload),
          appendOnly: false,
          createdBySub: owner,
          recordedAt: new Date().toISOString(),
        } as any);

        if (!createRes.data) {
          throw new Error(
            createRes.errors?.map((e) => e.message).join(", ") ||
              `朝礼チェック保存失敗: ${childName}`
          );
        }

        createdRecords.push(createRes.data);
      }

      setRecords((prev) =>
        [...prev, ...createdRecords].sort((a, b) =>
          String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
        )
      );

      setMessage("朝礼チェックを保存しました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `朝礼チェック保存エラー: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    } finally {
      setSavingAttendanceItemId(null);
    }
  }

  async function waitForTranscriptJob(jobId: string) {
    for (let i = 0; i < 60; i++) {
      await sleep(5000);

      const jobRes = await client.models.AudioJob.list({
        filter: {
          id: { eq: jobId },
        } as any,
      });

      const job = (jobRes.data ?? [])[0] as any;

      if (!job) continue;

      if (job.status === "SUCCEEDED") {
        return job;
      }

      if (job.status === "FAILED") {
        throw new Error(job.errorMessage || "文字起こしに失敗しました。");
      }
    }

    throw new Error(
      "文字起こし結果の待機がタイムアウトしました。AudioJob の状態を確認してください。"
    );
  }

  async function transcribeTranscriptAudio(
    item: Schema["ScheduleDayItem"]["type"]
  ) {
    if (!day) return;
    if (day.status === "CLOSED") {
      setMessage("締め後は文字起こしを開始できません。");
      return;
    }

    const draft = transcriptDrafts[item.id] ?? createEmptyTranscriptDraft();
    const file = draft.audioFile;

    if (!file) {
      setMessage("先に音声ファイルを選択してください。");
      return;
    }

    setTranscribingTranscriptItemId(item.id);
    setMessage("");

    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const uploadId = crypto.randomUUID();

      updateTranscriptDraft(item.id, {
        audioStatusText: "音声ファイルをアップロード中...",
      });

      const uploadResult = await uploadData({
        path: ({ identityId }) =>
          `tenants/${identityId}/${day.tenantId}/schedule-day-audio/${day.id}/${item.id}/${yyyy}/${mm}/${dd}/${uploadId}-${file.name}`,
        data: file,
        options: {
          contentType: file.type || "audio/m4a",
        },
      }).result;

      const createJobRes = await client.models.AudioJob.create({
        tenantId: day.tenantId,
        owner,
        jobType: "SCHEDULE_TRANSCRIPT",
        sourceEntityType: "ScheduleDayItem",
        sourceEntityId: item.id,
        scheduleDayId: day.id,
        scheduleDayItemId: item.id,
        audioPath: uploadResult.path,
        recordedAt: new Date().toISOString(),
        status: "PENDING",
        transcribeStatus: null,
        transcribeJobName: null,
        transcriptText: null,
        summaryText: null,
        errorMessage: null,
        completedAt: null,
      } as any);

      if (!createJobRes.data) {
        throw new Error(
          createJobRes.errors?.map((e) => e.message).join(", ") ||
            "AudioJob の作成に失敗しました。"
        );
      }

      const jobId =
        (createJobRes.data as any)?.id ??
        (Array.isArray(createJobRes.data)
          ? (createJobRes.data as any[])[0]?.id
          : "") ??
        "";

      if (!jobId) {
        throw new Error("AudioJob id を取得できませんでした。");
      }

      updateTranscriptDraft(item.id, {
        audioJobId: jobId,
        audioStatusText: "文字起こしジョブを開始中...",
      });

      const bucket = getStorageBucketName();
      if (!bucket) {
        throw new Error("amplify_outputs.json から bucket 名を取得できません。");
      }

      const key = String(uploadResult.path).replace(/^\/+/, "");
      const audioS3Uri = `s3://${bucket}/${key}`;

      const res = await (client.mutations as any).summarizeAudio({
        jobId,
        audioPath: uploadResult.path,
        audioUrl: audioS3Uri,
        audioS3Uri,
      });

      const resp = res?.data ?? res;
      const errs = res?.errors ?? resp?.errors;

      if (Array.isArray(errs) && errs.length) {
        throw new Error(
          errs.map((e: any) => e.message ?? String(e)).join("\n")
        );
      }

      const jobName = resp?.transcribeJobName as string | undefined;
      const st = resp?.status as string | undefined;

      if (st === "FAILED") {
        await client.models.AudioJob.update({
          id: jobId,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: resp?.summaryText ?? "StartTranscriptionJob failed",
          completedAt: new Date().toISOString(),
        } as any);
        throw new Error(resp?.summaryText ?? "StartTranscriptionJob failed");
      }

      if (!jobName) {
        await client.models.AudioJob.update({
          id: jobId,
          status: "FAILED",
          transcribeStatus: "FAILED",
          errorMessage: "No transcribeJobName returned from summarizeAudio.",
          completedAt: new Date().toISOString(),
        } as any);
        throw new Error("No transcribeJobName returned from summarizeAudio");
      }

      await client.models.AudioJob.update({
        id: jobId,
        status: "RUNNING",
        transcribeJobName: jobName,
        transcribeStatus: "IN_PROGRESS",
        errorMessage: null,
        completedAt: null,
      } as any);

      updateTranscriptDraft(item.id, {
        audioStatusText: "文字起こし中です。しばらくお待ちください...",
      });

      const finishedJob = await waitForTranscriptJob(jobId);
      const transcriptText = String(finishedJob?.transcriptText ?? "").trim();

      if (!transcriptText) {
        throw new Error("文字起こし結果が空です。");
      }

      updateTranscriptDraft(item.id, {
        transcriptText,
        audioStatusText: "文字起こし完了。transcript text に反映しました。",
        audioFile: null,
        audioFileName: "",
        audioJobId: jobId,
      });

      setMessage("文字起こし結果を transcript text に反映しました。");
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);

      updateTranscriptDraft(item.id, {
        audioStatusText: `文字起こしエラー: ${msg}`,
      });

      setMessage(`文字起こしエラー: ${msg}`);
    } finally {
      setTranscribingTranscriptItemId(null);
    }
  }

  async function saveTranscript(item: Schema["ScheduleDayItem"]["type"]) {
    if (!day) return;
    if (day.status === "CLOSED") {
      setMessage("締め後は transcript を保存できません。");
      return;
    }

    const draft = transcriptDrafts[item.id] ?? createEmptyTranscriptDraft();
    const transcriptText = draft.transcriptText.trim();
    const childNames = parseChildNamesText(draft.childNamesText);

    if (!transcriptText) {
      setMessage("保存する transcript text を入力してください。");
      return;
    }

    setSavingTranscriptItemId(item.id);
    setMessage("");

    try {
      const payload = buildTranscriptPayload(
        item.practiceCode,
        childNames,
        transcriptText
      );

      const createRes = await client.models.ScheduleRecord.create({
        tenantId: day.tenantId,
        owner,
        scheduleDayId: day.id,
        scheduleDayItemId: item.id,
        recordType: "TRANSCRIPT",
        body: transcriptText,
        payloadJson: JSON.stringify(payload),
        appendOnly: false,
        createdBySub: owner,
        recordedAt: new Date().toISOString(),
      } as any);

      if (!createRes.data) {
        throw new Error(
          createRes.errors?.map((e) => e.message).join(", ") ||
            "TRANSCRIPT の保存に失敗しました。"
        );
      }

      setRecords((prev) =>
        [...prev, createRes.data!].sort((a, b) =>
          String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
        )
      );

      setTranscriptDrafts((prev) => ({
        ...prev,
        [item.id]: createEmptyTranscriptDraft(),
      }));

      setMessage("音声メモ（text）を保存しました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `TRANSCRIPT 保存エラー: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    } finally {
      setSavingTranscriptItemId(null);
    }
  }

  async function analyzeTranscript(item: Schema["ScheduleDayItem"]["type"]) {
    if (!day) return;

    const transcriptRecords = getTranscriptRecordsForItem(item.id);
    if (transcriptRecords.length === 0) {
      setMessage("解析対象の音声メモがありません。先に保存してください。");
      return;
    }

    const latestTranscript = transcriptRecords[transcriptRecords.length - 1];

    setAnalyzingTranscriptItemId(item.id);
    setMessage("");

    try {
      const runner =
        (client as any).queries?.analyzeTranscriptObservations ??
        (client as any).mutations?.analyzeTranscriptObservations;

      if (!runner) {
        throw new Error(
          "analyzeTranscriptObservations が client に見つかりません。resource.ts の custom operation 名を確認してください。"
        );
      }

      let res: any;
      try {
        res = await runner({
          scheduleDayId: day.id,
          scheduleDayItemId: item.id,
          transcriptRecordId: latestTranscript.id,
        });
      } catch {
        res = await runner({
          input: {
            scheduleDayId: day.id,
            scheduleDayItemId: item.id,
            transcriptRecordId: latestTranscript.id,
          },
        });
      }

      if (res?.errors?.length) {
        throw new Error(res.errors.map((e: any) => e.message).join(", "));
      }

      const recordRows = await listAll(client.models.ScheduleRecord, {
        filter: {
          scheduleDayId: { eq: day.id },
        } as any,
      });

      recordRows.sort((a, b) =>
        String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
      );
      setRecords(recordRows);

      const data = res?.data ?? res;
      const createdCount = Number(data?.createdCount ?? data?.count ?? 0);

      setMessage(
        createdCount > 0
          ? `AI解析を実行しました。 createdCount=${createdCount}`
          : "AI解析を実行しました。"
      );
    } catch (e) {
      console.error(e);
      setMessage(`AI解析エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAnalyzingTranscriptItemId(null);
    }
  }

  async function closeScheduleDay() {
    if (!day) return;
    if (day.status === "CLOSED") {
      setMessage("この日案は既に締められています。");
      return;
    }
    if (day.owner !== owner) {
      setMessage("日案を締められるのは担任のみです。");
      return;
    }

    setClosing(true);
    setMessage("");

    try {
      const updateRes = await client.models.ScheduleDay.update({
        id: day.id,
        status: "CLOSED",
        closedAt: new Date().toISOString(),
        closedBySub: owner,
      } as any);

      if (!updateRes.data) {
        throw new Error(
          updateRes.errors?.map((e) => e.message).join(", ") ||
            "日案の締め処理に失敗しました。"
        );
      }

      setDay(updateRes.data);
      setMessage("日案を締めました。以後は追記のみ可能です。");
    } catch (e) {
      console.error(e);
      setMessage(
        `締め処理エラー: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setClosing(false);
    }
  }

  async function reopenScheduleDay() {
    if (!day) return;
    if (day.owner !== owner) {
      setMessage("日案を再オープンできるのは担任のみです。");
      return;
    }

    setReopening(true);
    setMessage("");

    try {
      const updateRes = await client.models.ScheduleDay.update({
        id: day.id,
        status: "IN_PROGRESS",
      } as any);

      if (!updateRes.data) {
        throw new Error(
          updateRes.errors?.map((e) => e.message).join(", ") ||
            "日案の再オープンに失敗しました。"
        );
      }

      setDay(updateRes.data);
      setMessage("日案を IN_PROGRESS に戻しました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `再オープンエラー: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setReopening(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          padding: 16,
          border: "1px solid #d0d7de",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Schedule（日案）</h2>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label>
            対象日：
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </label>

          <button onClick={loadScheduleDay} disabled={loading}>
            {loading ? "読込中..." : "日案を表示"}
          </button>

          {day ? (
            <button
              onClick={closeScheduleDay}
              disabled={closing || day.status === "CLOSED" || day.owner !== owner}
            >
              {closing ? "締め中..." : "日案を締める"}
            </button>
          ) : null}

          {day?.status === "CLOSED" ? (
            <button
              onClick={reopenScheduleDay}
              disabled={reopening || day.owner !== owner}
            >
              {reopening ? "戻し中..." : "開発用: IN_PROGRESS に戻す"}
            </button>
          ) : null}
        </div>

        {message ? (
          <div style={{ marginTop: 12, color: "#444", whiteSpace: "pre-wrap" }}>
            {message}
          </div>
        ) : null}
      </div>

      {day ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #d0d7de",
            borderRadius: 8,
            background: "#f8fafc",
          }}
        >
          <h3 style={{ marginTop: 0 }}>日案ヘッダ</h3>

          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <b>対象日:</b> {day.targetDate}
            </div>
            <div>
              <b>状態:</b> {day.status}
            </div>
            <div>
              <b>発行種別:</b> {day.issueType}
            </div>
            <div>
              <b>発行版:</b> {day.issueVersion}
            </div>
            <div>
              <b>classroomId:</b> {day.classroomId}
            </div>
            <div>
              <b>ageTargetId:</b> {day.ageTargetId}
            </div>
            <div>
              <b>openedAt:</b> {formatDateTime(day.openedAt)}
            </div>
            <div>
              <b>closedAt:</b> {formatDateTime(day.closedAt)}
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              今日の5領域（Practice起点の合算）
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(80px, 1fr))",
                gap: 8,
              }}
            >
              <div style={{ padding: 8, background: "#f9fafb" }}>
                <div>健康</div>
                <b>{day.totalHealth ?? 0}</b>
              </div>
              <div style={{ padding: 8, background: "#f9fafb" }}>
                <div>人間関係</div>
                <b>{day.totalHumanRelations ?? 0}</b>
              </div>
              <div style={{ padding: 8, background: "#f9fafb" }}>
                <div>環境</div>
                <b>{day.totalEnvironment ?? 0}</b>
              </div>
              <div style={{ padding: 8, background: "#f9fafb" }}>
                <div>言葉</div>
                <b>{day.totalLanguage ?? 0}</b>
              </div>
              <div style={{ padding: 8, background: "#f9fafb" }}>
                <div>表現</div>
                <b>{day.totalExpression ?? 0}</b>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #d0d7de",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>タイムライン</h3>

          <div style={{ display: "grid", gap: 12 }}>
            {items.map((item) => {
              const observation = safeParseObservationSummary(
                item.observationSummaryJson
              );
              const itemRecords = getRecordsForItem(item.id);
              const itemTranscriptRecords = getTranscriptRecordsForItem(item.id);
              const itemStructuredObservationRecords =
                getStructuredObservationRecordsForItem(item.id);
              const itemMemoRecords = getNonTranscriptRecordsForItem(item.id);
              const transcriptDraft =
                transcriptDrafts[item.id] ?? createEmptyTranscriptDraft();
              const latestAttendanceRows = getLatestAttendanceByChild(
                item.id,
                records
              );

              return (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    background:
                      item.sourceType === "PLANNED" ? "#eff6ff" : "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <b>
                      {item.startTime} - {item.endTime}
                    </b>
                    <span>/{item.sourceType}</span>
                    <span>/{item.title}</span>
                  </div>

                  {item.description ? (
                    <div style={{ marginTop: 8 }}>
                      <b>メモ:</b> {item.description}
                    </div>
                  ) : null}

                  {item.sourceType === "PLANNED" ? (
                    <>
                      <div style={{ marginTop: 8 }}>
                        <b>PracticeCode:</b> {item.practiceCode || "-"}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <b>Practice:</b> {item.practiceTitleSnapshot || "-"}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <b>item 5領域:</b>{" "}
                        {[
                          item.scoreHealth ?? 0,
                          item.scoreHumanRelations ?? 0,
                          item.scoreEnvironment ?? 0,
                          item.scoreLanguage ?? 0,
                          item.scoreExpression ?? 0,
                        ].join(", ")}
                      </div>
                    </>
                  ) : null}

                  {observation ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 8,
                        background: "#ffffff",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        見届けたい子どもの姿
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        {observation.abilities.map((ab) => (
                          <div
                            key={ab.abilityCode}
                            style={{
                              padding: 10,
                              borderRadius: 8,
                              background: "#f8fbff",
                              border: "1px solid #dbeafe",
                            }}
                          >
                            <div>
                              <b>{ab.abilityName}</b> ({ab.abilityCode})
                            </div>
                            <div style={{ marginTop: 4, color: "#555" }}>
                              開始年齢: {ab.startingAge} / score: {ab.score}
                            </div>

                            <ul style={{ marginTop: 8, marginBottom: 0 }}>
                              {(ab.episodes ?? []).map((ep, idx) => (
                                <li key={`${ab.abilityCode}-${idx}`}>{ep}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {isMorningCheckItem(item) ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 8,
                        background: "#fafafa",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        朝礼チェック表
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: 720,
                          }}
                        >
                          <thead>
                            <tr>
                              <th
                                style={{
                                  textAlign: "left",
                                  borderBottom: "1px solid #ddd",
                                  padding: 8,
                                }}
                              >
                                子どもの名前
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  borderBottom: "1px solid #ddd",
                                  padding: 8,
                                }}
                              >
                                OK
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  borderBottom: "1px solid #ddd",
                                  padding: 8,
                                }}
                              >
                                登園時刻
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  borderBottom: "1px solid #ddd",
                                  padding: 8,
                                }}
                              >
                                メモ（欠席理由など）
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {MORNING_CHECK_CHILDREN.map((childName) => {
                              const draft =
                                attendanceDrafts[item.id]?.[childName] ??
                                createEmptyAttendanceRow();

                              return (
                                <tr key={childName}>
                                  <td
                                    style={{
                                      borderBottom: "1px solid #eee",
                                      padding: 8,
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {childName}
                                  </td>
                                  <td
                                    style={{
                                      borderBottom: "1px solid #eee",
                                      padding: 8,
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={draft.checked}
                                      disabled={day?.status === "CLOSED"}
                                      onChange={(e) =>
                                        updateAttendanceChecked(
                                          item.id,
                                          childName,
                                          e.target.checked
                                        )
                                      }
                                    />
                                  </td>
                                  <td
                                    style={{
                                      borderBottom: "1px solid #eee",
                                      padding: 8,
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <input
                                      type="time"
                                      value={draft.checkedAt}
                                      disabled={
                                        day?.status === "CLOSED" || !draft.checked
                                      }
                                      onChange={(e) =>
                                        updateAttendanceCheckedAt(
                                          item.id,
                                          childName,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td
                                    style={{
                                      borderBottom: "1px solid #eee",
                                      padding: 8,
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      value={draft.note}
                                      disabled={day?.status === "CLOSED"}
                                      onChange={(e) =>
                                        updateAttendanceNote(
                                          item.id,
                                          childName,
                                          e.target.value
                                        )
                                      }
                                      placeholder="欠席理由など"
                                      style={{ width: "100%" }}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => saveAttendance(item)}
                          disabled={
                            savingAttendanceItemId === item.id ||
                            day?.status === "CLOSED"
                          }
                        >
                          {savingAttendanceItemId === item.id
                            ? "保存中..."
                            : "朝礼チェックを保存"}
                        </button>
                      </div>

                      {latestAttendanceRows.some((x) => x.payload) ? (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontWeight: 700, marginBottom: 8 }}>
                            今日の登園状況
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            {latestAttendanceRows.map((row) => (
                              <div
                                key={row.childName}
                                style={{
                                  padding: 8,
                                  borderRadius: 6,
                                  background: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                <b>{row.childName}</b> /{" "}
                                {row.payload
                                  ? `${row.payload.checked ? "OK" : "NG"} / ${
                                      row.payload.checkedAt || "-"
                                    } / ${row.payload.note || "-"}`
                                  : "未記録"}
                                {row.recordedAt ? (
                                  <span style={{ color: "#666" }}>
                                    {" "}
                                    ({formatDateTime(row.recordedAt)})
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {item.sourceType === "PLANNED" ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 8,
                        background: "#fafafa",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        音声メモ（text）
                      </div>

                      <div style={{ display: "grid", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", marginBottom: 4 }}>
                            子どもの名前タグ（カンマ区切り）
                          </label>
                          <input
                            type="text"
                            value={transcriptDraft.childNamesText}
                            disabled={day?.status === "CLOSED"}
                            onChange={(e) =>
                              updateTranscriptDraft(item.id, {
                                childNamesText: e.target.value,
                              })
                            }
                            placeholder="例: さくら, たろう"
                            style={{ width: "100%" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", marginBottom: 4 }}>
                            音声ファイル
                          </label>
                          <input
                            type="file"
                            accept="audio/*"
                            disabled={
                              day?.status === "CLOSED" ||
                              transcribingTranscriptItemId === item.id
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              updateTranscriptDraft(item.id, {
                                audioFile: file,
                                audioFileName: file?.name ?? "",
                                audioJobId: "",
                                audioStatusText: file
                                  ? "音声ファイルを選択しました。"
                                  : "",
                              });
                            }}
                          />

                          {transcriptDraft.audioFileName ? (
                            <div
                              style={{ marginTop: 6, fontSize: 12, color: "#555" }}
                            >
                              選択中: {transcriptDraft.audioFileName}
                            </div>
                          ) : null}

                          {transcriptDraft.audioJobId ? (
                            <div
                              style={{ marginTop: 4, fontSize: 12, color: "#555" }}
                            >
                              AudioJob: <code>{transcriptDraft.audioJobId}</code>
                            </div>
                          ) : null}

                          {transcriptDraft.audioStatusText ? (
                            <div
                              style={{ marginTop: 4, fontSize: 12, color: "#555" }}
                            >
                              {transcriptDraft.audioStatusText}
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <label style={{ display: "block", marginBottom: 4 }}>
                            transcript text
                          </label>
                          <textarea
                            value={transcriptDraft.transcriptText}
                            disabled={day?.status === "CLOSED"}
                            onChange={(e) =>
                              updateTranscriptDraft(item.id, {
                                transcriptText: e.target.value,
                              })
                            }
                            rows={4}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                            placeholder="音声から自動入力、または手入力できます。"
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => transcribeTranscriptAudio(item)}
                          disabled={
                            day?.status === "CLOSED" ||
                            transcribingTranscriptItemId === item.id ||
                            savingTranscriptItemId === item.id
                          }
                        >
                          {transcribingTranscriptItemId === item.id
                            ? "文字起こし中..."
                            : "文字起こし"}
                        </button>

                        <button
                          onClick={() => saveTranscript(item)}
                          disabled={
                            savingTranscriptItemId === item.id ||
                            analyzingTranscriptItemId === item.id ||
                            transcribingTranscriptItemId === item.id ||
                            day?.status === "CLOSED"
                          }
                        >
                          {savingTranscriptItemId === item.id
                            ? "保存中..."
                            : "音声メモを保存"}
                        </button>

                        <button
                          onClick={() => analyzeTranscript(item)}
                          disabled={
                            savingTranscriptItemId === item.id ||
                            analyzingTranscriptItemId === item.id ||
                            transcribingTranscriptItemId === item.id ||
                            itemTranscriptRecords.length === 0
                          }
                        >
                          {analyzingTranscriptItemId === item.id
                            ? "AI解析中..."
                            : "AIで観察記録を抽出"}
                        </button>
                      </div>

                      {day?.status === "CLOSED" ? (
                        <div style={{ marginTop: 8, color: "#666" }}>
                          締め後は transcript の保存はできません。AI解析は保存済み音声メモに対して実行できます。
                        </div>
                      ) : null}

                      {itemTranscriptRecords.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontWeight: 700, marginBottom: 8 }}>
                            保存済み音声メモ
                          </div>

                          <div style={{ display: "grid", gap: 8 }}>
                            {itemTranscriptRecords.map((record) => {
                              const payload = safeParsePlannedTranscriptPayload(
                                record.payloadJson
                              );

                              return (
                                <div
                                  key={record.id}
                                  style={{
                                    padding: 8,
                                    borderRadius: 6,
                                    background: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <div style={{ fontSize: 12, color: "#555" }}>
                                    {formatRecordType(record.recordType)} /{" "}
                                    {formatDateTime(record.recordedAt)}
                                  </div>

                                  <div style={{ marginTop: 6 }}>
                                    <b>子どもタグ:</b>{" "}
                                    {payload?.childNames?.join(", ") || "-"}
                                  </div>

                                  <div style={{ marginTop: 6 }}>
                                    <b>本文:</b> {record.body || "(本文なし)"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {itemStructuredObservationRecords.length > 0 ? (
                        <div
                          style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 8,
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 8 }}>
                            AI抽出された観察記録
                          </div>

                          <div style={{ display: "grid", gap: 8 }}>
                            {itemStructuredObservationRecords.map((record) => {
                              const payload =
                                safeParseStructuredObservationPayload(
                                  record.payloadJson
                                );

                              if (!payload) return null;

                              return (
                                <div
                                  key={record.id}
                                  style={{
                                    padding: 8,
                                    borderRadius: 6,
                                    background: "#f8fbff",
                                    border: "1px solid #dbeafe",
                                  }}
                                >
                                  <div style={{ fontSize: 12, color: "#555" }}>
                                    {formatRecordType(record.recordType)} /{" "}
                                    {formatDateTime(record.recordedAt)}
                                  </div>

                                  <div style={{ marginTop: 6 }}>
                                    <b>子ども:</b> {payload.childName || "-"}
                                  </div>

                                  <div style={{ marginTop: 6 }}>
                                    <b>Ability:</b> {payload.abilityName || "-"}
                                    {payload.abilityCode
                                      ? ` (${payload.abilityCode})`
                                      : ""}
                                  </div>

                                  <div style={{ marginTop: 6 }}>
                                    <b>observedText:</b>{" "}
                                    {payload.observedText ||
                                      record.body ||
                                      "(本文なし)"}
                                  </div>

                                  <div style={{ marginTop: 6 }}>
                                    <b>confidence:</b>{" "}
                                    {typeof payload.confidence === "number"
                                      ? payload.confidence
                                      : "-"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 8,
                      background: "#fafafa",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      {day?.status === "CLOSED" ? "追記" : "メモ"}
                    </div>

                    <textarea
                      value={memoDrafts[item.id] ?? ""}
                      onChange={(e) => updateMemoDraft(item.id, e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        resize: "vertical",
                      }}
                      placeholder={
                        day?.status === "CLOSED"
                          ? "締め後は追記のみ可能です。"
                          : "メモを入力してください。"
                      }
                    />

                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => saveMemo(item)}
                        disabled={savingItemId === item.id}
                      >
                        {savingItemId === item.id ? "保存中..." : "保存"}
                      </button>
                    </div>

                    {itemMemoRecords.length > 0 ? (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                          保存済みメモ
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                          {itemMemoRecords.map((record) => (
                            <div
                              key={record.id}
                              style={{
                                padding: 8,
                                borderRadius: 6,
                                background: "#ffffff",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <div style={{ fontSize: 12, color: "#555" }}>
                                {formatRecordType(record.recordType)} /{" "}
                                {formatDateTime(record.recordedAt)}
                              </div>
                              <div style={{ marginTop: 6 }}>
                                {record.body || "(本文なし)"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                      item別記録件数: {itemRecords.length}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}