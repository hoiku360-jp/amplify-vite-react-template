import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/send-parent-notice-emails";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { createHash, randomUUID } from "node:crypto";

type DataClientEnv = Parameters<typeof getAmplifyDataClientConfig>[0];

type SendParentNoticeEmailsArgs = {
  scheduleDayId?: string | null;
  noticeText?: string | null;
  baseUrl?: string | null;
};

type ScheduleDayRow = Schema["ScheduleDay"]["type"] & {
  id: string;
  tenantId?: string | null;
  owner?: string | null;
  classroomId?: string | null;
  ageTargetId?: string | null;
  targetDate?: string | null;
  parentNoticeText?: string | null;
  parentNoticeDraftText?: string | null;
};

type ClassroomRow = Schema["Classroom"]["type"] & {
  id: string;
  name?: string | null;
  title?: string | null;
  className?: string | null;
};

type ParentContact = {
  childKey: string;
  childName: string;
  email: string;
};

type SendResult = {
  childKey: string | null;
  childName: string | null;
  email: string | null;
  replyUrl: string | null;
  tokenId: string | null;
  status: string;
  message: string | null;
};

const DEFAULT_PARENT_CONTACTS: ParentContact[] = [
  {
    childKey: "sakura",
    childName: "さくら",
    email: "noreply-test01@hoiku360.jp",
  },
  {
    childKey: "tarou",
    childName: "たろう",
    email: "noreply-test02@hoiku360.jp",
  },
  { childKey: "mio", childName: "みお", email: "noreply-test03@hoiku360.jp" },
  {
    childKey: "yuuto",
    childName: "ゆうと",
    email: "noreply-test04@hoiku360.jp",
  },
  { childKey: "rin", childName: "りん", email: "noreply-test05@hoiku360.jp" },
];

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function classroomLabel(row?: ClassroomRow | null): string {
  if (!row) return "";
  return s(row.name) || s(row.title) || s(row.className) || s(row.id);
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function makeRandomToken(): string {
  return `${randomUUID()}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeBaseUrl(value: string): string {
  const raw = s(value) || "https://hoiku360.jp";
  return raw.replace(/\/+$/, "");
}

function buildReplyUrl(baseUrl: string, token: string): string {
  return `${normalizeBaseUrl(baseUrl)}/parent-reply?token=${encodeURIComponent(
    token,
  )}`;
}

function buildSubject(day: ScheduleDayRow, classroomName: string): string {
  const date = s(day.targetDate) || "保護者連絡";
  const cls = classroomName ? ` ${classroomName}` : "";
  return `【保育360】${date}${cls} 保護者連絡`;
}

function buildEmailBody(args: {
  childName: string;
  noticeText: string;
  replyUrl: string;
}): string {
  const { childName, noticeText, replyUrl } = args;

  return `${childName}さん 保護者様

${noticeText.trim()}

【返信はこちら】
内容確認・お迎え予定・ご家庭での様子は、以下のURLから入力してください。
${replyUrl}

※このURLは ${childName}さん専用です。他の方へ転送しないでください。
※本メールは保育360 MVPの運用試験用メールです。`;
}

function demoParentContactsForClassroomName(): ParentContact[] {
  // MVP運用試験用: まずは、さくら組の固定5名・固定5アドレスで送信します。
  // 将来は ParentContact / ChildProfile のようなDBモデルへ移行します。
  return DEFAULT_PARENT_CONTACTS;
}

function errorText(errors?: Array<{ message?: string | null }> | null): string {
  return (errors ?? [])
    .map((e) => s(e.message))
    .filter(Boolean)
    .join("\n");
}

export const handler: Schema["sendParentNoticeEmails"]["functionHandler"] =
  async (event) => {
    const args = event.arguments as SendParentNoticeEmailsArgs;
    const scheduleDayId = s(args.scheduleDayId);
    const baseUrl = normalizeBaseUrl(s(args.baseUrl));

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

    const day = (dayResult.data as ScheduleDayRow | null) ?? null;
    if (!day) {
      throw new Error(`ScheduleDay not found: ${scheduleDayId}`);
    }

    const tenantId = s(day.tenantId);
    const owner = s(day.owner);
    const classroomId = s(day.classroomId);
    const targetDate = s(day.targetDate);
    const noticeText =
      s(args.noticeText) ||
      s(day.parentNoticeText) ||
      s(day.parentNoticeDraftText);

    if (!tenantId || !owner || !classroomId || !targetDate) {
      throw new Error(
        "ScheduleDay の tenantId / owner / classroomId / targetDate のいずれかが空です。",
      );
    }

    if (!noticeText) {
      throw new Error("送信する保護者向けお知らせ本文がありません。");
    }

    const classroomResult = await dataClient.models.Classroom.get({
      id: classroomId,
    });
    const classroom = (classroomResult.data as ClassroomRow | null) ?? null;
    const classroomName = classroomLabel(classroom);
    const contacts = demoParentContactsForClassroomName();

    if (contacts.length === 0) {
      return {
        scheduleDayId,
        sentCount: 0,
        failedCount: 0,
        status: "SKIPPED",
        message: "送信対象の保護者メールアドレスがありません。",
        results: [],
      };
    }

    const region = process.env.AWS_REGION || "ap-northeast-1";
    const ses = new SESv2Client({ region });
    const fromEmail =
      s(process.env.PARENT_NOTICE_FROM_EMAIL) || "noreply@hoiku360.jp";
    const subject = buildSubject(day, classroomName);
    const now = new Date().toISOString();

    const results: SendResult[] = [];

    for (const contact of contacts) {
      const childKey = s(contact.childKey);
      const childName = s(contact.childName);
      const email = s(contact.email);

      if (!childKey || !childName || !email) {
        results.push({
          childKey: childKey || null,
          childName: childName || null,
          email: email || null,
          replyUrl: null,
          tokenId: null,
          status: "SKIPPED",
          message:
            "childKey / childName / email のいずれかが空のためスキップしました。",
        });
        continue;
      }

      const token = makeRandomToken();
      const tokenHash = sha256Hex(token);
      const replyUrl = buildReplyUrl(baseUrl, token);
      let tokenId = "";

      try {
        const createTokenResult =
          await dataClient.models.ParentNoticeReplyToken.create({
            tenantId,
            owner,
            scheduleDayId,
            classroomId,
            ageTargetId: s(day.ageTargetId) || null,
            targetDate,
            tokenHash,
            scopeType: "CHILD",
            childKey,
            childName,
            parentEmail: email,
            deliveryStatus: "PENDING",
            status: "ACTIVE",
            issuedAt: now,
            expiresAt: addDaysIso(14),
            issuedBySub: owner,
            memo: "保護者連絡メニューから作成した子ども別返信URLです。",
          });

        if (!createTokenResult.data) {
          throw new Error(
            errorText(createTokenResult.errors) ||
              "ParentNoticeReplyToken create failed",
          );
        }

        tokenId = s(createTokenResult.data.id);

        const emailResult = await ses.send(
          new SendEmailCommand({
            FromEmailAddress: fromEmail,
            Destination: {
              ToAddresses: [email],
            },
            Content: {
              Simple: {
                Subject: {
                  Data: subject,
                  Charset: "UTF-8",
                },
                Body: {
                  Text: {
                    Data: buildEmailBody({ childName, noticeText, replyUrl }),
                    Charset: "UTF-8",
                  },
                },
              },
            },
          }),
        );

        await dataClient.models.ParentNoticeReplyToken.update({
          id: tokenId,
          deliveryStatus: "SENT",
          sentAt: new Date().toISOString(),
          emailMessageId: s(emailResult.MessageId) || null,
        });

        results.push({
          childKey,
          childName,
          email,
          replyUrl,
          tokenId,
          status: "SENT",
          message: s(emailResult.MessageId)
            ? `SES MessageId=${s(emailResult.MessageId)}`
            : "送信しました。",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (tokenId) {
          await dataClient.models.ParentNoticeReplyToken.update({
            id: tokenId,
            deliveryStatus: "FAILED",
            sendErrorMessage: message.slice(0, 1000),
          });
        }

        results.push({
          childKey,
          childName,
          email,
          replyUrl,
          tokenId: tokenId || null,
          status: "FAILED",
          message,
        });
      }
    }

    const sentCount = results.filter((row) => row.status === "SENT").length;
    const failedCount = results.filter((row) => row.status === "FAILED").length;
    const status =
      failedCount > 0 ? (sentCount > 0 ? "PARTIAL" : "FAILED") : "SENT";

    return {
      scheduleDayId,
      sentCount,
      failedCount,
      status,
      message: `保護者連絡メールを送信しました。送信=${sentCount}件 / 失敗=${failedCount}件`,
      results,
    };
  };
