"use client";

import {
  Authenticator,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { fetchUserAttributes } from "aws-amplify/auth";
import type { UserAttributeKey } from "aws-amplify/auth";

import { useEffect, useState } from "react";

/** ログイン後の画面 */
function SignedInApp(props: { signOut?: () => void; user: any }) {
  const { signOut, user } = props;

  const [attrs, setAttrs] = useState<Partial<Record<UserAttributeKey, string>> | null>(null);
  const [attrError, setAttrError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setAttrError(null);
        const a = await fetchUserAttributes();
        if (!cancelled) setAttrs(a ?? null);
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

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div>Signed in as: {user?.signInDetails?.loginId ?? user?.username}</div>
        <button onClick={() => signOut?.()} disabled={!signOut}>
          Sign out
        </button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
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
          <div style={{ marginTop: 8 }}>
            <b>属性取得エラー:</b> {attrError}
          </div>
        )}
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div>My todos UI goes here</div>
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