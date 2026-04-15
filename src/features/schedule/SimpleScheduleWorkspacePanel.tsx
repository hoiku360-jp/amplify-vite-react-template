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

type ScoreSet = {
  health: number;
  humanRelations: number;
  environment: number;
  language: number;
  expression: number;
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

type DeletableModel<TRow> = {
  delete(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type AbilityPracticeLinkModel = {
  listByPractice(args: { practiceCode: string }): Promise<{
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
    ScheduleMonth: ListableModel<ScheduleMonthRow> &
      CreatableModel<ScheduleMonthRow>;
    ScheduleWeek: ListableModel<ScheduleWeekRow>;
    ScheduleWeekItem: ListableModel<ScheduleWeekItemRow> &
      CreatableModel<ScheduleWeekItemRow> &
      UpdatableModel<ScheduleWeekItemRow> &
      DeletableModel<ScheduleWeekItemRow>;
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

type AbilityCodeLike = {
  code?: string | number | null;
  domain?: string | null;
  category?: string | null;
  name?: string | null;
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
  const ageBand = String(row.ageBand ?? "").trim();

  if (ageBand) {
    return ageBand.includes("歳児") ? ageBand : `${ageBand}歳児`;
  }

  return "年齢帯未設定";
}

function practiceLabel(row: PracticeRow) {
  return `${row.practice_code} / ${row.name}`;
}

function mapAbilityToArea(
  codeRow?: AbilityCodeLike,
  fallbackAbilityCode?: string | null,
): keyof ScoreSet | null {
  const rawCode = String(codeRow?.code ?? fallbackAbilityCode ?? "").trim();
  const normalizedCode = rawCode.replace(/[^0-9]/g, "");
  const prefix2 = normalizedCode.slice(0, 2);

  if (prefix2 === "11") return "health";
  if (prefix2 === "21") return "humanRelations";
  if (prefix2 === "31") return "environment";
  if (prefix2 === "41") return "language";
  if (prefix2 === "51") return "expression";

  const rawText = `${codeRow?.domain ?? ""} ${codeRow?.category ?? ""} ${
    codeRow?.name ?? ""
  }`;
  if (rawText.includes("健康")) return "health";
  if (rawText.includes("人間関係")) return "humanRelations";
  if (rawText.includes("環境")) return "environment";
  if (rawText.includes("言葉")) return "language";
  if (rawText.includes("表現")) return "expression";

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

function sumScoreSets(rows: Array<ScoreSet>) {
  return rows.reduce(
    (acc, s) => ({
      health: acc.health + (s.health ?? 0),
      humanRelations: acc.humanRelations + (s.humanRelations ?? 0),
      environment: acc.environment + (s.environment ?? 0),
      language: acc.language + (s.language ?? 0),
      expression: acc.expression + (s.expression ?? 0),
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
  const aTime = String(a.updatedAt ?? a.createdAt ?? "");
  const bTime = String(b.updatedAt ?? b.createdAt ?? "");
  return bTime.localeCompare(aTime);
}

function pickCanonicalWeekItem(rows: ScheduleWeekItemRow[]) {
  return [...rows].sort(latestItemVersion)[0] ?? null;
}

function formatModelErrors(
  errors?: ModelError[] | null,
  fallback = "Unknown error",
) {
  const messages = (errors ?? [])
    .map((e) => String(e.message ?? "").trim())
    .filter(Boolean);

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

export default function SimpleScheduleWorkspacePanel(props: Props) {
  const { owner } = props;

  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const [monthKey, setMonthKey] = useState(monthKeyFromDate(todayString()));
  const [selectedMonthId, setSelectedMonthId] = useState("");
  const [expandedWeekStartDate, setExpandedWeekStartDate] = useState("");

  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [ageTargets, setAgeTargets] = useState<AgeTargetRow[]>([]);
  const [practiceRows, setPracticeRows] = useState<PracticeRow[]>([]);
  const [months, setMonths] = useState<ScheduleMonthRow[]>([]);
  const [weeks, setWeeks] = useState<ScheduleWeekRow[]>([]);
  const [weekItemsByWeekId, setWeekItemsByWeekId] = useState<
    Record<string, ScheduleWeekItemRow[]>
  >({});
  const [latestDaysByWeekDateKey, setLatestDaysByWeekDateKey] = useState<
    Record<string, ScheduleDayRow | null>
  >({});

  const [classroomId, setClassroomId] = useState("");
  const [ageTargetId, setAgeTargetId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const practiceMap = useMemo(
    () => new Map(practiceRows.map((p) => [p.practice_code, p])),
    [practiceRows],
  );

  const selectedMonth = useMemo(
    () => months.find((m) => m.id === selectedMonthId) ?? null,
    [months, selectedMonthId],
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

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const [classroomRes, ageTargetRes, practiceRes, monthRes] =
        await Promise.all([
          client.models.Classroom.list(),
          client.models.SchoolAnnualAgeTarget.list(),
          client.models.PracticeCode.list(),
          client.models.ScheduleMonth.list({
            filter: {
              owner: { eq: owner },
            },
          } as ListOptions),
        ]);

      const classroomRows = classroomRes.data ?? [];
      const ageRows = ageTargetRes.data ?? [];
      const practices = [...(practiceRes.data ?? [])].sort((a, b) =>
        String(a.practice_code).localeCompare(String(b.practice_code)),
      );
      const monthRows = [...(monthRes.data ?? [])].sort((a, b) =>
        String(b.monthKey ?? "").localeCompare(String(a.monthKey ?? "")),
      );

      setClassrooms(classroomRows);
      setAgeTargets(ageRows);
      setPracticeRows(practices);
      setMonths(monthRows);

      setClassroomId((prev) => prev || classroomRows[0]?.id || "");
      setAgeTargetId((prev) => prev || ageRows[0]?.id || "");

      const sameMonth = monthRows.find((m) => m.monthKey === monthKey);
      if (sameMonth) {
        setSelectedMonthId(sameMonth.id);
      }
    } catch (e) {
      console.error(e);
      setMessage(
        `初期読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }, [owner, monthKey]);

  const fetchWeekItems = useCallback(
    async (scheduleWeekId: string): Promise<ScheduleWeekItemRow[]> => {
      const res = await client.models.ScheduleWeekItem.list({
        filter: {
          scheduleWeekId: { eq: scheduleWeekId },
        },
      } as ListOptions);

      return [...(res.data ?? [])].sort((a, b) => {
        const d = (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0);
        if (d !== 0) return d;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
    },
    [],
  );

  const fetchScheduleDays = useCallback(
    async (scheduleWeekId: string): Promise<ScheduleDayRow[]> => {
      const res = await client.models.ScheduleDay.list({
        filter: {
          sourceWeekId: { eq: scheduleWeekId },
        },
      } as ListOptions);

      return [...(res.data ?? [])].sort((a, b) => {
        const d = String(a.targetDate ?? "").localeCompare(
          String(b.targetDate ?? ""),
        );
        if (d !== 0) return d;
        return latestIssueVersion(a, b);
      });
    },
    [],
  );

  const loadMonthDetails = useCallback(
    async (monthId: string) => {
      if (!monthId) {
        setWeeks([]);
        setWeekItemsByWeekId({});
        setLatestDaysByWeekDateKey({});
        return;
      }

      setLoading(true);
      try {
        const weekRes = await client.models.ScheduleWeek.list({
          filter: {
            sourceScheduleMonthId: { eq: monthId },
          },
        } as ListOptions);

        const weekRows = [...(weekRes.data ?? [])].sort((a, b) =>
          String(a.weekStartDate ?? "").localeCompare(
            String(b.weekStartDate ?? ""),
          ),
        );

        const entries = await Promise.all(
          weekRows.map(async (w) => {
            const rows = await fetchWeekItems(w.id);
            return [w.id, rows] as const;
          }),
        );

        const dayEntries = await Promise.all(
          weekRows.map(async (w) => {
            const rows = await fetchScheduleDays(w.id);
            return [w.id, rows] as const;
          }),
        );

        const nextLatestDayMap: Record<string, ScheduleDayRow | null> = {};

        for (const [weekId, dayRows] of dayEntries) {
          const grouped = new Map<string, ScheduleDayRow[]>();

          for (const row of dayRows) {
            const targetDate = String(row.targetDate ?? "");
            if (!targetDate) continue;

            const list = grouped.get(targetDate) ?? [];
            list.push(row);
            grouped.set(targetDate, list);
          }

          for (const [targetDate, rows] of grouped.entries()) {
            const latest = [...rows].sort(latestIssueVersion)[0] ?? null;
            nextLatestDayMap[makeWeekDateKey(weekId, targetDate)] = latest;
          }
        }

        setWeeks(weekRows);
        setWeekItemsByWeekId(Object.fromEntries(entries));
        setLatestDaysByWeekDateKey(nextLatestDayMap);
      } catch (e) {
        console.error(e);
        setMessage(
          `月詳細読込エラー: ${e instanceof Error ? e.message : String(e)}`,
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchScheduleDays, fetchWeekItems],
  );

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    void loadMonthDetails(selectedMonthId);
  }, [selectedMonthId, loadMonthDetails]);

  async function issueMissingWeeksForMonth(scheduleMonthId: string) {
    const existingWeekRes = await client.models.ScheduleWeek.list({
      filter: {
        sourceScheduleMonthId: { eq: scheduleMonthId },
      },
    } as ListOptions);

    const existingStarts = new Set(
      (existingWeekRes.data ?? []).map((w) => w.weekStartDate ?? ""),
    );

    const runner = client.mutations?.issueScheduleWeekFromScheduleMonth;
    if (!runner) {
      throw new Error(
        "issueScheduleWeekFromScheduleMonth が client.mutations に見つかりません。",
      );
    }

    for (const range of weekRangesInMonth) {
      if (existingStarts.has(range.weekStartDate)) continue;

      let res:
        | OperationEnvelope<IssueScheduleWeekResult>
        | IssueScheduleWeekResult;

      try {
        res = await runner({
          scheduleMonthId,
          weekStartDate: range.weekStartDate,
          weekEndDate: range.weekEndDate,
          weekNo: range.weekNoInMonth,
          issueType: "MANUAL",
        });
      } catch {
        res = await runner({
          input: {
            scheduleMonthId,
            weekStartDate: range.weekStartDate,
            weekEndDate: range.weekEndDate,
            weekNo: range.weekNoInMonth,
            issueType: "MANUAL",
          },
        });
      }

      const errors = getOperationErrors(res);
      if (errors?.length) {
        throw new Error(
          `週案発行エラー (${range.weekStartDate}): ${formatModelErrors(errors)}`,
        );
      }
    }
  }

  async function createMonthAndWeeks() {
    if (!tenantId.trim()) {
      setMessage("tenantId を入力してください。");
      return;
    }
    if (!classroomId.trim()) {
      setMessage("classroomId を選択してください。");
      return;
    }
    if (!ageTargetId.trim()) {
      setMessage("ageTargetId を選択してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const existing = months.find(
        (m) =>
          m.monthKey === monthKey &&
          m.classroomId === classroomId &&
          m.ageTargetId === ageTargetId,
      );

      if (existing) {
        setSelectedMonthId(existing.id);
        await issueMissingWeeksForMonth(existing.id);
        await loadMonthDetails(existing.id);
        setMessage(
          "同じ月案が既にあります。既存の月案を選択し、不足している週案を補完しました。",
        );
        return;
      }

      const res = await client.models.ScheduleMonth.create({
        tenantId: tenantId.trim(),
        owner,
        classroomId,
        ageTargetId,
        monthKey,
        title: `${monthKey} 月案`,
        notes: "",
        status: "ACTIVE",
        issueType: "MANUAL",
        issueVersion: 1,
        issuedAt: new Date().toISOString(),
      } as MutationInput);

      if (!res.data) {
        throw new Error(
          formatModelErrors(res.errors, "月案の作成に失敗しました。"),
        );
      }

      await issueMissingWeeksForMonth(res.data.id);

      const monthRes = await client.models.ScheduleMonth.list({
        filter: {
          owner: { eq: owner },
        },
      } as ListOptions);

      const monthRows = [...(monthRes.data ?? [])].sort((a, b) =>
        String(b.monthKey ?? "").localeCompare(String(a.monthKey ?? "")),
      );

      setMonths(monthRows);
      setSelectedMonthId(res.data.id);
      await loadMonthDetails(res.data.id);

      setMessage("月案と、その月の週案を作成しました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `月案/週案作成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function fillMissingWeeksForSelectedMonth() {
    if (!selectedMonth) {
      setMessage("先に月案を選択してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await issueMissingWeeksForMonth(selectedMonth.id);
      await loadMonthDetails(selectedMonth.id);
      setMessage("不足している週案を補完しました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `週案補完エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function getScoresForPractice(
    practiceCode: string | null | undefined,
  ): Promise<ScoreSet> {
    if (!practiceCode) return emptyScores();

    const { data, errors } =
      await client.models.AbilityPracticeLink.listByPractice({
        practiceCode,
      });

    if (errors?.length) {
      throw new Error(formatModelErrors(errors));
    }

    const links = data ?? [];
    const scores = emptyScores();

    for (const link of links) {
      const abilityCode = String(link.abilityCode ?? "").trim();
      const area = mapAbilityToArea(undefined, abilityCode);

      if (area) {
        scores[area] += Number(link.score ?? 0);
      } else {
        console.warn("5領域にマップできない AbilityCode:", {
          practiceCode,
          abilityCode,
        });
      }
    }

    return scores;
  }

  async function runIssueDayMutation(
    args: IssueScheduleDayArgs,
  ): Promise<IssueScheduleDayResult> {
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
      throw new Error(formatModelErrors(errors, "日案発行に失敗しました。"));
    }

    return getOperationData(res);
  }

  function getLatestDay(
    scheduleWeekId: string,
    targetDate: string,
  ): ScheduleDayRow | null {
    return (
      latestDaysByWeekDateKey[makeWeekDateKey(scheduleWeekId, targetDate)] ??
      null
    );
  }

  async function issueDayForRow(
    scheduleWeek: ScheduleWeekRow,
    row: WeekDateRow,
    issueType: "MANUAL" | "MANUAL_REISSUE",
  ) {
    if (!row.weekItem?.practiceCode) {
      setMessage("先に週案で Practice を登録してください。");
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

      await loadMonthDetails(selectedMonthId);

      const status = String(result?.status ?? "");
      const version = Number(result?.issueVersion ?? 0);

      if (status === "ALREADY_ISSUED") {
        setMessage(
          `${row.date} の日案は既に発行済みです。再発行する場合は「日案再発行」を押してください。`,
        );
        return;
      }

      if (status === "REISSUE_BLOCKED") {
        setMessage(
          `${row.date} の日案は再発行できません。既存の日案に PLANNED 以外の状態が含まれています。`,
        );
        return;
      }

      setMessage(
        issueType === "MANUAL_REISSUE"
          ? `${row.date} の日案を再発行しました。version=${version || "-"}`
          : `${row.date} の日案を発行しました。version=${version || "-"}`,
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

  const weekSummaries = useMemo<WeekSummaryRow[]>(() => {
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
        const hits = items.filter((it) => it.dayOfWeek === weekday);
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
          health: r.weekItem?.scoreHealth ?? 0,
          humanRelations: r.weekItem?.scoreHumanRelations ?? 0,
          environment: r.weekItem?.scoreEnvironment ?? 0,
          language: r.weekItem?.scoreLanguage ?? 0,
          expression: r.weekItem?.scoreExpression ?? 0,
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

  async function saveWeekPractice(
    scheduleWeek: ScheduleWeekRow,
    row: WeekDateRow,
    nextPracticeCode: string,
  ) {
    setLoading(true);
    setMessage("");

    try {
      const allWeekItems = await fetchWeekItems(scheduleWeek.id);
      const sameDayItems = allWeekItems.filter(
        (item) => item.dayOfWeek === row.weekday,
      );
      const canonical = pickCanonicalWeekItem(sameDayItems);
      const duplicates = sameDayItems.filter(
        (item) => item.id !== canonical?.id,
      );

      if (!nextPracticeCode) {
        for (const item of sameDayItems) {
          await client.models.ScheduleWeekItem.delete({
            id: item.id,
          } as MutationInput);
        }

        const nextRows = await fetchWeekItems(scheduleWeek.id);
        setWeekItemsByWeekId((prev) => ({
          ...prev,
          [scheduleWeek.id]: nextRows,
        }));

        const latestDay = getLatestDay(scheduleWeek.id, row.date);

        setMessage(
          latestDay
            ? `週案を未設定に戻しました。 ${row.date}
既に日案 v${latestDay.issueVersion ?? 1} があるため、内容を反映するには「日案再発行」を押してください。`
            : `週案を未設定に戻しました。 ${row.date}`,
        );
        return;
      }

      const nextPractice = practiceMap.get(nextPracticeCode);
      const scores = await getScoresForPractice(nextPracticeCode);

      const { data, errors } =
        await client.models.AbilityPracticeLink.listByPractice({
          practiceCode: nextPracticeCode,
        });

      if (errors?.length) {
        throw new Error(formatModelErrors(errors));
      }

      const links = data ?? [];
      const debugCodes = links
        .map((x) => `${x.abilityCode}:${x.score}`)
        .join(", ");

      if (canonical) {
        const res = await client.models.ScheduleWeekItem.update({
          id: canonical.id,
          dayOfWeek: row.weekday,
          title: nextPractice?.name ?? canonical.title,
          practiceCode: nextPracticeCode,
          practiceTitleSnapshot:
            nextPractice?.name ?? canonical.practiceTitleSnapshot ?? undefined,
          scoreHealth: scores.health,
          scoreHumanRelations: scores.humanRelations,
          scoreEnvironment: scores.environment,
          scoreLanguage: scores.language,
          scoreExpression: scores.expression,
        } as MutationInput);

        if (!res.data) {
          throw new Error(
            formatModelErrors(res.errors, "週案更新に失敗しました。"),
          );
        }
      } else {
        const res = await client.models.ScheduleWeekItem.create({
          tenantId: scheduleWeek.tenantId,
          owner,
          scheduleWeekId: scheduleWeek.id,
          dayOfWeek: row.weekday,
          sourceType: "PLANNED",
          title: nextPractice?.name ?? "Planned",
          description: "",
          startTime: DEFAULT_START_TIME,
          endTime: DEFAULT_END_TIME,
          sortOrder: 10,
          practiceCode: nextPracticeCode,
          practiceTitleSnapshot: nextPractice?.name ?? undefined,
          scoreHealth: scores.health,
          scoreHumanRelations: scores.humanRelations,
          scoreEnvironment: scores.environment,
          scoreLanguage: scores.language,
          scoreExpression: scores.expression,
        } as MutationInput);

        if (!res.data) {
          throw new Error(
            formatModelErrors(res.errors, "週案行の作成に失敗しました。"),
          );
        }
      }

      for (const item of duplicates) {
        await client.models.ScheduleWeekItem.delete({
          id: item.id,
        } as MutationInput);
      }

      const nextRows = await fetchWeekItems(scheduleWeek.id);
      setWeekItemsByWeekId((prev) => ({
        ...prev,
        [scheduleWeek.id]: nextRows,
      }));

      const latestDay = getLatestDay(scheduleWeek.id, row.date);
      const duplicateNote =
        sameDayItems.length > 1
          ? `
同じ曜日に重複していた ${sameDayItems.length} 件の item を 1 件に正規化しました。`
          : "";

      setMessage(
        latestDay
          ? `週案を更新しました。 ${row.date}
既に日案 v${latestDay.issueVersion ?? 1} があるため、内容を反映するには「日案再発行」を押してください。${duplicateNote}
links=${links.length}
codes=${debugCodes}
scores=健康:${scores.health} / 人間関係:${scores.humanRelations} / 環境:${scores.environment} / 言葉:${scores.language} / 表現:${scores.expression}`
          : `週案を更新しました。 ${row.date}${duplicateNote}
必要に応じて「日案発行」を押してください。
links=${links.length}
codes=${debugCodes}
scores=健康:${scores.health} / 人間関係:${scores.humanRelations} / 環境:${scores.environment} / 言葉:${scores.language} / 表現:${scores.expression}`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `週案更新エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
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
        <h2 style={{ margin: 0 }}>シンプル Schedule ワークスペース</h2>

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
            月案{" "}
            <select
              value={selectedMonthId}
              onChange={(e) => {
                setSelectedMonthId(e.target.value);
                const m = months.find((x) => x.id === e.target.value);
                if (m?.monthKey) {
                  setMonthKey(m.monthKey);
                }
              }}
              style={{ minWidth: 360 }}
            >
              <option value="">選択してください</option>
              {months.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.monthKey} / {m.title || "月案"} / {m.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#f7f7f7",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message || "ここにメッセージが表示されます。"}
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
        <h3 style={{ margin: 0 }}>月案（週ごとの5領域合計）</h3>

        <div>
          月合計:
          {" 健康 "}
          <b>{monthTotals.health}</b>
          {" / 人間関係 "}
          <b>{monthTotals.humanRelations}</b>
          {" / 環境 "}
          <b>{monthTotals.environment}</b>
          {" / 言葉 "}
          <b>{monthTotals.language}</b>
          {" / 表現 "}
          <b>{monthTotals.expression}</b>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}
          >
            <thead>
              <tr>
                <th style={thStyle}>週初めの日付</th>
                <th style={thStyle}>健康合計</th>
                <th style={thStyle}>人間関係合計</th>
                <th style={thStyle}>環境合計</th>
                <th style={thStyle}>言葉合計</th>
                <th style={thStyle}>表現合計</th>
                <th style={thStyle}>状態</th>
              </tr>
            </thead>
            <tbody>
              {weekSummaries.map((week) => (
                <tr key={week.weekStartDate}>
                  <td style={tdStyle}>{week.weekStartDate}</td>
                  <td style={tdStyle}>{week.totals.health}</td>
                  <td style={tdStyle}>{week.totals.humanRelations}</td>
                  <td style={tdStyle}>{week.totals.environment}</td>
                  <td style={tdStyle}>{week.totals.language}</td>
                  <td style={tdStyle}>{week.totals.expression}</td>
                  <td style={tdStyle}>
                    {week.scheduleWeek ? "週案あり" : "未発行"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <h3 style={{ margin: 0 }}>週案（日付ごとに Practice 1件）</h3>

        <div style={{ color: "#555" }}>
          週案を修正したあと、その内容を日案に反映したい場合は「日案再発行」を押してください。
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1080,
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>表示</th>
                <th style={thStyle}>週初めの日付</th>
                <th style={thStyle}>健康合計</th>
                <th style={thStyle}>人間関係合計</th>
                <th style={thStyle}>環境合計</th>
                <th style={thStyle}>言葉合計</th>
                <th style={thStyle}>表現合計</th>
                <th style={thStyle}>状態</th>
              </tr>
            </thead>
            <tbody>
              {weekSummaries.map((week) => {
                const expanded = expandedWeekStartDate === week.weekStartDate;
                const hasAnyPractice = week.rows.some(
                  (r) => !!r.weekItem?.practiceCode,
                );
                const hasDuplicate = week.rows.some((r) => r.hasDuplicate);

                return (
                  <Fragment key={week.weekStartDate}>
                    <tr>
                      <td style={tdStyle}>
                        <button
                          onClick={() =>
                            setExpandedWeekStartDate((prev) =>
                              prev === week.weekStartDate
                                ? ""
                                : week.weekStartDate,
                            )
                          }
                        >
                          {expanded ? "閉じる" : "開く"}
                        </button>
                      </td>
                      <td style={tdStyle}>{week.weekStartDate}</td>
                      <td style={tdStyle}>{week.totals.health}</td>
                      <td style={tdStyle}>{week.totals.humanRelations}</td>
                      <td style={tdStyle}>{week.totals.environment}</td>
                      <td style={tdStyle}>{week.totals.language}</td>
                      <td style={tdStyle}>{week.totals.expression}</td>
                      <td style={tdStyle}>
                        {!week.scheduleWeek
                          ? "未発行"
                          : hasDuplicate
                            ? "重複あり"
                            : hasAnyPractice
                              ? "登録あり"
                              : "空"}
                      </td>
                    </tr>

                    {expanded && (
                      <tr>
                        <td style={detailCellStyle} colSpan={8}>
                          {!week.scheduleWeek ? (
                            <div>
                              この週の週案はまだありません。上の「不足週案を補完」を押してください。
                            </div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                                {week.label}
                              </div>

                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                  minWidth: 1240,
                                  background: "#fff",
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

                                    const currentCode =
                                      row.weekItem?.practiceCode ?? "";
                                    const latestDay = getLatestDay(
                                      scheduleWeek.id,
                                      row.date,
                                    );

                                    const dayLabel = latestDay
                                      ? `発行済み v${latestDay.issueVersion ?? 1}`
                                      : row.weekItem
                                        ? "未発行"
                                        : "-";

                                    return (
                                      <tr key={row.date}>
                                        <td style={tdStyle}>{row.label}</td>
                                        <td style={tdStyle}>
                                          <select
                                            value={currentCode}
                                            onChange={(e) => {
                                              void saveWeekPractice(
                                                scheduleWeek,
                                                row,
                                                e.target.value,
                                              );
                                            }}
                                            disabled={loading}
                                            style={{ width: "100%" }}
                                          >
                                            <option value="">未設定</option>
                                            {practiceRows.map((p) => (
                                              <option
                                                key={p.practice_code}
                                                value={p.practice_code}
                                              >
                                                {practiceLabel(p)}
                                              </option>
                                            ))}
                                          </select>
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
                    )}
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
