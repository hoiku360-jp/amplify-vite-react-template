// src/features/plan-v2/PlanV2Tree.tsx
"use client";

import type { ReactNode } from "react";
import {
  byText,
  nodeKey,
  s,
  type ClassAnnualPlanRecord,
  type ClassMonthPlanRecord,
  type ClassQuarterPlanRecord,
  type ClassroomRecord,
  type SchoolAnnualAgeTargetRecord,
  type SchoolAnnualPlanRecord,
  type TenantRecord,
  type TreeNode,
} from "./types";

type Props = {
  tenant?: TenantRecord | null;
  fiscalYear: number;
  selectedNode: TreeNode | null;
  schoolAnnualPlan?: SchoolAnnualPlanRecord | null;
  ageTargets: SchoolAnnualAgeTargetRecord[];
  classrooms: ClassroomRecord[];
  classAnnualPlans: ClassAnnualPlanRecord[];
  quarterPlans: ClassQuarterPlanRecord[];
  monthPlans: ClassMonthPlanRecord[];
  onSelectNode: (node: TreeNode) => void;
};

export default function PlanV2Tree(props: Props) {
  const {
    tenant,
    fiscalYear,
    selectedNode,
    schoolAnnualPlan,
    ageTargets,
    classrooms,
    classAnnualPlans,
    quarterPlans,
    monthPlans,
    onSelectNode,
  } = props;

  const selectedKey = nodeKey(selectedNode);

  const annualByClassroomId = new Map<string, ClassAnnualPlanRecord>();
  for (const row of classAnnualPlans) {
    annualByClassroomId.set(row.classroomId, row);
  }

  const quarterByAnnualId = new Map<string, ClassQuarterPlanRecord[]>();
  for (const row of quarterPlans) {
    const key = row.classAnnualPlanId;
    if (!quarterByAnnualId.has(key)) quarterByAnnualId.set(key, []);
    quarterByAnnualId.get(key)!.push(row);
  }
  for (const rows of quarterByAnnualId.values()) {
    rows.sort((a, b) => Number(a.termNo ?? 0) - Number(b.termNo ?? 0));
  }

  const monthByQuarterId = new Map<string, ClassMonthPlanRecord[]>();
  for (const row of monthPlans) {
    const key = row.classQuarterPlanId;
    if (!monthByQuarterId.has(key)) monthByQuarterId.set(key, []);
    monthByQuarterId.get(key)!.push(row);
  }
  for (const rows of monthByQuarterId.values()) {
    rows.sort((a, b) => byText(a.monthKey, b.monthKey));
  }

  const sortedAgeTargets = [...ageTargets].sort((a, b) => {
    const sa = Number(a.sortOrder ?? 9999);
    const sb = Number(b.sortOrder ?? 9999);
    if (sa !== sb) return sa - sb;
    return byText(a.ageBand, b.ageBand);
  });

  const sortedClassrooms = [...classrooms].sort((a, b) => {
    const age = byText(a.ageBand, b.ageBand);
    if (age !== 0) return age;
    return byText(a.name, b.name);
  });

  function item(node: TreeNode, label: string, depth = 0, meta?: string): ReactNode {
    const key = nodeKey(node);
    const active = key === selectedKey;

    return (
      <button
        key={key}
        onClick={() => onSelectNode(node)}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          marginBottom: 4,
          padding: "6px 8px",
          paddingLeft: 12 + depth * 16,
          background: active ? "#e8f0fe" : "#fff",
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
      >
        <div>{label}</div>
        {meta ? <div style={{ fontSize: 12, color: "#666" }}>{meta}</div> : null}
      </button>
    );
  }

  if (!tenant) {
    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        tenant が見つかりません。
      </div>
    );
  }

  const out: ReactNode[] = [];
  out.push(
    item(
      { kind: "tenant", tenantId: tenant.tenantId },
      tenant.name || tenant.tenantId,
      0,
      `tenant=${tenant.tenantId} / 年度=${fiscalYear}`
    )
  );

  if (schoolAnnualPlan) {
    out.push(
      item(
        { kind: "schoolAnnualPlan", id: schoolAnnualPlan.id },
        schoolAnnualPlan.title,
        1,
        "保育所の年計画"
      )
    );

    for (const target of sortedAgeTargets) {
      out.push(
        item(
          { kind: "ageTarget", id: target.id },
          `${target.ageBand} 年間方針`,
          2,
          s(target.goalTextA) ? `目標: ${target.goalTextA}` : undefined
        )
      );
    }
  }

  for (const classroom of sortedClassrooms) {
    out.push(
      item(
        { kind: "classroom", id: classroom.id },
        `${classroom.name}（${classroom.ageBand || "-"}）`,
        1,
        "クラス"
      )
    );

    const annual = annualByClassroomId.get(classroom.id);
    if (!annual) continue;

    out.push(
      item(
        { kind: "classAnnualPlan", id: annual.id },
        annual.title,
        2,
        "クラス年計画"
      )
    );

    const quarters = quarterByAnnualId.get(annual.id) ?? [];
    for (const quarter of quarters) {
      out.push(
        item(
          { kind: "quarter", id: quarter.id },
          quarter.title,
          3,
          `term=${quarter.termNo ?? "-"}`
        )
      );

      const months = monthByQuarterId.get(quarter.id) ?? [];
      for (const month of months) {
        out.push(
          item(
            { kind: "month", id: month.id },
            month.title,
            4,
            month.monthKey ?? undefined
          )
        );
      }
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
        PLAN v2 ツリー
      </div>
      <div>{out}</div>
    </div>
  );
}