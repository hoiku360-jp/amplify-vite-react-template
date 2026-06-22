import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/generate-parent-notice";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

type JsonObject = Record<string, unknown>;
type DataClientEnv = Parameters<typeof getAmplifyDataClientConfig>[0];

type GenerateParentNoticeArgs = {
  scheduleDayId: string;
  manualNote?: string | null;
};

type ScheduleDayRow = Schema["ScheduleDay"]["type"] & {
  id: string;
  tenantId?: string | null;
  owner?: string | null;
  classroomId?: string | null;
  ageTargetId?: string | null;
  targetDate?: string | null;
  title?: string | null;
  notes?: string | null;
  status?: string | null;
};

type ScheduleDayItemRow = Schema["ScheduleDayItem"]["type"] & {
  id: string;
  scheduleDayId?: string | null;
  tenantId?: string | null;
  owner?: string | null;
  title?: string | null;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  sortOrder?: number | null;
  status?: string | null;
  practiceCode?: string | null;
  practiceTitleSnapshot?: string | null;
};

type PracticeCodeRow = Schema["PracticeCode"]["type"] & {
  id?: string | null;
  practice_code?: string | null;
  name?: string | null;
  memo?: string | null;
  category_name?: string | null;
  practiceCategory?: string | null;
  status?: string | null;
};

type ClassCalendarEventRow = Schema["ClassCalendarEvent"]["type"] & {
  id: string;
  tenantId?: string | null;
  owner?: string | null;
  scopeType?: string | null;
  classroomId?: string | null;
  title?: string | null;
  description?: string | null;
  eventType?: string | null;
  dateMode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  showInHomeNotice?: boolean | null;
  homeNoticeText?: string | null;
  sortOrder?: number | null;
  status?: string | null;
};

type ParentNoticeEventSource = {
  id: string;
  scopeType: string;
  classroomId: string;
  title: string;
  description: string;
  eventType: string;
  dateMode: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  homeNoticeText: string;
  sortOrder: number;
};

type ParentNoticePracticeSource = {
  itemId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  practiceCode: string;
  practiceTitleSnapshot: string;
  practiceName: string;
  practiceMemo: string;
  practiceCategory: string;
};

type NoticeSource = {
  scheduleDayId: string;
  tenantId: string;
  classroomId: string;
  targetDate: string;
  scheduleTitle: string;
  scheduleNotes: string;
  manualNote: string;
  events: ParentNoticeEventSource[];
  practices: ParentNoticePracticeSource[];
  generatedAt: string;
  sourceVersion: number;
};

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function n(v: unknown, fallback = 0): number {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
}

function truncateText(text: string, max = 2400): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…(truncated)…`;
}

function stripCodeFence(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function safeJsonParse(text: string): JsonObject | null {
  try {
    return JSON.parse(stripCodeFence(text)) as JsonObject;
  } catch {
    return null;
  }
}

function errorText(errors?: Array<{ message?: string | null }> | null): string {
  const messages = (errors ?? []).map((e) => s(e.message)).filter(Boolean);
  return messages.join("\n") || "GraphQL request failed.";
}

function ymdToDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function compareYmd(a: string, b: string): number {
  return a.localeCompare(b);
}

function getUtcDayOfWeek(ymd: string): number {
  const date = ymdToDate(ymd);
  return date ? date.getUTCDay() : -1;
}

function getDayOfMonth(ymd: string): number {
  const parts = ymd.split("-");
  return Number(parts[2] ?? 0);
}

function isEventApplicableToDate(
  event: ClassCalendarEventRow,
  targetDate: string,
): boolean {
  const status = s(event.status || "ACTIVE").toUpperCase();
  if (status === "ARCHIVED") return false;

  const mode = s(event.dateMode || "SINGLE").toUpperCase();
  const startDate = s(event.startDate);
  const endDate = s(event.endDate) || startDate;

  if (!startDate) return false;
  if (compareYmd(targetDate, startDate) < 0) return false;
  if (endDate && compareYmd(targetDate, endDate) > 0) return false;

  if (mode === "SINGLE") {
    return targetDate === startDate;
  }

  if (mode === "RANGE") {
    return (
      compareYmd(targetDate, startDate) >= 0 &&
      compareYmd(targetDate, endDate) <= 0
    );
  }

  if (mode === "WEEKLY") {
    const eventDay = n(event.dayOfWeek, -1);
    return eventDay >= 0 && eventDay === getUtcDayOfWeek(targetDate);
  }

  if (mode === "MONTHLY_DATE") {
    const eventDay = n(event.dayOfMonth, -1);
    return eventDay > 0 && eventDay === getDayOfMonth(targetDate);
  }

  return false;
}

function toEventSource(event: ClassCalendarEventRow): ParentNoticeEventSource {
  return {
    id: s(event.id),
    scopeType: s(event.scopeType),
    classroomId: s(event.classroomId),
    title: s(event.title),
    description: s(event.description),
    eventType: s(event.eventType),
    dateMode: s(event.dateMode),
    startDate: s(event.startDate),
    endDate: s(event.endDate),
    startTime: s(event.startTime),
    endTime: s(event.endTime),
    homeNoticeText: s(event.homeNoticeText),
    sortOrder: n(event.sortOrder),
  };
}

function buildPrompt(source: NoticeSource): string {
  const eventLines =
    source.events.length === 0
      ? "（該当する行事・予定なし）"
      : source.events
          .map((event, index) => {
            const time =
              event.startTime || event.endTime
                ? ` / 時間=${event.startTime || "-"}〜${event.endTime || "-"}`
                : "";
            const notice = event.homeNoticeText
              ? ` / 家庭への連絡=${event.homeNoticeText}`
              : "";
            const desc = event.description
              ? ` / 説明=${event.description}`
              : "";
            return `${index + 1}. ${event.title}（${event.eventType || "OTHER"}${time}${notice}${desc}）`;
          })
          .join("\n");

  const practiceLines =
    source.practices.length === 0
      ? "（該当するPracticeなし）"
      : source.practices
          .map((practice, index) => {
            const time =
              practice.startTime || practice.endTime
                ? ` / 時間=${practice.startTime || "-"}〜${practice.endTime || "-"}`
                : "";
            const memo = practice.practiceMemo
              ? ` / Practice概要=${truncateText(practice.practiceMemo, 500)}`
              : "";
            const desc = practice.description
              ? ` / 日案説明=${practice.description}`
              : "";
            return `${index + 1}. ${practice.title}${time}${desc} / practiceCode=${practice.practiceCode}${memo}`;
          })
          .join("\n");

  const manual = source.manualNote || "（手入力補足なし）";
  const scheduleNotes = source.scheduleNotes || "（日案メモなし）";

  return `
あなたは保育園の担任が保護者向けのお知らせ文を作ることを支援する日本語アシスタントです。

以下の「日案」「園行事・クラス行事」「Practice」「手入力補足」をもとに、保護者へ伝える短いお知らせ文の下書きを作成してください。

重要な方針:
- このお知らせは、対象日にこれから実施する予定を保護者へ事前に伝える文章です
- Practice概要や日案説明が過去形・実施済み表現で書かれていても、保護者向け本文では必ず未来形・予定形に変換する
- 「行いました」「実施しました」「確認しました」「楽しみました」「できました」「取り組みました」など、実施済み・活動報告の表現は使わない
- 「行います」「予定しています」「取り組みます」「確認します」「楽しむ予定です」など、予定を知らせる表現を使う
- 「本日」は活動報告のように読まれやすいため、原則として「明日」「当日」「対象日」または日付を主語にして書く
- 保護者が行動できるように、持ち物・服装・家庭での準備・体調確認が必要な場合は明確に書く
- 入力にない持ち物や準備を断定的に追加しない
- 不確かな内容は「必要に応じて」「ご確認ください」など控えめにする
- 子どもの個人情報や個別の評価は書かない
- 保育士が最終確認する下書きとして、丁寧で自然な日本語にする
- 文章は2〜5文程度。長くしすぎない
- 保護者への送信済み文ではなく、あくまで「下書き」として作る
- 出力はJSONのみ
- JSON形式は必ず次の通り:
{
  "draftText": "..."
}

対象日:
${source.targetDate}

日案タイトル:
${source.scheduleTitle || "（なし）"}

日案メモ:
${scheduleNotes}

行事・予定:
${eventLines}

Practice:
${practiceLines}

手入力補足:
${manual}
`.trim();
}

async function invokeBedrockJson(
  modelId: string,
  prompt: string,
): Promise<{ draftText: string; rawText: string }> {
  const region = process.env.AWS_REGION || "ap-northeast-1";
  const client = new BedrockRuntimeClient({ region });

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1200,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    }),
  });

  const response = await client.send(command);
  const rawBody = new TextDecoder("utf-8").decode(response.body);
  const json = JSON.parse(rawBody) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const rawText = s(json.content?.find((x) => x?.type === "text")?.text ?? "");
  const parsed = safeJsonParse(rawText);

  if (!parsed) {
    throw new Error(`AI response is not valid JSON: ${rawText}`);
  }

  const draftText = s(parsed.draftText);
  if (!draftText) {
    throw new Error(`AI response missing draftText: ${rawText}`);
  }

  return { draftText, rawText };
}

async function listAll<T>(
  listFn: (args: {
    limit?: number;
    nextToken?: string | null;
    filter?: Record<string, unknown>;
  }) => Promise<{
    data?: T[] | null;
    nextToken?: string | null;
    errors?: Array<{ message?: string | null }> | null;
  }>,
  args: { filter?: Record<string, unknown> } = {},
): Promise<T[]> {
  const rows: T[] = [];
  let nextToken: string | null | undefined = null;

  do {
    const result = await listFn({
      limit: 1000,
      nextToken,
      ...(args.filter ? { filter: args.filter } : {}),
    });

    if (result.errors?.length) {
      throw new Error(errorText(result.errors));
    }

    rows.push(...(result.data ?? []));
    nextToken = result.nextToken ?? null;
  } while (nextToken);

  return rows;
}

async function findPracticesByCodes(
  dataClient: ReturnType<typeof generateClient<Schema>>,
  practiceCodes: string[],
): Promise<Record<string, PracticeCodeRow>> {
  const uniqueCodes = Array.from(new Set(practiceCodes.map(s).filter(Boolean)));
  const out: Record<string, PracticeCodeRow> = {};

  for (let i = 0; i < uniqueCodes.length; i += 20) {
    const batch = uniqueCodes.slice(i, i + 20);
    const result = await dataClient.models.PracticeCode.list({
      limit: 1000,
      filter: {
        or: batch.map((practiceCode) => ({
          practice_code: { eq: practiceCode },
        })),
      },
    });

    if (result.errors?.length) {
      throw new Error(`PracticeCode list failed: ${errorText(result.errors)}`);
    }

    for (const row of (result.data ?? []) as PracticeCodeRow[]) {
      const code = s(row.practice_code);
      if (code) out[code] = row;
    }
  }

  return out;
}

function buildFallbackDraft(source: NoticeSource): string {
  const lines: string[] = [];

  for (const event of source.events) {
    if (event.homeNoticeText) {
      lines.push(event.homeNoticeText);
    } else if (event.title) {
      lines.push(`${source.targetDate}は${event.title}を予定しています。`);
    }
  }

  if (source.manualNote) {
    lines.push(source.manualNote);
  }

  if (lines.length === 0 && source.practices.length > 0) {
    const titles = source.practices
      .map((x) => x.title || x.practiceName)
      .filter(Boolean)
      .slice(0, 3)
      .join("、");
    if (titles) {
      lines.push(`${source.targetDate}は${titles}を予定しています。`);
    }
  }

  if (lines.length === 0) {
    lines.push("本日は、保護者向けに追加でお知らせする事項はありません。");
  }

  return Array.from(new Set(lines)).join("\n");
}

export const handler: Schema["generateParentNotice"]["functionHandler"] =
  async (event) => {
    const args = event.arguments as GenerateParentNoticeArgs;
    const scheduleDayId = s(args.scheduleDayId);
    const manualNote = s(args.manualNote);
    const modelId =
      process.env.BEDROCK_MODEL_ID ||
      "anthropic.claude-3-5-sonnet-20240620-v1:0";

    if (!scheduleDayId) {
      throw new Error("scheduleDayId が空です。");
    }

    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
      env as DataClientEnv,
    );
    Amplify.configure(resourceConfig, libraryOptions);
    const dataClient = generateClient<Schema>();

    const dayResult = await dataClient.models.ScheduleDay.get({
      id: scheduleDayId,
    });

    if (dayResult.errors?.length) {
      throw new Error(`ScheduleDay get failed: ${errorText(dayResult.errors)}`);
    }

    const scheduleDay = (dayResult.data as ScheduleDayRow | null) ?? null;
    if (!scheduleDay) {
      throw new Error(`ScheduleDay not found: ${scheduleDayId}`);
    }

    const tenantId = s(scheduleDay.tenantId);
    const owner = s(scheduleDay.owner);
    const classroomId = s(scheduleDay.classroomId);
    const targetDate = s(scheduleDay.targetDate);

    if (!tenantId || !classroomId || !targetDate) {
      throw new Error(
        "ScheduleDay の tenantId / classroomId / targetDate のいずれかが空です。",
      );
    }

    const dayItems = await listAll<ScheduleDayItemRow>(
      dataClient.models.ScheduleDayItem.list,
      {
        filter: {
          scheduleDayId: { eq: scheduleDayId },
        },
      },
    );

    dayItems.sort((a, b) => n(a.sortOrder) - n(b.sortOrder));

    const practiceCodes = dayItems
      .map((x) => s(x.practiceCode))
      .filter(Boolean);
    const practiceByCode = await findPracticesByCodes(
      dataClient,
      practiceCodes,
    );

    const practices: ParentNoticePracticeSource[] = dayItems
      .filter((item) => s(item.practiceCode))
      .map((item) => {
        const practiceCode = s(item.practiceCode);
        const practice = practiceByCode[practiceCode];

        return {
          itemId: s(item.id),
          title: s(item.title),
          description: s(item.description),
          startTime: s(item.startTime),
          endTime: s(item.endTime),
          sortOrder: n(item.sortOrder),
          practiceCode,
          practiceTitleSnapshot: s(item.practiceTitleSnapshot),
          practiceName: s(practice?.name) || s(item.practiceTitleSnapshot),
          practiceMemo: s(practice?.memo),
          practiceCategory: s(
            practice?.practiceCategory || practice?.category_name,
          ),
        };
      });

    const calendarRows = await listAll<ClassCalendarEventRow>(
      dataClient.models.ClassCalendarEvent.list,
      {
        filter: {
          tenantId: { eq: tenantId },
        },
      },
    );

    const events = calendarRows
      .filter((row) => {
        const scopeType = s(row.scopeType).toUpperCase();
        const rowClassroomId = s(row.classroomId);

        const scopeOk =
          scopeType === "SCHOOL" ||
          (scopeType === "CLASSROOM" && rowClassroomId === classroomId);

        if (!scopeOk) return false;

        const showInHomeNotice = row.showInHomeNotice === true;
        const hasHomeNoticeText = Boolean(s(row.homeNoticeText));

        if (!showInHomeNotice && !hasHomeNoticeText) return false;

        return isEventApplicableToDate(row, targetDate);
      })
      .map(toEventSource)
      .sort((a, b) => {
        const sortDiff = a.sortOrder - b.sortOrder;
        if (sortDiff !== 0) return sortDiff;
        return a.title.localeCompare(b.title);
      });

    const source: NoticeSource = {
      scheduleDayId,
      tenantId,
      classroomId,
      targetDate,
      scheduleTitle: s(scheduleDay.title),
      scheduleNotes: s(scheduleDay.notes),
      manualNote,
      events,
      practices,
      generatedAt: new Date().toISOString(),
      sourceVersion: 1,
    };

    let draftText = "";
    let message = "";

    if (events.length === 0 && practices.length === 0 && !manualNote) {
      draftText = buildFallbackDraft(source);
      message = "お知らせ材料が少ないため、定型文で下書きを作成しました。";
    } else {
      try {
        const prompt = buildPrompt(source);
        const ai = await invokeBedrockJson(modelId, prompt);
        draftText = ai.draftText;
        message = `保護者向けお知らせ案を生成しました。events=${events.length}, practices=${practices.length}`;
      } catch (error) {
        draftText = buildFallbackDraft(source);
        message =
          error instanceof Error
            ? `AI生成に失敗したため、定型文で作成しました: ${error.message}`
            : "AI生成に失敗したため、定型文で作成しました。";
      }
    }

    const sourceJson = JSON.stringify(source);

    const updateResult = await dataClient.models.ScheduleDay.update({
      id: scheduleDayId,
      tenantId,
      owner,
      classroomId,
      targetDate,
      parentNoticeDraftText: draftText,
      parentNoticeText: draftText,
      parentNoticeSourceJson: sourceJson,
      parentNoticeStatus: "DRAFT",
      parentNoticeGeneratedAt: source.generatedAt,
    } as unknown as Parameters<typeof dataClient.models.ScheduleDay.update>[0]);

    if (updateResult.errors?.length) {
      throw new Error(
        `ScheduleDay update failed: ${errorText(updateResult.errors)}`,
      );
    }

    return {
      scheduleDayId,
      draftText,
      sourceJson,
      status: "DRAFT",
      message,
    };
  };