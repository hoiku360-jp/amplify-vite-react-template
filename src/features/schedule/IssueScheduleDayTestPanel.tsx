import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

type WeekRow = Schema["ScheduleWeek"]["type"];
type WeekItemRow = Schema["ScheduleWeekItem"]["type"];
type ClassroomRow = Schema["Classroom"]["type"];
type AgeTargetRow = Schema["SchoolAnnualAgeTarget"]["type"];

type Props = {
  owner: string;
};

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
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStartDate = addDays(targetDate, diffToMonday);
  const weekEndDate = addDays(weekStartDate, 6);
  return { weekStartDate, weekEndDate };
}

function toDayOfWeek(targetDate: string) {
  const d = new Date(`${targetDate}T00:00:00+09:00`);
  return d.getDay(); // 0=Sun ... 6=Sat
}

function dayOfWeekLabel(dayOfWeek: number) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels[dayOfWeek] ?? String(dayOfWeek);
}

function labelOfClassroom(row: ClassroomRow) {
  const r = row as any;
  return r.name || r.title || r.className || r.id;
}

function labelOfAgeTarget(row: AgeTargetRow) {
  const r = row as any;
  return r.name || r.title || r.label || r.id;
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
    [targetDate]
  );

  const targetDayOfWeek = useMemo(
    () => toDayOfWeek(targetDate),
    [targetDate]
  );

  const selectedWeek = useMemo(
    () => weeks.find((w) => w.id === scheduleWeekId) ?? null,
    [weeks, scheduleWeekId]
  );

  async function loadWeeks() {
    setLoadingWeeks(true);
    try {
      const res = await client.models.ScheduleWeek.list();
      const rows = [...(res.data ?? [])].sort((a, b) =>
        String(b.weekStartDate ?? "").localeCompare(String(a.weekStartDate ?? ""))
      );
      setWeeks(rows);
    } catch (e) {
      console.error(e);
      setMessage(`ScheduleWeek読込エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingWeeks(false);
    }
  }

  async function loadWeekItems(weekId: string) {
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
        `ScheduleWeekItem読込エラー: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoadingWeekItems(false);
    }
  }

  async function loadMasters() {
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

      if (!classroomId && classroomRows[0]?.id) {
        setClassroomId(classroomRows[0].id);
      }
      if (!ageTargetId && ageTargetRows[0]?.id) {
        setAgeTargetId(ageTargetRows[0].id);
      }
    } catch (e) {
      console.error(e);
      setMessage(
        `Classroom/AgeTarget読込エラー: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoadingMasters(false);
    }
  }

  useEffect(() => {
    void loadWeeks();
    void loadMasters();
  }, []);

  useEffect(() => {
    if (!scheduleWeekId) {
      setWeekItems([]);
      return;
    }
    void loadWeekItems(scheduleWeekId);
  }, [scheduleWeekId]);

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
        status: "ACTIVE" as any,
        title: `テスト週案 ${weekRange.weekStartDate}`,
        notes: "IssueScheduleDayTestPanel から作成",
      });

      if (!res.data) {
        throw new Error(
          res.errors?.map((e) => e.message).join(", ") ||
            "ScheduleWeek の作成に失敗しました。"
        );
      }

      setScheduleWeekId(res.data.id);
      await loadWeeks();
      await loadWeekItems(res.data.id);

      setMessage(
        `ScheduleWeek を作成しました。
id=${res.data.id}
week=${res.data.weekStartDate}～${res.data.weekEndDate}`
      );
    } catch (e) {
      console.error(e);
      setMessage(`ScheduleWeek作成エラー: ${e instanceof Error ? e.message : String(e)}`);
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
          item1.errors?.map((e) => e.message).join(", ") ||
            "1件目の ScheduleWeekItem 作成に失敗しました。"
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
          item2.errors?.map((e) => e.message).join(", ") ||
            "2件目の ScheduleWeekItem 作成に失敗しました。"
        );
      }

      await loadWeekItems(week.id);

      setMessage(
        `ScheduleWeekItem を2件作成しました。
dayOfWeek=${dayOfWeek} (${dayOfWeekLabel(dayOfWeek)})
targetDate=${targetDate}`
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `ScheduleWeekItem作成エラー: ${e instanceof Error ? e.message : String(e)}`
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

    setIssuing(true);
    setMessage("日案を発行中...");

    try {
      const res = await client.mutations.issueScheduleDayFromScheduleWeek({
        scheduleWeekId: scheduleWeekId.trim(),
        targetDate,
        issueType: "MANUAL",
      });

      if (res.errors?.length) {
        throw new Error(res.errors.map((e) => e.message).join(", "));
      }

      await loadWeekItems(scheduleWeekId.trim());
      setMessage(JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.error(e);
      setMessage(`日案発行エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIssuing(false);
    }
  }

  const matchedItems = weekItems.filter(
    (item) => item.dayOfWeek === targetDayOfWeek
  );

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
          <button onClick={loadMasters} disabled={loadingMasters}>
            {loadingMasters ? "読込中..." : "Classroom / AgeTarget 再読込"}
          </button>
          <button onClick={createTestWeek} disabled={creatingWeek}>
            {creatingWeek ? "作成中..." : "テスト用 ScheduleWeek を作成"}
          </button>
          <button onClick={loadWeeks} disabled={loadingWeeks}>
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
              <div><b>id:</b> {week.id}</div>
              <div><b>week:</b> {week.weekStartDate} ～ {week.weekEndDate}</div>
              <div><b>title:</b> {week.title || "-"}</div>
              <div><b>status:</b> {String((week as any).status ?? "-")}</div>
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={createTestWeekItems} disabled={creatingItems}>
          {creatingItems ? "作成中..." : "選択した週にテスト項目2件を作成"}
        </button>

        <button
          onClick={() => void loadWeekItems(scheduleWeekId)}
          disabled={loadingWeekItems || !scheduleWeekId}
        >
          {loadingWeekItems ? "読込中..." : "選択した週の項目一覧を再読込"}
        </button>

        <button onClick={runIssue} disabled={issuing}>
          {issuing ? "発行中..." : "日案を発行"}
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
        <div style={{ fontWeight: 700 }}>
          選択中 ScheduleWeek の ScheduleWeekItem 一覧
        </div>

        {selectedWeek ? (
          <div>
            <b>selectedWeek:</b> {selectedWeek.id} / {selectedWeek.weekStartDate} ～{" "}
            {selectedWeek.weekEndDate}
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
                    border: matched
                      ? "2px solid #2563eb"
                      : "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 10,
                    background: matched ? "#eff6ff" : "#fff",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div><b>id:</b> {item.id}</div>
                  <div>
                    <b>title:</b> {item.title}
                  </div>
                  <div>
                    <b>time:</b> {item.startTime} ～ {item.endTime}
                  </div>
                  <div>
                    <b>dayOfWeek:</b> {item.dayOfWeek} ({dayOfWeekLabel(item.dayOfWeek ?? -1)})
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

      <pre
        style={{
          margin: 0,
          padding: 12,
          background: "#f7f7f7",
          borderRadius: 8,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {message || "ここに結果が表示されます"}
      </pre>
    </div>
  );
}