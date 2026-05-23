import type { Schema } from "../../../amplify/data/resource";

export type DomainKey =
  | "health"
  | "humanRelations"
  | "environment"
  | "language"
  | "expression";

export type DomainCounts = Record<DomainKey, number>;

export type AbilityAggregateRow = {
  abilityCode: string;
  abilityName: string;
  domain: string;
  category: string;
  count: number;
};

export type AbilityCategoryGroup = {
  category: string;
  totalCount: number;
  rows: AbilityAggregateRow[];
};

export type AbilityDomainGroup = {
  domainKey: DomainKey | null;
  domain: string;
  totalCount: number;
  categories: AbilityCategoryGroup[];
};

export type ChildAggregateRow = {
  childName: string;
  count: number;
};

export type EvidenceRow = {
  id: string;
  recordedAt: string;
  childName: string;
  title: string;
  body: string;
  sourceKind: string;
  practiceCode: string;
};

export type PracticeImpactRow = {
  practiceCode: string;
  practiceTitle: string;
  observationCount: number;
  abilityLinkCount: number;
  childNames: string[];
  domainCounts: DomainCounts;
  latestRecordedAt: string;
  evidenceRows: EvidenceRow[];
};

type ObservationRecordRow = Schema["ObservationRecord"]["type"];
type ObservationAbilityLinkBaseRow = Schema["ObservationAbilityLink"]["type"];
type ObservationAbilityLinkRow = ObservationAbilityLinkBaseRow & {
  practiceCode?: string | null;
  childName?: string | null;
  observationRecordId?: string | null;
  observationId?: string | null;
};

type AbilityCodeRow = Schema["AbilityCode"]["type"];

type AbilityPracticeLinkRow = Schema["AbilityPracticeLink"]["type"] & {
  abilityCode?: string | null;
  practiceCode?: string | null;
  score?: number | null;
};

type AbilityPracticeAggRow = Schema["AbilityPracticeAgg"]["type"] & {
  abilityCode?: string | null;
  practiceCode?: string | null;
  scoreSum?: number | null;
  scoreMax?: number | null;
  linkCount?: number | null;
  level?: number | null;
};

type PracticeCodeRow = Schema["PracticeCode"]["type"] & {
  practice_code?: string | null;
  name?: string | null;
  memo?: string | null;
  status?: string | null;
  tenantId?: string | null;
};

type WeekendPlayRow = Schema["WeekendPlay"]["type"] & {
  playId?: string | null;
  playTitle?: string | null;
  playType?: string | null;
  setting?: string | null;
  status?: string | null;
  parentHint?: string | null;
  sourceFile?: string | null;
  playDescriptionDraft?: string | null;
  sortOrder?: number | null;
};

type WeekendPlayAbilityLinkRow = Schema["WeekendPlayAbilityLink"]["type"] & {
  linkId?: string | null;
  playId?: string | null;
  playTitle?: string | null;
  sortOrder?: number | null;
  relationType?: string | null;
  weight?: number | null;
  abilityCode?: string | null;
  domain?: string | null;
  category?: string | null;
  abilityName?: string | null;
  reason?: string | null;
  status?: string | null;
};

type ClassroomRow = Schema["Classroom"]["type"];
type ClassAnnualPlanRow = Schema["ClassAnnualPlan"]["type"];
type ClassQuarterPlanRow = Schema["ClassQuarterPlan"]["type"];
type ClassMonthPlanRow = Schema["ClassMonthPlan"]["type"];
type ClassMonthPlanPhraseSelectionRow =
  Schema["ClassMonthPlanPhraseSelection"]["type"] & {
    classMonthPlanId?: string | null;
    classQuarterPlanId?: string | null;
    fiscalYear?: number | null;
    monthKey?: string | null;
    planPhraseId?: string | null;
    phraseTextSnapshot?: string | null;
    selectedDomainCode?: string | null;
    selectedDomain?: string | null;
    ageYears?: number | null;
    phraseNo?: number | null;
    abilityCodes?: (string | null)[] | null;
    abilitySummaryJson?: string | null;
    scoreHealth?: number | null;
    scoreHumanRelations?: number | null;
    scoreEnvironment?: number | null;
    scoreLanguage?: number | null;
    scoreExpression?: number | null;
    status?: string | null;
    sortOrder?: number | null;
    selectedAt?: string | null;
  };
type ClassPlanPhraseSelectionRow =
  Schema["ClassPlanPhraseSelection"]["type"] & {
    classroomId?: string | null;
    planScopeType?: string | null;
    relationUse?: string | null;
    classAnnualPlanId?: string | null;
    classQuarterPlanId?: string | null;
    classMonthPlanId?: string | null;
    phraseTextSnapshot?: string | null;
    selectedDomainCode?: string | null;
    selectedDomain?: string | null;
    ageYears?: number | null;
    phraseNo?: number | null;
    abilityCodes?: (string | null)[] | null;
    abilitySummaryJson?: string | null;
    relatedHealth?: number | null;
    relatedHumanRelations?: number | null;
    relatedEnvironment?: number | null;
    relatedLanguage?: number | null;
    relatedExpression?: number | null;
    status?: string | null;
    sortOrder?: number | null;
    selectedAt?: string | null;
  };

type ClassWeekPlanRow = Schema["ClassWeekPlan"]["type"] & {
  abilityHealthD?: number | string | null;
  abilityHumanRelationsD?: number | string | null;
  abilityEnvironmentD?: number | string | null;
  abilityLanguageD?: number | string | null;
  abilityExpressionD?: number | string | null;
  goalTextD?: string | null;
  goalTextWeek?: string | null;
  goalTextC?: string | null;
  weekStartDate?: string | null;
  startDate?: string | null;
  weekEndDate?: string | null;
  endDate?: string | null;
};

type ReportArtifactRow = Schema["ReportArtifact"]["type"];

type ModelError = {
  message?: string | null;
};

type ListResponse<TRow> = {
  data?: TRow[] | null;
  nextToken?: string | null;
  errors?: ModelError[] | null;
};

type MutationResponse<TRow> = {
  data?: TRow | null;
  errors?: ModelError[] | null;
};

type ListOptions = Record<string, unknown>;
type MutationInput = Record<string, unknown>;

type ModelListApi<TRow> = {
  list(options?: ListOptions): Promise<ListResponse<TRow>>;
};

type ModelCreateUpdateApi<TRow> = ModelListApi<TRow> & {
  create(input: MutationInput): Promise<MutationResponse<TRow>>;
  update(input: MutationInput): Promise<MutationResponse<TRow>>;
};

export type ReportingClient = {
  models: {
    Classroom: ModelListApi<ClassroomRow>;
    ObservationRecord: ModelListApi<ObservationRecordRow>;
    ObservationAbilityLink: ModelListApi<ObservationAbilityLinkRow>;
    AbilityCode: ModelListApi<AbilityCodeRow>;
    AbilityPracticeLink: ModelListApi<AbilityPracticeLinkRow>;
    AbilityPracticeAgg: ModelListApi<AbilityPracticeAggRow>;
    PracticeCode: ModelListApi<PracticeCodeRow>;
    WeekendPlay: ModelListApi<WeekendPlayRow>;
    WeekendPlayAbilityLink: ModelListApi<WeekendPlayAbilityLinkRow>;
    ClassAnnualPlan: ModelListApi<ClassAnnualPlanRow>;
    ClassQuarterPlan: ModelListApi<ClassQuarterPlanRow>;
    ClassMonthPlan: ModelListApi<ClassMonthPlanRow>;
    ClassMonthPlanPhraseSelection: ModelListApi<ClassMonthPlanPhraseSelectionRow>;
    ClassPlanPhraseSelection: ModelListApi<ClassPlanPhraseSelectionRow>;
    ClassWeekPlan: ModelListApi<ClassWeekPlanRow>;
    ReportArtifact: ModelCreateUpdateApi<ReportArtifactRow>;
  };
};

type AbilityDisplayMeta = {
  abilityCode: string;
  abilityName: string;
  domain: string;
  category: string;
  domainKey: DomainKey | null;
};

export type RecommendedPracticeRow = {
  practiceCode: string;
  practiceTitle: string;
  practiceMemo: string;
  score: number;
  weakDomainKeys: DomainKey[];
  weakDomainLabels: string[];
  matchedAbilityCodes: string[];
  matchedAbilityNames: string[];
  observedThisWeek: boolean;
  observationCountInPeriod: number;
  abilityLinkCountInPeriod: number;
};

export type WeekendPlayHintRow = {
  playId: string;
  playTitle: string;
  playType: string;
  setting: string;
  abilityCode: string;
  abilityName: string;
  domain: string;
  category: string;
  relationType: string;
  weight: number;
  reason: string;
  parentHint: string;
  playDescriptionDraft: string;
};

export type ObservationBundle = {
  observations: ObservationRecordRow[];
  abilityLinks: ObservationAbilityLinkRow[];
  domainCounts: DomainCounts;
  abilityRows: AbilityAggregateRow[];
  abilityGroups: AbilityDomainGroup[];
  childRows: ChildAggregateRow[];
  evidenceRows: EvidenceRow[];
  practiceRows: PracticeImpactRow[];
  abilityDisplayMap: Record<string, AbilityDisplayMeta>;
  abilityCodeRows: AbilityCodeRow[];
};

export type PlanBasis = "WEEK" | "MONTH" | "NONE";

export type PlanReferenceScopeType = "YEAR" | "TERM";

export type PlanReferenceSelectionSummary = {
  id: string;
  planScopeType: PlanReferenceScopeType;
  phraseText: string;
  domainCounts: DomainCounts;
  abilityCodes: string[];
  abilityNames: string[];
  sortOrder: number;
  selectedAt: string;
};

export type PlanReferenceSummary = {
  planScopeType: PlanReferenceScopeType;
  title: string;
  phraseCount: number;
  domainCounts: DomainCounts;
  trendText: string;
  topDomainLabels: string[];
  abilityNames: string[];
  phraseTexts: string[];
  selections: PlanReferenceSelectionSummary[];
};

export type PlanContextBundle = {
  annualPlan: ClassAnnualPlanRow | null;
  quarterPlan: ClassQuarterPlanRow | null;
  monthPlan: ClassMonthPlanRow | null;
  weekPlan: ClassWeekPlanRow | null;

  goalTextA: string;
  goalTextB: string;
  goalTextC: string;
  goalTextWeek: string;

  annualReferenceSummary: PlanReferenceSummary;
  termReferenceSummary: PlanReferenceSummary;

  plannedDomainsPrimary: DomainCounts;
  plannedDomainsMonth: DomainCounts;
  plannedDomainsWeek: DomainCounts | null;
  planBasis: PlanBasis;
};

export type DomainComparisonStatus =
  | "ALIGNED"
  | "OVER"
  | "UNDER"
  | "NO_PLAN"
  | "NO_ACTUAL";

export type DomainComparisonRow = {
  domainKey: DomainKey;
  domainLabel: string;
  plannedValue: number;
  actualValue: number;
  plannedShare: number;
  actualShare: number;
  gapShare: number;
  status: DomainComparisonStatus;
};

export type PlanActualComparison = {
  basis: PlanBasis;
  rows: DomainComparisonRow[];
  summaryStatus: "ALIGNED" | "MIXED" | "NO_PLAN";
  highlights: string[];
};

export type PlanReflection = {
  alignmentNotes: string[];
  gapNotes: string[];
  nextActionNotes: string[];
  recommendedPracticeRows: RecommendedPracticeRow[];
};

export type CheckActionReportBundle = {
  observation: ObservationBundle;
  planContext: PlanContextBundle;
  comparison: PlanActualComparison;
  reflection: PlanReflection;
};

type ReportType = "CLASS_WEEKLY" | "CHILD_WEEKLY" | "ABILITY_DASHBOARD";

type PracticeRecommendationMaster = {
  abilityPracticeLinks: AbilityPracticeLinkRow[];
  abilityPracticeAggs: AbilityPracticeAggRow[];
  practiceCodeRows: PracticeCodeRow[];
};

type PracticePeriodActivity = {
  practiceTitle: string;
  observationCount: number;
  abilityLinkCount: number;
};

type PracticeRecommendationInfo = {
  practiceTitle: string;
  practiceMemo: string;
};

type WeekendPlayMaster = {
  plays: WeekendPlayRow[];
  links: WeekendPlayAbilityLinkRow[];
};

let abilityCodeRowsCache: AbilityCodeRow[] | null = null;
let abilityCodeRowsPromise: Promise<AbilityCodeRow[]> | null = null;

let practiceRecommendationMasterCache: PracticeRecommendationMaster | null =
  null;
let practiceRecommendationMasterPromise: Promise<PracticeRecommendationMaster> | null =
  null;

let weekendPlayMasterCache: WeekendPlayMaster | null = null;
let weekendPlayMasterPromise: Promise<WeekendPlayMaster> | null = null;

const DOMAIN_KEYS: DomainKey[] = [
  "health",
  "humanRelations",
  "environment",
  "language",
  "expression",
];

function buildEqFilter(field: string, value: unknown): Record<string, unknown> {
  return {
    [field]: { eq: value },
  };
}

function buildDateRangeFilters(
  fromDate: string,
  toDate: string,
): Record<string, unknown>[] {
  return [{ targetDate: { ge: fromDate } }, { targetDate: { le: toDate } }];
}

function errorMessages(
  errors?: ModelError[] | null,
  fallback?: string,
): string {
  const messages = (errors ?? [])
    .map((error) => normalizeText(error.message))
    .filter(Boolean);

  if (messages.length > 0) {
    return messages.join(", ");
  }

  return fallback ?? "Unknown error";
}

function readRecordValue(row: unknown, key: string): unknown {
  if (!row || typeof row !== "object") return undefined;
  return (row as Record<string, unknown>)[key];
}

function readText(row: unknown, key: string): string {
  const value = readRecordValue(row, key);
  return normalizeText(
    typeof value === "string" || typeof value === "number" ? String(value) : "",
  );
}

function sortByTextFieldDesc<TRow>(rows: TRow[], fieldNames: string[]): TRow[] {
  return [...rows].sort((a, b) => {
    for (const fieldName of fieldNames) {
      const av = readText(a, fieldName);
      const bv = readText(b, fieldName);
      const diff = bv.localeCompare(av);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

export function todayYYYYMMDD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysAgoYYYYMMDD(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function listAll<TRow>(
  modelApi: ModelListApi<TRow>,
  options?: ListOptions,
): Promise<TRow[]> {
  const rows: TRow[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res = await modelApi.list({
      ...(options ?? {}),
      limit: Number(options?.limit ?? 1000),
      nextToken,
    });

    if (res.errors?.length) {
      throw new Error(errorMessages(res.errors, "model list に失敗しました。"));
    }

    if (Array.isArray(res.data) && res.data.length > 0) {
      rows.push(...res.data);
    }

    nextToken = res.nextToken ?? null;
  } while (nextToken);

  return rows;
}

async function loadAbilityCodeRows(
  client: ReportingClient,
): Promise<AbilityCodeRow[]> {
  if (abilityCodeRowsCache) {
    return abilityCodeRowsCache;
  }

  if (abilityCodeRowsPromise) {
    return abilityCodeRowsPromise;
  }

  abilityCodeRowsPromise = listAll(client.models.AbilityCode)
    .then((rows) => {
      abilityCodeRowsCache = rows;
      return rows;
    })
    .finally(() => {
      abilityCodeRowsPromise = null;
    });

  return abilityCodeRowsPromise;
}

export function clearAbilityCodeRowsCache() {
  abilityCodeRowsCache = null;
  abilityCodeRowsPromise = null;
}

export function clearPracticeRecommendationMasterCache() {
  practiceRecommendationMasterCache = null;
  practiceRecommendationMasterPromise = null;
}

export function clearWeekendPlayMasterCache() {
  weekendPlayMasterCache = null;
  weekendPlayMasterPromise = null;
}

function normalizeNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeText(value?: string | number | null) {
  return String(value ?? "").trim();
}

function isTranscriptSourceKind(sourceKind?: string | null) {
  return normalizeText(sourceKind).toUpperCase() === "TRANSCRIPT";
}

function excludeTranscriptObservations(rows: ObservationRecordRow[]) {
  return rows.filter((row) => !isTranscriptSourceKind(row.sourceKind));
}

function isActiveStatus(value?: string | null) {
  const status = normalizeText(value || "active").toLowerCase();
  return status === "active";
}

function isNotArchivedStatus(value?: string | null) {
  const status = normalizeText(value || "active").toLowerCase();
  return status !== "archived" && status !== "deleted";
}

export function normalizeAbilityCode(value?: string | number | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const noDecimal = raw.replace(/\.0+$/, "");
  const digitsOnly = noDecimal.replace(/[^\d]/g, "");

  return digitsOnly || noDecimal;
}

function normalizeAbilityLevel(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function isLeafAbilityRow(row: AbilityCodeRow) {
  if (typeof row.is_leaf === "boolean") {
    return row.is_leaf;
  }
  const level = normalizeAbilityLevel(row.level);
  return (level ?? 0) >= 3;
}

export function detectDomainKey(
  domain?: string | null,
  abilityCode?: string | null,
): DomainKey | null {
  const raw = normalizeText(domain).toLowerCase();

  if (raw === "健康" || raw === "health" || raw.includes("health")) {
    return "health";
  }
  if (raw === "人間関係" || raw === "humanrelations" || raw.includes("human")) {
    return "humanRelations";
  }
  if (raw === "環境" || raw === "environment" || raw.includes("environment")) {
    return "environment";
  }
  if (raw === "言葉" || raw === "language" || raw.includes("language")) {
    return "language";
  }
  if (raw === "表現" || raw === "expression" || raw.includes("expression")) {
    return "expression";
  }

  const normalizedCode = normalizeAbilityCode(abilityCode);
  const prefix2 = normalizedCode.slice(0, 2);

  switch (prefix2) {
    case "11":
      return "health";
    case "21":
      return "humanRelations";
    case "31":
      return "environment";
    case "41":
      return "language";
    case "51":
      return "expression";
    default:
      return null;
  }
}

export function emptyDomainCounts(): DomainCounts {
  return {
    health: 0,
    humanRelations: 0,
    environment: 0,
    language: 0,
    expression: 0,
  };
}

function addDomainCounts(a: DomainCounts, b: DomainCounts): DomainCounts {
  return {
    health: a.health + b.health,
    humanRelations: a.humanRelations + b.humanRelations,
    environment: a.environment + b.environment,
    language: a.language + b.language,
    expression: a.expression + b.expression,
  };
}

export function domainLabel(key: DomainKey) {
  switch (key) {
    case "health":
      return "健康";
    case "humanRelations":
      return "人間関係";
    case "environment":
      return "環境";
    case "language":
      return "言葉";
    case "expression":
      return "表現";
    default:
      return key;
  }
}

function domainFromAbilityPrefix(code?: string | null) {
  const key = detectDomainKey(undefined, code);
  return key ? domainLabel(key) : "-";
}

function categoryFromAbilityPrefix(code?: string | null) {
  const normalized = normalizeAbilityCode(code);
  return normalized.slice(0, 4) || "(category未設定)";
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.replace(/-/g, "/");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP");
}

export function truncateText(value?: string | null, max = 120) {
  const text = normalizeText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function buildPeriodKey(fromDate: string, toDate: string) {
  return `WEEK:${fromDate}_${toDate}`;
}

export function buildBundleCacheKey(
  classroomId: string,
  fromDate: string,
  toDate: string,
) {
  return `${classroomId}::${fromDate}::${toDate}`;
}

export function formatSharePercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

export function comparisonStatusLabel(status: DomainComparisonStatus) {
  switch (status) {
    case "ALIGNED":
      return "概ね計画通り";
    case "OVER":
      return "計画より強い";
    case "UNDER":
      return "計画より弱い";
    case "NO_PLAN":
      return "計画値なし";
    case "NO_ACTUAL":
      return "実績なし";
    default:
      return status;
  }
}

export async function loadClassrooms(
  client: ReportingClient,
  tenantId: string,
): Promise<ClassroomRow[]> {
  const rows = await listAll(client.models.Classroom, {
    filter: buildEqFilter("tenantId", tenantId),
  });

  return [...rows].sort((a, b) =>
    String(a.name ?? "").localeCompare(String(b.name ?? "")),
  );
}

function emptyPracticeImpactRow(practiceCode: string): PracticeImpactRow {
  return {
    practiceCode,
    practiceTitle: practiceCode || "(practice未設定)",
    observationCount: 0,
    abilityLinkCount: 0,
    childNames: [],
    domainCounts: emptyDomainCounts(),
    latestRecordedAt: "",
    evidenceRows: [],
  };
}

function abilityLinkPracticeCode(row: ObservationAbilityLinkRow): string {
  return normalizeText(row.practiceCode);
}

function abilityLinkChildName(row: ObservationAbilityLinkRow): string {
  return normalizeText(row.childName);
}

function abilityLinkObservationId(row: ObservationAbilityLinkRow): string {
  return normalizeText(row.observationRecordId ?? row.observationId);
}

function buildStructuredObservationAbilityNameMap(
  abilityLinks: ObservationAbilityLinkRow[],
): Map<string, string> {
  const counters = new Map<string, Map<string, number>>();

  for (const row of abilityLinks) {
    const observationId = abilityLinkObservationId(row);
    const abilityName = normalizeText(row.abilityName);

    if (!observationId || !abilityName) continue;

    const current = counters.get(observationId) ?? new Map<string, number>();
    current.set(abilityName, (current.get(abilityName) ?? 0) + 1);
    counters.set(observationId, current);
  }

  const result = new Map<string, string>();

  for (const [observationId, nameCounts] of counters.entries()) {
    const picked = [...nameCounts.entries()].sort((a, b) => {
      const countDiff = b[1] - a[1];
      if (countDiff !== 0) return countDiff;
      return a[0].localeCompare(b[0]);
    })[0]?.[0];

    if (picked) {
      result.set(observationId, picked);
    }
  }

  return result;
}

function buildEvidenceTitle(
  row: ObservationRecordRow,
  structuredObservationAbilityNameMap: Map<string, string>,
): string {
  const baseTitle =
    normalizeText(row.title) ||
    normalizeText(row.practiceTitleSnapshot) ||
    normalizeText(row.practiceCode) ||
    "(タイトルなし)";

  const sourceKind = normalizeText(row.sourceKind).toUpperCase();
  if (sourceKind !== "STRUCTURED_OBSERVATION") {
    return baseTitle;
  }

  const observationId = String(row.id ?? "");
  const abilityName = normalizeText(
    structuredObservationAbilityNameMap.get(observationId),
  );

  if (!abilityName) {
    return baseTitle;
  }

  return `${abilityName} / ${baseTitle}`;
}

export function buildPracticeImpactRows(args: {
  observations: ObservationRecordRow[];
  abilityLinks: ObservationAbilityLinkRow[];
}) {
  const { observations, abilityLinks } = args;
  const structuredObservationAbilityNameMap =
    buildStructuredObservationAbilityNameMap(abilityLinks);

  const map = new Map<string, PracticeImpactRow>();
  const childNameSets = new Map<string, Set<string>>();

  for (const obs of observations) {
    const practiceCode = normalizeText(obs.practiceCode) || "(practice未設定)";
    const row = map.get(practiceCode) ?? emptyPracticeImpactRow(practiceCode);

    row.observationCount += 1;

    const title =
      normalizeText(obs.practiceTitleSnapshot) ||
      normalizeText(obs.title) ||
      practiceCode;

    if (!row.practiceTitle || row.practiceTitle === row.practiceCode) {
      row.practiceTitle = title;
    }

    const recordedAt = String(obs.recordedAt ?? "");
    if (recordedAt > row.latestRecordedAt) {
      row.latestRecordedAt = recordedAt;
    }

    const childName = normalizeText(obs.childName);
    if (childName) {
      const currentSet = childNameSets.get(practiceCode) ?? new Set<string>();
      currentSet.add(childName);
      childNameSets.set(practiceCode, currentSet);
    }

    row.evidenceRows.push({
      id: String(obs.id ?? ""),
      recordedAt: String(obs.recordedAt ?? ""),
      childName: childName || "(クラス全体)",
      title: buildEvidenceTitle(obs, structuredObservationAbilityNameMap),
      body: normalizeText(obs.body),
      sourceKind: normalizeText(obs.sourceKind) || "-",
      practiceCode,
    });

    map.set(practiceCode, row);
  }

  for (const link of abilityLinks) {
    const practiceCode = abilityLinkPracticeCode(link) || "(practice未設定)";
    const row = map.get(practiceCode) ?? emptyPracticeImpactRow(practiceCode);

    row.abilityLinkCount += 1;

    const domainKey = detectDomainKey(link.domain, link.abilityCode);
    if (domainKey) {
      row.domainCounts[domainKey] += 1;
    }

    const childName = abilityLinkChildName(link);
    if (childName) {
      const currentSet = childNameSets.get(practiceCode) ?? new Set<string>();
      currentSet.add(childName);
      childNameSets.set(practiceCode, currentSet);
    }

    map.set(practiceCode, row);
  }

  const rows = [...map.values()].map((row) => ({
    ...row,
    childNames: [
      ...(childNameSets.get(row.practiceCode) ?? new Set<string>()),
    ].sort((a, b) => a.localeCompare(b)),
    evidenceRows: [...row.evidenceRows]
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .slice(0, 3),
  }));

  return rows.sort((a, b) => {
    const latestDiff = b.latestRecordedAt.localeCompare(a.latestRecordedAt);
    if (latestDiff !== 0) return latestDiff;

    const abilityDiff = b.abilityLinkCount - a.abilityLinkCount;
    if (abilityDiff !== 0) return abilityDiff;

    const obsDiff = b.observationCount - a.observationCount;
    if (obsDiff !== 0) return obsDiff;

    return a.practiceCode.localeCompare(b.practiceCode);
  });
}

function buildEvidenceRows(
  observations: ObservationRecordRow[],
  abilityLinks: ObservationAbilityLinkRow[],
): EvidenceRow[] {
  const structuredObservationAbilityNameMap =
    buildStructuredObservationAbilityNameMap(abilityLinks);

  return [...observations]
    .sort((a, b) =>
      String(b.recordedAt ?? "").localeCompare(String(a.recordedAt ?? "")),
    )
    .map((row) => ({
      id: String(row.id ?? ""),
      recordedAt: String(row.recordedAt ?? ""),
      childName: normalizeText(row.childName) || "(クラス全体)",
      title: buildEvidenceTitle(row, structuredObservationAbilityNameMap),
      body: normalizeText(row.body),
      sourceKind: normalizeText(row.sourceKind) || "-",
      practiceCode: normalizeText(row.practiceCode) || "-",
    }));
}

function buildAbilityCodeMap(rows: AbilityCodeRow[]) {
  const map = new Map<string, AbilityCodeRow>();

  rows.forEach((row) => {
    const code = normalizeAbilityCode(row.code);
    if (code && !map.has(code)) {
      map.set(code, row);
    }
  });

  return map;
}

function resolveDomainFromAbilityRow(row: AbilityCodeRow): string | undefined {
  const explicitDomain = normalizeText(row.domain);
  if (explicitDomain) return explicitDomain;

  const level = normalizeAbilityLevel(row.level);
  const name = normalizeText(row.name);

  if (level === 1 && name) {
    return name;
  }

  return undefined;
}

function resolveCategoryFromAbilityRow(
  row: AbilityCodeRow,
  startCode: string,
): string | undefined {
  const explicitCategory = normalizeText(row.category);
  if (explicitCategory) return explicitCategory;

  const rowCode = normalizeAbilityCode(row.code);
  const rowName = normalizeText(row.name);
  const level = normalizeAbilityLevel(row.level);

  if (!rowCode || rowCode === startCode) {
    return undefined;
  }

  if (level === 2 && rowName) {
    return rowName;
  }

  if (rowCode.length === 4 && rowName) {
    return rowName;
  }

  return undefined;
}

function resolveAbilityDisplayMeta(
  link: ObservationAbilityLinkRow,
  abilityCodeMap: Map<string, AbilityCodeRow>,
): AbilityDisplayMeta {
  const normalizedAbilityCode = normalizeAbilityCode(link.abilityCode);
  const linkAbilityName = normalizeText(link.abilityName);
  const linkDomain = normalizeText(link.domain);
  const linkCategory = normalizeText(link.category);

  let abilityName = linkAbilityName;
  let domain = linkDomain;
  let category = linkCategory;
  let currentCode = normalizedAbilityCode;

  for (let depth = 0; depth < 10 && currentCode; depth += 1) {
    const row = abilityCodeMap.get(currentCode);
    if (!row) break;

    const rowName = normalizeText(row.name);

    if (!abilityName && rowName && isLeafAbilityRow(row)) {
      abilityName = rowName;
    }

    if (!domain) {
      domain = resolveDomainFromAbilityRow(row) || domain;
    }

    if (!category) {
      category =
        resolveCategoryFromAbilityRow(row, normalizedAbilityCode) || category;
    }

    const nextParent = normalizeAbilityCode(row.parent_code);
    if (!nextParent || nextParent === currentCode) {
      break;
    }

    currentCode = nextParent;
  }

  if (!abilityName) {
    abilityName = normalizedAbilityCode || "(ability未設定)";
  }

  if (!domain) {
    domain = domainFromAbilityPrefix(normalizedAbilityCode);
  }

  if (!category) {
    category = categoryFromAbilityPrefix(normalizedAbilityCode);
  }

  return {
    abilityCode: normalizedAbilityCode,
    abilityName,
    domain,
    category,
    domainKey: detectDomainKey(domain, normalizedAbilityCode),
  };
}

function buildAbilityAggregates(args: {
  abilityLinks: ObservationAbilityLinkRow[];
  abilityCodeRows: AbilityCodeRow[];
}) {
  const { abilityLinks, abilityCodeRows } = args;
  const abilityCodeMap = buildAbilityCodeMap(abilityCodeRows);
  const domainCounts = emptyDomainCounts();
  const abilityMap = new Map<string, AbilityAggregateRow>();
  const abilityDisplayMap: Record<string, AbilityDisplayMeta> = {};

  for (const link of abilityLinks) {
    const abilityCode = normalizeAbilityCode(link.abilityCode);
    if (!abilityCode) continue;

    const meta = resolveAbilityDisplayMeta(link, abilityCodeMap);
    abilityDisplayMap[abilityCode] = meta;

    if (meta.domainKey) {
      domainCounts[meta.domainKey] += 1;
    }

    const current =
      abilityMap.get(abilityCode) ??
      ({
        abilityCode,
        abilityName: meta.abilityName,
        domain: meta.domain,
        category: meta.category,
        count: 0,
      } satisfies AbilityAggregateRow);

    current.count += 1;
    current.abilityName = meta.abilityName || current.abilityName;
    current.domain = meta.domain || current.domain;
    current.category = meta.category || current.category;

    abilityMap.set(abilityCode, current);
  }

  const abilityRows = [...abilityMap.values()].sort((a, b) => {
    const countDiff = b.count - a.count;
    if (countDiff !== 0) return countDiff;
    return a.abilityCode.localeCompare(b.abilityCode);
  });

  const abilityGroups = buildAbilityGroups(abilityRows);

  return {
    domainCounts,
    abilityRows,
    abilityGroups,
    abilityDisplayMap,
  };
}

function buildAbilityGroups(rows: AbilityAggregateRow[]): AbilityDomainGroup[] {
  const domainMap = new Map<string, AbilityDomainGroup>();

  for (const row of rows) {
    const domainKey = detectDomainKey(row.domain, row.abilityCode);
    const domain = row.domain || (domainKey ? domainLabel(domainKey) : "-");
    const domainMapKey = domainKey ?? domain;

    const domainGroup =
      domainMap.get(domainMapKey) ??
      ({
        domainKey,
        domain,
        totalCount: 0,
        categories: [],
      } satisfies AbilityDomainGroup);

    let categoryGroup = domainGroup.categories.find(
      (group) => group.category === row.category,
    );
    if (!categoryGroup) {
      categoryGroup = {
        category: row.category || "(category未設定)",
        totalCount: 0,
        rows: [],
      };
      domainGroup.categories.push(categoryGroup);
    }

    domainGroup.totalCount += row.count;
    categoryGroup.totalCount += row.count;
    categoryGroup.rows.push(row);
    domainMap.set(domainMapKey, domainGroup);
  }

  const groups = [...domainMap.values()].sort((a, b) => {
    const ai = a.domainKey ? DOMAIN_KEYS.indexOf(a.domainKey) : 999;
    const bi = b.domainKey ? DOMAIN_KEYS.indexOf(b.domainKey) : 999;
    if (ai !== bi) return ai - bi;
    return a.domain.localeCompare(b.domain);
  });

  for (const group of groups) {
    group.categories.sort((a, b) => {
      const totalDiff = b.totalCount - a.totalCount;
      if (totalDiff !== 0) return totalDiff;
      return a.category.localeCompare(b.category);
    });

    for (const category of group.categories) {
      category.rows.sort((a, b) => {
        const countDiff = b.count - a.count;
        if (countDiff !== 0) return countDiff;
        return a.abilityCode.localeCompare(b.abilityCode);
      });
    }
  }

  return groups;
}

function buildChildRows(observations: ObservationRecordRow[]) {
  const map = new Map<string, number>();

  for (const row of observations) {
    const childName = normalizeText(row.childName);
    if (!childName) continue;
    map.set(childName, (map.get(childName) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([childName, count]) => ({ childName, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;
      return a.childName.localeCompare(b.childName);
    });
}

function filterActiveAbilityLinks(rows: ObservationAbilityLinkRow[]) {
  return rows.filter((row) => isNotArchivedStatus(row.status));
}

function filterAbilityLinksByObservationIds(
  abilityLinks: ObservationAbilityLinkRow[],
  observations: ObservationRecordRow[],
) {
  const observationIds = new Set(
    observations.map((row) => normalizeText(row.id)).filter(Boolean),
  );

  if (observationIds.size === 0) {
    return abilityLinks;
  }

  return abilityLinks.filter((row) => {
    const observationId = abilityLinkObservationId(row);
    return !observationId || observationIds.has(observationId);
  });
}

export async function loadObservationBundle(
  client: ReportingClient,
  classroomId: string,
  fromDate: string,
  toDate: string,
): Promise<ObservationBundle> {
  const [abilityCodeRows, observationRows, rawAbilityLinks] = await Promise.all(
    [
      loadAbilityCodeRows(client),
      listAll(client.models.ObservationRecord, {
        filter: {
          and: [
            buildEqFilter("classroomId", classroomId),
            ...buildDateRangeFilters(fromDate, toDate),
          ],
        },
      }),
      listAll(client.models.ObservationAbilityLink, {
        filter: {
          and: [
            buildEqFilter("classroomId", classroomId),
            ...buildDateRangeFilters(fromDate, toDate),
          ],
        },
      }),
    ],
  );

  const observations = excludeTranscriptObservations(observationRows);
  const abilityLinks = filterAbilityLinksByObservationIds(
    filterActiveAbilityLinks(rawAbilityLinks),
    observations,
  );

  const abilityAgg = buildAbilityAggregates({
    abilityLinks,
    abilityCodeRows,
  });

  return {
    observations,
    abilityLinks,
    domainCounts: abilityAgg.domainCounts,
    abilityRows: abilityAgg.abilityRows,
    abilityGroups: abilityAgg.abilityGroups,
    childRows: buildChildRows(observations),
    evidenceRows: buildEvidenceRows(observations, abilityLinks),
    practiceRows: buildPracticeImpactRows({ observations, abilityLinks }),
    abilityDisplayMap: abilityAgg.abilityDisplayMap,
    abilityCodeRows,
  };
}

export function filterBundleByChild(
  bundle: ObservationBundle,
  childName: string,
): ObservationBundle {
  const normalizedChildName = normalizeText(childName);

  const observations = bundle.observations.filter(
    (row) => normalizeText(row.childName) === normalizedChildName,
  );

  const observationIds = new Set(
    observations.map((row) => normalizeText(row.id)).filter(Boolean),
  );

  const abilityLinks = bundle.abilityLinks.filter((row) => {
    const linkChildName = normalizeText(row.childName);
    const observationId = abilityLinkObservationId(row);

    return (
      linkChildName === normalizedChildName ||
      (!!observationId && observationIds.has(observationId))
    );
  });

  const abilityAgg = buildAbilityAggregates({
    abilityLinks,
    abilityCodeRows: bundle.abilityCodeRows,
  });

  return {
    observations,
    abilityLinks,
    domainCounts: abilityAgg.domainCounts,
    abilityRows: abilityAgg.abilityRows,
    abilityGroups: abilityAgg.abilityGroups,
    childRows: buildChildRows(observations),
    evidenceRows: buildEvidenceRows(observations, abilityLinks),
    practiceRows: buildPracticeImpactRows({ observations, abilityLinks }),
    abilityDisplayMap: abilityAgg.abilityDisplayMap,
    abilityCodeRows: bundle.abilityCodeRows,
  };
}

function buildPlanDomainCounts(row: unknown, suffixes: string[]): DomainCounts {
  const out = emptyDomainCounts();

  const readFirst = (fields: string[]) => {
    for (const field of fields) {
      const value = readRecordValue(row, field);
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return normalizeNumber(value);
      }
    }
    return 0;
  };

  out.health = readFirst(suffixes.map((suffix) => `abilityHealth${suffix}`));
  out.humanRelations = readFirst(
    suffixes.map((suffix) => `abilityHumanRelations${suffix}`),
  );
  out.environment = readFirst(
    suffixes.map((suffix) => `abilityEnvironment${suffix}`),
  );
  out.language = readFirst(
    suffixes.map((suffix) => `abilityLanguage${suffix}`),
  );
  out.expression = readFirst(
    suffixes.map((suffix) => `abilityExpression${suffix}`),
  );

  return out;
}

function hasAnyDomainValue(counts: DomainCounts) {
  return Object.values(counts).some((value) => value > 0);
}

function pickLatestByDate<TRow>(
  rows: TRow[],
  dateFields: string[],
): TRow | null {
  return (
    sortByTextFieldDesc(rows, [
      ...dateFields,
      "updatedAt",
      "createdAt",
      "id",
    ])[0] ?? null
  );
}

function overlapsPeriod(
  row: unknown,
  fromDate: string,
  toDate: string,
  startFields: string[],
  endFields: string[],
) {
  const start = startFields.map((field) => readText(row, field)).find(Boolean);
  const end = endFields.map((field) => readText(row, field)).find(Boolean);
  if (!start && !end) return true;
  return (!start || start <= toDate) && (!end || end >= fromDate);
}

function parseAbilitySummaryDomainCounts(json?: string | null): DomainCounts {
  const out = emptyDomainCounts();
  if (!json) return out;

  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return out;

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const abilityCode = normalizeAbilityCode(
        typeof row.abilityCode === "string" ||
          typeof row.abilityCode === "number"
          ? row.abilityCode
          : undefined,
      );
      const abilityDomain = normalizeText(
        typeof row.abilityDomain === "string" ||
          typeof row.abilityDomain === "number"
          ? row.abilityDomain
          : undefined,
      );
      const key = detectDomainKey(abilityDomain, abilityCode);
      if (!key) continue;
      out[key] += Math.max(0, normalizeNumber(row.weight));
    }
  } catch {
    return out;
  }

  return out;
}

function parseAbilitySummaryAbilityNames(json?: string | null): string[] {
  if (!json) return [];

  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(
        parsed
          .map((item) => {
            if (!item || typeof item !== "object") return "";
            const row = item as Record<string, unknown>;
            return normalizeText(
              typeof row.abilityName === "string" ||
                typeof row.abilityName === "number"
                ? row.abilityName
                : "",
            );
          })
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function buildReferenceDomainCounts(
  row: ClassPlanPhraseSelectionRow,
): DomainCounts {
  const direct = {
    health: normalizeNumber(row.relatedHealth),
    humanRelations: normalizeNumber(row.relatedHumanRelations),
    environment: normalizeNumber(row.relatedEnvironment),
    language: normalizeNumber(row.relatedLanguage),
    expression: normalizeNumber(row.relatedExpression),
  } satisfies DomainCounts;

  if (hasAnyDomainValue(direct)) return direct;
  return parseAbilitySummaryDomainCounts(row.abilitySummaryJson);
}

function buildReferenceSummary(
  planScopeType: PlanReferenceScopeType,
  rows: ClassPlanPhraseSelectionRow[],
): PlanReferenceSummary {
  const title = planScopeType === "YEAR" ? "年間方針" : "四半期方針";
  const activeRows = [...rows]
    .filter((row) => isNotArchivedStatus(row.status))
    .filter(
      (row) => normalizeText(row.planScopeType).toUpperCase() === planScopeType,
    )
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));

  const selections: PlanReferenceSelectionSummary[] = activeRows.map((row) => {
    const domainCounts = buildReferenceDomainCounts(row);
    const rawAbilityCodes: unknown[] = Array.isArray(row.abilityCodes)
      ? row.abilityCodes
      : [];
    const normalizedAbilityCodes: string[] = rawAbilityCodes
      .map((code: unknown) =>
        normalizeAbilityCode(
          typeof code === "string" || typeof code === "number" ? code : "",
        ),
      )
      .filter((code): code is string => code.length > 0);
    const abilityCodes: string[] = Array.from(
      new Set<string>(normalizedAbilityCodes),
    ).sort((a: string, b: string) => a.localeCompare(b));

    return {
      id: String(row.id ?? ""),
      planScopeType,
      phraseText: normalizeText(row.phraseTextSnapshot),
      domainCounts,
      abilityCodes,
      abilityNames: parseAbilitySummaryAbilityNames(row.abilitySummaryJson),
      sortOrder: Number(row.sortOrder ?? 0),
      selectedAt: normalizeText(row.selectedAt),
    };
  });

  const domainCounts = selections.reduce(
    (acc, row) => addDomainCounts(acc, row.domainCounts),
    emptyDomainCounts(),
  );

  const sortedDomains = DOMAIN_KEYS.map((key) => ({
    key,
    label: domainLabel(key),
    value: domainCounts[key],
  }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const topDomainLabels = sortedDomains.slice(0, 3).map((row) => row.label);
  const trendText = buildReferenceTrendText(domainCounts, planScopeType);

  return {
    planScopeType,
    title,
    phraseCount: selections.length,
    domainCounts,
    trendText,
    topDomainLabels,
    abilityNames: Array.from(
      new Set(selections.flatMap((row) => row.abilityNames)),
    )
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 12),
    phraseTexts: selections.map((row) => row.phraseText).filter(Boolean),
    selections,
  };
}

function buildReferenceTrendText(
  counts: DomainCounts,
  planScopeType: PlanReferenceScopeType,
): string {
  const label = planScopeType === "YEAR" ? "年間方針" : "四半期方針";
  const rows = DOMAIN_KEYS.map((key) => ({
    key,
    label: domainLabel(key),
    value: counts[key],
  }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) {
    return `${label}として関連する育ちはまだ選択されていません。`;
  }

  const top = rows[0];
  const related = rows.slice(1, 4).map((row) => row.label);

  if (related.length === 0) {
    return `${top.label}を中心とした${label}の構成です。`;
  }

  return `${top.label}を中心に、${related.join("・")}にも広がる${label}の構成です。`;
}

function buildMonthSelectionDomainCounts(
  row: ClassMonthPlanPhraseSelectionRow,
): DomainCounts {
  const direct = {
    health: normalizeNumber(row.scoreHealth),
    humanRelations: normalizeNumber(row.scoreHumanRelations),
    environment: normalizeNumber(row.scoreEnvironment),
    language: normalizeNumber(row.scoreLanguage),
    expression: normalizeNumber(row.scoreExpression),
  } satisfies DomainCounts;

  if (hasAnyDomainValue(direct)) return direct;
  return parseAbilitySummaryDomainCounts(row.abilitySummaryJson);
}

function buildMonthSelectionsDomainCounts(
  rows: ClassMonthPlanPhraseSelectionRow[],
): DomainCounts {
  return rows
    .filter((row) => isNotArchivedStatus(row.status))
    .reduce(
      (acc, row) => addDomainCounts(acc, buildMonthSelectionDomainCounts(row)),
      emptyDomainCounts(),
    );
}

function buildMonthSelectionsGoalText(
  rows: ClassMonthPlanPhraseSelectionRow[],
): string {
  return [...rows]
    .filter((row) => isNotArchivedStatus(row.status))
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((row) => normalizeText(row.phraseTextSnapshot))
    .filter(Boolean)
    .join("\n");
}

async function loadMonthPhraseSelections(
  client: ReportingClient,
  monthPlan?: ClassMonthPlanRow | null,
): Promise<ClassMonthPlanPhraseSelectionRow[]> {
  const monthPlanId = normalizeText(monthPlan?.id);
  if (!monthPlanId) return [];

  return listAll(client.models.ClassMonthPlanPhraseSelection, {
    filter: buildEqFilter("classMonthPlanId", monthPlanId),
  }).catch(() => [] as ClassMonthPlanPhraseSelectionRow[]);
}

async function loadReferenceSelections(
  client: ReportingClient,
  classroomId: string,
  fiscalYear: number | null,
  annualPlanId?: string | null,
  quarterPlanId?: string | null,
): Promise<ClassPlanPhraseSelectionRow[]> {
  const candidateRows = await listAll(
    client.models.ClassPlanPhraseSelection,
  ).catch(() => [] as ClassPlanPhraseSelectionRow[]);

  return candidateRows.filter((row) => {
    if (!isNotArchivedStatus(row.status)) return false;

    const rowFiscalYear = Number(row.fiscalYear ?? 0);
    if (fiscalYear && rowFiscalYear && rowFiscalYear !== fiscalYear)
      return false;

    const rowClassroomId = normalizeText(row.classroomId);
    if (rowClassroomId && rowClassroomId !== classroomId) return false;

    const scope = normalizeText(row.planScopeType).toUpperCase();
    if (scope === "YEAR") {
      return !!annualPlanId && row.classAnnualPlanId === annualPlanId;
    }
    if (scope === "TERM") {
      return !!quarterPlanId && row.classQuarterPlanId === quarterPlanId;
    }
    return false;
  });
}

async function loadPlanContext(
  client: ReportingClient,
  classroomId: string,
  fromDate: string,
  toDate: string,
): Promise<PlanContextBundle> {
  const annualRows = await listAll(client.models.ClassAnnualPlan, {
    filter: buildEqFilter("classroomId", classroomId),
  }).catch(() => [] as ClassAnnualPlanRow[]);

  const annualPlan =
    pickLatestByDate(
      annualRows.filter((row) =>
        overlapsPeriod(row, fromDate, toDate, ["periodStart"], ["periodEnd"]),
      ),
      ["periodStart", "periodEnd"],
    ) ?? pickLatestByDate(annualRows, ["periodStart", "periodEnd"]);

  const quarterRows = annualPlan
    ? await listAll(client.models.ClassQuarterPlan, {
        filter: buildEqFilter("classAnnualPlanId", annualPlan.id),
      }).catch(() => [] as ClassQuarterPlanRow[])
    : [];

  const quarterPlan =
    pickLatestByDate(
      quarterRows.filter((row) =>
        overlapsPeriod(row, fromDate, toDate, ["periodStart"], ["periodEnd"]),
      ),
      ["periodStart", "periodEnd", "termNo"],
    ) ?? pickLatestByDate(quarterRows, ["periodStart", "periodEnd", "termNo"]);

  const monthRows = quarterPlan
    ? await listAll(client.models.ClassMonthPlan, {
        filter: buildEqFilter("classQuarterPlanId", quarterPlan.id),
      }).catch(() => [] as ClassMonthPlanRow[])
    : [];

  const monthPlan =
    pickLatestByDate(
      monthRows.filter((row) =>
        overlapsPeriod(row, fromDate, toDate, ["periodStart"], ["periodEnd"]),
      ),
      ["periodStart", "periodEnd", "monthKey"],
    ) ??
    pickLatestByDate(monthRows, ["monthStartDate", "targetMonth", "monthKey"]);

  const weekRows = monthPlan
    ? await listAll(client.models.ClassWeekPlan, {
        filter: buildEqFilter("classMonthPlanId", monthPlan.id),
      }).catch(() => [] as ClassWeekPlanRow[])
    : [];

  const weekPlan =
    pickLatestByDate(
      weekRows.filter((row) => {
        const weekStart =
          readText(row, "periodStart") ||
          readText(row, "weekStartDate") ||
          readText(row, "startDate");
        const weekEnd =
          readText(row, "periodEnd") ||
          readText(row, "weekEndDate") ||
          readText(row, "endDate");
        if (!weekStart && !weekEnd) return true;
        return (
          (!weekStart || weekStart <= toDate) &&
          (!weekEnd || weekEnd >= fromDate)
        );
      }),
      ["periodStart", "weekStartDate", "startDate", "updatedAt", "createdAt"],
    ) ??
    pickLatestByDate(weekRows, ["periodStart", "weekStartDate", "startDate"]);

  const monthPhraseSelections = await loadMonthPhraseSelections(
    client,
    monthPlan,
  );

  const plannedDomainsFromMonthPlan = monthPlan
    ? buildPlanDomainCounts(monthPlan, ["C", ""])
    : emptyDomainCounts();
  const plannedDomainsFromMonthSelections = buildMonthSelectionsDomainCounts(
    monthPhraseSelections,
  );
  const plannedDomainsMonth = hasAnyDomainValue(plannedDomainsFromMonthPlan)
    ? plannedDomainsFromMonthPlan
    : plannedDomainsFromMonthSelections;

  const plannedDomainsWeek = weekPlan
    ? buildPlanDomainCounts(weekPlan, ["D", "C", ""])
    : null;

  const plannedDomainsPrimary =
    plannedDomainsWeek && hasAnyDomainValue(plannedDomainsWeek)
      ? plannedDomainsWeek
      : plannedDomainsMonth;

  const planBasis: PlanBasis =
    plannedDomainsWeek && hasAnyDomainValue(plannedDomainsWeek)
      ? "WEEK"
      : hasAnyDomainValue(plannedDomainsMonth)
        ? "MONTH"
        : "NONE";

  const fiscalYear =
    Number(
      readRecordValue(annualPlan, "fiscalYear") ??
        readRecordValue(quarterPlan, "fiscalYear") ??
        readRecordValue(monthPlan, "fiscalYear") ??
        0,
    ) || null;

  const referenceRows = await loadReferenceSelections(
    client,
    classroomId,
    fiscalYear,
    annualPlan ? String(annualPlan.id ?? "") : null,
    quarterPlan ? String(quarterPlan.id ?? "") : null,
  );

  const annualReferenceSummary = buildReferenceSummary(
    "YEAR",
    referenceRows.filter(
      (row) => row.classAnnualPlanId === String(annualPlan?.id ?? ""),
    ),
  );
  const termReferenceSummary = buildReferenceSummary(
    "TERM",
    referenceRows.filter(
      (row) => row.classQuarterPlanId === String(quarterPlan?.id ?? ""),
    ),
  );

  const monthGoalTextFromSelections = buildMonthSelectionsGoalText(
    monthPhraseSelections,
  );

  return {
    annualPlan,
    quarterPlan,
    monthPlan,
    weekPlan,
    goalTextA: annualPlan
      ? readText(annualPlan, "goalTextA") ||
        readText(annualPlan, "goalText") ||
        readText(annualPlan, "title")
      : "",
    goalTextB: quarterPlan
      ? readText(quarterPlan, "goalTextB") ||
        readText(quarterPlan, "goalText") ||
        readText(quarterPlan, "title")
      : "",
    goalTextC: monthPlan
      ? readText(monthPlan, "goalTextC") ||
        monthGoalTextFromSelections ||
        readText(monthPlan, "goalText") ||
        readText(monthPlan, "title")
      : monthGoalTextFromSelections,
    goalTextWeek: weekPlan
      ? readText(weekPlan, "goalTextD") ||
        readText(weekPlan, "goalTextWeek") ||
        readText(weekPlan, "goalTextC") ||
        readText(weekPlan, "title")
      : "",
    annualReferenceSummary,
    termReferenceSummary,
    plannedDomainsPrimary,
    plannedDomainsMonth,
    plannedDomainsWeek,
    planBasis,
  };
}

export function buildPlanVsActualComparison(
  plannedDomains: DomainCounts,
  actualDomains: DomainCounts,
  basis: PlanBasis,
): PlanActualComparison {
  const plannedTotal = Object.values(plannedDomains).reduce(
    (sum, value) => sum + value,
    0,
  );
  const actualTotal = Object.values(actualDomains).reduce(
    (sum, value) => sum + value,
    0,
  );

  const rows: DomainComparisonRow[] = DOMAIN_KEYS.map((key) => {
    const plannedValue = plannedDomains[key];
    const actualValue = actualDomains[key];

    const plannedShare = plannedTotal > 0 ? plannedValue / plannedTotal : 0;
    const actualShare = actualTotal > 0 ? actualValue / actualTotal : 0;
    const gapShare = actualShare - plannedShare;

    let status: DomainComparisonStatus = "ALIGNED";

    if (plannedTotal <= 0 || basis === "NONE") {
      status = "NO_PLAN";
    } else if (actualTotal <= 0) {
      status = "NO_ACTUAL";
    } else if (gapShare >= 0.08) {
      status = "OVER";
    } else if (gapShare <= -0.08) {
      status = "UNDER";
    }

    return {
      domainKey: key,
      domainLabel: domainLabel(key),
      plannedValue,
      actualValue,
      plannedShare,
      actualShare,
      gapShare,
      status,
    };
  });

  let summaryStatus: "ALIGNED" | "MIXED" | "NO_PLAN" = "ALIGNED";

  if (plannedTotal <= 0 || basis === "NONE") {
    summaryStatus = "NO_PLAN";
  } else if (
    rows.some((row) => row.status === "OVER" || row.status === "UNDER")
  ) {
    summaryStatus = "MIXED";
  }

  const sortedByGap = [...rows]
    .filter((row) => row.status === "OVER" || row.status === "UNDER")
    .sort((a, b) => Math.abs(b.gapShare) - Math.abs(a.gapShare));

  const highlights = sortedByGap.slice(0, 3).map((row) => {
    const direction = row.status === "OVER" ? "多く" : "少なく";
    return `${row.domainLabel}は計画比率より${direction}記録されています。`;
  });

  if (highlights.length === 0 && summaryStatus === "ALIGNED") {
    highlights.push("5領域の記録は、計画値と概ね整合しています。");
  }
  if (summaryStatus === "NO_PLAN") {
    highlights.push("比較できる計画値がまだ登録されていません。");
  }

  return {
    basis,
    rows,
    summaryStatus,
    highlights,
  };
}

async function loadPracticeRecommendationMaster(
  client: ReportingClient,
): Promise<PracticeRecommendationMaster> {
  if (practiceRecommendationMasterCache) {
    return practiceRecommendationMasterCache;
  }

  if (practiceRecommendationMasterPromise) {
    return practiceRecommendationMasterPromise;
  }

  practiceRecommendationMasterPromise = Promise.all([
    listAll(client.models.AbilityPracticeLink),
    listAll(client.models.AbilityPracticeAgg),
    listAll(client.models.PracticeCode),
  ])
    .then(([abilityPracticeLinks, abilityPracticeAggs, practiceCodeRows]) => {
      const master = {
        abilityPracticeLinks,
        abilityPracticeAggs,
        practiceCodeRows,
      };
      practiceRecommendationMasterCache = master;
      return master;
    })
    .finally(() => {
      practiceRecommendationMasterPromise = null;
    });

  return practiceRecommendationMasterPromise;
}

function practiceCodeFromPracticeRow(row: PracticeCodeRow): string {
  return normalizeText(row.practice_code);
}

function isPracticeActive(row: PracticeCodeRow): boolean {
  const status = normalizeText(row.status || "active").toUpperCase();
  return status !== "ARCHIVED" && status !== "DELETED";
}

function buildPracticePeriodActivityMap(
  observation: ObservationBundle,
): Map<string, PracticePeriodActivity> {
  const map = new Map<string, PracticePeriodActivity>();

  for (const row of observation.practiceRows) {
    const code = normalizeText(row.practiceCode);
    if (!code) continue;
    map.set(code, {
      practiceTitle: row.practiceTitle,
      observationCount: row.observationCount,
      abilityLinkCount: row.abilityLinkCount,
    });
  }

  return map;
}

function recommendPracticesForWeakDomains(args: {
  comparison: PlanActualComparison;
  observation: ObservationBundle;
  master: PracticeRecommendationMaster;
  limit?: number;
}): RecommendedPracticeRow[] {
  const { comparison, observation, master, limit = 5 } = args;
  const weakDomainKeys = comparison.rows
    .filter((row) => row.status === "UNDER")
    .map((row) => row.domainKey);

  if (weakDomainKeys.length === 0) {
    return [];
  }

  const weakDomainSet = new Set(weakDomainKeys);
  const abilityDisplayMap = observation.abilityDisplayMap;
  const periodActivityMap = buildPracticePeriodActivityMap(observation);

  const practiceInfoMap = new Map<string, PracticeRecommendationInfo>();
  for (const row of master.practiceCodeRows) {
    const practiceCode = practiceCodeFromPracticeRow(row);
    if (!practiceCode || !isPracticeActive(row)) continue;

    practiceInfoMap.set(practiceCode, {
      practiceTitle: normalizeText(row.name) || practiceCode,
      practiceMemo: normalizeText(row.memo),
    });
  }

  const aggScoreMap = new Map<string, number>();
  for (const row of master.abilityPracticeAggs) {
    const abilityCode = normalizeAbilityCode(row.abilityCode);
    const practiceCode = normalizeText(row.practiceCode);
    if (!abilityCode || !practiceCode) continue;
    const key = `${abilityCode}::${practiceCode}`;
    aggScoreMap.set(
      key,
      Math.max(normalizeNumber(row.scoreMax), normalizeNumber(row.scoreSum)),
    );
  }

  const candidateMap = new Map<
    string,
    {
      practiceCode: string;
      score: number;
      weakDomainKeys: Set<DomainKey>;
      matchedAbilityCodes: Set<string>;
      matchedAbilityNames: Set<string>;
    }
  >();

  for (const link of master.abilityPracticeLinks) {
    const abilityCode = normalizeAbilityCode(link.abilityCode);
    const practiceCode = normalizeText(link.practiceCode);
    if (!abilityCode || !practiceCode) continue;

    const domainKey = detectDomainKey(undefined, abilityCode);
    if (!domainKey || !weakDomainSet.has(domainKey)) continue;

    if (practiceInfoMap.size > 0 && !practiceInfoMap.has(practiceCode)) {
      continue;
    }

    const current =
      candidateMap.get(practiceCode) ??
      ({
        practiceCode,
        score: 0,
        weakDomainKeys: new Set<DomainKey>(),
        matchedAbilityCodes: new Set<string>(),
        matchedAbilityNames: new Set<string>(),
      } satisfies {
        practiceCode: string;
        score: number;
        weakDomainKeys: Set<DomainKey>;
        matchedAbilityCodes: Set<string>;
        matchedAbilityNames: Set<string>;
      });

    const aggScore = aggScoreMap.get(`${abilityCode}::${practiceCode}`) ?? 0;
    current.score += normalizeNumber(link.score) + aggScore;
    current.weakDomainKeys.add(domainKey);
    current.matchedAbilityCodes.add(abilityCode);

    const abilityName =
      normalizeText(abilityDisplayMap[abilityCode]?.abilityName) || abilityCode;
    current.matchedAbilityNames.add(abilityName);

    candidateMap.set(practiceCode, current);
  }

  return [...candidateMap.values()]
    .map((row) => {
      const activity = periodActivityMap.get(row.practiceCode);
      const weakKeys = [...row.weakDomainKeys];
      const practiceInfo = practiceInfoMap.get(row.practiceCode);

      return {
        practiceCode: row.practiceCode,
        practiceTitle:
          practiceInfo?.practiceTitle ||
          activity?.practiceTitle ||
          row.practiceCode,
        practiceMemo: practiceInfo?.practiceMemo ?? "",
        score: row.score,
        weakDomainKeys: weakKeys,
        weakDomainLabels: weakKeys.map((key) => domainLabel(key)),
        matchedAbilityCodes: [...row.matchedAbilityCodes].sort(),
        matchedAbilityNames: [...row.matchedAbilityNames].sort((a, b) =>
          a.localeCompare(b),
        ),
        observedThisWeek: !!activity,
        observationCountInPeriod: activity?.observationCount ?? 0,
        abilityLinkCountInPeriod: activity?.abilityLinkCount ?? 0,
      } satisfies RecommendedPracticeRow;
    })
    .sort((a, b) => {
      if (a.observedThisWeek !== b.observedThisWeek) {
        return a.observedThisWeek ? 1 : -1;
      }
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return a.practiceCode.localeCompare(b.practiceCode);
    })
    .slice(0, limit);
}

function buildPlanReflection(args: {
  planContext: PlanContextBundle;
  comparison: PlanActualComparison;
  observation: ObservationBundle;
  recommendedPracticeRows: RecommendedPracticeRow[];
}): PlanReflection {
  const { planContext, comparison, observation, recommendedPracticeRows } =
    args;
  const alignmentNotes: string[] = [];
  const gapNotes: string[] = [];
  const nextActionNotes: string[] = [];

  for (const highlight of comparison.highlights) {
    if (comparison.summaryStatus === "MIXED") {
      gapNotes.push(highlight);
    } else {
      alignmentNotes.push(highlight);
    }
  }

  if (planContext.annualReferenceSummary.phraseCount > 0) {
    alignmentNotes.push(
      `年間方針は、${planContext.annualReferenceSummary.trendText}`,
    );
  }

  if (planContext.termReferenceSummary.phraseCount > 0) {
    alignmentNotes.push(
      `今期の方針は、${planContext.termReferenceSummary.trendText}`,
    );
  }

  const actualTop = DOMAIN_KEYS.map((key) => ({
    key,
    label: domainLabel(key),
    value: observation.domainCounts[key],
  }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((row) => row.label);

  if (actualTop.length > 0) {
    alignmentNotes.push(
      `実際の観察では、${actualTop.join("・")}に関わる姿が多く見られました。`,
    );
  }

  if (recommendedPracticeRows.length > 0) {
    const labels = recommendedPracticeRows
      .slice(0, 3)
      .map(
        (row) => `${row.practiceTitle}（${row.weakDomainLabels.join("・")}）`,
      );
    nextActionNotes.push(
      `不足気味の領域に対して、${labels.join("、")} などを次週の候補として検討できます。`,
    );
  }

  if (alignmentNotes.length === 0) {
    alignmentNotes.push(
      "今週の記録から、子どもの姿を継続して把握するための材料が蓄積されています。",
    );
  }

  if (gapNotes.length === 0) {
    gapNotes.push("大きな乖離は見られません。引き続き記録を重ねて確認します。");
  }

  if (nextActionNotes.length === 0) {
    nextActionNotes.push(
      "今週の育ちを継続して見守りながら、子どもの興味が広がる場面を次週の活動に接続します。",
    );
  }

  return {
    alignmentNotes,
    gapNotes,
    nextActionNotes,
    recommendedPracticeRows,
  };
}

export async function loadCheckActionReportBundle(
  client: ReportingClient,
  classroomId: string,
  fromDate: string,
  toDate: string,
): Promise<CheckActionReportBundle> {
  const observation = await loadObservationBundle(
    client,
    classroomId,
    fromDate,
    toDate,
  );

  const planContext = await loadPlanContext(
    client,
    classroomId,
    fromDate,
    toDate,
  );

  const comparison = buildPlanVsActualComparison(
    planContext.plannedDomainsPrimary,
    observation.domainCounts,
    planContext.planBasis,
  );

  const recommendationMaster = await loadPracticeRecommendationMaster(client);

  const recommendedPracticeRows = recommendPracticesForWeakDomains({
    comparison,
    observation,
    master: recommendationMaster,
    limit: 5,
  });

  const reflection = buildPlanReflection({
    planContext,
    comparison,
    observation,
    recommendedPracticeRows,
  });

  return {
    observation,
    planContext,
    comparison,
    reflection,
  };
}

async function loadWeekendPlayMaster(
  client: ReportingClient,
): Promise<WeekendPlayMaster> {
  if (weekendPlayMasterCache) {
    return weekendPlayMasterCache;
  }

  if (weekendPlayMasterPromise) {
    return weekendPlayMasterPromise;
  }

  weekendPlayMasterPromise = Promise.all([
    listAll(client.models.WeekendPlay),
    listAll(client.models.WeekendPlayAbilityLink),
  ])
    .then(([plays, links]) => {
      const master = { plays, links };
      weekendPlayMasterCache = master;
      return master;
    })
    .finally(() => {
      weekendPlayMasterPromise = null;
    });

  return weekendPlayMasterPromise;
}

function seededHash(value: string): number {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededScore(seed: string, key: string): number {
  return seededHash(`${seed}::${key}`) / 4294967295;
}

export async function recommendWeekendPlayHints(args: {
  client: ReportingClient;
  bundle: ObservationBundle;
  seedKey: string;
  limit?: number;
}): Promise<WeekendPlayHintRow[]> {
  const { client, bundle, seedKey, limit = 3 } = args;

  if (bundle.abilityRows.length === 0) {
    return [];
  }

  const master = await loadWeekendPlayMaster(client);

  const playMap = new Map<string, WeekendPlayRow>();
  for (const play of master.plays) {
    const playId = normalizeText(play.playId);
    if (!playId || !isActiveStatus(play.status)) continue;
    playMap.set(playId, play);
  }

  const abilityCountMap = new Map<string, AbilityAggregateRow>();
  for (const row of bundle.abilityRows) {
    const abilityCode = normalizeAbilityCode(row.abilityCode);
    if (!abilityCode) continue;
    abilityCountMap.set(abilityCode, row);
  }

  const candidateMap = new Map<
    string,
    WeekendPlayHintRow & { score: number }
  >();

  for (const link of master.links) {
    if (!isActiveStatus(link.status)) continue;

    const abilityCode = normalizeAbilityCode(link.abilityCode);
    if (!abilityCode || !abilityCountMap.has(abilityCode)) continue;

    const playId = normalizeText(link.playId);
    const play = playMap.get(playId);
    if (!play) continue;

    const abilityRow = abilityCountMap.get(abilityCode);
    const baseWeight = Math.max(1, normalizeNumber(link.weight));
    const countBoost = abilityRow?.count ?? 0;
    const randomTieBreak = seededScore(seedKey, `${playId}::${abilityCode}`);
    const score = baseWeight * 10 + countBoost * 3 + randomTieBreak;

    const existing = candidateMap.get(playId);
    if (existing && existing.score >= score) continue;

    candidateMap.set(playId, {
      playId,
      playTitle:
        normalizeText(link.playTitle) ||
        normalizeText(play.playTitle) ||
        playId,
      playType: normalizeText(play.playType),
      setting: normalizeText(play.setting),
      abilityCode,
      abilityName:
        normalizeText(link.abilityName) ||
        abilityRow?.abilityName ||
        abilityCode,
      domain: normalizeText(link.domain) || abilityRow?.domain || "",
      category: normalizeText(link.category) || abilityRow?.category || "",
      relationType: normalizeText(link.relationType),
      weight: normalizeNumber(link.weight),
      reason: normalizeText(link.reason),
      parentHint: normalizeText(play.parentHint),
      playDescriptionDraft: normalizeText(play.playDescriptionDraft),
      score,
    });
  }

  return [...candidateMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => ({
      playId: row.playId,
      playTitle: row.playTitle,
      playType: row.playType,
      setting: row.setting,
      abilityCode: row.abilityCode,
      abilityName: row.abilityName,
      domain: row.domain,
      category: row.category,
      relationType: row.relationType,
      weight: row.weight,
      reason: row.reason,
      parentHint: row.parentHint,
      playDescriptionDraft: row.playDescriptionDraft,
    }));
}

function buildDomainSummaryLine(counts: DomainCounts) {
  return DOMAIN_KEYS.map((key) => `${domainLabel(key)}=${counts[key]}`).join(
    " / ",
  );
}

function buildReferenceSummaryLine(summary: PlanReferenceSummary) {
  if (summary.phraseCount === 0) {
    return `- ${summary.title}: 未選択`;
  }

  return `- ${summary.title}: ${summary.trendText} 関連領域=${buildDomainSummaryLine(summary.domainCounts)}`;
}

function buildReferenceMarkdownLines(summary: PlanReferenceSummary) {
  if (summary.phraseCount === 0) {
    return [`- ${summary.title}: 未選択`];
  }

  const lines = [
    `- ${summary.title}: ${summary.trendText}`,
    `- 関連領域: ${buildDomainSummaryLine(summary.domainCounts)}`,
  ];

  if (summary.abilityNames.length > 0) {
    lines.push(
      `- 関連する育ち: ${summary.abilityNames.slice(0, 8).join("、")}`,
    );
  }

  summary.phraseTexts.slice(0, 4).forEach((text) => {
    lines.push(`  - ${text}`);
  });

  return lines;
}

function buildTopAbilitiesLine(rows: AbilityAggregateRow[], limit: number) {
  if (rows.length === 0) return "該当なし";
  return rows
    .slice(0, limit)
    .map((row) => `${row.abilityName}（${row.count}件）`)
    .join("、");
}

function buildTopChildrenLine(rows: ChildAggregateRow[], limit: number) {
  if (rows.length === 0) return "該当なし";
  return rows
    .slice(0, limit)
    .map((row) => `${row.childName}（${row.count}件）`)
    .join("、");
}

function buildPracticeMarkdownLines(rows: PracticeImpactRow[], limit: number) {
  if (rows.length === 0) {
    return ["- 該当なし"];
  }

  return rows
    .slice(0, limit)
    .map(
      (row) =>
        `- ${row.practiceTitle} [${row.practiceCode}] / 観察=${row.observationCount}件 / AbilityLink=${row.abilityLinkCount}件 / 子ども=${row.childNames.join("、") || "記録なし"} / 5領域=${buildDomainSummaryLine(
          row.domainCounts,
        )}`,
    );
}

function buildRecommendedPracticeMarkdownLines(rows: RecommendedPracticeRow[]) {
  if (rows.length === 0) {
    return ["- 該当なし"];
  }

  return rows.flatMap((row) => {
    const lines = [
      `- ${row.practiceTitle} [${row.practiceCode}] / 補いたい領域=${row.weakDomainLabels.join("・")} / 関連する育ち=${row.matchedAbilityNames.slice(0, 5).join("、")}`,
    ];

    if (row.practiceMemo) {
      lines.push(`  - 概要: ${row.practiceMemo}`);
    } else {
      lines.push("  - 概要: 概要メモ未登録");
    }

    return lines;
  });
}

function buildComparisonMarkdownLines(comparison: PlanActualComparison) {
  if (comparison.rows.length === 0) {
    return ["- 比較データなし"];
  }

  return comparison.rows.map(
    (row) =>
      `- ${row.domainLabel}: plan=${row.plannedValue} / actual=${row.actualValue} / 判定=${comparisonStatusLabel(
        row.status,
      )} / plan比率=${formatSharePercent(row.plannedShare)} / actual比率=${formatSharePercent(
        row.actualShare,
      )}`,
  );
}

function buildAbilityHierarchyMarkdownLines(
  groups: AbilityDomainGroup[],
  titleWhenEmpty = "- 該当なし",
) {
  if (groups.length === 0) {
    return [titleWhenEmpty];
  }

  const lines: string[] = [];

  groups.forEach((domainGroup) => {
    lines.push(`### ${domainGroup.domain}（${domainGroup.totalCount}件）`);

    domainGroup.categories.forEach((categoryGroup) => {
      lines.push(
        `- ${categoryGroup.category}（${categoryGroup.totalCount}件）`,
      );

      categoryGroup.rows.forEach((row) => {
        lines.push(`  - ${row.abilityCode} ${row.abilityName}: ${row.count}件`);
      });
    });

    lines.push("");
  });

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines;
}

function buildEvidenceMarkdownLines(rows: EvidenceRow[], limit: number) {
  if (rows.length === 0) {
    return ["- 該当なし"];
  }

  return rows
    .slice(0, limit)
    .map(
      (row) =>
        `- ${formatDateTime(row.recordedAt)} / ${row.childName} / ${row.title} / ${
          truncateText(row.body, 120) || "(本文なし)"
        }`,
    );
}

function buildWeekendPlayHintMarkdownLines(rows: WeekendPlayHintRow[]) {
  if (rows.length === 0) {
    return [
      "- 今週は、家庭向けの週末あそび候補を表示できる育ちのデータがまだ十分ではありません。",
    ];
  }

  return rows.flatMap((row, index) => {
    const meta = [row.playType, row.setting].filter(Boolean).join(" / ");
    return [
      `### ${index + 1}. ${row.playTitle}`,
      `- 種別: ${meta || "-"}`,
      `- 関連する育ち: ${row.abilityName}（${row.domain || "-"} / ${row.category || "-"}）`,
      `- 説明: ${row.playDescriptionDraft || row.parentHint || row.reason || "家庭で無理なく楽しめる遊びです。"}`,
      "",
    ];
  });
}

function buildChildClosingMessage(
  bundle: ObservationBundle,
  childName: string,
) {
  const topAbilityNames = bundle.abilityRows
    .slice(0, 3)
    .map((row) => row.abilityName);

  if (bundle.observations.length === 0) {
    return `${childName}さんについて、今週はまだ記録が少ないため、来週以降も丁寧に様子を見てまいります。`;
  }

  if (topAbilityNames.length === 0) {
    return `${childName}さんが安心して園で過ごせるように、来週もその子らしい姿を大切に見守ってまいります。`;
  }

  return `${childName}さんの興味や関わりが、園で少しずつ広がっている様子が見られました。来週も安心して過ごしながら、${topAbilityNames[0]} につながる経験を大切にしていきます。`;
}

export function buildClassWeeklyMarkdown(args: {
  classroomName: string;
  fromDate: string;
  toDate: string;
  bundle: CheckActionReportBundle;
}) {
  const { classroomName, fromDate, toDate, bundle } = args;
  const observation = bundle.observation;

  const headline =
    observation.observations.length === 0
      ? "今週の観察記録はまだありません。"
      : `今週は ${observation.observations.length} 件の観察が記録されました。`;

  return [
    `# ${classroomName} クラス週報`,
    ``,
    `- 期間: ${formatDate(fromDate)} 〜 ${formatDate(toDate)}`,
    `- 総観察件数: ${observation.observations.length}件`,
    `- 5領域件数: ${buildDomainSummaryLine(observation.domainCounts)}`,
    `- 定量比較の基準: ${
      bundle.planContext.planBasis === "WEEK"
        ? "週計画(D)"
        : bundle.planContext.planBasis === "MONTH"
          ? "月計画(C)"
          : "計画値なし"
    }`,
    ``,
    `## 報告の背景（計画）`,
    `- 年の目標(A): ${bundle.planContext.goalTextA || "未設定"}`,
    `- 期の目標(B): ${bundle.planContext.goalTextB || "未設定"}`,
    `- 月の目標(C): ${bundle.planContext.goalTextC || "未設定"}`,
    `- 週の補足: ${bundle.planContext.goalTextWeek || "未設定"}`,
    buildReferenceSummaryLine(bundle.planContext.annualReferenceSummary),
    buildReferenceSummaryLine(bundle.planContext.termReferenceSummary),
    ``,
    `## 年間・四半期方針との関係`,
    ...buildReferenceMarkdownLines(bundle.planContext.annualReferenceSummary),
    ...buildReferenceMarkdownLines(bundle.planContext.termReferenceSummary),
    ``,
    `## 今週の概要`,
    headline,
    `よく見られた育ちは、${buildTopAbilitiesLine(observation.abilityRows, 5)} でした。`,
    `観察件数の多かった子どもは、${buildTopChildrenLine(observation.childRows, 5)} でした。`,
    ``,
    `## 5領域の計画値と実績値`,
    ...buildComparisonMarkdownLines(bundle.comparison),
    ``,
    `## 今週実施した Practice と育ちへのつながり`,
    ...buildPracticeMarkdownLines(observation.practiceRows, 10),
    ``,
    `## よく見られた育ち`,
    ...buildAbilityHierarchyMarkdownLines(observation.abilityGroups),
    ``,
    `## 最近の観察エビデンス`,
    ...buildEvidenceMarkdownLines(observation.evidenceRows, 5),
    ``,
    `## 考察`,
    `### 整合していた点`,
    ...(bundle.reflection.alignmentNotes.length > 0
      ? bundle.reflection.alignmentNotes.map((item) => `- ${item}`)
      : ["- 該当なし"]),
    ``,
    `### 乖離していた点`,
    ...(bundle.reflection.gapNotes.length > 0
      ? bundle.reflection.gapNotes.map((item) => `- ${item}`)
      : ["- 該当なし"]),
    ``,
    `### 次週への action`,
    ...(bundle.reflection.nextActionNotes.length > 0
      ? bundle.reflection.nextActionNotes.map((item) => `- ${item}`)
      : ["- 該当なし"]),
    ``,
    `### 候補Practice`,
    ...buildRecommendedPracticeMarkdownLines(
      bundle.reflection.recommendedPracticeRows,
    ),
    ``,
  ].join("\n");
}

export function buildChildWeekendMarkdown(args: {
  classroomName: string;
  childName: string;
  fromDate: string;
  toDate: string;
  bundle: ObservationBundle;
  weekendPlayHints?: WeekendPlayHintRow[];
}) {
  const {
    classroomName,
    childName,
    fromDate,
    toDate,
    bundle,
    weekendPlayHints = [],
  } = args;

  return [
    `# ${childName}さん 週末だより`,
    ``,
    `- クラス: ${classroomName}`,
    `- 期間: ${formatDate(fromDate)} 〜 ${formatDate(toDate)}`,
    `- 観察件数: ${bundle.observations.length}件`,
    `- 5領域件数: ${buildDomainSummaryLine(bundle.domainCounts)}`,
    ``,
    `## 今週のようす`,
    bundle.observations.length === 0
      ? `${childName}さんについて、今週は記録が少ない週でした。`
      : `${childName}さんについて、今週は ${bundle.observations.length} 件の観察がありました。`,
    ``,
    `## 育ちのポイント`,
    ...buildAbilityHierarchyMarkdownLines(bundle.abilityGroups),
    ``,
    `## 園で見られた Practice とのつながり`,
    ...buildPracticeMarkdownLines(bundle.practiceRows, 10),
    ``,
    `## 週末の過ごし方のヒント`,
    ...buildWeekendPlayHintMarkdownLines(weekendPlayHints),
    ``,
    `## 印象的だった場面`,
    ...buildEvidenceMarkdownLines(bundle.evidenceRows, 5),
    ``,
    `## 来週に向けて`,
    buildChildClosingMessage(bundle, childName),
    ``,
  ].join("\n");
}

export async function upsertReportArtifact(args: {
  client: ReportingClient;
  tenantId: string;
  owner: string;
  reportType: ReportType;
  classroomId?: string;
  childKey?: string;
  childName?: string;
  periodStart: string;
  periodEnd: string;
  title: string;
  payload: unknown;
  markdownText: string;
}): Promise<ReportArtifactRow> {
  const {
    client,
    tenantId,
    owner,
    reportType,
    classroomId,
    childKey,
    childName,
    periodStart,
    periodEnd,
    title,
    payload,
    markdownText,
  } = args;

  const andFilters: Record<string, unknown>[] = [
    buildEqFilter("tenantId", tenantId),
    buildEqFilter("owner", owner),
    buildEqFilter("reportType", reportType),
    buildEqFilter("periodStart", periodStart),
    buildEqFilter("periodEnd", periodEnd),
  ];

  if (classroomId) {
    andFilters.push(buildEqFilter("classroomId", classroomId));
  }

  if (childKey) {
    andFilters.push(buildEqFilter("childKey", childKey));
  } else if (childName) {
    andFilters.push(buildEqFilter("childName", childName));
  }

  const existingRows = await listAll(client.models.ReportArtifact, {
    filter: {
      and: andFilters,
    },
  });

  const latest = [...existingRows].sort((a, b) =>
    String(b.generatedAt ?? "").localeCompare(String(a.generatedAt ?? "")),
  )[0];

  const commonValues: MutationInput = {
    tenantId,
    owner,
    reportType,
    classroomId,
    childKey,
    childName,
    periodKey: buildPeriodKey(periodStart, periodEnd),
    periodStart,
    periodEnd,
    title,
    status: "READY",
    payloadJson: JSON.stringify(payload),
    markdownText,
    generatedAt: new Date().toISOString(),
  };

  if (latest?.id) {
    const updateRes = await client.models.ReportArtifact.update({
      id: latest.id,
      ...commonValues,
    });

    if (!updateRes.data) {
      throw new Error(
        errorMessages(
          updateRes.errors,
          "ReportArtifact update に失敗しました。",
        ),
      );
    }

    return updateRes.data;
  }

  const createRes = await client.models.ReportArtifact.create(commonValues);

  if (!createRes.data) {
    throw new Error(
      errorMessages(createRes.errors, "ReportArtifact create に失敗しました。"),
    );
  }

  return createRes.data;
}
