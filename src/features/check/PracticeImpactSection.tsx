import {
  formatDateTime,
  truncateText,
  type PracticeImpactRow,
} from "./reporting";

type Props = {
  title?: string;
  rows: PracticeImpactRow[];
};

export default function PracticeImpactSection(props: Props) {
  const { title = "期間内に実施した Practice と育ちへのつながり", rows } =
    props;

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

      {rows.length === 0 ? (
        <div style={{ color: "#666" }}>
          この期間の Practice データはありません。
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((row) => (
            <div
              key={row.practiceCode}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#f8fafc",
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {row.practiceCode}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {row.practiceTitle}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#555" }}>
                  最新記録: {formatDateTime(row.latestRecordedAt)}
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(90px, 1fr))",
                  gap: 8,
                }}
              >
                <Stat label="観察" value={`${row.observationCount}件`} />
                <Stat label="Ability" value={`${row.abilityLinkCount}件`} />
                <Stat label="健康" value={`${row.domainCounts.health}`} />
                <Stat
                  label="人間関係"
                  value={`${row.domainCounts.humanRelations}`}
                />
                <Stat label="環境" value={`${row.domainCounts.environment}`} />
                <Stat label="言葉" value={`${row.domainCounts.language}`} />
                <Stat label="表現" value={`${row.domainCounts.expression}`} />
              </div>

              <div style={{ marginTop: 10, fontSize: 13, color: "#444" }}>
                <b>関連した子ども:</b>{" "}
                {row.childNames.length > 0
                  ? row.childNames.join("、")
                  : "（クラス全体中心）"}
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {row.evidenceRows.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {formatDateTime(ev.recordedAt)} / {ev.childName} /{" "}
                      {ev.sourceKind}
                    </div>
                    <div style={{ marginTop: 4, fontWeight: 700 }}>
                      {ev.title}
                    </div>
                    <div style={{ marginTop: 4, color: "#444" }}>
                      {truncateText(ev.body, 140) || "(本文なし)"}
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

function Stat(props: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 8,
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{props.label}</div>
      <div style={{ fontWeight: 700 }}>{props.value}</div>
    </div>
  );
}
