"use client";

import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type ModelError = {
  message?: string | null;
};

type GetParentNoticeReplyContextArgs = {
  replyToken: string;
};

type GetParentNoticeReplyContextResult = {
  scheduleDayId?: string | null;
  classroomId?: string | null;
  ageTargetId?: string | null;
  targetDate?: string | null;
  scopeType?: string | null;
  childKey?: string | null;
  childName?: string | null;
  status?: string | null;
  message?: string | null;
};

type GetParentChildWeeklyLetterArgs = {
  replyToken: string;
  demoCode?: string;
};

type GetParentChildWeeklyLetterResult = {
  childKey?: string | null;
  childName?: string | null;
  title?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  markdownText?: string | null;
  status?: string | null;
  message?: string | null;
};

type SubmitParentNoticeReplyArgs = {
  replyToken: string;
  demoCode?: string;

  childKey?: string;
  childName?: string;

  okSigned: boolean;

  pickupPersonRelation?: string;
  pickupPersonName?: string;
  pickupPlannedTime?: string;

  homeNote?: string;
  userAgent?: string;
};

type SubmitParentNoticeReplyResult = {
  replyId?: string | null;
  status?: string | null;
  message?: string | null;
};

type OperationEnvelope<TData> = {
  data?: TData | null;
  errors?: ModelError[] | null;
};

type OperationRunner<TArgs, TData> = (
  args: TArgs | { input: TArgs },
) => Promise<OperationEnvelope<TData> | TData>;

type ParentReplyClient = {
  mutations?: {
    getParentNoticeReplyContext?: OperationRunner<
      GetParentNoticeReplyContextArgs,
      GetParentNoticeReplyContextResult
    >;
    getParentChildWeeklyLetter?: OperationRunner<
      GetParentChildWeeklyLetterArgs,
      GetParentChildWeeklyLetterResult
    >;
    submitParentNoticeReply?: OperationRunner<
      SubmitParentNoticeReplyArgs,
      SubmitParentNoticeReplyResult
    >;
  };
};

function s(value: unknown): string {
  return String(value ?? "").trim();
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

async function runOperation<TArgs, TData>(
  runner: OperationRunner<TArgs, TData>,
  args: TArgs,
): Promise<TData> {
  let res: OperationEnvelope<TData> | TData;

  try {
    res = await runner(args);
  } catch {
    res = await runner({ input: args });
  }

  const errors = getOperationErrors(res);
  if (errors?.length) {
    throw new Error(formatModelErrors(errors, "処理に失敗しました。"));
  }

  return getOperationData(res);
}

function getReplyTokenFromUrl(): string {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  return s(params.get("token") || params.get("replyToken"));
}

function formatDate(value?: string | null) {
  const text = s(value);
  if (!text) return "-";
  return text.replace(/-/g, "/");
}

export default function ParentReplyForm() {
  const client = useMemo(
    () =>
      generateClient<Schema>({
        authMode: "apiKey",
      }) as unknown as ParentReplyClient,
    [],
  );

  const replyToken = useMemo(() => getReplyTokenFromUrl(), []);

  const [childKey, setChildKey] = useState("");
  const [childName, setChildName] = useState("");
  const [scopeType, setScopeType] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [demoCode, setDemoCode] = useState("");

  const [okSigned, setOkSigned] = useState(false);

  const [pickupPersonRelation, setPickupPersonRelation] = useState("母");
  const [pickupPersonName, setPickupPersonName] = useState("");
  const [pickupPlannedTime, setPickupPlannedTime] = useState("");
  const [homeNote, setHomeNote] = useState("");

  const [loadingContext, setLoadingContext] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [contextMessage, setContextMessage] = useState("");

  const [loadingWeeklyLetter, setLoadingWeeklyLetter] = useState(false);
  const [weeklyLetter, setWeeklyLetter] =
    useState<GetParentChildWeeklyLetterResult | null>(null);
  const [weeklyLetterMessage, setWeeklyLetterMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const isChildScoped = s(scopeType).toUpperCase() === "CHILD";
  const hasWeeklyLetter = s(weeklyLetter?.status).toUpperCase() === "READY";

  function validateDemoCodeForUi(setter: (message: string) => void) {
    if (!s(demoCode)) {
      setter("園から案内された4桁の確認コードを入力してください。");
      return false;
    }

    return true;
  }

  async function loadReplyContext() {
    const runner = client.mutations?.getParentNoticeReplyContext;

    if (!replyToken || !runner) {
      return;
    }

    setLoadingContext(true);
    setContextMessage("");

    try {
      const data = await runOperation<
        GetParentNoticeReplyContextArgs,
        GetParentNoticeReplyContextResult
      >(runner, { replyToken });

      setScopeType(s(data.scopeType));
      setChildKey(s(data.childKey));
      setTargetDate(s(data.targetDate));

      if (s(data.childName)) {
        setChildName(s(data.childName));
      }

      setContextLoaded(true);
      setContextMessage(data?.message || "返信画面を開きました。");
    } catch (e) {
      console.error(e);
      setContextLoaded(false);
      setContextMessage(
        `返信URL確認エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingContext(false);
    }
  }

  useEffect(() => {
    if (replyToken) {
      void loadReplyContext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyToken]);

  async function loadWeeklyLetter() {
    const runner = client.mutations?.getParentChildWeeklyLetter;

    if (!runner) {
      setWeeklyLetterMessage(
        "getParentChildWeeklyLetter mutation が見つかりません。resource.ts と sandbox を確認してください。",
      );
      return;
    }

    if (!replyToken) {
      setWeeklyLetterMessage(
        "返信URLが正しくありません。園から受け取ったURLを確認してください。",
      );
      return;
    }

    if (!contextLoaded) {
      setWeeklyLetterMessage(
        "返信URLの確認が完了していません。少し待ってから再度お試しください。",
      );
      return;
    }

    if (!validateDemoCodeForUi(setWeeklyLetterMessage)) {
      return;
    }

    setLoadingWeeklyLetter(true);
    setWeeklyLetterMessage("");

    try {
      const data = await runOperation<
        GetParentChildWeeklyLetterArgs,
        GetParentChildWeeklyLetterResult
      >(runner, { replyToken, demoCode: s(demoCode) });

      setWeeklyLetter(data);
      setWeeklyLetterMessage(
        data?.message || "週末こどもだよりを確認しました。",
      );
    } catch (e) {
      console.error(e);
      setWeeklyLetter(null);
      setWeeklyLetterMessage(
        `週末こどもだより読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingWeeklyLetter(false);
    }
  }

  async function submitReply() {
    const runner = client.mutations?.submitParentNoticeReply;

    if (!runner) {
      setMessage(
        "submitParentNoticeReply mutation が見つかりません。resource.ts と sandbox を確認してください。",
      );
      return;
    }

    if (!replyToken) {
      setMessage(
        "返信URLが正しくありません。園から受け取ったURLを確認してください。",
      );
      return;
    }

    if (isChildScoped && !contextLoaded) {
      setMessage(
        "返信URLの確認が完了していません。少し待ってから送信してください。",
      );
      return;
    }

    if (!validateDemoCodeForUi(setMessage)) {
      return;
    }

    if (!s(childName)) {
      setMessage("お子さまの名前を入力してください。");
      return;
    }

    if (!okSigned) {
      setMessage("内容を確認したうえで、OKサインにチェックしてください。");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const args: SubmitParentNoticeReplyArgs = {
        replyToken,
        demoCode: s(demoCode),

        childKey: s(childKey),
        childName: s(childName),

        okSigned,

        pickupPersonRelation: s(pickupPersonRelation),
        pickupPersonName: s(pickupPersonName),
        pickupPlannedTime: s(pickupPlannedTime),

        homeNote: s(homeNote),
        userAgent:
          typeof navigator === "undefined" ? "" : s(navigator.userAgent),
      };

      const data = await runOperation<
        SubmitParentNoticeReplyArgs,
        SubmitParentNoticeReplyResult
      >(runner, args);

      setSubmitted(true);
      setMessage(
        data?.message || "返信を送信しました。ありがとうございました。",
      );
    } catch (e) {
      console.error(e);
      setMessage(`送信エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 16,
        display: "grid",
        placeItems: "start center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#fff",
          border: "1px solid #d0d7de",
          borderRadius: 12,
          padding: 20,
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>保護者連絡への返信</h1>
          <div style={{ marginTop: 6, color: "#555", fontSize: 14 }}>
            内容確認、お迎え予定、ご家庭での様子を入力してください。
          </div>
        </div>

        {!replyToken ? (
          <div
            style={{
              padding: 12,
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#991b1b",
              borderRadius: 8,
            }}
          >
            返信URLが正しくありません。園から受け取ったURLを確認してください。
          </div>
        ) : null}

        {replyToken ? (
          <div
            style={{
              padding: 12,
              border: contextLoaded ? "1px solid #bbf7d0" : "1px solid #dbeafe",
              background: contextLoaded ? "#f0fdf4" : "#f6fbff",
              borderRadius: 8,
              color: contextLoaded ? "#166534" : "#334155",
              whiteSpace: "pre-wrap",
            }}
          >
            {loadingContext
              ? "返信URLを確認しています..."
              : contextMessage || "返信URLを確認します。"}
            {targetDate ? `\n対象日: ${formatDate(targetDate)}` : ""}
          </div>
        ) : null}

        {message ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              margin: 0,
              padding: 12,
              borderRadius: 8,
              border: submitted ? "1px solid #bbf7d0" : "1px solid #dbeafe",
              background: submitted ? "#f0fdf4" : "#f6fbff",
            }}
          >
            {message}
          </pre>
        ) : null}

        <div
          style={{
            padding: 14,
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
            borderRadius: 10,
            display: "grid",
            gap: 8,
          }}
        >
          <label>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>確認コード</div>
            <input
              value={demoCode}
              onChange={(e) => setDemoCode(e.target.value)}
              placeholder="園から案内された4桁のコード"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={12}
              disabled={submitting}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 10,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 16,
              }}
            />
          </label>
          <div style={{ color: "#666", fontSize: 12, lineHeight: 1.6 }}>
            デモ用確認コードは 1234
            です。本番運用では園から案内された確認コードを入力します。
          </div>
        </div>

        <div
          style={{
            padding: 14,
            border: "1px solid #e5e7eb",
            background: "#fffdf5",
            borderRadius: 10,
            display: "grid",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 800 }}>週末こどもだより</div>
            <div style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
              子ども別返信URLから、お子さまの週末こどもだよりだけを閲覧できます。
            </div>
          </div>

          <button
            type="button"
            onClick={loadWeeklyLetter}
            disabled={
              loadingWeeklyLetter ||
              !replyToken ||
              loadingContext ||
              !contextLoaded ||
              !s(demoCode)
            }
            style={{
              justifySelf: "start",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #92400e",
              background: loadingWeeklyLetter ? "#fde68a" : "#f59e0b",
              color: "#111827",
              fontWeight: 700,
            }}
          >
            {loadingWeeklyLetter ? "読み込み中..." : "週末こどもだよりを見る"}
          </button>

          {weeklyLetterMessage ? (
            <div
              style={{
                whiteSpace: "pre-wrap",
                color: hasWeeklyLetter ? "#166534" : "#92400e",
                fontSize: 13,
              }}
            >
              {weeklyLetterMessage}
            </div>
          ) : null}

          {hasWeeklyLetter ? (
            <div
              style={{
                border: "1px solid #fed7aa",
                borderRadius: 10,
                background: "#fff",
                padding: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  {weeklyLetter?.title ||
                    `${childName || "お子さま"}さん 週末だより`}
                </div>
                <div style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
                  期間: {formatDate(weeklyLetter?.periodStart)} 〜{" "}
                  {formatDate(weeklyLetter?.periodEnd)}
                </div>
              </div>

              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: 1.75,
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontSize: 14,
                  color: "#111827",
                }}
              >
                {weeklyLetter?.markdownText || "本文がありません。"}
              </pre>
            </div>
          ) : null}
        </div>

        {submitted ? (
          <div
            style={{
              padding: 16,
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              borderRadius: 8,
              color: "#166534",
            }}
          >
            返信は送信済みです。この画面を閉じてください。
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <label>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                お子さまの名前
              </div>
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="例: 山田 太郎"
                disabled={submitting || loadingContext || isChildScoped}
                readOnly={isChildScoped}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 10,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  background: isChildScoped ? "#f8fafc" : "#fff",
                }}
              />
              {isChildScoped ? (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  子ども別返信URLから自動表示しています。
                </div>
              ) : null}
            </label>

            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: 12,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <input
                type="checkbox"
                checked={okSigned}
                onChange={(e) => setOkSigned(e.target.checked)}
                disabled={submitting}
              />
              <span>園からの連絡内容を確認しました。</span>
            </label>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              }}
            >
              <label>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  お迎え予定者
                </div>
                <select
                  value={pickupPersonRelation}
                  onChange={(e) => setPickupPersonRelation(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                  }}
                >
                  <option value="母">母</option>
                  <option value="父">父</option>
                  <option value="祖母">祖母</option>
                  <option value="祖父">祖父</option>
                  <option value="その他">その他</option>
                </select>
              </label>

              <label>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  お迎え予定者名
                </div>
                <input
                  value={pickupPersonName}
                  onChange={(e) => setPickupPersonName(e.target.value)}
                  placeholder="例: 山田 花子"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 10,
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                  }}
                />
              </label>

              <label>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  お迎え予定時刻
                </div>
                <input
                  type="time"
                  value={pickupPlannedTime}
                  onChange={(e) => setPickupPlannedTime(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 10,
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                  }}
                />
              </label>
            </div>

            <label>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                家庭での子どもの様子
              </div>
              <textarea
                value={homeNote}
                onChange={(e) => setHomeNote(e.target.value)}
                placeholder="例: 昨夜は少し咳がありましたが、朝は元気です。"
                disabled={submitting}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: 140,
                  resize: "vertical",
                  padding: 10,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                }}
              />
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                スマートフォンの音声入力も利用できます。
              </div>
            </label>

            <button
              onClick={submitReply}
              disabled={
                submitting || !replyToken || loadingContext || !s(demoCode)
              }
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #0f766e",
                background: submitting ? "#ccfbf1" : "#0f766e",
                color: submitting ? "#115e59" : "#fff",
                fontWeight: 700,
              }}
            >
              {submitting ? "送信中..." : "返信を送信"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
