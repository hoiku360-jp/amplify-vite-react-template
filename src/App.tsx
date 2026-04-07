"use client";

import { useEffect, useMemo, useState } from "react";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";

import outputs from "../amplify_outputs.json";
import type { Schema } from "../amplify/data/resource";

import SignedInApp from "./SignedInApp";

Amplify.configure(outputs);

function AuthenticatedShell(props: { signOut?: () => void; user: any }) {
  const { signOut, user } = props;

  const client = useMemo(() => generateClient<Schema>(), []);

  const [sub, setSub] = useState<string | null>(null);
  const [profile, setProfile] = useState<Schema["UserProfile"]["type"] | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // 既存画面へ渡す owner は、これまでの実装に合わせて username を優先
  const owner = user?.username ?? "unknown-owner";
  const safeSignOut = signOut ?? (() => {});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setProfileError(null);

        const session = await fetchAuthSession();
        const tokenSub = session.tokens?.idToken?.payload?.sub;
        if (!cancelled) {
          setSub(typeof tokenSub === "string" ? tokenSub : null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setProfileError(e?.message ?? String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sub) return;

    let cancelled = false;

    (async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);

        const res = await client.models.UserProfile.get({ userId: sub });
        if (res.errors?.length) {
          throw new Error(res.errors.map((e) => e.message).join("\n"));
        }

        if (!cancelled) {
          setProfile(res.data ?? null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setProfileError(e?.message ?? String(e));
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, sub]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #ddd",
          background: "#fafafa",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <b>signedInAs:</b> {user?.signInDetails?.loginId ?? user?.username ?? "(unknown)"}
        </div>
        <div>
          <b>tenant:</b> {profile?.tenantId ?? "(未設定)"}
        </div>
        <div>
          <b>role:</b> {profile?.role ?? "(未設定)"}
        </div>
        <div>
          <b>fullName:</b> {profile?.fullName ?? "(未設定)"}
        </div>
        {profileLoading && <div>profile loading...</div>}
        {profileError && (
          <div style={{ color: "crimson" }}>
            <b>profile error:</b> {profileError}
          </div>
        )}
        {!profileLoading && !profile && !profileError && (
          <div style={{ color: "#8a6d3b" }}>
            UserProfile が未登録です
          </div>
        )}
      </div>

      <SignedInApp owner={owner} signOut={safeSignOut} />
    </div>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AuthenticatedShell signOut={signOut} user={user} />
      )}
    </Authenticator>
  );
}