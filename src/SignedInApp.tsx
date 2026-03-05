import { useState } from "react";

import TodosPanel from "./features/todos/TodosPanel";
import BoardPanel from "./features/boards/BoardPanel";
import PracticeSearchPanel from "./features/practice/PracticeSearchPanel";
import LinkSearchPanel from "./features/link/LinkSearchPanel";

import AudioUpload from "./features/audio/AudioUpload";
import AudioJobsPanel from "./features/audio/AudioJobsPanel";

// ✅ 追加
import DailyDigestPanel from "./features/digest/DailyDigestPanel";

type TabKey = "todos" | "board" | "practice" | "link" | "audio" | "digest";

export default function SignedInApp(props: { owner: string; signOut: () => void }) {
  const { owner, signOut } = props;
  const [tab, setTab] = useState<TabKey>("todos");

  // ✅ ひとまず固定（後でログインユーザーの所属園から決める）
  const tenantId = "demo-tenant";

  return (
    <div>
      <div style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div>
          Signed in as: {owner} / tenant: <code>{tenantId}</code>
        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: 12, flexWrap: "wrap" }}>
          <button onClick={() => setTab("todos")} disabled={tab === "todos"}>
            Todos
          </button>
          <button onClick={() => setTab("board")} disabled={tab === "board"}>
            Board
          </button>
          <button onClick={() => setTab("practice")} disabled={tab === "practice"}>
            Practice検索
          </button>
          <button onClick={() => setTab("link")} disabled={tab === "link"}>
            Link検索
          </button>

          <button onClick={() => setTab("audio")} disabled={tab === "audio"}>
            Audio（Upload/Jobs）
          </button>

          {/* ✅ 追加：Digest */}
          <button onClick={() => setTab("digest")} disabled={tab === "digest"}>
            Digest（日次）
          </button>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <button onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {tab === "todos" && <TodosPanel owner={owner} />}
        {tab === "board" && <BoardPanel owner={owner} />}
        {tab === "practice" && <PracticeSearchPanel />}
        {tab === "link" && <LinkSearchPanel />}

        {tab === "audio" && (
          <div style={{ display: "grid", gap: 16, maxWidth: 900 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>1) Upload</div>
              <AudioUpload tenantId={tenantId} owner={owner} />
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                2) Jobs（10秒ごと自動更新）
              </div>
              <AudioJobsPanel tenantId={tenantId} owner={owner} />
            </div>
          </div>
        )}

        {/* ✅ 追加：Digestタブ */}
        {tab === "digest" && (
          <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <DailyDigestPanel tenantId={tenantId} owner={owner} />
          </div>
        )}
      </div>
    </div>
  );
}
