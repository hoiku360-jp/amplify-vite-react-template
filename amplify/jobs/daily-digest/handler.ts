import type { EventBridgeHandler } from "aws-lambda";

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/daily-digest";

import type { Schema } from "../../data/resource";

// ✅ Bedrock (Claude 3.5 Sonnet)
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const REGION = process.env.AWS_REGION || "ap-northeast-1";

// ✅ Claude 3.5 Sonnet（Bedrock modelId）
const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20240620-v1:0";

const br = new BedrockRuntimeClient({ region: REGION });

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isThrottling(e: any) {
  const name = e?.name ?? e?.errorType ?? "";
  const msg = e?.message ?? e?.errorMessage ?? "";
  const http = e?.$metadata?.httpStatusCode;
  return (
    http === 429 ||
    name === "ThrottlingException" ||
    name === "TooManyRequestsException" ||
    /too many requests/i.test(msg) ||
    /throttl/i.test(msg)
  );
}

/**
 * ✅ 429 のときだけ「長めに待って再試行」
 * 例：60s → 120s → 180s → 240s → 240s ...（ジッター付き）
 * - 総時間が伸びるので resource.ts の timeoutSeconds は 900 推奨
 */
async function invokeBedrockWithBackoff<T>(
  fn: () => Promise<T>,
  opts?: {
    baseSeconds?: number; // 60
    stepSeconds?: number; // 60（線形増加）
    maxDelaySeconds?: number; // 240 or 300
    maxAttempts?: number; // 5~8
    jitterRatio?: number; // 0.2（±20%）
  },
) {
  const base = opts?.baseSeconds ?? 60;
  const step = opts?.stepSeconds ?? 60;
  const maxDelay = opts?.maxDelaySeconds ?? 240;
  const maxAttempts = opts?.maxAttempts ?? 6;
  const jitter = opts?.jitterRatio ?? 0.2;

  let lastErr: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;

      // 429以外は即エラー（権限/モデルID/入力形式などの不具合を早期発見）
      if (!isThrottling(e)) throw e;

      if (attempt === maxAttempts) break;

      // 線形：base + step*(attempt-1)
      const raw = Math.min(maxDelay, base + step * (attempt - 1));

      // ジッター：± jitterRatio
      const factor = 1 + (Math.random() * 2 - 1) * jitter;
      const delaySec = Math.max(1, Math.round(raw * factor));

      console.warn(
        `bedrock throttled (attempt ${attempt}/${maxAttempts}). retry in ${delaySec}s`,
        {
          httpStatus: e?.$metadata?.httpStatusCode,
          requestId: e?.$metadata?.requestId,
          name: e?.name,
          message: e?.message,
        },
      );

      await sleep(delaySec * 1000);
    }
  }

  throw lastErr ?? new Error("bedrock invoke failed after retries");
}

function formatDateJST(d: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${day}`;
}

function jstMidnightToUtcIso(year: number, month: number, day: number) {
  // JST 00:00 を UTC ISO に変換（JST=UTC+9 → UTCは前日15:00）
  const utc = new Date(Date.UTC(year, month - 1, day, -9, 0, 0));
  return utc.toISOString();
}

function getYesterdayRangeUtcIso() {
  // 「今日(JST)」→「前日(JST)」の 00:00〜00:00 のUTC ISO範囲
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // "YYYY-MM-DD"

  const [yStr, mStr, dStr] = ymd.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  // 今日(JST)の00:00（UTC ISO）
  const todayStartUtcIso = jstMidnightToUtcIso(y, m, d);

  // 前日(JST)の00:00（UTC ISO）
  const todayJst = new Date(`${yStr}-${mStr}-${dStr}T00:00:00+09:00`);
  const yesterdayJst = new Date(todayJst.getTime() - 24 * 60 * 60 * 1000);

  const y2 = Number(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
    }).format(yesterdayJst),
  );
  const m2 = Number(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      month: "2-digit",
    }).format(yesterdayJst),
  );
  const d2 = Number(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      day: "2-digit",
    }).format(yesterdayJst),
  );

  const yesterdayStartUtcIso = jstMidnightToUtcIso(y2, m2, d2);

  // digestDate は「前日(JST)」の日付（＝昨日のまとめ）
  const digestDate = formatDateJST(yesterdayJst);

  return {
    digestDate,
    fromUtcIso: yesterdayStartUtcIso,
    toUtcIso: todayStartUtcIso,
  };
}

type DigestInput = {
  recordedAt: string;
  kind: "summary" | "transcript";
  text: string;
};

/**
 * ✅ Bedrockに渡す素材を作る
 * - summaryText が無ければ transcriptText を使う
 * - 入力量を抑えるために上限を入れる
 */
function buildDigestInputs(
  jobs: Array<Schema["AudioJob"]["type"]>,
): DigestInput[] {
  const MAX_CHARS_PER_ITEM = 1200;

  const out: DigestInput[] = [];
  for (const j of jobs) {
    const recordedAt = j.recordedAt ?? "";
    const summary = (j.summaryText ?? "").trim();
    const transcript = (j.transcriptText ?? "").trim();

    const kind: "summary" | "transcript" =
      summary.length > 0 ? "summary" : "transcript";
    const text0 = summary.length > 0 ? summary : transcript;
    if (!text0) continue;

    const text =
      text0.length > MAX_CHARS_PER_ITEM
        ? text0.slice(0, MAX_CHARS_PER_ITEM) + "…"
        : text0;

    out.push({ recordedAt, kind, text });
  }

  return out.slice(0, 50);
}

/**
 * ✅ Claude 3.5 Sonnet で JSON を生成（必ずJSONだけ返させる）
 * ✅ 429 の場合は長めバックオフで再試行
 */
async function generateDigestJson(args: {
  digestDate: string;
  tenantId: string;
  owner: string; // 認可/表示用
  ownerKey: string; // 主キー用（今は owner と同じでOK）
  inputs: DigestInput[];
}) {
  const { digestDate, tenantId, owner, ownerKey, inputs } = args;

  const schemaHint = `{
  "date": "${digestDate}",
  "tenantId": "${tenantId}",
  "owner": "${owner}",
  "ownerKey": "${ownerKey}",
  "top5": ["...最大5件"],
  "todos": ["...未完了TODO（推測可）最大10件"],
  "insights": ["...気づき/学び 最大10件"],
  "sources": { "count": ${inputs.length} }
}`;

  const prompt = `
あなたは保育ICTプロダクトの「Daily Digest」を作る編集者です。
以下の「前日分の要約（複数件）」を統合して、指定JSONスキーマ“そのもの”を生成してください。

# ルール
- 出力は **JSONのみ**。前後に説明文、コードフェンス、箇条書きなどを付けない。
- top5 は重要度順。重複や言い回しの重なりは統合する。
- todos は「未完了」「次にやるべきこと」を推測しても良い。
- insights は気づき・学び・方針・改善点。
- 日本語で書く。

# 出力JSONスキーマ（この形だけ）
${schemaHint}

# 要約群（入力）
${JSON.stringify(inputs)}
`.trim();

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1200,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  };

  const res = await invokeBedrockWithBackoff(
    () =>
      br.send(
        new InvokeModelCommand({
          modelId: BEDROCK_MODEL_ID,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify(body),
        }),
      ),
    {
      baseSeconds: 60,
      stepSeconds: 60,
      maxDelaySeconds: 240, // 必要なら 300 に
      maxAttempts: 6, // 60+120+180+240+240=840秒待ち得る（約14分）
      jitterRatio: 0.2,
    },
  );

  const decoded = new TextDecoder().decode((res as any).body);
  const out = JSON.parse(decoded);

  // Claudeは content[0].text に返るのが一般的
  const text: string = out?.content?.[0]?.text ?? "";

  try {
    return JSON.parse(text);
  } catch {
    return {
      date: digestDate,
      tenantId,
      owner,
      ownerKey,
      top5: [],
      todos: [],
      insights: [],
      sources: { count: inputs.length },
      raw: text,
    };
  }
}

async function upsertDailyDigest(args: {
  tenantId: string;
  ownerKey: string;
  owner: string;
  digestDate: string;
  title: string;
  body: string;
  sourceCount: number;
}) {
  const { tenantId, ownerKey, owner, digestDate, title, body, sourceCount } =
    args;

  // まず create を試す（同じキーが既にあれば conditional で落ちる想定）
  const created = await (client.models.DailyDigest as any).create({
    tenantId,
    ownerKey,
    owner,
    digestDate,
    title,
    body,
    sourceCount,
    status: "generated",
  });

  if (!created.errors?.length) {
    console.log("created DailyDigest:", created.data);
    return;
  }

  const msg = created.errors.map((e: any) => e.message).join("\n");
  const isConditional =
    created.errors.some((e: any) =>
      (e.errorType ?? "").includes("ConditionalCheckFailedException"),
    ) ||
    msg.includes("ConditionalCheckFailedException") ||
    msg.toLowerCase().includes("conditional request failed");

  if (!isConditional) {
    console.error("create DailyDigest errors:", created.errors);
    throw new Error(msg);
  }

  console.warn("create conflicted; fallback to update:", msg);

  const updated = await (client.models.DailyDigest as any).update({
    tenantId,
    ownerKey,
    digestDate, // ✅ PKの一部
    owner, // 認可フィールドは維持
    title,
    body,
    sourceCount,
    status: "generated",
  });

  if (updated.errors?.length) {
    console.error(
      "update DailyDigest errors (after conflict):",
      updated.errors,
    );
    throw new Error(updated.errors.map((e: any) => e.message).join("\n"));
  }

  console.log("updated DailyDigest:", updated.data);
}

/**
 * ✅ Bedrock が最終的にダメでも「空Digest + note」で保存して UI に見えるようにする
 */
async function saveFallbackDigest(args: {
  tenantId: string;
  owner: string;
  ownerKey: string;
  digestDate: string;
  jobsCount: number;
  note: string;
}) {
  const { tenantId, owner, ownerKey, digestDate, jobsCount, note } = args;

  const title = `Daily Digest ${digestDate}`;
  const digestJson = {
    date: digestDate,
    tenantId,
    owner,
    ownerKey,
    top5: [],
    todos: [],
    insights: [],
    sources: { count: 0 },
    note,
  };
  const body = JSON.stringify(digestJson, null, 2);

  await upsertDailyDigest({
    tenantId,
    ownerKey,
    owner,
    digestDate,
    title,
    body,
    sourceCount: jobsCount,
  });
}

export const handler: EventBridgeHandler<
  "Scheduled Event",
  null,
  void
> = async (event) => {
  console.log("daily-digest event:", JSON.stringify(event, null, 2));

  const tenantId = "demo-tenant";
  const { digestDate, fromUtcIso, toUtcIso } = getYesterdayRangeUtcIso();

  console.log("digestDate(JST):", digestDate);
  console.log("range UTC:", { fromUtcIso, toUtcIso });

  // 1) 前日(JST)の AudioJob（SUCCEEDED）を tenantId + recordedAt 範囲で集める
  const jobsRes = await client.models.AudioJob.list({
    filter: {
      tenantId: { eq: tenantId },
      status: { eq: "SUCCEEDED" },
      recordedAt: { ge: fromUtcIso, lt: toUtcIso },
    },
    limit: 200,
  });

  if (jobsRes.errors?.length) {
    console.error("list AudioJob errors:", jobsRes.errors);
    throw new Error(jobsRes.errors.map((e) => e.message).join("\n"));
  }

  const jobsAll = (jobsRes.data ?? [])
    .slice()
    .sort((a, b) => (a.recordedAt ?? "").localeCompare(b.recordedAt ?? ""));

  console.log("jobs fetched:", jobsAll.length);

  // 2) owner ごとにグルーピング（ownerが無いものはスキップ）
  const byOwner = new Map<string, Array<Schema["AudioJob"]["type"]>>();
  for (const j of jobsAll) {
    const o = (j.owner ?? "").trim();
    if (!o) continue;
    const arr = byOwner.get(o) ?? [];
    arr.push(j);
    byOwner.set(o, arr);
  }

  const owners = Array.from(byOwner.keys());
  console.log("owners:", owners);

  // 3) owner ごとに Digest を生成して保存（順次実行）
  for (const owner of owners) {
    const jobs = byOwner.get(owner) ?? [];
    const ownerKey = owner; // ✅ 今は owner と同じ（将来 sub にするならここだけ変える）

    // Bedrock投入用素材
    const inputs = buildDigestInputs(jobs);

    // 素材がゼロなら note 付きで保存
    if (inputs.length === 0) {
      await saveFallbackDigest({
        tenantId,
        owner,
        ownerKey,
        digestDate,
        jobsCount: jobs.length,
        note: "前日分のsummaryText / transcriptText が無いため、集計対象がありませんでした。",
      });
      continue;
    }

    // Bedrock 生成（429は長めバックオフで再試行）
    try {
      const digestJson = await generateDigestJson({
        digestDate,
        tenantId,
        owner,
        ownerKey,
        inputs,
      });

      const title = `Daily Digest ${digestDate}`;
      const body = JSON.stringify(digestJson, null, 2);

      await upsertDailyDigest({
        tenantId,
        ownerKey,
        owner,
        digestDate,
        title,
        body,
        sourceCount: jobs.length,
      });
    } catch (e: any) {
      // ✅ 最終的にBedrockがダメでも UI に「失敗」が見えるように保存
      if (isThrottling(e)) {
        await saveFallbackDigest({
          tenantId,
          owner,
          ownerKey,
          digestDate,
          jobsCount: jobs.length,
          note: "Bedrock が混雑（429 Throttling）しており、Digest 生成に失敗しました。次回実行で再試行してください。",
        });
        continue;
      }
      throw e;
    }
  }

  if (owners.length === 0) {
    console.log("no owners/jobs in range; nothing to generate.");
  }
};
