import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/get-parent-child-weekly-letter";
import { createHash } from "node:crypto";

type DataClientEnv = Parameters<typeof getAmplifyDataClientConfig>[0];

type GetParentChildWeeklyLetterArgs = {
  replyToken?: string | null;
};

type ParentNoticeReplyTokenRow = Schema["ParentNoticeReplyToken"]["type"] & {
  id: string;
  tenantId?: string | null;
  owner?: string | null;
  scheduleDayId?: string | null;
  classroomId?: string | null;
  targetDate?: string | null;
  tokenHash?: string | null;
  scopeType?: string | null;
  childKey?: string | null;
  childName?: string | null;
  status?: string | null;
  expiresAt?: string | null;
};

type ReportArtifactRow = Schema["ReportArtifact"]["type"] & {
  id: string;
  tenantId?: string | null;
  owner?: string | null;
  reportType?: string | null;
  classroomId?: string | null;
  childKey?: string | null;
  childName?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  title?: string | null;
  status?: string | null;
  markdownText?: string | null;
  generatedAt?: string | null;
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

function sortLatestReports(rows: ReportArtifactRow[]): ReportArtifactRow[] {
  return [...rows].sort((a, b) => {
    const periodDiff = s(b.periodEnd).localeCompare(s(a.periodEnd));
    if (periodDiff !== 0) return periodDiff;

    const generatedDiff = s(b.generatedAt).localeCompare(s(a.generatedAt));
    if (generatedDiff !== 0) return generatedDiff;

    return s(b.id).localeCompare(s(a.id));
  });
}

function matchesChild(
  row: ReportArtifactRow,
  childKey: string,
  childName: string,
) {
  const reportChildKey = s(row.childKey);
  const reportChildName = s(row.childName);

  if (childKey && reportChildKey && reportChildKey === childKey) return true;
  if (childName && reportChildName && reportChildName === childName)
    return true;

  // 旧MVPデータでは ReportArtifact.childKey に子ども名を入れて保存している場合がある。
  if (childName && reportChildKey && reportChildKey === childName) return true;
  if (childKey && reportChildName && reportChildName === childKey) return true;

  return false;
}

export const handler: Schema["getParentChildWeeklyLetter"]["functionHandler"] =
  async (event) => {
    const args = event.arguments as GetParentChildWeeklyLetterArgs;
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

    const tenantId = s(tokenRow.tenantId);
    const owner = s(tokenRow.owner);
    const classroomId = s(tokenRow.classroomId);
    const childKey = s(tokenRow.childKey);
    const childName = s(tokenRow.childName);
    const scopeType = s(tokenRow.scopeType).toUpperCase();

    if (scopeType !== "CHILD") {
      return {
        childKey: childKey || null,
        childName: childName || null,
        title: null,
        periodStart: null,
        periodEnd: null,
        markdownText: null,
        status: "NO_CHILD_SCOPE",
        message: "週末こどもだよりは、子ども別返信URLからのみ閲覧できます。",
      };
    }

    if (!tenantId || !owner || !classroomId || (!childKey && !childName)) {
      throw new Error(
        "返信URLの内部情報が不足しています。園側で返信URLを作り直してください。",
      );
    }

    const reports = await listAll<ReportArtifactRow>(
      dataClient.models.ReportArtifact.list,
      {
        filter: {
          and: [
            { tenantId: { eq: tenantId } },
            { owner: { eq: owner } },
            { classroomId: { eq: classroomId } },
            { reportType: { eq: "CHILD_WEEKLY" } },
            { status: { eq: "READY" } },
          ],
        },
      },
    );

    const latest = sortLatestReports(
      reports.filter((row) => matchesChild(row, childKey, childName)),
    )[0];

    if (!latest) {
      return {
        childKey: childKey || null,
        childName: childName || null,
        title: null,
        periodStart: null,
        periodEnd: null,
        markdownText: null,
        status: "NO_REPORT",
        message: `${childName || "お子さま"}さんの週末こどもだよりは、まだ作成されていません。`,
      };
    }

    return {
      childKey: childKey || s(latest.childKey) || null,
      childName: childName || s(latest.childName) || null,
      title:
        s(latest.title) || `${childName || s(latest.childName)}さん 週末だより`,
      periodStart: s(latest.periodStart) || null,
      periodEnd: s(latest.periodEnd) || null,
      markdownText: s(latest.markdownText) || null,
      status: "READY",
      message: "週末こどもだよりを読み込みました。",
    };
  };
