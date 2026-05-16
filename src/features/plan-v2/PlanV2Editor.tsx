"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  PLAN_DOMAINS,
  abilityLinksToSummary,
  describeDomainTrend,
  getDomainRelationLabel,
  getDomainRelationLevel,
  getPlanDomainLabel,
  getTermNoFromPlanPhraseId,
  makePhraseSelectionClientKey,
  nodeKey,
  parseAgeYears,
  recalculateMonthPlanFromSelections,
  recalculateReferencePlanFromSelections,
  s,
  summarizeSelectionsByDomain,
  toAbilityFormA,
  toClassAnnualPlanForm,
  toClassroomForm,
  toMonthPlanForm,
  toQuarterPlanForm,
  toSchoolAnnualPlanForm,
  type AbilityForm,
  type ClassAnnualPlanForm,
  type ClassAnnualPlanRecord,
  type ClassMonthPlanPhraseSelectionRecord,
  type ClassMonthPlanRecord,
  type ClassPlanPhraseSelectionRecord,
  type ClassQuarterPlanRecord,
  type ClassroomForm,
  type ClassroomRecord,
  type MonthEventRecord,
  type MonthPlanForm,
  type MonthPlanPhraseSelectionForm,
  type PlanDomainKey,
  type PlanPhraseAbilityLinkRecord,
  type PlanPhraseAbilitySummary,
  type PlanPhraseRecord,
  type PlanPhraseSelectionForm,
  type PlanScopeType,
  type QuarterEventRecord,
  type QuarterPlanForm,
  type SchoolAnnualAgeTargetRecord,
  type SchoolAnnualPlanForm,
  type SchoolAnnualPlanRecord,
  type TenantRecord,
  type TreeNode,
} from "./types";

type Props = {
  selectedNode: TreeNode | null;
  tenant?: TenantRecord | null;
  schoolAnnualPlan?: SchoolAnnualPlanRecord | null;
  schoolAgeTargets: SchoolAnnualAgeTargetRecord[];
  ageTarget?: SchoolAnnualAgeTargetRecord | null;
  classroom?: ClassroomRecord | null;
  classAnnualPlan?: ClassAnnualPlanRecord | null;
  classAnnualPlanForClassroom?: ClassAnnualPlanRecord | null;
  quarterPlan?: ClassQuarterPlanRecord | null;
  monthPlan?: ClassMonthPlanRecord | null;

  quarterChildren: ClassQuarterPlanRecord[];
  quarterChildrenForClassroom: ClassQuarterPlanRecord[];
  monthChildren: ClassMonthPlanRecord[];
  quarterEvents: QuarterEventRecord[];
  selectedQuarterEvents: QuarterEventRecord[];
  monthEvents: MonthEventRecord[];
  planPhrases: PlanPhraseRecord[];
  planPhraseAbilityLinks: PlanPhraseAbilityLinkRecord[];
  monthPhraseSelections: ClassMonthPlanPhraseSelectionRecord[];
  planPhraseSelections: ClassPlanPhraseSelectionRecord[];

  classroomCount: number;
  ageTargetCount: number;
  classAnnualPlanCount: number;

  onSaveSchoolAnnualPlan: (form: SchoolAnnualPlanForm) => Promise<void>;
  onSaveSchoolAnnualBundle: (
    planForm: SchoolAnnualPlanForm,
    ageRows: Array<{ id: string; form: AbilityForm }>,
  ) => Promise<void>;
  onSaveAgeTarget: (form: AbilityForm) => Promise<void>;
  onSaveClassroom: (form: ClassroomForm) => Promise<void>;
  onSaveClassAnnualPlan: (form: ClassAnnualPlanForm) => Promise<void>;
  onSaveClassAnnualBundle: (
    annualForm: ClassAnnualPlanForm,
    quarterRows: Array<{ id: string; form: QuarterPlanForm }>,
  ) => Promise<void>;
  onSaveQuarterPlan: (form: QuarterPlanForm) => Promise<void>;
  onSaveQuarterBundle: (
    quarterForm: QuarterPlanForm,
    monthRows: Array<{ id: string; form: MonthPlanForm }>,
  ) => Promise<void>;
  onSaveMonthPlan: (form: MonthPlanForm) => Promise<void>;
};

type AnnualLikeForm =
  | AbilityForm
  | ClassAnnualPlanForm
  | QuarterPlanForm
  | MonthPlanForm;

type DomainDef = (typeof PLAN_DOMAINS)[number];

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
};

const subtleBoxStyle: CSSProperties = {
  padding: 10,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fafafa",
};

const thStyle: CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  verticalAlign: "top",
};

const tdStyle: CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "top",
};

const smallMutedStyle: CSSProperties = {
  fontSize: 12,
  color: "#666",
};

function textOr(value: string | null | undefined, fallback = ""): string {
  return value ?? fallback;
}

function sortBySortOrderThenId<T extends { sortOrder?: number | null }>(
  rows: T[],
  getId: (row: T) => string,
): T[] {
  return [...rows].sort((a, b) => {
    const aa = Number(a.sortOrder ?? 999999);
    const bb = Number(b.sortOrder ?? 999999);
    if (aa !== bb) return aa - bb;
    return getId(a).localeCompare(getId(b));
  });
}

function isActiveStatus(value?: string | null): boolean {
  const status = s(value).toUpperCase();
  return (
    status === "" || status === "ACTIVE" || status === "active".toUpperCase()
  );
}

function buildSchoolAgeTargetForms(
  schoolAgeTargets: SchoolAnnualAgeTargetRecord[],
): Array<{ id: string; form: AbilityForm }> {
  return [...schoolAgeTargets]
    .sort((a, b) => {
      const sa = Number(a.sortOrder ?? 9999);
      const sb = Number(b.sortOrder ?? 9999);
      if (sa !== sb) return sa - sb;
      return String(a.ageBand ?? "").localeCompare(String(b.ageBand ?? ""));
    })
    .map((row) => ({
      id: row.id,
      form: toAbilityFormA(row),
    }));
}

function buildQuarterForms(
  quarterRows: ClassQuarterPlanRecord[],
  quarterEvents: QuarterEventRecord[],
  planPhraseSelections: ClassPlanPhraseSelectionRecord[],
): Array<{ id: string; form: QuarterPlanForm }> {
  return [...quarterRows]
    .sort((a, b) => Number(a.termNo ?? 0) - Number(b.termNo ?? 0))
    .map((row) => ({
      id: row.id,
      form: toQuarterPlanForm(
        row,
        quarterEvents.filter((x) => x.classQuarterPlanId === row.id),
        planPhraseSelections.filter((x) => x.classQuarterPlanId === row.id),
      ),
    }));
}

function buildQuarterMonthForms(
  monthChildren: ClassMonthPlanRecord[],
  monthEvents: MonthEventRecord[],
  monthPhraseSelections: ClassMonthPlanPhraseSelectionRecord[],
): Array<{ id: string; form: MonthPlanForm }> {
  return [...monthChildren]
    .sort((a, b) =>
      String(a.monthKey ?? "").localeCompare(String(b.monthKey ?? "")),
    )
    .map((row) => ({
      id: row.id,
      form: toMonthPlanForm(
        row,
        monthEvents.filter((x) => x.classMonthPlanId === row.id),
        monthPhraseSelections.filter((x) => x.classMonthPlanId === row.id),
      ),
    }));
}

function buildMonthForm(
  monthPlan?: ClassMonthPlanRecord | null,
  monthEvents: MonthEventRecord[] = [],
  monthPhraseSelections: ClassMonthPlanPhraseSelectionRecord[] = [],
): MonthPlanForm {
  const selectedMonthEvents = monthPlan
    ? monthEvents.filter((x) => x.classMonthPlanId === monthPlan.id)
    : [];
  const selectedPhraseSelections = monthPlan
    ? monthPhraseSelections.filter((x) => x.classMonthPlanId === monthPlan.id)
    : [];
  return toMonthPlanForm(
    monthPlan,
    selectedMonthEvents,
    selectedPhraseSelections,
  );
}

function getAgeYearsForForm(
  form: { ageBand: string },
  fallbackAgeBand?: string | null,
): number | null {
  return parseAgeYears(form.ageBand) ?? parseAgeYears(fallbackAgeBand);
}

function getPhraseLinks(
  planPhraseId: string,
  planPhraseAbilityLinks: PlanPhraseAbilityLinkRecord[],
): PlanPhraseAbilityLinkRecord[] {
  return planPhraseAbilityLinks.filter(
    (x) => s(x.planPhraseId) === planPhraseId && s(x.status) !== "ARCHIVED",
  );
}

function abilitySummaryLabel(rows: PlanPhraseAbilitySummary[]): string {
  const totals = new Map<
    string,
    { label: string; weight: number; order: number }
  >();

  rows.forEach((row, index) => {
    const abilityName = s(row.abilityName);
    const categoryName = s(row.categoryName);
    const abilityCode = s(row.abilityCode);
    const label = abilityName || categoryName || abilityCode || "Ability未設定";
    const key = abilityCode || label;
    const current = totals.get(key);

    if (current) {
      current.weight += Number(row.weight ?? 0);
      return;
    }

    totals.set(key, {
      label,
      weight: Number(row.weight ?? 0),
      order: index,
    });
  });

  return [...totals.values()]
    .filter((row) => row.weight !== 0)
    .sort((a, b) => a.order - b.order)
    .map((row) => `${row.label}+${row.weight}`)
    .join(" / ");
}

function getMonthCandidates(
  planPhrases: PlanPhraseRecord[],
  domain: DomainDef,
  ageYears: number | null,
): PlanPhraseRecord[] {
  return sortBySortOrderThenId(
    planPhrases.filter((x) => {
      if (!isActiveStatus(x.status)) return false;
      if (s(x.planPeriodType).toUpperCase() !== "MONTH") return false;
      if (getPlanDomainLabel(x.domain) !== domain.label) return false;
      if (ageYears !== null && Number(x.ageYears ?? -1) !== ageYears) {
        return false;
      }
      return true;
    }),
    (row) => s(row.planPhraseId),
  );
}

function getReferenceCandidates(args: {
  planPhrases: PlanPhraseRecord[];
  planScopeType: Exclude<PlanScopeType, "MONTH">;
  ageYears: number | null;
  termNo?: number | null;
}): PlanPhraseRecord[] {
  const { planPhrases, planScopeType, ageYears, termNo } = args;

  return sortBySortOrderThenId(
    planPhrases.filter((x) => {
      if (!isActiveStatus(x.status)) return false;
      if (s(x.planPeriodType).toUpperCase() !== planScopeType) return false;
      if (ageYears !== null && Number(x.ageYears ?? -1) !== ageYears) {
        return false;
      }
      if (planScopeType === "TERM" && termNo !== null && termNo !== undefined) {
        return getTermNoFromPlanPhraseId(x.planPhraseId) === termNo;
      }
      return true;
    }),
    (row) => s(row.planPhraseId),
  );
}

function buildMonthSelectionFromPhrase(
  phrase: PlanPhraseRecord,
  links: PlanPhraseAbilityLinkRecord[],
  domain: DomainDef,
  ageYears: number | null,
  sortOrder: number,
): MonthPlanPhraseSelectionForm {
  return {
    clientKey: makePhraseSelectionClientKey(s(phrase.planPhraseId), sortOrder),
    planPhraseId: s(phrase.planPhraseId),
    phraseTextSnapshot: s(phrase.phraseText),
    selectedDomainCode: domain.code,
    selectedDomain: domain.label,
    ageYears: ageYears === null ? "" : String(ageYears),
    abilitySummary: abilityLinksToSummary(links),
    status: "ACTIVE",
    sortOrder,
    selectedAt: new Date().toISOString(),
  };
}

function addPhraseToMonthForm(
  form: MonthPlanForm,
  phrase: PlanPhraseRecord,
  links: PlanPhraseAbilityLinkRecord[],
  domain: DomainDef,
  ageYears: number | null,
): MonthPlanForm {
  const activeSelections = form.phraseSelections.filter(
    (x) => x.status !== "ARCHIVED",
  );

  if (activeSelections.some((x) => x.planPhraseId === s(phrase.planPhraseId))) {
    return form;
  }

  const selection = buildMonthSelectionFromPhrase(
    phrase,
    links,
    domain,
    ageYears,
    activeSelections.length + 1,
  );

  return recalculateMonthPlanFromSelections({
    ...form,
    phraseSelections: [...activeSelections, selection],
  });
}

function removePhraseFromMonthForm(
  form: MonthPlanForm,
  clientKey: string,
): MonthPlanForm {
  return recalculateMonthPlanFromSelections({
    ...form,
    phraseSelections: form.phraseSelections.filter(
      (x) => x.clientKey !== clientKey,
    ),
  });
}

function buildReferenceSelectionFromPhrase(args: {
  phrase: PlanPhraseRecord;
  links: PlanPhraseAbilityLinkRecord[];
  planScopeType: Exclude<PlanScopeType, "MONTH">;
  ageYears: number | null;
  termNo?: number | null;
  sortOrder: number;
}): PlanPhraseSelectionForm {
  const { phrase, links, planScopeType, ageYears, termNo, sortOrder } = args;
  const phraseNo = Number(phrase.phraseNo ?? NaN);

  return {
    clientKey: makePhraseSelectionClientKey(s(phrase.planPhraseId), sortOrder),
    planScopeType,
    relationUse: "REFERENCE",
    termNo: planScopeType === "TERM" ? (termNo ?? undefined) : undefined,
    planPhraseId: s(phrase.planPhraseId),
    phraseTextSnapshot: s(phrase.phraseText),
    selectedDomainCode: s(phrase.domainCode) || "0",
    selectedDomain: s(phrase.domain) || "総合",
    ageYears: ageYears === null ? "" : String(ageYears),
    phraseNo: Number.isFinite(phraseNo) ? phraseNo : undefined,
    abilitySummary: abilityLinksToSummary(links),
    status: "ACTIVE",
    sortOrder,
    selectedAt: new Date().toISOString(),
  };
}

function addPhraseToReferenceForm<
  T extends ClassAnnualPlanForm | QuarterPlanForm,
>(
  form: T,
  phrase: PlanPhraseRecord,
  links: PlanPhraseAbilityLinkRecord[],
  planScopeType: Exclude<PlanScopeType, "MONTH">,
  ageYears: number | null,
  termNo?: number | null,
): T {
  const activeSelections = form.phraseSelections.filter(
    (x) => x.status !== "ARCHIVED",
  );

  if (activeSelections.some((x) => x.planPhraseId === s(phrase.planPhraseId))) {
    return form;
  }

  const selection = buildReferenceSelectionFromPhrase({
    phrase,
    links,
    planScopeType,
    ageYears,
    termNo,
    sortOrder: activeSelections.length + 1,
  });

  return recalculateReferencePlanFromSelections({
    ...form,
    phraseSelections: [...activeSelections, selection],
  } as T);
}

function removePhraseFromReferenceForm<
  T extends ClassAnnualPlanForm | QuarterPlanForm,
>(form: T, clientKey: string): T {
  return recalculateReferencePlanFromSelections({
    ...form,
    phraseSelections: form.phraseSelections.filter(
      (x) => x.clientKey !== clientKey,
    ),
  } as T);
}

function PhraseCard(props: {
  phrase: PlanPhraseRecord;
  summary: PlanPhraseAbilitySummary[];
  disabled?: boolean;
  onClick: () => void;
}) {
  const { phrase, summary, disabled = false, onClick } = props;
  const label = abilitySummaryLabel(summary);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "grid",
        gap: 4,
        textAlign: "left",
        padding: 10,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: disabled ? "#f3f4f6" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span style={{ fontWeight: 700 }}>
        {s(phrase.planPhraseId)} / {phrase.phraseType ?? "計画文例"}
      </span>
      <span style={{ whiteSpace: "pre-wrap" }}>{phrase.phraseText}</span>
      <span style={smallMutedStyle}>
        関連する育ち: {label || "Ability Linkなし"}
      </span>
    </button>
  );
}

function DomainTrendPanel(props: {
  title: string;
  selections: PlanPhraseSelectionForm[];
}) {
  const { title, selections } = props;
  const activeSelections = selections.filter((x) => x.status !== "ARCHIVED");
  const totals = summarizeSelectionsByDomain(activeSelections);
  const maxValue = Math.max(
    ...PLAN_DOMAINS.map((domain) => totals[domain.key]),
  );

  return (
    <div style={{ ...subtleBoxStyle, display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={smallMutedStyle}>{describeDomainTrend(totals)}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {PLAN_DOMAINS.map((domain) => {
          const value = totals[domain.key];
          const level = getDomainRelationLevel(value, maxValue);
          const label = getDomainRelationLabel(level);
          const barCount =
            level === "CENTER"
              ? 3
              : level === "RELATED"
                ? 2
                : level === "SUPPORT"
                  ? 1
                  : 0;

          return (
            <div
              key={domain.key}
              style={{
                display: "grid",
                gridTemplateColumns: "88px 80px 1fr",
                gap: 8,
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <span>{domain.label}</span>
              <span>{label}</span>
              <span aria-label={`${domain.label}: ${label}`}>
                {barCount > 0 ? "■".repeat(barCount) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthDomainScorePanel(props: {
  form: MonthPlanForm;
  title?: string;
  compact?: boolean;
}) {
  const { form, title = "5領域(C)", compact = false } = props;

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "repeat(5, minmax(88px, 1fr))",
          gap: 8,
        }}
      >
        {PLAN_DOMAINS.map((domain) => (
          <label key={domain.key} style={{ display: "grid", gap: 3 }}>
            <span style={{ fontSize: 12 }}>{domain.label}</span>
            <input
              type="number"
              value={textOr(form[domain.formField])}
              readOnly
              style={{
                width: "100%",
                background: "#f9fafb",
                color: "#111827",
              }}
            />
          </label>
        ))}
      </div>
      <div style={smallMutedStyle}>
        選択した月のねらいの Ability Link から自動集計した参考値です。
      </div>
    </div>
  );
}

function SelectedReferenceList<
  T extends ClassAnnualPlanForm | QuarterPlanForm,
>(props: { form: T; setForm: Dispatch<SetStateAction<T>> }) {
  const { form, setForm } = props;
  const rows = form.phraseSelections.filter((x) => x.status !== "ARCHIVED");

  if (rows.length === 0) {
    return <div style={smallMutedStyle}>選択済みの計画文例はありません。</div>;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((row, index) => (
        <div
          key={row.clientKey}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            padding: 8,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 700 }}>
              {index + 1}. {row.planPhraseId}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {row.phraseTextSnapshot}
            </div>
            <div style={smallMutedStyle}>
              関連する育ち:{" "}
              {abilitySummaryLabel(row.abilitySummary) || "Ability Linkなし"}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((prev) =>
                removePhraseFromReferenceForm(prev, row.clientKey),
              )
            }
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
}

function ReferencePhraseSelector<
  T extends ClassAnnualPlanForm | QuarterPlanForm,
>(props: {
  title: string;
  planScopeType: Exclude<PlanScopeType, "MONTH">;
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  planPhrases: PlanPhraseRecord[];
  planPhraseAbilityLinks: PlanPhraseAbilityLinkRecord[];
  fallbackAgeBand?: string | null;
  termNo?: number | null;
}) {
  const {
    title,
    planScopeType,
    form,
    setForm,
    planPhrases,
    planPhraseAbilityLinks,
    fallbackAgeBand,
    termNo = null,
  } = props;
  const [open, setOpen] = useState(false);
  const ageYears = getAgeYearsForForm(form, fallbackAgeBand);
  const selectedPhraseIds = new Set(
    form.phraseSelections
      .filter((x) => x.status !== "ARCHIVED")
      .map((x) => x.planPhraseId),
  );

  const candidates = useMemo(
    () =>
      getReferenceCandidates({
        planPhrases,
        planScopeType,
        ageYears,
        termNo,
      }),
    [ageYears, planPhrases, planScopeType, termNo],
  );

  return (
    <div style={{ ...subtleBoxStyle, display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <strong>{title}</strong>
        <span style={smallMutedStyle}>
          対象年齢: {ageYears === null ? "未設定" : `${ageYears}歳`}
          {planScopeType === "TERM" && termNo ? ` / 第${termNo}期` : ""}
        </span>
        <button type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "候補を閉じる" : "候補から選ぶ"}
        </button>
      </div>

      <SelectedReferenceList form={form} setForm={setForm} />
      <DomainTrendPanel
        title={`${title}の関連領域`}
        selections={form.phraseSelections}
      />

      {open ? (
        <div style={{ display: "grid", gap: 8 }}>
          {candidates.length === 0 ? (
            <div style={smallMutedStyle}>
              条件に一致する計画文例がありません。PlanPhraseマスター、対象年齢、期番号を確認してください。
            </div>
          ) : (
            candidates.map((phrase) => {
              const phraseId = s(phrase.planPhraseId);
              const links = getPhraseLinks(phraseId, planPhraseAbilityLinks);
              const summary = abilityLinksToSummary(links);
              const disabled = selectedPhraseIds.has(phraseId);

              return (
                <PhraseCard
                  key={phraseId}
                  phrase={phrase}
                  summary={summary}
                  disabled={disabled}
                  onClick={() =>
                    setForm((prev) =>
                      addPhraseToReferenceForm(
                        prev,
                        phrase,
                        links,
                        planScopeType,
                        ageYears,
                        termNo,
                      ),
                    )
                  }
                />
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function SelectedMonthPhraseList(props: {
  form: MonthPlanForm;
  setForm: Dispatch<SetStateAction<MonthPlanForm>>;
}) {
  const { form, setForm } = props;
  const rows = form.phraseSelections.filter((x) => x.status !== "ARCHIVED");

  if (rows.length === 0) {
    return (
      <div style={smallMutedStyle}>選択済みの月のねらいはありません。</div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((row, index) => (
        <div
          key={row.clientKey}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            padding: 8,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 700 }}>
              {index + 1}. {row.selectedDomain} / {row.planPhraseId}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {row.phraseTextSnapshot}
            </div>
            <div style={smallMutedStyle}>
              影響:{" "}
              {abilitySummaryLabel(row.abilitySummary) || "Ability Linkなし"}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => removePhraseFromMonthForm(prev, row.clientKey))
            }
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
}

function MonthPhraseSelector(props: {
  title?: string;
  form: MonthPlanForm;
  setForm: Dispatch<SetStateAction<MonthPlanForm>>;
  planPhrases: PlanPhraseRecord[];
  planPhraseAbilityLinks: PlanPhraseAbilityLinkRecord[];
  fallbackAgeBand?: string | null;
  showDomainScores?: boolean;
}) {
  const {
    title = "月のねらい候補",
    form,
    setForm,
    planPhrases,
    planPhraseAbilityLinks,
    fallbackAgeBand,
    showDomainScores = true,
  } = props;
  const [activeDomainKey, setActiveDomainKey] = useState<PlanDomainKey | "">(
    "",
  );
  const ageYears = getAgeYearsForForm(form, fallbackAgeBand);
  const activeDomain =
    PLAN_DOMAINS.find((domain) => domain.key === activeDomainKey) ?? null;
  const selectedPhraseIds = new Set(
    form.phraseSelections
      .filter((x) => x.status !== "ARCHIVED")
      .map((x) => x.planPhraseId),
  );

  const candidates = activeDomain
    ? getMonthCandidates(planPhrases, activeDomain, ageYears)
    : [];

  return (
    <div style={{ ...subtleBoxStyle, display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <strong>{title}</strong>
        <span style={smallMutedStyle}>
          対象年齢: {ageYears === null ? "未設定" : `${ageYears}歳`}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PLAN_DOMAINS.map((domain) => (
          <button
            key={domain.key}
            type="button"
            onClick={() =>
              setActiveDomainKey((prev) =>
                prev === domain.key ? "" : domain.key,
              )
            }
            style={{
              fontWeight: activeDomainKey === domain.key ? 700 : 400,
            }}
          >
            {domain.label}から選ぶ
          </button>
        ))}
      </div>

      <SelectedMonthPhraseList form={form} setForm={setForm} />
      {showDomainScores ? <MonthDomainScorePanel form={form} /> : null}

      {activeDomain ? (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>
            {activeDomain.label}の月のねらい候補
          </div>
          {candidates.length === 0 ? (
            <div style={smallMutedStyle}>
              条件に一致する月のねらいがありません。PlanPhraseマスターと対象年齢を確認してください。
            </div>
          ) : (
            candidates.map((phrase) => {
              const phraseId = s(phrase.planPhraseId);
              const links = getPhraseLinks(phraseId, planPhraseAbilityLinks);
              const summary = abilityLinksToSummary(links);
              const disabled = selectedPhraseIds.has(phraseId);

              return (
                <PhraseCard
                  key={phraseId}
                  phrase={phrase}
                  summary={summary}
                  disabled={disabled}
                  onClick={() =>
                    setForm((prev) =>
                      addPhraseToMonthForm(
                        prev,
                        phrase,
                        links,
                        activeDomain,
                        ageYears,
                      ),
                    )
                  }
                />
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function AnnualLikeFieldsLite<T extends AnnualLikeForm>(props: {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  showEventSummary?: boolean;
  lockGoalAndAbilities?: boolean;
  hideGoalAndAbilities?: boolean;
  goalLabel?: string;
  abilityLabel?: string;
  note?: string;
}) {
  const {
    form,
    setForm,
    showEventSummary = false,
    lockGoalAndAbilities = false,
    hideGoalAndAbilities = false,
    goalLabel = "目標",
    abilityLabel = "5領域",
    note,
  } = props;

  const disabledStyle: CSSProperties = lockGoalAndAbilities
    ? { background: "#f3f4f6", color: "#111827" }
    : { background: "#fff", color: "#111827" };

  return (
    <>
      {"title" in form ? (
        <label>
          タイトル
          <input
            value={textOr(form.title)}
            onChange={(e) =>
              setForm((prev) =>
                "title" in prev
                  ? ({ ...prev, title: e.target.value } as T)
                  : prev,
              )
            }
            style={{ width: "100%" }}
          />
        </label>
      ) : null}

      {"periodStart" in form && "periodEnd" in form ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          <label>
            periodStart
            <input
              type="date"
              value={textOr(form.periodStart)}
              onChange={(e) =>
                setForm((prev) =>
                  "periodStart" in prev
                    ? ({ ...prev, periodStart: e.target.value } as T)
                    : prev,
                )
              }
              style={{ width: "100%" }}
            />
          </label>
          <label>
            periodEnd
            <input
              type="date"
              value={textOr(form.periodEnd)}
              onChange={(e) =>
                setForm((prev) =>
                  "periodEnd" in prev
                    ? ({ ...prev, periodEnd: e.target.value } as T)
                    : prev,
                )
              }
              style={{ width: "100%" }}
            />
          </label>
        </div>
      ) : null}

      <label>
        対象年齢
        <input
          value={textOr(form.ageBand)}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, ageBand: e.target.value }))
          }
          style={{ width: "100%" }}
        />
      </label>

      {!hideGoalAndAbilities ? (
        <>
          <label>
            {goalLabel}
            <textarea
              rows={4}
              value={textOr(form.goalText)}
              disabled={lockGoalAndAbilities}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, goalText: e.target.value }))
              }
              style={{ width: "100%", ...disabledStyle }}
            />
          </label>

          {note ? <div style={smallMutedStyle}>{note}</div> : null}

          <div>
            <div style={{ marginBottom: 4 }}>{abilityLabel}</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
              }}
            >
              <label>
                健康
                <input
                  type="number"
                  value={textOr(form.abilityHealth)}
                  disabled={lockGoalAndAbilities}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      abilityHealth: e.target.value,
                    }))
                  }
                  style={{ width: "100%", ...disabledStyle }}
                />
              </label>
              <label>
                人間関係
                <input
                  type="number"
                  value={textOr(form.abilityHumanRelations)}
                  disabled={lockGoalAndAbilities}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      abilityHumanRelations: e.target.value,
                    }))
                  }
                  style={{ width: "100%", ...disabledStyle }}
                />
              </label>
              <label>
                環境
                <input
                  type="number"
                  value={textOr(form.abilityEnvironment)}
                  disabled={lockGoalAndAbilities}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      abilityEnvironment: e.target.value,
                    }))
                  }
                  style={{ width: "100%", ...disabledStyle }}
                />
              </label>
              <label>
                言葉
                <input
                  type="number"
                  value={textOr(form.abilityLanguage)}
                  disabled={lockGoalAndAbilities}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      abilityLanguage: e.target.value,
                    }))
                  }
                  style={{ width: "100%", ...disabledStyle }}
                />
              </label>
              <label>
                表現
                <input
                  type="number"
                  value={textOr(form.abilityExpression)}
                  disabled={lockGoalAndAbilities}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      abilityExpression: e.target.value,
                    }))
                  }
                  style={{ width: "100%", ...disabledStyle }}
                />
              </label>
            </div>
          </div>
        </>
      ) : note ? (
        <div style={smallMutedStyle}>{note}</div>
      ) : null}

      {showEventSummary && "eventSummary" in form ? (
        <label>
          行事・季節の要点
          <textarea
            rows={3}
            value={textOr(form.eventSummary)}
            onChange={(e) =>
              setForm((prev) =>
                "eventSummary" in prev
                  ? ({ ...prev, eventSummary: e.target.value } as T)
                  : prev,
              )
            }
            style={{ width: "100%" }}
          />
        </label>
      ) : null}
    </>
  );
}

function ClassroomFields(props: {
  form: ClassroomForm;
  setForm: Dispatch<SetStateAction<ClassroomForm>>;
}) {
  const { form, setForm } = props;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>
        クラス名
        <input
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          style={{ width: "100%" }}
        />
      </label>
      <label>
        対象年齢
        <input
          value={form.ageBand}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, ageBand: e.target.value }))
          }
          style={{ width: "100%" }}
        />
      </label>
      <label>
        園名
        <input
          value={form.schoolName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, schoolName: e.target.value }))
          }
          style={{ width: "100%" }}
        />
      </label>
      <label>
        status
        <select
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
    </div>
  );
}

function SchoolAnnualPlanFields(props: {
  form: SchoolAnnualPlanForm;
  setForm: Dispatch<SetStateAction<SchoolAnnualPlanForm>>;
}) {
  const { form, setForm } = props;

  return (
    <>
      <label>
        タイトル
        <input
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          style={{ width: "100%" }}
        />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label>
          periodStart
          <input
            type="date"
            value={form.periodStart}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, periodStart: e.target.value }))
            }
            style={{ width: "100%" }}
          />
        </label>
        <label>
          periodEnd
          <input
            type="date"
            value={form.periodEnd}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, periodEnd: e.target.value }))
            }
            style={{ width: "100%" }}
          />
        </label>
      </div>
      <label>
        園の方針
        <textarea
          rows={5}
          value={form.schoolPolicy}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, schoolPolicy: e.target.value }))
          }
          style={{ width: "100%" }}
        />
      </label>
      <label>
        status
        <select
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="DRAFT">DRAFT</option>
          <option value="REVIEWED">REVIEWED</option>
          <option value="FINAL">FINAL</option>
        </select>
      </label>
    </>
  );
}

function StatusSelect<T extends AnnualLikeForm>(props: {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
}) {
  const { form, setForm } = props;

  return (
    <label>
      status
      <select
        value={form.status}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, status: e.target.value }))
        }
      >
        <option value="DRAFT">DRAFT</option>
        <option value="REVIEWED">REVIEWED</option>
        <option value="FINAL">FINAL</option>
      </select>
    </label>
  );
}

function PlanV2EditorInner(props: Props) {
  const {
    selectedNode,
    tenant,
    schoolAnnualPlan,
    schoolAgeTargets = [],
    ageTarget,
    classroom,
    classAnnualPlan,
    classAnnualPlanForClassroom,
    quarterPlan,
    monthPlan,
    quarterChildrenForClassroom = [],
    selectedQuarterEvents = [],
    quarterEvents = [],
    monthChildren = [],
    monthEvents = [],
    monthPhraseSelections = [],
    planPhraseSelections = [],
    planPhrases = [],
    planPhraseAbilityLinks = [],
    classroomCount,
    ageTargetCount,
    classAnnualPlanCount,
    onSaveSchoolAnnualPlan,
    onSaveSchoolAnnualBundle,
    onSaveAgeTarget,
    onSaveClassroom,
    onSaveClassAnnualPlan,
    onSaveClassAnnualBundle,
    onSaveQuarterPlan,
    onSaveQuarterBundle,
    onSaveMonthPlan,
  } = props;

  const [schoolForm, setSchoolForm] = useState<SchoolAnnualPlanForm>(() =>
    toSchoolAnnualPlanForm(schoolAnnualPlan),
  );
  const [schoolAgeTargetRows, setSchoolAgeTargetRows] = useState<
    Array<{ id: string; form: AbilityForm }>
  >(() => buildSchoolAgeTargetForms(schoolAgeTargets));
  const [ageTargetForm, setAgeTargetForm] = useState<AbilityForm>(() =>
    toAbilityFormA(ageTarget),
  );
  const [classroomForm, setClassroomForm] = useState<ClassroomForm>(() =>
    toClassroomForm(classroom),
  );
  const [annualForm, setAnnualForm] = useState<ClassAnnualPlanForm>(() =>
    toClassAnnualPlanForm(
      classAnnualPlan,
      planPhraseSelections.filter(
        (x) => x.classAnnualPlanId === classAnnualPlan?.id,
      ),
    ),
  );
  const [classBundleAnnualForm, setClassBundleAnnualForm] =
    useState<ClassAnnualPlanForm>(() =>
      toClassAnnualPlanForm(
        classAnnualPlanForClassroom,
        planPhraseSelections.filter(
          (x) => x.classAnnualPlanId === classAnnualPlanForClassroom?.id,
        ),
      ),
    );
  const [classBundleQuarterForms, setClassBundleQuarterForms] = useState<
    Array<{ id: string; form: QuarterPlanForm }>
  >(() =>
    buildQuarterForms(
      quarterChildrenForClassroom,
      quarterEvents,
      planPhraseSelections,
    ),
  );
  const [quarterForm, setQuarterForm] = useState<QuarterPlanForm>(() =>
    toQuarterPlanForm(
      quarterPlan,
      selectedQuarterEvents,
      planPhraseSelections.filter(
        (x) => x.classQuarterPlanId === quarterPlan?.id,
      ),
    ),
  );
  const [quarterMonthRows, setQuarterMonthRows] = useState<
    Array<{ id: string; form: MonthPlanForm }>
  >(() =>
    buildQuarterMonthForms(monthChildren, monthEvents, monthPhraseSelections),
  );
  const [monthForm, setMonthForm] = useState<MonthPlanForm>(() =>
    buildMonthForm(monthPlan, monthEvents, monthPhraseSelections),
  );

  const selectedClassSharedAgeTarget = useMemo(() => {
    const ageBand =
      classAnnualPlan?.ageBand ?? classAnnualPlanForClassroom?.ageBand;
    return schoolAgeTargets.find((x) => s(x.ageBand) === s(ageBand)) ?? null;
  }, [
    classAnnualPlan?.ageBand,
    classAnnualPlanForClassroom?.ageBand,
    schoolAgeTargets,
  ]);

  void selectedClassSharedAgeTarget;
  void schoolAgeTargetRows;
  void setSchoolAgeTargetRows;
  void ageTargetForm;
  void setAgeTargetForm;
  void classroomForm;
  void setClassroomForm;
  void classBundleAnnualForm;
  void setClassBundleAnnualForm;
  void classBundleQuarterForms;
  void setClassBundleQuarterForms;
  void onSaveSchoolAnnualBundle;
  void onSaveAgeTarget;
  void onSaveClassroom;
  void onSaveClassAnnualBundle;
  void ClassroomFields;

  if (!selectedNode) {
    return (
      <div style={sectionStyle}>左のツリーから対象を選択してください。</div>
    );
  }

  if (selectedNode.kind === "tenant") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>PLAN v2</h2>
        <div style={subtleBoxStyle}>
          tenant: {tenant?.tenantId ?? "-"} / {tenant?.name ?? "-"}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div>クラス数: {classroomCount}</div>
          <div>年齢別年間方針: {ageTargetCount}</div>
          <div>クラス年計画: {classAnnualPlanCount}</div>
        </div>
        <div style={smallMutedStyle}>
          左のツリーから保育所年計画、クラス、期、月を選ぶと編集できます。
        </div>
      </div>
    );
  }

  if (selectedNode.kind === "schoolAnnualPlan") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>保育所年計画</h2>
        <div style={smallMutedStyle}>
          年齢別年間方針は内部データとして保持し、画面上は園の方針だけを編集します。
        </div>
        <SchoolAnnualPlanFields form={schoolForm} setForm={setSchoolForm} />

        <button onClick={() => void onSaveSchoolAnnualPlan(schoolForm)}>
          保育所年計画を保存
        </button>
      </div>
    );
  }

  if (selectedNode.kind === "ageTarget") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>年齢別年間方針</h2>
        <div style={smallMutedStyle}>
          年齢別年間方針は、現在の画面では表示・編集対象から外しています。
        </div>
      </div>
    );
  }

  if (selectedNode.kind === "classroom") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>{classroom?.name ?? "クラス"}</h2>
        <div style={subtleBoxStyle}>
          対象年齢: {classroom?.ageBand ?? "-"} / 園:{" "}
          {classroom?.schoolName ?? "-"}
        </div>
        <div style={smallMutedStyle}>
          クラス情報の編集画面は非表示にしました。左のメニューからクラス年計画、期計画、月計画を選択してください。
        </div>
      </div>
    );
  }

  if (selectedNode.kind === "classAnnualPlan") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>クラス年計画</h2>
        <AnnualLikeFieldsLite
          form={annualForm}
          setForm={setAnnualForm}
          hideGoalAndAbilities
          note="年間目標と5領域(A)の手入力欄は非表示にしました。年間目標候補の選択結果を内部的に goalTextA へ保存します。"
        />
        <StatusSelect form={annualForm} setForm={setAnnualForm} />
        <ReferencePhraseSelector
          title="年間目標候補"
          planScopeType="YEAR"
          form={annualForm}
          setForm={setAnnualForm}
          planPhrases={planPhrases}
          planPhraseAbilityLinks={planPhraseAbilityLinks}
          fallbackAgeBand={classAnnualPlan?.ageBand}
        />
        <button onClick={() => void onSaveClassAnnualPlan(annualForm)}>
          クラス年計画を保存
        </button>
      </div>
    );
  }

  if (selectedNode.kind === "quarter") {
    const termNo = Number(quarterPlan?.termNo ?? 0) || null;

    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>期計画</h2>
        <AnnualLikeFieldsLite
          form={quarterForm}
          setForm={setQuarterForm}
          showEventSummary
          hideGoalAndAbilities
          note="四半期目標と5領域(B)の手入力欄は非表示にしました。四半期目標候補の選択結果を内部的に goalTextB へ保存します。"
        />
        <StatusSelect form={quarterForm} setForm={setQuarterForm} />
        <ReferencePhraseSelector
          title="四半期目標候補"
          planScopeType="TERM"
          form={quarterForm}
          setForm={setQuarterForm}
          planPhrases={planPhrases}
          planPhraseAbilityLinks={planPhraseAbilityLinks}
          fallbackAgeBand={quarterPlan?.ageBand}
          termNo={termNo}
        />

        <div style={sectionStyle}>
          <div style={{ fontWeight: 700 }}>月比較（C）</div>
          {quarterMonthRows.length === 0 ? (
            <div style={smallMutedStyle}>月計画がありません。</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 1200,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>月</th>
                    <th style={thStyle}>月のねらい候補</th>
                    <th style={thStyle}>5領域(C)</th>
                    <th style={thStyle}>行事</th>
                  </tr>
                </thead>
                <tbody>
                  {quarterMonthRows.map((row, rowIndex) => {
                    const month = monthChildren.find((x) => x.id === row.id);
                    return (
                      <tr key={row.id}>
                        <td style={tdStyle}>
                          {month?.monthKey ?? row.form.title}
                        </td>
                        <td style={tdStyle}>
                          <MonthPhraseSelector
                            title="月のねらい候補"
                            form={row.form}
                            setForm={(updater) => {
                              setQuarterMonthRows((prev) =>
                                prev.map((item, index) => {
                                  if (index !== rowIndex) return item;
                                  const nextForm =
                                    typeof updater === "function"
                                      ? updater(item.form)
                                      : updater;
                                  return { ...item, form: nextForm };
                                }),
                              );
                            }}
                            planPhrases={planPhrases}
                            planPhraseAbilityLinks={planPhraseAbilityLinks}
                            fallbackAgeBand={quarterPlan?.ageBand}
                            showDomainScores={false}
                          />
                        </td>
                        <td style={tdStyle}>
                          <MonthDomainScorePanel form={row.form} compact />
                        </td>
                        <td style={tdStyle}>
                          <textarea
                            rows={8}
                            value={row.form.eventSummary}
                            onChange={(e) => {
                              const value = e.target.value;
                              setQuarterMonthRows((prev) =>
                                prev.map((item, index) =>
                                  index === rowIndex
                                    ? {
                                        ...item,
                                        form: {
                                          ...item.form,
                                          eventSummary: value,
                                        },
                                      }
                                    : item,
                                ),
                              );
                            }}
                            style={{ width: "100%" }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => void onSaveQuarterPlan(quarterForm)}>
            期計画だけ保存
          </button>
          <button
            onClick={() =>
              void onSaveQuarterBundle(quarterForm, quarterMonthRows)
            }
          >
            期計画と月計画を保存
          </button>
        </div>
      </div>
    );
  }

  if (selectedNode.kind === "month") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>月計画</h2>
        <AnnualLikeFieldsLite
          form={monthForm}
          setForm={setMonthForm}
          showEventSummary
          hideGoalAndAbilities
          note="月のねらい(C)の手入力欄は非表示にしました。候補選択結果を内部的に goalTextC と5領域(C)へ反映します。"
        />
        <StatusSelect form={monthForm} setForm={setMonthForm} />
        <MonthPhraseSelector
          title="月のねらい候補"
          form={monthForm}
          setForm={setMonthForm}
          planPhrases={planPhrases}
          planPhraseAbilityLinks={planPhraseAbilityLinks}
          fallbackAgeBand={monthPlan?.ageBand}
        />
        <button onClick={() => void onSaveMonthPlan(monthForm)}>
          月計画を保存
        </button>
      </div>
    );
  }

  return <div style={sectionStyle}>このノードの編集画面は未対応です。</div>;
}

export default function PlanV2Editor(props: Props) {
  const {
    selectedNode,
    schoolAnnualPlan,
    schoolAgeTargets = [],
    ageTarget,
    classroom,
    classAnnualPlan,
    classAnnualPlanForClassroom,
    quarterPlan,
    monthPlan,
    quarterChildrenForClassroom = [],
    selectedQuarterEvents = [],
    monthChildren = [],
    monthEvents = [],
    monthPhraseSelections = [],
    planPhraseSelections = [],
    planPhrases = [],
    planPhraseAbilityLinks = [],
  } = props;

  const editorKey = useMemo(
    () =>
      [
        nodeKey(selectedNode),
        schoolAnnualPlan?.id ?? "",
        ageTarget?.id ?? "",
        classroom?.id ?? "",
        classAnnualPlan?.id ?? "",
        classAnnualPlanForClassroom?.id ?? "",
        quarterPlan?.id ?? "",
        monthPlan?.id ?? "",
        schoolAgeTargets.map((x) => x.id).join(","),
        quarterChildrenForClassroom.map((x) => x.id).join(","),
        selectedQuarterEvents.map((x) => x.id).join(","),
        monthChildren.map((x) => x.id).join(","),
        monthEvents.map((x) => x.id).join(","),
        monthPhraseSelections.map((x) => x.id).join(","),
        planPhraseSelections.map((x) => x.id).join(","),
        `${planPhrases.length}:${planPhraseAbilityLinks.length}`,
      ].join("::"),
    [
      selectedNode,
      schoolAnnualPlan?.id,
      ageTarget?.id,
      classroom?.id,
      classAnnualPlan?.id,
      classAnnualPlanForClassroom?.id,
      quarterPlan?.id,
      monthPlan?.id,
      schoolAgeTargets,
      quarterChildrenForClassroom,
      selectedQuarterEvents,
      monthChildren,
      monthEvents,
      monthPhraseSelections,
      planPhraseSelections,
      planPhrases.length,
      planPhraseAbilityLinks.length,
    ],
  );

  return <PlanV2EditorInner key={editorKey} {...props} />;
}
