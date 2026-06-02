import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/submit-parent-notice-reply";
import { createHash } from "node:crypto";

type DataClientEnv = Parameters<typeof getAmplifyDataClientConfig>[0];

type SubmitParentNoticeReplyArgs = {
  replyToken?: string | null;

  childKey?: string | null;
  childName?: string | null;

  okSigned?: boolean | null;

  pickupPersonRelation?: string | null;
  pickupPersonName?: string | null;
  pickupPlannedTime?: string | null;

  homeNote?: string | null;
  userAgent?: string | null;
};

type ParentNoticeReplyTokenRow = Schema["ParentNoticeReplyToken"]["type"] & {
  id: string;
  tenantId?: string | null;
  owner?: string | null;
  scheduleDayId?: string | null;
  classroomId?: string | null;
  ageTargetId?: string | null;
  targetDate?: string | null;
  tokenHash?: string | null;
  scopeType?: string | null;
  status?: string | null;
  expiresAt?: string | null;
};

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeChildKey(childName: string): string {
  return childName
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{Letter}\p{Number}_-]/gu, "")
    .slice(0, 80);
}

function isExpired(expiresAt?: string | null): boolean {
  const value = s(expiresAt);
  if (!value) return false;

  const expires = new Date(value);
  if (Number.isNaN(expires.getTime())) return false;

  return expires.getTime() < Date.now();
}

function errorText(errors?: Array<{ message?: string | null }> | null): string {
  return (errors ?? [])
    .map((e) => s(e.message))
    .filter(Boolean)
    .join("\n");
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

export const handler: Schema["submitParentNoticeReply"]["functionHandler"] =
  async (event) => {
    const args = event.arguments as SubmitParentNoticeReplyArgs;

    const replyToken = s(args.replyToken);
    if (!replyToken) {
      throw new Error("返信URLの token が空です。");
    }

    if (args.okSigned !== true) {
      throw new Error("内容確認のOKサインが必要です。");
    }

    const tokenHash = sha256Hex(replyToken);

    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
      env as DataClientEnv,
    );
    Amplify.configure(resourceConfig, libraryOptions);

    const dataClient = generateClient<Schema>();

    const tokenRows = await listAll<ParentNoticeReplyTokenRow>(
      dataClient.models.ParentNoticeReplyToken.list,
      {
        filter: {
          tokenHash: { eq: tokenHash },
        },
      },
    );

    const tokenRow =
      tokenRows.find((row) => s(row.status).toUpperCase() === "ACTIVE") ??
      tokenRows[0] ??
      null;

    if (!tokenRow) {
      throw new Error(
        "返信URLが見つかりません。園から受け取った最新のURLを確認してください。",
      );
    }

    if (s(tokenRow.status).toUpperCase() !== "ACTIVE") {
      throw new Error("この返信URLは現在利用できません。");
    }

    if (isExpired(tokenRow.expiresAt)) {
      await dataClient.models.ParentNoticeReplyToken.update({
        id: tokenRow.id,
        status: "EXPIRED",
      });

      throw new Error(
        "この返信URLの有効期限が切れています。園へご確認ください。",
      );
    }

    const tenantId = s(tokenRow.tenantId);
    const owner = s(tokenRow.owner);
    const scheduleDayId = s(tokenRow.scheduleDayId);
    const classroomId = s(tokenRow.classroomId);
    const ageTargetId = s(tokenRow.ageTargetId);
    const targetDate = s(tokenRow.targetDate);

    if (!tenantId || !owner || !scheduleDayId || !classroomId || !targetDate) {
      throw new Error(
        "返信URLの内部情報が不足しています。園側で返信URLを作り直してください。",
      );
    }

    const childName = truncate(s(args.childName), 80);
    const childKey = truncate(
      s(args.childKey) || normalizeChildKey(childName),
      80,
    );

    if (!childName) {
      throw new Error("お子さまの名前を入力してください。");
    }

    const now = new Date().toISOString();

    const createResult = await dataClient.models.ParentNoticeReply.create({
      tenantId,
      owner,

      scheduleDayId,
      classroomId,
      ageTargetId: ageTargetId || null,
      targetDate,

      replyTokenHash: tokenHash,

      childKey: childKey || null,
      childName,

      okSigned: true,

      pickupPersonRelation: truncate(s(args.pickupPersonRelation), 40),
      pickupPersonName: truncate(s(args.pickupPersonName), 80),
      pickupPlannedTime: truncate(s(args.pickupPlannedTime), 20),

      homeNote: truncate(s(args.homeNote), 2000),

      status: "SUBMITTED",
      submittedAt: now,

      userAgent: truncate(s(args.userAgent), 300),
    });

    if (createResult.errors?.length) {
      throw new Error(
        `ParentNoticeReply create failed: ${errorText(createResult.errors)}`,
      );
    }

    const replyId = createResult.data?.id;

    return {
      replyId,
      status: "SUBMITTED",
      message: "返信を受け付けました。",
    };
  };
