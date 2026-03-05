import { defineBackend } from "@aws-amplify/backend";
import { Duration } from "aws-cdk-lib";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

import { auth } from "./auth/resource";
import { data, summarizeAudioFn } from "./data/resource";
import { storage } from "./storage/resource";
import { dailyDigest } from "./jobs/daily-digest/resource";
import { transcribePoller } from "./jobs/transcribe-poller/resource";

const backend = defineBackend({
  auth,
  data,
  storage,
  dailyDigest,
  summarizeAudioFn,
  transcribePoller,
});

/**
 * ✅ Transcribe が S3 の音声を読む/結果を書けるようにする Data Access Role
 * - Transcribe サービスが Assume できる必要がある
 */
const transcribeDataAccessRole = new Role(backend.stack, "TranscribeDataAccessRole", {
  assumedBy: new ServicePrincipal("transcribe.amazonaws.com"),
});

// ✅ 入力（uploadData の保存先 prefix）
backend.storage.resources.bucket.grantRead(transcribeDataAccessRole, "tenants/*");

// ✅ 出力（Transcribe の結果を置く prefix）
backend.storage.resources.bucket.grantWrite(transcribeDataAccessRole, "transcribe-output/*");

// ✅ summarizeAudioFn が Transcribe を呼べるように（Start/Get）
backend.summarizeAudioFn.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["transcribe:StartTranscriptionJob", "transcribe:GetTranscriptionJob"],
    resources: ["*"],
  })
);

// ✅ StartTranscriptionJob に DataAccessRoleArn を渡すので iam:PassRole が必要
backend.summarizeAudioFn.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["iam:PassRole"],
    resources: [transcribeDataAccessRole.roleArn],
  })
);

// ✅ poller は Get だけでOK（Transcribe 側）
backend.transcribePoller.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["transcribe:GetTranscriptionJob"],
    resources: ["*"],
  })
);

/**
 * ✅ poller が S3 の transcribe-output/*.json を読めるようにする
 */
backend.storage.resources.bucket.grantRead(backend.transcribePoller.resources.lambda, "transcribe-output/*");

/**
 * ✅ dailyDigest が Bedrock を呼べるようにする
 * ※ まずは InvokeModel だけ（必要なら InvokeModelWithResponseStream 等を追加）
 */
backend.dailyDigest.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: ["*"],
  })
);

/**
 * ✅ Lambda に環境変数を注入
 * ※ resources.lambda は型が IFunction で addEnvironment が見えないことがあるので any キャストで回避
 */
const summarizeLambda = backend.summarizeAudioFn.resources.lambda as any;
summarizeLambda.addEnvironment("TRANSCRIBE_DATA_ACCESS_ROLE_ARN", transcribeDataAccessRole.roleArn);
summarizeLambda.addEnvironment("TRANSCRIBE_OUTPUT_BUCKET", backend.storage.resources.bucket.bucketName);
summarizeLambda.addEnvironment("TRANSCRIBE_OUTPUT_PREFIX", "transcribe-output/");

// poller 側でも使いたいなら同様に注入（必須ではない）
const pollerLambda = backend.transcribePoller.resources.lambda as any;
pollerLambda.addEnvironment("TRANSCRIBE_OUTPUT_BUCKET", backend.storage.resources.bucket.bucketName);
pollerLambda.addEnvironment("TRANSCRIBE_OUTPUT_PREFIX", "transcribe-output/");

/**
 * ✅ dailyDigest 側
 * - Claude 3.5 Sonnet の modelId を固定
 * - （任意）将来 S3 保存などに拡張するため bucket 名も渡す
 */
const dailyLambda = backend.dailyDigest.resources.lambda as any;
dailyLambda.addEnvironment("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0");
dailyLambda.addEnvironment("TRANSCRIBE_OUTPUT_BUCKET", backend.storage.resources.bucket.bucketName);

/**
 * ✅ ここが今回の追加ポイント（resource.ts で timeoutSeconds が効かない環境向け）
 * Bedrock 呼び出し込みでも落ちないように daily-digest のタイムアウトを延長する
 */
dailyLambda.timeout = Duration.seconds(30);

// （必要になったら）メモリを増やす場合：
// dailyLambda.memorySize = 1024;
