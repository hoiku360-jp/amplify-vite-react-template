// src/features/plan/PlanEditor.tsx
"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  PLAN_LABELS,
  type DayProgramDraft,
  type DocTab,
  type EventDraft,
  type PlanFormState,
  type PlanRecord,
  type PlanType,
  type WeekAssignmentDraft,
} from "./types";

type Props = {
  selectedPlan?: PlanRecord;
  selectedClassroomName?: string;
  allPlans: PlanRecord[];

  planForm: PlanFormState;
  setPlanForm: Dispatch<SetStateAction<PlanFormState>>;

  docTab: DocTab;
  setDocTab: Dispatch<SetStateAction<DocTab>>;

  eventDrafts: EventDraft[];
  setEventDrafts: Dispatch<SetStateAction<EventDraft[]>>;

  weekDrafts: WeekAssignmentDraft[];
  setWeekDrafts: Dispatch<SetStateAction<WeekAssignmentDraft[]>>;

  dayDrafts: DayProgramDraft[];
  setDayDrafts: Dispatch<SetStateAction<DayProgramDraft[]>>;

  onSavePlan: () => void;
  onSaveEvents: () => void;
  onDeleteEvent: (id?: string) => void;

  onSaveWeekAssignments: () => void;
  onDeleteWeekAssignment: (id?: string) => void;

  onSaveDayPrograms: () => void;
  onDeleteDayProgram: (id?: string) => void;
};

export default function PlanEditor(props: Props) {
  const {
    selectedPlan,
    selectedClassroomName,
    allPlans,
    planForm,
    setPlanForm,
    docTab,
    setDocTab,
    eventDrafts,
    setEventDrafts,
    weekDrafts,
    setWeekDrafts,
    dayDrafts,
    setDayDrafts,
    onSavePlan,
    onSaveEvents,
    onDeleteEvent,
    onSaveWeekAssignments,
    onDeleteWeekAssignment,
    onSaveDayPrograms,
    onDeleteDayProgram,
  } = props;

  const editableLongText =
    selectedPlan?.planType === "YEAR" ||
    selectedPlan?.planType === "TERM" ||
    selectedPlan?.planType === "MONTH";

  const parentPlan = selectedPlan?.parentPlanId
    ? allPlans.find((p) => p.id === selectedPlan.parentPlanId)
    : undefined;

  return (
    <>
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        {!selectedPlan ? (
          <div>左のツリーから計画を選択してください。</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {selectedClassroomName || "-"} /{" "}
                {PLAN_LABELS[(selectedPlan.planType as PlanType) ?? "YEAR"]}
              </div>
              <h3 style={{ margin: "4px 0 0 0" }}>{selectedPlan.title}</h3>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label>
                タイトル
                <input
                  value={planForm.title}
                  onChange={(e) =>
                    setPlanForm((s) => ({ ...s, title: e.target.value }))
                  }
                  style={{ width: "100%" }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label>
                  periodStart
                  <input
                    type="date"
                    value={planForm.periodStart}
                    onChange={(e) =>
                      setPlanForm((s) => ({ ...s, periodStart: e.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </label>
                <label>
                  periodEnd
                  <input
                    type="date"
                    value={planForm.periodEnd}
                    onChange={(e) =>
                      setPlanForm((s) => ({ ...s, periodEnd: e.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </label>
              </div>

              {selectedPlan.planType === "WEEK" && (
                <label>
                  weekStartDate
                  <input
                    type="date"
                    value={planForm.weekStartDate}
                    onChange={(e) =>
                      setPlanForm((s) => ({ ...s, weekStartDate: e.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </label>
              )}

              {selectedPlan.planType === "DAY" && (
                <label>
                  targetDate
                  <input
                    type="date"
                    value={planForm.targetDate}
                    onChange={(e) =>
                      setPlanForm((s) => ({ ...s, targetDate: e.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </label>
              )}

              {editableLongText && (
                <>
                  {selectedPlan.planType === "YEAR" && (
                    <label>
                      保育所の基本方針
                      <textarea
                        rows={3}
                        value={planForm.schoolPolicy}
                        onChange={(e) =>
                          setPlanForm((s) => ({
                            ...s,
                            schoolPolicy: e.target.value,
                          }))
                        }
                        style={{ width: "100%" }}
                      />
                    </label>
                  )}

                  <label>
                    クラス対象年齢
                    <input
                      value={planForm.classAgeLabel}
                      onChange={(e) =>
                        setPlanForm((s) => ({
                          ...s,
                          classAgeLabel: e.target.value,
                        }))
                      }
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label>
                    目標
                    <textarea
                      rows={3}
                      value={planForm.goalText}
                      onChange={(e) =>
                        setPlanForm((s) => ({ ...s, goalText: e.target.value }))
                      }
                      style={{ width: "100%" }}
                    />
                  </label>

                  <div>
                    <div style={{ marginBottom: 4 }}>5領域（割合の仮入力）</div>
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
                          value={planForm.abilityHealth}
                          onChange={(e) =>
                            setPlanForm((s) => ({
                              ...s,
                              abilityHealth: e.target.value,
                            }))
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        人間関係
                        <input
                          type="number"
                          value={planForm.abilityHumanRelations}
                          onChange={(e) =>
                            setPlanForm((s) => ({
                              ...s,
                              abilityHumanRelations: e.target.value,
                            }))
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        環境
                        <input
                          type="number"
                          value={planForm.abilityEnvironment}
                          onChange={(e) =>
                            setPlanForm((s) => ({
                              ...s,
                              abilityEnvironment: e.target.value,
                            }))
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        言葉
                        <input
                          type="number"
                          value={planForm.abilityLanguage}
                          onChange={(e) =>
                            setPlanForm((s) => ({
                              ...s,
                              abilityLanguage: e.target.value,
                            }))
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                      <label>
                        表現
                        <input
                          type="number"
                          value={planForm.abilityExpression}
                          onChange={(e) =>
                            setPlanForm((s) => ({
                              ...s,
                              abilityExpression: e.target.value,
                            }))
                          }
                          style={{ width: "100%" }}
                        />
                      </label>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setDocTab("draft")}
                      style={{
                        background: docTab === "draft" ? "#e8f0fe" : "#fff",
                      }}
                    >
                      ドラフト
                    </button>
                    <button
                      onClick={() => setDocTab("final")}
                      style={{
                        background: docTab === "final" ? "#e8f0fe" : "#fff",
                      }}
                    >
                      計画書
                    </button>
                  </div>

                  {docTab === "draft" ? (
                    <label>
                      draftText
                      <textarea
                        rows={8}
                        value={planForm.draftText}
                        onChange={(e) =>
                          setPlanForm((s) => ({ ...s, draftText: e.target.value }))
                        }
                        style={{ width: "100%" }}
                      />
                    </label>
                  ) : (
                    <label>
                      finalText
                      <textarea
                        rows={8}
                        value={planForm.finalText}
                        onChange={(e) =>
                          setPlanForm((s) => ({ ...s, finalText: e.target.value }))
                        }
                        style={{ width: "100%" }}
                      />
                    </label>
                  )}

                  <label>
                    aiSuggestedText（AI出力の置き場）
                    <textarea
                      rows={5}
                      value={planForm.aiSuggestedText}
                      onChange={(e) =>
                        setPlanForm((s) => ({
                          ...s,
                          aiSuggestedText: e.target.value,
                        }))
                      }
                      style={{ width: "100%" }}
                    />
                  </label>

                  <label>
                    status
                    <select
                      value={planForm.status}
                      onChange={(e) =>
                        setPlanForm((s) => ({ ...s, status: e.target.value }))
                      }
                      style={{ width: "100%" }}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="REVIEWED">REVIEWED</option>
                      <option value="FINAL">FINAL</option>
                    </select>
                  </label>
                </>
              )}

              <div>
                <button onClick={onSavePlan}>Planを保存</button>
              </div>
            </div>

            {(selectedPlan.planType === "YEAR" ||
              selectedPlan.planType === "TERM" ||
              selectedPlan.planType === "MONTH") && (
              <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <strong>行事</strong>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() =>
                        setEventDrafts((rows) => [
                          ...rows,
                          {
                            label: "",
                            eventMonth: "",
                            eventDate: "",
                            sortOrder: String(rows.length + 1),
                          },
                        ])
                      }
                    >
                      行を追加
                    </button>
                    <button onClick={onSaveEvents}>行事を保存</button>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {eventDrafts.map((row, idx) => (
                    <div
                      key={row.id ?? `new-event-${idx}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 100px 160px 100px 80px",
                        gap: 8,
                      }}
                    >
                      <input
                        placeholder="行事名"
                        value={row.label}
                        onChange={(e) =>
                          setEventDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, label: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        type="number"
                        placeholder="月"
                        value={row.eventMonth}
                        onChange={(e) =>
                          setEventDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, eventMonth: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        type="date"
                        value={row.eventDate}
                        onChange={(e) =>
                          setEventDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, eventDate: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        type="number"
                        placeholder="sort"
                        value={row.sortOrder}
                        onChange={(e) =>
                          setEventDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, sortOrder: e.target.value } : x
                            )
                          )
                        }
                      />
                      <button
                        onClick={() =>
                          row.id
                            ? onDeleteEvent(row.id)
                            : setEventDrafts((rows) =>
                                rows.filter((_, i) => i !== idx)
                              )
                        }
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPlan.planType === "WEEK" && (
              <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <strong>週案: 日別 Practice</strong>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() =>
                        setWeekDrafts((rows) => [
                          ...rows,
                          {
                            targetDate: "",
                            practiceCodeId: "",
                            note: "",
                            sortOrder: String(rows.length + 1),
                          },
                        ])
                      }
                    >
                      行を追加
                    </button>
                    <button onClick={onSaveWeekAssignments}>週案を保存</button>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {weekDrafts.map((row, idx) => (
                    <div
                      key={row.id ?? `new-week-${idx}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 180px 1fr 80px 80px",
                        gap: 8,
                      }}
                    >
                      <input
                        type="date"
                        value={row.targetDate}
                        onChange={(e) =>
                          setWeekDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, targetDate: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        placeholder="PracticeCode"
                        value={row.practiceCodeId}
                        onChange={(e) =>
                          setWeekDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx
                                ? { ...x, practiceCodeId: e.target.value }
                                : x
                            )
                          )
                        }
                      />
                      <input
                        placeholder="メモ"
                        value={row.note}
                        onChange={(e) =>
                          setWeekDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, note: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        type="number"
                        value={row.sortOrder}
                        onChange={(e) =>
                          setWeekDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, sortOrder: e.target.value } : x
                            )
                          )
                        }
                      />
                      <button
                        onClick={() =>
                          row.id
                            ? onDeleteWeekAssignment(row.id)
                            : setWeekDrafts((rows) =>
                                rows.filter((_, i) => i !== idx)
                              )
                        }
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPlan.planType === "DAY" && (
              <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <strong>日案: Regular / Planned</strong>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() =>
                        setDayDrafts((rows) => [
                          ...rows,
                          {
                            programType: "REGULAR",
                            title: "",
                            startTime: "",
                            endTime: "",
                            practiceCodeId: "",
                            note: "",
                            sortOrder: String(rows.length + 1),
                          },
                        ])
                      }
                    >
                      Regular追加
                    </button>
                    <button
                      onClick={() =>
                        setDayDrafts((rows) => [
                          ...rows,
                          {
                            programType: "PLANNED",
                            title: "",
                            startTime: "",
                            endTime: "",
                            practiceCodeId: "",
                            note: "",
                            sortOrder: String(rows.length + 1),
                          },
                        ])
                      }
                    >
                      Planned追加
                    </button>
                    <button onClick={onSaveDayPrograms}>日案を保存</button>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {dayDrafts.map((row, idx) => (
                    <div
                      key={row.id ?? `new-day-${idx}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "110px 1.2fr 120px 120px 180px 1fr 80px",
                        gap: 8,
                      }}
                    >
                      <select
                        value={row.programType}
                        onChange={(e) =>
                          setDayDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    programType: e.target.value as
                                      | "REGULAR"
                                      | "PLANNED",
                                  }
                                : x
                            )
                          )
                        }
                      >
                        <option value="REGULAR">REGULAR</option>
                        <option value="PLANNED">PLANNED</option>
                      </select>
                      <input
                        placeholder="タイトル"
                        value={row.title}
                        onChange={(e) =>
                          setDayDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, title: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        type="time"
                        step="1"
                        value={row.startTime}
                        onChange={(e) =>
                          setDayDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, startTime: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        type="time"
                        step="1"
                        value={row.endTime}
                        onChange={(e) =>
                          setDayDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, endTime: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        placeholder="PracticeCode"
                        value={row.practiceCodeId}
                        onChange={(e) =>
                          setDayDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx
                                ? { ...x, practiceCodeId: e.target.value }
                                : x
                            )
                          )
                        }
                      />
                      <input
                        placeholder="メモ"
                        value={row.note}
                        onChange={(e) =>
                          setDayDrafts((rows) =>
                            rows.map((x, i) =>
                              i === idx ? { ...x, note: e.target.value } : x
                            )
                          )
                        }
                      />
                      <button
                        onClick={() =>
                          row.id
                            ? onDeleteDayProgram(row.id)
                            : setDayDrafts((rows) =>
                                rows.filter((_, i) => i !== idx)
                              )
                        }
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          上位計画参照 / AI枠
        </div>

        {parentPlan ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <strong>
                {PLAN_LABELS[(parentPlan.planType as PlanType) ?? "YEAR"]}
              </strong>
            </div>
            <div>{parentPlan.title}</div>

            {parentPlan.goalText && (
              <div>
                <div style={{ fontSize: 12, color: "#666" }}>目標</div>
                <div>{parentPlan.goalText}</div>
              </div>
            )}

            {parentPlan.finalText && (
              <div>
                <div style={{ fontSize: 12, color: "#666" }}>計画書</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{parentPlan.finalText}</div>
              </div>
            )}
          </div>
        ) : (
          <div>上位計画なし</div>
        )}

        <hr style={{ margin: "16px 0" }} />

        <div style={{ display: "grid", gap: 8 }}>
          <strong>AI補助（次段階）</strong>
          <div style={{ fontSize: 14, color: "#666" }}>
            次に、draftText を Lambda / Bedrock に送り、
            aiSuggestedText に返す Mutation を追加します。
          </div>
        </div>
      </div>
    </>
  );
}