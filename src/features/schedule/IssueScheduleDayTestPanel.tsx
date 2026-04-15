import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  owner: string;
};

type WeekRow = Schema["ScheduleWeek"]["type"] & {
  status?: string | null;
};

type WeekItemRow = Schema["ScheduleWeekItem"]["type"];

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

type IssueScheduleDayArgs = {
  scheduleWeekId: string;
  targetDate: string;
  issueType: "MANUAL";
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

type DayTestClient = {
  models: {
    ScheduleWeek: ListableModel<WeekRow> & CreatableModel<WeekRow>;
    ScheduleWeekItem: ListableModel<WeekItemRow> & CreatableModel<WeekItemRow>;
    Classroom: ListableModel<ClassroomRow>;
    SchoolAnnualAgeTarget: ListableModel<AgeTargetRow>;
  };
  mutations?: {
    issueScheduleDayFromScheduleWeek?: OperationRunner<
      IssueScheduleDayArgs,
      IssueScheduleDayResult
    >;
  };
};

const client = generateClient<Schema>() as unknown as DayTestClient;

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: string, diff: number) {
  const d = new Date(`${base}T00:00:00+09:00`);
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekRangeMondayStart(targetDate: string) {
  const d = new Date(`${targetDate}T00:00:00+09:00`);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStartDate = addDays(targetDate, diffToMonday);
  const weekEndDate = addDays(weekStartDate, 6);
  return { weekStartDate, weekEndDate };
}

function toDayOfWeek(targetDate: string) {
  const d = new Date(`${targetDate}T00:00:00+09:00`);
  return d.getDay();
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

export default function IssueScheduleDayTestPanel(props: Props) {
  const { owner } = props;

  const [tenantId, setTenantId] = useState("demo-tenant");
  const [classroomId, setClassroomId] = useState("");
  const [ageTargetId, setAgeTargetId] = useState("");
  const [targetDate, setTargetDate] = useState(todayString());
  const [scheduleWeekId, setScheduleWeekId] = useState("");

  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [weekItems, setWeekItems] = useState<WeekItemRow[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [ageTargets, setAgeTargets] = useState<AgeTargetRow[]>([]);

  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [loadingWeekItems, setLoadingWeekItems] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [creatingWeek, setCreatingWeek] = useState(false);
  const [creatingItems, setCreatingItems] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [message, setMessage] = useState("");

  const weekRange = useMemo(
    () => getWeekRangeMondayStart(targetDate),
    [targetDate],
  );

  const targetDayOfWeek = useMemo(() => toDayOfWeek(targetDate), [targetDate]);

  const selectedWeek = useMemo(
    () => weeks.find((w) => w.id === scheduleWeekId) ?? null,
    [weeks, scheduleWeekId],
  );

  const matchedItems = useMemo(
    () => weekItems.filter((item) => item.dayOfWeek === targetDayOfWeek),
    [weekItems, targetDayOfWeek],
  );

  const loadWeeks = useCallback(async () => {
    setLoadingWeeks(true);
    try {
      const res = await client.models.ScheduleWeek.list();
      const rows = [...(res.data ?? [])].sort((a, b) =>
        String(b.weekStartDate ?? "").localeCompare(
          String(a.weekStartDate ?? ""),
        ),
      );
      setWeeks(rows);
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleWeek読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingWeeks(false);
    }
  }, []);

  const loadWeekItems = useCallback(async (weekId: string) => {
    if (!weekId) {
      setWeekItems([]);
      return;
    }

    setLoadingWeekItems(true);
    try {
      const res = await client.models.ScheduleWeekItem.list({
        filter: {
          scheduleWeekId: { eq: weekId },
        },
      });

      const rows = [...(res.data ?? [])].sort((a, b) => {
        const d = (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0);
        if (d !== 0) return d;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

      setWeekItems(rows);
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleWeekItem読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingWeekItems(false);
    }
  }, []);

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
        `Classroom/AgeTarget読込エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setLoadingMasters(false);
    }
  }, []);

  useEffect(() => {
    void loadWeeks();
    void loadMasters();
  }, [loadWeeks, loadMasters]);

  useEffect(() => {
    void loadWeekItems(scheduleWeekId);
  }, [scheduleWeekId, loadWeekItems]);

  async function createTestWeek() {
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

    setCreatingWeek(true);
    setMessage("ScheduleWeek を作成中...");

    try {
      const res = await client.models.ScheduleWeek.create({
        tenantId: tenantId.trim(),
        owner,
        classroomId: classroomId.trim(),
        ageTargetId: ageTargetId.trim(),
        weekStartDate: weekRange.weekStartDate,
        weekEndDate: weekRange.weekEndDate,
        status: "ACTIVE",
        title: `テスト週案 ${weekRange.weekStartDate}`,
        notes: "IssueScheduleDayTestPanel から作成",
      });

      if (!res.data) {
        throw new Error(
          formatErrors(res.errors, "ScheduleWeek の作成に失敗しました。"),
        );
      }

      setScheduleWeekId(res.data.id);
      await loadWeeks();
      await loadWeekItems(res.data.id);

      setMessage(
        `ScheduleWeek を作成しました。
id=${res.data.id}
week=${res.data.weekStartDate}～${res.data.weekEndDate}`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleWeek作成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setCreatingWeek(false);
    }
  }

  async function createTestWeekItems() {
    if (!scheduleWeekId.trim()) {
      setMessage("先に scheduleWeekId を選択または作成してください。");
      return;
    }

    const week = weeks.find((w) => w.id === scheduleWeekId);
    if (!week) {
      setMessage("選択された ScheduleWeek が一覧に見つかりません。");
      return;
    }

    setCreatingItems(true);
    setMessage("ScheduleWeekItem を作成中...");

    try {
      const dayOfWeek = targetDayOfWeek;

      const item1 = await client.models.ScheduleWeekItem.create({
        tenantId: week.tenantId,
        owner,
        scheduleWeekId: week.id,
        dayOfWeek,
        sourceType: "PLANNED",
        title: "朝の会",
        description: "テスト用 planned item",
        startTime: "09:00",
        endTime: "09:30",
        sortOrder: 10,
        scoreHealth: 1,
        scoreHumanRelations: 1,
        scoreEnvironment: 0,
        scoreLanguage: 1,
        scoreExpression: 0,
      });

      if (!item1.data) {
        throw new Error(
          formatErrors(
            item1.errors,
            "1件目の ScheduleWeekItem 作成に失敗しました。",
          ),
        );
      }

      const item2 = await client.models.ScheduleWeekItem.create({
        tenantId: week.tenantId,
        owner,
        scheduleWeekId: week.id,
        dayOfWeek,
        sourceType: "PLANNED",
        title: "栽培活動",
        description: "テスト用 planned item",
        startTime: "10:00",
        endTime: "10:40",
        sortOrder: 20,
        scoreHealth: 0,
        scoreHumanRelations: 1,
        scoreEnvironment: 2,
        scoreLanguage: 0,
        scoreExpression: 1,
      });

      if (!item2.data) {
        throw new Error(
          formatErrors(
            item2.errors,
            "2件目の ScheduleWeekItem 作成に失敗しました。",
          ),
        );
      }

      await loadWeekItems(week.id);

      setMessage(
        `ScheduleWeekItem を2件作成しました。
dayOfWeek=${dayOfWeek} (${dayOfWeekLabel(dayOfWeek)})
targetDate=${targetDate}`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleWeekItem作成エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setCreatingItems(false);
    }
  }

  async function runIssue() {
    if (!scheduleWeekId.trim()) {
      setMessage("scheduleWeekId を入力してください。");
      return;
    }

    const runner = client.mutations?.issueScheduleDayFromScheduleWeek;
    if (!runner) {
      setMessage(
        "issueScheduleDayFromScheduleWeek が client.mutations に見つかりません。",
      );
      return;
    }

    setIssuing(true);
    setMessage("日案を発行中...");

    try {
      let res:
        | OperationEnvelope<IssueScheduleDayResult>
        | IssueScheduleDayResult;

      try {
        res = await runner({
          scheduleWeekId: scheduleWeekId.trim(),
          targetDate,
          issueType: "MANUAL",
        });
      } catch {
        res = await runner({
          input: {
            scheduleWeekId: scheduleWeekId.trim(),
            targetDate,
            issueType: "MANUAL",
          },
        });
      }

      const errors = getOperationErrors(res);
      if (errors?.length) {
        throw new Error(formatErrors(errors, "日案発行に失敗しました。"));
      }

      await loadWeekItems(scheduleWeekId.trim());
      setMessage(JSON.stringify(getOperationData(res), null, 2));
    } catch (e) {
      console.error(e);
      setMessage(
        `日案発行エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIssuing(false);
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
      <h2 style={{ margin: 0 }}>Issue Schedule Day Test</h2>

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
        <div style={{ fontWeight: 700 }}>テスト用 ScheduleWeek 作成</div>

        <label style={{ display: "grid", gap: 4 }}>
          <span>tenantId</span>
          <input
            type="text"
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
          <span>targetDate</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </label>

        <div>
          対象週: {weekRange.weekStartDate} ～ {weekRange.weekEndDate}
        </div>
        <div>
          対象曜日: {targetDayOfWeek} ({dayOfWeekLabel(targetDayOfWeek)})
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => void loadMasters()} disabled={loadingMasters}>
            {loadingMasters ? "読込中..." : "Classroom / AgeTarget 再読込"}
          </button>
          <button onClick={() => void createTestWeek()} disabled={creatingWeek}>
            {creatingWeek ? "作成中..." : "テスト用 ScheduleWeek を作成"}
          </button>
          <button onClick={() => void loadWeeks()} disabled={loadingWeeks}>
            {loadingWeeks ? "読込中..." : "ScheduleWeek 一覧を再読込"}
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
        <div style={{ fontWeight: 700 }}>ScheduleWeek 一覧</div>

        {weeks.length === 0 ? (
          <div style={{ color: "#666" }}>ScheduleWeek がありません</div>
        ) : (
          weeks.map((week) => (
            <div
              key={week.id}
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
                <b>id:</b> {week.id}
              </div>
              <div>
                <b>week:</b> {week.weekStartDate} ～ {week.weekEndDate}
              </div>
              <div>
                <b>title:</b> {week.title || "-"}
              </div>
              <div>
                <b>status:</b> {String(week.status ?? "-")}
              </div>
              <div>
                <button onClick={() => setScheduleWeekId(week.id)}>
                  この ScheduleWeek を使う
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <label style={{ display: "grid", gap: 4 }}>
        <span>scheduleWeekId</span>
        <input
          type="text"
          value={scheduleWeekId}
          onChange={(e) => setScheduleWeekId(e.target.value)}
          placeholder="ScheduleWeek の id"
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
        <div style={{ fontWeight: 700 }}>日案発行テスト</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => void createTestWeekItems()}
            disabled={creatingItems || !scheduleWeekId}
          >
            {creatingItems ? "作成中..." : "選択した週にテスト項目2件を作成"}
          </button>

          <button
            onClick={() => void loadWeekItems(scheduleWeekId)}
            disabled={loadingWeekItems || !scheduleWeekId}
          >
            {loadingWeekItems ? "読込中..." : "選択した週の項目一覧を再読込"}
          </button>

          <button onClick={() => void runIssue()} disabled={issuing}>
            {issuing ? "発行中..." : "日案を発行"}
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
        <div style={{ fontWeight: 700 }}>
          選択中 ScheduleWeek の ScheduleWeekItem 一覧
        </div>

        {selectedWeek ? (
          <div>
            <b>selectedWeek:</b> {selectedWeek.id} /{" "}
            {selectedWeek.weekStartDate} ～ {selectedWeek.weekEndDate}
          </div>
        ) : (
          <div style={{ color: "#666" }}>ScheduleWeek を選択してください</div>
        )}

        <div>
          <b>targetDate:</b> {targetDate} / <b>targetDayOfWeek:</b>{" "}
          {targetDayOfWeek} ({dayOfWeekLabel(targetDayOfWeek)})
        </div>

        <div>
          <b>該当曜日の件数:</b> {matchedItems.length}
        </div>

        {weekItems.length === 0 ? (
          <div style={{ color: "#666" }}>ScheduleWeekItem がありません</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {weekItems.map((item) => {
              const matched = item.dayOfWeek === targetDayOfWeek;

              return (
                <div
                  key={item.id}
                  style={{
                    border: matched ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 10,
                    background: matched ? "#eff6ff" : "#fff",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div>
                    <b>id:</b> {item.id}
                  </div>
                  <div>
                    <b>title:</b> {item.title}
                  </div>
                  <div>
                    <b>time:</b> {item.startTime} ～ {item.endTime}
                  </div>
                  <div>
                    <b>dayOfWeek:</b> {item.dayOfWeek} (
                    {dayOfWeekLabel(item.dayOfWeek ?? -1)})
                  </div>
                  <div>
                    <b>sortOrder:</b> {item.sortOrder}
                  </div>
                  <div>
                    <b>sourceType:</b> {String(item.sourceType ?? "-")}
                  </div>
                  <div>
                    <b>practiceCode:</b> {item.practiceCode || "-"}
                  </div>
                  <div>
                    <b>match targetDate?</b> {matched ? "YES" : "NO"}
                  </div>
                </div>
              );
            })}
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
