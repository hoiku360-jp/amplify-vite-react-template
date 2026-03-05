// amplify/seed/seed.ts
import { readFile } from "node:fs/promises";
import Papa from "papaparse";

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { signIn, confirmSignIn, fetchAuthSession, signOut } from "aws-amplify/auth";

import { getSecret } from "@aws-amplify/seed";
import type { Schema } from "../data/resource";

const outputsUrl = new URL("../../amplify_outputs.json", import.meta.url);

const abilityCsvUrl = new URL("./data/ability_codes_lang.csv", import.meta.url);
const linkCsvUrl = new URL("./data/AbilityPracticeLink.csv", import.meta.url);
const practiceCsvUrl = new URL("./data/practice_codes_lang.csv", import.meta.url);

type AbilityRow = {
  code: string;
  code_display: string;
  parent_code?: string;
  level: string | number;
  name: string;
  domain?: string;
  category?: string;
  sort_order?: string | number;
  is_leaf?: string | boolean;
  status?: string;
  note?: string;
};

type PracticeRow = {
  practice_code: string;
  category_code?: string;
  category_name?: string;
  name: string;
  memo?: string;
  source_type: string;
  source_ref?: string;
  source_url?: string;
  status?: string;
  version?: string | number;
};

type LinkCrossRow = Record<string, string>;

function toInt(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}
function toScore(v: unknown): number | null {
  const n = toInt(v);
  if (n === null) return null;
  if (n < 1 || n > 3) return null;
  return n;
}
function asStr(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (/^\d+(\.0+)?$/.test(s)) return s.replace(/\.0+$/, "");
  return s;
}
async function parseCsv<T extends object>(url: URL): Promise<T[]> {
  const text = await readFile(url, { encoding: "utf8" });
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) throw parsed.errors;
  return parsed.data;
}

async function listAll(model: any, limit = 1000): Promise<any[]> {
  const out: any[] = [];
  let nextToken: string | null | undefined = undefined;

  for (;;) {
    // ★TS7022回避：明示的に any
    const res: any = await model.list({ limit, nextToken }, { authMode: "userPool" });
    if (res.errors?.length) throw res.errors;

    out.push(...(res.data ?? []));
    nextToken = res.nextToken;
    if (!nextToken) break;
  }
  return out;
}

/** デフォルト id のモデルを安全に全削除 */
async function wipeModelById(model: any, label: string) {
  const items = await listAll(model, 1000);
  let deleted = 0;

  for (const it of items) {
    const id = it?.id;
    if (!id) continue;

    const res: any = await model.delete({ id }, { authMode: "userPool" });
    if (res.errors?.length) throw res.errors;
    deleted += 1;
  }
  console.log(`wiped ${label}: ${deleted}`);
}

function buildAgg(
  links: Array<{ abilityCode: string; practiceCode: string; score: number }>,
  parentOf: Map<string, string>,
  levelOf: Map<string, number>
) {
  type AggKey = string;
  const agg = new Map<
    AggKey,
    { abilityCode: string; practiceCode: string; scoreSum: number; scoreMax: number; linkCount: number; level: number }
  >();

  function add(abilityCode: string, practiceCode: string, score: number) {
    const level = levelOf.get(abilityCode) ?? 0;
    const key = `${abilityCode}|${practiceCode}`;
    const cur = agg.get(key);
    if (!cur) {
      agg.set(key, { abilityCode, practiceCode, scoreSum: score, scoreMax: score, linkCount: 1, level });
    } else {
      cur.scoreSum += score;
      cur.scoreMax = Math.max(cur.scoreMax, score);
      cur.linkCount += 1;
    }
  }

  for (const l of links) {
    const leaf = l.abilityCode;
    const mid = parentOf.get(leaf);
    const top = mid ? parentOf.get(mid) : undefined;

    add(leaf, l.practiceCode, l.score);
    if (mid) add(mid, l.practiceCode, l.score);
    if (top) add(top, l.practiceCode, l.score);
  }
  return Array.from(agg.values());
}

async function signInWithMfa(username: string, password: string) {
  const res = await signIn({ username, password });
  if (res.isSignedIn) return;

  const step = res.nextStep?.signInStep;
  console.log("SEED signIn nextStep:", step);

  if (step === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
    const mfaCode = await getSecret("mfaCode");
    const confirmed = await confirmSignIn({ challengeResponse: mfaCode });
    if (!confirmed.isSignedIn) {
      throw new Error(`MFA confirm did not complete. nextStep=${confirmed.nextStep?.signInStep ?? "unknown"}`);
    }
    return;
  }

  throw new Error(`Unexpected signIn nextStep: ${step ?? "unknown"}`);
}

(async () => {
  const outputs = JSON.parse(await readFile(outputsUrl, { encoding: "utf8" }));
  Amplify.configure(outputs);

  const username = await getSecret("username");
  const password = await getSecret("password");

  await signInWithMfa(username, password);

  const session = await fetchAuthSession();
  const hasIdToken = !!session.tokens?.idToken;
  const hasAccessToken = !!session.tokens?.accessToken;
  console.log("SEED authSession:", { hasIdToken, hasAccessToken });
  if (!hasIdToken || !hasAccessToken) throw new Error("UserPool tokens are missing after MFA.");

  const client = generateClient<Schema>();

  // wipe（idで安全に消す）
  await wipeModelById((client.models as any).AbilityPracticeAgg, "AbilityPracticeAgg");
  await wipeModelById((client.models as any).AbilityPracticeLink, "AbilityPracticeLink");
  await wipeModelById((client.models as any).AbilityCode, "AbilityCode");
  await wipeModelById((client.models as any).PracticeCode, "PracticeCode");

  // 0) PracticeCode投入
  const practiceRows = await parseCsv<PracticeRow>(practiceCsvUrl);
  let createdPractice = 0;

  for (const r of practiceRows) {
    const practice_code = asStr((r as any).practice_code);
    if (!practice_code) continue;

    const source_type = asStr((r as any).source_type) || "internal";
    const status = asStr((r as any).status) || "active";
    const version = toInt((r as any).version) ?? 1;

    const res: any = await (client.models as any).PracticeCode.create(
      {
        practice_code,
        category_code: asStr((r as any).category_code) || null,
        category_name: asStr((r as any).category_name) || null,
        name: asStr((r as any).name),
        memo: asStr((r as any).memo) || null,
        source_type,
        source_ref: asStr((r as any).source_ref) || null,
        source_url: asStr((r as any).source_url) || null,
        status,
        version,
      },
      { authMode: "userPool" }
    );
    if (res.errors?.length) throw res.errors;
    createdPractice += 1;
  }
  console.log(`seeded PracticeCode: ${createdPractice}`);

  // 1) AbilityCode投入
  const abilityRows = await parseCsv<AbilityRow>(abilityCsvUrl);

  const parentOf = new Map<string, string>();
  const levelOf = new Map<string, number>();

  for (const r of abilityRows) {
    const code = asStr((r as any).code);
    const parent = asStr((r as any).parent_code);
    const level = toInt((r as any).level) ?? 0;
    if (code) {
      if (parent) parentOf.set(code, parent);
      if (level) levelOf.set(code, level);
    }
  }

  let createdAbility = 0;
  for (const r of abilityRows) {
    const code = asStr((r as any).code);
    if (!code) continue;

    const res: any = await (client.models as any).AbilityCode.create(
      {
        code,
        code_display: asStr((r as any).code_display),
        parent_code: asStr((r as any).parent_code) || null,
        level: toInt((r as any).level) ?? 0,
        name: asStr((r as any).name),
        domain: asStr((r as any).domain) || null,
        category: asStr((r as any).category) || null,
        sort_order: toInt((r as any).sort_order) ?? null,
        is_leaf: String((r as any).is_leaf).toLowerCase() === "true",
        status: asStr((r as any).status) || "active",
        note: asStr((r as any).note) || null,
      },
      { authMode: "userPool" }
    );
    if (res.errors?.length) throw res.errors;
    createdAbility += 1;
  }
  console.log(`seeded AbilityCode: ${createdAbility}`);

  // 2) Link（クロス表→縦持ち、かつ小分類のみ）
  const crossRows = await parseCsv<LinkCrossRow>(linkCsvUrl);
  if (!crossRows.length) throw new Error("AbilityPracticeLink.csv が空です");

  const headerRow = crossRows.find((r) => asStr(r["Practice"]) === "code");
  if (!headerRow) throw new Error("practiceCode行（Practice=code）が見つかりません");

  const abilityCodeCol = "Practice";
  const abilityNameCol = "ability/Practice";
  const ignoreCols = new Set(["Unnamed: 0", abilityNameCol, abilityCodeCol]);
  const practiceNameCols = Object.keys(headerRow).filter((c) => !ignoreCols.has(c));

  const practiceCodeByCol = new Map<string, string>();
  for (const col of practiceNameCols) {
    const pc = asStr(headerRow[col]);
    if (pc.startsWith("PR-")) practiceCodeByCol.set(col, pc);
  }

  const linkItems: Array<{ abilityCode: string; practiceCode: string; score: number }> = [];

  for (const r of crossRows) {
    const abilityCode = asStr(r[abilityCodeCol]);
    if (!abilityCode || abilityCode === "code") continue;

    if ((levelOf.get(abilityCode) ?? 0) !== 3) continue;

    for (const [col, practiceCode] of practiceCodeByCol.entries()) {
      const score = toScore(r[col]);
      if (!score) continue;
      linkItems.push({ abilityCode, practiceCode, score });
    }
  }

  let createdLinks = 0;
  for (const it of linkItems) {
    const res: any = await (client.models as any).AbilityPracticeLink.create(
      { abilityCode: it.abilityCode, practiceCode: it.practiceCode, score: it.score },
      { authMode: "userPool" }
    );
    if (res.errors?.length) throw res.errors;
    createdLinks += 1;
  }
  console.log(`seeded AbilityPracticeLink (leaf only): ${createdLinks}`);

  // 3) Agg（小→中→大）
  const aggs = buildAgg(linkItems, parentOf, levelOf);

  let createdAgg = 0;
  for (const a of aggs) {
    const res: any = await (client.models as any).AbilityPracticeAgg.create(
      {
        abilityCode: a.abilityCode,
        practiceCode: a.practiceCode,
        scoreSum: a.scoreSum,
        scoreMax: a.scoreMax,
        linkCount: a.linkCount,
        level: a.level,
      },
      { authMode: "userPool" }
    );
    if (res.errors?.length) throw res.errors;
    createdAgg += 1;
  }
  console.log(`seeded AbilityPracticeAgg: ${createdAgg}`);

  await signOut();
  console.log("seed done.");
})();
