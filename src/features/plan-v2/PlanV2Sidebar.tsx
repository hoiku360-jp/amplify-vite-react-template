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
  tenant: TenantRecord;
  fiscalYear: number;
  navPath: TreeNode[];
  schoolAnnualPlan?: SchoolAnnualPlanRecord | null;
  ageTargets: SchoolAnnualAgeTargetRecord[];
  classrooms: ClassroomRecord[];
  classAnnualPlans: ClassAnnualPlanRecord[];
  quarterPlans: ClassQuarterPlanRecord[];
  monthPlans: ClassMonthPlanRecord[];
  onNavigate: (path: TreeNode[]) => void;
};

type NavItem = {
  node: TreeNode;
  label: string;
  meta?: string;
};

function textOr(value: string | null | undefined, fallback: string): string {
  const v = s(value);
  return v.length > 0 ? v : fallback;
}

export default function PlanV2Sidebar(props: Props) {
  const {
    tenant,
    fiscalYear,
    navPath,
    schoolAnnualPlan,
    ageTargets,
    classrooms,
    classAnnualPlans,
    quarterPlans,
    monthPlans,
    onNavigate,
  } = props;

  const safeTenantId = textOr(tenant.tenantId, "");
  const rootNode: TreeNode = { kind: "tenant", tenantId: safeTenantId };
  const currentPath = navPath.length > 0 ? navPath : [rootNode];
  const currentNode = currentPath[currentPath.length - 1];
  const currentKey = nodeKey(currentNode);

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

  function labelForNode(node: TreeNode): string {
    switch (node.kind) {
      case "tenant":
        return textOr(tenant.name, tenant.tenantId);

      case "schoolAnnualPlan":
        return textOr(schoolAnnualPlan?.title, "保育所の年計画");

      case "ageTarget": {
        const row = ageTargets.find((x) => x.id === node.id);
        return row ? `${textOr(row.ageBand, "-")} 年間方針` : "年齢別年間方針";
      }

      case "classroom": {
        const row = classrooms.find((x) => x.id === node.id);
        return row ? `${textOr(row.name, "クラス")}（${textOr(row.ageBand, "-")}）` : "クラス";
      }

      case "classAnnualPlan": {
        const row = classAnnualPlans.find((x) => x.id === node.id);
        return textOr(row?.title, "クラス年計画");
      }

      case "quarter": {
        const row = quarterPlans.find((x) => x.id === node.id);
        return textOr(row?.title, "期計画");
      }

      case "month": {
        const row = monthPlans.find((x) => x.id === node.id);
        return textOr(row?.title, "月計画");
      }

      default:
        return "";
    }
  }

  function childrenOf(node: TreeNode): NavItem[] {
    switch (node.kind) {
      case "tenant": {
        const items: NavItem[] = [];

        if (schoolAnnualPlan) {
          items.push({
            node: { kind: "schoolAnnualPlan", id: schoolAnnualPlan.id },
            label: textOr(schoolAnnualPlan.title, "保育所の年計画"),
            meta: "保育所の年計画",
          });
        }

        for (const classroom of sortedClassrooms) {
          items.push({
            node: { kind: "classroom", id: classroom.id },
            label: `${textOr(classroom.name, "クラス")}（${textOr(classroom.ageBand, "-")}）`,
            meta: "クラス",
          });
        }

        return items;
      }

      case "schoolAnnualPlan":
        return sortedAgeTargets.map((row) => ({
          node: { kind: "ageTarget", id: row.id },
          label: `${textOr(row.ageBand, "-")} 年間方針`,
          meta: row.goalTextA ? `目標: ${row.goalTextA}` : undefined,
        }));

      case "ageTarget":
        return [];

      case "classroom": {
        const annual = annualByClassroomId.get(node.id);
        if (!annual) return [];
        return [
          {
            node: { kind: "classAnnualPlan", id: annual.id },
            label: textOr(annual.title, "クラス年計画"),
            meta: "クラス年計画",
          },
        ];
      }

      case "classAnnualPlan": {
        const children = quarterByAnnualId.get(node.id) ?? [];
        return children.map((row) => ({
          node: { kind: "quarter", id: row.id },
          label: textOr(row.title, "期計画"),
          meta: `term=${row.termNo ?? "-"}`,
        }));
      }

      case "quarter": {
        const children = monthByQuarterId.get(node.id) ?? [];
        return children.map((row) => ({
          node: { kind: "month", id: row.id },
          label: textOr(row.title, "月計画"),
          meta: row.monthKey ?? undefined,
        }));
      }

      case "month":
        return [];

      default:
        return [];
    }
  }

  const items = childrenOf(currentNode);

  function goBack() {
    if (currentPath.length <= 1) return;
    onNavigate(currentPath.slice(0, -1));
  }

  function goToBreadcrumb(index: number) {
    onNavigate(currentPath.slice(0, index + 1));
  }

  function enterChild(node: TreeNode) {
    const last = currentPath[currentPath.length - 1];
    if (nodeKey(last) === nodeKey(node)) return;
    onNavigate([...currentPath, node]);
  }

  function breadcrumbButton(node: TreeNode, index: number): ReactNode {
    const isLast = index === currentPath.length - 1;
    return (
      <span key={`${nodeKey(node)}-${index}`}>
        <button
          onClick={() => goToBreadcrumb(index)}
          disabled={isLast}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: isLast ? "default" : "pointer",
            color: isLast ? "#111827" : "#2563eb",
            fontWeight: isLast ? 700 : 500,
          }}
        >
          {labelForNode(node)}
        </button>
        {!isLast ? (
          <span style={{ margin: "0 6px", color: "#6b7280" }}>{">"}</span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        background: "#ffffff",
      }}
    >
      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
        PLAN v2 ナビゲーション
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button onClick={goBack} disabled={currentPath.length <= 1}>
          ← 戻る
        </button>
        <div style={{ fontSize: 12, color: "#666" }}>年度: {fiscalYear}</div>
      </div>

      <div
        style={{
          marginBottom: 12,
          padding: 8,
          background: "#fafafa",
          border: "1px solid #eee",
          borderRadius: 6,
          fontSize: 13,
          lineHeight: 1.5,
          color: "#111827",
        }}
      >
        {currentPath.map((node, index) => breadcrumbButton(node, index))}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: 8,
              color: "#666",
              border: "1px dashed #ddd",
              borderRadius: 6,
            }}
          >
            この階層の下位項目はありません。
          </div>
        ) : (
          items.map((item) => {
            const active = nodeKey(item.node) === currentKey;
            return (
              <button
                key={nodeKey(item.node)}
                onClick={() => enterChild(item.node)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  background: active ? "#e8f0fe" : "#fff",
                  color: "#111827",
                  border: active ? "1px solid #93c5fd" : "1px solid #ddd",
                  borderRadius: 6,
                  boxShadow: active
                    ? "inset 0 0 0 1px rgba(37, 99, 235, 0.08)"
                    : "none",
                }}
              >
                <div
                  style={{
                    color: "#111827",
                    fontWeight: active ? 700 : 500,
                    lineHeight: 1.4,
                  }}
                >
                  {item.label}
                </div>

                {item.meta ? (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      color: "#6b7280",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.meta}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}