import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

export default function IdLookupPanel() {
  const client = useMemo(() => generateClient<Schema>(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [classrooms, setClassrooms] = useState<Array<Schema["Classroom"]["type"]>>([]);
  const [plans, setPlans] = useState<Array<Schema["ClassAnnualPlan"]["type"]>>([]);

  async function loadIds() {
    setLoading(true);
    setMessage("");
    try {
      const classroomRes = await client.models.Classroom.list({
        filter: {
          name: { eq: "すみれ組" },
        },
      });

      const foundClassrooms = classroomRes.data ?? [];
      setClassrooms(foundClassrooms);

      if (foundClassrooms.length === 0) {
        setPlans([]);
        setMessage("『すみれ組』が見つかりませんでした。");
        return;
      }

      const classroomId = foundClassrooms[0].id;

      const planRes = await client.models.ClassAnnualPlan.list({
        filter: {
          classroomId: { eq: classroomId },
        },
      });

      const foundPlans = (planRes.data ?? []).sort(
        (a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0)
      );

      setPlans(foundPlans);

      if (foundPlans.length === 0) {
        setMessage("すみれ組の ClassAnnualPlan が見つかりませんでした。");
        return;
      }

      setMessage("一番上の行を見れば、classroomId と ageTargetId を確認できます。");
    } catch (e) {
      console.error(e);
      setMessage(`取得エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", marginTop: 16 }}>
      <h3>ID確認パネル</h3>
      <button onClick={loadIds} disabled={loading}>
        {loading ? "取得中..." : "すみれ組（4歳）のIDを調べる"}
      </button>

      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}

      <div style={{ marginTop: 16 }}>
        <h4>Classroom</h4>
        {classrooms.map((c) => (
          <div key={c.id} style={{ marginBottom: 8, padding: 8, background: "#f7f7f7" }}>
            <div><b>classroomId:</b> {c.id}</div>
            <div><b>name:</b> {c.name}</div>
            <div><b>ageBand:</b> {c.ageBand}</div>
            <div><b>tenantId:</b> {c.tenantId}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>ClassAnnualPlan</h4>
        {plans.map((p) => (
          <div key={p.id} style={{ marginBottom: 8, padding: 8, background: "#eef6ff" }}>
            <div><b>classAnnualPlanId:</b> {p.id}</div>
            <div><b>fiscalYear:</b> {p.fiscalYear}</div>
            <div><b>classroomId:</b> {p.classroomId}</div>
            <div><b>schoolAnnualAgeTargetId:</b> {p.schoolAnnualAgeTargetId}</div>
            <div><b>ageBand:</b> {p.ageBand}</div>
            <div><b>title:</b> {p.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}