// src/features/plan/types.ts
import type { Schema } from "../../../amplify/data/resource";

export type ClassroomRecord = Schema["Classroom"]["type"];
export type PlanRecord = Schema["Plan"]["type"];
export type PlanEventRecord = Schema["PlanEvent"]["type"];
export type WeekAssignmentRecord = Schema["WeekPracticeAssignment"]["type"];
export type DayProgramItemRecord = Schema["DayProgramItem"]["type"];

export type PlanType = "YEAR" | "TERM" | "MONTH" | "WEEK" | "DAY";
export type DocTab = "draft" | "final";
export type ProgramType = "REGULAR" | "PLANNED";

export type PlanFormState = {
  title: string;
  periodStart: string;
  periodEnd: string;
  weekStartDate: string;
  targetDate: string;
  classAgeLabel: string;
  schoolPolicy: string;
  goalText: string;
  draftText: string;
  aiSuggestedText: string;
  finalText: string;
  status: string;
  abilityHealth: string;
  abilityHumanRelations: string;
  abilityEnvironment: string;
  abilityLanguage: string;
  abilityExpression: string;
};

export type EventDraft = {
  id?: string;
  label: string;
  eventMonth: string;
  eventDate: string;
  sortOrder: string;
};

export type WeekAssignmentDraft = {
  id?: string;
  targetDate: string;
  practiceCodeId: string;
  note: string;
  sortOrder: string;
};

export type DayProgramDraft = {
  id?: string;
  programType: ProgramType;
  title: string;
  startTime: string;
  endTime: string;
  practiceCodeId: string;
  note: string;
  sortOrder: string;
};

export const PLAN_LABELS: Record<PlanType, string> = {
  YEAR: "年計画",
  TERM: "期計画",
  MONTH: "月案",
  WEEK: "週案",
  DAY: "日案",
};

export const CHILD_PLAN_TYPE: Record<PlanType, PlanType | null> = {
  YEAR: "TERM",
  TERM: "MONTH",
  MONTH: "WEEK",
  WEEK: "DAY",
  DAY: null,
};

export function emptyPlanForm(): PlanFormState {
  return {
    title: "",
    periodStart: "",
    periodEnd: "",
    weekStartDate: "",
    targetDate: "",
    classAgeLabel: "",
    schoolPolicy: "",
    goalText: "",
    draftText: "",
    aiSuggestedText: "",
    finalText: "",
    status: "DRAFT",
    abilityHealth: "",
    abilityHumanRelations: "",
    abilityEnvironment: "",
    abilityLanguage: "",
    abilityExpression: "",
  };
}

export function toPlanForm(plan: PlanRecord | undefined | null): PlanFormState {
  if (!plan) return emptyPlanForm();

  return {
    title: plan.title ?? "",
    periodStart: plan.periodStart ?? "",
    periodEnd: plan.periodEnd ?? "",
    weekStartDate: plan.weekStartDate ?? "",
    targetDate: plan.targetDate ?? "",
    classAgeLabel: plan.classAgeLabel ?? "",
    schoolPolicy: plan.schoolPolicy ?? "",
    goalText: plan.goalText ?? "",
    draftText: plan.draftText ?? "",
    aiSuggestedText: plan.aiSuggestedText ?? "",
    finalText: plan.finalText ?? "",
    status: plan.status ?? "DRAFT",
    abilityHealth:
      plan.abilityHealth === null || plan.abilityHealth === undefined
        ? ""
        : String(plan.abilityHealth),
    abilityHumanRelations:
      plan.abilityHumanRelations === null ||
      plan.abilityHumanRelations === undefined
        ? ""
        : String(plan.abilityHumanRelations),
    abilityEnvironment:
      plan.abilityEnvironment === null || plan.abilityEnvironment === undefined
        ? ""
        : String(plan.abilityEnvironment),
    abilityLanguage:
      plan.abilityLanguage === null || plan.abilityLanguage === undefined
        ? ""
        : String(plan.abilityLanguage),
    abilityExpression:
      plan.abilityExpression === null || plan.abilityExpression === undefined
        ? ""
        : String(plan.abilityExpression),
  };
}

export function toIntOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function byTextDate(a?: string | null, b?: string | null) {
  return (a ?? "").localeCompare(b ?? "");
}

export function sortPlans(items: PlanRecord[]) {
  return [...items].sort((a, b) => {
    const t = byTextDate(a.periodStart, b.periodStart);
    if (t !== 0) return t;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}