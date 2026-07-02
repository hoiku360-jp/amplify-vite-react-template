// amplify/seed/normalize-practice-tenant-id.ts
// 既存の PracticeCode を共通Practiceマスター化するため、PracticeCode.tenantId を null に戻す。
// 実行例:
//   npx tsx amplify/seed/normalize-practice-tenant-id.ts
// 任意:
//   $env:PRACTICE_TENANT_DRY_RUN="true"  # 更新せず対象件数だけ確認

import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import {
  confirmSignIn,
  fetchAuthSession,
  signIn,
  signOut,
} from "aws-amplify/auth";

import type { Schema } from "../data/resource";

type AmplifyConfig = Parameters<typeof Amplify.configure>[0];
type GraphqlErrorLike = { message?: string | null };
type UserPoolAuthOptions = { authMode: "userPool" };
type ListOptions = UserPoolAuthOptions & {
  limit?: number;
  nextToken?: string | null;
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
type PracticeCodeRow = Schema["PracticeCode"]["type"] & {
  id?: string | null;
  practice_code?: string | null;
  tenantId?: string | null;
};
type PracticeCodeModel = {
  list(args?: ListOptions): Promise<ListResult<PracticeCodeRow>>;
  update(
    payload: Record<string, unknown>,
    options?: UserPoolAuthOptions,
  ): Promise<MutationResult<PracticeCodeRow>>;
};
type Models = {
  PracticeCode: PracticeCodeModel;
};

const repoRootPath = fileURLToPath(new URL("../../", import.meta.url));
const DEFAULT_USERNAME = "noreply-test01@hoiku360.jp";
const DRY_RUN =
  String(process.env.PRACTICE_TENANT_DRY_RUN ?? "").toLowerCase() === "true";

function resolveOutputsUrl(): URL {
  const outputsFile = String(process.env.SEED_OUTPUTS_FILE ?? "").trim();
  if (!outputsFile)
    return new URL("../../amplify_outputs.json", import.meta.url);
  if (/^file:/i.test(outputsFile)) return new URL(outputsFile);

  const absolutePath = isAbsolute(outputsFile)
    ? outputsFile
    : resolve(repoRootPath, outputsFile);
  return pathToFileURL(absolutePath);
}

function asStr(value: unknown): string {
  return String(value ?? "").trim();
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
  return String(process.env.SEED_USERNAME ?? DEFAULT_USERNAME).trim();
}

async function getPassword(): Promise<string> {
  const envPassword = process.env.SEED_PASSWORD?.trim();
  if (envPassword) return envPassword;

  const password = await promptLine("Enter seed password (input is visible): ");
  if (!password) throw new Error("Password is empty.");
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

async function confirmTotpWithRetry(maxAttempts = 3): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const code = await getTotpCode();
      const confirmed = await confirmSignIn({ challengeResponse: code });
      console.log("signIn confirmed:", confirmed.nextStep.signInStep);
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `TOTP confirmation failed. attempt=${attempt}/${maxAttempts}`,
      );
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function signInWithTotp(
  username: string,
  password: string,
): Promise<void> {
  try {
    await signOut();
  } catch {
    // 既に未ログインなら無視する。
  }

  const result = await signIn({ username, password });
  console.log("signIn nextStep:", result.nextStep.signInStep);

  if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
    await confirmTotpWithRetry();
    return;
  }

  if (result.nextStep.signInStep !== "DONE") {
    throw new Error(
      `Unsupported signIn next step: ${result.nextStep.signInStep}`,
    );
  }
}

async function listAllPracticeCodes(
  model: PracticeCodeModel,
): Promise<PracticeCodeRow[]> {
  const items: PracticeCodeRow[] = [];
  let nextToken: string | null | undefined = undefined;

  for (;;) {
    const res = await model.list({
      authMode: "userPool",
      limit: 1000,
      nextToken,
    });

    if (res.errors?.length) throw res.errors;
    items.push(...(res.data ?? []));
    nextToken = res.nextToken;
    if (!nextToken) break;
  }

  return items;
}

function summarizeTenantCounts(
  rows: PracticeCodeRow[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = asStr(row.tenantId) || "<null>";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

(async () => {
  let signedIn = false;

  try {
    const outputsUrl = resolveOutputsUrl();
    const outputs = await readAmplifyOutputs(outputsUrl);
    Amplify.configure(outputs);

    const username = await getUsername();
    const password = await getPassword();

    console.log(
      "Practice tenant normalize outputs:",
      fileURLToPath(outputsUrl),
    );
    console.log(
      "Practice tenant normalize user:",
      `${username.slice(0, 4)}***`,
    );
    console.log("Practice tenant normalize dryRun:", DRY_RUN);

    await signInWithTotp(username, password);
    signedIn = true;

    const session = await fetchAuthSession();
    if (!session.tokens?.idToken || !session.tokens?.accessToken) {
      throw new Error("UserPool tokens are missing after sign-in.");
    }

    const client = generateClient<Schema>();
    const models = client.models as unknown as Models;

    const rows = await listAllPracticeCodes(models.PracticeCode);
    const targets = rows.filter((row) => asStr(row.id) && asStr(row.tenantId));

    console.log("PracticeCode total:", rows.length);
    console.log(
      "PracticeCode tenant counts before:",
      summarizeTenantCounts(rows),
    );
    console.log("PracticeCode normalize target:", targets.length);

    let updated = 0;
    let skipped = 0;

    for (const row of targets) {
      const id = asStr(row.id);
      const practiceCode = asStr(row.practice_code);
      const currentTenantId = asStr(row.tenantId);

      if (!id || !currentTenantId) {
        skipped += 1;
        continue;
      }

      if (DRY_RUN) {
        console.log(
          `dry-run: ${practiceCode || id}: ${currentTenantId} -> null`,
        );
        skipped += 1;
        continue;
      }

      const res = await models.PracticeCode.update(
        {
          id,
          tenantId: null,
        },
        { authMode: "userPool" },
      );

      if (res.errors?.length) throw res.errors;
      updated += 1;
    }

    const afterRows = DRY_RUN
      ? rows
      : await listAllPracticeCodes(models.PracticeCode);
    console.log(
      "PracticeCode tenant counts after:",
      summarizeTenantCounts(afterRows),
    );
    console.log(
      `PracticeCode normalize completed: updated=${updated} skipped=${skipped}`,
    );
  } catch (error) {
    console.error("PracticeCode normalize failed:", error);
    process.exitCode = 1;
  } finally {
    if (signedIn) {
      try {
        await signOut();
      } catch {
        // signOut失敗は移行結果に影響しない。
      }
    }
  }
})();
