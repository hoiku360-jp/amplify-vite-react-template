import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import PracticeImpactSection from "./PracticeImpactSection";
import {
  comparisonStatusLabel,
  emptyDomainCounts,
  formatDateTime,
  formatSharePercent,
  loadCheckActionReportBundle,
  loadClassrooms,
  todayYYYYMMDD,
  daysAgoYYYYMMDD,
  truncateText,
  type AbilityAggregateRow,
  type CheckActionReportBundle,
  type ChildAggregateRow,
  type DomainCounts,
  type EvidenceRow,
  type PracticeImpactRow,
} from "./reporting";

type Props = {
  owner: string;
  tenantId: string;
};

export default function AbilityDashboardPanel(props: Props) {
  const { tenantId } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [message, setMessage] = useState("");

  const [classrooms, setClassrooms] = useState<
    Array<Schema["Classroom"]["type"]>
  >([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const [fromDate, setFromDate] = useState(() => daysAgoYYYYMMDD(6));
  const [toDate, setToDate] = useState(() => todayYYYYMMDD());

  const [bundle, setBundle] = useState<CheckActionReportBundle | null>(null);

  const [domainCounts, setDomainCounts] =
    useState<DomainCounts>(emptyDomainCounts());
  const [abilityRows, setAbilityRows] = useState<AbilityAggregateRow[]>([]);
  const [childRows, setChildRows] = useState<ChildAggregateRow[]>([]);
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);
  const [practiceRows, setPracticeRows] = useState<PracticeImpactRow[]>([]);

  async function reloadClassrooms() {
    setLoadingClassrooms(true);
    setMessage("");

    try {
      const rows = await loadClassrooms(client, tenantId);
      setClassrooms(rows);

      if (!selectedClassroomId && rows.length > 0) {
        setSelectedClassroomId(rows[0].id);
      }

      if (rows.length === 0) {
        setMessage(`tenantId=${tenantId} の Classroom が見つかりません。`);
      }
    } catch (e) {
      console.error(e);
      setMessage(
        `Classroom 読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingClassrooms(false);
    }
  }

  useEffect(() => {
    reloadClassrooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function loadDashboard() {
    if (!selectedClassroomId) {
      setMessage("先にクラスを選択してください。");
      return;
    }

    if (fromDate > toDate) {
      setMessage("期間指定が不正です。fromDate は toDate 以下にしてください。");
      return;
    }

    setLoadingDashboard(true);
    setMessage("");

    try {
      const nextBundle = await loadCheckActionReportBundle(
        client,
        selectedClassroomId,
        fromDate,
        toDate,
      );

      setBundle(nextBundle);
      setDomainCounts(nextBundle.observation.domainCounts);
      setAbilityRows(nextBundle.observation.abilityRows);
      setChildRows(nextBundle.observation.childRows);
      setEvidenceRows(nextBundle.observation.evidenceRows.slice(0, 50));
      setPracticeRows(nextBundle.observation.practiceRows);

      setMessage(
        `読込完了: ObservationAbilityLink=${nextBundle.observation.abilityLinks.length}件 / ObservationRecord=${nextBundle.observation.observations.length}件`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `ダッシュボード読込エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    } finally {
      setLoadingDashboard(false);
    }
  }

  const selectedClassroom = classrooms.find(
    (x) => x.id === selectedClassroomId,
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          padding: 16,
          border: "1px solid #d0d7de",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>5領域ダッシュボード</h2>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <label>
            クラス
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              style={{ display: "block", marginTop: 6, width: "100%" }}
            >
              <option value="">選択してください</option>
              {classrooms.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            fromDate
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ display: "block", marginTop: 6, width: "100%" }}
            />
          </label>

          <label>
            toDate
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ display: "block", marginTop: 6, width: "100%" }}
            />
          </label>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button onClick={reloadClassrooms} disabled={loadingClassrooms}>
            {loadingClassrooms ? "クラス再読込中..." : "クラス再読込"}
          </button>

          <button
            onClick={loadDashboard}
            disabled={loadingDashboard || !selectedClassroomId}
          >
            {loadingDashboard ? "読込中..." : "ダッシュボード読込"}
          </button>
        </div>

        {selectedClassroom ? (
          <div style={{ marginTop: 12, color: "#555" }}>
            対象クラス: <b>{selectedClassroom.name}</b>
          </div>
        ) : null}

        {message ? (
          <div style={{ marginTop: 12, whiteSpace: "pre-wrap", color: "#444" }}>
            {message}
          </div>
        ) : null}
      </div>

      {bundle ? (
        <>
          <div
            style={{
              padding: 16,
              border: "1px solid #d0d7de",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              報告の背景（計画）
            </h3>

            <div style={{ display: "grid", gap: 10 }}>
              <PlanGoalCard
                label="年の目標 (A)"
                text={bundle.planContext.goalTextA}
              />
              <PlanGoalCard
                label="期の目標 (B)"
                text={bundle.planContext.goalTextB}
              />
              <PlanGoalCard
                label="月の目標 (C)"
                text={bundle.planContext.goalTextC}
              />
              <PlanGoalCard
                label="週の補足"
                text={bundle.planContext.goalTextWeek}
              />
            </div>

            <div style={{ marginTop: 12, color: "#555" }}>
              定量比較の基準:{" "}
              <b>
                {bundle.planContext.planBasis === "WEEK"
                  ? "週計画(D)"
                  : bundle.planContext.planBasis === "MONTH"
                    ? "月計画(C)"
                    : "計画値なし"}
              </b>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              border: "1px solid #d0d7de",
              borderRadius: 8,
              background: "#f8fafc",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>5領域の観察件数</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
                gap: 10,
              }}
            >
              <StatCard label="健康" value={domainCounts.health} />
              <StatCard label="人間関係" value={domainCounts.humanRelations} />
              <StatCard label="環境" value={domainCounts.environment} />
              <StatCard label="言葉" value={domainCounts.language} />
              <StatCard label="表現" value={domainCounts.expression} />
            </div>
          </div>

          <div
            style={{
              padding: 16,
              border: "1px solid #d0d7de",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              5領域の計画値と実績値
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 760,
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>領域</th>
                    <th style={thStyle}>plan</th>
                    <th style={thStyle}>actual</th>
                    <th style={thStyle}>plan比率</th>
                    <th style={thStyle}>actual比率</th>
                    <th style={thStyle}>判定</th>
                  </tr>
                </thead>
                <tbody>
                  {bundle.comparison.rows.map((row) => (
                    <tr key={row.domainKey}>
                      <td style={tdStyle}>{row.domainLabel}</td>
                      <td style={tdStyle}>{row.plannedValue}</td>
                      <td style={tdStyle}>{row.actualValue}</td>
                      <td style={tdStyle}>
                        {formatSharePercent(row.plannedShare)}
                      </td>
                      <td style={tdStyle}>
                        {formatSharePercent(row.actualShare)}
                      </td>
                      <td style={tdStyle}>
                        {comparisonStatusLabel(row.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {bundle.comparison.highlights.map((item, index) => (
                <div
                  key={`${item}_${index}`}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <PracticeImpactSection rows={practiceRows} />

          <div
            style={{
              padding: 16,
              border: "1px solid #d0d7de",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>考察</h3>

            <ReflectionBlock
              title="整合していた点"
              items={bundle.reflection.alignmentNotes}
            />
            <ReflectionBlock
              title="乖離していた点"
              items={bundle.reflection.gapNotes}
            />
            <ReflectionBlock
              title="次の action"
              items={bundle.reflection.nextActionNotes}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "minmax(340px, 1fr) minmax(280px, 360px)",
            }}
          >
            <div
              style={{
                padding: 16,
                border: "1px solid #d0d7de",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>ability別件数</h3>

              {abilityRows.length === 0 ? (
                <div style={{ color: "#666" }}>データがありません。</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 520,
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={thStyle}>abilityCode</th>
                        <th style={thStyle}>abilityName</th>
                        <th style={thStyle}>domain</th>
                        <th style={thStyle}>count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abilityRows.map((row) => (
                        <tr key={`${row.abilityCode}_${row.abilityName}`}>
                          <td style={tdStyle}>{row.abilityCode}</td>
                          <td style={tdStyle}>{row.abilityName}</td>
                          <td style={tdStyle}>{row.domain}</td>
                          <td style={tdStyle}>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div
              style={{
                padding: 16,
                border: "1px solid #d0d7de",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>子ども別件数</h3>

              {childRows.length === 0 ? (
                <div style={{ color: "#666" }}>データがありません。</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {childRows.map((row) => (
                    <div
                      key={row.childName}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: 10,
                        borderRadius: 8,
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span>{row.childName}</span>
                      <b>{row.count}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: 16,
              border: "1px solid #d0d7de",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              最近の観察エビデンス
            </h3>

            {evidenceRows.length === 0 ? (
              <div style={{ color: "#666" }}>データがありません。</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {evidenceRows.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        color: "#555",
                        fontSize: 12,
                      }}
                    >
                      <span>{formatDateTime(row.recordedAt)}</span>
                      <span>/ {row.childName}</span>
                      <span>/ {row.sourceKind}</span>
                      <span>/ {row.practiceCode}</span>
                    </div>

                    <div style={{ marginTop: 6, fontWeight: 700 }}>
                      {row.title}
                    </div>

                    <div style={{ marginTop: 6, color: "#444" }}>
                      {truncateText(row.body, 180) || "(本文なし)"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function PlanGoalCard(props: { label: string; text: string }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{props.label}</div>
      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
        {props.text || "未設定"}
      </div>
    </div>
  );
}

function ReflectionBlock(props: { title: string; items: string[] }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{props.title}</div>
      {props.items.length === 0 ? (
        <div style={{ color: "#666" }}>該当なし</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {props.items.map((item, index) => (
            <div
              key={`${props.title}_${index}`}
              style={{
                padding: 10,
                borderRadius: 8,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard(props: { label: string; value: number }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, background: "#fff" }}>
      <div>{props.label}</div>
      <b style={{ fontSize: 20 }}>{props.value}</b>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: 8,
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 8,
  verticalAlign: "top",
};
