// src/features/plan/PlanTree.tsx
"use client";

import {
  PLAN_LABELS,
  type ClassroomRecord,
  type PlanRecord,
  type PlanType,
} from "./types";

type Props = {
  classrooms: ClassroomRecord[];
  selectedClassroomId: string;
  classroomPlans: PlanRecord[];
  selectedPlanId: string;
  onSelectClassroom: (classroomId: string) => void;
  onSelectPlan: (planId: string) => void;
};

function byTextDate(a?: string | null, b?: string | null) {
  return (a ?? "").localeCompare(b ?? "");
}

export default function PlanTree(props: Props) {
  const {
    classrooms,
    selectedClassroomId,
    classroomPlans,
    selectedPlanId,
    onSelectClassroom,
    onSelectPlan,
  } = props;

  function renderTree(parentPlanId?: string, depth = 0): React.ReactNode {
    const children = classroomPlans
      .filter((p) => (p.parentPlanId ?? undefined) === parentPlanId)
      .sort((a, b) => {
        const t = byTextDate(a.periodStart, b.periodStart);
        if (t !== 0) return t;
        return (a.title ?? "").localeCompare(b.title ?? "");
      });

    return children.map((plan) => (
      <div key={plan.id}>
        <button
          onClick={() => onSelectPlan(plan.id)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            marginBottom: 4,
            padding: "6px 8px",
            paddingLeft: 12 + depth * 16,
            background: plan.id === selectedPlanId ? "#e8f0fe" : "#fff",
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
        >
          <div style={{ fontSize: 12, color: "#666" }}>
            {PLAN_LABELS[(plan.planType as PlanType) ?? "YEAR"]}
          </div>
          <div>{plan.title}</div>
        </button>
        {renderTree(plan.id, depth + 1)}
      </div>
    ));
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>クラス</div>
        <select
          value={selectedClassroomId}
          onChange={(e) => onSelectClassroom(e.target.value)}
          style={{ width: "100%" }}
        >
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
        計画ツリー
      </div>

      <div>{renderTree(undefined, 0)}</div>
    </div>
  );
}