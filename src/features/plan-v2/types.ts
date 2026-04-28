// src/features/plan-v2/types.ts
import type { Schema } from "../../../amplify/data/resource";

export type TenantRecord = Schema["Tenant"]["type"];
export type ClassroomRecord = Schema["Classroom"]["type"];
export type SchoolAnnualPlanRecord = Schema["SchoolAnnualPlan"]["type"];
export type SchoolAnnualAgeTargetRecord =
  Schema["SchoolAnnualAgeTarget"]["type"];
export type ClassAnnualPlanRecord = Schema["ClassAnnualPlan"]["type"];
export type ClassQuarterPlanRecord = Schema["ClassQuarterPlan"]["type"];
export type QuarterEventRecord = Schema["QuarterEvent"]["type"];
export type ClassMonthPlanRecord = Schema["ClassMonthPlan"]["type"];
export type MonthEventRecord = Schema["MonthEvent"]["type"];

export type PlanPhraseRecord = Schema["PlanPhrase"]["type"];
export type PlanPhraseAbilityLinkRecord =
  Schema["PlanPhraseAbilityLink"]["type"];
export type ClassMonthPlanPhraseSelectionRecord =
  Schema["ClassMonthPlanPhraseSelection"]["type"];

export type PlanDomainKey =
  | "health"
  | "humanRelations"
  | "environment"
  | "language"
  | "expression";

export type PlanDomainLabel = "健康" | "人間関係" | "環境" | "言葉" | "表現";

export type PlanPhraseAbilitySummary = {
  abilityCode: string;
  abilityDomain: string;
  categoryCode?: string;
  categoryName?: string;
  abilityName?: string;
  relationType?: string;
  weight: number;
};

export type MonthPlanPhraseSelectionForm = {
  id?: string;
  clientKey: string;
  classMonthPlanId?: string;
  planPhraseId: string;
  phraseTextSnapshot: string;
  selectedDomainCode: string;
  selectedDomain: string;
  ageYears: string;
  abilitySummary: PlanPhraseAbilitySummary[];
  status: string;
  sortOrder: number;
  selectedAt?: string;
};

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
  phraseSelections: MonthPlanPhraseSelectionForm[];
};

export const PLAN_DOMAINS: Array<{
  key: PlanDomainKey;
  label: PlanDomainLabel;
  code: string;
  formField:
    | "abilityHealth"
    | "abilityHumanRelations"
    | "abilityEnvironment"
    | "abilityLanguage"
    | "abilityExpression";
}> = [
  {
    key: "health",
    label: "健康",
    code: "11",
    formField: "abilityHealth",
  },
  {
    key: "humanRelations",
    label: "人間関係",
    code: "21",
    formField: "abilityHumanRelations",
  },
  {
    key: "environment",
    label: "環境",
    code: "31",
    formField: "abilityEnvironment",
  },
  {
    key: "language",
    label: "言葉",
    code: "41",
    formField: "abilityLanguage",
  },
  {
    key: "expression",
    label: "表現",
    code: "51",
    formField: "abilityExpression",
  },
];

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

export function toIntOrZero(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function nodeKey(node: TreeNode | null | undefined): string {
  if (!node) return "";
  return `${node.kind}:${"tenantId" in node ? node.tenantId : node.id}`;
}

export function getPlanDomainKey(
  value?: string | number | null,
): PlanDomainKey | null {
  const t = s(value);
  const domain = PLAN_DOMAINS.find(
    (x) => x.label === t || x.code === t || x.key === t,
  );
  return domain?.key ?? null;
}

export function getPlanDomainLabel(
  value?: string | number | null,
): PlanDomainLabel | "" {
  const key = getPlanDomainKey(value);
  return PLAN_DOMAINS.find((x) => x.key === key)?.label ?? "";
}

export function getPlanDomainCode(value?: string | number | null): string {
  const key = getPlanDomainKey(value);
  return PLAN_DOMAINS.find((x) => x.key === key)?.code ?? "";
}

export function parseAgeYears(value?: string | number | null): number | null {
  const text = s(value);
  if (!text) return null;

  const direct = Number(text);
  if (Number.isFinite(direct)) return Math.trunc(direct);

  const match = text.match(/(\d+)/);
  if (!match) return null;

  const n = Number(match[1]);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function parseAbilitySummaryJson(
  json?: string | null,
): PlanPhraseAbilitySummary[] {
  if (!json) return [];

  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((x): PlanPhraseAbilitySummary | null => {
        if (typeof x !== "object" || x === null) return null;

        const row = x as Record<string, unknown>;
        const abilityCode = s(row.abilityCode);
        if (!abilityCode) return null;

        return {
          abilityCode,
          abilityDomain: s(row.abilityDomain),
          categoryCode: s(row.categoryCode) || undefined,
          categoryName: s(row.categoryName) || undefined,
          abilityName: s(row.abilityName) || undefined,
          relationType: s(row.relationType) || undefined,
          weight: toIntOrZero(row.weight),
        };
      })
      .filter((x): x is PlanPhraseAbilitySummary => x !== null);
  } catch {
    return [];
  }
}

export function stringifyAbilitySummary(
  rows: PlanPhraseAbilitySummary[],
): string {
  return JSON.stringify(
    rows.map((x) => ({
      abilityCode: x.abilityCode,
      abilityDomain: x.abilityDomain,
      categoryCode: x.categoryCode ?? "",
      categoryName: x.categoryName ?? "",
      abilityName: x.abilityName ?? "",
      relationType: x.relationType ?? "",
      weight: toIntOrZero(x.weight),
    })),
  );
}

export function abilityLinksToSummary(
  links: PlanPhraseAbilityLinkRecord[],
): PlanPhraseAbilitySummary[] {
  return [...links]
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((x) => ({
      abilityCode: x.abilityCode ?? "",
      abilityDomain: x.abilityDomain ?? "",
      categoryCode: x.categoryCode ?? undefined,
      categoryName: x.categoryName ?? undefined,
      abilityName: x.abilityName ?? undefined,
      relationType: x.relationType ?? undefined,
      weight: toIntOrZero(x.weight),
    }))
    .filter((x) => x.abilityCode !== "");
}

export function summarizeAbilityWeightsByDomain(
  rows: PlanPhraseAbilitySummary[],
): Record<PlanDomainKey, number> {
  const totals: Record<PlanDomainKey, number> = {
    health: 0,
    humanRelations: 0,
    environment: 0,
    language: 0,
    expression: 0,
  };

  for (const row of rows) {
    const key = getPlanDomainKey(row.abilityDomain);
    if (!key) continue;
    totals[key] += toIntOrZero(row.weight);
  }

  return totals;
}

export function summarizeSelectionsByDomain(
  selections: MonthPlanPhraseSelectionForm[],
): Record<PlanDomainKey, number> {
  const totals: Record<PlanDomainKey, number> = {
    health: 0,
    humanRelations: 0,
    environment: 0,
    language: 0,
    expression: 0,
  };

  for (const selection of selections.filter((x) => x.status !== "ARCHIVED")) {
    const subtotal = summarizeAbilityWeightsByDomain(selection.abilitySummary);
    for (const domain of PLAN_DOMAINS) {
      totals[domain.key] += subtotal[domain.key];
    }
  }

  return totals;
}

export function buildGoalTextFromSelections(
  selections: MonthPlanPhraseSelectionForm[],
): string {
  return selections
    .filter((x) => x.status !== "ARCHIVED")
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((x) => x.phraseTextSnapshot)
    .filter((x) => x.trim() !== "")
    .join("\n");
}

export function recalculateMonthPlanFromSelections(
  form: MonthPlanForm,
): MonthPlanForm {
  const activeSelections = form.phraseSelections.filter(
    (x) => x.status !== "ARCHIVED",
  );
  const totals = summarizeSelectionsByDomain(activeSelections);

  return {
    ...form,
    goalText: buildGoalTextFromSelections(activeSelections),
    abilityHealth: String(totals.health),
    abilityHumanRelations: String(totals.humanRelations),
    abilityEnvironment: String(totals.environment),
    abilityLanguage: String(totals.language),
    abilityExpression: String(totals.expression),
    phraseSelections: activeSelections.map((x, index) => ({
      ...x,
      sortOrder: index + 1,
    })),
  };
}

export function makePhraseSelectionClientKey(
  planPhraseId: string,
  index = 0,
): string {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${planPhraseId || "phrase"}-${index}-${randomPart}`;
}

export function toMonthPhraseSelectionForm(
  row: ClassMonthPlanPhraseSelectionRecord,
): MonthPlanPhraseSelectionForm {
  return {
    id: row.id,
    clientKey: row.id ?? makePhraseSelectionClientKey(row.planPhraseId ?? ""),
    classMonthPlanId: row.classMonthPlanId ?? undefined,
    planPhraseId: row.planPhraseId ?? "",
    phraseTextSnapshot: row.phraseTextSnapshot ?? "",
    selectedDomainCode: row.selectedDomainCode ?? "",
    selectedDomain: row.selectedDomain ?? "",
    ageYears:
      row.ageYears === null || row.ageYears === undefined
        ? ""
        : String(row.ageYears),
    abilitySummary: parseAbilitySummaryJson(row.abilitySummaryJson),
    status: row.status ?? "ACTIVE",
    sortOrder: Number(row.sortOrder ?? 0),
    selectedAt: row.selectedAt ?? undefined,
  };
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
  row?: SchoolAnnualPlanRecord | null,
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
  row?: SchoolAnnualAgeTargetRecord | null,
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
  row?: ClassAnnualPlanRecord | null,
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
  quarterEvents?: QuarterEventRecord[],
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
    phraseSelections: [],
  };
}

export function toMonthPlanForm(
  row?: ClassMonthPlanRecord | null,
  monthEvents?: MonthEventRecord[],
  phraseSelections?: ClassMonthPlanPhraseSelectionRecord[],
): MonthPlanForm {
  if (!row) return emptyMonthPlanForm();

  const eventSummary = (monthEvents ?? [])
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((x) => x.label ?? "")
    .filter((x) => x.trim() !== "")
    .join("\n");

  const selectionForms = (phraseSelections ?? [])
    .filter((x) => x.status !== "ARCHIVED")
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((x) => toMonthPhraseSelectionForm(x));

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
    phraseSelections: selectionForms,
  };
}
