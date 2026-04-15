import { useState } from "react";

import TodosPanel from "./features/todos/TodosPanel";
import BoardPanel from "./features/boards/BoardPanel";
import PracticeSearchPanel from "./features/practice/PracticeSearchPanel";
import PracticeRegisterPanel from "./features/practice-register/PracticeRegisterPanel";
import LinkSearchPanel from "./features/link/LinkSearchPanel";
import AudioUpload from "./features/audio/AudioUpload";
import AudioJobsPanel from "./features/audio/AudioJobsPanel";
import DailyDigestPanel from "./features/digest/DailyDigestPanel";
import PlanWorkspacePanel from "./features/plan/PlanWorkspacePanel";
import PlanV2DebugPanel from "./features/plan-v2/PlanV2DebugPanel";
import PlanV2WorkspacePanel from "./features/plan-v2/PlanV2WorkspacePanel";
import ScheduleDayPanel from "./features/schedule/ScheduleDayPanel";
import SimpleScheduleWorkspacePanel from "./features/schedule/SimpleScheduleWorkspacePanel";
import AbilityDashboardPanel from "./features/check/AbilityDashboardPanel";
import ClassWeeklyReportPanel from "./features/check/ClassWeeklyReportPanel";
import ChildWeekendLetterPanel from "./features/check/ChildWeekendLetterPanel";

type TabKey =
  | "plan"
  | "planV2"
  | "planV2Workspace"
  | "schedulePlan"
  | "scheduleDay"
  | "abilityDashboard"
  | "classWeeklyReport"
  | "childWeekendLetter"
  | "todos"
  | "board"
  | "practice"
  | "practiceRegister"
  | "link"
  | "audio"
  | "digest";

export default function SignedInApp(props: {
  owner: string;
  signOut: () => void;
}) {
  const { owner, signOut } = props;
  const [tab, setTab] = useState<TabKey>("plan");

  // ひとまず固定。後でログインユーザー所属園・tenant選択に置き換える
  const tenantId = "demo-tenant";

  return (
    <div
      style={{
        padding: 16,
        minHeight: "100vh",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <button onClick={() => setTab("plan")}>PLAN</button>
        <button onClick={() => setTab("planV2")}>PLAN v2確認</button>
        <button onClick={() => setTab("planV2Workspace")}>PLAN v2</button>
        <button onClick={() => setTab("schedulePlan")}>月案＞週案</button>
        <button onClick={() => setTab("scheduleDay")}>日案</button>
        <button onClick={() => setTab("abilityDashboard")}>
          5領域ダッシュボード
        </button>
        <button onClick={() => setTab("classWeeklyReport")}>クラス週報</button>
        <button onClick={() => setTab("childWeekendLetter")}>
          子ども週末だより
        </button>
        <button onClick={() => setTab("todos")}>Todos</button>
        <button onClick={() => setTab("board")}>Board</button>
        <button onClick={() => setTab("practice")}>Practice</button>
        <button onClick={() => setTab("practiceRegister")}>Practice登録</button>
        <button onClick={() => setTab("link")}>Link</button>
        <button onClick={() => setTab("audio")}>Audio</button>
        <button onClick={() => setTab("digest")}>Digest</button>

        <div style={{ marginLeft: "auto" }}>
          <button onClick={signOut}>Sign out</button>
        </div>
      </div>

      {tab === "plan" && <PlanWorkspacePanel owner={owner} />}
      {tab === "planV2" && <PlanV2DebugPanel />}
      {tab === "planV2Workspace" && <PlanV2WorkspacePanel owner={owner} />}

      {tab === "schedulePlan" && <SimpleScheduleWorkspacePanel owner={owner} />}

      {tab === "scheduleDay" && <ScheduleDayPanel owner={owner} />}

      {tab === "abilityDashboard" && (
        <AbilityDashboardPanel owner={owner} tenantId={tenantId} />
      )}

      {tab === "classWeeklyReport" && (
        <ClassWeeklyReportPanel owner={owner} tenantId={tenantId} />
      )}

      {tab === "childWeekendLetter" && (
        <ChildWeekendLetterPanel owner={owner} tenantId={tenantId} />
      )}

      {tab === "todos" && <TodosPanel owner={owner} />}
      {tab === "board" && <BoardPanel owner={owner} />}
      {tab === "practice" && <PracticeSearchPanel owner={owner} />}
      {tab === "practiceRegister" && <PracticeRegisterPanel owner={owner} />}
      {tab === "link" && <LinkSearchPanel />}

      {tab === "audio" && (
        <div style={{ display: "grid", gap: 16 }}>
          <AudioUpload owner={owner} tenantId={tenantId} />
          <AudioJobsPanel owner={owner} tenantId={tenantId} />
        </div>
      )}

      {tab === "digest" && (
        <DailyDigestPanel owner={owner} tenantId={tenantId} />
      )}
    </div>
  );
}
