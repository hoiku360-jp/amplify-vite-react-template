// src/features/plan-v2/types.ts
import type { Schema } from "../../../amplify/data/resource";

export type TenantRecord = Schema["Tenant"]["type"];
export type ClassroomRecord = Schema["Classroom"]["type"];
export type SchoolAnnualPlanRecord = Schema["SchoolAnnualPlan"]["type"];
export type SchoolAnnualAgeTargetRecord = Schema["SchoolAnnualAgeTarget"]["type"];
export type ClassAnnualPlanRecord = Schema["ClassAnnualPlan"]["type"];
export type ClassQuarterPlanRecord = Schema["ClassQuarterPlan"]["type"];
export type QuarterEventRecord = Schema["QuarterEvent"]["type"];
export type ClassMonthPlanRecord = Schema["ClassMonthPlan"]["type"];
export type MonthEventRecord = Schema["MonthEvent"]["type"];

export type TreeNode =
  | { kind: "tenant"; tenantId: string }
  | { kind: "schoolAnnualPlan"; id: string }
  | { kind: "ageTarget"; id: string }
  | { kind: "classroom"; id: string }
  | { kind: "classAnnualPlan"; id: string }
  | { kind: "quarter"; id: string }
  | { kind: "month"; id: string };

export type SchoolAnnualPlanForm = {
  title: string;
  periodStart: string;
  periodEnd: string;
  schoolPolicy: string;
  status: string;
};

export type AbilityForm = {
  ageBand: string;
  goalText: string;
  abilityHealth: string;
  abilityHumanRelations: string;
  abilityEnvironment: string;
  abilityLanguage: string;
  abilityExpression: string;
  draftText: string;
  aiSuggestedText: string;
  finalText: string;
  status: string;
};

export type ClassroomForm = {
  name: string;
  ageBand: string;
  schoolName: string;
  status: string;
};

export type ClassAnnualPlanForm = {
  title: string;
  periodStart: string;
  periodEnd: string;
  ageBand: string;
  goalText: string;
  abilityHealth: string;
  abilityHumanRelations: string;
  abilityEnvironment: string;
  abilityLanguage: string;
  abilityExpression: string;
  draftText: string;
  aiSuggestedText: string;
  finalText: string;
  status: string;
};

export type QuarterPlanForm = {
  title: string;
  periodStart: string;
  periodEnd: string;
  ageBand: string;
  goalText: string;
  abilityHealth: string;
  abilityHumanRelations: string;
  abilityEnvironment: string;
  abilityLanguage: string;
  abilityExpression: string;
  draftText: string;
  aiSuggestedText: string;
  finalText: string;
  status: string;
  eventSummary: string;
};

export type MonthPlanForm = {
  title: string;
  periodStart: string;
  periodEnd: string;
  ageBand: string;
  goalText: string;
  abilityHealth: string;
  abilityHumanRelations: string;
  abilityEnvironment: string;
  abilityLanguage: string;
  abilityExpression: string;
  draftText: string;
  aiSuggestedText: string;
  finalText: string;
  status: string;
  eventSummary: string;
};

export function s(v: unknown): string {
  return String(v ?? "").trim();
}

export function byText(a?: string | null, b?: string | null) {
  return (a ?? "").localeCompare(b ?? "");
}

export function toIntOrNull(v: string): number | null {
  const t = s(v);
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function nodeKey(node: TreeNode | null | undefined): string {
  if (!node) return "";
  return `${node.kind}:${"tenantId" in node ? node.tenantId : node.id}`;
}

export function emptySchoolAnnualPlanForm(): SchoolAnnualPlanForm {
  return {
    title: "",
    periodStart: "",
    periodEnd: "",
    schoolPolicy: "",
    status: "DRAFT",
  };
}

export function toSchoolAnnualPlanForm(
  row?: SchoolAnnualPlanRecord | null
): SchoolAnnualPlanForm {
  if (!row) return emptySchoolAnnualPlanForm();
  return {
    title: row.title ?? "",
    periodStart: row.periodStart ?? "",
    periodEnd: row.periodEnd ?? "",
    schoolPolicy: row.schoolPolicy ?? "",
    status: row.status ?? "DRAFT",
  };
}

export function emptyAbilityForm(ageBand = ""): AbilityForm {
  return {
    ageBand,
    goalText: "",
    abilityHealth: "",
    abilityHumanRelations: "",
    abilityEnvironment: "",
    abilityLanguage: "",
    abilityExpression: "",
    draftText: "",
    aiSuggestedText: "",
    finalText: "",
    status: "DRAFT",
  };
}

export function toAbilityFormA(
  row?: SchoolAnnualAgeTargetRecord | null
): AbilityForm {
  if (!row) return emptyAbilityForm();
  return {
    ageBand: row.ageBand ?? "",
    goalText: row.goalTextA ?? "",
    abilityHealth:
      row.abilityHealthA === null || row.abilityHealthA === undefined
        ? ""
        : String(row.abilityHealthA),
    abilityHumanRelations:
      row.abilityHumanRelationsA === null ||
      row.abilityHumanRelationsA === undefined
        ? ""
        : String(row.abilityHumanRelationsA),
    abilityEnvironment:
      row.abilityEnvironmentA === null || row.abilityEnvironmentA === undefined
        ? ""
        : String(row.abilityEnvironmentA),
    abilityLanguage:
      row.abilityLanguageA === null || row.abilityLanguageA === undefined
        ? ""
        : String(row.abilityLanguageA),
    abilityExpression:
      row.abilityExpressionA === null || row.abilityExpressionA === undefined
        ? ""
        : String(row.abilityExpressionA),
    draftText: row.draftText ?? "",
    aiSuggestedText: row.aiSuggestedText ?? "",
    finalText: row.finalText ?? "",
    status: row.status ?? "DRAFT",
  };
}

export function emptyClassroomForm(): ClassroomForm {
  return {
    name: "",
    ageBand: "",
    schoolName: "",
    status: "active",
  };
}

export function toClassroomForm(row?: ClassroomRecord | null): ClassroomForm {
  if (!row) return emptyClassroomForm();
  return {
    name: row.name ?? "",
    ageBand: row.ageBand ?? "",
    schoolName: row.schoolName ?? "",
    status: row.status ?? "active",
  };
}

export function emptyClassAnnualPlanForm(): ClassAnnualPlanForm {
  return {
    title: "",
    periodStart: "",
    periodEnd: "",
    ageBand: "",
    goalText: "",
    abilityHealth: "",
    abilityHumanRelations: "",
    abilityEnvironment: "",
    abilityLanguage: "",
    abilityExpression: "",
    draftText: "",
    aiSuggestedText: "",
    finalText: "",
    status: "DRAFT",
  };
}

export function toClassAnnualPlanForm(
  row?: ClassAnnualPlanRecord | null
): ClassAnnualPlanForm {
  if (!row) return emptyClassAnnualPlanForm();
  return {
    title: row.title ?? "",
    periodStart: row.periodStart ?? "",
    periodEnd: row.periodEnd ?? "",
    ageBand: row.ageBand ?? "",
    goalText: row.goalTextA ?? "",
    abilityHealth:
      row.abilityHealthA === null || row.abilityHealthA === undefined
        ? ""
        : String(row.abilityHealthA),
    abilityHumanRelations:
      row.abilityHumanRelationsA === null ||
      row.abilityHumanRelationsA === undefined
        ? ""
        : String(row.abilityHumanRelationsA),
    abilityEnvironment:
      row.abilityEnvironmentA === null || row.abilityEnvironmentA === undefined
        ? ""
        : String(row.abilityEnvironmentA),
    abilityLanguage:
      row.abilityLanguageA === null || row.abilityLanguageA === undefined
        ? ""
        : String(row.abilityLanguageA),
    abilityExpression:
      row.abilityExpressionA === null || row.abilityExpressionA === undefined
        ? ""
        : String(row.abilityExpressionA),
    draftText: row.draftText ?? "",
    aiSuggestedText: row.aiSuggestedText ?? "",
    finalText: row.finalText ?? "",
    status: row.status ?? "DRAFT",
  };
}

export function emptyQuarterPlanForm(): QuarterPlanForm {
  return {
    title: "",
    periodStart: "",
    periodEnd: "",
    ageBand: "",
    goalText: "",
    abilityHealth: "",
    abilityHumanRelations: "",
    abilityEnvironment: "",
    abilityLanguage: "",
    abilityExpression: "",
    draftText: "",
    aiSuggestedText: "",
    finalText: "",
    status: "DRAFT",
    eventSummary: "",
  };
}

export function toQuarterPlanForm(
  row?: ClassQuarterPlanRecord | null,
  quarterEvents?: QuarterEventRecord[]
): QuarterPlanForm {
  if (!row) return emptyQuarterPlanForm();

  const eventSummary = (quarterEvents ?? [])
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((x) => x.label ?? "")
    .filter((x) => x.trim() !== "")
    .join("\n");

  return {
    title: row.title ?? "",
    periodStart: row.periodStart ?? "",
    periodEnd: row.periodEnd ?? "",
    ageBand: row.ageBand ?? "",
    goalText: row.goalTextB ?? "",
    abilityHealth:
      row.abilityHealthB === null || row.abilityHealthB === undefined
        ? ""
        : String(row.abilityHealthB),
    abilityHumanRelations:
      row.abilityHumanRelationsB === null ||
      row.abilityHumanRelationsB === undefined
        ? ""
        : String(row.abilityHumanRelationsB),
    abilityEnvironment:
      row.abilityEnvironmentB === null || row.abilityEnvironmentB === undefined
        ? ""
        : String(row.abilityEnvironmentB),
    abilityLanguage:
      row.abilityLanguageB === null || row.abilityLanguageB === undefined
        ? ""
        : String(row.abilityLanguageB),
    abilityExpression:
      row.abilityExpressionB === null || row.abilityExpressionB === undefined
        ? ""
        : String(row.abilityExpressionB),
    draftText: row.draftText ?? "",
    aiSuggestedText: row.aiSuggestedText ?? "",
    finalText: row.finalText ?? "",
    status: row.status ?? "DRAFT",
    eventSummary,
  };
}

export function emptyMonthPlanForm(): MonthPlanForm {
  return {
    title: "",
    periodStart: "",
    periodEnd: "",
    ageBand: "",
    goalText: "",
    abilityHealth: "",
    abilityHumanRelations: "",
    abilityEnvironment: "",
    abilityLanguage: "",
    abilityExpression: "",
    draftText: "",
    aiSuggestedText: "",
    finalText: "",
    status: "DRAFT",
    eventSummary: "",
  };
}

export function toMonthPlanForm(
  row?: ClassMonthPlanRecord | null,
  monthEvents?: MonthEventRecord[]
): MonthPlanForm {
  if (!row) return emptyMonthPlanForm();

  const eventSummary = (monthEvents ?? [])
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((x) => x.label ?? "")
    .filter((x) => x.trim() !== "")
    .join("\n");

  return {
    title: row.title ?? "",
    periodStart: row.periodStart ?? "",
    periodEnd: row.periodEnd ?? "",
    ageBand: row.ageBand ?? "",
    goalText: row.goalTextC ?? "",
    abilityHealth:
      row.abilityHealthC === null || row.abilityHealthC === undefined
        ? ""
        : String(row.abilityHealthC),
    abilityHumanRelations:
      row.abilityHumanRelationsC === null ||
      row.abilityHumanRelationsC === undefined
        ? ""
        : String(row.abilityHumanRelationsC),
    abilityEnvironment:
      row.abilityEnvironmentC === null || row.abilityEnvironmentC === undefined
        ? ""
        : String(row.abilityEnvironmentC),
    abilityLanguage:
      row.abilityLanguageC === null || row.abilityLanguageC === undefined
        ? ""
        : String(row.abilityLanguageC),
    abilityExpression:
      row.abilityExpressionC === null || row.abilityExpressionC === undefined
        ? ""
        : String(row.abilityExpressionC),
    draftText: row.draftText ?? "",
    aiSuggestedText: row.aiSuggestedText ?? "",
    finalText: row.finalText ?? "",
    status: row.status ?? "DRAFT",
    eventSummary,
  };
}