import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  owner: string;
};

type ScheduleMonthRow = Schema["ScheduleMonth"]["type"] & {
  status?: string | null;
};

type ScheduleMonthItemRow = Schema["ScheduleMonthItem"]["type"];

type ClassroomRow = Schema["Classroom"]["type"] & {
  name?: string | null;
  title?: string | null;
  className?: string | null;
};

type AgeTargetRow = Schema["SchoolAnnualAgeTarget"]["type"] & {
  name?: string | null;
  title?: string | null;
  label?: string | null;
};

type WeekOption = {
  weekNo: number;
  weekStartDate: string;
  weekEndDate: string;
  label: string;
};

type ModelError = {
  message?: string | null;
};

type ListOptions = Record<string, unknown>;

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
  create(input: Record<string, unknown>): Promise<MutationResponse<TRow>>;
};

type IssueScheduleWeekArgs = {
  scheduleMonthId: string;
  weekStartDate: string;
  weekEndDate: string;
  weekNo: number;
  issueType: "MANUAL";
};

type IssueScheduleWeekResult = {
  status?: string | null;
  message?: string | null;
};

type OperationEnvelope<TData> = {
  data?: TData | null;
  errors?: ModelError[] | null;
};

type OperationRunner<TArgs, TData> = (
  args: TArgs | { input: TArgs },
) => Promise<OperationEnvelope<TData> | TData>;

type MonthTestClient = {
  models: {
    ScheduleMonth: ListableModel<ScheduleMonthRow> &
      CreatableModel<ScheduleMonthRow>;
    ScheduleMonthItem: ListableModel<ScheduleMonthItemRow> &
      CreatableModel<ScheduleMonthItemRow>;
    Classroom: ListableModel<ClassroomRow>;
    SchoolAnnualAgeTarget: ListableModel<AgeTargetRow>;
  };
  mutations?: {
    issueScheduleWeekFromScheduleMonth?: OperationRunner<
      IssueScheduleWeekArgs,
      IssueScheduleWeekResult
    >;
  };
};

const client = generateClient<Schema>() as unknown as MonthTestClient;

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayMonthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function dayOfWeekLabel(dayOfWeek: number) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels[dayOfWeek] ?? String(dayOfWeek);
}

function labelOfClassroom(row: ClassroomRow) {
  return row.name || row.title || row.className || row.id;
}

function labelOfAgeTarget(row: AgeTargetRow) {
  return row.name || row.title || row.label || row.id;
}

function monthKeyToWeekOptions(monthKey: string): WeekOption[] {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return [];
  }

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const mondayStart = new Date(firstDay);
  const firstDow = mondayStart.getDay();
  const diffToMonday = firstDow === 0 ? -6 : 1 - firstDow;
  mondayStart.setDate(mondayStart.getDate() + diffToMonday);

  const options: WeekOption[] = [];
  const cursor = new Date(mondayStart);
  let weekNo = 1;

  while (cursor <= lastDay || options.length === 0) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);

    options.push({
      weekNo,
      weekStartDate: formatDate(start),
      weekEndDate: formatDate(end),
      label: `第${weekNo}週 ${formatDate(start)} ～ ${formatDate(end)}`,
    });

    cursor.setDate(cursor.getDate() + 7);
    weekNo += 1;

    if (weekNo > 6) break;
  }

  return options;
}

function formatErrors(
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

export default function IssueScheduleMonthTestPanel(props: Props) {
  const { owner } = props;

  const [tenantId, setTenantId] = useState("demo-tenant");
  const [classroomId, setClassroomId] = useState("");
  const [ageTargetId, setAgeTargetId] = useState("");
  const [monthKey, setMonthKey] = useState(todayMonthKey());
  const [scheduleMonthId, setScheduleMonthId] = useState("");

  const [itemWeekNo, setItemWeekNo] = useState(1);
  const [itemDayOfWeek, setItemDayOfWeek] = useState(1);
  const [itemTitle, setItemTitle] = useState("栽培活動");
  const [itemDescription, setItemDescription] =
    useState("テスト用 planned item");
  const [itemStartTime, setItemStartTime] = useState("10:00");
  const [itemEndTime, setItemEndTime] = useState("10:40");
  const [itemSortOrder] = useState(10);
  const [itemPracticeCode, setItemPracticeCode] = useState("");
  const [scoreHealth, setScoreHealth] = useState(0);
  const [scoreHumanRelations, setScoreHumanRelations] = useState(1);
  const [scoreEnvironment, setScoreEnvironment] = useState(2);
  const [scoreLanguage, setScoreLanguage] = useState(0);
  const [scoreExpression, setScoreExpression] = useState(1);

  const [issueWeekNo, setIssueWeekNo] = useState(1);

  const [months, setMonths] = useState<ScheduleMonthRow[]>([]);
  const [monthItems, setMonthItems] = useState<ScheduleMonthItemRow[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [ageTargets, setAgeTargets] = useState<AgeTargetRow[]>([]);

  const [loadingMasters, setLoadingMasters] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [, setLoadingItems] = useState(false);
  const [creatingMonth, setCreatingMonth] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [issuingWeek, setIssuingWeek] = useState(false);
  const [message, setMessage] = useState("");

  const selectedMonth = useMemo(
    () => months.find((m) => m.id === scheduleMonthId) ?? null,
    [months, scheduleMonthId],
  );

  const weekOptions = useMemo(
    () => monthKeyToWeekOptions(selectedMonth?.monthKey ?? monthKey),
    [selectedMonth?.monthKey, monthKey],
  );

  const selectedIssueWeek = useMemo(
    () => weekOptions.find((w) => w.weekNo === issueWeekNo) ?? null,
    [weekOptions, issueWeekNo],
  );

  const totals = useMemo(() => {
    return monthItems.reduce(
      (acc, item) => {
        acc.health += item.scoreHealth ?? 0;
        acc.humanRelations += item.scoreHumanRelations ?? 0;
        acc.environment += item.scoreEnvironment ?? 0;
        acc.language += item.scoreLanguage ?? 0;
        acc.expression += item.scoreExpression ?? 0;
        return acc;
      },
      {
        health: 0,
        humanRelations: 0,
        environment: 0,
        language: 0,
        expression: 0,
      },
    );
  }, [monthItems]);

  const loadMasters = useCallback(async () => {
    setLoadingMasters(true);
    try {
      const [classroomRes, ageTargetRes] = await Promise.all([
        client.models.Classroom.list(),
        client.models.SchoolAnnualAgeTarget.list(),
      ]);

      const classroomRows = classroomRes.data ?? [];
      const ageTargetRows = ageTargetRes.data ?? [];

      setClassrooms(classroomRows);
      setAgeTargets(ageTargetRows);

      setClassroomId((prev) => prev || classroomRows[0]?.id || "");
      setAgeTargetId((prev) => prev || ageTargetRows[0]?.id || "");
    } catch (e) {
      console.error(e);
      setMessage(
        `Classroom / AgeTarget 読込エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setLoadingMasters(false);
    }
  }, []);

  const loadMonths = useCallback(async () => {
    setLoadingMonths(true);
    try {
      const res = await client.models.ScheduleMonth.list({
        filter: {
          owner: { eq: owner },
        },
      });

      const rows = [...(res.data ?? [])].sort((a, b) =>
        String(b.monthKey ?? "").localeCompare(String(a.monthKey ?? "")),
      );
      setMonths(rows);
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleMonth 読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingMonths(false);
    }
  }, [owner]);

  const loadMonthItems = useCallback(async (monthId: string) => {
    if (!monthId) {
      setMonthItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      const res = await client.models.ScheduleMonthItem.list({
        filter: {
          scheduleMonthId: { eq: monthId },
        },
      });

      const rows = [...(res.data ?? [])].sort((a, b) => {
        const w = (a.weekNoInMonth ?? 0) - (b.weekNoInMonth ?? 0);
        if (w !== 0) return w;
        const d = (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0);
        if (d !== 0) return d;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
      setMonthItems(rows);
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleMonthItem 読込エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    void loadMasters();
    void loadMonths();
  }, [loadMasters, loadMonths]);

  useEffect(() => {
    void loadMonthItems(scheduleMonthId);
  }, [scheduleMonthId, loadMonthItems]);

  async function createScheduleMonth() {
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
    if (!monthKey.trim()) {
      setMessage("monthKey を入力してください。");
      return;
    }

    setCreatingMonth(true);
    setMessage("ScheduleMonth を作成中...");

    try {
      const res = await client.models.ScheduleMonth.create({
        tenantId: tenantId.trim(),
        owner,
        classroomId: classroomId.trim(),
        ageTargetId: ageTargetId.trim(),
        monthKey: monthKey.trim(),
        title: `月案 ${monthKey.trim()}`,
        notes: "IssueScheduleMonthTestPanel から作成",
        status: "ACTIVE",
      });

      if (!res.data) {
        throw new Error(
          formatErrors(res.errors, "ScheduleMonth の作成に失敗しました。"),
        );
      }

      setScheduleMonthId(res.data.id);
      await loadMonths();
      await loadMonthItems(res.data.id);
      setMessage(`ScheduleMonth を作成しました。 id=${res.data.id}`);
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleMonth 作成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setCreatingMonth(false);
    }
  }

  async function createScheduleMonthItem() {
    if (!scheduleMonthId.trim()) {
      setMessage("先に ScheduleMonth を選択または作成してください。");
      return;
    }

    setCreatingItem(true);
    setMessage("ScheduleMonthItem を作成中...");

    try {
      const month = months.find((m) => m.id === scheduleMonthId);
      if (!month) {
        throw new Error("選択された ScheduleMonth が見つかりません。");
      }

      const res = await client.models.ScheduleMonthItem.create({
        tenantId: month.tenantId,
        owner,
        scheduleMonthId: month.id,
        weekNoInMonth: itemWeekNo,
        dayOfWeek: itemDayOfWeek,
        sourceType: "PLANNED",
        title: itemTitle.trim(),
        description: itemDescription.trim() || undefined,
        startTime: itemStartTime,
        endTime: itemEndTime,
        sortOrder: itemSortOrder,
        practiceCode: itemPracticeCode.trim() || undefined,
        practiceTitleSnapshot: undefined,
        scoreHealth,
        scoreHumanRelations,
        scoreEnvironment,
        scoreLanguage,
        scoreExpression,
      });

      if (!res.data) {
        throw new Error(
          formatErrors(res.errors, "ScheduleMonthItem の作成に失敗しました。"),
        );
      }

      await loadMonthItems(month.id);
      setMessage(`ScheduleMonthItem を作成しました。 id=${res.data.id}`);
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleMonthItem 作成エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setCreatingItem(false);
    }
  }

  async function issueScheduleWeek() {
    if (!scheduleMonthId.trim()) {
      setMessage("scheduleMonthId を選択してください。");
      return;
    }
    if (!selectedIssueWeek) {
      setMessage("weekNo を選択してください。");
      return;
    }

    const runner = client.mutations?.issueScheduleWeekFromScheduleMonth;
    if (!runner) {
      setMessage(
        "issueScheduleWeekFromScheduleMonth が client.mutations に見つかりません。",
      );
      return;
    }

    setIssuingWeek(true);
    setMessage("ScheduleWeek を発行中...");

    try {
      let res:
        | OperationEnvelope<IssueScheduleWeekResult>
        | IssueScheduleWeekResult;

      try {
        res = await runner({
          scheduleMonthId: scheduleMonthId.trim(),
          weekStartDate: selectedIssueWeek.weekStartDate,
          weekEndDate: selectedIssueWeek.weekEndDate,
          weekNo: selectedIssueWeek.weekNo,
          issueType: "MANUAL",
        });
      } catch {
        res = await runner({
          input: {
            scheduleMonthId: scheduleMonthId.trim(),
            weekStartDate: selectedIssueWeek.weekStartDate,
            weekEndDate: selectedIssueWeek.weekEndDate,
            weekNo: selectedIssueWeek.weekNo,
            issueType: "MANUAL",
          },
        });
      }

      const errors = getOperationErrors(res);
      if (errors?.length) {
        throw new Error(
          formatErrors(errors, "ScheduleWeek 発行に失敗しました。"),
        );
      }

      setMessage(JSON.stringify(getOperationData(res), null, 2));
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleWeek 発行エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIssuingWeek(false);
    }
  }

  return (
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
      <h2 style={{ margin: 0 }}>Issue Schedule Week Test</h2>

      <div
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fafafa",
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>ScheduleMonth 作成</div>

        <label style={{ display: "grid", gap: 4 }}>
          <span>tenantId</span>
          <input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span>classroomId</span>
          <select
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
          >
            <option value="">選択してください</option>
            {classrooms.map((row) => (
              <option key={row.id} value={row.id}>
                {labelOfClassroom(row)} ({row.id})
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span>ageTargetId</span>
          <select
            value={ageTargetId}
            onChange={(e) => setAgeTargetId(e.target.value)}
          >
            <option value="">選択してください</option>
            {ageTargets.map((row) => (
              <option key={row.id} value={row.id}>
                {labelOfAgeTarget(row)} ({row.id})
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span>monthKey</span>
          <input
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            placeholder="2026-04"
          />
        </label>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => void loadMasters()} disabled={loadingMasters}>
            {loadingMasters ? "読込中..." : "Classroom / AgeTarget 再読込"}
          </button>
          <button
            onClick={() => void createScheduleMonth()}
            disabled={creatingMonth}
          >
            {creatingMonth ? "作成中..." : "ScheduleMonth を作成"}
          </button>
          <button onClick={() => void loadMonths()} disabled={loadingMonths}>
            {loadingMonths ? "読込中..." : "ScheduleMonth 一覧を再読込"}
          </button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          background: "#fafafa",
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>ScheduleMonth 一覧</div>
        {months.length === 0 ? (
          <div style={{ color: "#666" }}>ScheduleMonth がありません</div>
        ) : (
          months.map((month) => (
            <div
              key={month.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 10,
                background: "#fff",
                display: "grid",
                gap: 6,
              }}
            >
              <div>
                <b>id:</b> {month.id}
              </div>
              <div>
                <b>monthKey:</b> {month.monthKey}
              </div>
              <div>
                <b>title:</b> {month.title || "-"}
              </div>
              <div>
                <b>status:</b> {String(month.status ?? "-")}
              </div>
              <div>
                <button onClick={() => setScheduleMonthId(month.id)}>
                  この ScheduleMonth を使う
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <label style={{ display: "grid", gap: 4 }}>
        <span>scheduleMonthId</span>
        <input
          type="text"
          value={scheduleMonthId}
          onChange={(e) => setScheduleMonthId(e.target.value)}
          placeholder="ScheduleMonth の id"
        />
      </label>

      <div
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fafafa",
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>ScheduleMonthItem 作成</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          <label style={{ display: "grid", gap: 4 }}>
            <span>weekNoInMonth</span>
            <select
              value={itemWeekNo}
              onChange={(e) => setItemWeekNo(Number(e.target.value))}
            >
              {weekOptions.map((w) => (
                <option key={w.weekNo} value={w.weekNo}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>dayOfWeek</span>
            <select
              value={itemDayOfWeek}
              onChange={(e) => setItemDayOfWeek(Number(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>
                  {d} ({dayOfWeekLabel(d)})
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>title</span>
            <input
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>practiceCode</span>
            <input
              value={itemPracticeCode}
              onChange={(e) => setItemPracticeCode(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>description</span>
            <input
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>startTime</span>
            <input
              value={itemStartTime}
              onChange={(e) => setItemStartTime(e.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>endTime</span>
            <input
              value={itemEndTime}
              onChange={(e) => setItemEndTime(e.target.value)}
            />
          </label>

          <div />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          <label style={{ display: "grid", gap: 4 }}>
            <span>健康</span>
            <input
              type="number"
              value={scoreHealth}
              onChange={(e) => setScoreHealth(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>人間関係</span>
            <input
              type="number"
              value={scoreHumanRelations}
              onChange={(e) => setScoreHumanRelations(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>環境</span>
            <input
              type="number"
              value={scoreEnvironment}
              onChange={(e) => setScoreEnvironment(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>言葉</span>
            <input
              type="number"
              value={scoreLanguage}
              onChange={(e) => setScoreLanguage(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>表現</span>
            <input
              type="number"
              value={scoreExpression}
              onChange={(e) => setScoreExpression(Number(e.target.value))}
            />
          </label>
        </div>

        <button
          onClick={() => void createScheduleMonthItem()}
          disabled={creatingItem}
        >
          {creatingItem ? "作成中..." : "ScheduleMonthItem を作成"}
        </button>
      </div>

      <div
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fafafa",
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>ScheduleWeek 発行</div>

        <label style={{ display: "grid", gap: 4 }}>
          <span>weekNo</span>
          <select
            value={issueWeekNo}
            onChange={(e) => setIssueWeekNo(Number(e.target.value))}
          >
            {weekOptions.map((w) => (
              <option key={w.weekNo} value={w.weekNo}>
                {w.label}
              </option>
            ))}
          </select>
        </label>

        <button onClick={() => void issueScheduleWeek()} disabled={issuingWeek}>
          {issuingWeek ? "発行中..." : "ScheduleWeek を発行"}
        </button>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          background: "#fafafa",
          display: "grid",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 700 }}>ScheduleMonthItem 一覧</div>

        {selectedMonth ? (
          <div>
            <b>selectedMonth:</b> {selectedMonth.id} / {selectedMonth.monthKey}
          </div>
        ) : (
          <div style={{ color: "#666" }}>ScheduleMonth を選択してください</div>
        )}

        <div>
          <b>月合計:</b> 健康 {totals.health} / 人間関係 {totals.humanRelations}{" "}
          / 環境 {totals.environment} / 言葉 {totals.language} / 表現{" "}
          {totals.expression}
        </div>

        {monthItems.length === 0 ? (
          <div style={{ color: "#666" }}>ScheduleMonthItem がありません</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {monthItems.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 10,
                  background: "#fff",
                  display: "grid",
                  gap: 4,
                }}
              >
                <div>
                  <b>id:</b> {item.id}
                </div>
                <div>
                  <b>weekNoInMonth:</b> {item.weekNoInMonth}
                </div>
                <div>
                  <b>dayOfWeek:</b> {item.dayOfWeek} (
                  {dayOfWeekLabel(item.dayOfWeek ?? -1)})
                </div>
                <div>
                  <b>title:</b> {item.title}
                </div>
                <div>
                  <b>practiceCode:</b> {item.practiceCode || "-"}
                </div>
                <div>
                  <b>scores:</b> 健康 {item.scoreHealth ?? 0} / 人間関係{" "}
                  {item.scoreHumanRelations ?? 0} / 環境{" "}
                  {item.scoreEnvironment ?? 0} / 言葉 {item.scoreLanguage ?? 0}{" "}
                  / 表現 {item.scoreExpression ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: 12,
          borderRadius: 8,
          background: "#f3f4f6",
          whiteSpace: "pre-wrap",
        }}
      >
        {message || "ここにメッセージが表示されます。"}
      </div>
    </div>
  );
}
