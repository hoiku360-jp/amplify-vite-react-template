import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const TENANT_ID = "demo-tenant";
const CLASSROOM_ID = "d98bab13-5f10-4655-99fd-ab96a22e8449";
const AGE_TARGET_ID = "703fa9e8-5f6d-4a95-9465-7d5b1c7ffebb";
const SCHEDULE_WEEK_ID = "77c76f9c-5211-4fd2-8d51-0ccea3f690b4";
const TARGET_DATE = "2026-03-17";
const TARGET_DAY_OF_WEEK = 2; // Tue

type ObservationAbility = {
  abilityCode: string;
  abilityName: string;
  startingAge: number;
  score: number;
  episodes: string[];
};

function parseAgeBandToInt(ageBand?: string | null): number | null {
  if (!ageBand) return null;
  const m = ageBand.match(/(\d+)/);
  if (!m) return null;
  const age = Number(m[1]);
  return Number.isFinite(age) ? age : null;
}

async function listAll(modelApi: any, options?: Record<string, unknown>) {
  const results: any[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res: any = await modelApi.list({
      ...(options ?? {}),
      nextToken,
    });

    if (Array.isArray(res?.data) && res.data.length > 0) {
      results.push(...res.data);
    }

    nextToken = res?.nextToken;
  } while (nextToken);

  return results;
}

export default function ScheduleIssueDebugPanel(props: { owner: string }) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function getPracticeTitle(practiceCode?: string | null) {
    if (!practiceCode) return undefined;

    const rows = await listAll(client.models.PracticeCode, {
      filter: {
        practice_code: { eq: practiceCode },
      },
    });

    return rows[0]?.name ?? undefined;
  }

  async function getClassAge(ageTargetId: string): Promise<number | null> {
    const res = await client.models.SchoolAnnualAgeTarget.get({ id: ageTargetId });
    return parseAgeBandToInt(res.data?.ageBand ?? null);
  }

  async function buildObservationSnapshot(
    practiceCode: string | null | undefined,
    ageTargetId: string
  ) {
    if (!practiceCode) {
      return {
        observationAbilityCodes: [] as string[],
        observationSummaryJson: undefined as string | undefined,
      };
    }

    const links = await listAll(client.models.AbilityPracticeLink, {
      filter: {
        practiceCode: { eq: practiceCode },
      },
    });

    if (!links.length) {
      return {
        observationAbilityCodes: [] as string[],
        observationSummaryJson: undefined as string | undefined,
      };
    }

    const classAge = await getClassAge(ageTargetId);
    const candidates: ObservationAbility[] = [];

    for (const link of links) {
      const hints = await listAll(client.models.AbilityObservationHint, {
        filter: {
          abilityCode: { eq: link.abilityCode },
          isActive: { eq: true },
        },
      });

      for (const hint of hints) {
        const startingAge = hint.startingAge ?? 0;

        if (classAge !== null && startingAge > classAge) {
          continue;
        }

        const episodes = [hint.episode1, hint.episode2, hint.episode3]
          .filter((x): x is string => Boolean(x && x.trim()))
          .slice(0, 2);

        candidates.push({
          abilityCode: hint.abilityCode,
          abilityName: hint.abilityName,
          startingAge,
          score: link.score ?? 0,
          episodes,
        });
      }
    }

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.startingAge !== b.startingAge) return a.startingAge - b.startingAge;
      return a.abilityCode.localeCompare(b.abilityCode, "ja");
    });

    const top = candidates.slice(0, 3);

    return {
      observationAbilityCodes: top.map((x) => x.abilityCode),
      observationSummaryJson:
        top.length > 0
          ? JSON.stringify({
              practiceCode,
              abilities: top.map((x) => ({
                abilityCode: x.abilityCode,
                abilityName: x.abilityName,
                startingAge: x.startingAge,
                score: x.score,
                episodes: x.episodes,
              })),
            })
          : undefined,
    };
  }

  async function issueTestScheduleDay() {
    setLoading(true);
    setMessage("");

    try {
      const existingDays = await listAll(client.models.ScheduleDay, {
        filter: {
          classroomId: { eq: CLASSROOM_ID },
          targetDate: { eq: TARGET_DATE },
        },
      });

      if (existingDays.length > 0) {
        setMessage(
          `既に ScheduleDay があります。scheduleDayId=${existingDays[0].id}`
        );
        return;
      }

      const weekItems = await listAll(client.models.ScheduleWeekItem, {
        filter: {
          scheduleWeekId: { eq: SCHEDULE_WEEK_ID },
          dayOfWeek: { eq: TARGET_DAY_OF_WEEK },
        },
      });

      weekItems.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      if (!weekItems.length) {
        throw new Error("対象の ScheduleWeekItem が見つかりません。");
      }

      const dayCreateRes = await client.models.ScheduleDay.create({
        tenantId: TENANT_ID,
        owner,
        classroomId: CLASSROOM_ID,
        ageTargetId: AGE_TARGET_ID,
        sourceWeekId: SCHEDULE_WEEK_ID,
        targetDate: TARGET_DATE,
        status: "ISSUED",
        issueType: "MANUAL",
        issueVersion: 1,
        issuedAt: new Date().toISOString(),
        totalHealth: 0,
        totalHumanRelations: 0,
        totalEnvironment: 0,
        totalLanguage: 0,
        totalExpression: 0,
      });

      if (!dayCreateRes.data) {
        throw new Error(
          dayCreateRes.errors?.map((e) => e.message).join(", ") ||
            "ScheduleDay 作成失敗"
        );
      }

      const scheduleDayId = dayCreateRes.data.id;

      let totalHealth = 0;
      let totalHumanRelations = 0;
      let totalEnvironment = 0;
      let totalLanguage = 0;
      let totalExpression = 0;

      for (const item of weekItems) {
        const practiceTitleSnapshot =
          item.practiceTitleSnapshot || (await getPracticeTitle(item.practiceCode));

        const observation =
          item.sourceType === "PLANNED"
            ? await buildObservationSnapshot(item.practiceCode, AGE_TARGET_ID)
            : {
                observationAbilityCodes: [] as string[],
                observationSummaryJson: undefined as string | undefined,
              };

        const createItemRes = await client.models.ScheduleDayItem.create({
          tenantId: TENANT_ID,
          owner,
          scheduleDayId,
          sourceWeekItemId: item.id,
          sourceType: item.sourceType,
          status: "PLANNED",
          title: item.title,
          description: item.description ?? undefined,
          startTime: item.startTime,
          endTime: item.endTime,
          sortOrder: item.sortOrder,

          practiceCode: item.practiceCode ?? undefined,
          practiceTitleSnapshot: practiceTitleSnapshot ?? undefined,

          observationAbilityCodes: observation.observationAbilityCodes,
          observationSummaryJson: observation.observationSummaryJson,

          scoreHealth: item.scoreHealth ?? 0,
          scoreHumanRelations: item.scoreHumanRelations ?? 0,
          scoreEnvironment: item.scoreEnvironment ?? 0,
          scoreLanguage: item.scoreLanguage ?? 0,
          scoreExpression: item.scoreExpression ?? 0,
        });

        if (!createItemRes.data) {
          throw new Error(
            createItemRes.errors?.map((e) => e.message).join(", ") ||
              `ScheduleDayItem 作成失敗: ${item.title}`
          );
        }

        totalHealth += item.scoreHealth ?? 0;
        totalHumanRelations += item.scoreHumanRelations ?? 0;
        totalEnvironment += item.scoreEnvironment ?? 0;
        totalLanguage += item.scoreLanguage ?? 0;
        totalExpression += item.scoreExpression ?? 0;
      }

      const updateRes = await client.models.ScheduleDay.update({
        id: scheduleDayId,
        totalHealth,
        totalHumanRelations,
        totalEnvironment,
        totalLanguage,
        totalExpression,
      });

      if (!updateRes.data) {
        throw new Error(
          updateRes.errors?.map((e) => e.message).join(", ") ||
            "ScheduleDay 合算更新失敗"
        );
      }

      setMessage(
        `日案を発行しました。scheduleDayId=${scheduleDayId} / 合算=${totalHealth},${totalHumanRelations},${totalEnvironment},${totalLanguage},${totalExpression}`
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `発行エラー: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", marginTop: 16 }}>
      <h3>Schedule 手動発行テスト</h3>
      <div style={{ marginBottom: 8 }}>対象日: {TARGET_DATE}</div>
      <div style={{ marginBottom: 8 }}>weekId: {SCHEDULE_WEEK_ID}</div>
      <div style={{ marginBottom: 12 }}>classroom: すみれ組（4歳）</div>

      <button onClick={issueTestScheduleDay} disabled={loading}>
        {loading ? "発行中..." : "2026-03-17 の日案を手動発行"}
      </button>

      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
    </div>
  );
}