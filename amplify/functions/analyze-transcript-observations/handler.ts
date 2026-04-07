import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import type { AppSyncResolverHandler } from "aws-lambda";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { env } from "$amplify/env/analyze-transcript-observations";
import type { Schema } from "../../data/resource";

type HandlerArgs = {
  scheduleDayId: string;
  scheduleDayItemId: string;
  transcriptRecordId: string;
};

type HandlerResult = {
  createdCount: number;
  skipped: boolean;
  message: string;
};

type PlannedTranscriptPayload = {
  kind: "plannedTranscript";
  practiceCode: string | null;
  childNames: string[];
  transcriptText: string;
  tags: string[];
};

type ObservationCandidate = {
  abilityCode: string;
  abilityName: string;
  startingAge: number;
  score: number;
  episodes: string[];
};

type ObservationSummary = {
  practiceCode: string;
  abilities: ObservationCandidate[];
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

type ClaudeObservation = {
  childName: string;
  observedText: string;
  abilityCode?: string;
  abilityName?: string;
  matchedEpisode?: string;
  confidence?: number;
};

type ClaudeResponse = {
  observations: ClaudeObservation[];
};

let configured = false;
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

async function getDataClient() {
  if (configured && dataClient) return dataClient;

  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env);

  Amplify.configure(resourceConfig, libraryOptions);
  dataClient = generateClient<Schema>();
  configured = true;
  return dataClient;
}

function safeJsonParse<T>(value?: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function listAll(
  modelApi: { list: (args?: Record<string, unknown>) => Promise<any> },
  options?: Record<string, unknown>
): Promise<any[]> {
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

function buildStructuredObservationBody(payload: StructuredObservationPayload) {
  return `${payload.childName} / ${payload.abilityName} / ${payload.observedText}`;
}

function normalizeConfidence(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    const firstNewline = trimmed.indexOf("\n");
    const lastFence = trimmed.lastIndexOf("```");
    if (firstNewline >= 0 && lastFence > firstNewline) {
      return trimmed.slice(firstNewline + 1, lastFence).trim();
    }
  }

  return trimmed;
}

function extractResponseText(response: any): string {
  const parts = response?.output?.message?.content ?? [];
  const text = parts
    .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();

  return text;
}

function buildCandidateMaps(candidates: ObservationCandidate[]) {
  const byCode = new Map<string, ObservationCandidate>();
  const byName = new Map<string, ObservationCandidate>();

  for (const c of candidates) {
    byCode.set(c.abilityCode, c);
    byName.set(c.abilityName, c);
  }

  return { byCode, byName };
}

function resolveCandidate(
  raw: ClaudeObservation,
  candidates: ObservationCandidate[]
): ObservationCandidate | null {
  const { byCode, byName } = buildCandidateMaps(candidates);

  if (raw.abilityCode && byCode.has(raw.abilityCode)) {
    return byCode.get(raw.abilityCode)!;
  }

  if (raw.abilityName && byName.has(raw.abilityName)) {
    return byName.get(raw.abilityName)!;
  }

  if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}

function dedupeObservations(items: StructuredObservationPayload[]) {
  const seen = new Set<string>();
  const output: StructuredObservationPayload[] = [];

  for (const item of items) {
    const key = [
      item.sourceTranscriptRecordId,
      item.childName,
      item.abilityCode,
      item.observedText,
    ].join("::");

    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
}

async function invokeClaude(
  transcriptPayload: PlannedTranscriptPayload,
  observationSummary: ObservationSummary
): Promise<ClaudeResponse> {
  const modelId =
    env.BEDROCK_MODEL_ID || "apac.anthropic.claude-3-5-sonnet-20241022-v2:0";

  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION,
  });

  const systemPrompt = [
    "あなたは保育記録の構造化を行うアシスタントです。",
    "与えられた transcript と見取り候補をもとに、子どもごとの観察断片を抽出してください。",
    "必ず JSON のみを返してください。",
    "JSON 形式は {\"observations\":[...]} にしてください。",
    "observations の各要素には childName, observedText, abilityCode, abilityName, matchedEpisode, confidence を含めてください。",
    "childName は transcript または childNames に含まれる名前だけ使ってください。",
    "abilityCode / abilityName は observationCandidates の中から最も近いものを1つ選んでください。",
    "transcript に書かれていないことを補わないでください。",
    "confidence は 0 から 1 の数値にしてください。",
  ].join("\n");

  const userInput = {
    transcriptText: transcriptPayload.transcriptText,
    childNames: transcriptPayload.childNames,
    practiceCode: transcriptPayload.practiceCode,
    observationCandidates: observationSummary.abilities,
  };

  const command = new ConverseCommand({
    modelId,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: [{ text: JSON.stringify(userInput, null, 2) }],
      },
    ],
    inferenceConfig: {
      maxTokens: 1200,
      temperature: 0,
    },
  });

  const response = await client.send(command);
  const responseText = extractResponseText(response);

  if (!responseText) {
    throw new Error("Claude response text was empty.");
  }

  const parsed = safeJsonParse<ClaudeResponse>(stripCodeFence(responseText));
  if (!parsed || !Array.isArray(parsed.observations)) {
    throw new Error(`Claude response was not valid JSON: ${responseText}`);
  }

  return parsed;
}

export const handler: AppSyncResolverHandler<HandlerArgs, HandlerResult> = async (
  event
) => {
  const client = await getDataClient();

  const { scheduleDayId, scheduleDayItemId, transcriptRecordId } = event.arguments;

  const transcriptRes = await client.models.ScheduleRecord.get({
    id: transcriptRecordId,
  });

  const transcriptRecord = transcriptRes.data;
  if (!transcriptRecord) {
    throw new Error("Transcript record not found.");
  }

  if (transcriptRecord.recordType !== "TRANSCRIPT") {
    throw new Error("Target record is not TRANSCRIPT.");
  }

  if (transcriptRecord.scheduleDayId !== scheduleDayId) {
    throw new Error("scheduleDayId does not match transcript record.");
  }

  if (transcriptRecord.scheduleDayItemId !== scheduleDayItemId) {
    throw new Error("scheduleDayItemId does not match transcript record.");
  }

  const transcriptPayload =
    safeJsonParse<PlannedTranscriptPayload>(transcriptRecord.payloadJson);

  if (!transcriptPayload || transcriptPayload.kind !== "plannedTranscript") {
    throw new Error("Transcript payloadJson is invalid.");
  }

  const dayItemRes = await client.models.ScheduleDayItem.get({
    id: scheduleDayItemId,
  });

  const dayItem = dayItemRes.data;
  if (!dayItem) {
    throw new Error("ScheduleDayItem not found.");
  }

  const observationSummary =
    safeJsonParse<ObservationSummary>(dayItem.observationSummaryJson);

  if (!observationSummary || !Array.isArray(observationSummary.abilities)) {
    throw new Error("observationSummaryJson is empty or invalid.");
  }

  // 重複チェック
  const existingStructured = await listAll(client.models.ScheduleRecord, {
    filter: {
      scheduleDayItemId: { eq: scheduleDayItemId },
      recordType: { eq: "STRUCTURED_OBSERVATION" },
    },
  });

  const alreadyExists = existingStructured.some((record) => {
    const payload =
      safeJsonParse<StructuredObservationPayload>(record.payloadJson);
    return payload?.sourceTranscriptRecordId === transcriptRecordId;
  });

  if (alreadyExists) {
    return {
      createdCount: 0,
      skipped: true,
      message: "この transcript は既に解析済みです。",
    };
  }

  const aiResult = await invokeClaude(transcriptPayload, observationSummary);

  const candidates = observationSummary.abilities;
  const structuredPayloads: StructuredObservationPayload[] = [];

  for (const obs of aiResult.observations) {
    const childName = String(obs.childName ?? "").trim();
    const observedText = String(obs.observedText ?? "").trim();

    if (!childName || !observedText) continue;

    const matchedCandidate = resolveCandidate(obs, candidates);
    if (!matchedCandidate) continue;

    structuredPayloads.push({
      kind: "structuredObservation",
      sourceTranscriptRecordId: transcriptRecordId,
      practiceCode: transcriptPayload.practiceCode ?? null,
      childName,
      observedText,
      abilityCode: matchedCandidate.abilityCode,
      abilityName: matchedCandidate.abilityName,
      matchedEpisode:
        typeof obs.matchedEpisode === "string" ? obs.matchedEpisode : undefined,
      confidence: normalizeConfidence(obs.confidence),
      tags: [
        `childName:${childName}`,
        `abilityCode:${matchedCandidate.abilityCode}`,
        "planned",
        "structuredObservation",
      ],
    });
  }

  const deduped = dedupeObservations(structuredPayloads);

  let createdCount = 0;

  for (const payload of deduped) {
    const createRes = await client.models.ScheduleRecord.create({
      tenantId: transcriptRecord.tenantId,
      owner: transcriptRecord.owner,
      scheduleDayId,
      scheduleDayItemId,
      recordType: "STRUCTURED_OBSERVATION",
      body: buildStructuredObservationBody(payload),
      payloadJson: JSON.stringify(payload),
      appendOnly: false,
      createdBySub: transcriptRecord.owner,
      recordedAt: new Date().toISOString(),
    });

    if (!createRes.data) {
      const msg =
        createRes.errors?.map((e: any) => e.message).join(", ") ||
        "Failed to create STRUCTURED_OBSERVATION.";
      throw new Error(msg);
    }

    createdCount += 1;
  }

  return {
    createdCount,
    skipped: false,
    message:
      createdCount > 0
        ? `STRUCTURED_OBSERVATION を ${createdCount} 件作成しました。`
        : "有効な観察断片を抽出できませんでした。",
  };
};