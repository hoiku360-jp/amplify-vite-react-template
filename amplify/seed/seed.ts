// amplify/seed/seed.ts
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import Papa from "papaparse";

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import {
  signIn,
  confirmSignIn,
  fetchAuthSession,
  signOut,
} from "aws-amplify/auth";

import type { Schema } from "../data/resource";

type AmplifyConfig = Parameters<typeof Amplify.configure>[0];

const repoRootPath = fileURLToPath(new URL("../../", import.meta.url));

function resolveOutputsUrl(): URL {
  const outputsFile = String(process.env.SEED_OUTPUTS_FILE ?? "").trim();

  if (!outputsFile) {
    return new URL("../../amplify_outputs.json", import.meta.url);
  }

  if (/^file:/i.test(outputsFile)) {
    return new URL(outputsFile);
  }

  const absolutePath = isAbsolute(outputsFile)
    ? outputsFile
    : resolve(repoRootPath, outputsFile);

  return pathToFileURL(absolutePath);
}

function resolveSeedTarget(): string {
  const target = String(process.env.SEED_TARGET ?? "").trim();
  if (target) return target;

  return String(process.env.SEED_OUTPUTS_FILE ?? "").trim()
    ? "custom-outputs"
    : "default-amplify_outputs";
}

const outputsUrl = resolveOutputsUrl();
const seedTarget = resolveSeedTarget();

const abilityCsvUrl = new URL("./data/ability_codes_lang.csv", import.meta.url);
const observationHintCsvUrl = new URL(
  "./data/AbilityObservationHint.csv",
  import.meta.url,
);
const planPhraseCsvUrl = new URL("./data/PlanPhrase.csv", import.meta.url);
const planPhraseAbilityLinkCsvUrl = new URL(
  "./data/PlanPhraseAbilityLink.csv",
  import.meta.url,
);
const weekendPlayCsvUrl = new URL(
  "./data/WeekendPlay_description.csv",
  import.meta.url,
);
const weekendPlayAbilityLinkCsvUrl = new URL(
  "./data/WeekendPlayAbilityLink.csv",
  import.meta.url,
);

// 固定ユーザー名
const DEFAULT_SEED_USERNAME = "noreply-test01@hoiku360.jp";

// 通常は wipe しない。
// 明示的に入れ直したいときだけ SEED_WIPE_CORE_MASTER=true を付ける。
const SHOULD_WIPE =
  String(process.env.SEED_WIPE_CORE_MASTER ?? "").toLowerCase() === "true";

// AbilityObservationHint だけをCSVの内容に入れ直したいときに使う。
// 同一 abilityCode の複数ヒント行を整理して入れ直す場合に指定する。
const SHOULD_REPLACE_OBSERVATION_HINTS =
  String(process.env.SEED_REPLACE_OBSERVATION_HINTS ?? "").toLowerCase() ===
  "true";

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

type AbilityObservationHintRow = {
  abilityCode: string;
  abilityName: string;
  startingAge: string | number;
  episode1?: string;
  episode2?: string;
  episode3?: string;
  isActive?: string | boolean;
};

type AbilityObservationHintPayload = {
  abilityCode: string;
  abilityName: string;
  startingAge: number;
  episode1: string | null;
  episode2: string | null;
  episode3: string | null;
  isActive: boolean;
};

type PlanPhraseRow = {
  index?: string | number;
  planPhraseId: string;
  planPeriodType: string;
  domainCode: string | number;
  domain: string;
  ageYears: string | number;
  phraseNo?: string | number;
  phraseType?: string;
  phraseText: string;
  source?: string;
  status?: string;
  sortOrder?: string | number;
  note?: string;
};

type PlanPhraseAbilityLinkRow = {
  index?: string | number;
  linkId: string;
  planPhraseId: string;
  planPeriodType: string;
  phraseDomainCode?: string | number;
  phraseDomain?: string;
  ageYears?: string | number;
  phraseNo?: string | number;
  abilityCode: string | number;
  abilityDomain: string;
  categoryCode?: string | number;
  categoryName?: string;
  abilityName?: string;
  relationType?: string;
  weight: string | number;
  status?: string;
  sortOrder?: string | number;
  note?: string;
};

type WeekendPlayRow = {
  index?: string | number;
  playId: string;
  playTitle: string;
  playType?: string;
  setting?: string;
  status?: string;
  parentHint?: string;
  sourceFile?: string;
  playDescriptionDraft?: string;
  sortOrder?: string | number;
};

type WeekendPlayAbilityLinkRow = {
  index?: string | number;
  linkId: string;
  playId: string;
  playTitle?: string;
  sortOrder?: string | number;
  relationType?: string;
  weight?: string | number;
  abilityCode: string | number;
  domain?: string;
  category?: string;
  abilityName?: string;
  reason?: string;
  status?: string;
};

type GraphqlErrorLike = {
  message?: string | null;
};

type UserPoolAuthOptions = {
  authMode: "userPool";
};

type ListOptions = UserPoolAuthOptions & {
  limit?: number;
  nextToken?: string | null;
  filter?: Record<string, unknown>;
};

type ListResult<TItem> = {
  data?: TItem[] | null;
  nextToken?: string | null;
  errors?: GraphqlErrorLike[] | null;
};

type MutationResult<TItem> = {
  data?: TItem | null;
  errors?: GraphqlErrorLike[] | null;
};

type SeedItem = Record<string, unknown>;

type SeedModel<TItem extends SeedItem = SeedItem> = {
  list(args?: ListOptions): Promise<ListResult<TItem>>;
  create(
    payload: Record<string, unknown>,
    options?: UserPoolAuthOptions,
  ): Promise<MutationResult<TItem>>;
  update(
    payload: Record<string, unknown>,
    options?: UserPoolAuthOptions,
  ): Promise<MutationResult<TItem>>;
  delete(
    payload: Record<string, unknown>,
    options?: UserPoolAuthOptions,
  ): Promise<MutationResult<TItem>>;
};

type SeedModels = {
  AbilityCode: SeedModel;
  AbilityObservationHint: SeedModel;
  PlanPhrase: SeedModel;
  PlanPhraseAbilityLink: SeedModel;
  WeekendPlay: SeedModel;
  WeekendPlayAbilityLink: SeedModel;
};

type UpsertResult = "created" | "updated" | false;

function toInt(v: unknown): number | null {
  const value = String(v ?? "").trim();
  if (!value) return null;

  const num = Number(value);
  if (!Number.isFinite(num)) return null;

  return Math.trunc(num);
}

function asStr(v: unknown): string {
  const value = String(v ?? "").trim();
  if (!value) return "";
  if (/^\d+(\.0+)?$/.test(value)) return value.replace(/\.0+$/, "");
  return value;
}

function asNullable(v: unknown): string | null {
  const value = asStr(v);
  return value || null;
}

function readCsvField(row: Record<string, unknown>, key: string): unknown {
  if (Object.prototype.hasOwnProperty.call(row, key)) {
    return row[key];
  }

  const bomKey = `\uFEFF${key}`;
  if (Object.prototype.hasOwnProperty.call(row, bomKey)) {
    return row[bomKey];
  }

  return undefined;
}

function numberFromCode(value: string, prefix: string): number | null {
  const normalized = value.trim();
  if (!normalized.startsWith(prefix)) return null;

  const digits = normalized.slice(prefix.length).replace(/\D/g, "");
  if (!digits) return null;

  const num = Number(digits);
  return Number.isFinite(num) ? Math.trunc(num) : null;
}

function resolveWeekendPlaySortOrder(row: WeekendPlayRow): number {
  const rawRow = row as Record<string, unknown>;

  return (
    toInt(row.sortOrder) ??
    toInt(row.index) ??
    toInt(readCsvField(rawRow, "sortOrder")) ??
    toInt(readCsvField(rawRow, "index")) ??
    numberFromCode(asStr(row.playId), "WP-") ??
    999999
  );
}

function resolveWeekendPlayLinkSortOrder(
  row: WeekendPlayAbilityLinkRow,
): number {
  const rawRow = row as Record<string, unknown>;

  return (
    toInt(row.sortOrder) ??
    toInt(row.index) ??
    toInt(readCsvField(rawRow, "sortOrder")) ??
    toInt(readCsvField(rawRow, "index")) ??
    numberFromCode(asStr(row.linkId), "WPL-") ??
    999999
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      name?: unknown;
    };

    const message = asStr(maybeError.message);
    if (message) return message;

    const name = asStr(maybeError.name);
    if (name) return name;

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown object error.";
    }
  }

  return asStr(error) || "Unknown error.";
}

async function parseCsv<T extends object>(url: URL): Promise<T[]> {
  const text = await readFile(url, { encoding: "utf8" });
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) throw parsed.errors;
  return parsed.data;
}

async function readAmplifyOutputs(url: URL): Promise<AmplifyConfig> {
  const text = await readFile(url, { encoding: "utf8" });
  return JSON.parse(text) as AmplifyConfig;
}

async function promptLine(message: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    const value = await rl.question(message);
    return value.trim();
  } finally {
    rl.close();
  }
}

async function getUsername(): Promise<string> {
  return (process.env.SEED_USERNAME ?? DEFAULT_SEED_USERNAME).trim();
}

async function getPassword(): Promise<string> {
  const envPassword = process.env.SEED_PASSWORD?.trim();
  if (envPassword) return envPassword;

  const password = await promptLine("Enter seed password (input is visible): ");
  if (!password) {
    throw new Error("Seed password is empty.");
  }
  return password;
}

async function getTotpCode(): Promise<string> {
  const code = await promptLine("Enter current TOTP code: ");
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error("TOTP code must be 6 digits.");
  }
  return normalized;
}

async function listAll<TItem extends SeedItem>(
  model: SeedModel<TItem>,
  limit = 1000,
): Promise<TItem[]> {
  const out: TItem[] = [];
  let nextToken: string | null | undefined = undefined;

  for (;;) {
    const res = await model.list({
      limit,
      nextToken,
      authMode: "userPool",
    });

    if (res.errors?.length) throw res.errors;

    out.push(...(res.data ?? []));
    nextToken = res.nextToken;
    if (!nextToken) break;
  }

  return out;
}

async function wipeModelByKey<TItem extends SeedItem>(
  model: SeedModel<TItem>,
  label: string,
  keyField: string,
): Promise<void> {
  const items = await listAll(model, 1000);
  let deleted = 0;
  let skipped = 0;

  for (const item of items) {
    const keyValue = asStr(item[keyField]);
    if (!keyValue) {
      skipped += 1;
      continue;
    }

    const res = await model.delete(
      { [keyField]: keyValue },
      { authMode: "userPool" },
    );

    if (res.errors?.length) throw res.errors;
    deleted += 1;
  }

  console.log(`wiped ${label}: ${deleted} skipped=${skipped}`);
}

async function wipeModelById<TItem extends SeedItem>(
  model: SeedModel<TItem>,
  label: string,
): Promise<void> {
  await wipeModelByKey(model, label, "id");
}

async function confirmTotpWithRetry(maxAttempts = 3): Promise<void> {
  let lastError: unknown = null;

  for (let i = 1; i <= maxAttempts; i += 1) {
    try {
      const mfaCode = await getTotpCode();
      const confirmed = await confirmSignIn({ challengeResponse: mfaCode });

      if (confirmed.isSignedIn) {
        return;
      }

      const nextStep = confirmed.nextStep?.signInStep;
      if (nextStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
        console.log(`TOTP retry required (${i}/${maxAttempts})`);
        continue;
      }

      throw new Error(
        `MFA confirm did not complete. nextStep=${nextStep ?? "unknown"}`,
      );
    } catch (error) {
      lastError = error;
      if (i < maxAttempts) {
        console.log(`TOTP confirm failed (${i}/${maxAttempts}). Try again.`);
        continue;
      }
    }
  }

  throw lastError ?? new Error("TOTP confirmation failed.");
}

async function signInWithTotp(
  username: string,
  password: string,
): Promise<void> {
  let result: Awaited<ReturnType<typeof signIn>>;

  try {
    result = await signIn({ username, password });
  } catch (error) {
    const message = errorMessage(error);
    throw new Error(
      `Initial signIn failed before TOTP. username=${username} message=${message}`,
    );
  }

  if (result.isSignedIn) return;

  for (let guard = 0; guard < 6; guard += 1) {
    const step = result.nextStep?.signInStep;
    console.log("SEED signIn nextStep:", step);

    switch (step) {
      case "CONFIRM_SIGN_IN_WITH_TOTP_CODE": {
        await confirmTotpWithRetry(3);
        return;
      }

      case "CONTINUE_SIGN_IN_WITH_MFA_SELECTION": {
        result = await confirmSignIn({ challengeResponse: "TOTP" });
        if (result.isSignedIn) return;
        break;
      }

      case "CONFIRM_SIGN_IN_WITH_PASSWORD": {
        result = await confirmSignIn({ challengeResponse: password });
        if (result.isSignedIn) return;
        break;
      }

      default:
        throw new Error(`Unexpected signIn nextStep: ${step ?? "unknown"}`);
    }
  }

  throw new Error("signIn loop exceeded guard limit.");
}

async function findFirstByField<TItem extends SeedItem>(
  model: SeedModel<TItem>,
  field: string,
  value: string,
): Promise<TItem | null> {
  let nextToken: string | null | undefined = undefined;

  for (;;) {
    const res = await model.list({
      authMode: "userPool",
      filter: { [field]: { eq: value } },
      limit: 1000,
      nextToken,
    });

    if (res.errors?.length) throw res.errors;

    const found = (res.data ?? [])[0] ?? null;
    if (found) return found;

    nextToken = res.nextToken;
    if (!nextToken) return null;
  }
}

function parseActiveFlag(value: unknown): boolean {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return true;

  return !(
    raw === "false" ||
    raw === "0" ||
    raw === "inactive" ||
    raw === "archived"
  );
}

function sameNullableString(left: unknown, right: unknown): boolean {
  return asStr(left) === asStr(right);
}

async function findAbilityObservationHintByNaturalKey(
  model: SeedModel,
  payload: AbilityObservationHintPayload,
): Promise<SeedItem | null> {
  let nextToken: string | null | undefined = undefined;

  for (;;) {
    const res = await model.list({
      authMode: "userPool",
      filter: { abilityCode: { eq: payload.abilityCode } },
      limit: 1000,
      nextToken,
    });

    if (res.errors?.length) throw res.errors;

    const found = (res.data ?? []).find((item) => {
      const startingAge = toInt(item.startingAge) ?? 0;
      return (
        asStr(item.abilityCode) === payload.abilityCode &&
        startingAge === payload.startingAge &&
        sameNullableString(item.episode1, payload.episode1) &&
        sameNullableString(item.episode2, payload.episode2) &&
        sameNullableString(item.episode3, payload.episode3)
      );
    });

    if (found) return found;

    nextToken = res.nextToken;
    if (!nextToken) return null;
  }
}

async function upsertAbilityCode(
  model: SeedModel,
  row: AbilityRow,
): Promise<UpsertResult> {
  const code = asStr(row.code);
  if (!code) return false;

  const payload = {
    code,
    code_display: asStr(row.code_display),
    parent_code: asNullable(row.parent_code),
    level: toInt(row.level) ?? 0,
    name: asStr(row.name),
    domain: asNullable(row.domain),
    category: asNullable(row.category),
    sort_order: toInt(row.sort_order),
    is_leaf: String(row.is_leaf).toLowerCase() === "true",
    status: asStr(row.status) || "active",
    note: asNullable(row.note),
  };

  const existing = await findFirstByField(model, "code", code);
  const existingId = asStr(existing?.id);

  if (existingId) {
    const res = await model.update(
      {
        id: existingId,
        ...payload,
      },
      { authMode: "userPool" },
    );

    if (res.errors?.length) throw res.errors;
    return "updated";
  }

  const res = await model.create(payload, { authMode: "userPool" });
  if (res.errors?.length) throw res.errors;
  return "created";
}

async function upsertAbilityObservationHint(
  model: SeedModel,
  row: AbilityObservationHintRow,
): Promise<UpsertResult> {
  const abilityCode = asStr(row.abilityCode);
  if (!abilityCode) return false;

  const payload: AbilityObservationHintPayload = {
    abilityCode,
    abilityName: asStr(row.abilityName),
    startingAge: toInt(row.startingAge) ?? 0,
    episode1: asNullable(row.episode1),
    episode2: asNullable(row.episode2),
    episode3: asNullable(row.episode3),
    isActive: parseActiveFlag(row.isActive),
  };

  const existing = await findAbilityObservationHintByNaturalKey(model, payload);
  const existingId = asStr(existing?.id);

  if (existingId) {
    const res = await model.update(
      {
        id: existingId,
        ...payload,
      },
      { authMode: "userPool" },
    );

    if (res.errors?.length) throw res.errors;
    return "updated";
  }

  const res = await model.create(payload, { authMode: "userPool" });
  if (res.errors?.length) throw res.errors;
  return "created";
}

async function upsertPlanPhrase(
  model: SeedModel,
  row: PlanPhraseRow,
): Promise<UpsertResult> {
  const planPhraseId = asStr(row.planPhraseId);
  if (!planPhraseId) return false;

  const phraseText = asStr(row.phraseText);
  if (!phraseText) {
    throw new Error(
      `PlanPhrase phraseText is empty. planPhraseId=${planPhraseId}`,
    );
  }

  const payload = {
    planPhraseId,
    planPeriodType: asStr(row.planPeriodType) || "MONTH",
    domainCode: asStr(row.domainCode),
    domain: asStr(row.domain),
    ageYears: toInt(row.ageYears) ?? 0,
    phraseNo: toInt(row.phraseNo),
    phraseType: asNullable(row.phraseType),
    phraseText,
    source: asNullable(row.source),
    status: asStr(row.status) || "active",
    sortOrder: toInt(row.sortOrder),
    note: asNullable(row.note),
  };

  const existing = await findFirstByField(model, "planPhraseId", planPhraseId);
  const existingPlanPhraseId = asStr(existing?.planPhraseId);

  if (existingPlanPhraseId) {
    const res = await model.update(payload, { authMode: "userPool" });
    if (res.errors?.length) throw res.errors;
    return "updated";
  }

  const res = await model.create(payload, { authMode: "userPool" });
  if (res.errors?.length) throw res.errors;
  return "created";
}

async function upsertPlanPhraseAbilityLink(
  model: SeedModel,
  row: PlanPhraseAbilityLinkRow,
): Promise<UpsertResult> {
  const linkId = asStr(row.linkId);
  if (!linkId) return false;

  const planPhraseId = asStr(row.planPhraseId);
  const abilityCode = asStr(row.abilityCode);
  const abilityDomain = asStr(row.abilityDomain);

  if (!planPhraseId || !abilityCode || !abilityDomain) {
    throw new Error(
      `PlanPhraseAbilityLink required value is empty. linkId=${linkId} planPhraseId=${planPhraseId} abilityCode=${abilityCode} abilityDomain=${abilityDomain}`,
    );
  }

  const payload = {
    linkId,
    planPhraseId,
    planPeriodType: asStr(row.planPeriodType) || "MONTH",
    phraseDomainCode: asNullable(row.phraseDomainCode),
    phraseDomain: asNullable(row.phraseDomain),
    ageYears: toInt(row.ageYears),
    phraseNo: toInt(row.phraseNo),
    abilityCode,
    abilityDomain,
    categoryCode: asNullable(row.categoryCode),
    categoryName: asNullable(row.categoryName),
    abilityName: asNullable(row.abilityName),
    relationType: asNullable(row.relationType),
    weight: toInt(row.weight) ?? 0,
    status: asStr(row.status) || "active",
    sortOrder: toInt(row.sortOrder),
    note: asNullable(row.note),
  };

  const existing = await findFirstByField(model, "linkId", linkId);
  const existingLinkId = asStr(existing?.linkId);

  if (existingLinkId) {
    const res = await model.update(payload, { authMode: "userPool" });
    if (res.errors?.length) throw res.errors;
    return "updated";
  }

  const res = await model.create(payload, { authMode: "userPool" });
  if (res.errors?.length) throw res.errors;
  return "created";
}

async function upsertWeekendPlay(
  model: SeedModel,
  row: WeekendPlayRow,
): Promise<UpsertResult> {
  const playId = asStr(row.playId);
  if (!playId) return false;

  const playTitle = asStr(row.playTitle);
  if (!playTitle) {
    throw new Error(`WeekendPlay playTitle is empty. playId=${playId}`);
  }

  const payload = {
    playId,
    playTitle,
    playType: asNullable(row.playType),
    setting: asNullable(row.setting),
    status: asStr(row.status) || "active",
    parentHint: asNullable(row.parentHint),
    sourceFile: asNullable(row.sourceFile),
    playDescriptionDraft: asNullable(row.playDescriptionDraft),
    sortOrder: resolveWeekendPlaySortOrder(row),
  };

  const existing = await findFirstByField(model, "playId", playId);
  const existingPlayId = asStr(existing?.playId);

  if (existingPlayId) {
    const res = await model.update(payload, { authMode: "userPool" });
    if (res.errors?.length) throw res.errors;
    return "updated";
  }

  const res = await model.create(payload, { authMode: "userPool" });
  if (res.errors?.length) throw res.errors;
  return "created";
}

async function upsertWeekendPlayAbilityLink(
  model: SeedModel,
  row: WeekendPlayAbilityLinkRow,
): Promise<UpsertResult> {
  const linkId = asStr(row.linkId);
  if (!linkId) return false;

  const playId = asStr(row.playId);
  const abilityCode = asStr(row.abilityCode);

  if (!playId || !abilityCode) {
    throw new Error(
      `WeekendPlayAbilityLink required value is empty. linkId=${linkId} playId=${playId} abilityCode=${abilityCode}`,
    );
  }

  const payload = {
    linkId,
    playId,
    playTitle: asNullable(row.playTitle),
    sortOrder: resolveWeekendPlayLinkSortOrder(row),
    relationType: asNullable(row.relationType),
    weight: toInt(row.weight) ?? 0,
    abilityCode,
    domain: asNullable(row.domain),
    category: asNullable(row.category),
    abilityName: asNullable(row.abilityName),
    reason: asNullable(row.reason),
    status: asStr(row.status) || "active",
  };

  const existing = await findFirstByField(model, "linkId", linkId);
  const existingLinkId = asStr(existing?.linkId);

  if (existingLinkId) {
    const res = await model.update(payload, { authMode: "userPool" });
    if (res.errors?.length) throw res.errors;
    return "updated";
  }

  const res = await model.create(payload, { authMode: "userPool" });
  if (res.errors?.length) throw res.errors;
  return "created";
}

async function seedRows<T extends object>(args: {
  label: string;
  rows: T[];
  upsert: (row: T) => Promise<UpsertResult>;
}): Promise<void> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of args.rows) {
    const result = await args.upsert(row);
    if (result === "created") created += 1;
    else if (result === "updated") updated += 1;
    else skipped += 1;
  }

  console.log(
    `seeded ${args.label}: created=${created} updated=${updated} skipped=${skipped}`,
  );
}

(async () => {
  let signedIn = false;

  try {
    const outputs = await readAmplifyOutputs(outputsUrl);
    Amplify.configure(outputs);

    const username = await getUsername();
    const password = await getPassword();

    console.log("SEED target:", seedTarget);
    console.log("SEED outputs:", fileURLToPath(outputsUrl));
    console.log("SEED user:", `${username.slice(0, 4)}***`);
    console.log("SEED wipe:", SHOULD_WIPE);
    console.log(
      "SEED replaceObservationHints:",
      SHOULD_REPLACE_OBSERVATION_HINTS,
    );

    await signInWithTotp(username, password);
    signedIn = true;

    const session = await fetchAuthSession();
    const hasIdToken = !!session.tokens?.idToken;
    const hasAccessToken = !!session.tokens?.accessToken;
    console.log("SEED authSession:", { hasIdToken, hasAccessToken });

    if (!hasIdToken || !hasAccessToken) {
      throw new Error("UserPool tokens are missing after sign-in.");
    }

    const client = generateClient<Schema>();
    const models = client.models as unknown as SeedModels;

    if (SHOULD_WIPE) {
      await wipeModelByKey(
        models.WeekendPlayAbilityLink,
        "WeekendPlayAbilityLink",
        "linkId",
      );
      await wipeModelByKey(models.WeekendPlay, "WeekendPlay", "playId");

      await wipeModelByKey(
        models.PlanPhraseAbilityLink,
        "PlanPhraseAbilityLink",
        "linkId",
      );
      await wipeModelByKey(models.PlanPhrase, "PlanPhrase", "planPhraseId");

      await wipeModelById(
        models.AbilityObservationHint,
        "AbilityObservationHint",
      );
      await wipeModelById(models.AbilityCode, "AbilityCode");
    } else {
      console.log("core master wipe skipped");

      if (SHOULD_REPLACE_OBSERVATION_HINTS) {
        await wipeModelById(
          models.AbilityObservationHint,
          "AbilityObservationHint",
        );
      }
    }

    // 1) AbilityCode投入
    const abilityRows = await parseCsv<AbilityRow>(abilityCsvUrl);
    await seedRows({
      label: "AbilityCode",
      rows: abilityRows,
      upsert: (row) => upsertAbilityCode(models.AbilityCode, row),
    });

    // 2) AbilityObservationHint投入
    const hintRows = await parseCsv<AbilityObservationHintRow>(
      observationHintCsvUrl,
    );
    await seedRows({
      label: "AbilityObservationHint",
      rows: hintRows,
      upsert: (row) =>
        upsertAbilityObservationHint(models.AbilityObservationHint, row),
    });

    // 3) PlanPhrase投入
    const planPhraseRows = await parseCsv<PlanPhraseRow>(planPhraseCsvUrl);
    await seedRows({
      label: "PlanPhrase",
      rows: planPhraseRows,
      upsert: (row) => upsertPlanPhrase(models.PlanPhrase, row),
    });

    // 4) PlanPhraseAbilityLink投入
    const linkRows = await parseCsv<PlanPhraseAbilityLinkRow>(
      planPhraseAbilityLinkCsvUrl,
    );
    await seedRows({
      label: "PlanPhraseAbilityLink",
      rows: linkRows,
      upsert: (row) =>
        upsertPlanPhraseAbilityLink(models.PlanPhraseAbilityLink, row),
    });

    // 5) WeekendPlay投入
    const weekendPlayRows = await parseCsv<WeekendPlayRow>(weekendPlayCsvUrl);
    await seedRows({
      label: "WeekendPlay",
      rows: weekendPlayRows,
      upsert: (row) => upsertWeekendPlay(models.WeekendPlay, row),
    });

    // 6) WeekendPlayAbilityLink投入
    const weekendPlayAbilityLinkRows =
      await parseCsv<WeekendPlayAbilityLinkRow>(weekendPlayAbilityLinkCsvUrl);
    await seedRows({
      label: "WeekendPlayAbilityLink",
      rows: weekendPlayAbilityLinkRows,
      upsert: (row) =>
        upsertWeekendPlayAbilityLink(models.WeekendPlayAbilityLink, row),
    });

    console.log("seed done.");
  } finally {
    if (signedIn) {
      try {
        await signOut();
      } catch {
        // no-op
      }
    }
  }
})().catch((error) => {
  console.error("SEED failed:", error);
  process.exit(1);
});
