import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import PracticeImpactSection from "./PracticeImpactSection";
import {
  buildClassWeeklyMarkdown,
  comparisonStatusLabel,
  daysAgoYYYYMMDD,
  formatDateTime,
  formatSharePercent,
  loadCheckActionReportBundle,
  loadClassrooms,
  todayYYYYMMDD,
  truncateText,
  upsertReportArtifact,
  type AbilityDomainGroup,
  type CheckActionReportBundle,
} from "./reporting";

type Props = {
  owner: string;
  tenantId: string;
};

export default function ClassWeeklyReportPanel(props: Props) {
  const { owner, tenantId } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [message, setMessage] = useState("");

  const [classrooms, setClassrooms] = useState<
    Array<Schema["Classroom"]["type"]>
  >([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const [fromDate, setFromDate] = useState(() => daysAgoYYYYMMDD(6));
  const [toDate, setToDate] = useState(() => todayYYYYMMDD());

  const [bundle, setBundle] = useState<CheckActionReportBundle | null>(null);
  const [markdownText, setMarkdownText] = useState("");

  const selectedClassroom = useMemo(
    () => classrooms.find((row) => row.id === selectedClassroomId) ?? null,
    [classrooms, selectedClassroomId],
  );

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

  async function generateReport() {
    if (!selectedClassroomId) {
      setMessage("先にクラスを選択してください。");
      return;
    }
    if (fromDate > toDate) {
      setMessage("期間指定が不正です。fromDate は toDate 以下にしてください。");
      return;
    }

    setLoadingReport(true);
    setMessage("");

    try {
      const nextBundle = await loadCheckActionReportBundle(
        client,
        selectedClassroomId,
        fromDate,
        toDate,
      );

      const classroomName = selectedClassroom?.name ?? "(クラス未選択)";
      const nextMarkdown = buildClassWeeklyMarkdown({
        classroomName,
        fromDate,
        toDate,
        bundle: nextBundle,
      });

      setBundle(nextBundle);
      setMarkdownText(nextMarkdown);
      setMessage(
        `クラス週報を作成しました。 observation=${nextBundle.observation.observations.length} / abilityLink=${nextBundle.observation.abilityLinks.length}`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `週報作成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingReport(false);
    }
  }

  async function saveReport() {
    if (!selectedClassroomId || !bundle || !markdownText) {
      setMessage("先にクラス週報を作成してください。");
      return;
    }

    setSavingReport(true);
    setMessage("");

    try {
      const classroomName = selectedClassroom?.name ?? "(クラス未選択)";
      const title = `${classroomName} クラス週報 ${fromDate}〜${toDate}`;

      await upsertReportArtifact({
        client,
        tenantId,
        owner,
        reportType: "CLASS_WEEKLY",
        classroomId: selectedClassroomId,
        periodStart: fromDate,
        periodEnd: toDate,
        title,
        payload: {
          reportType: "CLASS_WEEKLY",
          classroomId: selectedClassroomId,
          classroomName,
          fromDate,
          toDate,
          planContext: bundle.planContext,
          comparison: bundle.comparison,
          reflection: bundle.reflection,
          summary: {
            observationCount: bundle.observation.observations.length,
            abilityLinkCount: bundle.observation.abilityLinks.length,
            domainCounts: bundle.observation.domainCounts,
            practiceRows: bundle.observation.practiceRows,
            abilityRows: bundle.observation.abilityRows,
            abilityGroups: bundle.observation.abilityGroups,
            childRows: bundle.observation.childRows,
            evidenceRows: bundle.observation.evidenceRows.slice(0, 20),
          },
        },
        markdownText,
      });

      setMessage("クラス週報を ReportArtifact に保存しました。");
    } catch (e) {
      console.error(e);
      setMessage(`保存エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingReport(false);
    }
  }

  async function copyMarkdown() {
    if (!markdownText) {
      setMessage("先にクラス週報を作成してください。");
      return;
    }

    try {
      await navigator.clipboard.writeText(markdownText);
      setMessage("markdown をコピーしました。");
    } catch (e) {
      console.error(e);
      setMessage(`コピーエラー: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function downloadMarkdown() {
    if (!markdownText) {
      setMessage("先にクラス週報を作成してください。");
      return;
    }

    try {
      const classroomName = selectedClassroom?.name ?? "class-weekly-report";
      const safeClassroomName = classroomName.replace(/[\\/:*?"<>|]/g, "_");
      const filename = `${safeClassroomName}_${fromDate}_${toDate}.md`;

      const blob = new Blob([markdownText], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      URL.revokeObjectURL(url);
      setMessage("markdown をダウンロードしました。");
    } catch (e) {
      console.error(e);
      setMessage(
        `ダウンロードエラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

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
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>クラス週報</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <label>
            <div>クラス</div>
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
            <div>fromDate</div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ display: "block", marginTop: 6, width: "100%" }}
            />
          </label>

          <label>
            <div>toDate</div>
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
            onClick={generateReport}
            disabled={loadingReport || !selectedClassroomId}
          >
            {loadingReport ? "週報作成中..." : "クラス週報を作成"}
          </button>

          <button
            onClick={saveReport}
            disabled={savingReport || !bundle || !markdownText}
          >
            {savingReport ? "保存中..." : "ReportArtifact に保存"}
          </button>

          <button onClick={copyMarkdown} disabled={!markdownText}>
            markdown をコピー
          </button>

          <button onClick={downloadMarkdown} disabled={!markdownText}>
            markdown をダウンロード
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
              <StatCard
                label="健康"
                value={bundle.observation.domainCounts.health}
              />
              <StatCard
                label="人間関係"
                value={bundle.observation.domainCounts.humanRelations}
              />
              <StatCard
                label="環境"
                value={bundle.observation.domainCounts.environment}
              />
              <StatCard
                label="言葉"
                value={bundle.observation.domainCounts.language}
              />
              <StatCard
                label="表現"
                value={bundle.observation.domainCounts.expression}
              />
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

          <PracticeImpactSection rows={bundle.observation.practiceRows} />

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "minmax(340px, 1fr) minmax(280px, 360px)",
            }}
          >
            <AbilityHierarchySection
              title="よく見られた育ち"
              groups={bundle.observation.abilityGroups}
            />

            <div
              style={{
                padding: 16,
                border: "1px solid #d0d7de",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>子ども別件数</h3>

              {bundle.observation.childRows.length === 0 ? (
                <div style={{ color: "#666" }}>データがありません。</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {bundle.observation.childRows.slice(0, 12).map((row) => (
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
              title="次週への action"
              items={bundle.reflection.nextActionNotes}
            />
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

            {bundle.observation.evidenceRows.length === 0 ? (
              <div style={{ color: "#666" }}>データがありません。</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {bundle.observation.evidenceRows.slice(0, 12).map((row) => (
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

          <div
            style={{
              padding: 16,
              border: "1px solid #d0d7de",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              生成された markdown
            </h3>

            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {markdownText}
            </pre>
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

function AbilityHierarchySection(props: {
  title: string;
  groups: AbilityDomainGroup[];
}) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #d0d7de",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>{props.title}</h3>

      {props.groups.length === 0 ? (
        <div style={{ color: "#666" }}>データがありません。</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {props.groups.map((domainGroup) => (
            <section
              key={domainGroup.domain}
              style={{
                border: "1px solid #d8dee4",
                borderRadius: 10,
                background: "#f8fafc",
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#666",
                    background: "#eef2f7",
                    border: "1px solid #d8dee4",
                    borderRadius: 999,
                    padding: "2px 8px",
                    flexShrink: 0,
                  }}
                >
                  領域
                </span>
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  {domainGroup.domain}
                </div>
                <span style={{ color: "#666", fontSize: 13 }}>
                  {domainGroup.totalCount}件
                </span>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {domainGroup.categories.map((categoryGroup) => (
                  <section
                    key={`${domainGroup.domain}_${categoryGroup.category}`}
                    style={{
                      marginLeft: 16,
                      padding: 10,
                      borderLeft: "4px solid #d8dee4",
                      borderRadius: 8,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#666",
                          background: "#f3f4f6",
                          border: "1px solid #e5e7eb",
                          borderRadius: 999,
                          padding: "2px 8px",
                          flexShrink: 0,
                        }}
                      >
                        カテゴリ
                      </span>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {categoryGroup.category}
                      </div>
                      <span style={{ color: "#666", fontSize: 12 }}>
                        {categoryGroup.totalCount}件
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: 4, marginLeft: 12 }}>
                      {categoryGroup.rows.map((row) => (
                        <div
                          key={`${row.abilityCode}_${row.abilityName}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            alignItems: "center",
                            columnGap: 8,
                            padding: "4px 0",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "#666",
                                background: "#fafafa",
                                border: "1px solid #ececec",
                                borderRadius: 999,
                                padding: "1px 6px",
                                flexShrink: 0,
                              }}
                            >
                              育ち
                            </span>
                            <span
                              style={{
                                fontSize: 14,
                                lineHeight: 1.5,
                                wordBreak: "break-word",
                              }}
                            >
                              {row.abilityName}
                            </span>
                          </div>

                          <span
                            style={{
                              justifySelf: "end",
                              minWidth: 40,
                              textAlign: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#374151",
                              background: "#f3f4f6",
                              borderRadius: 999,
                              padding: "2px 8px",
                              flexShrink: 0,
                            }}
                          >
                            {row.count}件
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
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
