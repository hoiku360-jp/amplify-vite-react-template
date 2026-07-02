import { useState } from "react";

import PracticeSearchPanelLookup from "./features/practice/PracticeSearchPanelLookup";
import PracticeRegisterPanel from "./features/practice-register/PracticeRegisterPanel";
import LinkSearchPanel from "./features/link/LinkSearchPanel";
import AudioUpload from "./features/audio/AudioUpload";
import AudioJobsPanel from "./features/audio/AudioJobsPanel";
import PlanV2WorkspacePanel from "./features/plan-v2/PlanV2WorkspacePanel";
import ScheduleDayPanel from "./features/schedule/ScheduleDayPanel";
import SimpleScheduleWorkspacePanel from "./features/schedule/SimpleScheduleWorkspacePanel";
import ParentNoticePanel from "./features/parent-notice/ParentNoticePanel";
import EnvironmentImpactPanel from "./features/check/EnvironmentImpactPanel";
import AbilityDashboardPanel from "./features/check/AbilityDashboardPanel";
import ClassWeeklyReportPanel from "./features/check/ClassWeeklyReportPanel";
import ChildWeekendLetterPanel from "./features/check/ChildWeekendLetterPanel";
import AttendancePanel from "./features/attendance/AttendancePanel";
import type { Schema } from "../amplify/data/resource";

type TabKey =
  | "planV2Workspace"
  | "schedulePlan"
  | "scheduleDay"
  | "parentNotice"
  | "attendance"
  | "environmentImpact"
  | "abilityDashboard"
  | "classWeeklyReport"
  | "childWeekendLetter"
  | "practice"
  | "practiceRegister"
  | "link"
  | "audio";

type Classroom = Schema["Classroom"]["type"];

export type CurrentUserContext = {
  userId: string | null;
  tenantId: string;
  profileFullName: string | null;
  role: string;
  fiscalYear: number;
  isSchoolScope: boolean;
  allowedClassroomIds: string[];
  currentClassroomId: string | null;
  assignmentCount: number;
  source: "assignment" | "profile" | "fallback";
};

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => s(value)).filter(Boolean)));
}

function displayClassroomName(classroom: Classroom): string {
  const ageBand = classroom.ageBand ? `${classroom.ageBand} ` : "";
  return `${ageBand}${classroom.name}`;
}

function classroomBelongsToTenant(
  classroom: Classroom,
  tenantId: string,
): boolean {
  const rowTenantId = s((classroom as { tenantId?: string | null }).tenantId);
  return !!rowTenantId && rowTenantId === tenantId;
}

function sanitizeUserContextForTenant(args: {
  userContext: CurrentUserContext;
  classrooms: Classroom[];
  tenantId: string;
}): { safeUserContext: CurrentUserContext; visibleClassrooms: Classroom[] } {
  const { userContext, classrooms, tenantId } = args;

  const tenantClassrooms = classrooms.filter(
    (classroom) =>
      classroomBelongsToTenant(classroom, tenantId) &&
      s((classroom as { status?: string | null }).status).toUpperCase() !==
        "ARCHIVED",
  );
  const tenantClassroomIds = tenantClassrooms.map((classroom) => classroom.id);
  const tenantClassroomIdSet = new Set(tenantClassroomIds);

  const requestedAllowedClassroomIds = userContext.isSchoolScope
    ? tenantClassroomIds
    : userContext.allowedClassroomIds.filter((classroomId) =>
        tenantClassroomIdSet.has(classroomId),
      );

  const safeAllowedClassroomIds = uniqueStrings(requestedAllowedClassroomIds);
  const requestedCurrentClassroomId = s(userContext.currentClassroomId);
  const safeCurrentClassroomId = safeAllowedClassroomIds.includes(
    requestedCurrentClassroomId,
  )
    ? requestedCurrentClassroomId
    : (safeAllowedClassroomIds[0] ?? null);

  const visibleClassrooms = tenantClassrooms.filter((classroom) =>
    safeAllowedClassroomIds.includes(classroom.id),
  );

  return {
    visibleClassrooms,
    safeUserContext: {
      ...userContext,
      tenantId,
      allowedClassroomIds: safeAllowedClassroomIds,
      currentClassroomId: safeCurrentClassroomId,
    },
  };
}

export default function SignedInApp(props: {
  owner: string;
  signOut: () => void;
  userContext: CurrentUserContext;
  classrooms: Classroom[];
  onSelectClassroomId: (classroomId: string) => void;
}) {
  const { owner, signOut, userContext, classrooms, onSelectClassroomId } =
    props;

  // デモでは旧PLANではなく、現在の本線である PLAN v2 を初期表示にする
  const [tab, setTab] = useState<TabKey>("planV2Workspace");

  const tenantId = userContext.tenantId || "demo-tenant";
  const { safeUserContext, visibleClassrooms } = sanitizeUserContextForTenant({
    userContext,
    classrooms,
    tenantId,
  });
  const currentClassroom = visibleClassrooms.find(
    (classroom) => classroom.id === safeUserContext.currentClassroomId,
  );

  const showClassroomSelector =
    safeUserContext.isSchoolScope ||
    safeUserContext.allowedClassroomIds.length > 1;

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
          display: "grid",
          gap: 8,
          marginBottom: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fffef8",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <b>利用者:</b> {safeUserContext.profileFullName ?? owner}
          </div>
          <div>
            <b>tenant:</b> {tenantId}
          </div>
          <div>
            <b>年度:</b> {safeUserContext.fiscalYear}
          </div>
          <div>
            <b>role:</b> {safeUserContext.role || "(未設定)"}
          </div>
          <div>
            <b>scope:</b> {safeUserContext.isSchoolScope ? "園全体" : "クラス"}
          </div>
          <div>
            <b>所属元:</b> {safeUserContext.source}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <label>
            表示クラス:{" "}
            <select
              value={safeUserContext.currentClassroomId ?? ""}
              onChange={(event) => onSelectClassroomId(event.target.value)}
              disabled={
                !showClassroomSelector || visibleClassrooms.length === 0
              }
            >
              <option value="">(未選択)</option>
              {visibleClassrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {displayClassroomName(classroom)}
                </option>
              ))}
            </select>
          </label>

          <div>
            <b>現在:</b>{" "}
            {currentClassroom
              ? displayClassroomName(currentClassroom)
              : "未選択"}
          </div>

          <div>
            <b>所属件数:</b> {safeUserContext.assignmentCount}
          </div>
          <div>
            <b>表示可能クラス:</b> {visibleClassrooms.length}
          </div>
        </div>

        {visibleClassrooms.length === 0 && (
          <div style={{ color: "#8a6d3b", fontSize: 13 }}>
            このユーザーの tenantId={tenantId}{" "}
            に紐づく表示可能クラスがありません。 Classroom.csv と
            StaffAssignment.csv の tenantId / classroomId を確認してください。
          </div>
        )}
      </div>

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
        <button onClick={() => setTab("parentNotice")}>保護者連絡</button>
        <button onClick={() => setTab("attendance")}>登園・降園</button>
        <button onClick={() => setTab("environmentImpact")}>
          環境インパクト
        </button>
        <button onClick={() => setTab("abilityDashboard")}>
          5領域ダッシュボード
        </button>
        <button onClick={() => setTab("classWeeklyReport")}>クラス週報</button>
        <button onClick={() => setTab("childWeekendLetter")}>
          子ども週末だより
        </button>
        <button onClick={() => setTab("practice")}>
          Practice検索 / 一覧（Lookup版）
        </button>
        <button onClick={() => setTab("practiceRegister")}>Practice登録</button>
        <button onClick={() => setTab("link")}>Link（開発者）</button>
        <button onClick={() => setTab("audio")}>Audio</button>

        <div style={{ marginLeft: "auto" }}>
          <button onClick={signOut}>Sign out</button>
        </div>
      </div>

      {tab === "planV2Workspace" && (
        <PlanV2WorkspacePanel
          owner={owner}
          tenantId={tenantId}
          currentClassroomId={safeUserContext.currentClassroomId}
          allowedClassroomIds={safeUserContext.allowedClassroomIds}
          isSchoolScope={safeUserContext.isSchoolScope}
        />
      )}

      {tab === "schedulePlan" && (
        <SimpleScheduleWorkspacePanel
          owner={owner}
          tenantId={tenantId}
          currentClassroomId={safeUserContext.currentClassroomId}
          allowedClassroomIds={safeUserContext.allowedClassroomIds}
          isSchoolScope={safeUserContext.isSchoolScope}
        />
      )}

      {tab === "scheduleDay" && (
        <ScheduleDayPanel
          owner={owner}
          tenantId={tenantId}
          currentClassroomId={safeUserContext.currentClassroomId}
          allowedClassroomIds={safeUserContext.allowedClassroomIds}
          isSchoolScope={safeUserContext.isSchoolScope}
        />
      )}

      {tab === "parentNotice" && (
        <ParentNoticePanel
          owner={owner}
          tenantId={tenantId}
          currentClassroomId={safeUserContext.currentClassroomId}
          allowedClassroomIds={safeUserContext.allowedClassroomIds}
          isSchoolScope={safeUserContext.isSchoolScope}
        />
      )}

      {tab === "attendance" && (
        <AttendancePanel
          owner={owner}
          tenantId={tenantId}
          currentClassroomId={safeUserContext.currentClassroomId}
          allowedClassroomIds={safeUserContext.allowedClassroomIds}
          isSchoolScope={safeUserContext.isSchoolScope}
        />
      )}

      {tab === "environmentImpact" && (
        <EnvironmentImpactPanel owner={owner} tenantId={tenantId} />
      )}

      {tab === "abilityDashboard" && (
        <AbilityDashboardPanel owner={owner} tenantId={tenantId} />
      )}

      {tab === "classWeeklyReport" && (
        <ClassWeeklyReportPanel
          owner={owner}
          tenantId={tenantId}
          currentClassroomId={safeUserContext.currentClassroomId}
          allowedClassroomIds={safeUserContext.allowedClassroomIds}
          isSchoolScope={safeUserContext.isSchoolScope}
        />
      )}

      {tab === "childWeekendLetter" && (
        <ChildWeekendLetterPanel
          owner={owner}
          tenantId={tenantId}
          currentClassroomId={safeUserContext.currentClassroomId}
          allowedClassroomIds={safeUserContext.allowedClassroomIds}
          isSchoolScope={safeUserContext.isSchoolScope}
        />
      )}

      {tab === "practice" && (
        <PracticeSearchPanelLookup
          owner={owner}
          tenantId={tenantId}
          currentClassroomId={safeUserContext.currentClassroomId}
          allowedClassroomIds={safeUserContext.allowedClassroomIds}
          isSchoolScope={safeUserContext.isSchoolScope}
        />
      )}
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
