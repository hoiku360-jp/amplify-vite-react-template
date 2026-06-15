import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  owner: string;
};

type ScheduleMonthRow = Schema["ScheduleMonth"]["type"];
type ScheduleWeekRow = Schema["ScheduleWeek"]["type"];
type ScheduleWeekItemRow = Schema["ScheduleWeekItem"]["type"];
type ScheduleDayRow = Schema["ScheduleDay"]["type"];
type ClassroomRow = Schema["Classroom"]["type"];
type AgeTargetRow = Schema["SchoolAnnualAgeTarget"]["type"];
type PracticeRow = Schema["PracticeCode"]["type"];
type AbilityPracticeLinkRow = Schema["AbilityPracticeLink"]["type"];
type ClassAnnualPlanRow = Schema["ClassAnnualPlan"]["type"];
type ClassQuarterPlanRow = Schema["ClassQuarterPlan"]["type"];
type ClassMonthPlanRow = Schema["ClassMonthPlan"]["type"];
type ClassMonthPlanPhraseSelectionRow =
  Schema["ClassMonthPlanPhraseSelection"]["type"];
type ClassPlanPhraseSelectionRow = Schema["ClassPlanPhraseSelection"]["type"];
type ClassCalendarEventRow = Schema["ClassCalendarEvent"]["type"];

type ScoreSet = {
  health: number;
  humanRelations: number;
  environment: number;
  language: number;
  expression: number;
};

type ScoreKey = keyof ScoreSet;

type ScoreArea = {
  key: ScoreKey;
  label: string;
};

type WeekDateRow = {
  date: string;
  weekday: number;
  label: string;
  weekItem: ScheduleWeekItemRow | null;
  hasDuplicate: boolean;
};

type WeekSummaryRow = {
  weekStartDate: string;
  weekEndDate: string;
  weekNoInMonth: number;
  label: string;
  scheduleWeek: ScheduleWeekRow | null;
  rows: WeekDateRow[];
  totals: ScoreSet;
};

type PlanAbilitySummaryRow = {
  abilityCode: string;
  abilityName: string;
  categoryName: string;
  abilityDomain: string;
  weight: number;
};

type PlanAbilityWeightRow = {
  abilityCode: string;
  label: string;
  weight: number;
  recommendWeight: number;
  sourceKind: "MONTH" | "YEAR" | "TERM";
  sourceLabel: string;
};

type PracticeRecommendation = {
  practiceCode: string;
  practiceName: string;
  recommendScore: number;
  matchAbilityCount: number;
  totalPracticeScore: number;
  monthMatchCount: number;
  referenceMatchCount: number;
  matchedAbilities: string[];
  sourceLabels: string[];
};

type CalendarEventScopeType = "SCHOOL" | "CLASSROOM";
type CalendarEventDateMode = "SINGLE" | "RANGE" | "WEEKLY" | "MONTHLY_DATE";
type CalendarEventKind =
  | "EVENT"
  | "PREPARATION"
  | "HEALTH_CHECK"
  | "DRILL"
  | "BIRTHDAY"
  | "OTHER";

type CalendarEventForm = {
  scopeType: CalendarEventScopeType;
  classroomId: string;
  title: string;
  description: string;
  eventType: CalendarEventKind;
  dateMode: CalendarEventDateMode;
  startDate: string;
  endDate: string;
  dayOfWeek: string;
  dayOfMonth: string;
  startTime: string;
  endTime: string;
  showInPlan: boolean;
  showInSchedule: boolean;
  showInHomeNotice: boolean;
  homeNoticeText: string;
  sortOrder: string;
};

type ModelError = {
  message?: string | null;
};

type ListOptions = Record<string, unknown>;
type MutationInput = Record<string, unknown>;

type ListResponse<TRow> = {
  data?: TRow[] | null;
  nextToken?: string | null;
  errors?: ModelError[] | null;
};

type MutationResponse<TRow> = {
  data?: TRow | null;
  errors?: ModelError[] | null;
};

type ListableModel<TRow> = {
  list(options?: ListOptions): Promise<ListResponse<TRow>>;
};

type CreatableModel<TRow> = {
  create(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type UpdatableModel<TRow> = {
  update(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type AbilityPracticeLinkModel = {
  listByPractice(args: { practiceCode: string }): Promise<{
    data?: AbilityPracticeLinkRow[] | null;
    errors?: ModelError[] | null;
  }>;
  listByAbility(args: { abilityCode: string }): Promise<{
    data?: AbilityPracticeLinkRow[] | null;
    errors?: ModelError[] | null;
  }>;
};

type IssueScheduleWeekArgs = {
  scheduleMonthId: string;
  weekStartDate: string;
  weekEndDate: string;
  weekNo: number;
  issueType: "MANUAL";
};

type IssueScheduleDayArgs = {
  scheduleWeekId: string;
  targetDate: string;
  issueType: "MANUAL" | "MANUAL_REISSUE";
};

type IssueScheduleWeekResult = {
  status?: string | null;
  message?: string | null;
};

type IssueScheduleDayResult = {
  status?: string | null;
  message?: string | null;
  issueVersion?: number | null;
};

type OperationEnvelope<TData> = {
  data?: TData | null;
  errors?: ModelError[] | null;
};

type OperationRunner<TArgs, TData> = (
  args: TArgs | { input: TArgs },
) => Promise<OperationEnvelope<TData> | TData>;

type SimpleScheduleWorkspaceClient = {
  models: {
    Classroom: ListableModel<ClassroomRow>;
    SchoolAnnualAgeTarget: ListableModel<AgeTargetRow>;
    PracticeCode: ListableModel<PracticeRow>;
    ClassAnnualPlan: ListableModel<ClassAnnualPlanRow>;
    ClassQuarterPlan: ListableModel<ClassQuarterPlanRow>;
    ClassMonthPlan: ListableModel<ClassMonthPlanRow>;
    ClassMonthPlanPhraseSelection: ListableModel<ClassMonthPlanPhraseSelectionRow>;
    ClassPlanPhraseSelection: ListableModel<ClassPlanPhraseSelectionRow>;
    ClassCalendarEvent: ListableModel<ClassCalendarEventRow> &
      CreatableModel<ClassCalendarEventRow> &
      UpdatableModel<ClassCalendarEventRow>;
    ScheduleMonth: ListableModel<ScheduleMonthRow> &
      CreatableModel<ScheduleMonthRow> &
      UpdatableModel<ScheduleMonthRow>;
    ScheduleWeek: ListableModel<ScheduleWeekRow> &
      UpdatableModel<ScheduleWeekRow>;
    ScheduleWeekItem: ListableModel<ScheduleWeekItemRow> &
      CreatableModel<ScheduleWeekItemRow> &
      UpdatableModel<ScheduleWeekItemRow>;
    ScheduleDay: ListableModel<ScheduleDayRow>;
    AbilityPracticeLink: AbilityPracticeLinkModel;
  };
  mutations?: {
    issueScheduleWeekFromScheduleMonth?: OperationRunner<
      IssueScheduleWeekArgs,
      IssueScheduleWeekResult
    >;
    issueScheduleDayFromScheduleWeek?: OperationRunner<
      IssueScheduleDayArgs,
      IssueScheduleDayResult
    >;
  };
};

type ClassroomDisplayRow = ClassroomRow & {
  name?: string | null;
  title?: string | null;
  className?: string | null;
};

type AgeTargetDisplayRow = AgeTargetRow & {
  ageBand?: string | number | null;
};

type IssueVersionLike = {
  issueVersion?: number | null;
};

type TimestampLike = {
  updatedAt?: string | null;
  createdAt?: string | null;
};

const client =
  generateClient<Schema>() as unknown as SimpleScheduleWorkspaceClient;

const DEFAULT_TENANT_ID = "demo-tenant";
const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "09:30";

const SCORE_AREAS: ScoreArea[] = [
  { key: "health", label: "健康" },
  { key: "humanRelations", label: "人間関係" },
  { key: "environment", label: "環境" },
  { key: "language", label: "言葉" },
  { key: "expression", label: "表現" },
];

const CALENDAR_EVENT_TYPE_OPTIONS: Array<{
  value: CalendarEventKind;
  label: string;
}> = [
  { value: "EVENT", label: "行事" },
  { value: "PREPARATION", label: "持ち物・準備" },
  { value: "HEALTH_CHECK", label: "健診" },
  { value: "DRILL", label: "避難訓練" },
  { value: "BIRTHDAY", label: "誕生会" },
  { value: "OTHER", label: "その他" },
];

const CALENDAR_DATE_MODE_OPTIONS: Array<{
  value: CalendarEventDateMode;
  label: string;
}> = [
  { value: "SINGLE", label: "単発" },
  { value: "RANGE", label: "期間" },
  { value: "WEEKLY", label: "毎週" },
  { value: "MONTHLY_DATE", label: "毎月日付" },
];

const CALENDAR_DAY_OF_WEEK_OPTIONS = [
  { value: "0", label: "日曜日" },
  { value: "1", label: "月曜日" },
  { value: "2", label: "火曜日" },
  { value: "3", label: "水曜日" },
  { value: "4", label: "木曜日" },
  { value: "5", label: "金曜日" },
  { value: "6", label: "土曜日" },
];

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function n(value: unknown, fallback = 0): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalInt(value: string) {
  const text = s(value);
  if (!text) return undefined;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

function todayString() {
  return formatDate(new Date());
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(dateStr: string, diff: number) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

function monthKeyFromDate(dateStr: string) {
  return dateStr.slice(0, 7);
}

function fiscalYearFromMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return new Date().getFullYear();
  return month >= 4 ? year : year - 1;
}

function monthRange(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  return {
    fromDate: formatDate(first),
    toDate: formatDate(last),
  };
}

function listDates(fromDate: string, toDate: string) {
  const out: string[] = [];
  let cur = fromDate;
  while (cur <= toDate) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

function dayOfWeekLabel(day: number) {
  const labels = ["日", "月", "火", "水", "木", "金", "土"];
  return labels[day] ?? String(day);
}

function toWeekday(dateStr: string) {
  return parseDate(dateStr).getDay();
}

function mondayStart(dateStr: string) {
  const d = parseDate(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

function sundayEndFromMonday(monday: string) {
  return addDays(monday, 6);
}

function weekNoInMonthFromDate(dateStr: string) {
  const firstOfMonth = `${dateStr.slice(0, 7)}-01`;
  const firstWeekMonday = mondayStart(firstOfMonth);
  const thisMonday = mondayStart(dateStr);
  const diffMs =
    parseDate(thisMonday).getTime() - parseDate(firstWeekMonday).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

function classroomLabel(row: ClassroomDisplayRow) {
  return row.name || row.title || row.className || row.id;
}

function ageTargetLabel(row: AgeTargetDisplayRow) {
  const ageBand = s(row.ageBand);

  if (ageBand) {
    return ageBand.includes("歳児") ? ageBand : `${ageBand}歳児`;
  }

  return "年齢帯未設定";
}

function practiceLabel(row: PracticeRow) {
  return `${row.practice_code} / ${row.name}`;
}

function weekItemPracticeTitleSnapshot(
  row?: ScheduleWeekItemRow | null,
): string {
  if (!row) return "";

  const snapshot = row as ScheduleWeekItemRow & {
    practiceTitleSnapshot?: string | null;
  };

  return s(snapshot.practiceTitleSnapshot) || s(snapshot.title);
}

function classMonthPlanLabel(row: ClassMonthPlanRow) {
  return `${row.monthKey} / ${row.title || "月計画"} / ${row.ageBand || "-"}`;
}

function domainKeyFromAbilityCode(abilityCode?: string | number | null) {
  const normalizedCode = s(abilityCode).replace(/[^0-9]/g, "");
  const prefix2 = normalizedCode.slice(0, 2);

  if (prefix2 === "11") return "health";
  if (prefix2 === "21") return "humanRelations";
  if (prefix2 === "31") return "environment";
  if (prefix2 === "41") return "language";
  if (prefix2 === "51") return "expression";

  return null;
}

function domainKeyFromLabel(label?: string | null): ScoreKey | null {
  const text = s(label);
  if (text.includes("健康")) return "health";
  if (text.includes("人間関係")) return "humanRelations";
  if (text.includes("環境")) return "environment";
  if (text.includes("言葉")) return "language";
  if (text.includes("表現")) return "expression";
  return null;
}

function emptyScores(): ScoreSet {
  return {
    health: 0,
    humanRelations: 0,
    environment: 0,
    language: 0,
    expression: 0,
  };
}

function scoreSetFromClassMonthPlan(
  row: ClassMonthPlanRow | null | undefined,
): ScoreSet {
  if (!row) return emptyScores();

  return {
    health: n(row.abilityHealthC),
    humanRelations: n(row.abilityHumanRelationsC),
    environment: n(row.abilityEnvironmentC),
    language: n(row.abilityLanguageC),
    expression: n(row.abilityExpressionC),
  };
}

function sumScoreSets(rows: Array<ScoreSet>) {
  return rows.reduce(
    (acc, scores) => ({
      health: acc.health + scores.health,
      humanRelations: acc.humanRelations + scores.humanRelations,
      environment: acc.environment + scores.environment,
      language: acc.language + scores.language,
      expression: acc.expression + scores.expression,
    }),
    emptyScores(),
  );
}

function makeWeekDateKey(scheduleWeekId: string, targetDate: string) {
  return `${scheduleWeekId}__${targetDate}`;
}

function latestIssueVersion<T extends IssueVersionLike>(a: T, b: T) {
  return (b.issueVersion ?? 0) - (a.issueVersion ?? 0);
}

function latestItemVersion<T extends TimestampLike>(a: T, b: T) {
  const aTime = s(a.updatedAt ?? a.createdAt);
  const bTime = s(b.updatedAt ?? b.createdAt);
  return bTime.localeCompare(aTime);
}

function pickCanonicalWeekItem(rows: ScheduleWeekItemRow[]) {
  return [...rows].sort(latestItemVersion)[0] ?? null;
}

function formatModelErrors(
  errors?: ModelError[] | null,
  fallback = "Unknown error",
) {
  const messages = (errors ?? []).map((e) => s(e.message)).filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : fallback;
}

function getOperationErrors<TData>(
  res: OperationEnvelope<TData> | TData,
): ModelError[] | null {
  if (!res || typeof res !== "object") return null;
  if (!("errors" in res)) return null;
  return (res as OperationEnvelope<TData>).errors ?? null;
}

function getOperationData<TData>(res: OperationEnvelope<TData> | TData): TData {
  if (!res || typeof res !== "object") {
    return res as TData;
  }
  if (!("data" in res)) {
    return res as TData;
  }
  return ((res as OperationEnvelope<TData>).data ?? res) as TData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAbilitySummaryJson(
  input?: string | null,
): PlanAbilitySummaryRow[] {
  if (!input) return [];

  try {
    const parsed: unknown = JSON.parse(input);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isRecord)
      .map((row) => ({
        abilityCode: s(row.abilityCode),
        abilityName: s(row.abilityName),
        categoryName: s(row.categoryName),
        abilityDomain: s(row.abilityDomain),
        weight: n(row.weight, 1),
      }))
      .filter((row) => row.abilityCode.length > 0);
  } catch {
    return [];
  }
}

function activeSelection(status?: string | null) {
  return s(status || "ACTIVE").toUpperCase() !== "ARCHIVED";
}

function selectionScopeLabel(scopeType?: string | null) {
  const scope = s(scopeType).toUpperCase();
  if (scope === "YEAR") return "年間方針";
  if (scope === "TERM") return "四半期方針";
  return "月計画";
}

function sourceFactor(scopeType?: string | null) {
  const scope = s(scopeType).toUpperCase();
  if (scope === "MONTH") return 10;
  if (scope === "TERM") return 3;
  if (scope === "YEAR") return 1;
  return 1;
}

function buildAbilityWeightsFromRows(args: {
  rows: Array<{
    status?: string | null;
    abilitySummaryJson?: string | null;
    abilityCodes?: Array<string | null> | null;
    planScopeType?: string | null;
  }>;
  defaultScopeType: "MONTH" | "YEAR" | "TERM";
}): PlanAbilityWeightRow[] {
  const { rows, defaultScopeType } = args;
  const map = new Map<string, PlanAbilityWeightRow>();

  for (const selection of rows) {
    if (!activeSelection(selection.status)) continue;

    const scopeType = s(
      selection.planScopeType || defaultScopeType,
    ).toUpperCase();
    const sourceKind =
      scopeType === "YEAR" ? "YEAR" : scopeType === "TERM" ? "TERM" : "MONTH";
    const sourceLabel = selectionScopeLabel(sourceKind);
    const factor = sourceFactor(sourceKind);
    const summaryRows = parseAbilitySummaryJson(selection.abilitySummaryJson);

    for (const summary of summaryRows) {
      const abilityCode = summary.abilityCode;
      const label =
        summary.abilityName || summary.categoryName || summary.abilityCode;
      const weight = Math.max(1, n(summary.weight, 1));
      const current = map.get(abilityCode);

      if (current) {
        current.weight += weight;
        current.recommendWeight += weight * factor;
        if (!current.sourceLabel.includes(sourceLabel)) {
          current.sourceLabel = `${current.sourceLabel}・${sourceLabel}`;
        }
      } else {
        map.set(abilityCode, {
          abilityCode,
          label,
          weight,
          recommendWeight: weight * factor,
          sourceKind,
          sourceLabel,
        });
      }
    }

    for (const abilityCode of selection.abilityCodes ?? []) {
      const code = s(abilityCode);
      if (!code || map.has(code)) continue;

      map.set(code, {
        abilityCode: code,
        label: code,
        weight: 1,
        recommendWeight: factor,
        sourceKind,
        sourceLabel,
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    const weightDiff = b.recommendWeight - a.recommendWeight;
    if (weightDiff !== 0) return weightDiff;
    return a.abilityCode.localeCompare(b.abilityCode);
  });
}

function summarizeSelectionsToScores(
  selections: ClassPlanPhraseSelectionRow[],
): ScoreSet {
  const totals = emptyScores();

  for (const row of selections) {
    if (!activeSelection(row.status)) continue;

    const direct = {
      health: n(row.relatedHealth),
      humanRelations: n(row.relatedHumanRelations),
      environment: n(row.relatedEnvironment),
      language: n(row.relatedLanguage),
      expression: n(row.relatedExpression),
    };

    if (Object.values(direct).some((value) => value > 0)) {
      for (const area of SCORE_AREAS) {
        totals[area.key] += direct[area.key];
      }
      continue;
    }

    for (const summary of parseAbilitySummaryJson(row.abilitySummaryJson)) {
      const key =
        domainKeyFromAbilityCode(summary.abilityCode) ||
        domainKeyFromLabel(summary.abilityDomain);
      if (!key) continue;
      totals[key] += Math.max(1, n(summary.weight, 1));
    }
  }

  return totals;
}

function scoreSummaryText(scores: ScoreSet) {
  return `健康:${scores.health} / 人間関係:${scores.humanRelations} / 環境:${scores.environment} / 言葉:${scores.language} / 表現:${scores.expression}`;
}

function formatRatio(scheduleScore: number, planScore: number) {
  if (planScore <= 0) return scheduleScore > 0 ? "計画外+" : "-";
  return `${Math.round((scheduleScore / planScore) * 100)}%`;
}

function compareStatusLabel(diff: number, planScore: number) {
  if (planScore <= 0 && diff > 0) return "計画外";
  if (diff < 0) return "不足";
  if (diff === 0) return "一致";
  return "超過";
}

function domainTrendText(scores: ScoreSet) {
  const rows = SCORE_AREAS.map((area) => ({
    ...area,
    value: scores[area.key],
  }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return "年間・四半期方針の選択はまだありません。";

  const top = rows[0];
  const related = rows.slice(1, 4).map((row) => row.label);
  if (related.length === 0) return `${top.label}を中心とした方針です。`;
  return `${top.label}を中心に、${related.join("・")}にも広がる方針です。`;
}

function practiceActive(row: PracticeRow) {
  const status = s(row.status || "active").toUpperCase();
  return status !== "ARCHIVED";
}

function createEmptyCalendarEventForm(
  monthKey: string,
  defaultClassroomId: string,
): CalendarEventForm {
  return {
    scopeType: defaultClassroomId ? "CLASSROOM" : "SCHOOL",
    classroomId: defaultClassroomId,
    title: "",
    description: "",
    eventType: "EVENT",
    dateMode: "SINGLE",
    startDate: monthRange(monthKey).fromDate,
    endDate: "",
    dayOfWeek: "1",
    dayOfMonth: "1",
    startTime: "",
    endTime: "",
    showInPlan: true,
    showInSchedule: true,
    showInHomeNotice: false,
    homeNoticeText: "",
    sortOrder: "0",
  };
}

function calendarScopeLabel(value?: string | null) {
  const scope = s(value).toUpperCase();
  if (scope === "SCHOOL") return "園";
  if (scope === "CLASSROOM") return "クラス";
  return scope || "-";
}

function calendarEventTypeLabel(value?: string | null) {
  const key = s(value).toUpperCase();
  return (
    CALENDAR_EVENT_TYPE_OPTIONS.find((row) => row.value === key)?.label ||
    key ||
    "-"
  );
}

function calendarDateModeLabel(value?: string | null) {
  const key = s(value).toUpperCase();
  return (
    CALENDAR_DATE_MODE_OPTIONS.find((row) => row.value === key)?.label ||
    key ||
    "-"
  );
}

function calendarEventDateLabel(row: ClassCalendarEventRow) {
  const mode = s(row.dateMode).toUpperCase();

  if (mode === "WEEKLY") {
    const day = Number(row.dayOfWeek ?? -1);
    return `毎週${dayOfWeekLabel(day)}`;
  }

  if (mode === "MONTHLY_DATE") {
    return `毎月${row.dayOfMonth ?? "-"}日`;
  }

  if (mode === "RANGE") {
    return `${row.startDate ?? "-"} ～ ${row.endDate ?? "-"}`;
  }

  return row.startDate ?? "-";
}

function calendarEventOccursOnDate(
  row: ClassCalendarEventRow,
  targetDate: string,
) {
  const mode = s(row.dateMode).toUpperCase();
  const startDate = s(row.startDate);
  const endDate = s(row.endDate) || startDate;
  if (!startDate) return false;

  if (mode === "WEEKLY") {
    const effectiveEndDate = s(row.endDate);
    if (startDate > targetDate) return false;
    if (effectiveEndDate && effectiveEndDate < targetDate) return false;
    return Number(row.dayOfWeek ?? -1) === toWeekday(targetDate);
  }

  if (mode === "MONTHLY_DATE") {
    const effectiveEndDate = s(row.endDate);
    if (startDate > targetDate) return false;
    if (effectiveEndDate && effectiveEndDate < targetDate) return false;
    const day = parseDate(targetDate).getDate();
    return Number(row.dayOfMonth ?? -1) === day;
  }

  return startDate <= targetDate && endDate >= targetDate;
}

function calendarEventIntersectsRange(
  row: ClassCalendarEventRow,
  fromDate: string,
  toDate: string,
) {
  return listDates(fromDate, toDate).some((date) =>
    calendarEventOccursOnDate(row, date),
  );
}

function calendarEventVisibleForClassroom(
  row: ClassCalendarEventRow,
  targetTenantId: string,
  targetClassroomId: string,
) {
  if (row.tenantId !== targetTenantId) return false;

  const status = s(row.status || "ACTIVE").toUpperCase();
  if (status === "ARCHIVED") return false;

  const scope = s(row.scopeType).toUpperCase();
  if (scope === "SCHOOL") return true;
  if (scope === "CLASSROOM") {
    return !!targetClassroomId && row.classroomId === targetClassroomId;
  }

  return false;
}

function sortCalendarEvents(
  a: ClassCalendarEventRow,
  b: ClassCalendarEventRow,
) {
  const dateDiff = s(a.startDate).localeCompare(s(b.startDate));
  if (dateDiff !== 0) return dateDiff;

  const orderDiff = n(a.sortOrder, 999999) - n(b.sortOrder, 999999);
  if (orderDiff !== 0) return orderDiff;

  return s(a.title).localeCompare(s(b.title));
}

async function listAll<TRow>(
  model: ListableModel<TRow>,
  options?: ListOptions,
): Promise<TRow[]> {
  const rows: TRow[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res = await model.list({
      ...(options ?? {}),
      nextToken,
    });

    if (res.errors?.length) {
      throw new Error(formatModelErrors(res.errors));
    }

    rows.push(...(res.data ?? []));
    nextToken = res.nextToken ?? null;
  } while (nextToken);

  return rows;
}

function schedulePlanStatusRank(value?: string | null): number {
  const status = s(value).toUpperCase();

  switch (status) {
    case "ACTIVE":
      return 0;
    case "DRAFT":
      return 1;
    case "CLOSED":
      return 3;
    default:
      return 2;
  }
}

function scheduleMonthTimestamp(row: ScheduleMonthRow): string {
  const t = row as ScheduleMonthRow & TimestampLike;
  return s(row.issuedAt) || s(t.updatedAt) || s(t.createdAt);
}

function compareScheduleMonthCandidate(
  a: ScheduleMonthRow,
  b: ScheduleMonthRow,
): number {
  const statusDiff =
    schedulePlanStatusRank(a.status) - schedulePlanStatusRank(b.status);
  if (statusDiff !== 0) return statusDiff;

  const versionDiff = n(b.issueVersion) - n(a.issueVersion);
  if (versionDiff !== 0) return versionDiff;

  const timeDiff = scheduleMonthTimestamp(b).localeCompare(
    scheduleMonthTimestamp(a),
  );
  if (timeDiff !== 0) return timeDiff;

  return s(a.id).localeCompare(s(b.id));
}

function scheduleMonthOptionLabel(row: ScheduleMonthRow): string {
  const version = row.issueVersion ? ` / v${row.issueVersion}` : "";
  return `${row.monthKey} / ${row.title || "月案"} / ${row.status}${version}`;
}
const thStyle: CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#f3f4f6",
  textAlign: "left",
  verticalAlign: "top",
};

const tdStyle: CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  verticalAlign: "top",
};

const detailCellStyle: CSSProperties = {
  ...tdStyle,
  background: "#fafafa",
  padding: 12,
};

const subtleBoxStyle: CSSProperties = {
  padding: 12,
  borderRadius: 8,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
};

const smallMutedStyle: CSSProperties = {
  color: "#666",
  fontSize: 13,
};

export default function SimpleScheduleWorkspacePanel(props: Props) {
  const { owner } = props;

  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const [monthKey, setMonthKey] = useState(monthKeyFromDate(todayString()));
  const [selectedMonthId, setSelectedMonthId] = useState("");
  const [selectedClassMonthPlanId, setSelectedClassMonthPlanId] = useState("");
  const [expandedWeekStartDate, setExpandedWeekStartDate] = useState("");

  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [ageTargets, setAgeTargets] = useState<AgeTargetRow[]>([]);
  const [practiceRows, setPracticeRows] = useState<PracticeRow[]>([]);
  const [classAnnualPlans, setClassAnnualPlans] = useState<
    ClassAnnualPlanRow[]
  >([]);
  const [classQuarterPlans, setClassQuarterPlans] = useState<
    ClassQuarterPlanRow[]
  >([]);
  const [classMonthPlans, setClassMonthPlans] = useState<ClassMonthPlanRow[]>(
    [],
  );
  const [monthPhraseSelections, setMonthPhraseSelections] = useState<
    ClassMonthPlanPhraseSelectionRow[]
  >([]);
  const [planPhraseSelections, setPlanPhraseSelections] = useState<
    ClassPlanPhraseSelectionRow[]
  >([]);
  const [calendarEvents, setCalendarEvents] = useState<ClassCalendarEventRow[]>(
    [],
  );
  const [calendarForm, setCalendarForm] = useState<CalendarEventForm>(() =>
    createEmptyCalendarEventForm(monthKey, ""),
  );
  const [savingCalendarEvent, setSavingCalendarEvent] = useState(false);
  const [archivingCalendarEventId, setArchivingCalendarEventId] = useState<
    string | null
  >(null);
  const [months, setMonths] = useState<ScheduleMonthRow[]>([]);
  const [weeks, setWeeks] = useState<ScheduleWeekRow[]>([]);
  const [weekItemsByWeekId, setWeekItemsByWeekId] = useState<
    Record<string, ScheduleWeekItemRow[]>
  >({});
  const [latestDaysByWeekDateKey, setLatestDaysByWeekDateKey] = useState<
    Record<string, ScheduleDayRow | null>
  >({});
  const [practiceRecommendations, setPracticeRecommendations] = useState<
    PracticeRecommendation[]
  >([]);
  const [recommendLoading, setRecommendLoading] = useState(false);

  const [classroomId, setClassroomId] = useState("");
  const [ageTargetId, setAgeTargetId] = useState("");

  const scheduleMonthCandidates = useMemo(() => {
    return months
      .filter((row) => {
        const status = s(row.status).toUpperCase();

        return (
          row.monthKey === monthKey &&
          row.owner === owner &&
          row.classroomId === classroomId &&
          row.ageTargetId === ageTargetId &&
          status !== "CLOSED"
        );
      })
      .sort(compareScheduleMonthCandidate);
  }, [ageTargetId, classroomId, monthKey, months, owner]);

  const activeScheduleMonthCandidateCount = useMemo(() => {
    return scheduleMonthCandidates.filter(
      (row) => s(row.status).toUpperCase() === "ACTIVE",
    ).length;
  }, [scheduleMonthCandidates]);

  const selectedScheduleMonthForWarning = useMemo(() => {
    return (
      scheduleMonthCandidates.find((row) => row.id === selectedMonthId) ?? null
    );
  }, [scheduleMonthCandidates, selectedMonthId]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fiscalYear = useMemo(
    () => fiscalYearFromMonthKey(monthKey),
    [monthKey],
  );

  const practiceMap = useMemo(() => {
    const map = new Map<string, PracticeRow>();
    for (const row of practiceRows) {
      const code = s(row.practice_code);
      if (code) map.set(code, row);
    }
    return map;
  }, [practiceRows]);

  const selectedMonth = useMemo(
    () => months.find((m) => m.id === selectedMonthId) ?? null,
    [months, selectedMonthId],
  );

  const classMonthPlanCandidates = useMemo(() => {
    const selectedClassAnnualIds = new Set(
      classAnnualPlans
        .filter(
          (row) =>
            row.tenantId === tenantId &&
            row.fiscalYear === fiscalYear &&
            row.classroomId === classroomId,
        )
        .map((row) => row.id),
    );

    const selectedQuarterIds = new Set(
      classQuarterPlans
        .filter((row) => selectedClassAnnualIds.has(row.classAnnualPlanId))
        .map((row) => row.id),
    );

    const filtered = classMonthPlans.filter((row) => {
      if (row.tenantId !== tenantId) return false;
      if (row.monthKey !== monthKey) return false;

      if (selectedQuarterIds.size > 0) {
        return selectedQuarterIds.has(row.classQuarterPlanId);
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const aTitle = `${a.monthKey ?? ""} ${a.title ?? ""} ${a.id ?? ""}`;
      const bTitle = `${b.monthKey ?? ""} ${b.title ?? ""} ${b.id ?? ""}`;
      return aTitle.localeCompare(bTitle);
    });
  }, [
    classAnnualPlans,
    classMonthPlans,
    classQuarterPlans,
    classroomId,
    fiscalYear,
    monthKey,
    tenantId,
  ]);

  const selectedClassMonthPlan = useMemo(() => {
    const id =
      selectedClassMonthPlanId || selectedMonth?.sourceClassMonthPlanId || "";
    if (!id) return null;
    return classMonthPlans.find((row) => row.id === id) ?? null;
  }, [
    classMonthPlans,
    selectedClassMonthPlanId,
    selectedMonth?.sourceClassMonthPlanId,
  ]);

  const selectedClassQuarterPlan = useMemo(() => {
    const quarterId = selectedClassMonthPlan?.classQuarterPlanId ?? "";
    if (!quarterId) return null;
    return classQuarterPlans.find((row) => row.id === quarterId) ?? null;
  }, [classQuarterPlans, selectedClassMonthPlan?.classQuarterPlanId]);

  const selectedClassAnnualPlan = useMemo(() => {
    const annualId = selectedClassQuarterPlan?.classAnnualPlanId ?? "";
    if (annualId) {
      return classAnnualPlans.find((row) => row.id === annualId) ?? null;
    }

    return (
      classAnnualPlans.find(
        (row) =>
          row.tenantId === tenantId &&
          row.fiscalYear === fiscalYear &&
          row.classroomId === classroomId,
      ) ?? null
    );
  }, [
    classAnnualPlans,
    classroomId,
    fiscalYear,
    selectedClassQuarterPlan?.classAnnualPlanId,
    tenantId,
  ]);

  const selectedPlanPhraseSelections = useMemo(() => {
    if (!selectedClassMonthPlan?.id) return [];

    return monthPhraseSelections
      .filter((row) => row.classMonthPlanId === selectedClassMonthPlan.id)
      .filter((row) => activeSelection(row.status))
      .sort((a, b) => n(a.sortOrder) - n(b.sortOrder));
  }, [monthPhraseSelections, selectedClassMonthPlan?.id]);

  const selectedReferencePhraseSelections = useMemo(() => {
    const annualPlanId = selectedClassAnnualPlan?.id ?? "";
    const quarterPlanId = selectedClassQuarterPlan?.id ?? "";

    return planPhraseSelections
      .filter((row) => activeSelection(row.status))
      .filter((row) => s(row.relationUse || "REFERENCE") === "REFERENCE")
      .filter((row) => {
        const scope = s(row.planScopeType).toUpperCase();
        if (scope === "YEAR")
          return !!annualPlanId && row.classAnnualPlanId === annualPlanId;
        if (scope === "TERM")
          return !!quarterPlanId && row.classQuarterPlanId === quarterPlanId;
        return false;
      })
      .sort((a, b) => n(a.sortOrder) - n(b.sortOrder));
  }, [
    planPhraseSelections,
    selectedClassAnnualPlan?.id,
    selectedClassQuarterPlan?.id,
  ]);

  const selectedPlanScores = useMemo(
    () => scoreSetFromClassMonthPlan(selectedClassMonthPlan),
    [selectedClassMonthPlan],
  );

  const selectedPlanAbilityRows = useMemo(
    () =>
      buildAbilityWeightsFromRows({
        rows: selectedPlanPhraseSelections,
        defaultScopeType: "MONTH",
      }),
    [selectedPlanPhraseSelections],
  );

  const referenceAbilityRows = useMemo(
    () =>
      buildAbilityWeightsFromRows({
        rows: selectedReferencePhraseSelections,
        defaultScopeType: "YEAR",
      }),
    [selectedReferencePhraseSelections],
  );

  const combinedAbilityRows = useMemo(() => {
    const map = new Map<string, PlanAbilityWeightRow>();

    for (const row of [...selectedPlanAbilityRows, ...referenceAbilityRows]) {
      const current = map.get(row.abilityCode);
      if (current) {
        current.weight += row.weight;
        current.recommendWeight += row.recommendWeight;
        if (!current.sourceLabel.includes(row.sourceLabel)) {
          current.sourceLabel = `${current.sourceLabel}・${row.sourceLabel}`;
        }
      } else {
        map.set(row.abilityCode, { ...row });
      }
    }

    return [...map.values()].sort((a, b) => {
      const weightDiff = b.recommendWeight - a.recommendWeight;
      if (weightDiff !== 0) return weightDiff;
      return a.abilityCode.localeCompare(b.abilityCode);
    });
  }, [referenceAbilityRows, selectedPlanAbilityRows]);

  const selectedPlanAbilitySignature = useMemo(
    () =>
      combinedAbilityRows
        .map((row) => `${row.abilityCode}:${row.recommendWeight}`)
        .join("|"),
    [combinedAbilityRows],
  );

  const recommendedPracticeCodeSet = useMemo(
    () => new Set(practiceRecommendations.map((row) => row.practiceCode)),
    [practiceRecommendations],
  );

  const nonRecommendedPracticeRows = useMemo(
    () =>
      practiceRows.filter(
        (row) =>
          practiceActive(row) &&
          s(row.practice_code) &&
          !recommendedPracticeCodeSet.has(s(row.practice_code)),
      ),
    [practiceRows, recommendedPracticeCodeSet],
  );

  const referenceScores = useMemo(
    () => summarizeSelectionsToScores(selectedReferencePhraseSelections),
    [selectedReferencePhraseSelections],
  );

  const weekRangesInMonth = useMemo(() => {
    const { fromDate, toDate } = monthRange(monthKey);
    const allDates = listDates(fromDate, toDate);
    const seen = new Set<string>();

    return allDates
      .map((d) => mondayStart(d))
      .filter((monday) => {
        if (seen.has(monday)) return false;
        seen.add(monday);
        return true;
      })
      .map((monday) => ({
        weekStartDate: monday,
        weekEndDate: sundayEndFromMonday(monday),
        weekNoInMonth: weekNoInMonthFromDate(monday),
        label: `第${weekNoInMonthFromDate(monday)}週 ${monday} ～ ${sundayEndFromMonday(
          monday,
        )}`,
      }));
  }, [monthKey]);

  const weekMapByStartDate = useMemo(
    () => new Map(weeks.map((w) => [w.weekStartDate ?? "", w])),
    [weeks],
  );

  const referencePhraseLines = useMemo(() => {
    return selectedReferencePhraseSelections
      .map((row) => ({
        scopeLabel: selectionScopeLabel(row.planScopeType),
        text: s(row.phraseTextSnapshot),
      }))
      .filter((row) => row.text)
      .slice(0, 8);
  }, [selectedReferencePhraseSelections]);

  const selectedMonthCalendarEvents = useMemo(() => {
    const { fromDate, toDate } = monthRange(monthKey);

    return calendarEvents
      .filter((row) =>
        calendarEventVisibleForClassroom(row, tenantId, classroomId),
      )
      .filter((row) => calendarEventIntersectsRange(row, fromDate, toDate))
      .sort(sortCalendarEvents);
  }, [calendarEvents, classroomId, monthKey, tenantId]);

  const homeNoticeCalendarEvents = useMemo(
    () =>
      selectedMonthCalendarEvents.filter(
        (row) => row.showInHomeNotice || s(row.homeNoticeText),
      ),
    [selectedMonthCalendarEvents],
  );

  const weekSummaries: WeekSummaryRow[] = useMemo(() => {
    return weekRangesInMonth.map((range) => {
      const scheduleWeek = weekMapByStartDate.get(range.weekStartDate) ?? null;
      const items = scheduleWeek
        ? (weekItemsByWeekId[scheduleWeek.id] ?? [])
        : [];
      const rows: WeekDateRow[] = listDates(
        range.weekStartDate,
        range.weekEndDate,
      ).map((date) => {
        const weekday = toWeekday(date);
        const hits = items.filter(
          (it) => it.dayOfWeek === weekday || it.targetDate === date,
        );
        const canonical = pickCanonicalWeekItem(hits);

        return {
          date,
          weekday,
          label: `${date} (${dayOfWeekLabel(weekday)})`,
          weekItem: canonical,
          hasDuplicate: hits.length > 1,
        };
      });

      const totals = sumScoreSets(
        rows.map((r) => ({
          health: n(r.weekItem?.scoreHealth),
          humanRelations: n(r.weekItem?.scoreHumanRelations),
          environment: n(r.weekItem?.scoreEnvironment),
          language: n(r.weekItem?.scoreLanguage),
          expression: n(r.weekItem?.scoreExpression),
        })),
      );

      return {
        weekStartDate: range.weekStartDate,
        weekEndDate: range.weekEndDate,
        weekNoInMonth: range.weekNoInMonth,
        label: range.label,
        scheduleWeek,
        rows,
        totals,
      };
    });
  }, [weekRangesInMonth, weekMapByStartDate, weekItemsByWeekId]);

  const monthTotals = useMemo(
    () => sumScoreSets(weekSummaries.map((w) => w.totals)),
    [weekSummaries],
  );

  useEffect(() => {
    if (!expandedWeekStartDate && weekRangesInMonth[0]) {
      setExpandedWeekStartDate(weekRangesInMonth[0].weekStartDate);
      return;
    }

    const exists = weekRangesInMonth.some(
      (w) => w.weekStartDate === expandedWeekStartDate,
    );
    if (!exists && weekRangesInMonth[0]) {
      setExpandedWeekStartDate(weekRangesInMonth[0].weekStartDate);
    }
  }, [expandedWeekStartDate, weekRangesInMonth]);

  useEffect(() => {
    if (selectedMonth?.sourceClassMonthPlanId) {
      setSelectedClassMonthPlanId(selectedMonth.sourceClassMonthPlanId);
      return;
    }

    setSelectedClassMonthPlanId((prev) => {
      if (prev && classMonthPlanCandidates.some((row) => row.id === prev)) {
        return prev;
      }
      return classMonthPlanCandidates[0]?.id ?? "";
    });
  }, [classMonthPlanCandidates, selectedMonth?.sourceClassMonthPlanId]);

  useEffect(() => {
    setCalendarForm((prev) => {
      if (prev.title || prev.description || prev.homeNoticeText) return prev;
      return createEmptyCalendarEventForm(monthKey, classroomId);
    });
  }, [classroomId, monthKey]);

  const fetchWeeksForMonth = useCallback(async (monthId: string) => {
    if (!monthId) {
      setWeeks([]);
      setWeekItemsByWeekId({});
      setLatestDaysByWeekDateKey({});
      return;
    }

    const weekRows = (
      await listAll(client.models.ScheduleWeek, {
        filter: {
          sourceScheduleMonthId: { eq: monthId },
        },
        limit: 1000,
      } as ListOptions)
    ).sort((a, b) => s(a.weekStartDate).localeCompare(s(b.weekStartDate)));

    setWeeks(weekRows);

    const itemEntries = await Promise.all(
      weekRows.map(async (week) => {
        const itemRows = (
          await listAll(client.models.ScheduleWeekItem, {
            filter: {
              scheduleWeekId: { eq: week.id },
            },
            limit: 1000,
          } as ListOptions)
        ).sort((a, b) => {
          const dayDiff = n(a.dayOfWeek) - n(b.dayOfWeek);
          if (dayDiff !== 0) return dayDiff;
          return n(a.sortOrder) - n(b.sortOrder);
        });
        return [week.id, itemRows] as const;
      }),
    );

    setWeekItemsByWeekId(Object.fromEntries(itemEntries));

    const dayEntries = await Promise.all(
      weekRows.map(async (week) => {
        const dayRows = await listAll(client.models.ScheduleDay, {
          filter: {
            sourceWeekId: { eq: week.id },
          },
          limit: 1000,
        } as ListOptions);

        return dayRows.map(
          (day) => [makeWeekDateKey(week.id, day.targetDate), day] as const,
        );
      }),
    );

    const latestMap = new Map<string, ScheduleDayRow>();
    for (const entries of dayEntries) {
      for (const [key, day] of entries) {
        const current = latestMap.get(key);
        if (!current || latestIssueVersion(current, day) > 0) {
          latestMap.set(key, day);
        }
      }
    }

    setLatestDaysByWeekDateKey(Object.fromEntries(latestMap));
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const trimmedTenantId = tenantId.trim() || DEFAULT_TENANT_ID;
      const [
        classroomRes,
        ageTargetRes,
        practiceRes,
        classAnnualPlanRes,
        classQuarterPlanRes,
        classMonthPlanRes,
        monthPhraseSelectionRes,
        planPhraseSelectionRes,
        calendarEventRes,
        monthRes,
      ] = await Promise.all([
        client.models.Classroom.list({
          filter: {
            tenantId: { eq: trimmedTenantId },
          },
          limit: 1000,
        } as ListOptions),
        client.models.SchoolAnnualAgeTarget.list({
          filter: {
            tenantId: { eq: trimmedTenantId },
            fiscalYear: { eq: fiscalYear },
          },
          limit: 1000,
        } as ListOptions),
        client.models.PracticeCode.list({
          limit: 10000,
        } as ListOptions),
        client.models.ClassAnnualPlan.list({
          filter: {
            tenantId: { eq: trimmedTenantId },
            fiscalYear: { eq: fiscalYear },
          },
          limit: 2000,
        } as ListOptions),
        client.models.ClassQuarterPlan.list({
          filter: {
            tenantId: { eq: trimmedTenantId },
            fiscalYear: { eq: fiscalYear },
          },
          limit: 5000,
        } as ListOptions),
        client.models.ClassMonthPlan.list({
          filter: {
            tenantId: { eq: trimmedTenantId },
            fiscalYear: { eq: fiscalYear },
            monthKey: { eq: monthKey },
          },
          limit: 5000,
        } as ListOptions),
        client.models.ClassMonthPlanPhraseSelection.list({
          filter: {
            tenantId: { eq: trimmedTenantId },
            fiscalYear: { eq: fiscalYear },
            monthKey: { eq: monthKey },
          },
          limit: 10000,
        } as ListOptions),
        client.models.ClassPlanPhraseSelection.list({
          filter: {
            tenantId: { eq: trimmedTenantId },
            fiscalYear: { eq: fiscalYear },
          },
          limit: 20000,
        } as ListOptions),
        client.models.ClassCalendarEvent.list({
          filter: {
            tenantId: { eq: trimmedTenantId },
          },
          limit: 2000,
        } as ListOptions),
        client.models.ScheduleMonth.list({
          filter: {
            owner: { eq: owner },
          },
          limit: 1000,
        } as ListOptions),
      ]);

      const allResponses = [
        classroomRes,
        ageTargetRes,
        practiceRes,
        classAnnualPlanRes,
        classQuarterPlanRes,
        classMonthPlanRes,
        monthPhraseSelectionRes,
        planPhraseSelectionRes,
        calendarEventRes,
        monthRes,
      ];
      const responseErrors = allResponses.flatMap((res) => res.errors ?? []);
      if (responseErrors.length > 0) {
        throw new Error(formatModelErrors(responseErrors));
      }

      const classroomRows = classroomRes.data ?? [];
      const ageRows = ageTargetRes.data ?? [];
      const practices = [...(practiceRes.data ?? [])]
        .filter(practiceActive)
        .sort((a, b) => s(a.practice_code).localeCompare(s(b.practice_code)));
      const monthRows = [...(monthRes.data ?? [])]
        .filter((row) => row.monthKey === monthKey || !row.monthKey)
        .sort((a, b) => s(b.monthKey).localeCompare(s(a.monthKey)));
      const calendarRows = [...(calendarEventRes.data ?? [])]
        .filter((row) => s(row.status || "ACTIVE").toUpperCase() !== "ARCHIVED")
        .sort(sortCalendarEvents);

      setTenantId(trimmedTenantId);
      setClassrooms(classroomRows);
      setAgeTargets(ageRows);
      setPracticeRows(practices);
      setClassAnnualPlans(classAnnualPlanRes.data ?? []);
      setClassQuarterPlans(classQuarterPlanRes.data ?? []);
      setClassMonthPlans(classMonthPlanRes.data ?? []);
      setMonthPhraseSelections(monthPhraseSelectionRes.data ?? []);
      setPlanPhraseSelections(planPhraseSelectionRes.data ?? []);
      setCalendarEvents(calendarRows);
      setMonths(monthRows);

      const nextClassroomId = classroomId || classroomRows[0]?.id || "";
      const nextAgeTargetId = ageTargetId || ageRows[0]?.id || "";
      setClassroomId(nextClassroomId);
      setAgeTargetId(nextAgeTargetId);

      const sameMonth = monthRows.find(
        (m) =>
          m.monthKey === monthKey &&
          m.owner === owner &&
          (!nextClassroomId || m.classroomId === nextClassroomId),
      );
      if (sameMonth) {
        setSelectedMonthId(sameMonth.id);
        setClassroomId((prev) => prev || sameMonth.classroomId || "");
        setAgeTargetId((prev) => prev || sameMonth.ageTargetId || "");
        if (sameMonth.sourceClassMonthPlanId) {
          setSelectedClassMonthPlanId(sameMonth.sourceClassMonthPlanId);
        }
        await fetchWeeksForMonth(sameMonth.id);
      } else {
        setSelectedMonthId("");
        setWeeks([]);
        setWeekItemsByWeekId({});
        setLatestDaysByWeekDateKey({});
      }

      setMessage("読込しました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `初期読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }, [
    ageTargetId,
    classroomId,
    fetchWeeksForMonth,
    fiscalYear,
    monthKey,
    owner,
    tenantId,
  ]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!monthKey || !classroomId || !ageTargetId) {
      setSelectedMonthId("");
      return;
    }

    if (
      selectedMonthId &&
      scheduleMonthCandidates.some((row) => row.id === selectedMonthId)
    ) {
      return;
    }

    setSelectedMonthId(scheduleMonthCandidates[0]?.id ?? "");
  }, [
    ageTargetId,
    classroomId,
    monthKey,
    scheduleMonthCandidates,
    selectedMonthId,
  ]);

  useEffect(() => {
    void fetchWeeksForMonth(selectedMonthId);
  }, [fetchWeeksForMonth, selectedMonthId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (combinedAbilityRows.length === 0) {
        setPracticeRecommendations([]);
        return;
      }

      setRecommendLoading(true);

      try {
        const recMap = new Map<
          string,
          {
            practiceCode: string;
            practiceName: string;
            recommendScore: number;
            monthMatchCodes: Set<string>;
            referenceMatchCodes: Set<string>;
            totalPracticeScore: number;
            matchedAbilities: Set<string>;
            sourceLabels: Set<string>;
          }
        >();

        const targetAbilities = combinedAbilityRows.slice(0, 25);

        for (const ability of targetAbilities) {
          const { data, errors } =
            await client.models.AbilityPracticeLink.listByAbility({
              abilityCode: ability.abilityCode,
            });

          if (errors?.length) {
            throw new Error(formatModelErrors(errors));
          }

          for (const link of data ?? []) {
            const practiceCode = s(link.practiceCode);
            if (!practiceCode) continue;

            const practice = practiceMap.get(practiceCode);
            if (!practice || !practiceActive(practice)) continue;

            const practiceScore = n(link.score);
            if (practiceScore <= 0) continue;

            const current = recMap.get(practiceCode) ?? {
              practiceCode,
              practiceName: s(practice.name),
              recommendScore: 0,
              monthMatchCodes: new Set<string>(),
              referenceMatchCodes: new Set<string>(),
              totalPracticeScore: 0,
              matchedAbilities: new Set<string>(),
              sourceLabels: new Set<string>(),
            };

            current.recommendScore += ability.recommendWeight * practiceScore;
            current.totalPracticeScore += practiceScore;
            if (ability.sourceKind === "MONTH") {
              current.monthMatchCodes.add(ability.abilityCode);
            } else {
              current.referenceMatchCodes.add(ability.abilityCode);
            }
            current.matchedAbilities.add(
              `${ability.label}+${ability.weight}（${ability.sourceLabel}）`,
            );
            current.sourceLabels.add(ability.sourceLabel);

            recMap.set(practiceCode, current);
          }
        }

        const nextRows = [...recMap.values()]
          .map((row) => ({
            practiceCode: row.practiceCode,
            practiceName: row.practiceName,
            recommendScore: row.recommendScore,
            matchAbilityCount:
              row.monthMatchCodes.size + row.referenceMatchCodes.size,
            totalPracticeScore: row.totalPracticeScore,
            monthMatchCount: row.monthMatchCodes.size,
            referenceMatchCount: row.referenceMatchCodes.size,
            matchedAbilities: [...row.matchedAbilities],
            sourceLabels: [...row.sourceLabels],
          }))
          .sort((a, b) => {
            const monthDiff = b.monthMatchCount - a.monthMatchCount;
            if (monthDiff !== 0) return monthDiff;
            const scoreDiff = b.recommendScore - a.recommendScore;
            if (scoreDiff !== 0) return scoreDiff;
            const countDiff = b.matchAbilityCount - a.matchAbilityCount;
            if (countDiff !== 0) return countDiff;
            return a.practiceCode.localeCompare(b.practiceCode);
          })
          .slice(0, 20);

        if (!cancelled) {
          setPracticeRecommendations(nextRows);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setPracticeRecommendations([]);
          setMessage(
            `Practice推薦エラー: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      } finally {
        if (!cancelled) {
          setRecommendLoading(false);
        }
      }
    }

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [combinedAbilityRows, practiceMap, selectedPlanAbilitySignature]);

  async function runIssueWeekMutation(args: IssueScheduleWeekArgs) {
    const runner = client.mutations?.issueScheduleWeekFromScheduleMonth;
    if (!runner) {
      throw new Error(
        "issueScheduleWeekFromScheduleMonth が client.mutations に見つかりません。",
      );
    }

    let res:
      | OperationEnvelope<IssueScheduleWeekResult>
      | IssueScheduleWeekResult;

    try {
      res = await runner(args);
    } catch {
      res = await runner({ input: args });
    }

    const errors = getOperationErrors(res);
    if (errors?.length) {
      throw new Error(formatModelErrors(errors));
    }

    return getOperationData(res);
  }

  async function runIssueDayMutation(args: IssueScheduleDayArgs) {
    const runner = client.mutations?.issueScheduleDayFromScheduleWeek;
    if (!runner) {
      throw new Error(
        "issueScheduleDayFromScheduleWeek が client.mutations に見つかりません。",
      );
    }

    let res: OperationEnvelope<IssueScheduleDayResult> | IssueScheduleDayResult;

    try {
      res = await runner(args);
    } catch {
      res = await runner({ input: args });
    }

    const errors = getOperationErrors(res);
    if (errors?.length) {
      throw new Error(formatModelErrors(errors));
    }

    return getOperationData(res);
  }

  async function createCalendarEvent() {
    const title = s(calendarForm.title);
    if (!tenantId.trim()) {
      setMessage("tenantId を入力してください。");
      return;
    }
    if (!title) {
      setMessage("カレンダー行事のタイトルを入力してください。");
      return;
    }
    if (calendarForm.scopeType === "CLASSROOM" && !calendarForm.classroomId) {
      setMessage("クラス行事の場合は classroom を選択してください。");
      return;
    }
    if (!calendarForm.startDate) {
      setMessage("開始日を入力してください。");
      return;
    }

    const dayOfMonth = toOptionalInt(calendarForm.dayOfMonth);
    if (
      calendarForm.dateMode === "MONTHLY_DATE" &&
      (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31)
    ) {
      setMessage("毎月日付は 1〜31 の範囲で入力してください。");
      return;
    }

    setSavingCalendarEvent(true);
    setMessage("");

    try {
      const createRes = await client.models.ClassCalendarEvent.create({
        tenantId: tenantId.trim(),
        owner,
        scopeType: calendarForm.scopeType,
        classroomId:
          calendarForm.scopeType === "CLASSROOM"
            ? calendarForm.classroomId
            : undefined,
        title,
        description: calendarForm.description || undefined,
        eventType: calendarForm.eventType,
        dateMode: calendarForm.dateMode,
        startDate: calendarForm.startDate,
        endDate: calendarForm.endDate || undefined,
        dayOfWeek:
          calendarForm.dateMode === "WEEKLY"
            ? toOptionalInt(calendarForm.dayOfWeek)
            : undefined,
        dayOfMonth:
          calendarForm.dateMode === "MONTHLY_DATE" ? dayOfMonth : undefined,
        startTime: calendarForm.startTime || undefined,
        endTime: calendarForm.endTime || undefined,
        showInPlan: calendarForm.showInPlan,
        showInSchedule: calendarForm.showInSchedule,
        showInHomeNotice: calendarForm.showInHomeNotice,
        homeNoticeText: calendarForm.homeNoticeText || undefined,
        sortOrder: toOptionalInt(calendarForm.sortOrder) ?? 0,
        status: "ACTIVE",
      } as MutationInput);

      if (!createRes.data) {
        throw new Error(
          formatModelErrors(
            createRes.errors,
            "ClassCalendarEvent の作成に失敗しました。",
          ),
        );
      }

      setCalendarEvents((prev) =>
        [...prev, createRes.data as ClassCalendarEventRow].sort(
          sortCalendarEvents,
        ),
      );

      setCalendarForm((prev) => ({
        ...createEmptyCalendarEventForm(monthKey, classroomId),
        scopeType: prev.scopeType,
        classroomId:
          prev.scopeType === "CLASSROOM" ? prev.classroomId || classroomId : "",
      }));

      setMessage("カレンダー行事を登録しました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `カレンダー行事登録エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setSavingCalendarEvent(false);
    }
  }

  async function archiveCalendarEvent(row: ClassCalendarEventRow) {
    setArchivingCalendarEventId(row.id);
    setMessage("");

    try {
      const updateRes = await client.models.ClassCalendarEvent.update({
        id: row.id,
        status: "ARCHIVED",
      } as MutationInput);

      if (!updateRes.data) {
        throw new Error(
          formatModelErrors(
            updateRes.errors,
            "ClassCalendarEvent の整理に失敗しました。",
          ),
        );
      }

      setCalendarEvents((prev) => prev.filter((item) => item.id !== row.id));
      setMessage("カレンダー行事を整理しました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `カレンダー行事整理エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setArchivingCalendarEventId(null);
    }
  }

  async function createMonthAndWeeks() {
    if (!monthKey || !classroomId || !ageTargetId) {
      setMessage("monthKey / classroom / ageTarget を選択してください。");
      return;
    }

    if (scheduleMonthCandidates.length > 0) {
      const existing = scheduleMonthCandidates[0];
      setSelectedMonthId(existing.id);
      await fetchWeeksForMonth(existing.id);
      setMessage(
        [
          "既存のSchedule月案を使用します。新規作成は行いませんでした。",
          `selected: ${scheduleMonthOptionLabel(existing)}`,
          activeScheduleMonthCandidateCount > 1
            ? "警告: ACTIVEのSchedule月案が複数あります。古い重複データの整理を検討してください。"
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
      return;
    }
    if (!tenantId.trim()) {
      setMessage("tenantId を入力してください。");
      return;
    }
    if (!classroomId) {
      setMessage("classroom を選択してください。");
      return;
    }
    if (!ageTargetId) {
      setMessage("ageTarget を選択してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const duplicate = months.find(
        (row) =>
          row.monthKey === monthKey &&
          row.classroomId === classroomId &&
          row.owner === owner,
      );

      const month = duplicate ?? null;
      let scheduleMonth = month;

      if (!scheduleMonth) {
        const createRes = await client.models.ScheduleMonth.create({
          tenantId: tenantId.trim(),
          owner,
          classroomId,
          ageTargetId,
          sourceClassMonthPlanId: selectedClassMonthPlanId || undefined,
          monthKey,
          title: `${monthKey} 月案`,
          notes: selectedClassMonthPlan?.goalTextC || undefined,
          status: "ACTIVE",
          issueType: "MANUAL",
          issueVersion: 1,
          issuedAt: new Date().toISOString(),
        } as MutationInput);

        if (!createRes.data) {
          throw new Error(
            formatModelErrors(
              createRes.errors,
              "ScheduleMonth の作成に失敗しました。",
            ),
          );
        }

        scheduleMonth = createRes.data as ScheduleMonthRow;
        setMonths((prev) => [scheduleMonth as ScheduleMonthRow, ...prev]);
      }

      if (!scheduleMonth)
        throw new Error("ScheduleMonth を取得できませんでした。");

      let issuedCount = 0;
      const messages: string[] = [];
      for (const range of weekRangesInMonth) {
        const result = await runIssueWeekMutation({
          scheduleMonthId: scheduleMonth.id,
          weekStartDate: range.weekStartDate,
          weekEndDate: range.weekEndDate,
          weekNo: range.weekNoInMonth,
          issueType: "MANUAL",
        });
        issuedCount += result.status === "ISSUED" ? 1 : 0;
        messages.push(
          `${range.label}: ${result.status ?? "-"}${result.message ? ` / ${result.message}` : ""}`,
        );
      }

      setSelectedMonthId(scheduleMonth.id);
      await fetchWeeksForMonth(scheduleMonth.id);
      setMessage(
        [
          `月案＋週案を作成しました。新規週案: ${issuedCount}件`,
          ...messages,
        ].join("\n"),
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `月案＋週案作成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function fillMissingWeeksForSelectedMonth() {
    if (!selectedMonthId) {
      setMessage("Schedule月案を選択してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let issuedCount = 0;
      const messages: string[] = [];

      for (const range of weekRangesInMonth) {
        const exists = weeks.some(
          (row) =>
            row.sourceScheduleMonthId === selectedMonthId &&
            row.weekStartDate === range.weekStartDate,
        );
        if (exists) continue;

        const result = await runIssueWeekMutation({
          scheduleMonthId: selectedMonthId,
          weekStartDate: range.weekStartDate,
          weekEndDate: range.weekEndDate,
          weekNo: range.weekNoInMonth,
          issueType: "MANUAL",
        });
        issuedCount += result.status === "ISSUED" ? 1 : 0;
        messages.push(
          `${range.label}: ${result.status ?? "-"}${result.message ? ` / ${result.message}` : ""}`,
        );
      }

      await fetchWeeksForMonth(selectedMonthId);
      setMessage(
        issuedCount > 0
          ? [
              `不足週案を補完しました。新規週案: ${issuedCount}件`,
              ...messages,
            ].join("\n")
          : "不足している週案はありません。",
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `不足週案補完エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function attachSelectedPlanToSelectedMonth() {
    if (!selectedMonthId || !selectedClassMonthPlanId) {
      setMessage("Schedule月案とPLAN_V2月計画を選択してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const updateRes = await client.models.ScheduleMonth.update({
        id: selectedMonthId,
        sourceClassMonthPlanId: selectedClassMonthPlanId,
        notes: selectedClassMonthPlan?.goalTextC || undefined,
      } as MutationInput);

      if (!updateRes.data) {
        throw new Error(
          formatModelErrors(
            updateRes.errors,
            "PLAN月計画の紐づけに失敗しました。",
          ),
        );
      }

      setMonths((prev) =>
        prev.map((row) =>
          row.id === selectedMonthId
            ? (updateRes.data as ScheduleMonthRow)
            : row,
        ),
      );
      setMessage("PLAN月計画をSchedule月案へ紐づけました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `PLAN月計画紐づけエラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeekItems(scheduleWeekId: string) {
    return (
      await listAll(client.models.ScheduleWeekItem, {
        filter: {
          scheduleWeekId: { eq: scheduleWeekId },
        },
        limit: 1000,
      } as ListOptions)
    ).sort((a, b) => {
      const dayDiff = n(a.dayOfWeek) - n(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return n(a.sortOrder) - n(b.sortOrder);
    });
  }

  async function computePracticeScores(
    practiceCode: string,
  ): Promise<ScoreSet> {
    if (!practiceCode) return emptyScores();

    const { data, errors } =
      await client.models.AbilityPracticeLink.listByPractice({
        practiceCode,
      });

    if (errors?.length) {
      throw new Error(formatModelErrors(errors));
    }

    const scores = emptyScores();
    for (const link of data ?? []) {
      const key = domainKeyFromAbilityCode(link.abilityCode);
      if (!key) continue;
      scores[key] += n(link.score);
    }

    return scores;
  }

  async function saveWeekPractice(
    scheduleWeek: ScheduleWeekRow,
    row: WeekDateRow,
    nextPracticeCode: string,
  ) {
    setLoading(true);
    setMessage("");

    try {
      const practice = nextPracticeCode
        ? practiceMap.get(nextPracticeCode)
        : null;
      const scores = await computePracticeScores(nextPracticeCode);
      const allItems = await fetchWeekItems(scheduleWeek.id);
      const sameDayItems = allItems.filter(
        (item) =>
          item.dayOfWeek === row.weekday || item.targetDate === row.date,
      );
      const canonical = pickCanonicalWeekItem(sameDayItems) ?? row.weekItem;
      const duplicateItems = canonical
        ? sameDayItems.filter((item) => item.id !== canonical.id)
        : [];

      const basePayload = {
        tenantId: scheduleWeek.tenantId,
        owner: scheduleWeek.owner,
        scheduleWeekId: scheduleWeek.id,
        sourceMonthItemId: canonical?.sourceMonthItemId ?? undefined,
        sourceClassWeekPracticeAssignmentId:
          canonical?.sourceClassWeekPracticeAssignmentId ?? undefined,
        dayOfWeek: row.weekday,
        targetDate: row.date,
        sourceType: canonical?.sourceType ?? "PLANNED",
        title: practice ? s(practice.name) || nextPracticeCode : "活動未設定",
        eventLabel: canonical?.eventLabel ?? "",
        description: practice ? s(practice.memo) : "",
        startTime: canonical?.startTime ?? DEFAULT_START_TIME,
        endTime: canonical?.endTime ?? DEFAULT_END_TIME,
        sortOrder: canonical?.sortOrder ?? row.weekday * 10,
        practiceCode: nextPracticeCode || undefined,
        practiceTitleSnapshot: practice ? s(practice.name) : undefined,
        scoreHealth: scores.health,
        scoreHumanRelations: scores.humanRelations,
        scoreEnvironment: scores.environment,
        scoreLanguage: scores.language,
        scoreExpression: scores.expression,
      };

      if (canonical) {
        const updateRes = await client.models.ScheduleWeekItem.update({
          id: canonical.id,
          ...basePayload,
        } as MutationInput);

        if (!updateRes.data) {
          throw new Error(
            formatModelErrors(
              updateRes.errors,
              "ScheduleWeekItem の更新に失敗しました。",
            ),
          );
        }
      } else {
        const createRes = await client.models.ScheduleWeekItem.create(
          basePayload as MutationInput,
        );

        if (!createRes.data) {
          throw new Error(
            formatModelErrors(
              createRes.errors,
              "ScheduleWeekItem の作成に失敗しました。",
            ),
          );
        }
      }

      for (const duplicate of duplicateItems) {
        await client.models.ScheduleWeekItem.update({
          id: duplicate.id,
          practiceCode: undefined,
          title: `${duplicate.title || "重複"}（整理済）`,
          description: duplicate.description ?? undefined,
        } as MutationInput);
      }

      await fetchWeeksForMonth(
        scheduleWeek.sourceScheduleMonthId ?? selectedMonthId,
      );
      setMessage(
        duplicateItems.length > 0
          ? `Practiceを保存しました。重複候補 ${duplicateItems.length}件を整理しました。`
          : "Practiceを保存しました。",
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `Practice保存エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function issueDayForRow(
    scheduleWeek: ScheduleWeekRow,
    row: WeekDateRow,
    issueType: "MANUAL" | "MANUAL_REISSUE",
  ) {
    if (!row.weekItem?.practiceCode) {
      setMessage("日案発行前にPracticeを選択してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await runIssueDayMutation({
        scheduleWeekId: scheduleWeek.id,
        targetDate: row.date,
        issueType,
      });

      await fetchWeeksForMonth(
        scheduleWeek.sourceScheduleMonthId ?? selectedMonthId,
      );
      setMessage(
        `日案を発行しました。status=${result.status ?? "-"}${result.issueVersion ? ` / issueVersion=${result.issueVersion}` : ""}${result.message ? ` / ${result.message}` : ""}`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `日案発行エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  function getLatestDay(scheduleWeekId: string, targetDate: string) {
    return (
      latestDaysByWeekDateKey[makeWeekDateKey(scheduleWeekId, targetDate)] ??
      null
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fff",
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Schedule Workspace</h2>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <label>
            monthKey{" "}
            <input
              type="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
            />
          </label>

          <label>
            tenantId{" "}
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              style={{ width: 140 }}
            />
          </label>

          <label>
            classroom{" "}
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
            >
              <option value="">選択してください</option>
              {classrooms.map((row) => (
                <option key={row.id} value={row.id}>
                  {classroomLabel(row)}
                </option>
              ))}
            </select>
          </label>

          <label>
            ageTarget{" "}
            <select
              value={ageTargetId}
              onChange={(e) => setAgeTargetId(e.target.value)}
            >
              <option value="">選択してください</option>
              {ageTargets.map((row) => (
                <option key={row.id} value={row.id}>
                  {ageTargetLabel(row)}
                </option>
              ))}
            </select>
          </label>

          <button onClick={() => void loadInitial()} disabled={loading}>
            再読込
          </button>

          <button onClick={() => void createMonthAndWeeks()} disabled={loading}>
            月案＋週案を作成
          </button>

          <button
            onClick={() => void fillMissingWeeksForSelectedMonth()}
            disabled={!selectedMonthId || loading}
          >
            不足週案を補完
          </button>
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
            Schedule月案{" "}
            <select
              value={selectedMonthId}
              onChange={(e) => setSelectedMonthId(e.target.value)}
              style={{ minWidth: 260 }}
            >
              <option value="">未選択</option>
              {scheduleMonthCandidates.map((row) => (
                <option key={row.id} value={row.id}>
                  {scheduleMonthOptionLabel(row)}
                </option>
              ))}
            </select>
          </label>

          <label>
            PLAN_V2月計画{" "}
            <select
              value={selectedClassMonthPlanId}
              onChange={(e) => setSelectedClassMonthPlanId(e.target.value)}
              style={{ minWidth: 360 }}
            >
              <option value="">未選択</option>
              {classMonthPlanCandidates.map((row) => (
                <option key={row.id} value={row.id}>
                  {classMonthPlanLabel(row)}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() => void attachSelectedPlanToSelectedMonth()}
            disabled={!selectedMonthId || !selectedClassMonthPlanId || loading}
          >
            PLAN月計画を紐づけ
          </button>
        </div>

        {monthKey && classroomId && ageTargetId ? (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background:
                activeScheduleMonthCandidateCount === 1 &&
                selectedScheduleMonthForWarning &&
                s(selectedScheduleMonthForWarning.status).toUpperCase() ===
                  "ACTIVE"
                  ? "#f8fafc"
                  : "#fff7ed",
              border:
                activeScheduleMonthCandidateCount === 1 &&
                selectedScheduleMonthForWarning &&
                s(selectedScheduleMonthForWarning.status).toUpperCase() ===
                  "ACTIVE"
                  ? "1px solid #e5e7eb"
                  : "1px solid #fed7aa",
              color: "#444",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            <div>
              Schedule月案候補: {scheduleMonthCandidates.length}件 / ACTIVE:{" "}
              {activeScheduleMonthCandidateCount}件
            </div>

            {scheduleMonthCandidates.length === 0 ? (
              <div>
                この monthKey / classroom / ageTarget
                に一致するSchedule月案がありません。
                「月案＋週案を作成」で作成してください。
              </div>
            ) : null}

            {activeScheduleMonthCandidateCount > 1 ? (
              <div>
                警告: 同じ monthKey / classroom / ageTarget に ACTIVE
                のSchedule月案が複数あります。
                先頭候補を使用しますが、古い重複データの整理を検討してください。
              </div>
            ) : null}

            {scheduleMonthCandidates.length > 0 &&
            activeScheduleMonthCandidateCount === 0 ? (
              <div>
                警告: ACTIVE
                のSchedule月案がありません。DRAFTを選択して週案・日案を発行すると、
                DRAFT内容が採用されます。
              </div>
            ) : null}

            {selectedScheduleMonthForWarning &&
            s(selectedScheduleMonthForWarning.status).toUpperCase() !==
              "ACTIVE" ? (
              <div>
                現在選択中:{" "}
                {scheduleMonthOptionLabel(selectedScheduleMonthForWarning)}
                。通常運用では ACTIVE の月案を選んでください。
              </div>
            ) : null}
          </div>
        ) : null}
        {message ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              background: "#f6fbff",
              border: "1px solid #dbeafe",
              borderRadius: 8,
              padding: 12,
            }}
          >
            {message}
          </pre>
        ) : null}
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fff",
          display: "grid",
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>行事カレンダー</h3>
          <div style={smallMutedStyle}>
            園行事は全クラス、クラス行事は選択中のクラスに表示されます。
            ここで登録した内容を、PLAN
            v2・月案・週案・日案から参照していきます。
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <label>
            対象{" "}
            <select
              value={calendarForm.scopeType}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  scopeType: e.target.value as CalendarEventScopeType,
                  classroomId:
                    e.target.value === "CLASSROOM"
                      ? prev.classroomId || classroomId
                      : "",
                }))
              }
            >
              <option value="SCHOOL">園行事</option>
              <option value="CLASSROOM">クラス行事</option>
            </select>
          </label>

          <label>
            クラス{" "}
            <select
              value={calendarForm.classroomId}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  classroomId: e.target.value,
                  scopeType: e.target.value ? "CLASSROOM" : prev.scopeType,
                }))
              }
              disabled={calendarForm.scopeType !== "CLASSROOM"}
            >
              <option value="">園全体</option>
              {classrooms.map((row) => (
                <option key={row.id} value={row.id}>
                  {classroomLabel(row)}
                </option>
              ))}
            </select>
          </label>

          <label>
            種別{" "}
            <select
              value={calendarForm.eventType}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  eventType: e.target.value as CalendarEventKind,
                }))
              }
            >
              {CALENDAR_EVENT_TYPE_OPTIONS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            日付区分{" "}
            <select
              value={calendarForm.dateMode}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  dateMode: e.target.value as CalendarEventDateMode,
                }))
              }
            >
              {CALENDAR_DATE_MODE_OPTIONS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          タイトル{" "}
          <input
            type="text"
            value={calendarForm.title}
            onChange={(e) =>
              setCalendarForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="例：避難訓練、誕生会、着替え交換日"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          説明{" "}
          <textarea
            rows={2}
            value={calendarForm.description}
            onChange={(e) =>
              setCalendarForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="行事の補足、保育者向けメモなど"
            style={{ width: "100%" }}
          />
        </label>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {calendarForm.dateMode === "WEEKLY" ? (
            <label>
              曜日{" "}
              <select
                value={calendarForm.dayOfWeek}
                onChange={(e) =>
                  setCalendarForm((prev) => ({
                    ...prev,
                    dayOfWeek: e.target.value,
                  }))
                }
              >
                {CALENDAR_DAY_OF_WEEK_OPTIONS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {calendarForm.dateMode === "MONTHLY_DATE" ? (
            <label>
              毎月日付{" "}
              <input
                type="number"
                min={1}
                max={31}
                value={calendarForm.dayOfMonth}
                onChange={(e) =>
                  setCalendarForm((prev) => ({
                    ...prev,
                    dayOfMonth: e.target.value,
                  }))
                }
                style={{ width: 80 }}
              />
            </label>
          ) : null}

          <label>
            開始日{" "}
            <input
              type="date"
              value={calendarForm.startDate}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
            />
          </label>

          <label>
            終了日{" "}
            <input
              type="date"
              value={calendarForm.endDate}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
            />
          </label>

          <label>
            開始時刻{" "}
            <input
              type="time"
              value={calendarForm.startTime}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
              }
            />
          </label>

          <label>
            終了時刻{" "}
            <input
              type="time"
              value={calendarForm.endTime}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
              }
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label>
            <input
              type="checkbox"
              checked={calendarForm.showInPlan}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  showInPlan: e.target.checked,
                }))
              }
            />{" "}
            PLANに表示
          </label>

          <label>
            <input
              type="checkbox"
              checked={calendarForm.showInSchedule}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  showInSchedule: e.target.checked,
                }))
              }
            />{" "}
            Scheduleに表示
          </label>

          <label>
            <input
              type="checkbox"
              checked={calendarForm.showInHomeNotice}
              onChange={(e) =>
                setCalendarForm((prev) => ({
                  ...prev,
                  showInHomeNotice: e.target.checked,
                }))
              }
            />{" "}
            家庭への連絡事項に表示
          </label>
        </div>

        <label>
          家庭への連絡事項{" "}
          <textarea
            rows={3}
            value={calendarForm.homeNoticeText}
            onChange={(e) =>
              setCalendarForm((prev) => ({
                ...prev,
                homeNoticeText: e.target.value,
              }))
            }
            placeholder="例：水着とタオルを持たせてください。着替えを多めにお願いします。"
            style={{ width: "100%" }}
          />
        </label>

        <div>
          <button
            onClick={() => void createCalendarEvent()}
            disabled={savingCalendarEvent || loading}
          >
            {savingCalendarEvent ? "登録中..." : "カレンダー行事を登録"}
          </button>
        </div>

        <div style={subtleBoxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            今月の予定：{selectedMonthCalendarEvents.length}件
          </div>

          {selectedMonthCalendarEvents.length === 0 ? (
            <div style={smallMutedStyle}>
              今月のカレンダー行事はありません。
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 900,
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>日付</th>
                    <th style={thStyle}>対象</th>
                    <th style={thStyle}>種別</th>
                    <th style={thStyle}>タイトル</th>
                    <th style={thStyle}>家庭連絡</th>
                    <th style={thStyle}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMonthCalendarEvents.map((row) => {
                    const classroom = classrooms.find(
                      (c) => c.id === row.classroomId,
                    );

                    return (
                      <tr key={row.id}>
                        <td style={tdStyle}>
                          {calendarEventDateLabel(row)}
                          <div style={smallMutedStyle}>
                            {calendarDateModeLabel(row.dateMode)}
                            {row.startTime ? ` / ${row.startTime}` : ""}
                            {row.endTime ? `-${row.endTime}` : ""}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          {calendarScopeLabel(row.scopeType)}
                          {s(row.scopeType).toUpperCase() === "CLASSROOM" ? (
                            <div style={smallMutedStyle}>
                              {classroom
                                ? classroomLabel(classroom)
                                : row.classroomId || "-"}
                            </div>
                          ) : null}
                        </td>
                        <td style={tdStyle}>
                          {calendarEventTypeLabel(row.eventType)}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700 }}>{row.title}</div>
                          {row.description ? (
                            <div style={smallMutedStyle}>{row.description}</div>
                          ) : null}
                        </td>
                        <td style={tdStyle}>
                          {row.showInHomeNotice || row.homeNoticeText ? (
                            <div style={{ whiteSpace: "pre-wrap" }}>
                              {row.homeNoticeText || "家庭連絡に表示"}
                            </div>
                          ) : (
                            <span style={smallMutedStyle}>-</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => void archiveCalendarEvent(row)}
                            disabled={archivingCalendarEventId === row.id}
                          >
                            {archivingCalendarEventId === row.id
                              ? "整理中..."
                              : "整理"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={subtleBoxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            家庭への連絡事項：{homeNoticeCalendarEvents.length}件
          </div>

          {homeNoticeCalendarEvents.length === 0 ? (
            <div style={smallMutedStyle}>
              今月の家庭向け連絡事項はありません。
            </div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {homeNoticeCalendarEvents.map((row) => (
                <li key={row.id}>
                  <b>{calendarEventDateLabel(row)}：</b>
                  {row.homeNoticeText || row.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fff",
          display: "grid",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>PLAN_V2 連携状況</h3>

        {selectedClassMonthPlan ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={subtleBoxStyle}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                月計画のねらい・5領域スコア
              </div>
              <div style={smallMutedStyle}>
                月計画はPractice候補の主材料として使います。
              </div>
              <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {selectedClassMonthPlan.goalTextC || "目標(C)は未入力です。"}
              </div>
              <div style={{ marginTop: 8 }}>
                {SCORE_AREAS.map((area) => (
                  <span key={area.key} style={{ marginRight: 12 }}>
                    {area.label}: <b>{selectedPlanScores[area.key]}</b>
                  </span>
                ))}
              </div>
            </div>

            <div style={subtleBoxStyle}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                年間・四半期方針の補助ヒント
              </div>
              <div style={smallMutedStyle}>
                年間・四半期の選択文例は、点数には加算せず、Practice候補の補助ヒントとして弱く使います。
              </div>
              <div style={{ marginTop: 8 }}>
                {domainTrendText(referenceScores)}
              </div>
              <div style={{ marginTop: 8 }}>
                {SCORE_AREAS.map((area) => (
                  <span key={area.key} style={{ marginRight: 12 }}>
                    {area.label}: <b>{referenceScores[area.key]}</b>
                  </span>
                ))}
              </div>
              {referencePhraseLines.length > 0 ? (
                <ul style={{ marginBottom: 0 }}>
                  {referencePhraseLines.map((row, index) => (
                    <li key={`${row.scopeLabel}-${index}`}>
                      <b>{row.scopeLabel}</b>: {row.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div style={subtleBoxStyle}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                月計画の選択文例から抽出したAbility
              </div>
              {combinedAbilityRows.length === 0 ? (
                <div style={smallMutedStyle}>Ability候補はまだありません。</div>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {combinedAbilityRows.slice(0, 20).map((row) => (
                    <span
                      key={row.abilityCode}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        fontSize: 12,
                      }}
                    >
                      {row.label} ({row.abilityCode}) / w={row.weight} / rec=
                      {row.recommendWeight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={smallMutedStyle}>PLAN_V2月計画を選択してください。</div>
        )}
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fff",
          display: "grid",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>Practice候補</h3>
        <div style={smallMutedStyle}>
          月計画のAbilityを強く、年間・四半期方針を弱く使って候補を並べます。
          {recommendLoading ? " 推薦計算中..." : ""}
        </div>

        {practiceRecommendations.length === 0 ? (
          <div style={smallMutedStyle}>推薦候補はありません。</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Practice</th>
                  <th style={thStyle}>推薦点</th>
                  <th style={thStyle}>一致Ability</th>
                  <th style={thStyle}>根拠</th>
                </tr>
              </thead>
              <tbody>
                {practiceRecommendations.map((row) => (
                  <tr key={row.practiceCode}>
                    <td style={tdStyle}>
                      <b>{row.practiceCode}</b> / {row.practiceName}
                    </td>
                    <td style={tdStyle}>{row.recommendScore}</td>
                    <td style={tdStyle}>
                      月:{row.monthMatchCount} / 補助:{row.referenceMatchCount}{" "}
                      / 合計:
                      {row.matchAbilityCount}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {row.matchedAbilities.slice(0, 6).join("\n")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fff",
          display: "grid",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>月案・週案</h3>

        <div style={subtleBoxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>月合計</div>
          <div>{scoreSummaryText(monthTotals)}</div>
          <div style={smallMutedStyle}>
            PLAN月計画比: 健康{" "}
            {formatRatio(monthTotals.health, selectedPlanScores.health)} /
            人間関係{" "}
            {formatRatio(
              monthTotals.humanRelations,
              selectedPlanScores.humanRelations,
            )}{" "}
            / 環境{" "}
            {formatRatio(
              monthTotals.environment,
              selectedPlanScores.environment,
            )}{" "}
            / 言葉{" "}
            {formatRatio(monthTotals.language, selectedPlanScores.language)} /
            表現{" "}
            {formatRatio(monthTotals.expression, selectedPlanScores.expression)}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1100,
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>週</th>
                <th style={thStyle}>期間</th>
                <th style={thStyle}>健康</th>
                <th style={thStyle}>人間関係</th>
                <th style={thStyle}>環境</th>
                <th style={thStyle}>言葉</th>
                <th style={thStyle}>表現</th>
                <th style={thStyle}>状態</th>
              </tr>
            </thead>
            <tbody>
              {weekSummaries.map((week) => {
                const expanded = expandedWeekStartDate === week.weekStartDate;

                return (
                  <Fragment key={week.weekStartDate}>
                    <tr>
                      <td style={tdStyle}>
                        <button
                          onClick={() =>
                            setExpandedWeekStartDate(
                              expanded ? "" : week.weekStartDate,
                            )
                          }
                        >
                          {expanded ? "閉じる" : "開く"}
                        </button>{" "}
                        第{week.weekNoInMonth}週
                      </td>
                      <td style={tdStyle}>
                        {week.weekStartDate} ～ {week.weekEndDate}
                      </td>
                      <td style={tdStyle}>
                        {week.totals.health}
                        <div style={smallMutedStyle}>
                          {formatRatio(
                            week.totals.health,
                            selectedPlanScores.health,
                          )}{" "}
                          /{" "}
                          {compareStatusLabel(
                            week.totals.health - selectedPlanScores.health,
                            selectedPlanScores.health,
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {week.totals.humanRelations}
                        <div style={smallMutedStyle}>
                          {formatRatio(
                            week.totals.humanRelations,
                            selectedPlanScores.humanRelations,
                          )}{" "}
                          /{" "}
                          {compareStatusLabel(
                            week.totals.humanRelations -
                              selectedPlanScores.humanRelations,
                            selectedPlanScores.humanRelations,
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {week.totals.environment}
                        <div style={smallMutedStyle}>
                          {formatRatio(
                            week.totals.environment,
                            selectedPlanScores.environment,
                          )}{" "}
                          /{" "}
                          {compareStatusLabel(
                            week.totals.environment -
                              selectedPlanScores.environment,
                            selectedPlanScores.environment,
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {week.totals.language}
                        <div style={smallMutedStyle}>
                          {formatRatio(
                            week.totals.language,
                            selectedPlanScores.language,
                          )}{" "}
                          /{" "}
                          {compareStatusLabel(
                            week.totals.language - selectedPlanScores.language,
                            selectedPlanScores.language,
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {week.totals.expression}
                        <div style={smallMutedStyle}>
                          {formatRatio(
                            week.totals.expression,
                            selectedPlanScores.expression,
                          )}{" "}
                          /{" "}
                          {compareStatusLabel(
                            week.totals.expression -
                              selectedPlanScores.expression,
                            selectedPlanScores.expression,
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {week.scheduleWeek ? "週案あり" : "未発行"}
                      </td>
                    </tr>

                    {expanded ? (
                      <tr>
                        <td colSpan={8} style={detailCellStyle}>
                          {!week.scheduleWeek ? (
                            <div>
                              この週のScheduleWeekは未発行です。「不足週案を補完」を押してください。
                            </div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                  minWidth: 1160,
                                }}
                              >
                                <thead>
                                  <tr>
                                    <th style={thStyle}>日付</th>
                                    <th style={thStyle}>Practice</th>
                                    <th style={thStyle}>健康</th>
                                    <th style={thStyle}>人間関係</th>
                                    <th style={thStyle}>環境</th>
                                    <th style={thStyle}>言葉</th>
                                    <th style={thStyle}>表現</th>
                                    <th style={thStyle}>日案</th>
                                    <th style={thStyle}>操作</th>
                                    <th style={thStyle}>状態</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {week.rows.map((row) => {
                                    const scheduleWeek = week.scheduleWeek;
                                    if (!scheduleWeek) return null;

                                    const currentCode = s(
                                      row.weekItem?.practiceCode,
                                    );
                                    const currentCodeExistsInOptions =
                                      currentCode.length > 0 &&
                                      (recommendedPracticeCodeSet.has(
                                        currentCode,
                                      ) ||
                                        practiceMap.has(currentCode));
                                    const currentSnapshotLabel =
                                      weekItemPracticeTitleSnapshot(
                                        row.weekItem,
                                      ) || currentCode;
                                    const latestDay = getLatestDay(
                                      scheduleWeek.id,
                                      row.date,
                                    );
                                    const dayLabel = latestDay
                                      ? `${latestDay.status} / v${latestDay.issueVersion ?? "-"}`
                                      : "未発行";

                                    return (
                                      <tr key={row.date}>
                                        <td style={tdStyle}>{row.label}</td>
                                        <td style={tdStyle}>
                                          <select
                                            value={currentCode}
                                            onChange={(e) =>
                                              void saveWeekPractice(
                                                scheduleWeek,
                                                row,
                                                e.target.value,
                                              )
                                            }
                                            disabled={loading}
                                            style={{ minWidth: 320 }}
                                          >
                                            <option value="">未設定</option>
                                            {currentCode &&
                                            !currentCodeExistsInOptions ? (
                                              <option value={currentCode}>
                                                {`保存済み: ${currentCode} / ${currentSnapshotLabel}`}
                                              </option>
                                            ) : null}
                                            {practiceRecommendations.map(
                                              (p) => (
                                                <option
                                                  key={`rec-${p.practiceCode}`}
                                                  value={p.practiceCode}
                                                >
                                                  ★ {p.practiceCode} /{" "}
                                                  {p.practiceName}
                                                </option>
                                              ),
                                            )}
                                            {nonRecommendedPracticeRows.map(
                                              (p) => (
                                                <option
                                                  key={s(p.practice_code)}
                                                  value={s(p.practice_code)}
                                                >
                                                  {practiceLabel(p)}
                                                </option>
                                              ),
                                            )}
                                          </select>
                                          {currentCode &&
                                          !currentCodeExistsInOptions ? (
                                            <div style={smallMutedStyle}>
                                              保存済みPracticeCodeはありますが、現在のPractice候補一覧にはありません。
                                              候補から選び直すと現在のPracticeCodeへ更新されます。
                                            </div>
                                          ) : null}
                                          {!currentCode &&
                                          (s(row.weekItem?.title) ||
                                            s(row.weekItem?.description)) ? (
                                            <div style={smallMutedStyle}>
                                              タイトル・概要は残っていますが、
                                              practiceCodeが空です。候補から選び直してください。
                                            </div>
                                          ) : null}
                                          {row.weekItem?.description ? (
                                            <div style={smallMutedStyle}>
                                              {row.weekItem.description}
                                            </div>
                                          ) : null}
                                        </td>
                                        <td style={tdStyle}>
                                          {row.weekItem?.scoreHealth ?? 0}
                                        </td>
                                        <td style={tdStyle}>
                                          {row.weekItem?.scoreHumanRelations ??
                                            0}
                                        </td>
                                        <td style={tdStyle}>
                                          {row.weekItem?.scoreEnvironment ?? 0}
                                        </td>
                                        <td style={tdStyle}>
                                          {row.weekItem?.scoreLanguage ?? 0}
                                        </td>
                                        <td style={tdStyle}>
                                          {row.weekItem?.scoreExpression ?? 0}
                                        </td>
                                        <td style={tdStyle}>{dayLabel}</td>
                                        <td style={tdStyle}>
                                          <div
                                            style={{
                                              display: "flex",
                                              gap: 8,
                                              flexWrap: "wrap",
                                            }}
                                          >
                                            <button
                                              onClick={() => {
                                                void issueDayForRow(
                                                  scheduleWeek,
                                                  row,
                                                  "MANUAL",
                                                );
                                              }}
                                              disabled={
                                                loading ||
                                                !row.weekItem?.practiceCode ||
                                                !!latestDay
                                              }
                                            >
                                              日案発行
                                            </button>

                                            <button
                                              onClick={() => {
                                                void issueDayForRow(
                                                  scheduleWeek,
                                                  row,
                                                  "MANUAL_REISSUE",
                                                );
                                              }}
                                              disabled={
                                                loading ||
                                                !row.weekItem?.practiceCode ||
                                                !latestDay
                                              }
                                            >
                                              日案再発行
                                            </button>
                                          </div>
                                        </td>
                                        <td style={tdStyle}>
                                          {row.hasDuplicate
                                            ? "重複あり"
                                            : row.weekItem?.practiceCode
                                              ? "登録あり"
                                              : "空"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
