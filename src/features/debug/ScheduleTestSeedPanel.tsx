import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const CLASSROOM_ID = "d98bab13-5f10-4655-99fd-ab96a22e8449";
const AGE_TARGET_ID = "703fa9e8-5f6d-4a95-9465-7d5b1c7ffebb";
const TENANT_ID = "demo-tenant";

const WEEK_START_DATE = "2026-03-16";
const WEEK_END_DATE = "2026-03-22";
const TARGET_DAY_OF_WEEK = 2; // 2026-03-17 は火曜

export default function ScheduleTestSeedPanel(props: { owner: string }) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createTestScheduleWeek() {
    setLoading(true);
    setMessage("");

    try {
      const existingWeekRes = await client.models.ScheduleWeek.list({
        filter: {
          classroomId: { eq: CLASSROOM_ID },
          weekStartDate: { eq: WEEK_START_DATE },
        },
      });

      let weekId = existingWeekRes.data?.[0]?.id;

      if (!weekId) {
        const createWeekRes = await client.models.ScheduleWeek.create({
          tenantId: TENANT_ID,
          owner,
          classroomId: CLASSROOM_ID,
          ageTargetId: AGE_TARGET_ID,
          weekStartDate: WEEK_START_DATE,
          weekEndDate: WEEK_END_DATE,
          status: "ACTIVE",
          title: "2026-03-16週 すみれ組 テスト週案",
          notes: "2026-03-17 日案自動発行テスト用",
        });

        if (!createWeekRes.data) {
          throw new Error(
            createWeekRes.errors?.map((e) => e.message).join(", ") ||
              "ScheduleWeek の作成に失敗しました。"
          );
        }

        weekId = createWeekRes.data.id;
      }

      const existingItemsRes = await client.models.ScheduleWeekItem.list({
        filter: {
          scheduleWeekId: { eq: weekId },
          dayOfWeek: { eq: TARGET_DAY_OF_WEEK },
        },
      });

      if ((existingItemsRes.data?.length ?? 0) > 0) {
        setMessage(
          `既にテスト用 ScheduleWeekItem があります。weekId=${weekId}`
        );
        return;
      }

      const items = [
        {
          tenantId: TENANT_ID,
          owner,
          scheduleWeekId: weekId,
          dayOfWeek: TARGET_DAY_OF_WEEK,
          sourceType: "REGULAR" as const,
          title: "自由遊び",
          description: "",
          startTime: "07:00",
          endTime: "09:00",
          sortOrder: 10,
        },
        {
          tenantId: TENANT_ID,
          owner,
          scheduleWeekId: weekId,
          dayOfWeek: TARGET_DAY_OF_WEEK,
          sourceType: "REGULAR" as const,
          title: "朝礼",
          description: "登園時刻の記録（登園していない子どもは理由をメモで記録）",
          startTime: "09:00",
          endTime: "10:00",
          sortOrder: 20,
        },
        {
          tenantId: TENANT_ID,
          owner,
          scheduleWeekId: weekId,
          dayOfWeek: TARGET_DAY_OF_WEEK,
          sourceType: "PLANNED" as const,
          title: "園庭でのミニトマト栽培と収穫体験",
          description: "保育士の音声記録対象",
          startTime: "10:00",
          endTime: "12:00",
          sortOrder: 30,
          practiceCode: "PR-20260317-135113-CXM1",
          practiceTitleSnapshot: "園庭でのミニトマト栽培と収穫体験",
          scoreHealth: 0,
          scoreHumanRelations: 3,
          scoreEnvironment: 9,
          scoreLanguage: 3,
          scoreExpression: 0,
        },
        {
          tenantId: TENANT_ID,
          owner,
          scheduleWeekId: weekId,
          dayOfWeek: TARGET_DAY_OF_WEEK,
          sourceType: "REGULAR" as const,
          title: "昼食（給食）",
          description: "安全チェックシート（アレルギーのある子どもは保育士がダブルチェックします）",
          startTime: "12:00",
          endTime: "13:00",
          sortOrder: 40,
        },
        {
          tenantId: TENANT_ID,
          owner,
          scheduleWeekId: weekId,
          dayOfWeek: TARGET_DAY_OF_WEEK,
          sourceType: "REGULAR" as const,
          title: "午睡",
          description: "安全チェックシート（10分間隔で保育士は安全を確認します）",
          startTime: "13:00",
          endTime: "15:00",
          sortOrder: 50,
        },
        {
          tenantId: TENANT_ID,
          owner,
          scheduleWeekId: weekId,
          dayOfWeek: TARGET_DAY_OF_WEEK,
          sourceType: "REGULAR" as const,
          title: "夕礼",
          description: "降園時刻の記録",
          startTime: "15:00",
          endTime: "16:00",
          sortOrder: 60,
        },
        {
          tenantId: TENANT_ID,
          owner,
          scheduleWeekId: weekId,
          dayOfWeek: TARGET_DAY_OF_WEEK,
          sourceType: "REGULAR" as const,
          title: "自由遊び",
          description: "",
          startTime: "16:00",
          endTime: "20:00",
          sortOrder: 70,
        },
      ];

      for (const item of items) {
        const res = await client.models.ScheduleWeekItem.create(item);
        if (!res.data) {
          throw new Error(
            res.errors?.map((e) => e.message).join(", ") ||
              `ScheduleWeekItem 作成失敗: ${item.title}`
          );
        }
      }

      setMessage(`テスト用週案を作成しました。weekId=${weekId}`);
    } catch (e) {
      console.error(e);
      setMessage(
        `作成エラー: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", marginTop: 16 }}>
      <h3>Schedule テストデータ作成</h3>
      <div style={{ marginBottom: 8 }}>対象クラス: すみれ組（4歳）</div>
      <div style={{ marginBottom: 8 }}>週: 2026-03-16 ～ 2026-03-22</div>
      <div style={{ marginBottom: 12 }}>対象日: 2026-03-17（火）</div>

      <button onClick={createTestScheduleWeek} disabled={loading}>
        {loading ? "作成中..." : "テスト用 ScheduleWeek を作成"}
      </button>

      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
    </div>
  );
}