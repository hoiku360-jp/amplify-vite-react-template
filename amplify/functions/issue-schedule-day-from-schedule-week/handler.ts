import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/issue-schedule-day-from-schedule-week";
import type { Schema } from "../../data/resource";
import { issueDayFromWeekCore } from "../_shared/issueDayFromWeekCore";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: Schema["issueScheduleDayFromScheduleWeek"]["functionHandler"] =
  async (event) => {
    const args = event.arguments;

    const result = await issueDayFromWeekCore(client, {
      scheduleWeekId: args.scheduleWeekId,
      targetDate: args.targetDate,
      issueType: args.issueType ?? "MANUAL",
    });

    return {
      scheduleWeekId: result.scheduleWeekId,
      scheduleDayId:
        "scheduleDayId" in result && result.scheduleDayId
          ? result.scheduleDayId
          : "previousScheduleDayId" in result && result.previousScheduleDayId
            ? result.previousScheduleDayId
            : "",
      targetDate: result.targetDate,
      createdDay: result.createdDay,
      createdItemCount: result.createdItemCount,
      status: result.status,
      previousScheduleDayId:
        "previousScheduleDayId" in result
          ? result.previousScheduleDayId
          : undefined,
      issueVersion: "issueVersion" in result ? result.issueVersion : undefined,
      message: "message" in result ? result.message : undefined,
    };
  };
