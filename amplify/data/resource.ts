import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";

import { dailyDigest } from "../jobs/daily-digest/resource";
import { transcribePoller } from "../jobs/transcribe-poller/resource";

export const summarizeAudioFn = defineFunction({
  name: "summarize-audio",
  entry: "./audio-summarize/handler.ts",
});

const schema = a
  .schema({
    Todo: a
      .model({
        content: a.string(),
        owner: a.string(),
      })
      .authorization((allow) => [allow.ownerDefinedIn("owner")]),

    Person: a
      .model({
        displayName: a.string().required(),
        organization: a.string(),
        owner: a.string().required(),
        boards: a.hasMany("Board", "authorId"),
      })
      .authorization((allow) => [allow.ownerDefinedIn("owner")]),

    Board: a
      .model({
        message: a.string().required(),
        authorId: a.id().required(),
        author: a.belongsTo("Person", "authorId"),
        owner: a.string().required(),
      })
      .authorization((allow) => [allow.ownerDefinedIn("owner")]),

    AudioJob: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),
        audioPath: a.string().required(),
        recordedAt: a.datetime().required(),
        status: a.string().required(),
        transcribeJobName: a.string(),
        transcribeStatus: a.string(),
        transcriptText: a.string(),
        summaryText: a.string(),
        errorMessage: a.string(),
        completedAt: a.datetime(),
      })
      .secondaryIndexes((index) => [
        index("tenantId").sortKeys(["recordedAt"]).queryField("listJobsByTenantDate"),
        index("status").sortKeys(["recordedAt"]).queryField("listJobsByStatusDate"),
      ])
      .authorization((allow) => [allow.ownerDefinedIn("owner")]),

    SummarizeAudioResponse: a.customType({
      jobId: a.string().required(),
      transcriptText: a.string(),
      summaryText: a.string(),
      status: a.string().required(),
      transcribeJobName: a.string(),
    }),

    summarizeAudio: a
      .mutation()
      .arguments({
        jobId: a.string().required(),
        audioPath: a.string().required(),
        audioUrl: a.string().required(),
        audioS3Uri: a.string().required(),
      })
      .returns(a.ref("SummarizeAudioResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(summarizeAudioFn)),

    // ✅ DailyDigest：owner(auth) と ownerKey(PK) を分離
    DailyDigest: a
      .model({
        tenantId: a.string().required(),

        // ✅ 主キー用（ユーザーごとに分けるためのキー）
        ownerKey: a.string().required(),

        // ✅ 認可用（Amplify owner auth が参照）
        owner: a.string().required(),

        digestDate: a.string().required(),
        title: a.string().required(),
        body: a.string(),
        sourceCount: a.integer().required(),
        status: a.string().required(),
      })
      .identifier(["tenantId", "ownerKey", "digestDate"])
      .secondaryIndexes((index) => [
        // tenant内で自分の分だけ一覧取得したいので tenantId + ownerKey を用意
        index("tenantId").sortKeys(["ownerKey", "digestDate"]).queryField("listDigestsByTenantOwnerDate"),
      ])
      .authorization((allow) => [
        // ✅ ownerフィールドで所有者制御（ownerKeyとは別）
        allow.ownerDefinedIn("owner"),
      ]),

    AbilityCode: a
      .model({
        code: a.string().required(),
        code_display: a.string().required(),
        parent_code: a.string(),
        level: a.integer().required(),
        name: a.string().required(),
        domain: a.string(),
        category: a.string(),
        sort_order: a.integer(),
        is_leaf: a.boolean().required(),
        status: a.string().required(),
        note: a.string(),
      })
        .authorization((allow) => [
          allow.authenticated().to(["read"]),
      ]),

    AbilityPracticeLink: a
      .model({
        abilityCode: a.string().required(),
        practiceCode: a.string().required(),
        score: a.integer().required(),
      })
      .identifier(["abilityCode", "practiceCode"])
      .secondaryIndexes((index) => [
        index("abilityCode").sortKeys(["practiceCode"]).queryField("listByAbility"),
        index("practiceCode").sortKeys(["abilityCode"]).queryField("listByPractice"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["read"]),
      ]),

    AbilityPracticeAgg: a
      .model({
        abilityCode: a.string().required(),
        practiceCode: a.string().required(),
        scoreSum: a.integer().required(),
        scoreMax: a.integer().required(),
        linkCount: a.integer().required(),
        level: a.integer().required(),
      })
      .authorization((allow) => [allow.authenticated().to(["create", "read", "update", "delete"])]),

    PracticeCode: a
      .model({
        practice_code: a.string().required(),
        category_code: a.string(),
        category_name: a.string(),
        name: a.string().required(),
        memo: a.string(),
        source_type: a.string().required(),
        source_ref: a.string(),
        source_url: a.string(),
        status: a.string().required(),
        version: a.integer().required(),
      })
      .authorization((allow) => [
        allow.authenticated().to(["read"]),
      ]),

    // ✅ Plan（日案→週案の土台）
    DailyWeeklyPlan: a
      .model({
        // ✅ 認可用（Amplify owner auth が参照）
        owner: a.string().required(),

        // ✅ 週単位で引くためのパーティションキー（owner#weekStart）
        weekOwnerKey: a.string().required(),

        // ✅ 週の起点（YYYY-MM-DD）
        weekStart: a.string().required(),

        // ✅ 日付（YYYY-MM-DD）
        planDate: a.string().required(),

        // ✅ 5領域（health/relationship/environment/language/expression）
        area: a.string().required(),

        // ✅ 1マス=1Practice（まずは試作）
        practiceCode: a.string().required(),

        memo: a.string(),
      })
      // ✅ 1マス（weekOwnerKey + planDate + area）を一意にする
      .identifier(["weekOwnerKey", "planDate", "area"])
      .secondaryIndexes((index) => [
        // ✅ 週表示：weekOwnerKey でその週の全セルを取得
        index("weekOwnerKey").sortKeys(["planDate", "area"]).queryField("listPlanCellsByWeek"),
        // ✅ owner でも引けるように（一覧・検索用）
        index("owner").sortKeys(["weekStart", "planDate"]).queryField("listPlanCellsByOwnerWeekDate"),
      ])
      .authorization((allow) => [
        allow.owner().to(["create", "read", "update", "delete"]),
      ]),

    // ✅ DayPlan（日案：TimeBlock）
    DailyTimeBlock: a
     .model({
       // 認可用（owner auth）
        owner: a.string().required(),

       // 日付（YYYY-MM-DD）
        planDate: a.string().required(),

        // ブロックID（初期生成は固定IDにして重複生成を防ぐ）
        blockId: a.string().required(),

        // regular | planned
        blockType: a.string().required(),

        // 表示名（例：自由遊び、給食、PR-OUT-0001）
        title: a.string().required(),

        // "07:00" のような HH:MM
        startTime: a.string().required(),
        endTime: a.string().required(),

        // planned のときだけ入れる（任意）
        practiceCode: a.string(),

        memo: a.string(),

        // template | manual | weekplan
        source: a.string().required(),
      })
      // ✅ 1日の中でユニーク（owner + planDate + blockId）
      .identifier(["owner", "planDate", "blockId"])
      .secondaryIndexes((index) => [
        // ✅ 日案表示：owner + planDate でその日のブロック一覧を取得（startTime順）
        index("owner").sortKeys(["planDate", "startTime"]).queryField("listTimeBlocksByOwnerDay"),
        // ✅ 日案表示：planDate でその日のブロック一覧を取得（startTime順）
        index("planDate").sortKeys(["startTime"]).queryField("listTimeBlocksByDay"),
      ])
      .authorization((allow) => [
        allow.owner().to(["create", "read", "update", "delete"]),
      ]),
  })
  .authorization((allow) => [allow.resource(dailyDigest), allow.resource(transcribePoller)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      // sandbox用：短めでOK（必要なら調整）
      expiresInDays: 7,
    },
  },
});