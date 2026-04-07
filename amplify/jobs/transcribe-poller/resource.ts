import { defineFunction } from "@aws-amplify/backend";

// ✅ Gen2 Scheduling Function は schedule を "every 1m" 等で指定する
export const transcribePoller = defineFunction({
  name: "transcribe-poller",
  entry: "./handler.ts",
  runtime: 22,
  schedule: "every 1m",

  // ✅ 追加：TranscriptFileUri の fetch / S3 fallback があるので
  // デフォルト(短い)だと timeout しやすい。まずは 30 秒が安全。
  timeoutSeconds: 30,
});
