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
  status?: string | null;
  tenantId?: string | null;
};

type ClassroomRow = Schema["Classroom"]["type"];
type ClassAnnualPlanRow = Schema["ClassAnnualPlan"]["type"];
type ClassQuarterPlanRow = Schema["ClassQuarterPlan"]["type"];
type ClassMonthPlanRow = Schema["ClassMonthPlan"]["type"];
type ClassWeekPlanRow = Schema["ClassWeekPlan"]["type"] & {
  abilityHealthD?: number | string | null;
  abilityHumanRelationsD?: number | string | null;
  abilityEnvironmentD?: number | string | null;
  abilityLanguageD?: number | string | null;
  abilityExpressionD?: number | string | null;
  goalTextC?: string | null;
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
    ClassAnnualPlan: ModelListApi<ClassAnnualPlanRow>;
    ClassQuarterPlan: ModelListApi<ClassQuarterPlanRow>;
    ClassMonthPlan: ModelListApi<ClassMonthPlanRow>;
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
  score: number;
  weakDomainKeys: DomainKey[];
  weakDomainLabels: string[];
  matchedAbilityCodes: string[];
  matchedAbilityNames: string[];
  observedThisWeek: boolean;
  observationCountInPeriod: number;
  abilityLinkCountInPeriod: number;
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

export type PlanContextBundle = {
  annualPlan: ClassAnnualPlanRow | null;
  quarterPlan: ClassQuarterPlanRow | null;
  monthPlan: ClassMonthPlanRow | null;
  weekPlan: ClassWeekPlanRow | null;

  goalTextA: string;
  goalTextB: string;
  goalTextC: string;
  goalTextWeek: string;

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

let abilityCodeRowsCache: AbilityCodeRow[] | null = null;
let abilityCodeRowsPromise: Promise<AbilityCodeRow[]> | null = null;

let practiceRecommendationMasterCache: PracticeRecommendationMaster | null =
  null;
let practiceRecommendationMasterPromise: Promise<PracticeRecommendationMaster> | null =
  null;

function buildEqFilter(field: string, value: string): Record<string, unknown> {
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
      nextToken,
    });

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

function normalizeNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeText(value?: string | null) {
  return String(value ?? "").trim();
}

function isTranscriptSourceKind(sourceKind?: string | null) {
  return normalizeText(sourceKind).toUpperCase() === "TRANSCRIPT";
}

function excludeTranscriptObservations(rows: ObservationRecordRow[]) {
  return rows.filter((row) => !isTranscriptSourceKind(row.sourceKind));
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
  let category = "";
  let currentCode = normalizedAbilityCode;

  for (let depth = 0; depth < 10 && currentCode; depth += 1) {
    const row = abilityCodeMap.get(currentCode);
    if (!row) break;

    const rowName = normalizeText(row.name);

    if (!abilityName && rowName) {
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

  if (!category && linkCategory) {
    const normalizedCategoryCode = normalizeAbilityCode(linkCategory);

    if (normalizedCategoryCode.length === 4) {
      const categoryRow = abilityCodeMap.get(normalizedCategoryCode);
      const categoryName = normalizeText(categoryRow?.name);
      if (categoryName) {
        category = categoryName;
      }
    }

    if (!category && !/^\d{4}$/.test(linkCategory)) {
      category = linkCategory;
    }
  }

  if (!abilityName) {
    const abilityRow = abilityCodeMap.get(normalizedAbilityCode);
    const rowName = normalizeText(abilityRow?.name);
    if (rowName) {
      abilityName = rowName;
    }
  }

  if (!domain) {
    const abilityRow = abilityCodeMap.get(normalizedAbilityCode);
    domain =
      (abilityRow ? resolveDomainFromAbilityRow(abilityRow) : undefined) ||
      domainFromAbilityPrefix(normalizedAbilityCode);
  }

  if (!category) {
    const categoryCode = categoryFromAbilityPrefix(normalizedAbilityCode);
    const categoryRow = abilityCodeMap.get(categoryCode);
    const categoryName = normalizeText(categoryRow?.name);

    category = categoryName || categoryCode;
  }

  const domainKey = detectDomainKey(domain, normalizedAbilityCode);

  return {
    abilityCode: normalizedAbilityCode || "(unknown)",
    abilityName:
      abilityName ||
      normalizeText(link.abilityName) ||
      normalizedAbilityCode ||
      "(名称未設定)",
    domain: domain || (domainKey ? domainLabel(domainKey) : "-"),
    category: category || "(category未設定)",
    domainKey,
  };
}

function buildAbilityDisplayMap(
  abilityLinks: ObservationAbilityLinkRow[],
  abilityCodeRows: AbilityCodeRow[],
): Record<string, AbilityDisplayMeta> {
  const abilityCodeMap = buildAbilityCodeMap(abilityCodeRows);
  const result: Record<string, AbilityDisplayMeta> = {};

  const representativeByCode = new Map<string, ObservationAbilityLinkRow>();

  for (const row of abilityLinks) {
    const code = normalizeAbilityCode(row.abilityCode);
    if (!code) continue;

    const current = representativeByCode.get(code);
    const currentHasName = current
      ? Boolean(normalizeText(current.abilityName))
      : false;
    const nextHasName = Boolean(normalizeText(row.abilityName));

    if (!current || (!currentHasName && nextHasName)) {
      representativeByCode.set(code, row);
    }
  }

  for (const [code, row] of representativeByCode.entries()) {
    result[code] = resolveAbilityDisplayMeta(row, abilityCodeMap);
  }

  return result;
}

function sortAbilityRows(rows: AbilityAggregateRow[]) {
  const order: DomainKey[] = [
    "health",
    "humanRelations",
    "environment",
    "language",
    "expression",
  ];

  return [...rows].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;

    const aKey = detectDomainKey(a.domain, a.abilityCode);
    const bKey = detectDomainKey(b.domain, b.abilityCode);

    const aOrder = aKey === null ? 999 : order.findIndex((x) => x === aKey);
    const bOrder = bKey === null ? 999 : order.findIndex((x) => x === bKey);

    if (aOrder !== bOrder) return aOrder - bOrder;

    const categoryDiff = a.category.localeCompare(b.category);
    if (categoryDiff !== 0) return categoryDiff;

    return a.abilityCode.localeCompare(b.abilityCode);
  });
}

function buildAbilitySummaries(
  abilityLinks: ObservationAbilityLinkRow[],
  abilityDisplayMap: Record<string, AbilityDisplayMeta>,
) {
  const domainCounts = emptyDomainCounts();
  const abilityMap = new Map<string, AbilityAggregateRow>();

  for (const row of abilityLinks) {
    const abilityCode = normalizeAbilityCode(row.abilityCode) || "(unknown)";
    const display = abilityDisplayMap[abilityCode] ?? {
      abilityCode,
      abilityName:
        normalizeText(row.abilityName) || abilityCode || "(名称未設定)",
      domain: normalizeText(row.domain) || domainFromAbilityPrefix(abilityCode),
      category:
        normalizeText(row.category) || categoryFromAbilityPrefix(abilityCode),
      domainKey: detectDomainKey(row.domain, abilityCode),
    };

    if (display.domainKey) {
      domainCounts[display.domainKey] += 1;
    }

    const key = `${display.domain}__${display.category}__${display.abilityCode}__${display.abilityName}`;
    const current = abilityMap.get(key) ?? {
      abilityCode: display.abilityCode,
      abilityName: display.abilityName,
      domain: display.domain,
      category: display.category,
      count: 0,
    };

    current.count += 1;
    abilityMap.set(key, current);
  }

  const abilityRows = sortAbilityRows([...abilityMap.values()]);

  const domainMap = new Map<
    string,
    {
      domainKey: DomainKey | null;
      domain: string;
      totalCount: number;
      categories: Map<string, AbilityCategoryGroup>;
    }
  >();

  for (const row of abilityRows) {
    const key = detectDomainKey(row.domain, row.abilityCode);
    const domainName = row.domain || (key ? domainLabel(key) : "-");

    const domainEntry = domainMap.get(domainName) ?? {
      domainKey: key,
      domain: domainName,
      totalCount: 0,
      categories: new Map<string, AbilityCategoryGroup>(),
    };

    domainEntry.totalCount += row.count;

    const categoryEntry = domainEntry.categories.get(row.category) ?? {
      category: row.category,
      totalCount: 0,
      rows: [],
    };

    categoryEntry.totalCount += row.count;
    categoryEntry.rows.push(row);

    domainEntry.categories.set(row.category, categoryEntry);
    domainMap.set(domainName, domainEntry);
  }

  const domainOrder: DomainKey[] = [
    "health",
    "humanRelations",
    "environment",
    "language",
    "expression",
  ];

  const abilityGroups: AbilityDomainGroup[] = [...domainMap.values()]
    .map((domainEntry) => ({
      domainKey: domainEntry.domainKey,
      domain: domainEntry.domain,
      totalCount: domainEntry.totalCount,
      categories: [...domainEntry.categories.values()]
        .map((categoryEntry) => ({
          category: categoryEntry.category,
          totalCount: categoryEntry.totalCount,
          rows: sortAbilityRows(categoryEntry.rows),
        }))
        .sort((a, b) => {
          if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
          return a.category.localeCompare(b.category);
        }),
    }))
    .sort((a, b) => {
      const aOrder =
        a.domainKey === null
          ? 999
          : domainOrder.findIndex((x) => x === a.domainKey);
      const bOrder =
        b.domainKey === null
          ? 999
          : domainOrder.findIndex((x) => x === b.domainKey);

      if (aOrder !== bOrder) return aOrder - bOrder;
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.domain.localeCompare(b.domain);
    });

  return {
    domainCounts,
    abilityRows,
    abilityGroups,
  };
}

function buildChildRows(observations: ObservationRecordRow[]) {
  const childMap = new Map<string, ChildAggregateRow>();

  for (const row of observations) {
    const childName = normalizeText(row.childName);
    if (!childName) continue;

    const current = childMap.get(childName) ?? {
      childName,
      count: 0,
    };
    current.count += 1;
    childMap.set(childName, current);
  }

  return [...childMap.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.childName.localeCompare(b.childName);
  });
}

function isPracticeCodeActiveLike(status?: string | null) {
  const value = normalizeText(status).toUpperCase();
  if (!value) return true;
  return value !== "ARCHIVED" && value !== "DELETED" && value !== "INACTIVE";
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
      const value: PracticeRecommendationMaster = {
        abilityPracticeLinks,
        abilityPracticeAggs,
        practiceCodeRows: practiceCodeRows.filter((row) =>
          isPracticeCodeActiveLike(row.status),
        ),
      };
      practiceRecommendationMasterCache = value;
      return value;
    })
    .finally(() => {
      practiceRecommendationMasterPromise = null;
    });

  return practiceRecommendationMasterPromise;
}

export function clearPracticeRecommendationCache() {
  practiceRecommendationMasterCache = null;
  practiceRecommendationMasterPromise = null;
}

function buildObservedAbilityCountMap(
  abilityLinks: ObservationAbilityLinkRow[],
): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of abilityLinks) {
    const code = normalizeAbilityCode(row.abilityCode);
    if (!code) continue;
    map.set(code, (map.get(code) ?? 0) + 1);
  }

  return map;
}

function buildPracticePeriodActivityMap(
  rows: PracticeImpactRow[],
): Map<string, PracticePeriodActivity> {
  const map = new Map<string, PracticePeriodActivity>();

  for (const row of rows) {
    const practiceCode = normalizeText(row.practiceCode);
    if (!practiceCode) continue;

    map.set(practiceCode, {
      practiceTitle: normalizeText(row.practiceTitle) || practiceCode,
      observationCount: normalizeNumber(row.observationCount),
      abilityLinkCount: normalizeNumber(row.abilityLinkCount),
    });
  }

  return map;
}

function buildPracticeCodeMap(rows: PracticeCodeRow[]) {
  const map = new Map<string, PracticeCodeRow>();

  for (const row of rows) {
    const code = normalizeText(row.practice_code);
    if (!code) continue;

    const current = map.get(code);
    if (!current) {
      map.set(code, row);
      continue;
    }

    const currentHasTenant = Boolean(normalizeText(current.tenantId));
    const nextHasTenant = Boolean(normalizeText(row.tenantId));

    if (!currentHasTenant && nextHasTenant) {
      map.set(code, row);
    }
  }

  return map;
}

function formatRecommendedPracticeLabel(row: RecommendedPracticeRow) {
  const title = normalizeText(row.practiceTitle);
  const code = normalizeText(row.practiceCode);

  if (title && title !== code) {
    return title;
  }

  return code;
}

function buildRecommendedPracticeNote(
  rows: RecommendedPracticeRow[],
  limit = 4,
) {
  if (rows.length === 0) {
    return "";
  }

  return `候補Practice: ${rows
    .slice(0, limit)
    .map((row) => formatRecommendedPracticeLabel(row))
    .join("、")}`;
}

function recommendPracticesForWeakDomains(args: {
  comparison: PlanActualComparison;
  observation: ObservationBundle;
  master: PracticeRecommendationMaster;
  limit?: number;
}): RecommendedPracticeRow[] {
  const { comparison, observation, master, limit = 5 } = args;

  const underRows = comparison.rows.filter((row) => row.status === "UNDER");
  if (underRows.length === 0) {
    return [];
  }

  const weakDomainKeySet = new Set<DomainKey>(
    underRows.map((row) => row.domainKey),
  );

  const gapWeightByDomain = new Map<DomainKey, number>(
    underRows.map((row) => [row.domainKey, 1 + Math.abs(row.gapShare) * 5]),
  );

  const observedAbilityCountMap = buildObservedAbilityCountMap(
    observation.abilityLinks,
  );
  const practicePeriodActivityMap = buildPracticePeriodActivityMap(
    observation.practiceRows,
  );
  const practiceCodeMap = buildPracticeCodeMap(master.practiceCodeRows);

  const aggByAbility = new Map<string, AbilityPracticeAggRow[]>();
  for (const row of master.abilityPracticeAggs) {
    const abilityCode = normalizeAbilityCode(row.abilityCode);
    if (!abilityCode) continue;
    const current = aggByAbility.get(abilityCode) ?? [];
    current.push(row);
    aggByAbility.set(abilityCode, current);
  }

  const linkByAbility = new Map<string, AbilityPracticeLinkRow[]>();
  for (const row of master.abilityPracticeLinks) {
    const abilityCode = normalizeAbilityCode(row.abilityCode);
    if (!abilityCode) continue;
    const current = linkByAbility.get(abilityCode) ?? [];
    current.push(row);
    linkByAbility.set(abilityCode, current);
  }

  const targetAbilities = observation.abilityCodeRows
    .map((row) => {
      const abilityCode = normalizeAbilityCode(row.code);
      if (!abilityCode) return null;
      if (!isLeafAbilityRow(row)) return null;

      const domainKey = detectDomainKey(row.domain, abilityCode);
      if (!domainKey || !weakDomainKeySet.has(domainKey)) return null;

      return {
        abilityCode,
        abilityName: normalizeText(row.name) || abilityCode,
        domainKey,
        domainLabel: domainLabel(domainKey),
        observedCount: observedAbilityCountMap.get(abilityCode) ?? 0,
      };
    })
    .filter(
      (
        value,
      ): value is {
        abilityCode: string;
        abilityName: string;
        domainKey: DomainKey;
        domainLabel: string;
        observedCount: number;
      } => Boolean(value),
    )
    .sort((a, b) => {
      if (a.observedCount !== b.observedCount) {
        return a.observedCount - b.observedCount;
      }
      return a.abilityCode.localeCompare(b.abilityCode);
    });

  if (targetAbilities.length === 0) {
    return [];
  }

  type WorkRow = {
    practiceCode: string;
    practiceTitle: string;
    rawScore: number;
    matchedAbilityCodes: Set<string>;
    matchedAbilityNames: Set<string>;
    weakDomainKeys: Set<DomainKey>;
    observedThisWeek: boolean;
    observationCountInPeriod: number;
    abilityLinkCountInPeriod: number;
  };

  const workMap = new Map<string, WorkRow>();

  const accumulate = (input: {
    practiceCode: string;
    baseScore: number;
    abilityCode: string;
    abilityName: string;
    domainKey: DomainKey;
  }) => {
    const { practiceCode, baseScore, abilityCode, abilityName, domainKey } =
      input;

    const periodActivity = practicePeriodActivityMap.get(practiceCode);
    const observedCount = observedAbilityCountMap.get(abilityCode) ?? 0;

    const deficitBoost =
      observedCount <= 0
        ? 2.4
        : observedCount === 1
          ? 1.8
          : observedCount === 2
            ? 1.3
            : 1.0;

    const gapWeight = gapWeightByDomain.get(domainKey) ?? 1;

    const alreadyObservedPenalty = periodActivity
      ? Math.max(
          0.45,
          1 -
            periodActivity.abilityLinkCount * 0.12 -
            periodActivity.observationCount * 0.08,
        )
      : 1.1;

    const contribution =
      baseScore * deficitBoost * gapWeight * alreadyObservedPenalty;

    const current = workMap.get(practiceCode) ?? {
      practiceCode,
      practiceTitle:
        normalizeText(practiceCodeMap.get(practiceCode)?.name) ||
        normalizeText(periodActivity?.practiceTitle) ||
        practiceCode,
      rawScore: 0,
      matchedAbilityCodes: new Set<string>(),
      matchedAbilityNames: new Set<string>(),
      weakDomainKeys: new Set<DomainKey>(),
      observedThisWeek: Boolean(periodActivity),
      observationCountInPeriod: periodActivity?.observationCount ?? 0,
      abilityLinkCountInPeriod: periodActivity?.abilityLinkCount ?? 0,
    };

    current.rawScore += contribution;
    current.matchedAbilityCodes.add(abilityCode);
    current.matchedAbilityNames.add(abilityName);
    current.weakDomainKeys.add(domainKey);

    workMap.set(practiceCode, current);
  };

  for (const ability of targetAbilities) {
    const aggRows = aggByAbility.get(ability.abilityCode) ?? [];

    if (aggRows.length > 0) {
      for (const row of aggRows) {
        const practiceCode = normalizeText(row.practiceCode);
        if (!practiceCode) continue;

        const baseScore =
          normalizeNumber(row.scoreSum) * 1.5 +
          normalizeNumber(row.scoreMax) * 2 +
          normalizeNumber(row.linkCount);

        if (baseScore <= 0) continue;

        accumulate({
          practiceCode,
          baseScore,
          abilityCode: ability.abilityCode,
          abilityName: ability.abilityName,
          domainKey: ability.domainKey,
        });
      }
      continue;
    }

    const linkRows = linkByAbility.get(ability.abilityCode) ?? [];
    for (const row of linkRows) {
      const practiceCode = normalizeText(row.practiceCode);
      if (!practiceCode) continue;

      const baseScore = Math.max(1, normalizeNumber(row.score) * 3);

      accumulate({
        practiceCode,
        baseScore,
        abilityCode: ability.abilityCode,
        abilityName: ability.abilityName,
        domainKey: ability.domainKey,
      });
    }
  }

  return [...workMap.values()]
    .map((row) => {
      const coverageBoost = 1 + Math.max(0, row.weakDomainKeys.size - 1) * 0.25;
      const score = row.rawScore * coverageBoost;
      const weakDomainKeys = [...row.weakDomainKeys.values()];
      const weakDomainLabels = weakDomainKeys.map((key) => domainLabel(key));

      return {
        practiceCode: row.practiceCode,
        practiceTitle: row.practiceTitle,
        score,
        weakDomainKeys,
        weakDomainLabels,
        matchedAbilityCodes: [...row.matchedAbilityCodes.values()],
        matchedAbilityNames: [...row.matchedAbilityNames.values()],
        observedThisWeek: row.observedThisWeek,
        observationCountInPeriod: row.observationCountInPeriod,
        abilityLinkCountInPeriod: row.abilityLinkCountInPeriod,
      } satisfies RecommendedPracticeRow;
    })
    .filter((row) => normalizeText(row.practiceCode) !== "(practice未設定)")
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.observedThisWeek !== b.observedThisWeek) {
        return a.observedThisWeek ? 1 : -1;
      }
      if (a.abilityLinkCountInPeriod !== b.abilityLinkCountInPeriod) {
        return a.abilityLinkCountInPeriod - b.abilityLinkCountInPeriod;
      }
      if (a.observationCountInPeriod !== b.observationCountInPeriod) {
        return a.observationCountInPeriod - b.observationCountInPeriod;
      }
      return a.practiceTitle.localeCompare(b.practiceTitle);
    })
    .slice(0, limit);
}

export async function loadObservationBundle(
  client: ReportingClient,
  classroomId: string,
  fromDate: string,
  toDate: string,
): Promise<ObservationBundle> {
  const rawObservations = await listAll(client.models.ObservationRecord, {
    filter: {
      and: [
        buildEqFilter("classroomId", classroomId),
        ...buildDateRangeFilters(fromDate, toDate),
        buildEqFilter("status", "ACTIVE"),
      ],
    },
  });

  const abilityLinks = await listAll(client.models.ObservationAbilityLink, {
    filter: {
      and: [
        buildEqFilter("classroomId", classroomId),
        ...buildDateRangeFilters(fromDate, toDate),
        buildEqFilter("status", "ACTIVE"),
      ],
    },
  });

  const abilityCodeRows = await loadAbilityCodeRows(client);

  const observations = excludeTranscriptObservations(rawObservations);
  const abilityDisplayMap = buildAbilityDisplayMap(
    abilityLinks,
    abilityCodeRows,
  );
  const { domainCounts, abilityRows, abilityGroups } = buildAbilitySummaries(
    abilityLinks,
    abilityDisplayMap,
  );
  const childRows = buildChildRows(observations);
  const evidenceRows = buildEvidenceRows(observations, abilityLinks);
  const practiceRows = buildPracticeImpactRows({
    observations,
    abilityLinks,
  });

  return {
    observations,
    abilityLinks,
    domainCounts,
    abilityRows,
    abilityGroups,
    childRows,
    evidenceRows,
    practiceRows,
    abilityDisplayMap,
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

  const abilityLinks = bundle.abilityLinks.filter(
    (row) => abilityLinkChildName(row) === normalizedChildName,
  );

  const { domainCounts, abilityRows, abilityGroups } = buildAbilitySummaries(
    abilityLinks,
    bundle.abilityDisplayMap,
  );

  const childRows: ChildAggregateRow[] =
    normalizedChildName === ""
      ? []
      : [
          {
            childName: normalizedChildName,
            count: observations.length,
          },
        ];

  const evidenceRows = buildEvidenceRows(observations, abilityLinks);
  const practiceRows = buildPracticeImpactRows({
    observations,
    abilityLinks,
  });

  return {
    observations,
    abilityLinks,
    domainCounts,
    abilityRows,
    abilityGroups,
    childRows,
    evidenceRows,
    practiceRows,
    abilityDisplayMap: bundle.abilityDisplayMap,
    abilityCodeRows: bundle.abilityCodeRows,
  };
}

function sumDomainCounts(value: DomainCounts) {
  return (
    value.health +
    value.humanRelations +
    value.environment +
    value.language +
    value.expression
  );
}

function toPlanDomainCountsFromMonth(
  monthPlan?: ClassMonthPlanRow | null,
): DomainCounts {
  return {
    health: Number(monthPlan?.abilityHealthC ?? 0),
    humanRelations: Number(monthPlan?.abilityHumanRelationsC ?? 0),
    environment: Number(monthPlan?.abilityEnvironmentC ?? 0),
    language: Number(monthPlan?.abilityLanguageC ?? 0),
    expression: Number(monthPlan?.abilityExpressionC ?? 0),
  };
}

function toPlanDomainCountsFromWeek(
  weekPlan?: ClassWeekPlanRow | null,
): DomainCounts {
  return {
    health: Number(weekPlan?.abilityHealthD ?? 0),
    humanRelations: Number(weekPlan?.abilityHumanRelationsD ?? 0),
    environment: Number(weekPlan?.abilityEnvironmentD ?? 0),
    language: Number(weekPlan?.abilityLanguageD ?? 0),
    expression: Number(weekPlan?.abilityExpressionD ?? 0),
  };
}

function overlaps(
  periodStart?: string | null,
  periodEnd?: string | null,
  fromDate?: string | null,
  toDate?: string | null,
) {
  const start = normalizeText(periodStart);
  const end = normalizeText(periodEnd);
  const from = normalizeText(fromDate);
  const to = normalizeText(toDate);

  if (!from || !to) return false;

  const normalizedStart = start || "0000-01-01";
  const normalizedEnd = end || "9999-12-31";

  return normalizedStart <= to && normalizedEnd >= from;
}

function pickBestOverlapping<
  T extends { periodStart?: string | null; periodEnd?: string | null },
>(rows: T[], fromDate: string, toDate: string): T | null {
  const candidates = rows.filter((row) =>
    overlaps(row.periodStart, row.periodEnd, fromDate, toDate),
  );

  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((a, b) => {
    const aStart = normalizeText(a.periodStart);
    const bStart = normalizeText(b.periodStart);
    const startDiff = bStart.localeCompare(aStart);
    if (startDiff !== 0) return startDiff;

    const aEnd = normalizeText(a.periodEnd);
    const bEnd = normalizeText(b.periodEnd);
    return bEnd.localeCompare(aEnd);
  })[0];
}

export async function loadPlanContext(
  client: ReportingClient,
  classroomId: string,
  fromDate: string,
  toDate: string,
): Promise<PlanContextBundle> {
  const annualPlans = await listAll(client.models.ClassAnnualPlan, {
    filter: buildEqFilter("classroomId", classroomId),
  });

  const annualPlan = pickBestOverlapping(annualPlans, fromDate, toDate);

  let quarterPlan: ClassQuarterPlanRow | null = null;
  let monthPlan: ClassMonthPlanRow | null = null;
  let weekPlan: ClassWeekPlanRow | null = null;

  if (annualPlan?.id) {
    const quarterPlans = await listAll(client.models.ClassQuarterPlan, {
      filter: buildEqFilter("classAnnualPlanId", annualPlan.id),
    });

    quarterPlan = pickBestOverlapping(quarterPlans, fromDate, toDate);

    if (quarterPlan?.id) {
      const monthPlans = await listAll(client.models.ClassMonthPlan, {
        filter: buildEqFilter("classQuarterPlanId", quarterPlan.id),
      });

      monthPlan = pickBestOverlapping(monthPlans, fromDate, toDate);

      if (monthPlan?.id) {
        const weekPlans = await listAll(client.models.ClassWeekPlan, {
          filter: buildEqFilter("classMonthPlanId", monthPlan.id),
        });

        weekPlan = pickBestOverlapping(weekPlans, fromDate, toDate);
      }
    }
  }

  const plannedDomainsMonth = toPlanDomainCountsFromMonth(monthPlan);
  const plannedDomainsWeek = weekPlan
    ? toPlanDomainCountsFromWeek(weekPlan)
    : null;

  const hasWeekPlan =
    Boolean(weekPlan) &&
    sumDomainCounts(plannedDomainsWeek ?? emptyDomainCounts()) > 0;

  const hasMonthPlan =
    Boolean(monthPlan) && sumDomainCounts(plannedDomainsMonth) > 0;

  let plannedDomainsPrimary = emptyDomainCounts();
  let planBasis: PlanBasis = "NONE";

  if (hasWeekPlan) {
    plannedDomainsPrimary = plannedDomainsWeek ?? emptyDomainCounts();
    planBasis = "WEEK";
  } else if (hasMonthPlan) {
    plannedDomainsPrimary = plannedDomainsMonth;
    planBasis = "MONTH";
  }

  return {
    annualPlan,
    quarterPlan,
    monthPlan,
    weekPlan,
    goalTextA: normalizeText(annualPlan?.goalTextA),
    goalTextB: normalizeText(quarterPlan?.goalTextB),
    goalTextC: normalizeText(monthPlan?.goalTextC),
    goalTextWeek: normalizeText(weekPlan?.goalTextC),
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
  const plannedTotal = sumDomainCounts(plannedDomains);
  const actualTotal = sumDomainCounts(actualDomains);

  const domainKeys: DomainKey[] = [
    "health",
    "humanRelations",
    "environment",
    "language",
    "expression",
  ];

  const rows: DomainComparisonRow[] = domainKeys.map((key) => {
    const plannedValue = plannedDomains[key];
    const actualValue = actualDomains[key];

    const plannedShare = plannedTotal > 0 ? plannedValue / plannedTotal : 0;
    const actualShare = actualTotal > 0 ? actualValue / actualTotal : 0;
    const gapShare = actualShare - plannedShare;

    let status: DomainComparisonStatus = "ALIGNED";

    if (plannedTotal <= 0) {
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

  if (plannedTotal <= 0) {
    summaryStatus = "NO_PLAN";
  } else if (
    rows.some((row) => row.status === "OVER" || row.status === "UNDER")
  ) {
    summaryStatus = "MIXED";
  }

  const sortedByGap = [...rows]
    .filter((row) => row.status === "OVER" || row.status === "UNDER")
    .sort((a, b) => Math.abs(b.gapShare) - Math.abs(a.gapShare));

  const highlights =
    sortedByGap.length === 0
      ? summaryStatus === "NO_PLAN"
        ? ["計画値が未設定のため、定量比較は参考表示です。"]
        : ["5領域の構成比は概ね計画通りです。"]
      : sortedByGap.slice(0, 3).map((row) => {
          if (row.status === "OVER") {
            return `${row.domainLabel}は計画比で強く現れました。`;
          }
          return `${row.domainLabel}は計画比で弱く、次の補強候補です。`;
        });

  return {
    basis,
    rows,
    summaryStatus,
    highlights,
  };
}

export function buildPlanReflection(args: {
  planContext: PlanContextBundle;
  comparison: PlanActualComparison;
  observation: ObservationBundle;
  recommendedPracticeRows?: RecommendedPracticeRow[];
}): PlanReflection {
  const {
    planContext,
    comparison,
    observation,
    recommendedPracticeRows = [],
  } = args;

  const alignmentNotes: string[] = [];
  const gapNotes: string[] = [];
  const nextActionNotes: string[] = [];

  if (planContext.goalTextA) {
    alignmentNotes.push(`年の目標(A): ${planContext.goalTextA}`);
  }
  if (planContext.goalTextB) {
    alignmentNotes.push(`期の目標(B): ${planContext.goalTextB}`);
  }
  if (planContext.goalTextC) {
    alignmentNotes.push(`月の目標(C): ${planContext.goalTextC}`);
  }

  const alignedRows = comparison.rows.filter((row) => row.status === "ALIGNED");
  const underRows = comparison.rows.filter((row) => row.status === "UNDER");
  const overRows = comparison.rows.filter((row) => row.status === "OVER");

  if (alignedRows.length > 0 && comparison.summaryStatus !== "NO_PLAN") {
    alignmentNotes.push(
      `計画と整合していた領域: ${alignedRows
        .map((row) => row.domainLabel)
        .join("、")}`,
    );
  }

  if (observation.practiceRows.length > 0) {
    const topPractices = observation.practiceRows
      .slice(0, 3)
      .map((row) => row.practiceTitle)
      .join("、");
    alignmentNotes.push(`主に確認された Practice: ${topPractices}`);
  }

  if (underRows.length > 0) {
    underRows.forEach((row) => {
      gapNotes.push(
        `${row.domainLabel}は計画比で弱く、planned=${row.plannedValue} / actual=${row.actualValue} でした。`,
      );
    });
  }

  if (overRows.length > 0) {
    overRows.forEach((row) => {
      gapNotes.push(
        `${row.domainLabel}は計画比で強く現れ、planned=${row.plannedValue} / actual=${row.actualValue} でした。`,
      );
    });
  }

  if (comparison.summaryStatus === "NO_PLAN") {
    gapNotes.push(
      "週または月の5領域計画値が未設定のため、定量比較は参考表示です。",
    );
  }

  if (underRows.length > 0) {
    nextActionNotes.push(
      `${underRows
        .map((row) => row.domainLabel)
        .join("、")} を意識した Practice と記録場面を次週で補強する。`,
    );

    const recommendedNote = buildRecommendedPracticeNote(
      recommendedPracticeRows,
      4,
    );

    if (recommendedNote) {
      nextActionNotes.push(recommendedNote);
    } else if (observation.practiceRows.length === 0) {
      nextActionNotes.push(
        "Practice と観察記録の蓄積を進め、計画との比較精度を高める。",
      );
    } else {
      nextActionNotes.push(
        "観察が多かった Practice を継続しつつ、目標との乖離が大きい領域へ接続する。",
      );
    }
  } else if (observation.practiceRows.length === 0) {
    nextActionNotes.push(
      "Practice と観察記録の蓄積を進め、計画との比較精度を高める。",
    );
  } else {
    nextActionNotes.push(
      "観察が多かった Practice を継続しつつ、計画と実践のつながりを維持する。",
    );
  }

  if (nextActionNotes.length === 0) {
    nextActionNotes.push(
      "次週も計画と実践のつながりを意識しながら記録を継続する。",
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

function buildDomainSummaryLine(domainCounts: DomainCounts) {
  const ordered: DomainKey[] = [
    "health",
    "humanRelations",
    "environment",
    "language",
    "expression",
  ];

  return ordered
    .map((key) => `${domainLabel(key)} ${domainCounts[key]}件`)
    .join(" / ");
}

function buildTopAbilitiesLine(rows: AbilityAggregateRow[], limit = 5) {
  if (rows.length === 0) return "該当なし";
  return rows
    .slice(0, limit)
    .map((row) => `${row.abilityName}（${row.count}件）`)
    .join("、");
}

function buildTopChildrenLine(rows: ChildAggregateRow[], limit = 5) {
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
  ].join("\n");
}

export function buildChildWeekendMarkdown(args: {
  classroomName: string;
  childName: string;
  fromDate: string;
  toDate: string;
  bundle: ObservationBundle;
}) {
  const { classroomName, childName, fromDate, toDate, bundle } = args;

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
