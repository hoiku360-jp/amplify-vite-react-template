import type { Schema } from "../resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/register-practice-links";

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function isoNow() {
  return new Date().toISOString();
}

type AggRow = {
  abilityCode: string;
  practiceCode: string;
  scoreSum: number;
  scoreMax: number;
  linkCount: number;
  level: number;
};

export const handler: Schema["registerPracticeLinks"]["functionHandler"] = async (
  event,
) => {
  const practiceCode = s(event.arguments.practiceCode);

  if (!practiceCode) {
    throw new Error("practiceCode が空です。");
  }

  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as any,
  );
  Amplify.configure(resourceConfig, libraryOptions);
  const dataClient = generateClient<Schema>();

  // 1) 候補を先に取得
  const suggestionResult = await dataClient.models.PracticeLinkSuggestion.list({
    filter: {
      practiceCode: { eq: practiceCode },
    },
    limit: 1000,
  });

  if (suggestionResult.errors?.length) {
    throw new Error(
      `PracticeLinkSuggestion lookup failed: ${suggestionResult.errors
        .map((e) => e.message)
        .join("\n")}`,
    );
  }

  const allSuggestionRows = suggestionResult.data ?? [];
  if (allSuggestionRows.length === 0) {
    throw new Error(`PracticeLinkSuggestion not found: ${practiceCode}`);
  }

  const tenantId = s((allSuggestionRows[0] as any).tenantId);
  if (!tenantId) {
    throw new Error(
      `tenantId not found from PracticeLinkSuggestion: ${practiceCode}`,
    );
  }

  // 2) tenantId 経由で PracticeCode を探す
  const practiceList = await dataClient.models.PracticeCode.list({
    filter: {
      tenantId: { eq: tenantId },
    },
    limit: 1000,
  });

  if (practiceList.errors?.length) {
    throw new Error(
      `PracticeCode lookup failed: ${practiceList.errors
        .map((e) => e.message)
        .join("\n")}`,
    );
  }

  const practice =
    (practiceList.data ?? []).find(
      (x) => s((x as any).practice_code) === practiceCode,
    ) ?? null;

  if (!practice) {
    throw new Error(`PracticeCode not found: ${practiceCode}`);
  }

  // 3) accepted / edited 候補を抽出
  const acceptedRows = allSuggestionRows.filter((row) => {
    const status = s((row as any).status).toLowerCase();
    return status === "accepted" || status === "edited";
  });

  if (acceptedRows.length === 0) {
    return {
      practiceCode,
      registeredCount: 0,
      status: "NO_ACCEPTED_ROWS",
    };
  }

  let registeredCount = 0;

  // 4) accepted / edited を AbilityPracticeLink に反映
  for (const row of acceptedRows) {
    const abilityCode = s((row as any).abilityCode);
    const score = Number((row as any).score ?? 0);

    if (!abilityCode || ![1, 2, 3].includes(score)) {
      continue;
    }

    const existing = await dataClient.models.AbilityPracticeLink.get({
      abilityCode,
      practiceCode,
    });

    if (existing.errors?.length) {
      throw new Error(
        `AbilityPracticeLink get failed: ${existing.errors
          .map((e) => e.message)
          .join("\n")}`,
      );
    }

    if (existing.data) {
      const updateResult = await dataClient.models.AbilityPracticeLink.update({
        abilityCode,
        practiceCode,
        score,
      });

      if (updateResult.errors?.length) {
        throw new Error(
          `AbilityPracticeLink update failed: ${updateResult.errors
            .map((e) => e.message)
            .join("\n")}`,
        );
      }
    } else {
      const createResult = await dataClient.models.AbilityPracticeLink.create({
        abilityCode,
        practiceCode,
        score,
      });

      if (createResult.errors?.length) {
        throw new Error(
          `AbilityPracticeLink create failed: ${createResult.errors
            .map((e) => e.message)
            .join("\n")}`,
        );
      }
    }

    const updateSuggestion =
      await dataClient.models.PracticeLinkSuggestion.update({
        id: row.id,
        tenantId: row.tenantId,
        practiceCode: row.practiceCode,
        abilityCode: row.abilityCode,
        score,
        reason: row.reason ?? "",
        status: "accepted",
        sortOrder: Number((row as any).sortOrder ?? 0),
        createdBy: row.createdBy ?? undefined,
        updatedBy: "register-practice-links",
      });

    if (updateSuggestion.errors?.length) {
      throw new Error(
        `PracticeLinkSuggestion update failed: ${updateSuggestion.errors
          .map((e) => e.message)
          .join("\n")}`,
      );
    }

    registeredCount++;
  }

  // 5) 対象 practiceCode の AbilityPracticeAgg を作り直す
  // 5-1) 既存Agg削除
  const oldAggResult = await dataClient.models.AbilityPracticeAgg.list({
    filter: {
      practiceCode: { eq: practiceCode },
    },
    limit: 1000,
  });

  if (oldAggResult.errors?.length) {
    throw new Error(
      `AbilityPracticeAgg list failed: ${oldAggResult.errors
        .map((e) => e.message)
        .join("\n")}`,
    );
  }

  for (const oldAgg of oldAggResult.data ?? []) {
    const delResult = await dataClient.models.AbilityPracticeAgg.delete({
      id: oldAgg.id,
    });

    if (delResult.errors?.length) {
      throw new Error(
        `AbilityPracticeAgg delete failed: ${delResult.errors
          .map((e) => e.message)
          .join("\n")}`,
      );
    }
  }

  // 5-2) 最新の AbilityPracticeLink を取得
  const linkResult = await dataClient.models.AbilityPracticeLink.list({
    filter: {
      practiceCode: { eq: practiceCode },
    },
    limit: 1000,
  });

  if (linkResult.errors?.length) {
    throw new Error(
      `AbilityPracticeLink list failed: ${linkResult.errors
        .map((e) => e.message)
        .join("\n")}`,
    );
  }

  const links = linkResult.data ?? [];

  // 5-3) AbilityCode 全件取得して parent_code / level を参照可能にする
  const abilityResult = await dataClient.models.AbilityCode.list({
    limit: 10000,
  });

  if (abilityResult.errors?.length) {
    throw new Error(
      `AbilityCode list failed: ${abilityResult.errors
        .map((e) => e.message)
        .join("\n")}`,
    );
  }

  const abilityMap = new Map<string, Schema["AbilityCode"]["type"]>();
  for (const a of abilityResult.data ?? []) {
    abilityMap.set(String(a.code), a);
  }

  // 5-4) leaf + 親階層へロールアップ集計
  const aggMap = new Map<string, AggRow>();

  for (const link of links) {
    const leafAbilityCode = s((link as any).abilityCode);
    const score = Number((link as any).score ?? 0);

    if (!leafAbilityCode || ![1, 2, 3].includes(score)) {
      continue;
    }

    let currentCode: string | undefined = leafAbilityCode;
    let guard = 0;

    while (currentCode && guard < 10) {
      guard += 1;

      const ability = abilityMap.get(currentCode);
      const level = Number((ability as any)?.level ?? 0);
      const key = `${currentCode}__${practiceCode}`;

      const prev = aggMap.get(key);
      if (prev) {
        prev.scoreSum += score;
        prev.scoreMax = Math.max(prev.scoreMax, score);
        prev.linkCount += 1;
      } else {
        aggMap.set(key, {
          abilityCode: currentCode,
          practiceCode,
          scoreSum: score,
          scoreMax: score,
          linkCount: 1,
          level,
        });
      }

      const parentCode = s((ability as any)?.parent_code);
      currentCode = parentCode || undefined;
    }
  }

  // 5-5) Agg作成
  for (const agg of aggMap.values()) {
    const createAgg = await dataClient.models.AbilityPracticeAgg.create({
      abilityCode: agg.abilityCode,
      practiceCode: agg.practiceCode,
      scoreSum: agg.scoreSum,
      scoreMax: agg.scoreMax,
      linkCount: agg.linkCount,
      level: agg.level,
    });

    if (createAgg.errors?.length) {
      throw new Error(
        `AbilityPracticeAgg create failed: ${createAgg.errors
          .map((e) => e.message)
          .join("\n")}`,
      );
    }
  }

  // 6) Practice 側を COMPLETED に更新
  const practiceUpdate = await dataClient.models.PracticeCode.update({
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

    status: "COMPLETED",
    completedAt: isoNow(),
    updatedBy: "register-practice-links",
  });

  if (practiceUpdate.errors?.length) {
    throw new Error(
      `PracticeCode update failed: ${practiceUpdate.errors
        .map((e) => e.message)
        .join("\n")}`,
    );
  }

  return {
    practiceCode,
    registeredCount,
    status: "REGISTERED",
  };
};