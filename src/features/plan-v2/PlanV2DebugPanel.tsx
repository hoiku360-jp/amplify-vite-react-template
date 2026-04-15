"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type TenantRecord = Schema["Tenant"]["type"];
type ClassroomRecord = Schema["Classroom"]["type"];
type SchoolAnnualPlanRecord = Schema["SchoolAnnualPlan"]["type"];
type SchoolAnnualAgeTargetRecord = Schema["SchoolAnnualAgeTarget"]["type"];
type ClassAnnualPlanRecord = Schema["ClassAnnualPlan"]["type"];
type ClassQuarterPlanRecord = Schema["ClassQuarterPlan"]["type"];
type ClassMonthPlanRecord = Schema["ClassMonthPlan"]["type"];

type ModelResultLike =
  | {
      errors?: ReadonlyArray<{ message?: string | null }> | null;
    }
  | null
  | undefined;

function s(v: unknown): string {
  return String(v ?? "").trim();
}

function byText(a?: string | null, b?: string | null) {
  return (a ?? "").localeCompare(b ?? "");
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

export default function PlanV2DebugPanel() {
  const client = useMemo(() => generateClient<Schema>(), []);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [selectedTenantId, setSelectedTenantId] =
    useState<string>("demo-tenant");

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
  const [monthPlans, setMonthPlans] = useState<ClassMonthPlanRecord[]>([]);

  const refreshAll = useCallback(
    async (tenantIdArg?: string, fiscalYearArg?: number) => {
      const tenantId = tenantIdArg ?? selectedTenantId;
      const fy = fiscalYearArg ?? fiscalYear;

      setLoading(true);
      setError("");

      try {
        const [
          tenantRes,
          classroomRes,
          schoolAnnualPlanRes,
          ageTargetRes,
          classAnnualPlanRes,
          quarterPlanRes,
          monthPlanRes,
        ] = await Promise.all([
          client.models.Tenant.list({ limit: 1000 }),
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
          client.models.ClassMonthPlan.list({
            filter: {
              tenantId: { eq: tenantId },
              fiscalYear: { eq: fy },
            },
            limit: 10000,
          }),
        ]);

        throwIfModelErrors(tenantRes);
        throwIfModelErrors(classroomRes);
        throwIfModelErrors(schoolAnnualPlanRes);
        throwIfModelErrors(ageTargetRes);
        throwIfModelErrors(classAnnualPlanRes);
        throwIfModelErrors(quarterPlanRes);
        throwIfModelErrors(monthPlanRes);

        const nextTenants = [...(tenantRes.data ?? [])].sort((a, b) =>
          byText(a.tenantId, b.tenantId),
        );

        const nextClassrooms = [...(classroomRes.data ?? [])].sort((a, b) => {
          const age = byText(a.ageBand, b.ageBand);
          if (age !== 0) return age;
          return byText(a.name, b.name);
        });

        const nextSchoolPlans = [...(schoolAnnualPlanRes.data ?? [])].sort(
          (a, b) => Number(a.fiscalYear ?? 0) - Number(b.fiscalYear ?? 0),
        );

        const nextAgeTargets = [...(ageTargetRes.data ?? [])].sort((a, b) => {
          const aa = Number(a.sortOrder ?? 9999);
          const bb = Number(b.sortOrder ?? 9999);
          if (aa !== bb) return aa - bb;
          return byText(a.ageBand, b.ageBand);
        });

        const nextClassAnnualPlans = [...(classAnnualPlanRes.data ?? [])].sort(
          (a, b) => byText(a.title, b.title),
        );

        const nextQuarterPlans = [...(quarterPlanRes.data ?? [])].sort(
          (a, b) => Number(a.termNo ?? 0) - Number(b.termNo ?? 0),
        );

        const nextMonthPlans = [...(monthPlanRes.data ?? [])].sort((a, b) =>
          byText(a.monthKey, b.monthKey),
        );

        setTenants(nextTenants);
        setClassrooms(nextClassrooms);
        setSchoolAnnualPlans(nextSchoolPlans);
        setAgeTargets(nextAgeTargets);
        setClassAnnualPlans(nextClassAnnualPlans);
        setQuarterPlans(nextQuarterPlans);
        setMonthPlans(nextMonthPlans);

        if (!tenantId && nextTenants[0]?.tenantId) {
          setSelectedTenantId(nextTenants[0].tenantId);
        }
      } catch (error) {
        console.error(error);
        setError(getUnknownErrorMessage(error, "読み込みに失敗しました。"));
      } finally {
        setLoading(false);
      }
    },
    [client, fiscalYear, selectedTenantId],
  );

  useEffect(() => {
    void refreshAll(selectedTenantId, fiscalYear);
  }, [refreshAll, selectedTenantId, fiscalYear]);

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
      await refreshAll(tenantId, fiscalYear);
      setMessage(
        `デモ保育園を準備しました。tenant=${tenantId} / 新規クラス=${createdCount}件`,
      );
    } catch (error) {
      console.error(error);
      setError(
        getUnknownErrorMessage(error, "デモ保育園の準備に失敗しました。"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEnsureV2Template() {
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

      setMessage(
        `V2 年度テンプレートを準備しました。tenant=${selectedTenantId} / 年齢別=${result.data?.createdAgeTargetCount ?? 0}件 / クラス年計画=${result.data?.createdClassAnnualPlanCount ?? 0}件 / 期=${result.data?.createdQuarterPlanCount ?? 0}件 / 月=${result.data?.createdMonthPlanCount ?? 0}件`,
      );
    } catch (error) {
      console.error(error);
      setError(
        getUnknownErrorMessage(
          error,
          "V2 年度テンプレート生成に失敗しました。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const schoolAnnualPlan = schoolAnnualPlans[0];

  const ageTargetsByAge = useMemo(() => {
    const map = new Map<string, SchoolAnnualAgeTargetRecord>();
    for (const row of ageTargets) {
      map.set(s(row.ageBand), row);
    }
    return map;
  }, [ageTargets]);

  const classAnnualPlanByClassroomId = useMemo(() => {
    const map = new Map<string, ClassAnnualPlanRecord>();
    for (const row of classAnnualPlans) {
      map.set(row.classroomId, row);
    }
    return map;
  }, [classAnnualPlans]);

  const quarterPlansByAnnualId = useMemo(() => {
    const map = new Map<string, ClassQuarterPlanRecord[]>();
    for (const row of quarterPlans) {
      const key = row.classAnnualPlanId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => Number(a.termNo ?? 0) - Number(b.termNo ?? 0));
    }
    return map;
  }, [quarterPlans]);

  const monthPlansByQuarterId = useMemo(() => {
    const map = new Map<string, ClassMonthPlanRecord[]>();
    for (const row of monthPlans) {
      const key = row.classQuarterPlanId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => byText(a.monthKey, b.monthKey));
    }
    return map;
  }, [monthPlans]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>PLAN v2 確認</h2>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button onClick={() => void prepareDemoTenant()} disabled={loading}>
          デモ保育園を準備
        </button>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          tenant
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
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
          onClick={() => void handleEnsureV2Template()}
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
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          {selectedTenantId || "(tenant未選択)"}
        </div>

        <div style={{ marginBottom: 12, paddingLeft: 12 }}>
          <div style={{ fontWeight: 600 }}>
            保育所の年計画
            {schoolAnnualPlan ? `：${schoolAnnualPlan.title}` : "：未作成"}
          </div>

          {schoolAnnualPlan && (
            <div
              style={{ paddingLeft: 16, marginTop: 6, display: "grid", gap: 4 }}
            >
              {ageTargets.length === 0 ? (
                <div>年齢別年間方針がありません。</div>
              ) : (
                ageTargets.map((row) => (
                  <div key={row.id}>
                    {row.ageBand} 年間方針
                    {row.goalTextA ? ` / 目標: ${row.goalTextA}` : ""}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ fontWeight: 600, marginBottom: 8 }}>クラス一覧</div>

        <div style={{ display: "grid", gap: 10 }}>
          {classrooms.length === 0 ? (
            <div>クラスがありません。</div>
          ) : (
            classrooms.map((classroom) => {
              const ageTarget = ageTargetsByAge.get(s(classroom.ageBand));
              const annual = classAnnualPlanByClassroomId.get(classroom.id);
              const quarters = annual
                ? (quarterPlansByAnnualId.get(annual.id) ?? [])
                : [];

              return (
                <div
                  key={classroom.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: 10,
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {classroom.name}（{classroom.ageBand || "-"}）
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    年齢別年間方針: {ageTarget ? "あり" : "未作成"} /
                    クラス年計画: {annual ? "あり" : "未作成"}
                  </div>

                  {annual && (
                    <div
                      style={{
                        paddingLeft: 16,
                        marginTop: 8,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div>└ {annual.title}</div>

                      {quarters.map((quarter) => {
                        const months =
                          monthPlansByQuarterId.get(quarter.id) ?? [];
                        return (
                          <div key={quarter.id} style={{ paddingLeft: 16 }}>
                            <div>└ {quarter.title}</div>
                            <div
                              style={{
                                paddingLeft: 16,
                                display: "grid",
                                gap: 2,
                              }}
                            >
                              {months.length === 0 ? (
                                <div>月計画なし</div>
                              ) : (
                                months.map((month) => (
                                  <div key={month.id}>└ {month.title}</div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        ここでは V2 の骨格だけを確認します。週案・日案はまだ生成していません。
      </div>
    </div>
  );
}
