import { defineFunction } from "@aws-amplify/backend";

export const issueNextDaySchedules = defineFunction({
  name: "issue-next-day-schedules",
  entry: "./handler.ts",
  runtime: 22,
  schedule: "0 4 ? * 2-6 *", // 13:00 JST, Monday-Friday. 1=Sun, 2=Mon, ..., 6=Fri, 7=Sat
  timeoutSeconds: 60,
});
