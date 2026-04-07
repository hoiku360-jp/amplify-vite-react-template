import { defineFunction } from "@aws-amplify/backend";

export const issueNextDaySchedules = defineFunction({
  name: "issue-next-day-schedules",
  entry: "./handler.ts",
  runtime: 22,
  schedule: "0 13 * * ? *", // 22:00 JST
  timeoutSeconds: 60,
});