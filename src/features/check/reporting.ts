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
  count: number;
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
    ClassAnnualPlan: ModelListApi<ClassAnnualPlanRow>;
    ClassQuarterPlan: ModelListApi<ClassQuarterPlanRow>;
    ClassMonthPlan: ModelListApi<ClassMonthPlanRow>;
    ClassWeekPlan: ModelListApi<ClassWeekPlanRow>;
    ReportArtifact: ModelCreateUpdateApi<ReportArtifactRow>;
  };
};

export type ObservationBundle = {
  observations: ObservationRecordRow[];
  abilityLinks: ObservationAbilityLinkRow[];
  domainCounts: DomainCounts;
  abilityRows: AbilityAggregateRow[];
  childRows: ChildAggregateRow[];
  evidenceRows: EvidenceRow[];
  practiceRows: PracticeImpactRow[];
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
};

export type CheckActionReportBundle = {
  observation: ObservationBundle;
  planContext: PlanContextBundle;
  comparison: PlanActualComparison;
  reflection: PlanReflection;
};

type ReportType = "CLASS_WEEKLY" | "CHILD_WEEKLY";

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

export function normalizeText(value?: string | null) {
  return String(value ?? "").trim();
}

export function normalizeAbilityCode(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const noDecimal = raw.replace(/\.0+$/, "");
  const digitsOnly = noDecimal.replace(/[^\d]/g, "");
  return digitsOnly || noDecimal;
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

export function buildPracticeImpactRows(args: {
  observations: ObservationRecordRow[];
  abilityLinks: ObservationAbilityLinkRow[];
}) {
  const { observations, abilityLinks } = args;

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
      title:
        normalizeText(obs.title) ||
        normalizeText(obs.practiceTitleSnapshot) ||
        practiceCode,
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

export async function loadObservationBundle(
  client: ReportingClient,
  classroomId: string,
  fromDate: string,
  toDate: string,
): Promise<ObservationBundle> {
  const observations = await listAll(client.models.ObservationRecord, {
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

  const domainCounts = emptyDomainCounts();

  const abilityMap = new Map<string, AbilityAggregateRow>();
  const childMap = new Map<string, ChildAggregateRow>();

  for (const row of abilityLinks) {
    const domainKey = detectDomainKey(row.domain, row.abilityCode);
    if (domainKey) {
      domainCounts[domainKey] += 1;
    }

    const abilityCode = normalizeText(row.abilityCode) || "(unknown)";
    const abilityName = normalizeText(row.abilityName) || "(名称未設定)";
    const domain = normalizeText(row.domain) || "-";
    const key = `${abilityCode}__${abilityName}`;

    const current = abilityMap.get(key) ?? {
      abilityCode,
      abilityName,
      domain,
      count: 0,
    };

    current.count += 1;
    abilityMap.set(key, current);
  }

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

  const abilityRows = [...abilityMap.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.abilityCode.localeCompare(b.abilityCode);
  });

  const childRows = [...childMap.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.childName.localeCompare(b.childName);
  });

  const evidenceRows = [...observations]
    .sort((a, b) =>
      String(b.recordedAt ?? "").localeCompare(String(a.recordedAt ?? "")),
    )
    .map((row) => ({
      id: String(row.id ?? ""),
      recordedAt: String(row.recordedAt ?? ""),
      childName: normalizeText(row.childName) || "(クラス全体)",
      title:
        normalizeText(row.title) ||
        normalizeText(row.practiceTitleSnapshot) ||
        normalizeText(row.practiceCode) ||
        "(タイトルなし)",
      body: normalizeText(row.body),
      sourceKind: normalizeText(row.sourceKind) || "-",
      practiceCode: normalizeText(row.practiceCode) || "-",
    }));

  const practiceRows = buildPracticeImpactRows({
    observations,
    abilityLinks,
  });

  return {
    observations,
    abilityLinks,
    domainCounts,
    abilityRows,
    childRows,
    evidenceRows,
    practiceRows,
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

  const domainCounts = emptyDomainCounts();

  for (const row of abilityLinks) {
    const key = detectDomainKey(row.domain, row.abilityCode);
    if (key) {
      domainCounts[key] += 1;
    }
  }

  const abilityMap = new Map<string, AbilityAggregateRow>();
  for (const row of abilityLinks) {
    const abilityCode = normalizeText(row.abilityCode) || "(unknown)";
    const abilityName = normalizeText(row.abilityName) || "(名称未設定)";
    const domain = normalizeText(row.domain) || "-";
    const key = `${abilityCode}__${abilityName}`;

    const current = abilityMap.get(key) ?? {
      abilityCode,
      abilityName,
      domain,
      count: 0,
    };
    current.count += 1;
    abilityMap.set(key, current);
  }

  const abilityRows = [...abilityMap.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.abilityCode.localeCompare(b.abilityCode);
  });

  const childRows: ChildAggregateRow[] =
    normalizedChildName === ""
      ? []
      : [
          {
            childName: normalizedChildName,
            count: observations.length,
          },
        ];

  const evidenceRows = [...observations]
    .sort((a, b) =>
      String(b.recordedAt ?? "").localeCompare(String(a.recordedAt ?? "")),
    )
    .map((row) => ({
      id: String(row.id ?? ""),
      recordedAt: String(row.recordedAt ?? ""),
      childName: normalizeText(row.childName) || "(クラス全体)",
      title:
        normalizeText(row.title) ||
        normalizeText(row.practiceTitleSnapshot) ||
        normalizeText(row.practiceCode) ||
        "(タイトルなし)",
      body: normalizeText(row.body),
      sourceKind: normalizeText(row.sourceKind) || "-",
      practiceCode: normalizeText(row.practiceCode) || "-",
    }));

  const practiceRows = buildPracticeImpactRows({
    observations,
    abilityLinks,
  });

  return {
    observations,
    abilityLinks,
    domainCounts,
    abilityRows,
    childRows,
    evidenceRows,
    practiceRows,
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
    } else {
      status = "ALIGNED";
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
}): PlanReflection {
  const { planContext, comparison, observation } = args;

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
  }

  if (observation.practiceRows.length === 0) {
    nextActionNotes.push(
      "Practice と観察記録の蓄積を進め、計画との比較精度を高める。",
    );
  } else {
    nextActionNotes.push(
      "観察が多かった Practice を継続しつつ、目標との乖離が大きい領域へ接続する。",
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
  const reflection = buildPlanReflection({
    planContext,
    comparison,
    observation,
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

  const lines: string[] = [];

  rows.slice(0, limit).forEach((row) => {
    lines.push(`- ${row.practiceTitle}（${row.practiceCode}）`);
    lines.push(
      `  - 観察: ${row.observationCount}件 / AbilityLink: ${row.abilityLinkCount}件`,
    );
    lines.push(
      `  - 5領域: 健康 ${row.domainCounts.health} / 人間関係 ${row.domainCounts.humanRelations} / 環境 ${row.domainCounts.environment} / 言葉 ${row.domainCounts.language} / 表現 ${row.domainCounts.expression}`,
    );
    lines.push(
      `  - 子ども: ${
        row.childNames.length > 0
          ? row.childNames.join("、")
          : "（クラス全体中心）"
      }`,
    );
  });

  return lines;
}

function buildComparisonMarkdownLines(comparison: PlanActualComparison) {
  if (comparison.rows.length === 0) {
    return ["- 比較データなし"];
  }

  const lines: string[] = [];

  comparison.rows.forEach((row) => {
    lines.push(
      `- ${row.domainLabel}: plan=${row.plannedValue} / actual=${row.actualValue} / 判定=${comparisonStatusLabel(
        row.status,
      )} / plan比率=${formatSharePercent(
        row.plannedShare,
      )} / actual比率=${formatSharePercent(row.actualShare)}`,
    );
  });

  return lines;
}

export function buildClassWeeklyMarkdown(args: {
  classroomName: string;
  fromDate: string;
  toDate: string;
  bundle: CheckActionReportBundle;
}) {
  const { classroomName, fromDate, toDate, bundle } = args;
  const observation = bundle.observation;
  const topEpisodes = observation.evidenceRows.slice(0, 5);

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
    `よく見られた育ちは、${buildTopAbilitiesLine(
      observation.abilityRows,
      5,
    )} でした。`,
    `観察件数の多かった子どもは、${buildTopChildrenLine(
      observation.childRows,
      5,
    )} でした。`,
    ``,
    `## 5領域の計画値と実績値`,
    ...buildComparisonMarkdownLines(bundle.comparison),
    ``,
    `## 今週実施した Practice と育ちへのつながり`,
    ...buildPracticeMarkdownLines(observation.practiceRows, 10),
    ``,
    `## 5領域の観察件数`,
    `- 健康: ${observation.domainCounts.health}件`,
    `- 人間関係: ${observation.domainCounts.humanRelations}件`,
    `- 環境: ${observation.domainCounts.environment}件`,
    `- 言葉: ${observation.domainCounts.language}件`,
    `- 表現: ${observation.domainCounts.expression}件`,
    ``,
    `## よく見られた育ち（上位）`,
    ...(observation.abilityRows.length === 0
      ? ["- 該当なし"]
      : observation.abilityRows
          .slice(0, 10)
          .map(
            (row) =>
              `- ${row.abilityCode} / ${row.abilityName} / ${row.domain} / ${row.count}件`,
          )),
    ``,
    `## 子ども別観察件数`,
    ...(observation.childRows.length === 0
      ? ["- 該当なし"]
      : observation.childRows
          .slice(0, 10)
          .map((row) => `- ${row.childName}: ${row.count}件`)),
    ``,
    `## 今週の代表エピソード`,
    ...(topEpisodes.length === 0
      ? ["- 該当なし"]
      : topEpisodes.map(
          (row) =>
            `- ${formatDateTime(row.recordedAt)} / ${row.childName} / ${
              row.title
            } / ${truncateText(row.body, 120) || "(本文なし)"}`,
        )),
    ``,
    `## 考察（整合していた点）`,
    ...(bundle.reflection.alignmentNotes.length === 0
      ? ["- 該当なし"]
      : bundle.reflection.alignmentNotes.map((row) => `- ${row}`)),
    ``,
    `## 考察（乖離していた点）`,
    ...(bundle.reflection.gapNotes.length === 0
      ? ["- 該当なし"]
      : bundle.reflection.gapNotes.map((row) => `- ${row}`)),
    ``,
    `## 次週への action`,
    ...(bundle.reflection.nextActionNotes.length === 0
      ? ["- 該当なし"]
      : bundle.reflection.nextActionNotes.map((row) => `- ${row}`)),
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

  const headline =
    bundle.observations.length === 0
      ? `${childName}さんに関する今週の観察記録はまだありません。`
      : `${childName}さんについて、今週は ${bundle.observations.length} 件の観察が記録されました。`;

  const topEpisodes = bundle.evidenceRows.slice(0, 5);
  const topAbilityNames = bundle.abilityRows
    .slice(0, 3)
    .map((row) => row.abilityName);

  return [
    `# ${childName}さん 週末だより`,
    ``,
    `- クラス: ${classroomName}`,
    `- 期間: ${formatDate(fromDate)} 〜 ${formatDate(toDate)}`,
    `- 観察件数: ${bundle.observations.length}件`,
    `- 5領域件数: ${buildDomainSummaryLine(bundle.domainCounts)}`,
    ``,
    `## 今週のようす`,
    headline,
    topAbilityNames.length === 0
      ? `${childName}さんの様子は、これからの記録蓄積でより詳しく見えてきます。`
      : `${childName}さんは、${topAbilityNames.join(
          "、",
        )} に関わる姿が特に多く見られました。`,
    ``,
    `## 今週関わった Practice`,
    ...buildPracticeMarkdownLines(bundle.practiceRows, 8),
    ``,
    `## 育ちのポイント`,
    ...(bundle.abilityRows.length === 0
      ? ["- 該当なし"]
      : bundle.abilityRows
          .slice(0, 8)
          .map(
            (row) => `- ${row.abilityName}（${row.domain}）: ${row.count}件`,
          )),
    ``,
    `## 印象的だった場面`,
    ...(topEpisodes.length === 0
      ? ["- 該当なし"]
      : topEpisodes.map(
          (row) =>
            `- ${row.title} / ${truncateText(row.body, 120) || "(本文なし)"}`,
        )),
    ``,
    `## ご家庭への共有`,
    bundle.observations.length === 0
      ? `今週はまだ記録が少ないため、来週以降も丁寧に様子を見てまいります。`
      : `${childName}さんの興味や関わりが、園で少しずつ広がっている様子が見られました。来週も安心して過ごしながら、${
          topAbilityNames.length > 0 ? topAbilityNames[0] : "その子らしい姿"
        } につながる経験を大切にしていきます。`,
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
}) {
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
