"use client";

import { useEffect, useMemo, useState } from "react";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";
import type { AuthUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";

import outputs from "../amplify_outputs.json";
import type { Schema } from "../amplify/data/resource";

import SignedInApp, { type CurrentUserContext } from "./SignedInApp";
import ParentReplyForm from "./features/parent-reply/ParentReplyForm";

Amplify.configure(outputs);

type Classroom = Schema["Classroom"]["type"];
type StaffAssignment = Schema["StaffAssignment"]["type"];
type UserProfile = Schema["UserProfile"]["type"];

const FALLBACK_TENANT_ID = "demo-tenant";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function hasParentReplyToken(params: URLSearchParams): boolean {
  return (
    params.has("token") ||
    params.has("replyToken") ||
    params.has("parentReplyToken")
  );
}

function isParentReplyRoute(): boolean {
  if (typeof window === "undefined") return false;

  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // 通常形:
  // /parent-reply?token=...
  if (path === "/parent-reply" || path.endsWith("/parent-reply")) {
    return true;
  }

  // Amplify Hosting / メールアプリ / ブラウザによって path が落ちても、
  // ?token=... が残っていれば保護者返信画面として扱う。
  if (hasParentReplyToken(searchParams)) {
    return true;
  }

  // 念のため hash routing 風になった場合にも対応。
  // 例: /#/parent-reply?token=...
  const hash = window.location.hash || "";
  if (hash.includes("parent-reply")) {
    return true;
  }

  const hashQueryIndex = hash.indexOf("?");
  if (hashQueryIndex >= 0) {
    const hashParams = new URLSearchParams(hash.slice(hashQueryIndex + 1));
    if (hasParentReplyToken(hashParams)) {
      return true;
    }
  }

  return false;
}

function resolveFiscalYear(date = new Date()): number {
  // 日本の保育年度: 4月開始
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

function isActiveAssignment(
  assignment: StaffAssignment,
  fiscalYear: number,
): boolean {
  if (assignment.status !== "ACTIVE") return false;
  if (assignment.fiscalYear !== fiscalYear) return false;

  const today = new Date().toISOString().slice(0, 10);
  if (assignment.startDate && assignment.startDate > today) return false;
  if (assignment.endDate && assignment.endDate < today) return false;

  return true;
}

function isSchoolScopeAssignment(assignment: StaffAssignment): boolean {
  const scopeType = String(assignment.scopeType ?? "").toUpperCase();
  const role = String(assignment.role ?? "").toUpperCase();

  return (
    scopeType === "SCHOOL" ||
    role === "DIRECTOR" ||
    role === "CHIEF" ||
    role === "TENANT_ADMIN"
  );
}

function sortClassrooms(classrooms: Classroom[]): Classroom[] {
  return [...classrooms].sort((left, right) => {
    const leftKey = `${left.ageBand ?? ""}_${left.name ?? ""}`;
    const rightKey = `${right.ageBand ?? ""}_${right.name ?? ""}`;
    return leftKey.localeCompare(rightKey, "ja");
  });
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => value ?? "").filter((value) => value)),
  );
}

function resolveContext(args: {
  sub: string | null;
  profile: UserProfile | null;
  assignments: StaffAssignment[];
  classrooms: Classroom[];
  selectedClassroomId: string | null;
}): CurrentUserContext {
  const { sub, profile, assignments, classrooms, selectedClassroomId } = args;
  const fiscalYear = resolveFiscalYear();
  const activeAssignments = assignments.filter((assignment) =>
    isActiveAssignment(assignment, fiscalYear),
  );

  const primaryAssignment =
    activeAssignments.find((assignment) => assignment.isPrimary) ??
    activeAssignments[0] ??
    null;

  const tenantId =
    primaryAssignment?.tenantId || profile?.tenantId || FALLBACK_TENANT_ID;

  const hasAssignment = activeAssignments.length > 0;
  const isSchoolScope = hasAssignment
    ? activeAssignments.some(isSchoolScopeAssignment)
    : true;

  const classroomIdsFromAssignments = uniqueStrings(
    activeAssignments.map((assignment) => assignment.classroomId),
  );

  const allClassroomIds = classrooms.map((classroom) => classroom.id);
  const allowedClassroomIds = isSchoolScope
    ? allClassroomIds
    : classroomIdsFromAssignments;

  const selectedIsAllowed = selectedClassroomId
    ? allowedClassroomIds.includes(selectedClassroomId)
    : false;

  const currentClassroomId = selectedIsAllowed
    ? selectedClassroomId
    : (allowedClassroomIds[0] ?? null);

  return {
    userId: sub,
    tenantId,
    profileFullName: profile?.fullName ?? null,
    role: primaryAssignment?.role ?? profile?.role ?? "UNASSIGNED",
    fiscalYear,
    isSchoolScope,
    allowedClassroomIds,
    currentClassroomId,
    assignmentCount: activeAssignments.length,
    source: hasAssignment ? "assignment" : profile ? "profile" : "fallback",
  };
}

function AuthenticatedShell(props: { signOut?: () => void; user?: AuthUser }) {
  const { signOut, user } = props;

  const client = useMemo(() => generateClient<Schema>(), []);

  const [sub, setSub] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);

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
      } catch (e: unknown) {
        if (!cancelled) {
          setProfileError(errorMessage(e));
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
      } catch (e: unknown) {
        if (!cancelled) {
          setProfileError(errorMessage(e));
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

  useEffect(() => {
    if (!sub && !profile?.tenantId) return;

    let cancelled = false;

    (async () => {
      try {
        setContextLoading(true);
        setContextError(null);

        const assignmentRes = sub
          ? await client.models.StaffAssignment.list({
              filter: { userId: { eq: sub } },
              limit: 1000,
            })
          : { data: [], errors: null };

        if (assignmentRes.errors?.length) {
          throw new Error(
            assignmentRes.errors.map((e) => e.message).join("\n"),
          );
        }

        const assignmentItems = assignmentRes.data ?? [];
        const fiscalYear = resolveFiscalYear();
        const activeAssignments = assignmentItems.filter((assignment) =>
          isActiveAssignment(assignment, fiscalYear),
        );

        const tenantId =
          activeAssignments[0]?.tenantId ||
          profile?.tenantId ||
          FALLBACK_TENANT_ID;

        const classroomRes = await client.models.Classroom.list({
          filter: { tenantId: { eq: tenantId } },
          limit: 1000,
        });

        if (classroomRes.errors?.length) {
          throw new Error(classroomRes.errors.map((e) => e.message).join("\n"));
        }

        const classroomItems = sortClassrooms(
          (classroomRes.data ?? []).filter(
            (classroom) => classroom.status !== "ARCHIVED",
          ),
        );

        if (!cancelled) {
          setAssignments(assignmentItems);
          setClassrooms(classroomItems);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setContextError(errorMessage(e));
          setAssignments([]);
          setClassrooms([]);
        }
      } finally {
        if (!cancelled) {
          setContextLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, profile?.tenantId, sub]);

  const userContext = resolveContext({
    sub,
    profile,
    assignments,
    classrooms,
    selectedClassroomId,
  });

  const visibleClassrooms = userContext.isSchoolScope
    ? classrooms
    : classrooms.filter((classroom) =>
        userContext.allowedClassroomIds.includes(classroom.id),
      );

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
          <b>signedInAs:</b>{" "}
          {user?.signInDetails?.loginId ?? user?.username ?? "(unknown)"}
        </div>
        <div>
          <b>tenant:</b> {userContext.tenantId}
        </div>
        <div>
          <b>role:</b> {userContext.role}
        </div>
        <div>
          <b>fullName:</b> {profile?.fullName ?? "(未設定)"}
        </div>
        {profileLoading && <div>profile loading...</div>}
        {contextLoading && <div>context loading...</div>}
        {profileError && (
          <div style={{ color: "crimson" }}>
            <b>profile error:</b> {profileError}
          </div>
        )}
        {contextError && (
          <div style={{ color: "crimson" }}>
            <b>context error:</b> {contextError}
          </div>
        )}
        {!profileLoading && !profile && !profileError && (
          <div style={{ color: "#8a6d3b" }}>UserProfile が未登録です</div>
        )}
        {!contextLoading && userContext.source !== "assignment" && (
          <div style={{ color: "#8a6d3b" }}>
            StaffAssignment 未設定のため暫定コンテキストで表示しています
          </div>
        )}
      </div>

      <SignedInApp
        owner={owner}
        signOut={safeSignOut}
        userContext={userContext}
        classrooms={visibleClassrooms}
        onSelectClassroomId={(classroomId) =>
          setSelectedClassroomId(classroomId || null)
        }
      />
    </div>
  );
}

export default function App() {
  if (isParentReplyRoute()) {
    return <ParentReplyForm />;
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AuthenticatedShell signOut={signOut} user={user} />
      )}
    </Authenticator>
  );
}
