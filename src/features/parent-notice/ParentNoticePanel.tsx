import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type ModelError = {
  message?: string | null;
};

type ListOptions = Record<string, unknown>;
type MutationInput = Record<string, unknown>;

type ListResponse<TRow> = {
  data?: TRow[] | null;
  nextToken?: string | null;
  errors?: ModelError[] | null;
};

type MutationResponse<TRow> = {
  data?: TRow | null;
  errors?: ModelError[] | null;
};

type ListableModel<TRow> = {
  list(options?: ListOptions): Promise<ListResponse<TRow>>;
};

type CreatableModel<TRow> = {
  create(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type UpdatableModel<TRow> = {
  update(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type ScheduleDayRow = Schema["ScheduleDay"]["type"];
type ClassroomRow = Schema["Classroom"]["type"];
type AgeTargetRow = Schema["SchoolAnnualAgeTarget"]["type"];
type ParentNoticeReplyTokenRow = Schema["ParentNoticeReplyToken"]["type"];
type ParentNoticeReplyRow = Schema["ParentNoticeReply"]["type"];

type ClassroomDisplayRow = ClassroomRow & {
  name?: string | null;
  title?: string | null;
  className?: string | null;
};

type AgeTargetDisplayRow = AgeTargetRow & {
  ageBand?: string | number | null;
  name?: string | null;
  title?: string | null;
  label?: string | null;
  displayName?: string | null;
};

type GenerateParentNoticeArgs = {
  scheduleDayId: string;
  manualNote?: string | null;
};

type GenerateParentNoticeResult = {
  scheduleDayId?: string | null;
  draftText?: string | null;
  sourceJson?: string | null;
  status?: string | null;
  message?: string | null;
};

type SendParentNoticeEmailsArgs = {
  scheduleDayId: string;
  noticeText?: string | null;
  baseUrl?: string | null;
};

type ParentNoticeRecipientSendResult = {
  childKey?: string | null;
  childName?: string | null;
  email?: string | null;
  replyUrl?: string | null;
  tokenId?: string | null;
  status?: string | null;
  message?: string | null;
};

type SendParentNoticeEmailsResult = {
  scheduleDayId?: string | null;
  sentCount?: number | null;
  failedCount?: number | null;
  status?: string | null;
  message?: string | null;
  results?: (ParentNoticeRecipientSendResult | null)[] | null;
};

type OperationEnvelope<TData> = {
  data?: TData | null;
  errors?: ModelError[] | null;
};

type OperationRunner<TArgs, TData> = (
  args: TArgs | { input: TArgs },
) => Promise<OperationEnvelope<TData> | TData>;

type ParentNoticeClient = {
  models: {
    Classroom: ListableModel<ClassroomRow>;
    SchoolAnnualAgeTarget: ListableModel<AgeTargetRow>;
    ScheduleDay: ListableModel<ScheduleDayRow> & UpdatableModel<ScheduleDayRow>;
    ParentNoticeReplyToken: ListableModel<ParentNoticeReplyTokenRow> &
      CreatableModel<ParentNoticeReplyTokenRow>;
    ParentNoticeReply: ListableModel<ParentNoticeReplyRow> &
      UpdatableModel<ParentNoticeReplyRow>;
  };
  mutations?: {
    generateParentNotice?: OperationRunner<
      GenerateParentNoticeArgs,
      GenerateParentNoticeResult
    >;
    sendParentNoticeEmails?: OperationRunner<
      SendParentNoticeEmailsArgs,
      SendParentNoticeEmailsResult
    >;
  };
};

type NativeShareData = {
  title?: string;
  text?: string;
  url?: string;
};

type ShareNavigator = Navigator & {
  share?: (data: NativeShareData) => Promise<void>;
  canShare?: (data: NativeShareData) => boolean;
};

const DEFAULT_TENANT_ID = "demo-tenant";

function todayYYYYMMDD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysYYYYMMDD(dateStr: string, diff: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + diff);

  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yy}-${mm}-${dd}`;
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function tomorrowYYYYMMDD() {
  return addDaysYYYYMMDD(todayYYYYMMDD(), 1);
}

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP");
}

function formatModelErrors(
  errors?: ModelError[] | null,
  fallback = "Unknown error",
) {
  const messages = (errors ?? [])
    .map((e) => String(e.message ?? "").trim())
    .filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : fallback;
}

function getOperationErrors<TData>(
  res: OperationEnvelope<TData> | TData,
): ModelError[] | null {
  if (!res || typeof res !== "object") return null;
  if (!("errors" in res)) return null;
  return (res as OperationEnvelope<TData>).errors ?? null;
}

function getOperationData<TData>(res: OperationEnvelope<TData> | TData): TData {
  if (!res || typeof res !== "object") {
    return res as TData;
  }

  if (!("data" in res)) {
    return res as TData;
  }

  return ((res as OperationEnvelope<TData>).data ?? res) as TData;
}

function parentNoticeStatusLabel(value?: string | null): string {
  const status = s(value).toUpperCase();

  switch (status) {
    case "DRAFT":
      return "下書き";
    case "CONFIRMED":
      return "確定";
    case "SHARED":
      return "共有済み";
    case "SENT":
      return "送信済み";
    case "CLEARED":
      return "クリア済み";
    default:
      return status || "未作成";
  }
}

function parentNoticeDeliveryMethodLabel(value?: string | null): string {
  const method = s(value).toUpperCase();

  switch (method) {
    case "WEB_SHARE":
      return "iPhone共有";
    case "CLIPBOARD":
      return "コピー";
    case "EMAIL":
      return "メール一括送信";
    case "MANUAL":
      return "手動";
    default:
      return method || "-";
  }
}

function parentReplyStatusLabel(value?: string | null): string {
  const status = s(value).toUpperCase();

  switch (status) {
    case "SUBMITTED":
      return "返信あり";
    case "CONFIRMED":
      return "園確認済み";
    case "ARCHIVED":
      return "アーカイブ";
    default:
      return status || "-";
  }
}

function classroomDisplayLabel(row?: ClassroomDisplayRow | null): string {
  if (!row) return "-";
  return row.name || row.title || row.className || row.id || "-";
}

function ageTargetDisplayLabel(row?: AgeTargetDisplayRow | null): string {
  if (!row) return "-";

  return (
    row.name ||
    row.title ||
    row.label ||
    row.displayName ||
    s(row.ageBand) ||
    row.id ||
    "-"
  );
}

function parentNoticeCandidateText(row: ScheduleDayRow): string {
  return s(row.parentNoticeText) || s(row.parentNoticeDraftText);
}

function parentNoticePreviewText(row: ScheduleDayRow, maxLength = 80): string {
  const text = parentNoticeCandidateText(row).replace(/\s+/g, " ").trim();
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function parentNoticeCandidateSort(a: ScheduleDayRow, b: ScheduleDayRow) {
  const classDiff = s(a.classroomId).localeCompare(s(b.classroomId));
  if (classDiff !== 0) return classDiff;

  const versionDiff = (b.issueVersion ?? 0) - (a.issueVersion ?? 0);
  if (versionDiff !== 0) return versionDiff;

  return s(b.issuedAt).localeCompare(s(a.issuedAt));
}

function latestScheduleDaysByClassroom(
  rows: ScheduleDayRow[],
): ScheduleDayRow[] {
  const map = new Map<string, ScheduleDayRow>();

  for (const row of [...rows].sort(parentNoticeCandidateSort)) {
    const key = s(row.classroomId) || row.id;
    if (!map.has(key)) {
      map.set(key, row);
    }
  }

  return [...map.values()].sort(parentNoticeCandidateSort);
}

function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError";
}

function buildParentNoticeShareTitle(day: ScheduleDayRow): string {
  return `保護者向け連絡 ${day.targetDate}`;
}

function buildParentNoticeShareText(text: string, replyUrl?: string): string {
  const body = text.trim();
  const url = s(replyUrl);

  if (!url) return body;

  return `${body}

【返信はこちら】
内容確認・お迎え予定・ご家庭での様子は、以下から入力してください。
${url}`;
}

function buildParentReplyUrl(token: string): string {
  const origin =
    typeof window === "undefined"
      ? ""
      : window.location.origin.replace(/\/$/, "");

  return `${origin}/parent-reply?token=${encodeURIComponent(token)}`;
}

function makeRandomToken(): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${uuid}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "このブラウザでは返信URL token の作成に必要な暗号機能を利用できません。",
    );
  }

  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function ParentNoticePanel(props: {
  owner: string;
  tenantId?: string;
}) {
  const { owner, tenantId = DEFAULT_TENANT_ID } = props;

  const client = useMemo(
    () => generateClient<Schema>() as unknown as ParentNoticeClient,
    [],
  );

  const [targetDate, setTargetDate] = useState(() => tomorrowYYYYMMDD());
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [message, setMessage] = useState("");

  const [candidates, setCandidates] = useState<ScheduleDayRow[]>([]);
  const [selectedDay, setSelectedDay] = useState<ScheduleDayRow | null>(null);

  const [classroomLabels, setClassroomLabels] = useState<
    Record<string, string>
  >({});
  const [ageTargetLabels, setAgeTargetLabels] = useState<
    Record<string, string>
  >({});

  const [generatingParentNotice, setGeneratingParentNotice] = useState(false);
  const [savingParentNotice, setSavingParentNotice] = useState(false);
  const [sharingParentNotice, setSharingParentNotice] = useState(false);
  const [copyingParentNotice, setCopyingParentNotice] = useState(false);
  const [sendingParentNoticeEmails, setSendingParentNoticeEmails] =
    useState(false);
  const [markingParentNoticeSent, setMarkingParentNoticeSent] = useState(false);
  const [creatingReplyToken, setCreatingReplyToken] = useState(false);

  const [parentNoticeDraft, setParentNoticeDraft] = useState("");
  const [parentNoticeManualNote, setParentNoticeManualNote] = useState("");

  const [replyTokenPlain, setReplyTokenPlain] = useState("");
  const [replyTokenDayId, setReplyTokenDayId] = useState("");

  const [parentReplies, setParentReplies] = useState<ParentNoticeReplyRow[]>(
    [],
  );
  const [loadingParentReplies, setLoadingParentReplies] = useState(false);
  const [confirmingReplyId, setConfirmingReplyId] = useState("");

  const currentReplyUrl = replyTokenPlain
    ? buildParentReplyUrl(replyTokenPlain)
    : "";

  const busy =
    generatingParentNotice ||
    savingParentNotice ||
    sharingParentNotice ||
    copyingParentNotice ||
    sendingParentNoticeEmails ||
    markingParentNoticeSent ||
    creatingReplyToken;

  function mergeScheduleDay(next: ScheduleDayRow) {
    setSelectedDay(next);
    setCandidates((prev) =>
      prev.map((row) => (row.id === next.id ? next : row)),
    );
  }

  async function loadLabels() {
    try {
      const [classroomRes, ageTargetRes] = await Promise.all([
        client.models.Classroom.list({
          filter: {
            tenantId: { eq: tenantId },
          } as ListOptions,
          limit: 1000,
        }),
        client.models.SchoolAnnualAgeTarget.list({
          filter: {
            tenantId: { eq: tenantId },
          } as ListOptions,
          limit: 1000,
        }),
      ]);

      if (!classroomRes.errors?.length) {
        const labels: Record<string, string> = {};
        for (const row of classroomRes.data ?? []) {
          labels[row.id] = classroomDisplayLabel(row as ClassroomDisplayRow);
        }
        setClassroomLabels(labels);
      }

      if (!ageTargetRes.errors?.length) {
        const labels: Record<string, string> = {};
        for (const row of ageTargetRes.data ?? []) {
          labels[row.id] = ageTargetDisplayLabel(row as AgeTargetDisplayRow);
        }
        setAgeTargetLabels(labels);
      }
    } catch (e) {
      console.warn("保護者連絡の表示ラベル取得に失敗しました。", e);
    }
  }

  async function loadParentReplies(scheduleDayId: string) {
    if (!scheduleDayId) return;

    setLoadingParentReplies(true);

    try {
      const res = await client.models.ParentNoticeReply.list({
        filter: {
          scheduleDayId: { eq: scheduleDayId },
        } as ListOptions,
        limit: 1000,
      });

      if (res.errors?.length) {
        throw new Error(
          formatModelErrors(res.errors, "保護者返信の取得に失敗しました。"),
        );
      }

      const rows = [...(res.data ?? [])].sort((a, b) =>
        s(b.submittedAt).localeCompare(s(a.submittedAt)),
      );

      setParentReplies(rows);
    } catch (e) {
      console.error(e);
      setMessage(
        `保護者返信の読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
      setParentReplies([]);
    } finally {
      setLoadingParentReplies(false);
    }
  }

  async function loadParentNoticeCandidates() {
    const date = targetDate.trim();

    if (!date) {
      setMessage("対象日を入力してください。");
      return;
    }

    setLoadingCandidates(true);
    setMessage("");

    try {
      await loadLabels();

      const dayRes = await client.models.ScheduleDay.list({
        filter: {
          owner: { eq: owner },
          tenantId: { eq: tenantId },
          targetDate: { eq: date },
        } as ListOptions,
        limit: 1000,
      });

      if (dayRes.errors?.length) {
        throw new Error(
          formatModelErrors(
            dayRes.errors,
            "保護者連絡候補の日案取得に失敗しました。",
          ),
        );
      }

      const latestRows = latestScheduleDaysByClassroom(dayRes.data ?? []);
      setCandidates(latestRows);

      if (selectedDay && !latestRows.some((row) => row.id === selectedDay.id)) {
        setSelectedDay(null);
        setParentNoticeDraft("");
        setParentNoticeManualNote("");
        setReplyTokenPlain("");
        setReplyTokenDayId("");
        setParentReplies([]);
      } else if (selectedDay) {
        await loadParentReplies(selectedDay.id);
      }

      setMessage(
        `保護者連絡候補を読み込みました。対象日=${date}, 件数=${latestRows.length}`,
      );
    } catch (e) {
      console.error(e);
      setCandidates([]);
      setMessage(
        `保護者連絡候補の読込エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setLoadingCandidates(false);
    }
  }

  function openCandidate(row: ScheduleDayRow) {
    setSelectedDay(row);
    setParentNoticeDraft(
      s(row.parentNoticeText) || s(row.parentNoticeDraftText),
    );
    setParentNoticeManualNote("");
    setReplyTokenPlain("");
    setReplyTokenDayId("");
    void loadParentReplies(row.id);

    setMessage(
      `保護者連絡候補を開きました。対象日=${row.targetDate}, classroomId=${row.classroomId}`,
    );
  }

  async function ensureReplyToken(day: ScheduleDayRow): Promise<string> {
    if (replyTokenPlain && replyTokenDayId === day.id) {
      return replyTokenPlain;
    }

    setCreatingReplyToken(true);

    try {
      const token = makeRandomToken();
      const tokenHash = await sha256Hex(token);
      const now = new Date().toISOString();

      const createRes = await client.models.ParentNoticeReplyToken.create({
        tenantId,
        owner,

        scheduleDayId: day.id,
        classroomId: day.classroomId,
        ageTargetId: day.ageTargetId,
        targetDate: day.targetDate,

        tokenHash,
        scopeType: "CLASSROOM",
        status: "ACTIVE",

        issuedAt: now,
        expiresAt: addDaysIso(14),
        issuedBySub: owner,
        memo: "保護者連絡メニューから作成したPhase 4-1 MVP返信URLです。",
      } as MutationInput);

      if (!createRes.data) {
        throw new Error(
          formatModelErrors(
            createRes.errors,
            "保護者返信URL token の作成に失敗しました。",
          ),
        );
      }

      setReplyTokenPlain(token);
      setReplyTokenDayId(day.id);

      return token;
    } finally {
      setCreatingReplyToken(false);
    }
  }

  async function createReplyUrlOnly() {
    if (!selectedDay) return;

    setMessage("");

    try {
      const token = await ensureReplyToken(selectedDay);
      setMessage(
        `保護者返信URLを作成しました。\n${buildParentReplyUrl(token)}`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `返信URL作成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  async function generateParentNotice() {
    if (!selectedDay) return;

    const runner = client.mutations?.generateParentNotice;
    if (!runner) {
      setMessage(
        "generateParentNotice mutation が見つかりません。resource.ts と sandbox を確認してください。",
      );
      return;
    }

    setGeneratingParentNotice(true);
    setMessage("");

    try {
      let res:
        | OperationEnvelope<GenerateParentNoticeResult>
        | GenerateParentNoticeResult;

      const args: GenerateParentNoticeArgs = {
        scheduleDayId: selectedDay.id,
        manualNote: parentNoticeManualNote.trim() || undefined,
      };

      try {
        res = await runner(args);
      } catch {
        res = await runner({ input: args });
      }

      const errors = getOperationErrors(res);
      if (errors?.length) {
        throw new Error(
          formatModelErrors(errors, "お知らせ案の生成に失敗しました。"),
        );
      }

      const data = getOperationData(res);
      const draftText = s(data?.draftText);

      if (!draftText) {
        throw new Error("生成結果が空でした。");
      }

      const nextDay: ScheduleDayRow = {
        ...selectedDay,
        parentNoticeDraftText: draftText,
        parentNoticeText: draftText,
        parentNoticeStatus: s(data?.status) || "DRAFT",
        parentNoticeSourceJson:
          data?.sourceJson ?? selectedDay.parentNoticeSourceJson,
        parentNoticeGeneratedAt: new Date().toISOString(),
      };

      setParentNoticeDraft(draftText);
      mergeScheduleDay(nextDay);

      setMessage(
        data?.message
          ? `保護者向けお知らせ案を生成しました。${data.message}`
          : "保護者向けお知らせ案を生成しました。",
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `お知らせ案生成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setGeneratingParentNotice(false);
    }
  }

  async function saveParentNotice(textOverride?: string) {
    if (!selectedDay) return;

    setSavingParentNotice(true);
    setMessage("");

    try {
      const text = (textOverride ?? parentNoticeDraft).trim();
      const now = new Date().toISOString();

      const updateRes = await client.models.ScheduleDay.update({
        id: selectedDay.id,
        parentNoticeText: text,
        parentNoticeDraftText: text,
        parentNoticeStatus: text ? "CONFIRMED" : "CLEARED",
        parentNoticeConfirmedAt: text ? now : null,

        parentNoticeDeliveryMethod: null,
        parentNoticeSharedAt: null,
        parentNoticeSentAt: null,
        parentNoticeDeliveryMemo: null,
      } as MutationInput);

      if (!updateRes.data) {
        throw new Error(
          formatModelErrors(
            updateRes.errors,
            "保護者向けお知らせの保存に失敗しました。",
          ),
        );
      }

      mergeScheduleDay(updateRes.data);
      setParentNoticeDraft(text);
      setMessage(
        text
          ? "保護者向けお知らせを確定保存しました。"
          : "保護者向けお知らせをクリアしました。",
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `お知らせ保存エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setSavingParentNotice(false);
    }
  }

  async function clearParentNotice() {
    setParentNoticeDraft("");
    setParentNoticeManualNote("");
    setReplyTokenPlain("");
    setReplyTokenDayId("");
    await saveParentNotice("");
  }

  async function updateParentNoticeDeliveryState(input: {
    status: "SHARED" | "SENT";
    deliveryMethod: "WEB_SHARE" | "CLIPBOARD" | "EMAIL" | "MANUAL";
    sharedAt?: string;
    sentAt?: string;
    memo: string;
  }) {
    if (!selectedDay) return;

    const text = parentNoticeDraft.trim();
    if (!text) {
      setMessage("送信する保護者向けお知らせ本文がありません。");
      return;
    }

    const now = new Date().toISOString();

    const updateRes = await client.models.ScheduleDay.update({
      id: selectedDay.id,
      parentNoticeText: text,
      parentNoticeDraftText: text,
      parentNoticeStatus: input.status,
      parentNoticeConfirmedAt: selectedDay.parentNoticeConfirmedAt || now,
      parentNoticeDeliveryMethod: input.deliveryMethod,
      parentNoticeSharedAt:
        input.sharedAt ?? selectedDay.parentNoticeSharedAt ?? null,
      parentNoticeSentAt:
        input.sentAt ?? selectedDay.parentNoticeSentAt ?? null,
      parentNoticeDeliveryMemo: input.memo,
    } as MutationInput);

    if (!updateRes.data) {
      throw new Error(
        formatModelErrors(
          updateRes.errors,
          "保護者向けお知らせの送信状態更新に失敗しました。",
        ),
      );
    }

    mergeScheduleDay(updateRes.data);
  }

  async function copyParentNotice() {
    if (!selectedDay) return;

    setCopyingParentNotice(true);
    setMessage("");

    try {
      const token = await ensureReplyToken(selectedDay);
      const text = buildParentNoticeShareText(
        parentNoticeDraft,
        buildParentReplyUrl(token),
      );

      if (!text) {
        setMessage("コピーする保護者向けお知らせ本文がありません。");
        return;
      }

      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error(
          "このブラウザではクリップボードコピーを利用できません。",
        );
      }

      await navigator.clipboard.writeText(text);

      await updateParentNoticeDeliveryState({
        status: "SHARED",
        deliveryMethod: "CLIPBOARD",
        sharedAt: new Date().toISOString(),
        memo: "本文と保護者返信URLをクリップボードへコピーしました。",
      });

      setMessage(
        "保護者向けお知らせ本文と返信URLをコピーしました。必要な連絡アプリに貼り付けて送信してください。",
      );
    } catch (e) {
      console.error(e);
      setMessage(`コピーエラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCopyingParentNotice(false);
    }
  }

  async function shareParentNotice() {
    if (!selectedDay) return;

    setSharingParentNotice(true);
    setMessage("");

    try {
      const token = await ensureReplyToken(selectedDay);
      const text = buildParentNoticeShareText(
        parentNoticeDraft,
        buildParentReplyUrl(token),
      );

      if (!text) {
        setMessage("共有する保護者向けお知らせ本文がありません。");
        return;
      }

      const shareData: NativeShareData = {
        title: buildParentNoticeShareTitle(selectedDay),
        text,
      };

      const nav =
        typeof navigator === "undefined" ? null : (navigator as ShareNavigator);

      if (!nav?.share) {
        await copyParentNotice();
        return;
      }

      if (nav.canShare && !nav.canShare(shareData)) {
        await copyParentNotice();
        return;
      }

      await nav.share(shareData);

      await updateParentNoticeDeliveryState({
        status: "SHARED",
        deliveryMethod: "WEB_SHARE",
        sharedAt: new Date().toISOString(),
        memo: "iPhone共有シートへ本文と保護者返信URLを渡しました。",
      });

      setMessage(
        "iPhone共有シートへ保護者向けお知らせと返信URLを渡しました。実際の送信後に「送信済みにする」を押してください。",
      );
    } catch (e) {
      console.error(e);

      if (isAbortError(e)) {
        setMessage("共有をキャンセルしました。");
        return;
      }

      setMessage(
        `iPhone共有エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setSharingParentNotice(false);
    }
  }

  function formatSendResultLines(
    results?: (ParentNoticeRecipientSendResult | null)[] | null,
  ) {
    const rows = (results ?? []).filter(
      (row): row is ParentNoticeRecipientSendResult => !!row,
    );

    if (rows.length === 0) return "";

    return rows
      .map((row) => {
        const status = s(row.status) || "-";
        const childName = s(row.childName) || s(row.childKey) || "-";
        const email = s(row.email) || "-";
        const detail = s(row.message);

        return `- ${childName} / ${email} / ${status}${
          detail ? ` / ${detail}` : ""
        }`;
      })
      .join("\n");
  }

  async function sendParentNoticeEmailsToAll() {
    if (!selectedDay) return;

    const runner = client.mutations?.sendParentNoticeEmails;
    if (!runner) {
      setMessage(
        "sendParentNoticeEmails mutation が見つかりません。resource.ts と sandbox を確認してください。",
      );
      return;
    }

    const text = parentNoticeDraft.trim();
    if (!text) {
      setMessage("送信する保護者向けお知らせ本文がありません。");
      return;
    }

    const ok = window.confirm(
      "選択中クラスの保護者全員へ、子ども別返信URL付きメールを送信します。よろしいですか？",
    );

    if (!ok) return;

    setSendingParentNoticeEmails(true);
    setMessage("");

    try {
      let res:
        | OperationEnvelope<SendParentNoticeEmailsResult>
        | SendParentNoticeEmailsResult;

      const args: SendParentNoticeEmailsArgs = {
        scheduleDayId: selectedDay.id,
        noticeText: text,
        baseUrl:
          typeof window === "undefined" ? undefined : window.location.origin,
      };

      try {
        res = await runner(args);
      } catch {
        res = await runner({ input: args });
      }

      const errors = getOperationErrors(res);
      if (errors?.length) {
        throw new Error(
          formatModelErrors(errors, "保護者連絡メールの送信に失敗しました。"),
        );
      }

      const data = getOperationData(res);
      const now = new Date().toISOString();

      if ((data.sentCount ?? 0) > 0) {
        await updateParentNoticeDeliveryState({
          status: "SENT",
          deliveryMethod: "EMAIL",
          sharedAt: selectedDay.parentNoticeSharedAt ?? now,
          sentAt: now,
          memo: `子ども別返信URL付きメールを一括送信しました。送信=${
            data.sentCount ?? 0
          }件 / 失敗=${data.failedCount ?? 0}件`,
        });
      }

      await loadParentReplies(selectedDay.id);

      const lines = formatSendResultLines(data.results);
      setMessage(
        `${data.message || "保護者連絡メールを送信しました。"}${
          lines ? `\n${lines}` : ""
        }`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `保護者連絡メール送信エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setSendingParentNoticeEmails(false);
    }
  }

  async function markParentNoticeSent() {
    if (!selectedDay) return;

    const text = parentNoticeDraft.trim();
    if (!text) {
      setMessage("送信済みにする保護者向けお知らせ本文がありません。");
      return;
    }

    const ok = window.confirm(
      "保護者への送信が完了したものとして、保育360側に「送信済み」を記録します。よろしいですか？",
    );

    if (!ok) return;

    setMarkingParentNoticeSent(true);
    setMessage("");

    try {
      const now = new Date().toISOString();
      const deliveryMethod =
        s(selectedDay.parentNoticeDeliveryMethod) || "MANUAL";

      await updateParentNoticeDeliveryState({
        status: "SENT",
        deliveryMethod:
          deliveryMethod === "WEB_SHARE" ||
          deliveryMethod === "CLIPBOARD" ||
          deliveryMethod === "EMAIL"
            ? deliveryMethod
            : "MANUAL",
        sharedAt: selectedDay.parentNoticeSharedAt ?? now,
        sentAt: now,
        memo: "保育士が送信済みとして記録しました。",
      });

      setMessage("保護者向けお知らせを送信済みにしました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `送信済み記録エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setMarkingParentNoticeSent(false);
    }
  }

  async function confirmParentReply(reply: ParentNoticeReplyRow) {
    if (!reply.id) return;

    setConfirmingReplyId(reply.id);
    setMessage("");

    try {
      const updateRes = await client.models.ParentNoticeReply.update({
        id: reply.id,
        status: "CONFIRMED",
        confirmedAt: new Date().toISOString(),
        confirmedBySub: owner,
      } as MutationInput);

      if (!updateRes.data) {
        throw new Error(
          formatModelErrors(
            updateRes.errors,
            "保護者返信の確認済み更新に失敗しました。",
          ),
        );
      }

      setParentReplies((prev) =>
        prev.map((row) => (row.id === reply.id ? updateRes.data! : row)),
      );
      setMessage("保護者返信を園確認済みにしました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `確認済み更新エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setConfirmingReplyId("");
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
          display: "grid",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>保護者連絡</h2>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            Schedule日案から、明日送る保護者向け連絡候補を確認・生成・確定し、
            iPhone共有またはコピーで実際の連絡アプリへ渡します。 Phase
            4では、返信URLから保護者がOKサイン・お迎え予定・家庭での様子を返せます。
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
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

          <button
            onClick={loadParentNoticeCandidates}
            disabled={loadingCandidates}
          >
            {loadingCandidates ? "読込中..." : "候補を再読込"}
          </button>
        </div>

        {message ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              background: "#f6fbff",
              border: "1px solid #dbeafe",
              borderRadius: 8,
              padding: 12,
            }}
          >
            {message}
          </pre>
        ) : null}
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #d0d7de",
          borderRadius: 8,
          background: "#f8fafc",
          display: "grid",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>明日の保護者連絡候補</h3>

        {candidates.length === 0 ? (
          <div style={{ color: "#666" }}>
            候補はまだ読み込まれていません。対象日を確認して「候補を再読込」を押してください。
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 1120,
                borderCollapse: "collapse",
                background: "#fff",
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", background: "#f1f5f9" }}>
                  <th style={{ padding: 8 }}>クラス</th>
                  <th style={{ padding: 8 }}>対象年齢</th>
                  <th style={{ padding: 8 }}>対象日</th>
                  <th style={{ padding: 8 }}>状態</th>
                  <th style={{ padding: 8 }}>送信方法</th>
                  <th style={{ padding: 8 }}>本文プレビュー</th>
                  <th style={{ padding: 8 }}>送信記録</th>
                  <th style={{ padding: 8 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((row) => {
                  const selected = selectedDay?.id === row.id;

                  return (
                    <tr
                      key={row.id}
                      style={{
                        background: selected ? "#ecfeff" : "#fff",
                      }}
                    >
                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #eef2f7",
                          minWidth: 140,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {classroomLabels[row.classroomId] || row.classroomId}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {row.classroomId}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #eef2f7",
                          minWidth: 140,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {ageTargetLabels[row.ageTargetId] || row.ageTargetId}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {row.ageTargetId}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #eef2f7",
                          minWidth: 120,
                        }}
                      >
                        <div>{row.targetDate}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {row.status} / v{row.issueVersion ?? "-"}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #eef2f7",
                          minWidth: 110,
                        }}
                      >
                        {parentNoticeStatusLabel(row.parentNoticeStatus)}
                      </td>

                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #eef2f7",
                          minWidth: 110,
                        }}
                      >
                        {parentNoticeDeliveryMethodLabel(
                          row.parentNoticeDeliveryMethod,
                        )}
                      </td>

                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #eef2f7",
                          fontSize: 12,
                          whiteSpace: "pre-wrap",
                          minWidth: 320,
                        }}
                      >
                        {parentNoticePreviewText(row)}
                      </td>

                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #eef2f7",
                          fontSize: 12,
                          color: "#555",
                          minWidth: 180,
                        }}
                      >
                        <div>
                          sharedAt: {formatDateTime(row.parentNoticeSharedAt)}
                        </div>
                        <div>
                          sentAt: {formatDateTime(row.parentNoticeSentAt)}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #eef2f7",
                          minWidth: 100,
                        }}
                      >
                        <button onClick={() => openCandidate(row)}>
                          {selected ? "選択中" : "開く"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDay ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #d0d7de",
            borderRadius: 8,
            background: "#fff",
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>選択中の保護者連絡</h3>
            <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
              クラス:{" "}
              <b>
                {classroomLabels[selectedDay.classroomId] ||
                  selectedDay.classroomId}
              </b>{" "}
              / 対象年齢:{" "}
              <b>
                {ageTargetLabels[selectedDay.ageTargetId] ||
                  selectedDay.ageTargetId}
              </b>{" "}
              / 対象日: <b>{selectedDay.targetDate}</b>
            </div>
          </div>

          <label>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>手入力の補足</div>
            <textarea
              value={parentNoticeManualNote}
              onChange={(e) => setParentNoticeManualNote(e.target.value)}
              placeholder="例: 明日は水遊びです。水着、タオル、着替えをお持ちください。"
              disabled={busy}
              style={{
                width: "100%",
                minHeight: 64,
                resize: "vertical",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={generateParentNotice} disabled={busy}>
              {generatingParentNotice ? "生成中..." : "お知らせ案を生成"}
            </button>

            <button onClick={() => saveParentNotice()} disabled={busy}>
              {savingParentNotice ? "保存中..." : "候補を確定"}
            </button>

            <button onClick={createReplyUrlOnly} disabled={busy}>
              {creatingReplyToken ? "作成中..." : "返信URLを作成"}
            </button>

            <button onClick={shareParentNotice} disabled={busy}>
              {sharingParentNotice ? "共有中..." : "iPhoneで送信する"}
            </button>

            <button onClick={sendParentNoticeEmailsToAll} disabled={busy}>
              {sendingParentNoticeEmails ? "送信中..." : "全員にメール送信"}
            </button>

            <button onClick={copyParentNotice} disabled={busy}>
              {copyingParentNotice ? "コピー中..." : "コピー"}
            </button>

            <button onClick={markParentNoticeSent} disabled={busy}>
              {markingParentNoticeSent ? "記録中..." : "送信済みにする"}
            </button>

            <button onClick={clearParentNotice} disabled={busy}>
              クリア
            </button>

            <button
              onClick={() => loadParentReplies(selectedDay.id)}
              disabled={loadingParentReplies}
            >
              {loadingParentReplies ? "返信読込中..." : "返信を再読込"}
            </button>
          </div>

          {currentReplyUrl ? (
            <div
              style={{
                padding: 12,
                border: "1px solid #ccfbf1",
                background: "#f0fdfa",
                borderRadius: 8,
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 700 }}>保護者返信URL</div>
              <div style={{ fontSize: 12, color: "#555" }}>
                iPhone共有・コピー時には、このURLが本文末尾に自動で追加されます。
              </div>
              <code style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {currentReplyUrl}
              </code>
            </div>
          ) : null}

          <label>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>お知らせ本文</div>
            <textarea
              value={parentNoticeDraft}
              onChange={(e) => setParentNoticeDraft(e.target.value)}
              placeholder="ここに保護者向けお知らせ文を入力・編集します。"
              disabled={busy}
              style={{
                width: "100%",
                minHeight: 180,
                resize: "vertical",
                whiteSpace: "pre-wrap",
              }}
            />
          </label>

          <div
            style={{
              padding: 16,
              border: "1px solid #d0d7de",
              borderRadius: 8,
              background: "#f8fafc",
              display: "grid",
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>保護者返信一覧</h3>

            {loadingParentReplies ? (
              <div>返信を読み込み中です...</div>
            ) : parentReplies.length === 0 ? (
              <div style={{ color: "#666" }}>まだ保護者返信はありません。</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 980,
                    borderCollapse: "collapse",
                    background: "#fff",
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left", background: "#f1f5f9" }}>
                      <th style={{ padding: 8 }}>子ども</th>
                      <th style={{ padding: 8 }}>OK</th>
                      <th style={{ padding: 8 }}>お迎え</th>
                      <th style={{ padding: 8 }}>時刻</th>
                      <th style={{ padding: 8 }}>家庭での様子</th>
                      <th style={{ padding: 8 }}>状態</th>
                      <th style={{ padding: 8 }}>送信日時</th>
                      <th style={{ padding: 8 }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parentReplies.map((reply) => (
                      <tr key={reply.id}>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #eef2f7",
                            minWidth: 120,
                            fontWeight: 700,
                          }}
                        >
                          {reply.childName || reply.childKey || "-"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #eef2f7",
                            minWidth: 60,
                          }}
                        >
                          {reply.okSigned ? "済" : "-"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #eef2f7",
                            minWidth: 160,
                          }}
                        >
                          <div>{reply.pickupPersonRelation || "-"}</div>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {reply.pickupPersonName || ""}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #eef2f7",
                            minWidth: 80,
                          }}
                        >
                          {reply.pickupPlannedTime || "-"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #eef2f7",
                            minWidth: 280,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {reply.homeNote || "-"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #eef2f7",
                            minWidth: 110,
                          }}
                        >
                          {parentReplyStatusLabel(reply.status)}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #eef2f7",
                            minWidth: 150,
                            fontSize: 12,
                          }}
                        >
                          {formatDateTime(reply.submittedAt)}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #eef2f7",
                            minWidth: 120,
                          }}
                        >
                          {s(reply.status).toUpperCase() === "CONFIRMED" ? (
                            "確認済み"
                          ) : (
                            <button
                              onClick={() => confirmParentReply(reply)}
                              disabled={confirmingReplyId === reply.id}
                            >
                              {confirmingReplyId === reply.id
                                ? "更新中..."
                                : "確認済みにする"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            color: "#666",
          }}
        >
          一覧から保護者連絡候補を選択してください。
        </div>
      )}
    </div>
  );
}
