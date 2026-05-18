import { defineFunction } from "@aws-amplify/backend";

export const dailyDigest = defineFunction({
  name: "daily-digest",
  entry: "./handler.ts",
  runtime: 22,

  // デモ期間中は定期起動を停止する。
  // 以前の設定:
  // 毎日 09:05 JST（= 00:05 UTC）
  // schedule: "5 0 * * ? *",

  // 429 バックオフで待つ可能性があるので長め（最大 15分）
  timeoutSeconds: 900,

  memoryMB: 512,
});
