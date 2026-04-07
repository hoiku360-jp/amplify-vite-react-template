
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/issue-next-day-schedules";
import type { Schema } from "../../data/resource";
import { issueDayFromWeekCore } from "../../functions/_shared/issueDayFromWeekCore";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

function tomorrowJstDateString() {
  const now = new Date();
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  jstNow.setDate(jstNow.getDate() + 1);

  const y = jstNow.getFullYear();
  const m = String(jstNow.getMonth() + 1).padStart(2, "0");
  const d = String(jstNow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const handler = async () => {
  const targetDate = tomorrowJstDateString();

  const weekRes = await client.models.ScheduleWeek.list();
  const weeks = (weekRes.data ?? []).filter((week: any) => {
    const start = String(week.weekStartDate ?? "");
    const end = String(week.weekEndDate ?? "");
    return start <= targetDate && targetDate <= end;
  });

  const results = [];

  for (const week of weeks) {
    const result = await issueDayFromWeekCore(client, {
      scheduleWeekId: week.id,
      targetDate,
      issueType: "AUTO",
    });

    results.push(result);
  }

  return {
    targetDate,
    weekCount: weeks.length,
    results,
  };
};
