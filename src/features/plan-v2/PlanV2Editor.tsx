"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  emptyClassAnnualPlanForm,
  emptyClassroomForm,
  emptyMonthPlanForm,
  emptyQuarterPlanForm,
  emptySchoolAnnualPlanForm,
  nodeKey,
  toAbilityFormA,
  toClassAnnualPlanForm,
  toClassroomForm,
  toMonthPlanForm,
  toQuarterPlanForm,
  toSchoolAnnualPlanForm,
  type AbilityForm,
  type ClassAnnualPlanForm,
  type ClassAnnualPlanRecord,
  type ClassMonthPlanRecord,
  type ClassQuarterPlanRecord,
  type ClassroomForm,
  type ClassroomRecord,
  type MonthEventRecord,
  type MonthPlanForm,
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

  classroomCount: number;
  ageTargetCount: number;
  classAnnualPlanCount: number;

  onSaveSchoolAnnualPlan: (form: SchoolAnnualPlanForm) => Promise<void>;
  onSaveSchoolAnnualBundle: (
    planForm: SchoolAnnualPlanForm,
    ageRows: Array<{ id: string; form: AbilityForm }>
  ) => Promise<void>;
  onSaveAgeTarget: (form: AbilityForm) => Promise<void>;
  onSaveClassroom: (form: ClassroomForm) => Promise<void>;
  onSaveClassAnnualPlan: (form: ClassAnnualPlanForm) => Promise<void>;
  onSaveClassAnnualBundle: (
    annualForm: ClassAnnualPlanForm,
    quarterRows: Array<{ id: string; form: QuarterPlanForm }>
  ) => Promise<void>;
  onSaveQuarterPlan: (form: QuarterPlanForm) => Promise<void>;
  onSaveQuarterBundle: (
    quarterForm: QuarterPlanForm,
    monthRows: Array<{ id: string; form: MonthPlanForm }>
  ) => Promise<void>;
  onSaveMonthPlan: (form: MonthPlanForm) => Promise<void>;
};

type AnnualLikeForm =
  | AbilityForm
  | ClassAnnualPlanForm
  | QuarterPlanForm
  | MonthPlanForm;

function toScoreString(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function textOr(value: string | null | undefined, fallback = ""): string {
  return value ?? fallback;
}

function applySharedAgeTargetToAnnualForm(
  base: ClassAnnualPlanForm,
  shared?: SchoolAnnualAgeTargetRecord | null
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

function AnnualLikeFieldsLite<T extends AnnualLikeForm>(props: {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  showEventSummary?: boolean;
  lockGoalAndAbilities?: boolean;
}) {
  const {
    form,
    setForm,
    showEventSummary = false,
    lockGoalAndAbilities = false,
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
              setForm((s) =>
                "title" in s ? ({ ...s, title: e.target.value } as T) : s
              )
            }
            style={{ width: "100%" }}
          />
        </label>
      ) : null}

      {"periodStart" in form && "periodEnd" in form ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label>
            periodStart
            <input
              type="date"
              value={textOr(form.periodStart)}
              onChange={(e) =>
                setForm((s) =>
                  "periodStart" in s
                    ? ({ ...s, periodStart: e.target.value } as T)
                    : s
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
                setForm((s) =>
                  "periodEnd" in s
                    ? ({ ...s, periodEnd: e.target.value } as T)
                    : s
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
            setForm((s) => ({ ...s, ageBand: e.target.value }))
          }
          style={{ width: "100%" }}
        />
      </label>

      <label>
        目標
        <textarea
          rows={3}
          value={textOr(form.goalText)}
          disabled={lockGoalAndAbilities}
          onChange={(e) =>
            setForm((s) => ({ ...s, goalText: e.target.value }))
          }
          style={{ width: "100%", ...disabledStyle }}
        />
      </label>

      <div>
        <div style={{ marginBottom: 4 }}>5領域</div>
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
                setForm((s) => ({ ...s, abilityHealth: e.target.value }))
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
                setForm((s) => ({
                  ...s,
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
                setForm((s) => ({ ...s, abilityEnvironment: e.target.value }))
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
                setForm((s) => ({ ...s, abilityLanguage: e.target.value }))
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
                setForm((s) => ({ ...s, abilityExpression: e.target.value }))
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
              setForm((s) =>
                "eventSummary" in s
                  ? ({ ...s, eventSummary: e.target.value } as T)
                  : s
              )
            }
            style={{ width: "100%" }}
          />
        </label>
      ) : null}
    </>
  );
}

export default function PlanV2Editor(props: Props) {
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
    quarterChildren = [],
    quarterChildrenForClassroom = [],
    monthChildren = [],
    quarterEvents = [],
    selectedQuarterEvents = [],
    monthEvents = [],
    classroomCount,
    ageTargetCount,
    classAnnualPlanCount,
    onSaveSchoolAnnualBundle,
    onSaveAgeTarget,
    onSaveClassAnnualPlan,
    onSaveClassAnnualBundle,
    onSaveQuarterBundle,
    onSaveMonthPlan,
  } = props;

  const [schoolForm, setSchoolForm] = useState<SchoolAnnualPlanForm>(
    emptySchoolAnnualPlanForm()
  );
  const [schoolAgeTargetForms, setSchoolAgeTargetForms] = useState<
    Array<{ id: string; form: AbilityForm }>
  >([]);
  const [ageForm, setAgeForm] = useState<AbilityForm>(toAbilityFormA(null));
  const [, setClassroomForm] = useState<ClassroomForm>(
    emptyClassroomForm()
  );
  const [annualForm, setAnnualForm] = useState<ClassAnnualPlanForm>(
    emptyClassAnnualPlanForm()
  );
  const [classBundleAnnualForm, setClassBundleAnnualForm] =
    useState<ClassAnnualPlanForm>(emptyClassAnnualPlanForm());
  const [classBundleQuarterForms, setClassBundleQuarterForms] = useState<
    Array<{ id: string; form: QuarterPlanForm }>
  >([]);
  const [quarterBundleForm, setQuarterBundleForm] = useState<QuarterPlanForm>(
    emptyQuarterPlanForm()
  );
  const [quarterMonthForms, setQuarterMonthForms] = useState<
    Array<{ id: string; form: MonthPlanForm }>
  >([]);
  const [monthForm, setMonthForm] = useState<MonthPlanForm>(
    emptyMonthPlanForm()
  );

  useEffect(() => {
    setSchoolForm(toSchoolAnnualPlanForm(schoolAnnualPlan));
  }, [schoolAnnualPlan?.id]);

  useEffect(() => {
    const rows = [...schoolAgeTargets]
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
    setSchoolAgeTargetForms(rows);
  }, [schoolAgeTargets]);

  useEffect(() => {
    setAgeForm(toAbilityFormA(ageTarget));
  }, [ageTarget?.id]);

  useEffect(() => {
    setClassroomForm(toClassroomForm(classroom));
  }, [classroom?.id]);

  useEffect(() => {
    setAnnualForm(toClassAnnualPlanForm(classAnnualPlan));
  }, [classAnnualPlan?.id]);

  useEffect(() => {
    setClassBundleAnnualForm(toClassAnnualPlanForm(classAnnualPlanForClassroom));
  }, [classAnnualPlanForClassroom?.id]);

  useEffect(() => {
    const rows = [...quarterChildrenForClassroom]
      .sort((a, b) => Number(a.termNo ?? 0) - Number(b.termNo ?? 0))
      .map((row) => ({
        id: row.id,
        form: toQuarterPlanForm(
          row,
          quarterEvents.filter((x) => x.classQuarterPlanId === row.id)
        ),
      }));
    setClassBundleQuarterForms(rows);
  }, [quarterChildrenForClassroom, quarterEvents]);

  useEffect(() => {
    setQuarterBundleForm(toQuarterPlanForm(quarterPlan, selectedQuarterEvents));
  }, [quarterPlan?.id, selectedQuarterEvents]);

  useEffect(() => {
    const rows = [...monthChildren]
      .sort((a, b) =>
        String(a.monthKey ?? "").localeCompare(String(b.monthKey ?? ""))
      )
      .map((row) => ({
        id: row.id,
        form: toMonthPlanForm(
          row,
          monthEvents.filter((x) => x.classMonthPlanId === row.id)
        ),
      }));
    setQuarterMonthForms(rows);
  }, [monthChildren, monthEvents]);

  useEffect(() => {
    const selectedMonthEvents = monthPlan
      ? monthEvents.filter((x) => x.classMonthPlanId === monthPlan.id)
      : [];
    setMonthForm(toMonthPlanForm(monthPlan, selectedMonthEvents));
  }, [monthPlan?.id, monthEvents]);

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
        sharedAgeTargetForSelectedClassroom
      ),
    [classBundleAnnualForm, sharedAgeTargetForSelectedClassroom]
  );

  const annualSharedForm = useMemo(
    () =>
      applySharedAgeTargetToAnnualForm(
        annualForm,
        sharedAgeTargetForSelectedAnnualPlan
      ),
    [annualForm, sharedAgeTargetForSelectedAnnualPlan]
  );

  const lockClassroomAnnualA = !!sharedAgeTargetForSelectedClassroom;
  const lockAnnualA = !!sharedAgeTargetForSelectedAnnualPlan;

  if (!selectedNode) {
    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        左のサイドバーから選択してください。
      </div>
    );
  }

  const currentKey = nodeKey(selectedNode);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      {selectedNode.kind === "tenant" && tenant ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>保育所</div>
            <h3 style={{ margin: "4px 0 0 0" }}>{textOr(tenant.name, tenant.tenantId)}</h3>
            <div style={{ fontSize: 12, color: "#666" }}>
              tenantId={tenant.tenantId}
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div>クラス数: {classroomCount}</div>
            <div>年齢別年間方針数: {ageTargetCount}</div>
            <div>クラス年計画数: {classAnnualPlanCount}</div>
          </div>

          <div style={{ fontSize: 14, color: "#666" }}>
            まずは「年度テンプレート生成」で、保育所の年計画、年齢別年間方針、
            各クラス年計画、4期、12か月を不足分だけ準備します。
          </div>
        </div>
      ) : null}

      {selectedNode.kind === "schoolAnnualPlan" && schoolAnnualPlan ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>保育所の年計画</div>
            <h3 style={{ margin: "4px 0 0 0" }}>{textOr(schoolAnnualPlan.title)}</h3>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
              background: "#fafafa",
            }}
          >
            <div style={{ fontWeight: 700 }}>① 保育所年計画</div>

            <label>
              タイトル
              <input
                value={textOr(schoolForm.title)}
                onChange={(e) =>
                  setSchoolForm((s) => ({ ...s, title: e.target.value }))
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
                  value={textOr(schoolForm.periodStart)}
                  onChange={(e) =>
                    setSchoolForm((s) => ({
                      ...s,
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
                  value={textOr(schoolForm.periodEnd)}
                  onChange={(e) =>
                    setSchoolForm((s) => ({ ...s, periodEnd: e.target.value }))
                  }
                  style={{ width: "100%" }}
                />
              </label>
            </div>

            <label>
              保育所の基本方針
              <textarea
                rows={4}
                value={textOr(schoolForm.schoolPolicy)}
                onChange={(e) =>
                  setSchoolForm((s) => ({
                    ...s,
                    schoolPolicy: e.target.value,
                  }))
                }
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
            }}
          >
            <div style={{ fontWeight: 700 }}>
              ②〜④ 年齢別年間方針（比較しながら検討）
            </div>

            {schoolAgeTargetForms.length === 0 ? (
              <div>年齢別年間方針がありません。</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 1100,
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        対象年齢
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        目標(A)
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        健康
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        人間関係
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        環境
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        言葉
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        表現
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolAgeTargetForms.map((row, idx) => (
                      <tr key={row.id}>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            whiteSpace: "nowrap",
                            fontWeight: 600,
                          }}
                        >
                          {textOr(row.form.ageBand)}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                          <textarea
                            rows={3}
                            value={textOr(row.form.goalText)}
                            onChange={(e) =>
                              setSchoolAgeTargetForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: { ...x.form, goalText: e.target.value },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: "100%", minWidth: 260 }}
                          />
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            type="number"
                            value={textOr(row.form.abilityHealth)}
                            onChange={(e) =>
                              setSchoolAgeTargetForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityHealth: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            type="number"
                            value={textOr(row.form.abilityHumanRelations)}
                            onChange={(e) =>
                              setSchoolAgeTargetForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityHumanRelations: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            type="number"
                            value={textOr(row.form.abilityEnvironment)}
                            onChange={(e) =>
                              setSchoolAgeTargetForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityEnvironment: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            type="number"
                            value={textOr(row.form.abilityLanguage)}
                            onChange={(e) =>
                              setSchoolAgeTargetForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityLanguage: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                          <input
                            type="number"
                            value={textOr(row.form.abilityExpression)}
                            onChange={(e) =>
                              setSchoolAgeTargetForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityExpression: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <button
                onClick={() =>
                  void onSaveSchoolAnnualBundle(schoolForm, schoolAgeTargetForms)
                }
              >
                保育所の年計画を保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedNode.kind === "ageTarget" && ageTarget ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>年齢別年間方針</div>
            <h3 style={{ margin: "4px 0 0 0" }}>{textOr(ageTarget.ageBand)} 年間方針</h3>
          </div>

          <AnnualLikeFieldsLite form={ageForm} setForm={setAgeForm} />

          <div>
            <button onClick={() => void onSaveAgeTarget(ageForm)}>
              年齢別年間方針を保存
            </button>
          </div>
        </div>
      ) : null}

      {selectedNode.kind === "classroom" && classroom ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>クラスの年計画</div>
            <h3 style={{ margin: "4px 0 0 0" }}>
              {textOr(classroom.name)}（{textOr(classroom.ageBand, "-")}）
            </h3>
          </div>

          {!classAnnualPlanForClassroom ? (
            <div>このクラスの年計画はまだありません。</div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 8,
                  background: "#fafafa",
                }}
              >
                <div style={{ fontWeight: 700 }}>① クラスの年計画</div>

                <AnnualLikeFieldsLite
                  form={classBundleAnnualSharedForm}
                  setForm={setClassBundleAnnualForm}
                  lockGoalAndAbilities={lockClassroomAnnualA}
                />

                <div style={{ fontSize: 12, color: "#666" }}>
                  ※ 目標(A) と 5領域(A) は、保育所年計画の「年齢別年間方針」の同一年齢の内容を表示しています。
                  {lockClassroomAnnualA
                    ? " ここでは編集せず、保育所年計画側で変更してください。"
                    : " 同一年齢の年齢別年間方針が未設定のため、現状はクラス側の値を表示しています。"}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 8,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  ②〜⑤ 四半期比較（1Q〜4Q）
                </div>

                {classBundleQuarterForms.length === 0 ? (
                  <div>期計画がありません。</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        minWidth: 1400,
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr style={{ textAlign: "left" }}>
                          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            期
                          </th>
                          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            目標(B)
                          </th>
                          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            健康
                          </th>
                          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            人間関係
                          </th>
                          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            環境
                          </th>
                          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            言葉
                          </th>
                          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            表現
                          </th>
                          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                            行事
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {classBundleQuarterForms.map((row, idx) => (
                          <tr key={row.id}>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid #f0f0f0",
                                whiteSpace: "nowrap",
                                fontWeight: 600,
                                verticalAlign: "top",
                              }}
                            >
                              {textOr(row.form.title)}
                            </td>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid #f0f0f0",
                                verticalAlign: "top",
                              }}
                            >
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
                                        : x
                                    )
                                  )
                                }
                                style={{ width: "100%", minWidth: 220 }}
                              />
                            </td>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid #f0f0f0",
                                verticalAlign: "top",
                              }}
                            >
                              <input
                                type="number"
                                value={textOr(row.form.abilityHealth)}
                                onChange={(e) =>
                                  setClassBundleQuarterForms((rows) =>
                                    rows.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            form: {
                                              ...x.form,
                                              abilityHealth: e.target.value,
                                            },
                                          }
                                        : x
                                    )
                                  )
                                }
                                style={{ width: 90 }}
                              />
                            </td>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid #f0f0f0",
                                verticalAlign: "top",
                              }}
                            >
                              <input
                                type="number"
                                value={textOr(row.form.abilityHumanRelations)}
                                onChange={(e) =>
                                  setClassBundleQuarterForms((rows) =>
                                    rows.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            form: {
                                              ...x.form,
                                              abilityHumanRelations:
                                                e.target.value,
                                            },
                                          }
                                        : x
                                    )
                                  )
                                }
                                style={{ width: 90 }}
                              />
                            </td>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid #f0f0f0",
                                verticalAlign: "top",
                              }}
                            >
                              <input
                                type="number"
                                value={textOr(row.form.abilityEnvironment)}
                                onChange={(e) =>
                                  setClassBundleQuarterForms((rows) =>
                                    rows.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            form: {
                                              ...x.form,
                                              abilityEnvironment: e.target.value,
                                            },
                                          }
                                        : x
                                    )
                                  )
                                }
                                style={{ width: 90 }}
                              />
                            </td>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid #f0f0f0",
                                verticalAlign: "top",
                              }}
                            >
                              <input
                                type="number"
                                value={textOr(row.form.abilityLanguage)}
                                onChange={(e) =>
                                  setClassBundleQuarterForms((rows) =>
                                    rows.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            form: {
                                              ...x.form,
                                              abilityLanguage: e.target.value,
                                            },
                                          }
                                        : x
                                    )
                                  )
                                }
                                style={{ width: 90 }}
                              />
                            </td>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid #f0f0f0",
                                verticalAlign: "top",
                              }}
                            >
                              <input
                                type="number"
                                value={textOr(row.form.abilityExpression)}
                                onChange={(e) =>
                                  setClassBundleQuarterForms((rows) =>
                                    rows.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            form: {
                                              ...x.form,
                                              abilityExpression: e.target.value,
                                            },
                                          }
                                        : x
                                    )
                                  )
                                }
                                style={{ width: 90 }}
                              />
                            </td>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid #f0f0f0",
                                verticalAlign: "top",
                              }}
                            >
                              <textarea
                                rows={4}
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
                                        : x
                                    )
                                  )
                                }
                                style={{ width: "100%", minWidth: 220 }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div>
                  <button
                    onClick={() =>
                      void onSaveClassAnnualBundle(
                        classBundleAnnualSharedForm,
                        classBundleQuarterForms
                      )
                    }
                  >
                    クラスの年計画を保存
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      {selectedNode.kind === "classAnnualPlan" && classAnnualPlan ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>クラス年計画</div>
            <h3 style={{ margin: "4px 0 0 0" }}>{textOr(classAnnualPlan.title)}</h3>
          </div>

          <AnnualLikeFieldsLite
            form={annualSharedForm}
            setForm={setAnnualForm}
            lockGoalAndAbilities={lockAnnualA}
          />

          <div style={{ fontSize: 12, color: "#666" }}>
            ※ 目標(A) と 5領域(A) は、保育所年計画の「年齢別年間方針」の同一年齢の内容を表示しています。
            {lockAnnualA
              ? " ここでは編集せず、保育所年計画側で変更してください。"
              : " 同一年齢の年齢別年間方針が未設定のため、現状はクラス側の値を表示しています。"}
          </div>

          <div>
            <button onClick={() => void onSaveClassAnnualPlan(annualSharedForm)}>
              クラス年計画を保存
            </button>
          </div>

          <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
            <strong>この年計画の期一覧</strong>
            <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
              {quarterChildren.length === 0 ? (
                <div>期計画はまだありません。</div>
              ) : (
                quarterChildren.map((row) => <div key={row.id}>{textOr(row.title)}</div>)
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedNode.kind === "quarter" && quarterPlan ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>クラス期計画</div>
            <h3 style={{ margin: "4px 0 0 0" }}>{textOr(quarterPlan.title)}</h3>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
              background: "#fafafa",
            }}
          >
            <div style={{ fontWeight: 700 }}>① クラスの期計画</div>

            <AnnualLikeFieldsLite
              form={quarterBundleForm}
              setForm={setQuarterBundleForm}
              showEventSummary
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
            }}
          >
            <div style={{ fontWeight: 700 }}>
              ②〜④ 月比較（子どもの成長と月ごとの行事を比較しながら検討）
            </div>

            {quarterMonthForms.length === 0 ? (
              <div>月計画がありません。</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 1500,
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        月
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        目標(C)
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        健康
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        人間関係
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        環境
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        言葉
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        表現
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        行事
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarterMonthForms.map((row, idx) => (
                      <tr key={row.id}>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            whiteSpace: "nowrap",
                            fontWeight: 600,
                            verticalAlign: "top",
                          }}
                        >
                          {textOr(row.form.title)}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            verticalAlign: "top",
                          }}
                        >
                          <textarea
                            rows={3}
                            value={textOr(row.form.goalText)}
                            onChange={(e) =>
                              setQuarterMonthForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          goalText: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: "100%", minWidth: 220 }}
                          />
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            verticalAlign: "top",
                          }}
                        >
                          <input
                            type="number"
                            value={textOr(row.form.abilityHealth)}
                            onChange={(e) =>
                              setQuarterMonthForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityHealth: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            verticalAlign: "top",
                          }}
                        >
                          <input
                            type="number"
                            value={textOr(row.form.abilityHumanRelations)}
                            onChange={(e) =>
                              setQuarterMonthForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityHumanRelations: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            verticalAlign: "top",
                          }}
                        >
                          <input
                            type="number"
                            value={textOr(row.form.abilityEnvironment)}
                            onChange={(e) =>
                              setQuarterMonthForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityEnvironment: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            verticalAlign: "top",
                          }}
                        >
                          <input
                            type="number"
                            value={textOr(row.form.abilityLanguage)}
                            onChange={(e) =>
                              setQuarterMonthForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityLanguage: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            verticalAlign: "top",
                          }}
                        >
                          <input
                            type="number"
                            value={textOr(row.form.abilityExpression)}
                            onChange={(e) =>
                              setQuarterMonthForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          abilityExpression: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            verticalAlign: "top",
                          }}
                        >
                          <textarea
                            rows={4}
                            value={textOr(row.form.eventSummary)}
                            onChange={(e) =>
                              setQuarterMonthForms((rows) =>
                                rows.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        form: {
                                          ...x.form,
                                          eventSummary: e.target.value,
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            style={{ width: "100%", minWidth: 220 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <button
                onClick={() =>
                  void onSaveQuarterBundle(quarterBundleForm, quarterMonthForms)
                }
              >
                期計画を保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedNode.kind === "month" && monthPlan ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>クラス月計画</div>
            <h3 style={{ margin: "4px 0 0 0" }}>{textOr(monthPlan.title)}</h3>
          </div>

          <AnnualLikeFieldsLite
            form={monthForm}
            setForm={setMonthForm}
            showEventSummary
          />

          <div>
            <button onClick={() => void onSaveMonthPlan(monthForm)}>
              月計画を保存
            </button>
          </div>

          <div style={{ fontSize: 13, color: "#666" }}>
            次段階で、この月計画の下に週案・日案を接続します。
          </div>
        </div>
      ) : null}

      {currentKey === "" ? null : null}
    </div>
  );
}