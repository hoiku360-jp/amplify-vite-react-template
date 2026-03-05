import { defineFunction } from "@aws-amplify/backend";

export const dailyDigest = defineFunction({
  name: "daily-digest",
  entry: "./handler.ts",

  // 毎日 09:05 JST（= 00:05 UTC）
  schedule: "5 0 * * ? *",

  // ✅ 429 バックオフで待つ可能性があるので長め（最大 15分）
  timeoutSeconds: 900,

  memoryMB: 512,
});