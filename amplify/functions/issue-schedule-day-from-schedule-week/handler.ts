import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/issue-schedule-day-from-schedule-week";
import type { Schema } from "../../data/resource";
import {
  issueDayFromWeekCore,
  type IssueDayArgs,
} from "../_shared/issueDayFromWeekCore";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: Schema["issueScheduleDayFromScheduleWeek"]["functionHandler"] =
  async (event) => {
    const args = event.arguments as IssueDayArgs;
    return await issueDayFromWeekCore(client, args);
  };
