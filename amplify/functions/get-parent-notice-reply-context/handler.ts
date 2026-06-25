import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/get-parent-notice-reply-context";
import { createHash } from "node:crypto";

type DataClientEnv = Parameters<typeof getAmplifyDataClientConfig>[0];

type GetParentNoticeReplyContextArgs = {
  replyToken?: string | null;
};

type ParentNoticeReplyTokenRow = Schema["ParentNoticeReplyToken"]["type"] & {
  id: string;
  scheduleDayId?: string | null;
  classroomId?: string | null;
  ageTargetId?: string | null;
  targetDate?: string | null;
  tokenHash?: string | null;
  scopeType?: string | null;
  childKey?: string | null;
  childName?: string | null;
  status?: string | null;
  expiresAt?: string | null;
};

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
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

export const handler: Schema["getParentNoticeReplyContext"]["functionHandler"] =
  async (event) => {
    const args = event.arguments as GetParentNoticeReplyContextArgs;
    const replyToken = s(args.replyToken);

    if (!replyToken) {
      throw new Error("返信URLの token が空です。");
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

    return {
      scheduleDayId: s(tokenRow.scheduleDayId) || null,
      classroomId: s(tokenRow.classroomId) || null,
      ageTargetId: s(tokenRow.ageTargetId) || null,
      targetDate: s(tokenRow.targetDate) || null,
      scopeType: s(tokenRow.scopeType) || "CLASSROOM",
      childKey: s(tokenRow.childKey) || null,
      childName: s(tokenRow.childName) || null,
      status: "OK",
      message: s(tokenRow.childName)
        ? `${s(tokenRow.childName)}さんの返信画面を開きました。`
        : "返信画面を開きました。",
    };
  };
