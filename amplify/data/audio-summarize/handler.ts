import type { Schema } from "../resource";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";

function guessMediaFormat(
  audioPath: string,
): "mp3" | "mp4" | "wav" | "flac" | "ogg" | "amr" | "webm" {
  const ext = audioPath.split(".").pop()?.toLowerCase();
  if (ext === "m4a" || ext === "mp4") return "mp4";
  if (ext === "mp3") return "mp3";
  if (ext === "wav") return "wav";
  if (ext === "flac") return "flac";
  if (ext === "ogg") return "ogg";
  if (ext === "amr") return "amr";
  if (ext === "webm") return "webm";
  return "mp4";
}

export const handler: Schema["summarizeAudio"]["functionHandler"] = async (
  event,
) => {
  const { jobId } = event.arguments;
  const audioS3Uri = (event.arguments as any).audioS3Uri as string | undefined;

  const roleArn = process.env.TRANSCRIBE_DATA_ACCESS_ROLE_ARN;
  const outBucket = process.env.TRANSCRIBE_OUTPUT_BUCKET;
  const outPrefix =
    process.env.TRANSCRIBE_OUTPUT_PREFIX ?? "transcribe-output/";

  if (!audioS3Uri) {
    return { jobId, status: "FAILED", summaryText: "audioS3Uri is required" };
  }
  if (!roleArn || !outBucket) {
    return {
      jobId,
      status: "FAILED",
      summaryText:
        "Missing TRANSCRIBE_DATA_ACCESS_ROLE_ARN / TRANSCRIBE_OUTPUT_BUCKET",
    };
  }

  const region = process.env.AWS_REGION || "ap-northeast-1";
  const client = new TranscribeClient({ region });
  const jobName = `hoiku360-${jobId}-${Date.now()}`;

  try {
    console.log("StartTranscriptionJob request", {
      region,
      jobId,
      jobName,
      audioS3Uri,
      mediaFormat: guessMediaFormat(audioS3Uri),
      outBucket,
      outKey: `${outPrefix}${jobId}/`,
      roleArn,
    });

    const resp = await client.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: "ja-JP",
        Media: { MediaFileUri: audioS3Uri },
        MediaFormat: guessMediaFormat(audioS3Uri),
        OutputBucketName: outBucket,
        OutputKey: `${outPrefix}${jobId}/`,
        JobExecutionSettings: {
          DataAccessRoleArn: roleArn,
        },
      }),
    );

    console.log("StartTranscriptionJob response", {
      jobId,
      jobName,
      returnedJobName: resp.TranscriptionJob?.TranscriptionJobName,
      returnedStatus: resp.TranscriptionJob?.TranscriptionJobStatus,
    });

    return {
      jobId,
      status: "RUNNING",
      transcribeJobName: jobName,
      transcriptText: null,
      summaryText: null,
    };
  } catch (e: any) {
    console.error("StartTranscriptionJob failed", {
      jobId,
      jobName,
      audioS3Uri,
      roleArn,
      outBucket,
      outPrefix,
      name: e?.name,
      msg: e?.message,
      stack: e?.stack,
    });

    return {
      jobId,
      status: "FAILED",
      transcribeJobName: null,
      transcriptText: null,
      summaryText: `StartTranscriptionJob failed: ${e?.name ?? ""} ${e?.message ?? e}`,
    };
  }
};