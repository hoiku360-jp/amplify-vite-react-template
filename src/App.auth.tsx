"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import type { UserAttributeKey } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

import { useEffect, useMemo, useState } from "react";

/** ログイン後の画面 */
function SignedInApp(props: { signOut?: () => void; user: any }) {
  const { signOut, user } = props;

  const client = useMemo(() => generateClient<Schema>(), []);

  const [attrs, setAttrs] = useState<Partial<Record<UserAttributeKey, string>> | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [attrError, setAttrError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  const [profile, setProfile] = useState<Schema["UserProfile"]["type"] | null>(null);
  const [tenant, setTenant] = useState<Schema["Tenant"]["type"] | null>(null);

  const [abilityCount, setAbilityCount] = useState<number | null>(null);
  const [practiceCount, setPracticeCount] = useState<number | null>(null);

  // 仮の tenantId
  const tenantId = "demo-tenant";

  const [editFullName, setEditFullName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setAttrError(null);

        const a = await fetchUserAttributes();
        if (!cancelled) setAttrs(a ?? null);

        const session = await fetchAuthSession();
        const tokenSub = session.tokens?.idToken?.payload?.sub;
        if (!cancelled) {
          setSub(typeof tokenSub === "string" ? tokenSub : null);
        }
      } catch (e: any) {
        if (!cancelled) setAttrError(e?.message ?? String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.username, user?.signInDetails?.loginId]);

  const displayName =
    (attrs?.preferred_username as string | undefined) ??
    user?.signInDetails?.loginId ??
    user?.username ??
    "";

  const fullName = (attrs?.name as string | undefined) ?? "(未設定)";
  const email =
    (attrs?.email as string | undefined) ??
    user?.signInDetails?.loginId ??
    "(不明)";

  useEffect(() => {
    setEditFullName(fullName === "(未設定)" ? "" : fullName);
    setEditDisplayName(displayName);
  }, [fullName, displayName]);

  async function createTenant() {
    try {
      setBusy(true);
      setMessage("");

      const existing = await client.models.Tenant.get({ tenantId });
      if (existing.errors?.length) {
        throw new Error(existing.errors.map((e) => e.message).join("\n"));
      }

      if (existing.data) {
        setTenant(existing.data);
        setMessage("Tenant はすでに存在しています。");
        return;
      }

      const res = await client.models.Tenant.create({
        tenantId,
        name: "デモ保育園",
        legalName: "デモ保育園",
        status: "active",
        plan: "standard",
        note: "初期確認用に作成",
      });

      if (res.errors?.length) {
        throw new Error(res.errors.map((e) => e.message).join("\n"));
      }

      setMessage("Tenant を作成しました。");
      await loadTenant();
    } catch (e: any) {
      setMessage(`Tenant 作成エラー: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadTenant() {
    try {
      setBusy(true);
      setMessage("");

      const res = await client.models.Tenant.get({ tenantId });

      if (res.errors?.length) {
        throw new Error(res.errors.map((e) => e.message).join("\n"));
      }

      setTenant(res.data ?? null);
      setMessage(res.data ? "Tenant を読み込みました。" : "Tenant はまだありません。");
    } catch (e: any) {
      setMessage(`Tenant 読み込みエラー: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function upsertUserProfile() {
    if (!sub) {
      setMessage("sub が未取得です。");
      return;
    }

    try {
      setBusy(true);
      setMessage("");

      const nextFullName = editFullName.trim() || "未設定ユーザー";
      const nextDisplayName = editDisplayName.trim() || displayName || null;
      const nextEmail = email === "(不明)" ? null : email;

      const existing = await client.models.UserProfile.get({ userId: sub });
      if (existing.errors?.length) {
        throw new Error(existing.errors.map((e) => e.message).join("\n"));
      }

      if (existing.data) {
        const res = await client.models.UserProfile.update({
          userId: sub,
          tenantId,
          fullName: nextFullName,
          displayName: nextDisplayName,
          phoneticName: null,
          email: nextEmail,
          role: "tenantAdmin",
          status: "active",
          department: "園全体",
          position: "管理者",
          profileVisibility: "tenant",
          practiceDefaultVisibility: "tenant",
          owner: sub,
        });

        if (res.errors?.length) {
          throw new Error(res.errors.map((e) => e.message).join("\n"));
        }

        setMessage("UserProfile を更新しました。");
      } else {
        const res = await client.models.UserProfile.create({
          userId: sub,
          tenantId,
          fullName: nextFullName,
          displayName: nextDisplayName,
          phoneticName: null,
          email: nextEmail,
          role: "tenantAdmin",
          status: "active",
          department: "園全体",
          position: "管理者",
          profileVisibility: "tenant",
          practiceDefaultVisibility: "tenant",
          owner: sub,
        });

        if (res.errors?.length) {
          throw new Error(res.errors.map((e) => e.message).join("\n"));
        }

        setMessage("UserProfile を作成しました。");
      }

      await loadMyProfile();
    } catch (e: any) {
      setMessage(`UserProfile 作成/更新エラー: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadMyProfile() {
    if (!sub) {
      setMessage("sub が未取得です。");
      return;
    }

    try {
      const res = await client.models.UserProfile.get({ userId: sub });

      if (res.errors?.length) {
        throw new Error(res.errors.map((e) => e.message).join("\n"));
      }

      setProfile(res.data ?? null);

      if (res.data) {
        setEditFullName(String(res.data.fullName ?? ""));
        setEditDisplayName(String(res.data.displayName ?? ""));
      }
    } catch (e: any) {
      setMessage(`UserProfile 読み込みエラー: ${e?.message ?? String(e)}`);
    }
  }

  async function checkSeedData() {
    try {
      setBusy(true);
      setMessage("");

      const abilityRes = await client.models.AbilityCode.list({
        authMode: "userPool",
        limit: 20,
      });
      if (abilityRes.errors?.length) {
        throw new Error(abilityRes.errors.map((e) => e.message).join("\n"));
      }

      const practiceRes = await client.models.PracticeCode.list({
        authMode: "userPool",
        limit: 20,
      });
      if (practiceRes.errors?.length) {
        throw new Error(practiceRes.errors.map((e) => e.message).join("\n"));
      }

      setAbilityCount((abilityRes.data ?? []).length);
      setPracticeCount((practiceRes.data ?? []).length);

      setMessage(
        `seed確認: AbilityCode sample count=${(abilityRes.data ?? []).length}, PracticeCode sample count=${(practiceRes.data ?? []).length}`,
      );
    } catch (e: any) {
      setMessage(`seed確認エラー: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  // sub が取れたら自動で UserProfile / Tenant を読む
  useEffect(() => {
    if (!sub) return;
    void loadMyProfile();
    void loadTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub]);

  const profileReady = !!profile;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          Signed in as: {user?.signInDetails?.loginId ?? user?.username}
        </div>
        <div>
          tenant: <b>{profile?.tenantId ?? tenantId}</b>
        </div>
        <div>
          role: <b>{profile?.role ?? "(未設定)"}</b>
        </div>
        <div>
          fullName: <b>{profile?.fullName ?? fullName}</b>
        </div>
        <button onClick={() => signOut?.()} disabled={!signOut || busy}>
          Sign out
        </button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {!profileReady && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            border: "1px solid orange",
            borderRadius: 8,
            background: "#fff8e1",
          }}
        >
          UserProfile が未登録です。必要に応じて下の「UserProfile 作成/更新」を押してください。
        </div>
      )}

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, display: "grid", gap: 6 }}>
        <div>
          <b>sub:</b> {sub ?? "(未取得)"}
        </div>
        <div>
          <b>Email:</b> {email}
        </div>
        <div>
          <b>表示名（preferred_username）:</b> {displayName}
        </div>
        <div>
          <b>氏名（name）:</b> {fullName}
        </div>

        {attrError && (
          <div style={{ marginTop: 8, color: "crimson" }}>
            <b>属性取得エラー:</b> {attrError}
          </div>
        )}
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={createTenant} disabled={busy || !sub}>
          Tenant 作成
        </button>
        <button onClick={loadTenant} disabled={busy}>
          Tenant 読み込み
        </button>
        <button onClick={upsertUserProfile} disabled={busy || !sub}>
          UserProfile 作成/更新
        </button>
        <button onClick={loadMyProfile} disabled={busy || !sub}>
          UserProfile 読み込み
        </button>
        <button onClick={checkSeedData} disabled={busy}>
          seed確認
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          display: "grid",
          gap: 8,
          maxWidth: 520,
        }}
      >
        <div style={{ fontWeight: 600 }}>UserProfile 編集（簡易）</div>

        <label style={{ display: "grid", gap: 4 }}>
          <span>氏名（fullName）</span>
          <input
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            placeholder="例）多田 伸良"
          />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span>表示名（displayName）</span>
          <input
            value={editDisplayName}
            onChange={(e) => setEditDisplayName(e.target.value)}
            placeholder="例）多田先生"
          />
        </label>
      </div>

      {message && (
        <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 14 }}>
        <div><b>AbilityCode sample:</b> {abilityCount ?? "-"}</div>
        <div><b>PracticeCode sample:</b> {practiceCount ?? "-"}</div>
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>現在の Tenant</div>
        {tenant ? (
          <div style={{ display: "grid", gap: 4, fontSize: 14 }}>
            <div><b>tenantId:</b> {String(tenant.tenantId)}</div>
            <div><b>name:</b> {String(tenant.name)}</div>
            <div><b>legalName:</b> {String(tenant.legalName ?? "")}</div>
            <div><b>status:</b> {String(tenant.status)}</div>
            <div><b>plan:</b> {String(tenant.plan ?? "")}</div>
            <div><b>note:</b> {String(tenant.note ?? "")}</div>
          </div>
        ) : (
          <div>まだ Tenant はありません。</div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>現在の UserProfile</div>
        {profile ? (
          <div style={{ display: "grid", gap: 4, fontSize: 14 }}>
            <div><b>userId:</b> {String(profile.userId)}</div>
            <div><b>tenantId:</b> {String(profile.tenantId)}</div>
            <div><b>fullName:</b> {String(profile.fullName)}</div>
            <div><b>displayName:</b> {String(profile.displayName ?? "")}</div>
            <div><b>email:</b> {String(profile.email ?? "")}</div>
            <div><b>role:</b> {String(profile.role)}</div>
            <div><b>status:</b> {String(profile.status)}</div>
            <div><b>department:</b> {String(profile.department ?? "")}</div>
            <div><b>position:</b> {String(profile.position ?? "")}</div>
            <div><b>profileVisibility:</b> {String(profile.profileVisibility ?? "")}</div>
            <div><b>practiceDefaultVisibility:</b> {String(profile.practiceDefaultVisibility ?? "")}</div>
            <div><b>owner:</b> {String(profile.owner)}</div>
          </div>
        ) : (
          <div>まだ UserProfile はありません。</div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Authenticator loginMechanisms={["email"]} signUpAttributes={["name"]}>
      {({ signOut, user }) => <SignedInApp signOut={signOut} user={user} />}
    </Authenticator>
  );
}