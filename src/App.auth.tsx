import {
  Authenticator,
  TextField,
  useAuthenticator,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { fetchUserAttributes } from "aws-amplify/auth";
import React, { useEffect, useState } from "react";

/** ログイン後の画面（Hookはここで使う） */
function SignedInApp(props: {
  signOut: () => void;
  user: any;
}) {
  const { signOut, user } = props;

  const [attrs, setAttrs] = useState<Record<string, string> | null>(null);
  const [attrError, setAttrError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setAttrError(null);
        const a = await fetchUserAttributes();
        if (!cancelled) setAttrs(a);
      } catch (e: any) {
        if (!cancelled) setAttrError(e?.message ?? String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  const org = attrs?.["custom:organization"] ?? "(未設定)";
  const displayName =
    attrs?.["preferred_username"] ??
    user?.signInDetails?.loginId ??
    user?.username ??
    "";
  const fullName = attrs?.["name"] ?? "(未設定)";

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div>
          Signed in as: {user?.signInDetails?.loginId ?? user?.username}
        </div>
        <button onClick={signOut}>Sign out</button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div><b>表示名（preferred_username）:</b> {displayName}</div>
        <div><b>氏名（name）:</b> {fullName}</div>
        <div><b>所属（custom:organization）:</b> {org}</div>

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
    <Authenticator
      loginMechanisms={["email"]}
      signUpAttributes={["name", "preferred_username"]}
      components={{
        SignUp: {
          FormFields() {
            const { validationErrors } = useAuthenticator();
            return (
              <>
                <Authenticator.SignUp.FormFields />
                <TextField
                  label="所属（園名 / 組織名）"
                  name="custom:organization"
                  placeholder="例）さくら保育園"
                  type="text"
                  hasError={!!validationErrors["custom:organization"]}
                  errorMessage={validationErrors["custom:organization"] as string}
                />
              </>
            );
          },
        },
      }}
      services={{
        async validateCustomSignUp(formData) {
          // 必須にしたい場合だけ。任意で良ければこのifごと削除OK。
          if (!formData["custom:organization"]) {
            return { "custom:organization": "所属は必須です" };
          }
        },
      }}
    >
      {({ signOut, user }) => (
        <SignedInApp signOut={signOut} user={user} />
      )}
    </Authenticator>
  );
}
