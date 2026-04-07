import type { Schema } from "../resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/analyze-practice";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

type JsonObject = Record<string, unknown>;

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function truncateText(text: string, max = 12000): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n…(truncated)…";
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

function buildPrompt(transcriptText: string) {
  return `
あなたは保育実践を整理する日本語アシスタントです。
入力されるのは、保育士が音声で記録した実践メモの文字起こしです。

目的:
1. 実践内容を踏まえて、Practiceの短い名前を1つ作る
2. 実践の内容を、保育実践の記録として読みやすい日本語で要約する

要件:
- name は 18〜40文字程度の、簡潔で具体的なタイトルにする
- memo は 180〜320文字程度を目安にする
- memo には、できるだけ「何をしたか」「子どもの様子」「保育者の働きかけ」「ねらい」が分かるように含める
- transcript にない事実を断定的に付け加えない
- 不自然な言い回しは避け、保育記録として自然な日本語にする
- 出力は JSON のみ
- JSON の形式は必ず次の通り:
{
  "name": "...",
  "memo": "..."
}

文字起こし:
${transcriptText}
`.trim();
}

async function invokeBedrockJson(
  modelId: string,
  prompt: string,
): Promise<{ name: string; memo: string; rawText: string }> {
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

  const rawText = s(
    json?.content?.find((x) => x?.type === "text")?.text ?? "",
  );

  const parsed = safeJsonParse(rawText);
  if (!parsed) {
    throw new Error(`AI response is not valid JSON: ${rawText}`);
  }

  const name = s(parsed.name);
  const memo = s(parsed.memo);

  if (!name || !memo) {
    throw new Error(`AI response missing name or memo: ${rawText}`);
  }

  return { name, memo, rawText };
}

export const handler: Schema["analyzePractice"]["functionHandler"] = async (
  event,
) => {
  const practiceId = event.arguments.practiceId;
  const modelId =
    process.env.BEDROCK_MODEL_ID ||
    "anthropic.claude-3-5-sonnet-20240620-v1:0";

  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as any,
  );
  Amplify.configure(resourceConfig, libraryOptions);
  const dataClient = generateClient<Schema>();

  const getResult = await dataClient.models.PracticeCode.get({
    id: practiceId,
  });

  if (getResult.errors?.length) {
    throw new Error(
      `PracticeCode get failed: ${getResult.errors.map((e) => e.message).join("\n")}`,
    );
  }

  const practice = getResult.data;
  if (!practice) {
    throw new Error(`PracticeCode not found: ${practiceId}`);
  }

  const transcriptText = s((practice as any).transcriptText);
  if (!transcriptText) {
    throw new Error("transcriptText が空のため AI 生成できません。");
  }

  const prompt = buildPrompt(truncateText(transcriptText));

  // まず AI_ANALYZING にしておく
  const preUpdate = await dataClient.models.PracticeCode.update({
    id: practice.id,

    // 複合 index 対策で既存値を戻す
    practice_code: practice.practice_code,
    tenantId: practice.tenantId ?? undefined,
    owner: practice.owner ?? undefined,
    ownerType: practice.ownerType ?? undefined,
    practiceCategory: (practice as any).practiceCategory ?? undefined,
    visibility: (practice as any).visibility ?? undefined,
    publishScope: (practice as any).publishScope ?? undefined,

    name: practice.name ?? "",
    memo: practice.memo ?? "",
    source_type: practice.source_type ?? "practiceRegister",
    version: Number((practice as any).version ?? 1),

    status: "AI_ANALYZING",
    aiStatus: "PENDING",
    updatedBy: "analyze-practice",
  });

  if (preUpdate.errors?.length) {
    throw new Error(
      `PracticeCode pre-update failed: ${preUpdate.errors
        .map((e) => e.message)
        .join("\n")}`,
    );
  }

  try {
    const ai = await invokeBedrockJson(modelId, prompt);

    const updateResult = await dataClient.models.PracticeCode.update({
      id: practice.id,

      // 複合 index 対策
      practice_code: practice.practice_code,
      tenantId: practice.tenantId ?? undefined,
      owner: practice.owner ?? undefined,
      ownerType: practice.ownerType ?? undefined,
      practiceCategory: (practice as any).practiceCategory ?? undefined,
      visibility: (practice as any).visibility ?? undefined,
      publishScope: (practice as any).publishScope ?? undefined,

      source_type: practice.source_type ?? "practiceRegister",
      version: Number((practice as any).version ?? 1),

      // 更新値
      name: ai.name,
      memo: ai.memo,
      status: "REVIEW",
      aiStatus: "DONE",
      aiModel: modelId,
      aiRawJson: ai.rawText,
      reviewedAt: new Date().toISOString(),
      errorMessage: "",
      updatedBy: "analyze-practice",
    });

    if (updateResult.errors?.length) {
      throw new Error(
        `PracticeCode update failed: ${updateResult.errors
          .map((e) => e.message)
          .join("\n")}`,
      );
    }

    return {
      practiceId: practice.id,
      practiceCode: practice.practice_code,
      name: ai.name,
      memo: ai.memo,
      status: "REVIEW",
      aiModel: modelId,
    };
  } catch (e: any) {
    const msg = e?.message ?? String(e);

    await dataClient.models.PracticeCode.update({
      id: practice.id,

      practice_code: practice.practice_code,
      tenantId: practice.tenantId ?? undefined,
      owner: practice.owner ?? undefined,
      ownerType: practice.ownerType ?? undefined,
      practiceCategory: (practice as any).practiceCategory ?? undefined,
      visibility: (practice as any).visibility ?? undefined,
      publishScope: (practice as any).publishScope ?? undefined,

      name: practice.name ?? "",
      memo: practice.memo ?? "",
      source_type: practice.source_type ?? "practiceRegister",
      version: Number((practice as any).version ?? 1),

      status: "REVIEW",
      aiStatus: "ERROR",
      errorMessage: msg,
      updatedBy: "analyze-practice",
    });

    throw e;
  }
};