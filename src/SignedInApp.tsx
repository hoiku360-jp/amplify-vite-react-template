import { useState } from "react";

import PracticeSearchPanel from "./features/practice/PracticeSearchPanel";
import PracticeRegisterPanel from "./features/practice-register/PracticeRegisterPanel";
import LinkSearchPanel from "./features/link/LinkSearchPanel";
import AudioUpload from "./features/audio/AudioUpload";
import AudioJobsPanel from "./features/audio/AudioJobsPanel";
import PlanV2WorkspacePanel from "./features/plan-v2/PlanV2WorkspacePanel";
import ScheduleDayPanel from "./features/schedule/ScheduleDayPanel";
import SimpleScheduleWorkspacePanel from "./features/schedule/SimpleScheduleWorkspacePanel";
import AbilityDashboardPanel from "./features/check/AbilityDashboardPanel";
import ClassWeeklyReportPanel from "./features/check/ClassWeeklyReportPanel";
import ChildWeekendLetterPanel from "./features/check/ChildWeekendLetterPanel";

type TabKey =
  | "planV2Workspace"
  | "schedulePlan"
  | "scheduleDay"
  | "abilityDashboard"
  | "classWeeklyReport"
  | "childWeekendLetter"
  | "practice"
  | "practiceRegister"
  | "link"
  | "audio";

export default function SignedInApp(props: {
  owner: string;
  signOut: () => void;
}) {
  const { owner, signOut } = props;

  // デモでは旧PLANではなく、現在の本線である PLAN v2 を初期表示にする
  const [tab, setTab] = useState<TabKey>("planV2Workspace");

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
        <button onClick={() => setTab("practice")}>Practice</button>
        <button onClick={() => setTab("practiceRegister")}>Practice登録</button>
        <button onClick={() => setTab("link")}>Link</button>
        <button onClick={() => setTab("audio")}>Audio</button>

        <div style={{ marginLeft: "auto" }}>
          <button onClick={signOut}>Sign out</button>
        </div>
      </div>

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

      {tab === "practice" && <PracticeSearchPanel owner={owner} />}
      {tab === "practiceRegister" && <PracticeRegisterPanel owner={owner} />}
      {tab === "link" && <LinkSearchPanel />}

      {tab === "audio" && (
        <div style={{ display: "grid", gap: 16 }}>
          <AudioUpload owner={owner} tenantId={tenantId} />
          <AudioJobsPanel owner={owner} tenantId={tenantId} />
        </div>
      )}
    </div>
  );
}
