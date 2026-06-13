import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import {
  detectDomainKey,
  domainLabel,
  emptyDomainCounts,
  formatSharePercent,
  normalizeAbilityCode,
  truncateText,
  type DomainCounts,
  type DomainKey,
} from "./reporting";

type Props = {
  owner: string;
  tenantId: string;
};

type CategoryFilter =
  | "environment"
  | "outdoor"
  | "indoor"
  | "life"
  | "event"
  | "all";

type GraphqlErrorLike = {
  message?: string | null;
};

type ListResult<T> = {
  data?: T[] | null;
  nextToken?: string | null;
  errors?: GraphqlErrorLike[] | null;
};

type ListArgs = {
  authMode: "userPool";
  limit?: number;
  nextToken?: string | null;
  filter?: Record<string, unknown>;
};

type PracticeCodeRow = Schema["PracticeCode"]["type"] & {
  id?: string | null;
  practice_code?: string | null;
  category_code?: string | null;
  category_name?: string | null;
  name?: string | null;
  memo?: string | null;
  status?: string | null;
  tenantId?: string | null;
  visibility?: string | null;
  publishScope?: string | null;
  practiceCategory?: string | null;
  transcriptText?: string | null;
};

type AbilityPracticeLinkRow = Schema["AbilityPracticeLink"]["type"] & {
  abilityCode?: string | null;
  practiceCode?: string | null;
  score?: number | null;
};

type AbilityPracticeAggRow = Schema["AbilityPracticeAgg"]["type"] & {
  id?: string | null;
  abilityCode?: string | null;
  practiceCode?: string | null;
  scoreSum?: number | null;
  scoreMax?: number | null;
  linkCount?: number | null;
  level?: number | null;
};

type AbilityCodeRow = Schema["AbilityCode"]["type"] & {
  code?: string | null;
  name?: string | null;
  parent_code?: string | null;
  level?: number | null;
  domain?: string | null;
  category?: string | null;
  is_leaf?: boolean | null;
  status?: string | null;
};

type AbilityMeta = {
  abilityCode: string;
  abilityName: string;
  domain: string;
  category: string;
  domainKey: DomainKey | null;
};

type PracticeScoreRow = {
  practiceCode: string;
  practiceTitle: string;
  categoryLabel: string;
  memo: string;
  status: string;
  domainCounts: DomainCounts;
  totalScore: number;
  abilityCount: number;
  abilityNames: string[];
};

type AbilityScoreRow = AbilityMeta & {
  score: number;
  practiceCodes: string[];
};

type AbilityCategoryGroup = {
  category: string;
  totalScore: number;
  rows: AbilityScoreRow[];
};

type AbilityDomainGroup = {
  domainKey: DomainKey | null;
  domain: string;
  totalScore: number;
  categories: AbilityCategoryGroup[];
};

type DomainJudgementRow = {
  domainKey: DomainKey;
  label: string;
  score: number;
  share: number;
  targetShare: number;
  gapShare: number;
  status: "UNDER" | "OVER" | "ALIGNED" | "NO_DATA";
};

type RecommendedEnvironmentPracticeRow = {
  practiceCode: string;
  practiceTitle: string;
  categoryLabel: string;
  memo: string;
  score: number;
  weakDomainKeys: DomainKey[];
  weakDomainLabels: string[];
  matchedAbilityCodes: string[];
  matchedAbilityNames: string[];
};

const DOMAIN_KEYS: DomainKey[] = [
  "health",
  "humanRelations",
  "environment",
  "language",
  "expression",
];

const CATEGORY_OPTIONS: Array<{ value: CategoryFilter; label: string }> = [
  { value: "environment", label: "環境構成" },
  { value: "outdoor", label: "外遊び" },
  { value: "indoor", label: "室内遊び" },
  { value: "life", label: "生活" },
  { value: "event", label: "行事" },
  { value: "all", label: "すべて" },
];

const TARGET_SHARE = 0.2;
const GAP_THRESHOLD = 0.08;

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function n(value: unknown, fallback = 0): number {
  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeStatus(value?: string | null): string {
  return s(value || "active").toUpperCase();
}

function isActivePractice(row: PracticeCodeRow): boolean {
  const status = normalizeStatus(row.status);
  return status !== "ARCHIVED" && status !== "DELETED";
}

function practiceCodeOf(row: PracticeCodeRow): string {
  return s(row.practice_code);
}

function practiceTitleOf(row: PracticeCodeRow): string {
  return s(row.name) || practiceCodeOf(row) || "(Practice名未設定)";
}

function categoryLabelOf(row: PracticeCodeRow): string {
  return s(row.category_name) || s(row.practiceCategory) || "-";
}

function practiceMemoOf(row: PracticeCodeRow): string {
  return s(row.memo) || truncateText(row.transcriptText, 180);
}

function categoryMatches(
  row: PracticeCodeRow,
  filter: CategoryFilter,
): boolean {
  if (filter === "all") return true;

  const category = s(row.practiceCategory).toLowerCase();
  const categoryName = s(row.category_name).toLowerCase();
  const categoryCode = s(row.category_code).toLowerCase();
  const label = `${category} ${categoryName} ${categoryCode}`;

  if (category === filter) return true;

  switch (filter) {
    case "environment":
      return label.includes("environment") || label.includes("環境");
    case "outdoor":
      return label.includes("outdoor") || label.includes("外遊び");
    case "indoor":
      return label.includes("indoor") || label.includes("室内");
    case "life":
      return label.includes("life") || label.includes("生活");
    case "event":
      return label.includes("event") || label.includes("行事");
    default:
      return false;
  }
}

function errorText(errors?: GraphqlErrorLike[] | null): string {
  const messages = (errors ?? [])
    .map((error) => s(error.message))
    .filter(Boolean);
  return messages.join("\n") || "GraphQL request failed.";
}

async function listAll<T, TArgs>(
  listFn: (args: TArgs) => Promise<ListResult<T>>,
  args?: Partial<Omit<ListArgs, "authMode" | "limit" | "nextToken">>,
): Promise<T[]> {
  const rows: T[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const request = {
      authMode: "userPool",
      limit: 1000,
      ...(args ?? {}),
      nextToken,
    } satisfies ListArgs;

    const result = await listFn(request as unknown as TArgs);

    if (result.errors?.length) {
      throw new Error(errorText(result.errors));
    }

    rows.push(...(result.data ?? []));
    nextToken = result.nextToken ?? null;
  } while (nextToken);

  return rows;
}

function addDomainValue(counts: DomainCounts, key: DomainKey, value: number) {
  counts[key] += value;
}

function sumDomainCounts(counts: DomainCounts): number {
  return DOMAIN_KEYS.reduce((sum, key) => sum + counts[key], 0);
}

function buildAbilityCodeMap(rows: AbilityCodeRow[]) {
  const map = new Map<string, AbilityCodeRow>();

  for (const row of rows) {
    const code = normalizeAbilityCode(row.code);
    if (code && !map.has(code)) {
      map.set(code, row);
    }
  }

  return map;
}

function fallbackDomainLabel(abilityCode: string): string {
  const key = detectDomainKey(undefined, abilityCode);
  return key ? domainLabel(key) : "-";
}

function fallbackCategoryLabel(abilityCode: string): string {
  return normalizeAbilityCode(abilityCode).slice(0, 4) || "(category未設定)";
}

function resolveAbilityMeta(
  abilityCode: string,
  abilityCodeMap: Map<string, AbilityCodeRow>,
): AbilityMeta {
  const normalizedAbilityCode = normalizeAbilityCode(abilityCode);

  let abilityName = "";
  let domain = "";
  let category = "";
  let currentCode = normalizedAbilityCode;

  for (let depth = 0; depth < 10 && currentCode; depth += 1) {
    const row = abilityCodeMap.get(currentCode);
    if (!row) break;

    const rowName = s(row.name);
    const level = n(row.level);

    if (!abilityName && rowName && (row.is_leaf || level >= 3 || depth === 0)) {
      abilityName = rowName;
    }

    if (!domain) {
      domain = s(row.domain);
      if (!domain && level === 1 && rowName) {
        domain = rowName;
      }
    }

    if (!category) {
      category = s(row.category);
      if (!category && depth > 0 && (level === 2 || currentCode.length === 4)) {
        category = rowName;
      }
    }

    const parentCode = normalizeAbilityCode(row.parent_code);
    if (!parentCode || parentCode === currentCode) break;

    currentCode = parentCode;
  }

  if (!abilityName) abilityName = normalizedAbilityCode || "(Ability未設定)";
  if (!domain) domain = fallbackDomainLabel(normalizedAbilityCode);
  if (!category) category = fallbackCategoryLabel(normalizedAbilityCode);

  return {
    abilityCode: normalizedAbilityCode,
    abilityName,
    domain,
    category,
    domainKey: detectDomainKey(domain, normalizedAbilityCode),
  };
}

function buildLinkScoreMap(aggs: AbilityPracticeAggRow[]) {
  const map = new Map<string, number>();

  for (const row of aggs) {
    const abilityCode = normalizeAbilityCode(row.abilityCode);
    const practiceCode = s(row.practiceCode);
    if (!abilityCode || !practiceCode) continue;

    map.set(
      `${abilityCode}::${practiceCode}`,
      Math.max(n(row.scoreMax), n(row.scoreSum), n(row.linkCount)),
    );
  }

  return map;
}

function buildPracticeScoreRows(args: {
  selectedPracticeCodes: string[];
  practicesByCode: Map<string, PracticeCodeRow>;
  links: AbilityPracticeLinkRow[];
  aggs: AbilityPracticeAggRow[];
  abilityCodeMap: Map<string, AbilityCodeRow>;
}): PracticeScoreRow[] {
  const {
    selectedPracticeCodes,
    practicesByCode,
    links,
    aggs,
    abilityCodeMap,
  } = args;

  const linksByPractice = new Map<string, AbilityPracticeLinkRow[]>();
  for (const link of links) {
    const practiceCode = s(link.practiceCode);
    if (!practiceCode) continue;
    const current = linksByPractice.get(practiceCode) ?? [];
    current.push(link);
    linksByPractice.set(practiceCode, current);
  }

  const aggsByPractice = new Map<string, AbilityPracticeAggRow[]>();
  for (const agg of aggs) {
    const practiceCode = s(agg.practiceCode);
    if (!practiceCode) continue;
    const current = aggsByPractice.get(practiceCode) ?? [];
    current.push(agg);
    aggsByPractice.set(practiceCode, current);
  }

  return selectedPracticeCodes.map((practiceCode) => {
    const practice = practicesByCode.get(practiceCode);
    const domainCounts = emptyDomainCounts();
    const abilityNameSet = new Set<string>();
    let abilityCount = 0;

    const practiceLinks = linksByPractice.get(practiceCode) ?? [];

    if (practiceLinks.length > 0) {
      for (const link of practiceLinks) {
        const abilityCode = normalizeAbilityCode(link.abilityCode);
        if (!abilityCode) continue;

        const meta = resolveAbilityMeta(abilityCode, abilityCodeMap);
        const score = Math.max(1, n(link.score, 1));

        if (meta.domainKey) {
          addDomainValue(domainCounts, meta.domainKey, score);
        }

        abilityNameSet.add(meta.abilityName);
        abilityCount += 1;
      }
    } else {
      const practiceAggs = aggsByPractice.get(practiceCode) ?? [];
      for (const agg of practiceAggs) {
        const abilityCode = normalizeAbilityCode(agg.abilityCode);
        if (!abilityCode) continue;

        const meta = resolveAbilityMeta(abilityCode, abilityCodeMap);
        const score = Math.max(
          1,
          n(agg.scoreMax),
          n(agg.scoreSum),
          n(agg.linkCount),
        );

        if (meta.domainKey) {
          addDomainValue(domainCounts, meta.domainKey, score);
        }

        abilityNameSet.add(meta.abilityName);
        abilityCount += 1;
      }
    }

    return {
      practiceCode,
      practiceTitle: practice ? practiceTitleOf(practice) : practiceCode,
      categoryLabel: practice ? categoryLabelOf(practice) : "-",
      memo: practice ? practiceMemoOf(practice) : "",
      status: practice ? s(practice.status) : "-",
      domainCounts,
      totalScore: sumDomainCounts(domainCounts),
      abilityCount,
      abilityNames: [...abilityNameSet].sort((a, b) => a.localeCompare(b)),
    } satisfies PracticeScoreRow;
  });
}

function buildAbilityScoreRows(args: {
  selectedPracticeCodes: string[];
  links: AbilityPracticeLinkRow[];
  aggs: AbilityPracticeAggRow[];
  abilityCodeMap: Map<string, AbilityCodeRow>;
}) {
  const { selectedPracticeCodes, links, aggs, abilityCodeMap } = args;
  const selectedSet = new Set(selectedPracticeCodes);
  const rowsByAbility = new Map<string, AbilityScoreRow>();
  const linkScoreMap = buildLinkScoreMap(aggs);
  const practicesWithLinks = new Set<string>();

  for (const link of links) {
    const practiceCode = s(link.practiceCode);
    if (!selectedSet.has(practiceCode)) continue;
    practicesWithLinks.add(practiceCode);

    const abilityCode = normalizeAbilityCode(link.abilityCode);
    if (!abilityCode) continue;

    const meta = resolveAbilityMeta(abilityCode, abilityCodeMap);
    const aggScore = linkScoreMap.get(`${abilityCode}::${practiceCode}`) ?? 0;
    const score = Math.max(1, n(link.score, 1), aggScore);

    const current =
      rowsByAbility.get(abilityCode) ??
      ({
        ...meta,
        score: 0,
        practiceCodes: [],
      } satisfies AbilityScoreRow);

    current.score += score;
    current.practiceCodes = Array.from(
      new Set([...current.practiceCodes, practiceCode]),
    ).sort();

    rowsByAbility.set(abilityCode, current);
  }

  for (const agg of aggs) {
    const practiceCode = s(agg.practiceCode);
    if (!selectedSet.has(practiceCode)) continue;
    if (practicesWithLinks.has(practiceCode)) continue;

    const abilityCode = normalizeAbilityCode(agg.abilityCode);
    if (!abilityCode) continue;

    const meta = resolveAbilityMeta(abilityCode, abilityCodeMap);
    const score = Math.max(
      1,
      n(agg.scoreMax),
      n(agg.scoreSum),
      n(agg.linkCount),
    );

    const current =
      rowsByAbility.get(abilityCode) ??
      ({
        ...meta,
        score: 0,
        practiceCodes: [],
      } satisfies AbilityScoreRow);

    current.score += score;
    current.practiceCodes = Array.from(
      new Set([...current.practiceCodes, practiceCode]),
    ).sort();

    rowsByAbility.set(abilityCode, current);
  }

  return [...rowsByAbility.values()].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return a.abilityCode.localeCompare(b.abilityCode);
  });
}

function buildAbilityGroups(rows: AbilityScoreRow[]): AbilityDomainGroup[] {
  const domainMap = new Map<string, AbilityDomainGroup>();

  for (const row of rows) {
    const domainKey = row.domainKey;
    const domain = row.domain || (domainKey ? domainLabel(domainKey) : "-");
    const domainMapKey = domainKey ?? domain;

    const domainGroup =
      domainMap.get(domainMapKey) ??
      ({
        domainKey,
        domain,
        totalScore: 0,
        categories: [],
      } satisfies AbilityDomainGroup);

    let categoryGroup = domainGroup.categories.find(
      (group) => group.category === row.category,
    );

    if (!categoryGroup) {
      categoryGroup = {
        category: row.category || "(category未設定)",
        totalScore: 0,
        rows: [],
      };
      domainGroup.categories.push(categoryGroup);
    }

    domainGroup.totalScore += row.score;
    categoryGroup.totalScore += row.score;
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
      const scoreDiff = b.totalScore - a.totalScore;
      if (scoreDiff !== 0) return scoreDiff;
      return a.category.localeCompare(b.category);
    });

    for (const category of group.categories) {
      category.rows.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return a.abilityCode.localeCompare(b.abilityCode);
      });
    }
  }

  return groups;
}

function sumPracticeRowsDomainCounts(rows: PracticeScoreRow[]): DomainCounts {
  const out = emptyDomainCounts();

  for (const row of rows) {
    for (const key of DOMAIN_KEYS) {
      out[key] += row.domainCounts[key];
    }
  }

  return out;
}

function buildDomainJudgementRows(counts: DomainCounts): DomainJudgementRow[] {
  const totalScore = sumDomainCounts(counts);

  return DOMAIN_KEYS.map((key) => {
    const score = counts[key];
    const share = totalScore > 0 ? score / totalScore : 0;
    const gapShare = share - TARGET_SHARE;

    let status: DomainJudgementRow["status"] = "ALIGNED";
    if (totalScore <= 0) {
      status = "NO_DATA";
    } else if (gapShare <= -GAP_THRESHOLD) {
      status = "UNDER";
    } else if (gapShare >= GAP_THRESHOLD) {
      status = "OVER";
    }

    return {
      domainKey: key,
      label: domainLabel(key),
      score,
      share,
      targetShare: TARGET_SHARE,
      gapShare,
      status,
    } satisfies DomainJudgementRow;
  });
}

function judgementStatusLabel(status: DomainJudgementRow["status"]): string {
  switch (status) {
    case "UNDER":
      return "不足気味";
    case "OVER":
      return "強め";
    case "NO_DATA":
      return "データなし";
    case "ALIGNED":
    default:
      return "標準";
  }
}

function buildRecommendedRows(args: {
  practices: PracticeCodeRow[];
  categoryFilter: CategoryFilter;
  selectedPracticeCodes: string[];
  weakDomainKeys: DomainKey[];
  links: AbilityPracticeLinkRow[];
  aggs: AbilityPracticeAggRow[];
  abilityCodeMap: Map<string, AbilityCodeRow>;
  limit?: number;
}): RecommendedEnvironmentPracticeRow[] {
  const {
    practices,
    categoryFilter,
    selectedPracticeCodes,
    weakDomainKeys,
    links,
    aggs,
    abilityCodeMap,
    limit = 6,
  } = args;

  if (weakDomainKeys.length === 0) return [];

  const selectedSet = new Set(selectedPracticeCodes);
  const weakDomainSet = new Set(weakDomainKeys);
  const linkScoreMap = buildLinkScoreMap(aggs);

  const candidatePracticeMap = new Map<string, PracticeCodeRow>();
  for (const practice of practices) {
    const practiceCode = practiceCodeOf(practice);
    if (!practiceCode || selectedSet.has(practiceCode)) continue;
    if (!isActivePractice(practice)) continue;
    if (!categoryMatches(practice, categoryFilter)) continue;
    candidatePracticeMap.set(practiceCode, practice);
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

  for (const link of links) {
    const practiceCode = s(link.practiceCode);
    const practice = candidatePracticeMap.get(practiceCode);
    if (!practice) continue;

    const abilityCode = normalizeAbilityCode(link.abilityCode);
    if (!abilityCode) continue;

    const meta = resolveAbilityMeta(abilityCode, abilityCodeMap);
    if (!meta.domainKey || !weakDomainSet.has(meta.domainKey)) continue;

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

    const aggScore = linkScoreMap.get(`${abilityCode}::${practiceCode}`) ?? 0;
    current.score += Math.max(1, n(link.score, 1), aggScore);
    current.weakDomainKeys.add(meta.domainKey);
    current.matchedAbilityCodes.add(abilityCode);
    current.matchedAbilityNames.add(meta.abilityName);

    candidateMap.set(practiceCode, current);
  }

  return [...candidateMap.values()]
    .map((row) => {
      const practice = candidatePracticeMap.get(row.practiceCode);
      const weakKeys = [...row.weakDomainKeys];

      return {
        practiceCode: row.practiceCode,
        practiceTitle: practice ? practiceTitleOf(practice) : row.practiceCode,
        categoryLabel: practice ? categoryLabelOf(practice) : "-",
        memo: practice ? practiceMemoOf(practice) : "",
        score: row.score,
        weakDomainKeys: weakKeys,
        weakDomainLabels: weakKeys.map((key) => domainLabel(key)),
        matchedAbilityCodes: [...row.matchedAbilityCodes].sort(),
        matchedAbilityNames: [...row.matchedAbilityNames].sort((a, b) =>
          a.localeCompare(b),
        ),
      } satisfies RecommendedEnvironmentPracticeRow;
    })
    .sort((a, b) => {
      const weakDiff = b.weakDomainKeys.length - a.weakDomainKeys.length;
      if (weakDiff !== 0) return weakDiff;
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return a.practiceCode.localeCompare(b.practiceCode);
    })
    .slice(0, limit);
}

function buildDomainSummaryText(rows: DomainJudgementRow[]) {
  const weakRows = rows.filter((row) => row.status === "UNDER");
  const strongRows = rows.filter((row) => row.status === "OVER");

  if (rows.every((row) => row.status === "NO_DATA")) {
    return "選択したPracticeにAbility紐づけがまだないため、環境インパクトを判定できません。";
  }

  if (weakRows.length === 0 && strongRows.length === 0) {
    return "現在選択している環境構成は、5領域のバランスが概ね均等です。";
  }

  const parts: string[] = [];
  if (strongRows.length > 0) {
    parts.push(`${strongRows.map((row) => row.label).join("・")}が強め`);
  }
  if (weakRows.length > 0) {
    parts.push(`${weakRows.map((row) => row.label).join("・")}が不足気味`);
  }

  return `現在選択している環境構成では、${parts.join("、")}です。`;
}

export default function EnvironmentImpactPanel(props: Props) {
  const { tenantId } = props;
  void props.owner;

  const client = useMemo(() => generateClient<Schema>(), []);

  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("environment");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [practices, setPractices] = useState<PracticeCodeRow[]>([]);
  const [abilityLinks, setAbilityLinks] = useState<AbilityPracticeLinkRow[]>(
    [],
  );
  const [abilityAggs, setAbilityAggs] = useState<AbilityPracticeAggRow[]>([]);
  const [abilityCodes, setAbilityCodes] = useState<AbilityCodeRow[]>([]);
  const [selectedPracticeCodes, setSelectedPracticeCodes] = useState<string[]>(
    [],
  );

  const storageKey = `hoiku360.environmentImpact.selected.${tenantId}`;

  const listPracticeCodes = useCallback(async () => {
    return listAll<
      PracticeCodeRow,
      Parameters<typeof client.models.PracticeCode.list>[0]
    >(
      (args) =>
        client.models.PracticeCode.list(args) as unknown as Promise<
          ListResult<PracticeCodeRow>
        >,
    );
  }, [client]);

  const listAbilityPracticeLinks = useCallback(async () => {
    return listAll<
      AbilityPracticeLinkRow,
      Parameters<typeof client.models.AbilityPracticeLink.list>[0]
    >(
      (args) =>
        client.models.AbilityPracticeLink.list(args) as unknown as Promise<
          ListResult<AbilityPracticeLinkRow>
        >,
    );
  }, [client]);

  const listAbilityPracticeAggs = useCallback(async () => {
    return listAll<
      AbilityPracticeAggRow,
      Parameters<typeof client.models.AbilityPracticeAgg.list>[0]
    >(
      (args) =>
        client.models.AbilityPracticeAgg.list(args) as unknown as Promise<
          ListResult<AbilityPracticeAggRow>
        >,
    );
  }, [client]);

  const listAbilityCodes = useCallback(async () => {
    return listAll<
      AbilityCodeRow,
      Parameters<typeof client.models.AbilityCode.list>[0]
    >(
      (args) =>
        client.models.AbilityCode.list(args) as unknown as Promise<
          ListResult<AbilityCodeRow>
        >,
    );
  }, [client]);

  async function reload() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [practiceRows, linkRows, aggRows, abilityRows] = await Promise.all([
        listPracticeCodes(),
        listAbilityPracticeLinks(),
        listAbilityPracticeAggs(),
        listAbilityCodes(),
      ]);

      const activePracticeRows = practiceRows
        .filter((row) => {
          const practiceCode = practiceCodeOf(row);
          if (!practiceCode) return false;
          if (!isActivePractice(row)) return false;

          const rowTenantId = s(row.tenantId);
          return !rowTenantId || rowTenantId === tenantId;
        })
        .sort((a, b) => {
          const categoryDiff = categoryLabelOf(a).localeCompare(
            categoryLabelOf(b),
          );
          if (categoryDiff !== 0) return categoryDiff;
          return practiceTitleOf(a).localeCompare(practiceTitleOf(b));
        });

      setPractices(activePracticeRows);
      setAbilityLinks(linkRows);
      setAbilityAggs(aggRows);
      setAbilityCodes(abilityRows);
      setMessage(
        `読込完了: Practice=${activePracticeRows.length}件 / AbilityPracticeLink=${linkRows.length}件 / AbilityPracticeAgg=${aggRows.length}件`,
      );
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const restored = parsed.map((value) => s(value)).filter(Boolean);
      setSelectedPracticeCodes(Array.from(new Set(restored)));
    } catch {
      // localStorage の復元に失敗しても画面利用は継続する。
    }
  }, [storageKey]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(selectedPracticeCodes),
      );
    } catch {
      // localStorage に保存できない環境では一時保存を省略する。
    }
  }, [selectedPracticeCodes, storageKey]);

  const practicesByCode = useMemo(() => {
    const map = new Map<string, PracticeCodeRow>();
    for (const row of practices) {
      const practiceCode = practiceCodeOf(row);
      if (practiceCode && !map.has(practiceCode)) {
        map.set(practiceCode, row);
      }
    }
    return map;
  }, [practices]);

  const abilityCodeMap = useMemo(
    () => buildAbilityCodeMap(abilityCodes),
    [abilityCodes],
  );

  const filteredPractices = useMemo(() => {
    const q = s(query).toLowerCase();

    return practices.filter((row) => {
      if (!categoryMatches(row, categoryFilter)) return false;

      if (!q) return true;

      const haystack = [
        row.practice_code,
        row.name,
        row.memo,
        row.transcriptText,
        row.category_name,
        row.practiceCategory,
      ]
        .map((value) => s(value).toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [categoryFilter, practices, query]);

  const selectedPracticeRows = useMemo(
    () =>
      buildPracticeScoreRows({
        selectedPracticeCodes,
        practicesByCode,
        links: abilityLinks,
        aggs: abilityAggs,
        abilityCodeMap,
      }),
    [
      abilityAggs,
      abilityCodeMap,
      abilityLinks,
      practicesByCode,
      selectedPracticeCodes,
    ],
  );

  const selectedDomainCounts = useMemo(
    () => sumPracticeRowsDomainCounts(selectedPracticeRows),
    [selectedPracticeRows],
  );

  const domainJudgementRows = useMemo(
    () => buildDomainJudgementRows(selectedDomainCounts),
    [selectedDomainCounts],
  );

  const weakDomainKeys = useMemo(
    () =>
      domainJudgementRows
        .filter((row) => row.status === "UNDER")
        .map((row) => row.domainKey),
    [domainJudgementRows],
  );

  const abilityScoreRows = useMemo(
    () =>
      buildAbilityScoreRows({
        selectedPracticeCodes,
        links: abilityLinks,
        aggs: abilityAggs,
        abilityCodeMap,
      }),
    [abilityAggs, abilityCodeMap, abilityLinks, selectedPracticeCodes],
  );

  const abilityGroups = useMemo(
    () => buildAbilityGroups(abilityScoreRows),
    [abilityScoreRows],
  );

  const recommendedRows = useMemo(
    () =>
      buildRecommendedRows({
        practices,
        categoryFilter,
        selectedPracticeCodes,
        weakDomainKeys,
        links: abilityLinks,
        aggs: abilityAggs,
        abilityCodeMap,
        limit: 6,
      }),
    [
      abilityAggs,
      abilityCodeMap,
      abilityLinks,
      categoryFilter,
      practices,
      selectedPracticeCodes,
      weakDomainKeys,
    ],
  );

  const totalScore = sumDomainCounts(selectedDomainCounts);
  const selectedCount = selectedPracticeCodes.length;
  const domainSummaryText = buildDomainSummaryText(domainJudgementRows);

  function togglePractice(practiceCode: string) {
    setSelectedPracticeCodes((current) => {
      if (current.includes(practiceCode)) {
        return current.filter((code) => code !== practiceCode);
      }
      return [...current, practiceCode].sort((a, b) => a.localeCompare(b));
    });
  }

  function addRecommendedPractice(practiceCode: string) {
    setSelectedPracticeCodes((current) => {
      if (current.includes(practiceCode)) return current;
      return [...current, practiceCode].sort((a, b) => a.localeCompare(b));
    });
  }

  function clearSelection() {
    setSelectedPracticeCodes([]);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>環境インパクト分析</h2>
        <div style={{ color: "#555", lineHeight: 1.7 }}>
          環境構成カテゴリなどのPracticeを選択し、そのPractice群が5領域・10の姿にどのような影響を持ちやすいかを確認します。
          これは実際の観察結果ではなく、保育士同士の議論を始めるための仮説評価です。
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginTop: 14,
          }}
        >
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            対象カテゴリ
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as CategoryFilter)
              }
              disabled={loading}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            検索
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Practice名 / memo / コード"
              style={{ minWidth: 260 }}
            />
          </label>

          <button onClick={reload} disabled={loading}>
            {loading ? "読込中..." : "再読込"}
          </button>

          <button onClick={clearSelection} disabled={selectedCount === 0}>
            選択をクリア
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: "#555" }}>
          表示Practice: {filteredPractices.length}件 / 選択中: {selectedCount}件
          / 合計スコア: {totalScore}
          <br />
          選択状態はこのブラウザに一時保存されます。
        </div>

        {message ? <InfoBox>{message}</InfoBox> : null}
        {error ? <ErrorBox>{error}</ErrorBox> : null}
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>
          Step 3. 現在の環境構成を選択
        </h3>

        {loading ? (
          <div style={{ color: "#666" }}>Loading...</div>
        ) : filteredPractices.length === 0 ? (
          <div style={{ color: "#666", lineHeight: 1.7 }}>
            該当するPracticeがありません。Practice登録でカテゴリー「環境構成」を選び、Practice一覧・メンテでAbility紐づけを本登録してください。
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 980,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", background: "#f8fafc" }}>
                  <th style={thStyle}>選択</th>
                  <th style={thStyle}>Practice</th>
                  <th style={thStyle}>分類</th>
                  <th style={thStyle}>status</th>
                  <th style={thStyle}>memo</th>
                </tr>
              </thead>
              <tbody>
                {filteredPractices.map((practice) => {
                  const practiceCode = practiceCodeOf(practice);
                  const checked = selectedPracticeCodes.includes(practiceCode);

                  return (
                    <tr key={practiceCode}>
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePractice(practiceCode)}
                        />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {practiceCode}
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {practiceTitleOf(practice)}
                        </div>
                      </td>
                      <td style={tdStyle}>{categoryLabelOf(practice)}</td>
                      <td style={tdStyle}>{s(practice.status) || "-"}</td>
                      <td
                        style={{
                          ...tdStyle,
                          minWidth: 360,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {practiceMemoOf(practice) || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>
          Step 4-5. Ability影響の集計と不足領域の判定
        </h3>

        {selectedCount === 0 ? (
          <div style={{ color: "#666" }}>先にPracticeを選択してください。</div>
        ) : (
          <>
            <div style={{ marginBottom: 12, lineHeight: 1.7 }}>
              <b>{domainSummaryText}</b>
              <br />
              判定基準:
              5領域を暫定的に各20%と見なし、8ポイント以上低い領域を「不足気味」とします。
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 10,
              }}
            >
              {domainJudgementRows.map((row) => (
                <DomainCard key={row.domainKey} row={row} />
              ))}
            </div>
          </>
        )}
      </div>

      {selectedCount > 0 ? (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>
            選択Practiceごとの影響
          </h3>

          <div style={{ display: "grid", gap: 12 }}>
            {selectedPracticeRows.map((row) => (
              <SelectedPracticeCard key={row.practiceCode} row={row} />
            ))}
          </div>
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Ability別内訳</h3>

          {abilityGroups.length === 0 ? (
            <div style={{ color: "#666" }}>
              選択PracticeにAbility紐づけがまだありません。
            </div>
          ) : (
            <AbilityHierarchy groups={abilityGroups} />
          )}
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>
            Step 6. 不足を補う環境Practice候補
          </h3>

          {weakDomainKeys.length === 0 ? (
            <div style={{ color: "#666", lineHeight: 1.7 }}>
              不足気味の領域はありません。現在の構成を維持しつつ、実際の観察記録で子どもの姿を確認してください。
            </div>
          ) : recommendedRows.length === 0 ? (
            <div style={{ color: "#666", lineHeight: 1.7 }}>
              不足気味の領域に対応する候補Practiceが見つかりません。環境構成PracticeのAbility紐づけを増やすと候補が出やすくなります。
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {recommendedRows.map((row) => (
                <RecommendedPracticeCard
                  key={row.practiceCode}
                  row={row}
                  onAdd={() => addRecommendedPractice(row.practiceCode)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DomainCard(props: { row: DomainJudgementRow }) {
  const { row } = props;
  const barWidth = `${Math.min(100, Math.max(0, row.share * 100))}%`;

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{row.label}</div>
        <div style={{ fontSize: 12 }}>{judgementStatusLabel(row.status)}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800 }}>
        {row.score}
      </div>
      <div style={{ fontSize: 12, color: "#555" }}>
        構成比 {formatSharePercent(row.share)} / 目安{" "}
        {formatSharePercent(row.targetShare)}
      </div>
      <div
        style={{
          marginTop: 8,
          height: 8,
          background: "#e5e7eb",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: barWidth,
            height: "100%",
            background: "#64748b",
          }}
        />
      </div>
    </div>
  );
}

function SelectedPracticeCard(props: { row: PracticeScoreRow }) {
  const { row } = props;

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#666" }}>{row.practiceCode}</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {row.practiceTitle}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {row.categoryLabel} / status={row.status || "-"}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#555" }}>
          Ability {row.abilityCount}件 / score {row.totalScore}
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 8,
        }}
      >
        {DOMAIN_KEYS.map((key) => (
          <MiniStat
            key={key}
            label={domainLabel(key)}
            value={row.domainCounts[key]}
          />
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: "#444" }}>
        <b>関連Ability:</b>{" "}
        {row.abilityNames.length > 0
          ? row.abilityNames.slice(0, 8).join("、")
          : "未登録"}
      </div>
      {row.memo ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#444",
            whiteSpace: "pre-wrap",
          }}
        >
          {truncateText(row.memo, 240)}
        </div>
      ) : null}
    </div>
  );
}

function RecommendedPracticeCard(props: {
  row: RecommendedEnvironmentPracticeRow;
  onAdd: () => void;
}) {
  const { row, onAdd } = props;

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#666" }}>{row.practiceCode}</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {row.practiceTitle}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {row.categoryLabel} / 補いたい領域:{" "}
            {row.weakDomainLabels.join("・")}
          </div>
        </div>
        <button type="button" onClick={onAdd}>
          改善案に追加
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
        <b>関連Ability:</b>{" "}
        {row.matchedAbilityNames.length > 0
          ? row.matchedAbilityNames.slice(0, 8).join("、")
          : row.matchedAbilityCodes.join("、")}
      </div>

      {row.memo ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#444",
            whiteSpace: "pre-wrap",
          }}
        >
          {truncateText(row.memo, 300)}
        </div>
      ) : null}
    </div>
  );
}

function AbilityHierarchy(props: { groups: AbilityDomainGroup[] }) {
  const { groups } = props;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {groups.map((domainGroup) => (
        <section
          key={domainGroup.domain}
          style={{
            border: "1px solid #d8dee4",
            borderRadius: 10,
            background: "#f8fafc",
            padding: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={pillStyle}>領域</span>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {domainGroup.domain}
            </div>
            <span style={{ color: "#666", fontSize: 13 }}>
              score {domainGroup.totalScore}
            </span>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {domainGroup.categories.map((categoryGroup) => (
              <section
                key={`${domainGroup.domain}_${categoryGroup.category}`}
                style={{
                  marginLeft: 16,
                  padding: 10,
                  borderLeft: "4px solid #d8dee4",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={pillStyle}>カテゴリ</span>
                  <div style={{ fontWeight: 700 }}>
                    {categoryGroup.category}
                  </div>
                  <span style={{ color: "#666", fontSize: 12 }}>
                    score {categoryGroup.totalScore}
                  </span>
                </div>

                <div style={{ display: "grid", gap: 4, marginLeft: 12 }}>
                  {categoryGroup.rows.map((row) => (
                    <div
                      key={`${row.abilityCode}_${row.abilityName}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "center",
                        columnGap: 8,
                        padding: "4px 0",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#666",
                            marginRight: 6,
                          }}
                        >
                          {row.abilityCode}
                        </span>
                        {row.abilityName}
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Practice: {row.practiceCodes.join("、")}
                        </div>
                      </div>
                      <b>{row.score}</b>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MiniStat(props: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: 8,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{props.label}</div>
      <div style={{ fontWeight: 700 }}>{props.value}</div>
    </div>
  );
}

function InfoBox(props: { children: string }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 10,
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: 8,
        whiteSpace: "pre-wrap",
      }}
    >
      {props.children}
    </div>
  );
}

function ErrorBox(props: { children: string }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 10,
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 8,
        color: "#991b1b",
        whiteSpace: "pre-wrap",
      }}
    >
      {props.children}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 16,
  border: "1px solid #d0d7de",
  borderRadius: 8,
  background: "#fff",
};

const thStyle: React.CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #ddd",
};

const tdStyle: React.CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};

const pillStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#666",
  background: "#eef2f7",
  border: "1px solid #d8dee4",
  borderRadius: 999,
  padding: "2px 8px",
  flexShrink: 0,
};
