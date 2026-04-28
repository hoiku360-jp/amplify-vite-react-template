"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import PlanV2Sidebar from "./PlanV2Sidebar";
import PlanV2Editor from "./PlanV2Editor";
import {
  byText,
  s,
  stringifyAbilitySummary,
  summarizeAbilityWeightsByDomain,
  toIntOrNull,
  type AbilityForm,
  type ClassAnnualPlanForm,
  type ClassAnnualPlanRecord,
  type ClassMonthPlanPhraseSelectionRecord,
  type ClassMonthPlanRecord,
  type ClassQuarterPlanRecord,
  type ClassroomForm,
  type ClassroomRecord,
  type MonthEventRecord,
  type MonthPlanForm,
  type MonthPlanPhraseSelectionForm,
  type PlanPhraseAbilityLinkRecord,
  type PlanPhraseRecord,
  type QuarterEventRecord,
  type QuarterPlanForm,
  type SchoolAnnualAgeTargetRecord,
  type SchoolAnnualPlanForm,
  type SchoolAnnualPlanRecord,
  type TenantRecord,
  type TreeNode,
} from "./types";

type ModelResultLike =
  | {
      errors?: ReadonlyArray<{ message?: string | null }> | null;
    }
  | null
  | undefined;

type PlanStatus = "DRAFT" | "REVIEWED" | "FINAL";
type ClassroomStatus = "active" | "inactive";

function parseEventSummary(summary: string): string[] {
  return summary
    .split(/\r?\n|,/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function getModelErrorMessage(result: ModelResultLike): string {
  return (result?.errors ?? [])
    .map((e) => e?.message ?? "")
    .filter((x) => x.length > 0)
    .join("\n");
}

function throwIfModelErrors(result: ModelResultLike) {
  const msg = getModelErrorMessage(result);
  if (msg) throw new Error(msg);
}

function toPlanStatus(value: string | null | undefined): PlanStatus | null {
  if (value === "DRAFT" || value === "REVIEWED" || value === "FINAL") {
    return value;
  }
  return null;
}

function toClassroomStatus(
  value: string | null | undefined,
): ClassroomStatus | null {
  if (value === "active" || value === "inactive") {
    return value;
  }
  if (value === "ACTIVE") {
    return "active";
  }
  if (value === "INACTIVE") {
    return "inactive";
  }
  return null;
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function uniqueAbilityCodes(rows: MonthPlanPhraseSelectionForm): string[] {
  return Array.from(
    new Set(
      rows.abilitySummary
        .map((x) => s(x.abilityCode))
        .filter((x) => x.length > 0),
    ),
  );
}

export default function PlanV2WorkspacePanel(props: { owner: string }) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedTenantId, setSelectedTenantId] = useState("demo-tenant");
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [navPath, setNavPath] = useState<TreeNode[]>([]);

  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [schoolAnnualPlans, setSchoolAnnualPlans] = useState<
    SchoolAnnualPlanRecord[]
  >([]);
  const [ageTargets, setAgeTargets] = useState<SchoolAnnualAgeTargetRecord[]>(
    [],
  );
  const [classAnnualPlans, setClassAnnualPlans] = useState<
    ClassAnnualPlanRecord[]
  >([]);
  const [quarterPlans, setQuarterPlans] = useState<ClassQuarterPlanRecord[]>(
    [],
  );
  const [quarterEvents, setQuarterEvents] = useState<QuarterEventRecord[]>([]);
  const [monthPlans, setMonthPlans] = useState<ClassMonthPlanRecord[]>([]);
  const [monthEvents, setMonthEvents] = useState<MonthEventRecord[]>([]);
  const [planPhrases, setPlanPhrases] = useState<PlanPhraseRecord[]>([]);
  const [planPhraseAbilityLinks, setPlanPhraseAbilityLinks] = useState<
    PlanPhraseAbilityLinkRecord[]
  >([]);
  const [monthPhraseSelections, setMonthPhraseSelections] = useState<
    ClassMonthPlanPhraseSelectionRecord[]
  >([]);

  const refreshAll = useCallback(
    async (tenantIdArg?: string, fiscalYearArg?: number) => {
      const fy = fiscalYearArg ?? fiscalYear;

      setLoading(true);
      setError("");

      try {
        const tenantRes = await client.models.Tenant.list({ limit: 1000 });
        throwIfModelErrors(tenantRes);

        const nextTenants = [...(tenantRes.data ?? [])].sort((a, b) =>
          byText(a.tenantId, b.tenantId),
        );
        setTenants(nextTenants);

        let tenantId = tenantIdArg ?? selectedTenantId;
        if (!tenantId) {
          tenantId = nextTenants[0]?.tenantId ?? "";
        }
        setSelectedTenantId(tenantId);

        if (!tenantId) {
          setClassrooms([]);
          setSchoolAnnualPlans([]);
          setAgeTargets([]);
          setClassAnnualPlans([]);
          setQuarterPlans([]);
          setQuarterEvents([]);
          setMonthPlans([]);
          setMonthEvents([]);
          setPlanPhrases([]);
          setPlanPhraseAbilityLinks([]);
          setMonthPhraseSelections([]);
          return;
        }

        const [
          classroomRes,
          schoolAnnualPlanRes,
          ageTargetRes,
          classAnnualPlanRes,
          quarterPlanRes,
          quarterEventRes,
          monthPlanRes,
          monthEventRes,
          planPhraseRes,
          planPhraseAbilityLinkRes,
          monthPhraseSelectionRes,
        ] = await Promise.all([
          client.models.Classroom.list({
            filter: { tenantId: { eq: tenantId } },
            limit: 1000,
          }),
          client.models.SchoolAnnualPlan.list({
            filter: {
              tenantId: { eq: tenantId },
              fiscalYear: { eq: fy },
            },
            limit: 100,
          }),
          client.models.SchoolAnnualAgeTarget.list({
            filter: {
              tenantId: { eq: tenantId },
              fiscalYear: { eq: fy },
            },
            limit: 100,
          }),
          client.models.ClassAnnualPlan.list({
            filter: {
              tenantId: { eq: tenantId },
              fiscalYear: { eq: fy },
            },
            limit: 2000,
          }),
          client.models.ClassQuarterPlan.list({
            filter: {
              tenantId: { eq: tenantId },
              fiscalYear: { eq: fy },
            },
            limit: 5000,
          }),
          client.models.QuarterEvent.list({
            limit: 10000,
          }),
          client.models.ClassMonthPlan.list({
            filter: {
              tenantId: { eq: tenantId },
              fiscalYear: { eq: fy },
            },
            limit: 10000,
          }),
          client.models.MonthEvent.list({
            limit: 20000,
          }),
          client.models.PlanPhrase.list({
            filter: {
              planPeriodType: { eq: "MONTH" },
              status: { eq: "active" },
            },
            limit: 10000,
          }),
          client.models.PlanPhraseAbilityLink.list({
            filter: {
              planPeriodType: { eq: "MONTH" },
              status: { eq: "active" },
            },
            limit: 20000,
          }),
          client.models.ClassMonthPlanPhraseSelection.list({
            filter: {
              tenantId: { eq: tenantId },
              fiscalYear: { eq: fy },
            },
            limit: 20000,
          }),
        ]);

        throwIfModelErrors(classroomRes);
        throwIfModelErrors(schoolAnnualPlanRes);
        throwIfModelErrors(ageTargetRes);
        throwIfModelErrors(classAnnualPlanRes);
        throwIfModelErrors(quarterPlanRes);
        throwIfModelErrors(quarterEventRes);
        throwIfModelErrors(monthPlanRes);
        throwIfModelErrors(monthEventRes);
        throwIfModelErrors(planPhraseRes);
        throwIfModelErrors(planPhraseAbilityLinkRes);
        throwIfModelErrors(monthPhraseSelectionRes);

        const nextQuarterPlans = [...(quarterPlanRes.data ?? [])];
        const quarterIds = new Set(nextQuarterPlans.map((x) => x.id));

        const nextMonthPlans = [...(monthPlanRes.data ?? [])];
        const monthIds = new Set(nextMonthPlans.map((x) => x.id));

        setClassrooms(
          [...(classroomRes.data ?? [])].sort((a, b) => {
            const age = byText(a.ageBand, b.ageBand);
            if (age !== 0) return age;
            return byText(a.name, b.name);
          }),
        );
        setSchoolAnnualPlans([...(schoolAnnualPlanRes.data ?? [])]);
        setAgeTargets([...(ageTargetRes.data ?? [])]);
        setClassAnnualPlans([...(classAnnualPlanRes.data ?? [])]);
        setQuarterPlans(nextQuarterPlans);
        setQuarterEvents(
          [...(quarterEventRes.data ?? [])].filter((x) =>
            quarterIds.has(x.classQuarterPlanId),
          ),
        );
        setMonthPlans(nextMonthPlans);
        setMonthEvents(
          [...(monthEventRes.data ?? [])].filter((x) =>
            monthIds.has(x.classMonthPlanId),
          ),
        );
        setPlanPhrases(
          [...(planPhraseRes.data ?? [])].sort((a, b) => {
            const age = Number(a.ageYears ?? 0) - Number(b.ageYears ?? 0);
            if (age !== 0) return age;
            const domain = byText(a.domainCode, b.domainCode);
            if (domain !== 0) return domain;
            return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0);
          }),
        );
        setPlanPhraseAbilityLinks(
          [...(planPhraseAbilityLinkRes.data ?? [])].sort(
            (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
          ),
        );
        setMonthPhraseSelections(
          [...(monthPhraseSelectionRes.data ?? [])]
            .filter((x) => monthIds.has(x.classMonthPlanId))
            .sort(
              (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
            ),
        );
      } catch (e) {
        console.error(e);
        setError(getUnknownErrorMessage(e, "読み込みに失敗しました。"));
      } finally {
        setLoading(false);
      }
    },
    [client, fiscalYear, selectedTenantId],
  );

  useEffect(() => {
    void refreshAll(selectedTenantId, fiscalYear);
  }, [refreshAll, selectedTenantId, fiscalYear]);

  useEffect(() => {
    if (!selectedTenantId) return;
    if (navPath.length === 0) {
      setNavPath([{ kind: "tenant", tenantId: selectedTenantId }]);
    }
  }, [selectedTenantId, navPath.length]);

  const tenant = tenants.find((t) => t.tenantId === selectedTenantId) ?? null;
  const schoolAnnualPlan = schoolAnnualPlans[0] ?? null;

  const selectedNode: TreeNode | null =
    navPath.length > 0
      ? navPath[navPath.length - 1]
      : selectedTenantId
        ? { kind: "tenant", tenantId: selectedTenantId }
        : null;

  const selectedSchoolAnnualPlan =
    selectedNode?.kind === "schoolAnnualPlan"
      ? (schoolAnnualPlans.find((x) => x.id === selectedNode.id) ?? null)
      : null;

  const selectedAgeTarget =
    selectedNode?.kind === "ageTarget"
      ? (ageTargets.find((x) => x.id === selectedNode.id) ?? null)
      : null;

  const selectedClassroom =
    selectedNode?.kind === "classroom"
      ? (classrooms.find((x) => x.id === selectedNode.id) ?? null)
      : null;

  const selectedClassAnnualPlan =
    selectedNode?.kind === "classAnnualPlan"
      ? (classAnnualPlans.find((x) => x.id === selectedNode.id) ?? null)
      : null;

  const selectedQuarterPlan =
    selectedNode?.kind === "quarter"
      ? (quarterPlans.find((x) => x.id === selectedNode.id) ?? null)
      : null;

  const selectedMonthPlan =
    selectedNode?.kind === "month"
      ? (monthPlans.find((x) => x.id === selectedNode.id) ?? null)
      : null;

  const classAnnualPlanForSelectedClassroom = useMemo(() => {
    if (!selectedClassroom) return null;
    return (
      classAnnualPlans.find((x) => x.classroomId === selectedClassroom.id) ??
      null
    );
  }, [classAnnualPlans, selectedClassroom]);

  const quarterChildren = useMemo(() => {
    if (!selectedClassAnnualPlan) return [];
    return quarterPlans
      .filter((x) => x.classAnnualPlanId === selectedClassAnnualPlan.id)
      .sort((a, b) => Number(a.termNo ?? 0) - Number(b.termNo ?? 0));
  }, [quarterPlans, selectedClassAnnualPlan]);

  const quarterChildrenForClassroom = useMemo(() => {
    if (!classAnnualPlanForSelectedClassroom) return [];
    return quarterPlans
      .filter(
        (x) => x.classAnnualPlanId === classAnnualPlanForSelectedClassroom.id,
      )
      .sort((a, b) => Number(a.termNo ?? 0) - Number(b.termNo ?? 0));
  }, [quarterPlans, classAnnualPlanForSelectedClassroom]);

  const monthChildren = useMemo(() => {
    if (!selectedQuarterPlan) return [];
    return monthPlans
      .filter((x) => x.classQuarterPlanId === selectedQuarterPlan.id)
      .sort((a, b) => byText(a.monthKey, b.monthKey));
  }, [monthPlans, selectedQuarterPlan]);

  const selectedQuarterEvents = useMemo(() => {
    if (!selectedQuarterPlan) return [];
    return quarterEvents
      .filter((x) => x.classQuarterPlanId === selectedQuarterPlan.id)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  }, [quarterEvents, selectedQuarterPlan]);

  const tenantForSidebar = tenant ?? undefined;
  const schoolAnnualPlanForSidebar = schoolAnnualPlan ?? undefined;

  const tenantForEditor = tenant ?? undefined;
  const selectedNodeForEditor = selectedNode;
  const selectedSchoolAnnualPlanForEditor =
    selectedSchoolAnnualPlan ?? undefined;
  const selectedAgeTargetForEditor = selectedAgeTarget ?? undefined;
  const selectedClassroomForEditor = selectedClassroom ?? undefined;
  const selectedClassAnnualPlanForEditor = selectedClassAnnualPlan ?? undefined;
  const classAnnualPlanForClassroomForEditor =
    classAnnualPlanForSelectedClassroom ?? undefined;
  const selectedQuarterPlanForEditor = selectedQuarterPlan ?? undefined;
  const selectedMonthPlanForEditor = selectedMonthPlan ?? undefined;

  async function replaceQuarterEvents(
    classQuarterPlanId: string,
    eventSummary: string,
  ) {
    const existing = quarterEvents.filter(
      (x) => x.classQuarterPlanId === classQuarterPlanId,
    );

    for (const row of existing) {
      const deleted = await client.models.QuarterEvent.delete({ id: row.id });
      throwIfModelErrors(deleted);
    }

    const labels = parseEventSummary(eventSummary);

    for (let i = 0; i < labels.length; i += 1) {
      const created = await client.models.QuarterEvent.create({
        classQuarterPlanId,
        label: labels[i],
        sortOrder: i + 1,
      });
      throwIfModelErrors(created);
    }
  }

  async function replaceMonthEvents(
    classMonthPlanId: string,
    eventSummary: string,
  ) {
    const existing = monthEvents.filter(
      (x) => x.classMonthPlanId === classMonthPlanId,
    );

    for (const row of existing) {
      const deleted = await client.models.MonthEvent.delete({ id: row.id });
      throwIfModelErrors(deleted);
    }

    const labels = parseEventSummary(eventSummary);

    for (let i = 0; i < labels.length; i += 1) {
      const created = await client.models.MonthEvent.create({
        classMonthPlanId,
        label: labels[i],
        sortOrder: i + 1,
      });
      throwIfModelErrors(created);
    }
  }

  async function replaceMonthPhraseSelections(
    monthPlan: ClassMonthPlanRecord,
    phraseSelections: MonthPlanPhraseSelectionForm[],
  ) {
    const existing = monthPhraseSelections.filter(
      (x) => x.classMonthPlanId === monthPlan.id,
    );

    for (const row of existing) {
      const deleted = await client.models.ClassMonthPlanPhraseSelection.delete({
        id: row.id,
      });
      throwIfModelErrors(deleted);
    }

    const activeSelections = phraseSelections.filter(
      (x) => x.status !== "ARCHIVED" && s(x.planPhraseId) !== "",
    );

    for (let i = 0; i < activeSelections.length; i += 1) {
      const row = activeSelections[i];
      const abilitySummary = row.abilitySummary ?? [];
      const totals = summarizeAbilityWeightsByDomain(abilitySummary);

      const created = await client.models.ClassMonthPlanPhraseSelection.create({
        tenantId: selectedTenantId,
        classMonthPlanId: monthPlan.id,
        classQuarterPlanId: monthPlan.classQuarterPlanId,
        fiscalYear: monthPlan.fiscalYear,
        monthKey: monthPlan.monthKey,
        planPhraseId: row.planPhraseId,
        phraseTextSnapshot: row.phraseTextSnapshot,
        selectedDomainCode: row.selectedDomainCode || null,
        selectedDomain: row.selectedDomain || null,
        ageYears: toIntOrNull(row.ageYears),
        abilityCodes: uniqueAbilityCodes(row),
        abilitySummaryJson: stringifyAbilitySummary(abilitySummary),
        scoreHealth: totals.health,
        scoreHumanRelations: totals.humanRelations,
        scoreEnvironment: totals.environment,
        scoreLanguage: totals.language,
        scoreExpression: totals.expression,
        status: "ACTIVE",
        sortOrder: i + 1,
        selectedAt: row.selectedAt || new Date().toISOString(),
      });
      throwIfModelErrors(created);
    }
  }

  async function prepareDemoTenant() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const tenantId = "demo-tenant";
      const schoolName = "テスト保育園";

      const tenantList = await client.models.Tenant.list({
        filter: { tenantId: { eq: tenantId } },
        limit: 10,
      });
      throwIfModelErrors(tenantList);

      const tenantExists = (tenantList.data ?? []).some(
        (t) => s(t.tenantId) === tenantId,
      );

      if (!tenantExists) {
        const created = await client.models.Tenant.create({
          tenantId,
          name: schoolName,
          legalName: schoolName,
          status: "active",
          note: "PLAN v2 確認用",
        });
        throwIfModelErrors(created);
      }

      const classroomList = await client.models.Classroom.list({
        filter: { tenantId: { eq: tenantId } },
        limit: 1000,
      });
      throwIfModelErrors(classroomList);

      const existing = classroomList.data ?? [];
      const exists = (name: string) =>
        existing.some((c) => s(c.name) === name && s(c.tenantId) === tenantId);

      const defs = [
        { name: "あさがお組", ageBand: "3歳" },
        { name: "ひまわり組", ageBand: "4歳" },
        { name: "すみれ組", ageBand: "4歳" },
        { name: "さくら組", ageBand: "5歳" },
      ];

      let createdCount = 0;

      for (const row of defs) {
        if (exists(row.name)) continue;

        const created = await client.models.Classroom.create({
          tenantId,
          name: row.name,
          ageBand: row.ageBand,
          schoolName,
          status: "active",
        });
        throwIfModelErrors(created);
        createdCount += 1;
      }

      setSelectedTenantId(tenantId);
      setNavPath([{ kind: "tenant", tenantId }]);
      await refreshAll(tenantId, fiscalYear);
      setMessage(
        `デモ保育園を準備しました。tenant=${tenantId} / 新規クラス=${createdCount}件`,
      );
    } catch (e) {
      console.error(e);
      setError(getUnknownErrorMessage(e, "デモ保育園の準備に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  async function ensureTemplateV2() {
    if (!selectedTenantId) {
      setMessage("tenant を選択してください。");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await client.mutations.ensureFiscalYearTemplateV2({
        tenantId: selectedTenantId,
        fiscalYear,
      });
      throwIfModelErrors(result);

      await refreshAll(selectedTenantId, fiscalYear);
      setNavPath([{ kind: "tenant", tenantId: selectedTenantId }]);

      setMessage(
        `V2 年度テンプレートを準備しました。年齢別=${result.data?.createdAgeTargetCount ?? 0}件 / クラス年計画=${result.data?.createdClassAnnualPlanCount ?? 0}件 / 期=${result.data?.createdQuarterPlanCount ?? 0}件 / 月=${result.data?.createdMonthPlanCount ?? 0}件`,
      );
    } catch (e) {
      console.error(e);
      setError(
        getUnknownErrorMessage(e, "V2 年度テンプレート生成に失敗しました。"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSchoolAnnualPlan(form: SchoolAnnualPlanForm) {
    if (!selectedSchoolAnnualPlan?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updated = await client.models.SchoolAnnualPlan.update({
        id: selectedSchoolAnnualPlan.id,
        title: form.title,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
        schoolPolicy: form.schoolPolicy || null,
        status: toPlanStatus(form.status),
      });
      throwIfModelErrors(updated);

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("保育所年計画を保存しました。");
    } catch (e) {
      console.error(e);
      setError(getUnknownErrorMessage(e, "保育所年計画の保存に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  async function saveSchoolAnnualBundle(
    form: SchoolAnnualPlanForm,
    ageRows: Array<{ id: string; form: AbilityForm }>,
  ) {
    if (!selectedSchoolAnnualPlan?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updatedPlan = await client.models.SchoolAnnualPlan.update({
        id: selectedSchoolAnnualPlan.id,
        title: form.title,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
        schoolPolicy: form.schoolPolicy || null,
        status: toPlanStatus(form.status),
      });
      throwIfModelErrors(updatedPlan);

      for (const row of ageRows) {
        const updatedAge = await client.models.SchoolAnnualAgeTarget.update({
          id: row.id,
          tenantId: selectedTenantId,
          fiscalYear,
          ageBand: row.form.ageBand,
          goalTextA: row.form.goalText || null,
          abilityHealthA: toIntOrNull(row.form.abilityHealth),
          abilityHumanRelationsA: toIntOrNull(row.form.abilityHumanRelations),
          abilityEnvironmentA: toIntOrNull(row.form.abilityEnvironment),
          abilityLanguageA: toIntOrNull(row.form.abilityLanguage),
          abilityExpressionA: toIntOrNull(row.form.abilityExpression),
        });
        throwIfModelErrors(updatedAge);
      }

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("保育所の年計画を保存しました。");
    } catch (e) {
      console.error(e);
      setError(
        getUnknownErrorMessage(e, "保育所の年計画の保存に失敗しました。"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveAgeTarget(form: AbilityForm) {
    if (!selectedAgeTarget?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updated = await client.models.SchoolAnnualAgeTarget.update({
        id: selectedAgeTarget.id,
        tenantId: selectedTenantId,
        fiscalYear,
        ageBand: form.ageBand,
        goalTextA: form.goalText || null,
        abilityHealthA: toIntOrNull(form.abilityHealth),
        abilityHumanRelationsA: toIntOrNull(form.abilityHumanRelations),
        abilityEnvironmentA: toIntOrNull(form.abilityEnvironment),
        abilityLanguageA: toIntOrNull(form.abilityLanguage),
        abilityExpressionA: toIntOrNull(form.abilityExpression),
      });
      throwIfModelErrors(updated);

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("年齢別年間方針を保存しました。");
    } catch (e) {
      console.error(e);
      setError(
        getUnknownErrorMessage(e, "年齢別年間方針の保存に失敗しました。"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveClassroom(form: ClassroomForm) {
    if (!selectedClassroom?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updated = await client.models.Classroom.update({
        id: selectedClassroom.id,
        name: form.name,
        ageBand: form.ageBand,
        schoolName: form.schoolName || null,
        status: toClassroomStatus(form.status),
      });
      throwIfModelErrors(updated);

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("クラスを保存しました。");
    } catch (e) {
      console.error(e);
      setError(getUnknownErrorMessage(e, "クラスの保存に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  async function saveClassAnnualPlan(form: ClassAnnualPlanForm) {
    if (!selectedClassAnnualPlan?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updated = await client.models.ClassAnnualPlan.update({
        id: selectedClassAnnualPlan.id,
        tenantId: selectedTenantId,
        fiscalYear,
        title: form.title,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
        ageBand: form.ageBand,
        goalTextA: form.goalText || null,
        abilityHealthA: toIntOrNull(form.abilityHealth),
        abilityHumanRelationsA: toIntOrNull(form.abilityHumanRelations),
        abilityEnvironmentA: toIntOrNull(form.abilityEnvironment),
        abilityLanguageA: toIntOrNull(form.abilityLanguage),
        abilityExpressionA: toIntOrNull(form.abilityExpression),
        draftText: null,
        aiSuggestedText: null,
        finalText: null,
        status: toPlanStatus(form.status),
      });
      throwIfModelErrors(updated);

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("クラス年計画を保存しました。");
    } catch (e) {
      console.error(e);
      setError(getUnknownErrorMessage(e, "クラス年計画の保存に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  async function saveClassAnnualBundle(
    annualForm: ClassAnnualPlanForm,
    quarterRows: Array<{ id: string; form: QuarterPlanForm }>,
  ) {
    if (!classAnnualPlanForSelectedClassroom?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updatedAnnual = await client.models.ClassAnnualPlan.update({
        id: classAnnualPlanForSelectedClassroom.id,
        tenantId: selectedTenantId,
        fiscalYear,
        title: annualForm.title,
        periodStart: annualForm.periodStart || null,
        periodEnd: annualForm.periodEnd || null,
        ageBand: annualForm.ageBand,
        goalTextA: annualForm.goalText || null,
        abilityHealthA: toIntOrNull(annualForm.abilityHealth),
        abilityHumanRelationsA: toIntOrNull(annualForm.abilityHumanRelations),
        abilityEnvironmentA: toIntOrNull(annualForm.abilityEnvironment),
        abilityLanguageA: toIntOrNull(annualForm.abilityLanguage),
        abilityExpressionA: toIntOrNull(annualForm.abilityExpression),
        draftText: null,
        aiSuggestedText: null,
        finalText: null,
        status: toPlanStatus(annualForm.status),
      });
      throwIfModelErrors(updatedAnnual);

      for (const row of quarterRows) {
        const updatedQuarter = await client.models.ClassQuarterPlan.update({
          id: row.id,
          title: row.form.title,
          periodStart: row.form.periodStart || null,
          periodEnd: row.form.periodEnd || null,
          ageBand: row.form.ageBand,
          goalTextB: row.form.goalText || null,
          abilityHealthB: toIntOrNull(row.form.abilityHealth),
          abilityHumanRelationsB: toIntOrNull(row.form.abilityHumanRelations),
          abilityEnvironmentB: toIntOrNull(row.form.abilityEnvironment),
          abilityLanguageB: toIntOrNull(row.form.abilityLanguage),
          abilityExpressionB: toIntOrNull(row.form.abilityExpression),
          draftText: null,
          aiSuggestedText: null,
          finalText: null,
          status: toPlanStatus(row.form.status),
        });
        throwIfModelErrors(updatedQuarter);
        await replaceQuarterEvents(row.id, row.form.eventSummary);
      }

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("クラスの年計画を保存しました。");
    } catch (e) {
      console.error(e);
      setError(
        getUnknownErrorMessage(e, "クラスの年計画の保存に失敗しました。"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveQuarterPlan(form: QuarterPlanForm) {
    if (!selectedQuarterPlan?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updated = await client.models.ClassQuarterPlan.update({
        id: selectedQuarterPlan.id,
        title: form.title,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
        ageBand: form.ageBand,
        goalTextB: form.goalText || null,
        abilityHealthB: toIntOrNull(form.abilityHealth),
        abilityHumanRelationsB: toIntOrNull(form.abilityHumanRelations),
        abilityEnvironmentB: toIntOrNull(form.abilityEnvironment),
        abilityLanguageB: toIntOrNull(form.abilityLanguage),
        abilityExpressionB: toIntOrNull(form.abilityExpression),
        draftText: null,
        aiSuggestedText: null,
        finalText: null,
        status: toPlanStatus(form.status),
      });
      throwIfModelErrors(updated);

      await replaceQuarterEvents(selectedQuarterPlan.id, form.eventSummary);

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("期計画を保存しました。");
    } catch (e) {
      console.error(e);
      setError(getUnknownErrorMessage(e, "期計画の保存に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  async function saveQuarterBundle(
    quarterForm: QuarterPlanForm,
    monthRows: Array<{ id: string; form: MonthPlanForm }>,
  ) {
    if (!selectedQuarterPlan?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updatedQuarter = await client.models.ClassQuarterPlan.update({
        id: selectedQuarterPlan.id,
        title: quarterForm.title,
        periodStart: quarterForm.periodStart || null,
        periodEnd: quarterForm.periodEnd || null,
        ageBand: quarterForm.ageBand,
        goalTextB: quarterForm.goalText || null,
        abilityHealthB: toIntOrNull(quarterForm.abilityHealth),
        abilityHumanRelationsB: toIntOrNull(quarterForm.abilityHumanRelations),
        abilityEnvironmentB: toIntOrNull(quarterForm.abilityEnvironment),
        abilityLanguageB: toIntOrNull(quarterForm.abilityLanguage),
        abilityExpressionB: toIntOrNull(quarterForm.abilityExpression),
        draftText: null,
        aiSuggestedText: null,
        finalText: null,
        status: toPlanStatus(quarterForm.status),
      });
      throwIfModelErrors(updatedQuarter);

      await replaceQuarterEvents(
        selectedQuarterPlan.id,
        quarterForm.eventSummary,
      );

      for (const row of monthRows) {
        const monthPlan = monthPlans.find((x) => x.id === row.id) ?? null;

        const updatedMonth = await client.models.ClassMonthPlan.update({
          id: row.id,
          title: row.form.title,
          periodStart: row.form.periodStart || null,
          periodEnd: row.form.periodEnd || null,
          ageBand: row.form.ageBand,
          goalTextC: row.form.goalText || null,
          abilityHealthC: toIntOrNull(row.form.abilityHealth),
          abilityHumanRelationsC: toIntOrNull(row.form.abilityHumanRelations),
          abilityEnvironmentC: toIntOrNull(row.form.abilityEnvironment),
          abilityLanguageC: toIntOrNull(row.form.abilityLanguage),
          abilityExpressionC: toIntOrNull(row.form.abilityExpression),
          draftText: null,
          aiSuggestedText: null,
          finalText: null,
          status: toPlanStatus(row.form.status),
        });
        throwIfModelErrors(updatedMonth);

        await replaceMonthEvents(row.id, row.form.eventSummary);
        if (monthPlan) {
          await replaceMonthPhraseSelections(
            monthPlan,
            row.form.phraseSelections,
          );
        }
      }

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("期計画と月計画を保存しました。");
    } catch (e) {
      console.error(e);
      setError(
        getUnknownErrorMessage(e, "期計画と月計画の保存に失敗しました。"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveMonthPlan(form: MonthPlanForm) {
    if (!selectedMonthPlan?.id) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updated = await client.models.ClassMonthPlan.update({
        id: selectedMonthPlan.id,
        title: form.title,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
        ageBand: form.ageBand,
        goalTextC: form.goalText || null,
        abilityHealthC: toIntOrNull(form.abilityHealth),
        abilityHumanRelationsC: toIntOrNull(form.abilityHumanRelations),
        abilityEnvironmentC: toIntOrNull(form.abilityEnvironment),
        abilityLanguageC: toIntOrNull(form.abilityLanguage),
        abilityExpressionC: toIntOrNull(form.abilityExpression),
        draftText: null,
        aiSuggestedText: null,
        finalText: null,
        status: toPlanStatus(form.status),
      });
      throwIfModelErrors(updated);

      await replaceMonthEvents(selectedMonthPlan.id, form.eventSummary);
      await replaceMonthPhraseSelections(
        selectedMonthPlan,
        form.phraseSelections,
      );

      await refreshAll(selectedTenantId, fiscalYear);
      setMessage("月計画を保存しました。");
    } catch (e) {
      console.error(e);
      setError(getUnknownErrorMessage(e, "月計画の保存に失敗しました。"));
    } finally {
      setLoading(false);
    }
  }

  const editorProps = {
    selectedNode: selectedNodeForEditor,
    tenant: tenantForEditor,
    schoolAnnualPlan: selectedSchoolAnnualPlanForEditor,
    schoolAgeTargets: ageTargets,
    ageTarget: selectedAgeTargetForEditor,
    classroom: selectedClassroomForEditor,
    classAnnualPlan: selectedClassAnnualPlanForEditor,
    classAnnualPlanForClassroom: classAnnualPlanForClassroomForEditor,
    quarterPlan: selectedQuarterPlanForEditor,
    monthPlan: selectedMonthPlanForEditor,
    quarterChildren,
    quarterChildrenForClassroom,
    monthChildren,
    quarterEvents,
    selectedQuarterEvents,
    monthEvents,
    planPhrases,
    planPhraseAbilityLinks,
    monthPhraseSelections,
    classroomCount: classrooms.length,
    ageTargetCount: ageTargets.length,
    classAnnualPlanCount: classAnnualPlans.length,
    onSaveSchoolAnnualPlan: saveSchoolAnnualPlan,
    onSaveSchoolAnnualBundle: saveSchoolAnnualBundle,
    onSaveAgeTarget: saveAgeTarget,
    onSaveClassroom: saveClassroom,
    onSaveClassAnnualPlan: saveClassAnnualPlan,
    onSaveClassAnnualBundle: saveClassAnnualBundle,
    onSaveQuarterPlan: saveQuarterPlan,
    onSaveQuarterBundle: saveQuarterBundle,
    onSaveMonthPlan: saveMonthPlan,
  };

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
        <strong>PLAN v2 Workspace</strong>
        <span style={{ color: "#666" }}>owner: {owner}</span>

        <button onClick={() => void prepareDemoTenant()} disabled={loading}>
          デモ保育園を準備
        </button>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          tenant
          <select
            value={selectedTenantId}
            onChange={(e) => {
              const next = e.target.value;
              setSelectedTenantId(next);
              setNavPath(next ? [{ kind: "tenant", tenantId: next }] : []);
            }}
          >
            {tenants.map((t) => (
              <option key={t.tenantId} value={t.tenantId}>
                {t.tenantId} / {t.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
          onClick={() => void ensureTemplateV2()}
          disabled={loading || !selectedTenantId}
        >
          V2 年度テンプレート生成
        </button>

        <button
          onClick={() => void refreshAll(selectedTenantId, fiscalYear)}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: 10,
            background: "#f4fbf4",
            border: "1px solid #cde8cd",
            borderRadius: 6,
            color: "#1d5e20",
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 10,
            background: "#fff5f5",
            border: "1px solid #f1c4c4",
            borderRadius: 6,
            color: "crimson",
            whiteSpace: "pre-wrap",
          }}
        >
          Error: {error}
        </div>
      )}

      {loading && <div>Loading...</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 12,
          alignItems: "start",
        }}
      >
        {tenantForSidebar ? (
          <PlanV2Sidebar
            tenant={tenantForSidebar}
            fiscalYear={fiscalYear}
            navPath={navPath}
            schoolAnnualPlan={schoolAnnualPlanForSidebar}
            ageTargets={ageTargets}
            classrooms={classrooms}
            classAnnualPlans={classAnnualPlans}
            quarterPlans={quarterPlans}
            monthPlans={monthPlans}
            onNavigate={(nextPath: TreeNode[]) => setNavPath(nextPath)}
          />
        ) : (
          <div
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 6,
              background: "#fafafa",
            }}
          >
            tenant 読み込み中...
          </div>
        )}

        {tenantForEditor && selectedNodeForEditor ? (
          <PlanV2Editor {...editorProps} />
        ) : (
          <div
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 6,
              background: "#fafafa",
            }}
          >
            表示対象を読み込み中...
          </div>
        )}
      </div>
    </div>
  );
}
