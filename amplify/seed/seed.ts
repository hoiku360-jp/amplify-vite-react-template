// amplify/seed/seed.ts
import { readFile } from "node:fs/promises";
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
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const outputsUrl = new URL("../../amplify_outputs.json", import.meta.url);

const abilityCsvUrl = new URL("./data/ability_codes_lang.csv", import.meta.url);
const observationHintCsvUrl = new URL(
  "./data/AbilityObservationHint.csv",
  import.meta.url,
);

// 固定ユーザー名
const DEFAULT_SEED_USERNAME = "noreply-test01@hoiku360.jp";

// 通常は wipe しない。
// 明示的に入れ直したいときだけ SEED_WIPE_CORE_MASTER=true を付ける。
const SHOULD_WIPE =
  String(process.env.SEED_WIPE_CORE_MASTER ?? "").toLowerCase() === "true";

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
};

function toInt(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function asStr(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (/^\d+(\.0+)?$/.test(s)) return s.replace(/\.0+$/, "");
  return s;
}

function asNullable(v: unknown): string | null {
  const s = asStr(v);
  return s || null;
}

async function parseCsv<T extends object>(url: URL): Promise<T[]> {
  const text = await readFile(url, { encoding: "utf8" });
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) throw parsed.errors;
  return parsed.data;
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

  const password = await promptLine(
    "Enter seed password (input is visible): ",
  );
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

async function listAll(model: any, limit = 1000): Promise<any[]> {
  const out: any[] = [];
  let nextToken: string | null | undefined = undefined;

  for (;;) {
    const res: any = await model.list({
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

async function confirmTotpWithRetry(maxAttempts = 3) {
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

async function signInWithTotp(username: string, password: string) {
  let result;

  try {
    result = await signIn({ username, password });
  } catch (error: any) {
    const message =
      error?.message ??
      error?.name ??
      "Unknown signIn error before TOTP step.";
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

async function findFirstByField(model: any, field: string, value: string) {
  const res: any = await model.list({
    authMode: "userPool",
    filter: { [field]: { eq: value } },
    limit: 1,
  });
  if (res.errors?.length) throw res.errors;
  return (res.data ?? [])[0] ?? null;
}

async function upsertAbilityCode(model: any, row: AbilityRow) {
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

  if (existing?.id) {
    const res: any = await model.update(
      {
        id: existing.id,
        ...payload,
      },
      { authMode: "userPool" },
    );
    if (res.errors?.length) throw res.errors;
    return "updated";
  }

  const res: any = await model.create(payload, { authMode: "userPool" });
  if (res.errors?.length) throw res.errors;
  return "created";
}

async function upsertAbilityObservationHint(
  model: any,
  row: AbilityObservationHintRow,
) {
  const abilityCode = asStr(row.abilityCode);
  if (!abilityCode) return false;

  const payload = {
    abilityCode,
    abilityName: asStr(row.abilityName),
    startingAge: toInt(row.startingAge) ?? 0,
    episode1: asNullable(row.episode1),
    episode2: asNullable(row.episode2),
    episode3: asNullable(row.episode3),
    isActive: true,
  };

  const existing = await findFirstByField(model, "abilityCode", abilityCode);

  if (existing?.id) {
    const res: any = await model.update(
      {
        id: existing.id,
        ...payload,
      },
      { authMode: "userPool" },
    );
    if (res.errors?.length) throw res.errors;
    return "updated";
  }

  const res: any = await model.create(payload, { authMode: "userPool" });
  if (res.errors?.length) throw res.errors;
  return "created";
}

(async () => {
  let signedIn = false;

  try {
    const outputs = JSON.parse(await readFile(outputsUrl, { encoding: "utf8" }));
    Amplify.configure(outputs);

    const username = await getUsername();
    const password = await getPassword();

    console.log("SEED user:", `${username.slice(0, 4)}***`);
    console.log("SEED wipe:", SHOULD_WIPE);

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

    if (SHOULD_WIPE) {
      await wipeModelById(
        (client.models as any).AbilityObservationHint,
        "AbilityObservationHint",
      );
      await wipeModelById((client.models as any).AbilityCode, "AbilityCode");
    } else {
      console.log("core master wipe skipped");
    }

    // 1) AbilityCode投入
    const abilityRows = await parseCsv<AbilityRow>(abilityCsvUrl);

    let createdAbility = 0;
    let updatedAbility = 0;

    for (const r of abilityRows) {
      const result = await upsertAbilityCode(
        (client.models as any).AbilityCode,
        r,
      );
      if (result === "created") createdAbility += 1;
      if (result === "updated") updatedAbility += 1;
    }

    console.log(
      `seeded AbilityCode: created=${createdAbility} updated=${updatedAbility}`,
    );

    // 2) AbilityObservationHint投入
    const hintRows = await parseCsv<AbilityObservationHintRow>(
      observationHintCsvUrl,
    );

    let createdHints = 0;
    let updatedHints = 0;

    for (const r of hintRows) {
      const result = await upsertAbilityObservationHint(
        (client.models as any).AbilityObservationHint,
        r,
      );
      if (result === "created") createdHints += 1;
      if (result === "updated") updatedHints += 1;
    }

    console.log(
      `seeded AbilityObservationHint: created=${createdHints} updated=${updatedHints}`,
    );

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