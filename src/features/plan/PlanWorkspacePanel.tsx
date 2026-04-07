"use client";

import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import PlanTree from "./PlanTree";
import PlanEditor from "./PlanEditor";
import {
  emptyPlanForm,
  sortPlans,
  toIntOrNull,
  toPlanForm,
  type ClassroomRecord,
  type DayProgramDraft,
  type DocTab,
  type EventDraft,
  type PlanFormState,
  type PlanRecord,
  type WeekAssignmentDraft,
} from "./types";

type PlanStatus = "DRAFT" | "REVIEWED" | "FINAL";

function toPlanStatus(value: string | null | undefined): PlanStatus | null {
  if (value === "DRAFT" || value === "REVIEWED" || value === "FINAL") {
    return value;
  }
  return null;
}

export default function PlanWorkspacePanel(props: { owner: string }) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [plans, setPlans] = useState<PlanRecord[]>([]);

  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const [fiscalYear, setFiscalYear] = useState<number>(2026);

  const [docTab, setDocTab] = useState<DocTab>("draft");
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm());

  const [eventDrafts, setEventDrafts] = useState<EventDraft[]>([]);
  const [weekDrafts, setWeekDrafts] = useState<WeekAssignmentDraft[]>([]);
  const [dayDrafts, setDayDrafts] = useState<DayProgramDraft[]>([]);

  const selectedClassroom = classrooms.find((x) => x.id === selectedClassroomId);

  const classroomPlans = useMemo(
    () => sortPlans(plans.filter((p) => p.classroomId === selectedClassroomId)),
    [plans, selectedClassroomId]
  );

  const selectedPlan = classroomPlans.find((p) => p.id === selectedPlanId);

  async function refreshBase(preferredClassroomId?: string, preferredPlanId?: string) {
    setLoading(true);
    setMessage("");

    try {
      const [classroomRes, planRes] = await Promise.all([
        client.models.Classroom.list(),
        client.models.Plan.list(),
      ]);

      const nextClassrooms = [...(classroomRes.data ?? [])].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "")
      );
      const nextPlans = sortPlans(planRes.data ?? []);

      setClassrooms(nextClassrooms);
      setPlans(nextPlans);

      const nextClassroomId =
        preferredClassroomId ||
        selectedClassroomId ||
        nextClassrooms[0]?.id ||
        "";
      setSelectedClassroomId(nextClassroomId);

      const nextPlanCandidate = preferredPlanId
        ? nextPlans.find(
            (p) => p.id === preferredPlanId && p.classroomId === nextClassroomId
          ) ?? null
        : null;

      const fallbackPlan =
        nextPlans.find((p) => p.classroomId === nextClassroomId) ?? null;

      setSelectedPlanId(nextPlanCandidate?.id ?? fallbackPlan?.id ?? "");
    } catch (e) {
      console.error(e);
      setMessage("読み込みに失敗しました。resource.ts の反映状況を確認してください。");
    } finally {
      setLoading(false);
    }
  }

  async function loadRelated(plan: PlanRecord | undefined) {
    if (!plan?.id) {
      setEventDrafts([]);
      setWeekDrafts([]);
      setDayDrafts([]);
      return;
    }

    if (
      plan.planType === "YEAR" ||
      plan.planType === "TERM" ||
      plan.planType === "MONTH"
    ) {
      const res = await client.models.PlanEvent.list({
        filter: { planId: { eq: plan.id } },
      });

      setEventDrafts(
        [...(res.data ?? [])]
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((x) => ({
            id: x.id,
            label: x.label ?? "",
            eventMonth:
              x.eventMonth === null || x.eventMonth === undefined
                ? ""
                : String(x.eventMonth),
            eventDate: x.eventDate ?? "",
            sortOrder:
              x.sortOrder === null || x.sortOrder === undefined
                ? ""
                : String(x.sortOrder),
          }))
      );
    } else {
      setEventDrafts([]);
    }

    if (plan.planType === "WEEK") {
      const res = await client.models.WeekPracticeAssignment.list({
        filter: { weekPlanId: { eq: plan.id } },
      });

      setWeekDrafts(
        [...(res.data ?? [])]
          .sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? ""))
          .map((x) => ({
            id: x.id,
            targetDate: x.targetDate ?? "",
            practiceCodeId: x.practiceCodeId ?? "",
            note: x.note ?? "",
            sortOrder:
              x.sortOrder === null || x.sortOrder === undefined
                ? ""
                : String(x.sortOrder),
          }))
      );
    } else {
      setWeekDrafts([]);
    }

    if (plan.planType === "DAY") {
      const res = await client.models.DayProgramItem.list({
        filter: { dayPlanId: { eq: plan.id } },
      });

      setDayDrafts(
        [...(res.data ?? [])]
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((x) => ({
            id: x.id,
            programType:
              (x.programType as "REGULAR" | "PLANNED") ?? "REGULAR",
            title: x.title ?? "",
            startTime: x.startTime ?? "",
            endTime: x.endTime ?? "",
            practiceCodeId: x.practiceCodeId ?? "",
            note: x.note ?? "",
            sortOrder:
              x.sortOrder === null || x.sortOrder === undefined
                ? ""
                : String(x.sortOrder),
          }))
      );
    } else {
      setDayDrafts([]);
    }
  }

  useEffect(() => {
    void refreshBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPlanForm(toPlanForm(selectedPlan));
    void loadRelated(selectedPlan);
    setDocTab("draft");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanId, plans.length]);

  async function createStarterData() {
    setLoading(true);
    setMessage("");

    try {
      const classroomList = await client.models.Classroom.list({
        filter: { name: { eq: "ひまわり組" } },
        limit: 100,
      });

      const existingClassroom =
        (classroomList.data ?? []).find(
          (c) => (c.schoolName ?? "") === "保育360デモ園"
        ) ??
        (classroomList.data ?? [])[0] ??
        null;

      let classroomId = existingClassroom?.id ?? "";

      if (!classroomId) {
        const classroom = await client.models.Classroom.create({
          name: "ひまわり組",
          ageBand: "4歳児",
          schoolName: "保育360デモ園",
        });

        classroomId = classroom.data?.id ?? "";
        if (!classroomId) throw new Error("Classroom create failed");
      }

      setSelectedClassroomId(classroomId);
      await refreshBase(classroomId);
      setMessage("サンプルクラスを表示しました。");
    } catch (e) {
      console.error(e);
      setMessage("サンプルクラス作成に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function ensureFiscalYearTemplate() {
    if (!selectedClassroomId) {
      setMessage("先にクラスを選択してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await client.mutations.ensureFiscalYearTemplate({
        classroomId: selectedClassroomId,
        fiscalYear,
      });

      if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join("\n"));
      }

      const yearPlanId = result.data?.yearPlanId;
      await refreshBase(selectedClassroomId, yearPlanId ?? "");

      setMessage(
        `年度テンプレートを準備しました。年度=${fiscalYear} / 期追加=${result.data?.createdTermCount ?? 0}件 / 月追加=${result.data?.createdMonthCount ?? 0}件`
      );
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "年度テンプレート生成に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function savePlan() {
    if (!selectedPlan?.id) return;

    try {
      await client.models.Plan.update({
        id: selectedPlan.id,
        title: planForm.title,
        periodStart: planForm.periodStart || null,
        periodEnd: planForm.periodEnd || null,
        weekStartDate: planForm.weekStartDate || null,
        targetDate: planForm.targetDate || null,
        classAgeLabel: planForm.classAgeLabel || null,
        schoolPolicy: planForm.schoolPolicy || null,
        goalText: planForm.goalText || null,
        draftText: planForm.draftText || null,
        aiSuggestedText: planForm.aiSuggestedText || null,
        finalText: planForm.finalText || null,
        status: toPlanStatus(planForm.status),
        abilityHealth: toIntOrNull(planForm.abilityHealth),
        abilityHumanRelations: toIntOrNull(planForm.abilityHumanRelations),
        abilityEnvironment: toIntOrNull(planForm.abilityEnvironment),
        abilityLanguage: toIntOrNull(planForm.abilityLanguage),
        abilityExpression: toIntOrNull(planForm.abilityExpression),
      });

      await refreshBase(selectedClassroomId, selectedPlan.id);
      setMessage("Plan を保存しました。");
    } catch (e) {
      console.error(e);
      setMessage("Plan の保存に失敗しました。");
    }
  }

  async function saveEvents() {
    if (!selectedPlan?.id) return;

    try {
      for (const row of eventDrafts) {
        if (!row.label.trim()) continue;

        if (row.id) {
          await client.models.PlanEvent.update({
            id: row.id,
            label: row.label,
            eventMonth: toIntOrNull(row.eventMonth),
            eventDate: row.eventDate || null,
            sortOrder: toIntOrNull(row.sortOrder),
          });
        } else {
          await client.models.PlanEvent.create({
            planId: selectedPlan.id,
            label: row.label,
            eventMonth: toIntOrNull(row.eventMonth),
            eventDate: row.eventDate || null,
            sortOrder: toIntOrNull(row.sortOrder),
          });
        }
      }

      await loadRelated(selectedPlan);
      setMessage("行事を保存しました。");
    } catch (e) {
      console.error(e);
      setMessage("行事の保存に失敗しました。");
    }
  }

  async function deleteEvent(id?: string) {
    if (!id) return;
    await client.models.PlanEvent.delete({ id });
    await loadRelated(selectedPlan);
  }

  async function saveWeekAssignments() {
    if (!selectedPlan?.id) return;

    try {
      for (const row of weekDrafts) {
        if (!row.targetDate.trim()) continue;

        if (row.id) {
          await client.models.WeekPracticeAssignment.update({
            id: row.id,
            targetDate: row.targetDate,
            practiceCodeId: row.practiceCodeId || null,
            note: row.note || null,
            sortOrder: toIntOrNull(row.sortOrder),
          });
        } else {
          await client.models.WeekPracticeAssignment.create({
            weekPlanId: selectedPlan.id,
            targetDate: row.targetDate,
            practiceCodeId: row.practiceCodeId || null,
            note: row.note || null,
            sortOrder: toIntOrNull(row.sortOrder),
          });
        }
      }

      await loadRelated(selectedPlan);
      setMessage("週案の Practice 割当を保存しました。");
    } catch (e) {
      console.error(e);
      setMessage("週案の保存に失敗しました。");
    }
  }

  async function deleteWeekAssignment(id?: string) {
    if (!id) return;
    await client.models.WeekPracticeAssignment.delete({ id });
    await loadRelated(selectedPlan);
  }

  async function saveDayPrograms() {
    if (!selectedPlan?.id) return;

    try {
      for (const row of dayDrafts) {
        if (!row.title.trim()) continue;

        if (row.id) {
          await client.models.DayProgramItem.update({
            id: row.id,
            programType: row.programType,
            title: row.title,
            startTime: row.startTime || null,
            endTime: row.endTime || null,
            practiceCodeId: row.practiceCodeId || null,
            note: row.note || null,
            sortOrder: toIntOrNull(row.sortOrder),
          });
        } else {
          await client.models.DayProgramItem.create({
            dayPlanId: selectedPlan.id,
            programType: row.programType,
            title: row.title,
            startTime: row.startTime || null,
            endTime: row.endTime || null,
            practiceCodeId: row.practiceCodeId || null,
            note: row.note || null,
            sortOrder: toIntOrNull(row.sortOrder),
          });
        }
      }

      await loadRelated(selectedPlan);
      setMessage("日案のプログラムを保存しました。");
    } catch (e) {
      console.error(e);
      setMessage("日案の保存に失敗しました。");
    }
  }

  async function deleteDayProgram(id?: string) {
    if (!id) return;
    await client.models.DayProgramItem.delete({ id });
    await loadRelated(selectedPlan);
  }

  function handleSelectClassroom(nextId: string) {
    setSelectedClassroomId(nextId);
    const firstPlan = plans.find((p) => p.classroomId === nextId);
    setSelectedPlanId(firstPlan?.id ?? "");
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <strong>PLAN Workspace</strong>
        <span style={{ color: "#666" }}>owner: {owner}</span>

        <button onClick={() => void refreshBase()} disabled={loading}>
          Refresh
        </button>

        <button onClick={() => void createStarterData()} disabled={loading}>
          サンプルクラス表示
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          年度
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
          </select>
        </label>

        <button
          onClick={() => void ensureFiscalYearTemplate()}
          disabled={loading || !selectedClassroomId}
        >
          年度テンプレート生成
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: 8,
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "#fafafa",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 320px",
          gap: 12,
          alignItems: "start",
        }}
      >
        <PlanTree
          classrooms={classrooms}
          selectedClassroomId={selectedClassroomId}
          classroomPlans={classroomPlans}
          selectedPlanId={selectedPlanId}
          onSelectClassroom={handleSelectClassroom}
          onSelectPlan={setSelectedPlanId}
        />

        <PlanEditor
          selectedPlan={selectedPlan}
          selectedClassroomName={selectedClassroom?.name}
          allPlans={plans}
          planForm={planForm}
          setPlanForm={setPlanForm}
          docTab={docTab}
          setDocTab={setDocTab}
          eventDrafts={eventDrafts}
          setEventDrafts={setEventDrafts}
          weekDrafts={weekDrafts}
          setWeekDrafts={setWeekDrafts}
          dayDrafts={dayDrafts}
          setDayDrafts={setDayDrafts}
          onSavePlan={savePlan}
          onSaveEvents={saveEvents}
          onDeleteEvent={deleteEvent}
          onSaveWeekAssignments={saveWeekAssignments}
          onDeleteWeekAssignment={deleteWeekAssignment}
          onSaveDayPrograms={saveDayPrograms}
          onDeleteDayProgram={deleteDayProgram}
        />
      </div>
    </div>
  );
}