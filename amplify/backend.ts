import { defineBackend } from "@aws-amplify/backend";
import { Duration } from "aws-cdk-lib";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

import { auth } from "./auth/resource";
import {
  data,
  summarizeAudioFn,
  analyzePracticeFn,
  suggestPracticeLinksFn,
  registerPracticeLinksFn,
  analyzeTranscriptObservationsFn,
} from "./data/resource";
import { storage } from "./storage/resource";
import { dailyDigest } from "./jobs/daily-digest/resource";
import { transcribePoller } from "./jobs/transcribe-poller/resource";

const backend = defineBackend({
  auth,
  data,
  storage,
  dailyDigest,
  summarizeAudioFn,
  analyzePracticeFn,
  suggestPracticeLinksFn,
  registerPracticeLinksFn,
  analyzeTranscriptObservationsFn,
  transcribePoller,
});

type LambdaConfigurable = {
  addEnvironment: (name: string, value: string) => void;
  timeout: Duration;
};

function asLambdaConfigurable(value: unknown): LambdaConfigurable {
  return value as LambdaConfigurable;
}

/**
 * ✅ Transcribe が S3 の音声を読む/結果を書けるようにする Data Access Role
 * - Transcribe サービスが Assume できる必要がある
 */
const transcribeDataAccessRole = new Role(
  backend.stack,
  "TranscribeDataAccessRole",
  {
    assumedBy: new ServicePrincipal("transcribe.amazonaws.com"),
  },
);

// ✅ 入力（既存の音声保存先 prefix）
backend.storage.resources.bucket.grantRead(
  transcribeDataAccessRole,
  "tenants/*",
);

// ✅ 入力（Practice登録UI の音声保存先 prefix）
backend.storage.resources.bucket.grantRead(
  transcribeDataAccessRole,
  "practice-audio/*",
);

// ✅ 出力（Transcribe の結果を置く prefix）
backend.storage.resources.bucket.grantWrite(
  transcribeDataAccessRole,
  "transcribe-output/*",
);

// ✅ summarizeAudioFn が Transcribe を呼べるように（Start/Get）
backend.summarizeAudioFn.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "transcribe:StartTranscriptionJob",
      "transcribe:GetTranscriptionJob",
    ],
    resources: ["*"],
  }),
);

// ✅ StartTranscriptionJob に DataAccessRoleArn を渡すので iam:PassRole が必要
backend.summarizeAudioFn.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["iam:PassRole"],
    resources: [transcribeDataAccessRole.roleArn],
  }),
);

// ✅ poller は Get だけでOK（Transcribe 側）
backend.transcribePoller.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["transcribe:GetTranscriptionJob"],
    resources: ["*"],
  }),
);

/**
 * ✅ poller が S3 の transcribe-output/*.json を読めるようにする
 */
backend.storage.resources.bucket.grantRead(
  backend.transcribePoller.resources.lambda,
  "transcribe-output/*",
);

/**
 * ✅ dailyDigest が Bedrock を呼べるようにする
 */
backend.dailyDigest.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: ["*"],
  }),
);

// ✅ analyzePractice が Bedrock を呼べるようにする
backend.analyzePracticeFn.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: ["*"],
  }),
);

// ✅ suggestPracticeLinks が Bedrock を呼べるようにする
backend.suggestPracticeLinksFn.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: ["*"],
  }),
);

// ✅ analyzeTranscriptObservations が Bedrock / Marketplace を呼べるようにする
backend.analyzeTranscriptObservationsFn.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "bedrock:InvokeModel",
      "bedrock:GetInferenceProfile",
      "aws-marketplace:Subscribe",
      "aws-marketplace:Unsubscribe",
      "aws-marketplace:ViewSubscriptions",
    ],
    resources: ["*"],
  }),
);

/**
 * ✅ Lambda に環境変数を注入
 */
const summarizeLambda = asLambdaConfigurable(
  backend.summarizeAudioFn.resources.lambda,
);
summarizeLambda.addEnvironment(
  "TRANSCRIBE_DATA_ACCESS_ROLE_ARN",
  transcribeDataAccessRole.roleArn,
);
summarizeLambda.addEnvironment(
  "TRANSCRIBE_OUTPUT_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
summarizeLambda.addEnvironment(
  "TRANSCRIBE_OUTPUT_PREFIX",
  "transcribe-output/",
);

// poller 側
const pollerLambda = asLambdaConfigurable(
  backend.transcribePoller.resources.lambda,
);
pollerLambda.addEnvironment(
  "TRANSCRIBE_OUTPUT_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
pollerLambda.addEnvironment("TRANSCRIBE_OUTPUT_PREFIX", "transcribe-output/");

/**
 * ✅ dailyDigest 側
 */
const dailyLambda = asLambdaConfigurable(backend.dailyDigest.resources.lambda);
dailyLambda.addEnvironment(
  "BEDROCK_MODEL_ID",
  "anthropic.claude-3-5-sonnet-20240620-v1:0",
);
dailyLambda.addEnvironment(
  "TRANSCRIBE_OUTPUT_BUCKET",
  backend.storage.resources.bucket.bucketName,
);

// ✅ analyze-practice 側
const analyzePracticeLambda = asLambdaConfigurable(
  backend.analyzePracticeFn.resources.lambda,
);
analyzePracticeLambda.addEnvironment(
  "BEDROCK_MODEL_ID",
  "anthropic.claude-3-5-sonnet-20240620-v1:0",
);

// analyze-practice は Bedrock 呼び出しを含むのでタイムアウトを延長
analyzePracticeLambda.timeout = Duration.seconds(30);

// ✅ suggest-practice-links 側
const suggestPracticeLinksLambda = asLambdaConfigurable(
  backend.suggestPracticeLinksFn.resources.lambda,
);

suggestPracticeLinksLambda.addEnvironment(
  "BEDROCK_MODEL_ID",
  "anthropic.claude-3-5-sonnet-20240620-v1:0",
);
suggestPracticeLinksLambda.timeout = Duration.seconds(30);

// ✅ analyze-transcript-observations 側
const analyzeTranscriptLambda = asLambdaConfigurable(
  backend.analyzeTranscriptObservationsFn.resources.lambda,
);

analyzeTranscriptLambda.addEnvironment(
  "BEDROCK_MODEL_ID",
  "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
);
analyzeTranscriptLambda.timeout = Duration.seconds(60);

// 必要なら
// suggestPracticeLinksLambda.memorySize = 1024;

// 必要ならメモリも増やせます
// analyzePracticeLambda.memorySize = 1024;
// analyzeTranscriptLambda.memorySize = 1024;

/**
 * ✅ daily-digest のタイムアウトを延長
 */
dailyLambda.timeout = Duration.seconds(30);

// （必要になったら）
// dailyLambda.memorySize = 1024;
