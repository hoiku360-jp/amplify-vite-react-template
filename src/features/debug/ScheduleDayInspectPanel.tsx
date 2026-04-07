import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const SCHEDULE_DAY_ID = "b13c4c33-73c9-4587-86b7-0ab5ff7ccf7c";

type ObservationAbility = {
  abilityCode: string;
  abilityName: string;
  startingAge: number;
  score: number;
  episodes: string[];
};

type ObservationSummary = {
  practiceCode: string;
  abilities: ObservationAbility[];
};

function safeParseObservationSummary(
  value?: string | null
): ObservationSummary | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as ObservationSummary;
  } catch {
    return null;
  }
}

export default function ScheduleDayInspectPanel() {
  const client = useMemo(() => generateClient<Schema>(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [day, setDay] = useState<Schema["ScheduleDay"]["type"] | null>(null);
  const [items, setItems] = useState<Array<Schema["ScheduleDayItem"]["type"]>>(
    []
  );

  async function loadScheduleDay() {
    setLoading(true);
    setMessage("");

    try {
      const dayRes = await client.models.ScheduleDay.get({
        id: SCHEDULE_DAY_ID,
      });

      if (!dayRes.data) {
        setDay(null);
        setItems([]);
        setMessage("ScheduleDay が見つかりませんでした。");
        return;
      }

      setDay(dayRes.data);

      const itemsRes = await client.models.ScheduleDayItem.list({
        filter: {
          scheduleDayId: { eq: SCHEDULE_DAY_ID },
        },
      });

      const sorted = (itemsRes.data ?? []).sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );

      setItems(sorted);
      setMessage(`ScheduleDayItem ${sorted.length} 件を取得しました。`);
    } catch (e) {
      console.error(e);
      setMessage(
        `読込エラー: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", marginTop: 16 }}>
      <h3>ScheduleDay 確認パネル</h3>
      <div style={{ marginBottom: 12 }}>scheduleDayId: {SCHEDULE_DAY_ID}</div>

      <button onClick={loadScheduleDay} disabled={loading}>
        {loading ? "読込中..." : "日案を確認する"}
      </button>

      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}

      {day ? (
        <div style={{ marginTop: 16, padding: 12, background: "#f7f7f7" }}>
          <h4>日案ヘッダ</h4>
          <div><b>targetDate:</b> {day.targetDate}</div>
          <div><b>status:</b> {day.status}</div>
          <div><b>issueType:</b> {day.issueType}</div>
          <div><b>issueVersion:</b> {day.issueVersion}</div>
          <div><b>classroomId:</b> {day.classroomId}</div>
          <div><b>ageTargetId:</b> {day.ageTargetId}</div>
          <div style={{ marginTop: 8 }}>
            <b>5領域合算:</b>{" "}
            {[
              day.totalHealth ?? 0,
              day.totalHumanRelations ?? 0,
              day.totalEnvironment ?? 0,
              day.totalLanguage ?? 0,
              day.totalExpression ?? 0,
            ].join(", ")}
          </div>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <h4>タイムライン</h4>
          {items.map((item) => {
            const observation = safeParseObservationSummary(
              item.observationSummaryJson
            );

            return (
              <div
                key={item.id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  border: "1px solid #ddd",
                  background: item.sourceType === "PLANNED" ? "#eef6ff" : "#fff",
                }}
              >
                <div>
                  <b>
                    {item.startTime} - {item.endTime}
                  </b>{" "}
                  / {item.sourceType} / {item.title}
                </div>

                {item.description ? (
                  <div style={{ marginTop: 6 }}>
                    <b>description:</b> {item.description}
                  </div>
                ) : null}

                <div style={{ marginTop: 6 }}>
                  <b>practiceCode:</b> {item.practiceCode || "-"}
                </div>

                <div style={{ marginTop: 6 }}>
                  <b>practiceTitleSnapshot:</b> {item.practiceTitleSnapshot || "-"}
                </div>

                <div style={{ marginTop: 6 }}>
                  <b>item 5領域:</b>{" "}
                  {[
                    item.scoreHealth ?? 0,
                    item.scoreHumanRelations ?? 0,
                    item.scoreEnvironment ?? 0,
                    item.scoreLanguage ?? 0,
                    item.scoreExpression ?? 0,
                  ].join(", ")}
                </div>

                <div style={{ marginTop: 6 }}>
                  <b>observationAbilityCodes:</b>{" "}
                  {(item.observationAbilityCodes ?? []).join(", ") || "-"}
                </div>

                {observation ? (
                  <div style={{ marginTop: 10 }}>
                    <b>見取り観点 snapshot</b>
                    {observation.abilities.map((ab) => (
                      <div
                        key={ab.abilityCode}
                        style={{
                          marginTop: 8,
                          padding: 8,
                          background: "#ffffff",
                          border: "1px solid #d9e8ff",
                        }}
                      >
                        <div>
                          <b>{ab.abilityName}</b> ({ab.abilityCode}) / 開始年齢:
                          {ab.startingAge} / score: {ab.score}
                        </div>
                        <ul style={{ marginTop: 6, marginBottom: 0 }}>
                          {(ab.episodes ?? []).map((ep, idx) => (
                            <li key={`${ab.abilityCode}-${idx}`}>{ep}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}