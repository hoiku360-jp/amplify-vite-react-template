import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

// 既存の Todos コンポーネント等がある場合は、ここで import して下の中に戻してください。
// 例：import Todos from "./Todos";

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              Signed in as: {user?.signInDetails?.loginId ?? user?.username}
            </div>
            <button onClick={signOut}>Sign out</button>
          </div>

          <hr style={{ margin: "16px 0" }} />

          {/* ここに My todos 画面（既存UI）を戻す */}
          <div>My todos UI goes here</div>
        </div>
      )}
    </Authenticator>
  );
}
