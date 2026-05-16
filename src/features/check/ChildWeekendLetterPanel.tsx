import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import PracticeImpactSection from "./PracticeImpactSection";
import {
  buildBundleCacheKey,
  buildChildWeekendMarkdown,
  daysAgoYYYYMMDD,
  filterBundleByChild,
  formatDateTime,
  loadClassrooms,
  loadObservationBundle,
  recommendWeekendPlayHints,
  todayYYYYMMDD,
  truncateText,
  upsertReportArtifact,
  type AbilityDomainGroup,
  type ChildAggregateRow,
  type ObservationBundle,
  type WeekendPlayHintRow,
} from "./reporting";

type Props = {
  owner: string;
  tenantId: string;
};

export default function ChildWeekendLetterPanel(props: Props) {
  const { owner, tenantId } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [savingLetter, setSavingLetter] = useState(false);
  const [message, setMessage] = useState("");

  const [classrooms, setClassrooms] = useState<
    Array<Schema["Classroom"]["type"]>
  >([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const [fromDate, setFromDate] = useState(() => daysAgoYYYYMMDD(6));
  const [toDate, setToDate] = useState(() => todayYYYYMMDD());

  const [availableChildren, setAvailableChildren] = useState<
    ChildAggregateRow[]
  >([]);
  const [selectedChildName, setSelectedChildName] = useState("");

  const [sourceBundle, setSourceBundle] = useState<ObservationBundle | null>(
    null,
  );
  const [sourceBundleKey, setSourceBundleKey] = useState("");
  const [bundle, setBundle] = useState<ObservationBundle | null>(null);
  const [weekendPlayHints, setWeekendPlayHints] = useState<
    WeekendPlayHintRow[]
  >([]);
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
        setSelectedClassroomId(rows[0]?.id ?? "");
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

  async function loadChildCandidates() {
    if (!selectedClassroomId) {
      setMessage("先にクラスを選択してください。");
      return;
    }
    if (fromDate > toDate) {
      setMessage("期間指定が不正です。fromDate は toDate 以下にしてください。");
      return;
    }

    setLoadingChildren(true);
    setMessage("");
    setBundle(null);
    setWeekendPlayHints([]);
    setMarkdownText("");

    try {
      const nextBundle = await loadObservationBundle(
        client,
        selectedClassroomId,
        fromDate,
        toDate,
      );

      const nextKey = buildBundleCacheKey(
        selectedClassroomId,
        fromDate,
        toDate,
      );

      setSourceBundle(nextBundle);
      setSourceBundleKey(nextKey);
      setAvailableChildren(nextBundle.childRows);

      if (
        nextBundle.childRows.length > 0 &&
        !nextBundle.childRows.some((row) => row.childName === selectedChildName)
      ) {
        setSelectedChildName(nextBundle.childRows[0]?.childName ?? "");
      }

      if (nextBundle.childRows.length === 0) {
        setSelectedChildName("");
        setMessage("この期間の子ども別観察データがありません。");
      } else {
        setMessage(
          `子ども候補を読み込みました。 ${nextBundle.childRows.length}人`,
        );
      }
    } catch (e) {
      console.error(e);
      setMessage(
        `子ども候補読込エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingChildren(false);
    }
  }

  async function generateLetter() {
    if (!selectedClassroomId) {
      setMessage("先にクラスを選択してください。");
      return;
    }
    if (fromDate > toDate) {
      setMessage("期間指定が不正です。fromDate は toDate 以下にしてください。");
      return;
    }
    if (!selectedChildName) {
      setMessage("先に子どもを選択してください。");
      return;
    }

    setLoadingLetter(true);
    setMessage("");

    try {
      const currentKey = buildBundleCacheKey(
        selectedClassroomId,
        fromDate,
        toDate,
      );

      const baseBundle =
        sourceBundle && sourceBundleKey === currentKey
          ? sourceBundle
          : await loadObservationBundle(
              client,
              selectedClassroomId,
              fromDate,
              toDate,
            );

      const childBundle = filterBundleByChild(baseBundle, selectedChildName);
      const classroomName = selectedClassroom?.name ?? "(クラス未選択)";

      const nextWeekendPlayHints = await recommendWeekendPlayHints({
        client,
        bundle: childBundle,
        seedKey: `${selectedChildName}:${fromDate}:${toDate}`,
        limit: 3,
      });

      const nextMarkdown = buildChildWeekendMarkdown({
        classroomName,
        childName: selectedChildName,
        fromDate,
        toDate,
        bundle: childBundle,
        weekendPlayHints: nextWeekendPlayHints,
      });

      setSourceBundle(baseBundle);
      setSourceBundleKey(currentKey);
      setBundle(childBundle);
      setWeekendPlayHints(nextWeekendPlayHints);
      setMarkdownText(nextMarkdown);
      setMessage(
        `子ども週末だよりを作成しました。 child=${selectedChildName} / observation=${childBundle.observations.length} / weekendPlay=${nextWeekendPlayHints.length}`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `子ども週末だより作成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoadingLetter(false);
    }
  }

  async function saveLetter() {
    if (
      !selectedClassroomId ||
      !selectedChildName ||
      !bundle ||
      !markdownText
    ) {
      setMessage("先に子ども週末だよりを作成してください。");
      return;
    }

    setSavingLetter(true);
    setMessage("");

    try {
      const classroomName = selectedClassroom?.name ?? "(クラス未選択)";
      const title = `${selectedChildName}さん 週末だより ${fromDate}〜${toDate}`;

      await upsertReportArtifact({
        client,
        tenantId,
        owner,
        reportType: "CHILD_WEEKLY",
        classroomId: selectedClassroomId,
        childKey: selectedChildName,
        childName: selectedChildName,
        periodStart: fromDate,
        periodEnd: toDate,
        title,
        payload: {
          reportType: "CHILD_WEEKLY",
          classroomId: selectedClassroomId,
          classroomName,
          childKey: selectedChildName,
          childName: selectedChildName,
          fromDate,
          toDate,
          summary: {
            observationCount: bundle.observations.length,
            abilityLinkCount: bundle.abilityLinks.length,
            domainCounts: bundle.domainCounts,
            practiceRows: bundle.practiceRows,
            abilityRows: bundle.abilityRows,
            abilityGroups: bundle.abilityGroups,
            weekendPlayHints,
            evidenceRows: bundle.evidenceRows.slice(0, 20),
          },
        },
        markdownText,
      });

      setMessage("子ども週末だよりを ReportArtifact に保存しました。");
    } catch (e) {
      console.error(e);
      setMessage(`保存エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingLetter(false);
    }
  }

  async function copyMarkdown() {
    if (!markdownText) {
      setMessage("先に子ども週末だよりを作成してください。");
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
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>子ども週末だより</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
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

          <label>
            <div>子ども</div>
            <select
              value={selectedChildName}
              onChange={(e) => setSelectedChildName(e.target.value)}
              style={{ display: "block", marginTop: 6, width: "100%" }}
            >
              <option value="">選択してください</option>
              {availableChildren.map((row) => (
                <option key={row.childName} value={row.childName}>
                  {row.childName}
                </option>
              ))}
            </select>
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
            onClick={loadChildCandidates}
            disabled={loadingChildren || !selectedClassroomId}
          >
            {loadingChildren ? "子ども候補読込中..." : "子ども候補読込"}
          </button>

          <button
            onClick={generateLetter}
            disabled={
              loadingLetter || !selectedClassroomId || !selectedChildName
            }
          >
            {loadingLetter ? "だより作成中..." : "子ども週末だよりを作成"}
          </button>

          <button
            onClick={saveLetter}
            disabled={savingLetter || !bundle || !markdownText}
          >
            {savingLetter ? "保存中..." : "ReportArtifact に保存"}
          </button>

          <button onClick={copyMarkdown} disabled={!markdownText}>
            markdown をコピー
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
              background: "#f8fafc",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              {selectedChildName || "子ども"} の観察件数
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
                gap: 10,
              }}
            >
              <StatCard label="健康" value={bundle.domainCounts.health} />
              <StatCard
                label="人間関係"
                value={bundle.domainCounts.humanRelations}
              />
              <StatCard label="環境" value={bundle.domainCounts.environment} />
              <StatCard label="言葉" value={bundle.domainCounts.language} />
              <StatCard label="表現" value={bundle.domainCounts.expression} />
            </div>
          </div>

          <AbilityHierarchySection
            title="育ちのポイント"
            groups={bundle.abilityGroups}
          />

          <PracticeImpactSection rows={bundle.practiceRows} />

          <WeekendPlayHintSection rows={weekendPlayHints} />

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

            {bundle.evidenceRows.length === 0 ? (
              <div style={{ color: "#666" }}>データがありません。</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {bundle.evidenceRows.slice(0, 12).map((row) => (
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

function StatCard(props: { label: string; value: number }) {
  const { label, value } = props;

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <div style={{ color: "#555", fontSize: 12 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function AbilityHierarchySection(props: {
  title: string;
  groups: AbilityDomainGroup[];
}) {
  const { title, groups } = props;

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #d0d7de",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h3>

      {groups.length === 0 ? (
        <div style={{ color: "#666" }}>データがありません。</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {groups.map((domainGroup) => (
            <div key={domainGroup.domain}>
              <div
                style={{
                  fontWeight: 700,
                  borderLeft: "4px solid #2563eb",
                  paddingLeft: 8,
                  marginBottom: 8,
                }}
              >
                {domainGroup.domain}（{domainGroup.totalCount}件）
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {domainGroup.categories.map((categoryGroup) => (
                  <div
                    key={`${domainGroup.domain}:${categoryGroup.category}`}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      {categoryGroup.category}（{categoryGroup.totalCount}件）
                    </div>

                    <div style={{ display: "grid", gap: 4 }}>
                      {categoryGroup.rows.map((row) => (
                        <div
                          key={`${row.abilityCode}:${row.abilityName}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            fontSize: 13,
                          }}
                        >
                          <span>
                            {row.abilityCode} {row.abilityName}
                          </span>
                          <span style={{ whiteSpace: "nowrap" }}>
                            {row.count}件
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeekendPlayHintSection(props: { rows: WeekendPlayHintRow[] }) {
  const { rows } = props;

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #d0d7de",
        borderRadius: 8,
        background: "#fffdf5",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>週末の過ごし方のヒント</h3>

      {rows.length === 0 ? (
        <div style={{ color: "#666" }}>
          家庭向けの週末あそび候補はまだありません。
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((row, index) => (
            <div
              key={`${row.playId}:${row.abilityCode}`}
              style={{
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {index + 1}. {row.playTitle}
                </div>
                <div style={{ color: "#666", fontSize: 12 }}>
                  {[row.playType, row.setting].filter(Boolean).join(" / ")}
                </div>
              </div>

              {row.playDescriptionDraft ? (
                <div style={{ marginBottom: 8, lineHeight: 1.7 }}>
                  {row.playDescriptionDraft}
                </div>
              ) : null}

              <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>
                育ちのつながり:{" "}
                <b>
                  {row.domain} / {row.category} / {row.abilityName}
                </b>
              </div>

              {row.reason ? (
                <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>
                  おすすめ理由: {row.reason}
                </div>
              ) : null}

              {row.parentHint ? (
                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                  保護者へのヒント: {row.parentHint}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
