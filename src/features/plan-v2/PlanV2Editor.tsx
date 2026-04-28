"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  PLAN_DOMAINS,
  abilityLinksToSummary,
  getPlanDomainLabel,
  makePhraseSelectionClientKey,
  nodeKey,
  parseAgeYears,
  recalculateMonthPlanFromSelections,
  s,
  toAbilityFormA,
  toClassAnnualPlanForm,
  toMonthPlanForm,
  toQuarterPlanForm,
  toSchoolAnnualPlanForm,
  type AbilityForm,
  type ClassAnnualPlanForm,
  type ClassAnnualPlanRecord,
  type ClassMonthPlanPhraseSelectionRecord,
  type ClassMonthPlanRecord,
  type ClassQuarterPlanRecord,
  type ClassroomRecord,
  type MonthEventRecord,
  type MonthPlanForm,
  type MonthPlanPhraseSelectionForm,
  type PlanDomainKey,
  type PlanDomainLabel,
  type PlanPhraseAbilityLinkRecord,
  type PlanPhraseAbilitySummary,
  type PlanPhraseRecord,
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

  classroomCount: number;
  ageTargetCount: number;
  classAnnualPlanCount: number;

  onSaveSchoolAnnualPlan: (form: SchoolAnnualPlanForm) => Promise<void>;
  onSaveSchoolAnnualBundle: (
    planForm: SchoolAnnualPlanForm,
    ageRows: Array<{ id: string; form: AbilityForm }>,
  ) => Promise<void>;
  onSaveAgeTarget: (form: AbilityForm) => Promise<void>;
  onSaveClassroom: (form: never) => Promise<void>;
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

type PhrasePickerTarget =
  | {
      mode: "quarter-month";
      rowId: string;
      rowTitle: string;
      domain: (typeof PLAN_DOMAINS)[number];
      ageYears: number | null;
    }
  | {
      mode: "single-month";
      rowId: string;
      rowTitle: string;
      domain: (typeof PLAN_DOMAINS)[number];
      ageYears: number | null;
    };

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

function textOr(value: string | null | undefined, fallback = ""): string {
  return value ?? fallback;
}

function toScoreString(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function applySharedAgeTargetToAnnualForm(
  base: ClassAnnualPlanForm,
  shared?: SchoolAnnualAgeTargetRecord | null,
): ClassAnnualPlanForm {
  if (!shared) return base;

  return {
    ...base,
    goalText: shared.goalTextA ?? "",
    abilityHealth: toScoreString(shared.abilityHealthA),
    abilityHumanRelations: toScoreString(shared.abilityHumanRelationsA),
    abilityEnvironment: toScoreString(shared.abilityEnvironmentA),
    abilityLanguage: toScoreString(shared.abilityLanguageA),
    abilityExpression: toScoreString(shared.abilityExpressionA),
  };
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
): Array<{ id: string; form: QuarterPlanForm }> {
  return [...quarterRows]
    .sort((a, b) => Number(a.termNo ?? 0) - Number(b.termNo ?? 0))
    .map((row) => ({
      id: row.id,
      form: toQuarterPlanForm(
        row,
        quarterEvents.filter((x) => x.classQuarterPlanId === row.id),
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

function getAgeYearsForMonthForm(
  form: MonthPlanForm,
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

function getFilteredPhrases(
  planPhrases: PlanPhraseRecord[],
  domainLabel: PlanDomainLabel,
  ageYears: number | null,
): PlanPhraseRecord[] {
  return planPhrases
    .filter((x) => {
      if (s(x.status) !== "active" && s(x.status) !== "ACTIVE") return false;
      if (s(x.planPeriodType) !== "MONTH") return false;
      if (getPlanDomainLabel(x.domain) !== domainLabel) return false;
      if (ageYears !== null && Number(x.ageYears ?? -1) !== ageYears) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aa = Number(a.sortOrder ?? 999999);
      const bb = Number(b.sortOrder ?? 999999);
      if (aa !== bb) return aa - bb;
      return s(a.planPhraseId).localeCompare(s(b.planPhraseId));
    });
}

function buildSelectionFromPhrase(
  phrase: PlanPhraseRecord,
  links: PlanPhraseAbilityLinkRecord[],
  domain: (typeof PLAN_DOMAINS)[number],
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
  domain: (typeof PLAN_DOMAINS)[number],
  ageYears: number | null,
): MonthPlanForm {
  const nextSortOrder = form.phraseSelections.length + 1;
  const selection = buildSelectionFromPhrase(
    phrase,
    links,
    domain,
    ageYears,
    nextSortOrder,
  );

  return recalculateMonthPlanFromSelections({
    ...form,
    phraseSelections: [...form.phraseSelections, selection],
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

function AnnualLikeFieldsLite<T extends AnnualLikeForm>(props: {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  showEventSummary?: boolean;
  lockGoalAndAbilities?: boolean;
  goalLabel?: string;
  abilityLabel?: string;
}) {
  const {
    form,
    setForm,
    showEventSummary = false,
    lockGoalAndAbilities = false,
    goalLabel = "目標",
    abilityLabel = "5領域",
  } = props;

  const disabledStyle = lockGoalAndAbilities
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

      <label>
        {goalLabel}
        <textarea
          rows={3}
          value={textOr(form.goalText)}
          disabled={lockGoalAndAbilities}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, goalText: e.target.value }))
          }
          style={{ width: "100%", ...disabledStyle }}
        />
      </label>

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
                setForm((prev) => ({ ...prev, abilityHealth: e.target.value }))
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

      {showEventSummary && "eventSummary" in form ? (
        <label>
          行事
          <textarea
            rows={4}
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

function DomainScoreBadges(props: { form: MonthPlanForm }) {
  const { form } = props;
  const values: Record<PlanDomainKey, string> = {
    health: form.abilityHealth,
    humanRelations: form.abilityHumanRelations,
    environment: form.abilityEnvironment,
    language: form.abilityLanguage,
    expression: form.abilityExpression,
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {PLAN_DOMAINS.map((domain) => (
        <span
          key={domain.key}
          style={{
            display: "inline-flex",
            gap: 4,
            alignItems: "center",
            padding: "3px 8px",
            border: "1px solid #d1d5db",
            borderRadius: 999,
            background: "#fff",
            fontSize: 12,
          }}
        >
          <strong>{domain.label}</strong>
          <span>{values[domain.key] || "0"}</span>
        </span>
      ))}
    </div>
  );
}

function MonthCardHeader(props: {
  form: MonthPlanForm;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const { form, isCollapsed, onToggle } = props;

  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: "100%",
        display: "grid",
        gap: 8,
        textAlign: "left",
        padding: 10,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: "#fff",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontWeight: 700 }}>
            {isCollapsed ? "▶" : "▼"} {textOr(form.title)}
          </span>
          <span style={{ fontSize: 12, color: "#666" }}>
            {form.periodStart}〜{form.periodEnd}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#666" }}>
          選択済み文例: {form.phraseSelections.length}件
        </span>
      </div>
      <DomainScoreBadges form={form} />
    </button>
  );
}

function SelectedPhraseList(props: {
  form: MonthPlanForm;
  onRemove: (clientKey: string) => void;
}) {
  const { form, onRemove } = props;

  if (form.phraseSelections.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#666" }}>
        まだ計画文例が選択されていません。下の5領域ボタンから文例を選択してください。
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {form.phraseSelections.map((selection, index) => (
        <div
          key={selection.clientKey}
          style={{
            display: "grid",
            gap: 6,
            padding: 8,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ fontWeight: 700, color: "#374151" }}>
              {index + 1}.
            </div>
            <div style={{ flex: 1, whiteSpace: "pre-wrap" }}>
              {selection.phraseTextSnapshot}
            </div>
            <button type="button" onClick={() => onRemove(selection.clientKey)}>
              削除
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
            選択領域: {selection.selectedDomain || "-"}
            <br />
            影響Ability: {abilitySummaryLabel(selection.abilitySummary) || "-"}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthPhrasePlanner(props: {
  rowId: string;
  form: MonthPlanForm;
  rowTitle: string;
  ageYears: number | null;
  onOpenPicker: (target: PhrasePickerTarget) => void;
  onRemovePhrase: (rowId: string, clientKey: string) => void;
  pickerMode: PhrasePickerTarget["mode"];
  onChangeEventSummary: (rowId: string, value: string) => void;
  onChangeManualGoal: (rowId: string, value: string) => void;
  pickerPanel?: ReactNode;
}) {
  const {
    rowId,
    form,
    rowTitle,
    ageYears,
    onOpenPicker,
    onRemovePhrase,
    pickerMode,
    onChangeEventSummary,
    onChangeManualGoal,
    pickerPanel,
  } = props;
  const isPhraseDriven = form.phraseSelections.length > 0;

  return (
    <div style={{ display: "grid", gap: 8, minWidth: 520 }}>
      <SelectedPhraseList
        form={form}
        onRemove={(clientKey) => onRemovePhrase(rowId, clientKey)}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PLAN_DOMAINS.map((domain) => (
          <button
            key={domain.key}
            type="button"
            onClick={() =>
              onOpenPicker({
                mode: pickerMode,
                rowId,
                rowTitle,
                domain,
                ageYears,
              })
            }
          >
            {domain.label}から選ぶ
          </button>
        ))}
      </div>

      {pickerPanel}

      <label>
        目標(C) {isPhraseDriven ? "（選択文例から自動生成）" : ""}
        <textarea
          rows={isPhraseDriven ? 5 : 3}
          value={textOr(form.goalText)}
          readOnly={isPhraseDriven}
          onChange={(e) => onChangeManualGoal(rowId, e.target.value)}
          style={{
            width: "100%",
            background: isPhraseDriven ? "#f9fafb" : "#fff",
          }}
        />
      </label>

      <div>
        <div style={{ marginBottom: 4, fontSize: 12, color: "#666" }}>
          5領域スコア（選択文例のAbility Linkから再集計）
        </div>
        <DomainScoreBadges form={form} />
      </div>

      <label>
        行事
        <textarea
          rows={3}
          value={textOr(form.eventSummary)}
          onChange={(e) => onChangeEventSummary(rowId, e.target.value)}
          style={{ width: "100%" }}
        />
      </label>
    </div>
  );
}

function PhrasePickerPanel(props: {
  target: PhrasePickerTarget | null;
  planPhrases: PlanPhraseRecord[];
  planPhraseAbilityLinks: PlanPhraseAbilityLinkRecord[];
  onSelect: (phrase: PlanPhraseRecord) => void;
  onClose: () => void;
}) {
  const { target, planPhrases, planPhraseAbilityLinks, onSelect, onClose } =
    props;

  const candidates = useMemo(() => {
    if (!target) return [];
    return getFilteredPhrases(
      planPhrases,
      target.domain.label,
      target.ageYears,
    );
  }, [planPhrases, target]);

  if (!target) return null;

  return (
    <div
      style={{
        ...subtleBoxStyle,
        display: "grid",
        gap: 10,
        background: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <strong>
          {target.rowTitle}：{target.domain.label}の計画文例
        </strong>
        <span style={{ color: "#666", fontSize: 12 }}>
          対象年齢:{" "}
          {target.ageYears === null ? "未設定" : `${target.ageYears}歳`}
        </span>
        <button type="button" onClick={onClose} style={{ marginLeft: "auto" }}>
          閉じる
        </button>
      </div>

      {candidates.length === 0 ? (
        <div style={{ color: "#666" }}>
          条件に一致する計画文例がありません。対象年齢とPlanPhraseマスターを確認してください。
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {candidates.map((phrase) => {
            const phraseId = s(phrase.planPhraseId);
            const links = getPhraseLinks(phraseId, planPhraseAbilityLinks);
            const summary = abilityLinksToSummary(links);
            return (
              <button
                key={phraseId}
                type="button"
                onClick={() => onSelect(phrase)}
                style={{
                  display: "grid",
                  gap: 4,
                  textAlign: "left",
                  padding: 10,
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontWeight: 700 }}>
                  {phraseId} / {phrase.phraseType ?? "月のねらい"}
                </span>
                <span style={{ whiteSpace: "pre-wrap" }}>
                  {phrase.phraseText}
                </span>
                <span style={{ fontSize: 12, color: "#666" }}>
                  影響: {abilitySummaryLabel(summary) || "Ability Linkなし"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
      planPhrases.length,
      planPhraseAbilityLinks.length,
    ],
  );

  return <PlanV2EditorInner key={editorKey} {...props} />;
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
    monthChildren = [],
    quarterEvents = [],
    selectedQuarterEvents = [],
    monthEvents = [],
    planPhrases = [],
    planPhraseAbilityLinks = [],
    monthPhraseSelections = [],
    classroomCount,
    ageTargetCount,
    classAnnualPlanCount,
    onSaveSchoolAnnualPlan,
    onSaveSchoolAnnualBundle,
    onSaveAgeTarget,
    onSaveClassAnnualPlan,
    onSaveClassAnnualBundle,
    onSaveQuarterPlan,
    onSaveQuarterBundle,
    onSaveMonthPlan,
  } = props;

  const [schoolForm, setSchoolForm] = useState<SchoolAnnualPlanForm>(() =>
    toSchoolAnnualPlanForm(schoolAnnualPlan),
  );
  const [schoolAgeTargetForms, setSchoolAgeTargetForms] = useState<
    Array<{ id: string; form: AbilityForm }>
  >(() => buildSchoolAgeTargetForms(schoolAgeTargets));
  const [ageForm, setAgeForm] = useState<AbilityForm>(() =>
    toAbilityFormA(ageTarget),
  );
  const [annualForm, setAnnualForm] = useState<ClassAnnualPlanForm>(() =>
    toClassAnnualPlanForm(classAnnualPlan),
  );
  const [classBundleAnnualForm, setClassBundleAnnualForm] =
    useState<ClassAnnualPlanForm>(() =>
      toClassAnnualPlanForm(classAnnualPlanForClassroom),
    );
  const [classBundleQuarterForms, setClassBundleQuarterForms] = useState<
    Array<{ id: string; form: QuarterPlanForm }>
  >(() => buildQuarterForms(quarterChildrenForClassroom, quarterEvents));
  const [quarterBundleForm, setQuarterBundleForm] = useState<QuarterPlanForm>(
    () => toQuarterPlanForm(quarterPlan, selectedQuarterEvents),
  );
  const [quarterMonthForms, setQuarterMonthForms] = useState<
    Array<{ id: string; form: MonthPlanForm }>
  >(() =>
    buildQuarterMonthForms(monthChildren, monthEvents, monthPhraseSelections),
  );
  const [monthForm, setMonthForm] = useState<MonthPlanForm>(() =>
    buildMonthForm(monthPlan, monthEvents, monthPhraseSelections),
  );
  const [phrasePickerTarget, setPhrasePickerTarget] =
    useState<PhrasePickerTarget | null>(null);
  const [collapsedQuarterMonthIds, setCollapsedQuarterMonthIds] = useState<
    Set<string>
  >(() => new Set());

  const sharedAgeTargetForSelectedClassroom = useMemo(() => {
    const ageBand =
      classroom?.ageBand || classAnnualPlanForClassroom?.ageBand || "";
    return schoolAgeTargets.find((x) => (x.ageBand ?? "") === ageBand) ?? null;
  }, [
    classroom?.ageBand,
    classAnnualPlanForClassroom?.ageBand,
    schoolAgeTargets,
  ]);

  const sharedAgeTargetForSelectedAnnualPlan = useMemo(() => {
    const ageBand = classAnnualPlan?.ageBand || "";
    return schoolAgeTargets.find((x) => (x.ageBand ?? "") === ageBand) ?? null;
  }, [classAnnualPlan?.ageBand, schoolAgeTargets]);

  const classBundleAnnualSharedForm = useMemo(
    () =>
      applySharedAgeTargetToAnnualForm(
        classBundleAnnualForm,
        sharedAgeTargetForSelectedClassroom,
      ),
    [classBundleAnnualForm, sharedAgeTargetForSelectedClassroom],
  );

  const annualSharedForm = useMemo(
    () =>
      applySharedAgeTargetToAnnualForm(
        annualForm,
        sharedAgeTargetForSelectedAnnualPlan,
      ),
    [annualForm, sharedAgeTargetForSelectedAnnualPlan],
  );

  const lockClassroomAnnualA = !!sharedAgeTargetForSelectedClassroom;
  const lockAnnualA = !!sharedAgeTargetForSelectedAnnualPlan;

  function updateQuarterMonthForm(
    rowId: string,
    updater: (form: MonthPlanForm) => MonthPlanForm,
  ) {
    setQuarterMonthForms((rows) =>
      rows.map((row) =>
        row.id === rowId ? { ...row, form: updater(row.form) } : row,
      ),
    );
  }

  function toggleQuarterMonthCollapsed(rowId: string) {
    setCollapsedQuarterMonthIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
        if (
          phrasePickerTarget?.mode === "quarter-month" &&
          phrasePickerTarget.rowId === rowId
        ) {
          setPhrasePickerTarget(null);
        }
      }
      return next;
    });
  }

  function openQuarterMonthPicker(target: PhrasePickerTarget) {
    setCollapsedQuarterMonthIds((prev) => {
      const next = new Set(prev);
      next.delete(target.rowId);
      return next;
    });
    setPhrasePickerTarget(target);
  }

  function handleRemovePhrase(
    mode: PhrasePickerTarget["mode"],
    rowId: string,
    clientKey: string,
  ) {
    if (mode === "single-month") {
      setMonthForm((prev) => removePhraseFromMonthForm(prev, clientKey));
      return;
    }

    updateQuarterMonthForm(rowId, (form) =>
      removePhraseFromMonthForm(form, clientKey),
    );
  }

  function handleSelectPhrase(phrase: PlanPhraseRecord) {
    if (!phrasePickerTarget) return;

    const links = getPhraseLinks(
      s(phrase.planPhraseId),
      planPhraseAbilityLinks,
    );
    const add = (form: MonthPlanForm) =>
      addPhraseToMonthForm(
        form,
        phrase,
        links,
        phrasePickerTarget.domain,
        phrasePickerTarget.ageYears,
      );

    if (phrasePickerTarget.mode === "single-month") {
      setMonthForm((prev) => add(prev));
    } else {
      updateQuarterMonthForm(phrasePickerTarget.rowId, add);
    }

    setPhrasePickerTarget(null);
  }

  if (!selectedNode) {
    return (
      <div style={subtleBoxStyle}>
        左のツリーから編集対象を選択してください。
      </div>
    );
  }

  const tenantTitle = tenant ? `${tenant.name ?? tenant.tenantId}` : "tenant";

  if (selectedNode.kind === "tenant") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>PLAN v2：{tenantTitle}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          <div style={subtleBoxStyle}>年齢別年間方針: {ageTargetCount}</div>
          <div style={subtleBoxStyle}>クラス: {classroomCount}</div>
          <div style={subtleBoxStyle}>クラス年計画: {classAnnualPlanCount}</div>
        </div>
        <div style={{ color: "#666" }}>
          左のツリーから、保育所年計画、年齢別年間方針、クラス、期、月を選択してください。
        </div>
      </div>
    );
  }

  if (selectedNode.kind === "schoolAnnualPlan") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>保育所年計画</h2>
        <label>
          タイトル
          <input
            value={schoolForm.title}
            onChange={(e) =>
              setSchoolForm((prev) => ({ ...prev, title: e.target.value }))
            }
            style={{ width: "100%" }}
          />
        </label>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          <label>
            periodStart
            <input
              type="date"
              value={schoolForm.periodStart}
              onChange={(e) =>
                setSchoolForm((prev) => ({
                  ...prev,
                  periodStart: e.target.value,
                }))
              }
              style={{ width: "100%" }}
            />
          </label>
          <label>
            periodEnd
            <input
              type="date"
              value={schoolForm.periodEnd}
              onChange={(e) =>
                setSchoolForm((prev) => ({
                  ...prev,
                  periodEnd: e.target.value,
                }))
              }
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <label>
          園の方針
          <textarea
            rows={5}
            value={schoolForm.schoolPolicy}
            onChange={(e) =>
              setSchoolForm((prev) => ({
                ...prev,
                schoolPolicy: e.target.value,
              }))
            }
            style={{ width: "100%" }}
          />
        </label>

        <div style={sectionStyle}>
          <div style={{ fontWeight: 700 }}>年齢別年間方針</div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 1100,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>年齢</th>
                  <th style={thStyle}>目標(A)</th>
                  {PLAN_DOMAINS.map((domain) => (
                    <th key={domain.key} style={thStyle}>
                      {domain.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schoolAgeTargetForms.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={tdStyle}>
                      <input
                        value={row.form.ageBand}
                        onChange={(e) =>
                          setSchoolAgeTargetForms((rows) =>
                            rows.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    form: {
                                      ...x.form,
                                      ageBand: e.target.value,
                                    },
                                  }
                                : x,
                            ),
                          )
                        }
                        style={{ width: 90 }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <textarea
                        rows={3}
                        value={row.form.goalText}
                        onChange={(e) =>
                          setSchoolAgeTargetForms((rows) =>
                            rows.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    form: {
                                      ...x.form,
                                      goalText: e.target.value,
                                    },
                                  }
                                : x,
                            ),
                          )
                        }
                        style={{ width: "100%", minWidth: 220 }}
                      />
                    </td>
                    {PLAN_DOMAINS.map((domain) => (
                      <td key={domain.key} style={tdStyle}>
                        <input
                          type="number"
                          value={row.form[domain.formField]}
                          onChange={(e) =>
                            setSchoolAgeTargetForms((rows) =>
                              rows.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      form: {
                                        ...x.form,
                                        [domain.formField]: e.target.value,
                                      },
                                    }
                                  : x,
                              ),
                            )
                          }
                          style={{ width: 80 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => void onSaveSchoolAnnualPlan(schoolForm)}>
            保育所年計画のみ保存
          </button>
          <button
            onClick={() =>
              void onSaveSchoolAnnualBundle(schoolForm, schoolAgeTargetForms)
            }
          >
            保育所年計画と年齢別年間方針を保存
          </button>
        </div>
      </div>
    );
  }

  if (selectedNode.kind === "ageTarget") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>年齢別年間方針</h2>
        <AnnualLikeFieldsLite
          form={ageForm}
          setForm={setAgeForm}
          goalLabel="目標(A)"
          abilityLabel="5領域(A)"
        />
        <button onClick={() => void onSaveAgeTarget(ageForm)}>
          年齢別年間方針を保存
        </button>
      </div>
    );
  }

  if (selectedNode.kind === "classAnnualPlan") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>クラス年計画</h2>
        <AnnualLikeFieldsLite
          form={annualSharedForm}
          setForm={setAnnualForm}
          lockGoalAndAbilities={lockAnnualA}
          goalLabel="目標(A)"
          abilityLabel="5領域(A)"
        />
        <div style={{ fontSize: 12, color: "#666" }}>
          {lockAnnualA
            ? "同一年齢の年齢別年間方針を表示しています。変更は保育所年計画側で行ってください。"
            : "同一年齢の年齢別年間方針が未設定のため、クラス年計画側の値を編集できます。"}
        </div>
        <button onClick={() => void onSaveClassAnnualPlan(annualForm)}>
          クラス年計画を保存
        </button>
      </div>
    );
  }

  if (selectedNode.kind === "classroom") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>クラス計画：{classroom?.name ?? ""}</h2>
        <div style={subtleBoxStyle}>
          対象年齢: {classroom?.ageBand ?? "-"} / 園:{" "}
          {classroom?.schoolName ?? "-"}
        </div>

        <div style={sectionStyle}>
          <div style={{ fontWeight: 700 }}>① 年計画（A）</div>
          <AnnualLikeFieldsLite
            form={classBundleAnnualSharedForm}
            setForm={setClassBundleAnnualForm}
            lockGoalAndAbilities={lockClassroomAnnualA}
            goalLabel="目標(A)"
            abilityLabel="5領域(A)"
          />
          <div style={{ fontSize: 12, color: "#666" }}>
            {lockClassroomAnnualA
              ? "同一年齢の年齢別年間方針を表示しています。ここでは編集せず、保育所年計画側で変更してください。"
              : "同一年齢の年齢別年間方針が未設定のため、クラス側の値を表示しています。"}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={{ fontWeight: 700 }}>②〜⑤ 四半期比較（1Q〜4Q）</div>
          {classBundleQuarterForms.length === 0 ? (
            <div>期計画がありません。</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 1300,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>期</th>
                    <th style={thStyle}>目標(B)</th>
                    {PLAN_DOMAINS.map((domain) => (
                      <th key={domain.key} style={thStyle}>
                        {domain.label}
                      </th>
                    ))}
                    <th style={thStyle}>行事</th>
                  </tr>
                </thead>
                <tbody>
                  {classBundleQuarterForms.map((row, idx) => (
                    <tr key={row.id}>
                      <td
                        style={{
                          ...tdStyle,
                          whiteSpace: "nowrap",
                          fontWeight: 700,
                        }}
                      >
                        {textOr(row.form.title)}
                      </td>
                      <td style={tdStyle}>
                        <textarea
                          rows={3}
                          value={textOr(row.form.goalText)}
                          onChange={(e) =>
                            setClassBundleQuarterForms((rows) =>
                              rows.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      form: {
                                        ...x.form,
                                        goalText: e.target.value,
                                      },
                                    }
                                  : x,
                              ),
                            )
                          }
                          style={{ width: "100%", minWidth: 220 }}
                        />
                      </td>
                      {PLAN_DOMAINS.map((domain) => (
                        <td key={domain.key} style={tdStyle}>
                          <input
                            type="number"
                            value={row.form[domain.formField]}
                            onChange={(e) =>
                              setClassBundleQuarterForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          [domain.formField]: e.target.value,
                                        },
                                      }
                                    : x,
                                ),
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                      ))}
                      <td style={tdStyle}>
                        <textarea
                          rows={3}
                          value={textOr(row.form.eventSummary)}
                          onChange={(e) =>
                            setClassBundleQuarterForms((rows) =>
                              rows.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      form: {
                                        ...x.form,
                                        eventSummary: e.target.value,
                                      },
                                    }
                                  : x,
                              ),
                            )
                          }
                          style={{ width: "100%", minWidth: 180 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          onClick={() =>
            void onSaveClassAnnualBundle(
              classBundleAnnualForm,
              classBundleQuarterForms,
            )
          }
        >
          クラス年計画を保存
        </button>
      </div>
    );
  }

  if (selectedNode.kind === "quarter") {
    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>クラス期計画：{quarterBundleForm.title}</h2>

        <div style={sectionStyle}>
          <div style={{ fontWeight: 700 }}>① 期計画（B）</div>
          <AnnualLikeFieldsLite
            form={quarterBundleForm}
            setForm={setQuarterBundleForm}
            showEventSummary
            goalLabel="目標(B)"
            abilityLabel="5領域(B)"
          />
        </div>

        <div style={sectionStyle}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 700 }}>
              ②〜④ 月比較（子どもの成長と月ごとの行事を比較しながら検討）
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              5領域ボタンから計画文例を選ぶと、目標(C)と5領域スコアが自動で再集計されます。
            </div>
          </div>

          {quarterMonthForms.length === 0 ? (
            <div>月計画がありません。</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {quarterMonthForms.map((row) => {
                const ageYears = getAgeYearsForMonthForm(
                  row.form,
                  quarterBundleForm.ageBand,
                );
                const isCollapsed = collapsedQuarterMonthIds.has(row.id);
                const isActivePicker =
                  phrasePickerTarget?.mode === "quarter-month" &&
                  phrasePickerTarget.rowId === row.id;

                return (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 8,
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: "#f9fafb",
                    }}
                  >
                    <MonthCardHeader
                      form={row.form}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleQuarterMonthCollapsed(row.id)}
                    />

                    {!isCollapsed ? (
                      <MonthPhrasePlanner
                        rowId={row.id}
                        form={row.form}
                        rowTitle={textOr(row.form.title)}
                        ageYears={ageYears}
                        pickerMode="quarter-month"
                        onOpenPicker={openQuarterMonthPicker}
                        onRemovePhrase={(rowId, clientKey) =>
                          handleRemovePhrase("quarter-month", rowId, clientKey)
                        }
                        onChangeManualGoal={(rowId, value) =>
                          updateQuarterMonthForm(rowId, (form) => ({
                            ...form,
                            goalText: value,
                          }))
                        }
                        onChangeEventSummary={(rowId, value) =>
                          updateQuarterMonthForm(rowId, (form) => ({
                            ...form,
                            eventSummary: value,
                          }))
                        }
                        pickerPanel={
                          <PhrasePickerPanel
                            target={isActivePicker ? phrasePickerTarget : null}
                            planPhrases={planPhrases}
                            planPhraseAbilityLinks={planPhraseAbilityLinks}
                            onSelect={handleSelectPhrase}
                            onClose={() => setPhrasePickerTarget(null)}
                          />
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => void onSaveQuarterPlan(quarterBundleForm)}>
            期計画のみ保存
          </button>
          <button
            onClick={() =>
              void onSaveQuarterBundle(quarterBundleForm, quarterMonthForms)
            }
          >
            期計画を保存
          </button>
        </div>
      </div>
    );
  }

  if (selectedNode.kind === "month") {
    const ageYears = getAgeYearsForMonthForm(monthForm, monthPlan?.ageBand);

    return (
      <div style={sectionStyle}>
        <h2 style={{ margin: 0 }}>月計画：{monthForm.title}</h2>

        <div style={sectionStyle}>
          <label>
            タイトル
            <input
              value={monthForm.title}
              onChange={(e) =>
                setMonthForm((prev) => ({ ...prev, title: e.target.value }))
              }
              style={{ width: "100%" }}
            />
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
            }}
          >
            <label>
              periodStart
              <input
                type="date"
                value={monthForm.periodStart}
                onChange={(e) =>
                  setMonthForm((prev) => ({
                    ...prev,
                    periodStart: e.target.value,
                  }))
                }
                style={{ width: "100%" }}
              />
            </label>
            <label>
              periodEnd
              <input
                type="date"
                value={monthForm.periodEnd}
                onChange={(e) =>
                  setMonthForm((prev) => ({
                    ...prev,
                    periodEnd: e.target.value,
                  }))
                }
                style={{ width: "100%" }}
              />
            </label>
            <label>
              対象年齢
              <input
                value={monthForm.ageBand}
                onChange={(e) =>
                  setMonthForm((prev) => ({ ...prev, ageBand: e.target.value }))
                }
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <MonthPhrasePlanner
            rowId={monthPlan?.id ?? "single-month"}
            form={monthForm}
            rowTitle={monthForm.title}
            ageYears={ageYears}
            pickerMode="single-month"
            onOpenPicker={setPhrasePickerTarget}
            onRemovePhrase={(_rowId, clientKey) =>
              handleRemovePhrase("single-month", "single-month", clientKey)
            }
            onChangeManualGoal={(_rowId, value) =>
              setMonthForm((prev) => ({ ...prev, goalText: value }))
            }
            onChangeEventSummary={(_rowId, value) =>
              setMonthForm((prev) => ({ ...prev, eventSummary: value }))
            }
            pickerPanel={
              <PhrasePickerPanel
                target={
                  phrasePickerTarget?.mode === "single-month"
                    ? phrasePickerTarget
                    : null
                }
                planPhrases={planPhrases}
                planPhraseAbilityLinks={planPhraseAbilityLinks}
                onSelect={handleSelectPhrase}
                onClose={() => setPhrasePickerTarget(null)}
              />
            }
          />
        </div>

        <button onClick={() => void onSaveMonthPlan(monthForm)}>
          月計画を保存
        </button>
      </div>
    );
  }

  return <div style={subtleBoxStyle}>未対応の編集対象です。</div>;
}
