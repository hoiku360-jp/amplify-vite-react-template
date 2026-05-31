// patch_resource_parent_notice_phase2_v3.cjs
// 保育360MVP Phase 2: amplify/data/resource.ts に保護者向けお知らせ生成の追加を行う Node.js パッチです。
// 実行場所: プロジェクトルート
// 実行例:
//   node .\patch_resource_parent_notice_phase2_v3.cjs

const fs = require("fs");
const path = require("path");

const target = path.join("amplify", "data", "resource.ts");

if (!fs.existsSync(target)) {
  throw new Error(`resource.ts が見つかりません: ${target}`);
}

let text = fs.readFileSync(target, "utf8");

function addAfter(source, needle, insert, label) {
  if (source.includes(insert.trim())) {
    console.log(`SKIP: ${label} は既に追加済みです。`);
    return source;
  }
  if (!source.includes(needle)) {
    throw new Error(`挿入位置が見つかりません: ${label}`);
  }
  console.log(`ADD : ${label}`);
  return source.replace(needle, `${needle}\n${insert}`);
}

const needleFunction = [
  'export const cleanupTranscriptTextFn = defineFunction({',
  '  name: "cleanup-transcript-text",',
  '  entry: "../functions/cleanup-transcript-text/handler.ts",',
  '  timeoutSeconds: 60,',
  '  memoryMB: 512,',
  '  environment: {',
  '    BEDROCK_MODEL_ID: "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",',
  '  },',
  '  runtime: 22,',
  '});',
].join("\n");

const insertFunction = [
  '',
  'export const generateParentNoticeFn = defineFunction({',
  '  name: "generate-parent-notice",',
  '  entry: "../functions/generate-parent-notice/handler.ts",',
  '  timeoutSeconds: 60,',
  '  memoryMB: 512,',
  '  environment: {',
  '    BEDROCK_MODEL_ID: "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",',
  '  },',
  '  runtime: 22,',
  '});',
].join("\n");

text = addAfter(text, needleFunction, insertFunction, "generateParentNoticeFn");

const needleMutation = [
  '    CleanupTranscriptTextResponse: a.customType({',
  '      originalText: a.string().required(),',
  '      cleanedText: a.string().required(),',
  '      status: a.string().required(),',
  '      message: a.string(),',
  '    }),',
  '',
  '    cleanupTranscriptText: a',
  '      .mutation()',
  '      .arguments({',
  '        scheduleDayId: a.id().required(),',
  '        scheduleDayItemId: a.id().required(),',
  '        practiceCode: a.string(),',
  '        childNames: a.string().array(),',
  '        transcriptText: a.string().required(),',
  '      })',
  '      .returns(a.ref("CleanupTranscriptTextResponse"))',
  '      .authorization((allow) => [allow.authenticated()])',
  '      .handler(a.handler.function(cleanupTranscriptTextFn)),',
].join("\n");

const insertMutation = [
  '',
  '    GenerateParentNoticeResponse: a.customType({',
  '      scheduleDayId: a.id().required(),',
  '      draftText: a.string().required(),',
  '      sourceJson: a.string(),',
  '      status: a.string().required(),',
  '      message: a.string(),',
  '    }),',
  '',
  '    generateParentNotice: a',
  '      .mutation()',
  '      .arguments({',
  '        scheduleDayId: a.id().required(),',
  '        manualNote: a.string(),',
  '      })',
  '      .returns(a.ref("GenerateParentNoticeResponse"))',
  '      .authorization((allow) => [allow.authenticated()])',
  '      .handler(a.handler.function(generateParentNoticeFn)),',
].join("\n");

text = addAfter(text, needleMutation, insertMutation, "GenerateParentNoticeResponse / generateParentNotice");

const needleScheduleDay = [
  '        totalHealth: a.integer(),',
  '        totalHumanRelations: a.integer(),',
  '        totalEnvironment: a.integer(),',
  '        totalLanguage: a.integer(),',
  '        totalExpression: a.integer(),',
  '',
  '        items: a.hasMany("ScheduleDayItem", "scheduleDayId"),',
].join("\n");

const insertScheduleDay = [
  '        parentNoticeDraftText: a.string(),',
  '        parentNoticeText: a.string(),',
  '        parentNoticeSourceJson: a.string(),',
  '        parentNoticeStatus: a.string(), // DRAFT / CONFIRMED / CLEARED',
  '        parentNoticeGeneratedAt: a.datetime(),',
  '        parentNoticeConfirmedAt: a.datetime(),',
  '',
].join("\n");

text = addAfter(text, needleScheduleDay, insertScheduleDay, "ScheduleDay parentNotice fields");

const needleAuth = '    allow.resource(cleanupTranscriptTextFn),';
const insertAuth = '    allow.resource(generateParentNoticeFn),';

if (text.includes(insertAuth)) {
  console.log("SKIP: generateParentNoticeFn authorization は既に追加済みです。");
} else {
  if (!text.includes(needleAuth)) {
    throw new Error("挿入位置が見つかりません: generateParentNoticeFn authorization");
  }
  console.log("ADD : generateParentNoticeFn authorization");
  text = text.replace(needleAuth, `${needleAuth}\n${insertAuth}`);
}

fs.writeFileSync(target, text, "utf8");

console.log("");
console.log(`完了: ${target} を更新しました。`);
console.log("次に実行してください:");
console.log("  git diff amplify/data/resource.ts");
