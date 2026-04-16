import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";

import { dailyDigest } from "../jobs/daily-digest/resource";
import { transcribePoller } from "../jobs/transcribe-poller/resource";
import { issueNextDaySchedules } from "../jobs/issue-next-day-schedules/resource";

export const summarizeAudioFn = defineFunction({
  name: "summarize-audio",
  entry: "./audio-summarize/handler.ts",
  timeoutSeconds: 30,
  runtime: 22,
});

export const analyzePracticeFn = defineFunction({
  name: "analyze-practice",
  entry: "./practice-analyze/handler.ts",
  timeoutSeconds: 30,
  runtime: 22,
});

export const suggestPracticeLinksFn = defineFunction({
  name: "suggest-practice-links",
  entry: "./practice-link-suggest/handler.ts",
  timeoutSeconds: 30,
  runtime: 22,
});

// ★追加: accepted 候補の本登録用
export const registerPracticeLinksFn = defineFunction({
  name: "register-practice-links",
  entry: "./practice-link-register/handler.ts",
  timeoutSeconds: 30,
  runtime: 22,
});

// ★現行 Legacy PLAN 用
export const ensureFiscalYearTemplateFn = defineFunction({
  name: "ensure-fiscal-year-template",
  entry: "./plan-ensure-fiscal-year-template/handler.ts",
  timeoutSeconds: 30,
  runtime: 22,
});

export const ensureFiscalYearTemplateV2Fn = defineFunction({
  name: "ensure-fiscal-year-template-v2",
  entry: "./plan-ensure-fiscal-year-template-v2/handler.ts",
  timeoutSeconds: 30,
  runtime: 22,
});

export const analyzeTranscriptObservationsFn = defineFunction({
  name: "analyze-transcript-observations",
  entry: "../functions/analyze-transcript-observations/handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    BEDROCK_MODEL_ID: "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
  },
  runtime: 22,
});

export const cleanupTranscriptTextFn = defineFunction({
  name: "cleanup-transcript-text",
  entry: "../functions/cleanup-transcript-text/handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    BEDROCK_MODEL_ID: "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
  },
  runtime: 22,
});

export const syncScheduleDayObservationsFn = defineFunction({
  name: "sync-schedule-day-observations",
  entry: "../functions/sync-schedule-day-observations/handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    SYNC_LABEL: "schedule-day-observations",
  },
  runtime: 22,
});

export const issueScheduleDayFromScheduleWeekFn = defineFunction({
  name: "issue-schedule-day-from-schedule-week",
  entry: "../functions/issue-schedule-day-from-schedule-week/handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512,
  runtime: 22,
});

export const issueScheduleWeekFromScheduleMonthFn = defineFunction({
  name: "issue-schedule-week-from-schedule-month",
  entry: "../functions/issue-schedule-week-from-schedule-month/handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512,
  runtime: 22,
});

const schema = a
  .schema({
    // =========================
    // 既存モデル
    // =========================

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

        // 追加: 用途識別
        jobType: a.string(), // PRACTICE / DIGEST / SCHEDULE_TRANSCRIPT
        sourceEntityType: a.string(), // PracticeCode / DailyDigest / ScheduleDayItem
        sourceEntityId: a.string(),
        scheduleDayId: a.id(),
        scheduleDayItemId: a.id(),

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
        index("tenantId")
          .sortKeys(["recordedAt"])
          .queryField("listJobsByTenantDate"),
        index("status")
          .sortKeys(["recordedAt"])
          .queryField("listJobsByStatusDate"),
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

    AnalyzePracticeResponse: a.customType({
      practiceId: a.string().required(),
      practiceCode: a.string().required(),
      name: a.string().required(),
      memo: a.string().required(),
      status: a.string().required(),
      aiModel: a.string(),
    }),

    analyzePractice: a
      .mutation()
      .arguments({
        practiceId: a.string().required(),
      })
      .returns(a.ref("AnalyzePracticeResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(analyzePracticeFn)),

    SuggestPracticeLinksResponse: a.customType({
      practiceId: a.string().required(),
      practiceCode: a.string().required(),
      suggestionCount: a.integer().required(),
      status: a.string().required(),
      aiModel: a.string(),
    }),

    suggestPracticeLinks: a
      .mutation()
      .arguments({
        practiceId: a.string().required(),
      })
      .returns(a.ref("SuggestPracticeLinksResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(suggestPracticeLinksFn)),

    // ★追加: accepted 候補の本登録結果
    RegisterPracticeLinksResponse: a.customType({
      practiceCode: a.string().required(),
      registeredCount: a.integer().required(),
      status: a.string().required(),
    }),

    // ★追加: accepted 候補を AbilityPracticeLink へ反映
    registerPracticeLinks: a
      .mutation()
      .arguments({
        practiceCode: a.string().required(),
      })
      .returns(a.ref("RegisterPracticeLinksResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(registerPracticeLinksFn)),

    AnalyzeTranscriptObservationsResponse: a.customType({
      createdCount: a.integer().required(),
      skipped: a.boolean().required(),
      message: a.string().required(),
    }),

    CleanupTranscriptTextResponse: a.customType({
      originalText: a.string().required(),
      cleanedText: a.string().required(),
      status: a.string().required(),
      message: a.string(),
    }),

    cleanupTranscriptText: a
      .mutation()
      .arguments({
        scheduleDayId: a.id().required(),
        scheduleDayItemId: a.id().required(),
        practiceCode: a.string(),
        childNames: a.string().array(),
        transcriptText: a.string().required(),
      })
      .returns(a.ref("CleanupTranscriptTextResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(cleanupTranscriptTextFn)),

    IssueScheduleDayFromScheduleWeekResponse: a.customType({
      scheduleWeekId: a.id().required(),
      scheduleDayId: a.id().required(),
      previousScheduleDayId: a.id(),
      targetDate: a.date().required(),
      createdDay: a.boolean().required(),
      createdItemCount: a.integer().required(),
      issueVersion: a.integer(),
      status: a.string().required(),
      message: a.string(),
    }),

    issueScheduleDayFromScheduleWeek: a
      .mutation()
      .arguments({
        scheduleWeekId: a.id().required(),
        targetDate: a.date().required(),
        issueType: a.ref("ScheduleIssueType"),
      })
      .returns(a.ref("IssueScheduleDayFromScheduleWeekResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(issueScheduleDayFromScheduleWeekFn)),

    analyzeTranscriptObservations: a
      .mutation()
      .arguments({
        scheduleDayId: a.id().required(),
        scheduleDayItemId: a.id().required(),
        transcriptRecordId: a.id().required(),
      })
      .returns(a.ref("AnalyzeTranscriptObservationsResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(analyzeTranscriptObservationsFn)),

    SyncScheduleDayObservationsResponse: a.customType({
      scheduleDayId: a.id().required(),
      createdObservationCount: a.integer().required(),
      createdAbilityLinkCount: a.integer().required(),
      deletedObservationCount: a.integer().required(),
      deletedAbilityLinkCount: a.integer().required(),
      status: a.string().required(),
      message: a.string(),
    }),

    syncScheduleDayObservations: a
      .mutation()
      .arguments({
        scheduleDayId: a.id().required(),
      })
      .returns(a.ref("SyncScheduleDayObservationsResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(syncScheduleDayObservationsFn)),

    DailyDigest: a
      .model({
        tenantId: a.string().required(),
        ownerKey: a.string().required(),
        owner: a.string().required(),
        digestDate: a.string().required(),
        title: a.string().required(),
        body: a.string(),
        sourceCount: a.integer().required(),
        status: a.string().required(),
      })
      .identifier(["tenantId", "ownerKey", "digestDate"])
      .secondaryIndexes((index) => [
        index("tenantId")
          .sortKeys(["ownerKey", "digestDate"])
          .queryField("listDigestsByTenantOwnerDate"),
      ])
      .authorization((allow) => [allow.ownerDefinedIn("owner")]),

    Tenant: a
      .model({
        tenantId: a.string().required(),
        name: a.string().required(),
        legalName: a.string(),
        status: a.string().required(),
        plan: a.string(),
        note: a.string(),
      })
      .identifier(["tenantId"])
      .authorization((allow) => [allow.authenticated().to(["create", "read"])]),

    UserProfile: a
      .model({
        userId: a.string().required(),
        tenantId: a.string().required(),
        fullName: a.string().required(),
        displayName: a.string(),
        phoneticName: a.string(),
        email: a.string(),
        role: a.string().required(),
        status: a.string().required(),
        department: a.string(),
        position: a.string(),
        profileVisibility: a.string(),
        practiceDefaultVisibility: a.string(),
        owner: a.string().required(),
      })
      .identifier(["userId"])
      .secondaryIndexes((index) => [
        index("tenantId")
          .sortKeys(["fullName"])
          .queryField("listUserProfilesByTenant"),
        index("owner").queryField("listMyUserProfile"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read"]),
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
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    AbilityPracticeLink: a
      .model({
        abilityCode: a.string().required(),
        practiceCode: a.string().required(),
        score: a.integer().required(),
      })
      .identifier(["abilityCode", "practiceCode"])
      .secondaryIndexes((index) => [
        index("abilityCode")
          .sortKeys(["practiceCode"])
          .queryField("listByAbility"),
        index("practiceCode")
          .sortKeys(["abilityCode"])
          .queryField("listByPractice"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
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
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

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

        tenantId: a.string(),
        createdBy: a.string(),
        updatedBy: a.string(),

        visibility: a.string(),
        publishScope: a.string(),
        ownerType: a.string(),
        owner: a.string(),

        practiceCategory: a.string(),
        practiceSourceType: a.string(),

        audioKey: a.string(),
        recordedAt: a.datetime(),

        transcriptKey: a.string(),
        transcriptText: a.string(),
        transcribeJobName: a.string(),
        transcribeStatus: a.string(),

        aiStatus: a.string(),
        aiModel: a.string(),
        aiRawJson: a.string(),

        errorMessage: a.string(),

        reviewedAt: a.datetime(),
        completedAt: a.datetime(),
      })
      .secondaryIndexes((index) => [
        index("tenantId")
          .sortKeys(["practice_code"])
          .queryField("listPracticeCodesByTenant"),
        index("tenantId")
          .sortKeys(["status", "practice_code"])
          .queryField("listPracticeCodesByTenantStatus"),
        index("tenantId")
          .sortKeys(["practiceCategory", "practice_code"])
          .queryField("listPracticeCodesByTenantCategory"),
        index("tenantId")
          .sortKeys(["visibility", "practice_code"])
          .queryField("listPracticeCodesByTenantVisibility"),
        index("owner")
          .sortKeys(["practice_code"])
          .queryField("listPracticeCodesByOwner"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    PracticeLinkSuggestion: a
      .model({
        tenantId: a.string().required(),
        practiceCode: a.string().required(),
        abilityCode: a.string().required(),
        score: a.integer().required(),
        reason: a.string(),
        status: a.string().required(), // suggested / accepted / rejected / edited
        sortOrder: a.integer(),
        createdBy: a.string(),
        updatedBy: a.string(),
      })
      .secondaryIndexes((index) => [
        index("practiceCode")
          .sortKeys(["status", "sortOrder"])
          .queryField("listPracticeLinkSuggestionsByPractice"),
        index("tenantId")
          .sortKeys(["practiceCode", "status"])
          .queryField("listPracticeLinkSuggestionsByTenantPractice"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    DailyWeeklyPlan: a
      .model({
        owner: a.string().required(),
        weekOwnerKey: a.string().required(),
        weekStart: a.string().required(),
        planDate: a.string().required(),
        area: a.string().required(),
        practiceCode: a.string().required(),
        memo: a.string(),
      })
      .identifier(["weekOwnerKey", "planDate", "area"])
      .secondaryIndexes((index) => [
        index("weekOwnerKey")
          .sortKeys(["planDate", "area"])
          .queryField("listPlanCellsByWeek"),
        index("owner")
          .sortKeys(["weekStart", "planDate"])
          .queryField("listPlanCellsByOwnerWeekDate"),
      ])
      .authorization((allow) => [
        allow.owner().to(["create", "read", "update", "delete"]),
      ]),

    DailyTimeBlock: a
      .model({
        owner: a.string().required(),
        planDate: a.string().required(),
        blockId: a.string().required(),
        blockType: a.string().required(),
        title: a.string().required(),
        startTime: a.string().required(),
        endTime: a.string().required(),
        practiceCode: a.string(),
        memo: a.string(),
        source: a.string().required(),
      })
      .identifier(["owner", "planDate", "blockId"])
      .secondaryIndexes((index) => [
        index("owner")
          .sortKeys(["planDate", "startTime"])
          .queryField("listTimeBlocksByOwnerDay"),
        index("planDate")
          .sortKeys(["startTime"])
          .queryField("listTimeBlocksByDay"),
      ])
      .authorization((allow) => [
        allow.owner().to(["create", "read", "update", "delete"]),
      ]),

    // =========================
    // PLAN Legacy（現行 Small版を残す）
    // 既存 UI / handler を壊さないために一旦維持
    // =========================

    PlanType: a.enum(["YEAR", "TERM", "MONTH", "WEEK", "DAY"]),

    PlanStatus: a.enum(["DRAFT", "REVIEWED", "FINAL"]),

    DayProgramType: a.enum(["REGULAR", "PLANNED"]),

    Classroom: a
      .model({
        tenantId: a.string(),
        name: a.string().required(),
        ageBand: a.string(),
        schoolName: a.string(),
        status: a.string(),

        plans: a.hasMany("Plan", "classroomId"),
        classAnnualPlans: a.hasMany("ClassAnnualPlan", "classroomId"),

        // SCHEDULE v1
        scheduleMonths: a.hasMany("ScheduleMonth", "classroomId"),
        scheduleWeeks: a.hasMany("ScheduleWeek", "classroomId"),
        scheduleDays: a.hasMany("ScheduleDay", "classroomId"),
      })
      .secondaryIndexes((index) => [
        index("name").queryField("listClassroomsByName"),
        index("tenantId")
          .sortKeys(["ageBand", "name"])
          .queryField("listClassroomsByTenantAgeName"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    Plan: a
      .model({
        classroomId: a.id().required(),
        classroom: a.belongsTo("Classroom", "classroomId"),

        parentPlanId: a.id(),
        parentPlan: a.belongsTo("Plan", "parentPlanId"),
        childPlans: a.hasMany("Plan", "parentPlanId"),

        planType: a.ref("PlanType").required(),
        title: a.string().required(),

        fiscalYear: a.integer(),
        termNo: a.integer(),
        monthKey: a.string(),
        planKey: a.string(),

        periodStart: a.date(),
        periodEnd: a.date(),

        weekStartDate: a.date(),
        targetDate: a.date(),

        classAgeLabel: a.string(),
        schoolPolicy: a.string(),
        goalText: a.string(),

        draftText: a.string(),
        aiSuggestedText: a.string(),
        finalText: a.string(),

        status: a.ref("PlanStatus"),

        abilityHealth: a.integer(),
        abilityHumanRelations: a.integer(),
        abilityEnvironment: a.integer(),
        abilityLanguage: a.integer(),
        abilityExpression: a.integer(),

        events: a.hasMany("PlanEvent", "planId"),
        weekAssignments: a.hasMany("WeekPracticeAssignment", "weekPlanId"),
        dayProgramItems: a.hasMany("DayProgramItem", "dayPlanId"),
      })
      .secondaryIndexes((index) => [
        index("classroomId")
          .sortKeys(["periodStart"])
          .queryField("listPlansByClassroomAndPeriod"),
        index("parentPlanId")
          .sortKeys(["periodStart"])
          .queryField("listChildPlansByParentAndPeriod"),
        index("planKey").queryField("listPlansByPlanKey"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    PlanEvent: a
      .model({
        planId: a.id().required(),
        plan: a.belongsTo("Plan", "planId"),

        label: a.string().required(),

        eventMonth: a.integer(),
        eventDate: a.date(),

        sortOrder: a.integer(),
      })
      .secondaryIndexes((index) => [
        index("planId").sortKeys(["sortOrder"]).queryField("listEventsByPlan"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    WeekPracticeAssignment: a
      .model({
        weekPlanId: a.id().required(),
        weekPlan: a.belongsTo("Plan", "weekPlanId"),

        targetDate: a.date().required(),
        practiceCodeId: a.string(),
        note: a.string(),
        sortOrder: a.integer(),
      })
      .secondaryIndexes((index) => [
        index("weekPlanId")
          .sortKeys(["targetDate"])
          .queryField("listWeekAssignmentsByWeekAndDate"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    DayProgramItem: a
      .model({
        dayPlanId: a.id().required(),
        dayPlan: a.belongsTo("Plan", "dayPlanId"),

        programType: a.ref("DayProgramType").required(),

        title: a.string().required(),
        startTime: a.time(),
        endTime: a.time(),

        practiceCodeId: a.string(),
        note: a.string(),
        sortOrder: a.integer(),
      })
      .secondaryIndexes((index) => [
        index("dayPlanId")
          .sortKeys(["sortOrder"])
          .queryField("listDayProgramItemsByDay"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    EnsureFiscalYearTemplateResponse: a.customType({
      classroomId: a.id().required(),
      fiscalYear: a.integer().required(),
      yearPlanId: a.id().required(),
      createdYear: a.boolean().required(),
      createdTermCount: a.integer().required(),
      createdMonthCount: a.integer().required(),
      status: a.string().required(),
      message: a.string(),
    }),

    ensureFiscalYearTemplate: a
      .mutation()
      .arguments({
        classroomId: a.id().required(),
        fiscalYear: a.integer().required(),
      })
      .returns(a.ref("EnsureFiscalYearTemplateResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(ensureFiscalYearTemplateFn)),

    // =========================
    // SCHEDULE v1
    // PLANとは分離した短期実行・記録モジュール
    // =========================

    SchedulePlanStatus: a.enum(["DRAFT", "ACTIVE", "CLOSED"]),

    ScheduleSourceType: a.enum(["REGULAR", "PLANNED"]),

    ScheduleDayStatus: a.enum(["ISSUED", "IN_PROGRESS", "CLOSED"]),

    ScheduleItemStatus: a.enum(["PLANNED", "DONE", "SKIPPED"]),

    ScheduleIssueType: a.enum(["AUTO", "MANUAL", "MANUAL_REISSUE"]),

    ScheduleRecordType: a.enum([
      "CHECK",
      "MEMO",
      "APPEND_NOTE",
      "TRANSCRIPT",
      "STRUCTURED_OBSERVATION",
    ]),

    ObservationScopeType: a.enum(["CLASSROOM", "CHILD"]),

    ReportType: a.enum(["CLASS_WEEKLY", "CHILD_WEEKLY", "ABILITY_DASHBOARD"]),

    AbilityObservationHint: a
      .model({
        abilityCode: a.string().required(),
        abilityName: a.string().required(),
        startingAge: a.integer().required(),
        episode1: a.string(),
        episode2: a.string(),
        episode3: a.string(),
        isActive: a.boolean().required(),
      })
      .secondaryIndexes((index) => [
        index("abilityCode").queryField("listAbilityObservationHintsByAbility"),
        index("startingAge").queryField(
          "listAbilityObservationHintsByStartingAge",
        ),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    ScheduleWeek: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        classroomId: a.id().required(),
        classroom: a.belongsTo("Classroom", "classroomId"),

        ageTargetId: a.id().required(),
        ageTarget: a.belongsTo("SchoolAnnualAgeTarget", "ageTargetId"),

        sourceScheduleMonthId: a.id(),
        sourceScheduleMonth: a.belongsTo(
          "ScheduleMonth",
          "sourceScheduleMonthId",
        ),

        sourceClassMonthPlanId: a.id(),
        sourceClassWeekPlanId: a.id(),

        monthKey: a.string(), // 例: 2026-04
        weekNo: a.integer(),

        weekStartDate: a.date().required(),
        weekEndDate: a.date().required(),

        status: a.ref("SchedulePlanStatus").required(),
        issueType: a.ref("ScheduleIssueType"),
        issueVersion: a.integer(),

        title: a.string(),
        notes: a.string(),

        issuedAt: a.datetime(),
        closedAt: a.datetime(),

        items: a.hasMany("ScheduleWeekItem", "scheduleWeekId"),
        days: a.hasMany("ScheduleDay", "sourceWeekId"),
      })
      .secondaryIndexes((index) => [
        index("classroomId")
          .sortKeys(["weekStartDate"])
          .queryField("listScheduleWeeksByClassroomWeekStart"),
        index("ageTargetId")
          .sortKeys(["weekStartDate"])
          .queryField("listScheduleWeeksByAgeTargetWeekStart"),
        index("owner")
          .sortKeys(["weekStartDate"])
          .queryField("listScheduleWeeksByOwnerWeekStart"),
        index("sourceScheduleMonthId")
          .sortKeys(["weekStartDate"])
          .queryField("listScheduleWeeksBySourceScheduleMonth"),
        index("sourceClassWeekPlanId")
          .sortKeys(["weekStartDate"])
          .queryField("listScheduleWeeksBySourceClassWeekPlan"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create", "update"]),
      ]),

    ScheduleWeekItem: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        scheduleWeekId: a.id().required(),
        scheduleWeek: a.belongsTo("ScheduleWeek", "scheduleWeekId"),

        sourceMonthItemId: a.id(),
        sourceMonthItem: a.belongsTo("ScheduleMonthItem", "sourceMonthItemId"),

        sourceClassWeekPracticeAssignmentId: a.id(),

        dayOfWeek: a.integer().required(), // 0=Sun ... 6=Sat
        targetDate: a.date(),

        sourceType: a.ref("ScheduleSourceType").required(),

        title: a.string().required(),
        eventLabel: a.string(),
        description: a.string(),

        startTime: a.string().required(),
        endTime: a.string().required(),
        sortOrder: a.integer().required(),

        practiceCode: a.string(),
        practiceTitleSnapshot: a.string(),

        scoreHealth: a.integer(),
        scoreHumanRelations: a.integer(),
        scoreEnvironment: a.integer(),
        scoreLanguage: a.integer(),
        scoreExpression: a.integer(),
      })
      .secondaryIndexes((index) => [
        index("scheduleWeekId")
          .sortKeys(["dayOfWeek", "sortOrder"])
          .queryField("listScheduleWeekItemsByWeekDaySort"),
        index("practiceCode").queryField("listScheduleWeekItemsByPracticeCode"),
        index("sourceMonthItemId").queryField(
          "listScheduleWeekItemsBySourceMonthItem",
        ),
        index("sourceClassWeekPracticeAssignmentId").queryField(
          "listScheduleWeekItemsBySourceAssignment",
        ),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create", "update"]),
      ]),

    ScheduleDay: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(), // 担任sub

        classroomId: a.id().required(),
        classroom: a.belongsTo("Classroom", "classroomId"),

        ageTargetId: a.id().required(),
        ageTarget: a.belongsTo("SchoolAnnualAgeTarget", "ageTargetId"),

        sourceWeekId: a.id().required(),
        sourceWeek: a.belongsTo("ScheduleWeek", "sourceWeekId"),

        sourceClassWeekPlanId: a.id(),

        targetDate: a.date().required(),
        status: a.ref("ScheduleDayStatus").required(),
        issueType: a.ref("ScheduleIssueType").required(),
        issueVersion: a.integer().required(),

        issuedAt: a.datetime(),
        openedAt: a.datetime(),
        closedAt: a.datetime(),
        closedBySub: a.string(),

        totalHealth: a.integer(),
        totalHumanRelations: a.integer(),
        totalEnvironment: a.integer(),
        totalLanguage: a.integer(),
        totalExpression: a.integer(),

        items: a.hasMany("ScheduleDayItem", "scheduleDayId"),
        records: a.hasMany("ScheduleRecord", "scheduleDayId"),
      })
      .secondaryIndexes((index) => [
        index("classroomId")
          .sortKeys(["targetDate"])
          .queryField("listScheduleDaysByClassroomDate"),
        index("sourceWeekId")
          .sortKeys(["targetDate"])
          .queryField("listScheduleDaysByWeekDate"),
        index("owner")
          .sortKeys(["targetDate"])
          .queryField("listScheduleDaysByOwnerDate"),
        index("sourceClassWeekPlanId")
          .sortKeys(["targetDate"])
          .queryField("listScheduleDaysBySourceClassWeekPlanDate"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create", "update"]),
      ]),

    ScheduleDayItem: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        scheduleDayId: a.id().required(),
        scheduleDay: a.belongsTo("ScheduleDay", "scheduleDayId"),

        sourceWeekItemId: a.id(),
        sourceType: a.ref("ScheduleSourceType").required(),
        status: a.ref("ScheduleItemStatus").required(),

        title: a.string().required(),
        description: a.string(),
        startTime: a.string().required(),
        endTime: a.string().required(),
        sortOrder: a.integer().required(),

        practiceCode: a.string(),
        practiceTitleSnapshot: a.string(),

        observationAbilityCodes: a.string().array(),
        observationSummaryJson: a.string(),

        scoreHealth: a.integer(),
        scoreHumanRelations: a.integer(),
        scoreEnvironment: a.integer(),
        scoreLanguage: a.integer(),
        scoreExpression: a.integer(),

        records: a.hasMany("ScheduleRecord", "scheduleDayItemId"),
      })
      .secondaryIndexes((index) => [
        index("scheduleDayId")
          .sortKeys(["sortOrder"])
          .queryField("listScheduleDayItemsByDaySort"),
        index("practiceCode").queryField("listScheduleDayItemsByPracticeCode"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read"]),
      ]),

    ScheduleRecord: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        scheduleDayId: a.id().required(),
        scheduleDay: a.belongsTo("ScheduleDay", "scheduleDayId"),

        scheduleDayItemId: a.id().required(),
        scheduleDayItem: a.belongsTo("ScheduleDayItem", "scheduleDayItemId"),

        recordType: a.ref("ScheduleRecordType").required(),
        body: a.string(),
        payloadJson: a.string(),
        appendOnly: a.boolean().required(),
        createdBySub: a.string().required(),
        recordedAt: a.datetime().required(),
      })
      .secondaryIndexes((index) => [
        index("scheduleDayId")
          .sortKeys(["recordedAt"])
          .queryField("listScheduleRecordsByDayRecordedAt"),
        index("scheduleDayItemId")
          .sortKeys(["recordedAt"])
          .queryField("listScheduleRecordsByDayItemRecordedAt"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create"]),
      ]),

    ObservationRecord: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        classroomId: a.id().required(),

        ageTargetId: a.id(),

        scheduleWeekId: a.id(),

        scheduleDayId: a.id().required(),

        scheduleDayItemId: a.id(),

        sourceScheduleRecordId: a.id(),
        scopeType: a.ref("ObservationScopeType").required(),

        childKey: a.string(),
        childName: a.string(),

        targetDate: a.date().required(),
        recordedAt: a.datetime().required(),

        sourceKind: a.ref("ScheduleRecordType").required(),

        practiceCode: a.string(),
        practiceTitleSnapshot: a.string(),

        title: a.string(),
        body: a.string(),
        tags: a.string().array(),

        status: a.string().required(), // ACTIVE / ARCHIVED
        createdBySub: a.string(),

        abilityLinks: a.hasMany(
          "ObservationAbilityLink",
          "observationRecordId",
        ),
      })
      .secondaryIndexes((index) => [
        index("classroomId")
          .sortKeys(["targetDate", "recordedAt"])
          .queryField("listObservationRecordsByClassroomDate"),
        index("childKey")
          .sortKeys(["targetDate", "recordedAt"])
          .queryField("listObservationRecordsByChildDate"),
        index("scheduleDayId")
          .sortKeys(["recordedAt"])
          .queryField("listObservationRecordsByScheduleDayRecordedAt"),
        index("scheduleDayItemId")
          .sortKeys(["recordedAt"])
          .queryField("listObservationRecordsByScheduleDayItemRecordedAt"),
        index("sourceScheduleRecordId").queryField(
          "listObservationRecordsBySourceScheduleRecord",
        ),
        index("practiceCode")
          .sortKeys(["targetDate", "recordedAt"])
          .queryField("listObservationRecordsByPracticeDate"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create", "update", "delete"]),
      ]),

    ObservationAbilityLink: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        observationRecordId: a.id().required(),
        observationRecord: a.belongsTo(
          "ObservationRecord",
          "observationRecordId",
        ),

        classroomId: a.id().required(),

        childKey: a.string(),
        childName: a.string(),

        targetDate: a.date().required(),
        recordedAt: a.datetime().required(),

        practiceCode: a.string(),

        abilityCode: a.string().required(),
        abilityName: a.string().required(),
        domain: a.string(),
        category: a.string(),

        confidencePct: a.integer(),
        evidenceText: a.string(),

        status: a.string().required(), // ACTIVE / ARCHIVED
      })
      .secondaryIndexes((index) => [
        index("observationRecordId")
          .sortKeys(["abilityCode"])
          .queryField("listObservationAbilityLinksByObservation"),
        index("classroomId")
          .sortKeys(["targetDate", "abilityCode"])
          .queryField("listObservationAbilityLinksByClassroomDate"),
        index("childKey")
          .sortKeys(["targetDate", "abilityCode"])
          .queryField("listObservationAbilityLinksByChildDate"),
        index("abilityCode")
          .sortKeys(["targetDate", "classroomId"])
          .queryField("listObservationAbilityLinksByAbilityDate"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create", "update", "delete"]),
      ]),

    ReportArtifact: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        reportType: a.ref("ReportType").required(),

        classroomId: a.id(),

        childKey: a.string(),
        childName: a.string(),

        periodKey: a.string().required(), // 例: 2026-W15
        periodStart: a.date().required(),
        periodEnd: a.date().required(),

        title: a.string(),
        status: a.string().required(), // READY / ERROR
        payloadJson: a.string().required(),
        markdownText: a.string(),
        generatedAt: a.datetime().required(),
      })
      .secondaryIndexes((index) => [
        index("classroomId")
          .sortKeys(["reportType", "periodStart"])
          .queryField("listReportArtifactsByClassroom"),
        index("childKey")
          .sortKeys(["reportType", "periodStart"])
          .queryField("listReportArtifactsByChild"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create", "update", "delete"]),
      ]),

    // =========================
    // PLAN v2（保育所トップ構造）
    // これからこちらへ UI / handler を移行する
    // =========================

    SchoolAnnualPlan: a
      .model({
        tenantId: a.string().required(),
        fiscalYear: a.integer().required(),
        title: a.string().required(),
        periodStart: a.date(),
        periodEnd: a.date(),
        schoolPolicy: a.string(),
        status: a.ref("PlanStatus"),

        ageTargets: a.hasMany("SchoolAnnualAgeTarget", "schoolAnnualPlanId"),
      })
      .secondaryIndexes((index) => [
        index("tenantId")
          .sortKeys(["fiscalYear"])
          .queryField("listSchoolAnnualPlansByTenantYear"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    SchoolAnnualAgeTarget: a
      .model({
        tenantId: a.string().required(),
        fiscalYear: a.integer().required(),

        schoolAnnualPlanId: a.id().required(),
        schoolAnnualPlan: a.belongsTo("SchoolAnnualPlan", "schoolAnnualPlanId"),

        ageBand: a.string().required(),
        goalTextA: a.string(),

        abilityHealthA: a.integer(),
        abilityHumanRelationsA: a.integer(),
        abilityEnvironmentA: a.integer(),
        abilityLanguageA: a.integer(),
        abilityExpressionA: a.integer(),

        draftText: a.string(),
        aiSuggestedText: a.string(),
        finalText: a.string(),
        status: a.ref("PlanStatus"),
        sortOrder: a.integer(),

        classAnnualPlans: a.hasMany(
          "ClassAnnualPlan",
          "schoolAnnualAgeTargetId",
        ),

        // SCHEDULE v1
        scheduleMonths: a.hasMany("ScheduleMonth", "ageTargetId"),
        scheduleWeeks: a.hasMany("ScheduleWeek", "ageTargetId"),
        scheduleDays: a.hasMany("ScheduleDay", "ageTargetId"),
      })
      .secondaryIndexes((index) => [
        index("schoolAnnualPlanId")
          .sortKeys(["ageBand"])
          .queryField("listSchoolAnnualAgeTargetsByPlanAge"),
        index("tenantId")
          .sortKeys(["fiscalYear", "ageBand"])
          .queryField("listSchoolAnnualAgeTargetsByTenantYearAge"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    ClassAnnualPlan: a
      .model({
        tenantId: a.string().required(),

        classroomId: a.id().required(),
        classroom: a.belongsTo("Classroom", "classroomId"),

        schoolAnnualPlanId: a.id().required(),
        schoolAnnualAgeTargetId: a.id().required(),
        schoolAnnualAgeTarget: a.belongsTo(
          "SchoolAnnualAgeTarget",
          "schoolAnnualAgeTargetId",
        ),

        fiscalYear: a.integer().required(),
        title: a.string().required(),
        periodStart: a.date(),
        periodEnd: a.date(),

        ageBand: a.string().required(),
        goalTextA: a.string(),

        abilityHealthA: a.integer(),
        abilityHumanRelationsA: a.integer(),
        abilityEnvironmentA: a.integer(),
        abilityLanguageA: a.integer(),
        abilityExpressionA: a.integer(),

        draftText: a.string(),
        aiSuggestedText: a.string(),
        finalText: a.string(),
        status: a.ref("PlanStatus"),

        quarterPlans: a.hasMany("ClassQuarterPlan", "classAnnualPlanId"),
      })
      .secondaryIndexes((index) => [
        index("classroomId")
          .sortKeys(["fiscalYear"])
          .queryField("listClassAnnualPlansByClassroomYear"),
        index("schoolAnnualAgeTargetId")
          .sortKeys(["fiscalYear"])
          .queryField("listClassAnnualPlansByAgeTargetYear"),
        index("tenantId")
          .sortKeys(["fiscalYear", "ageBand"])
          .queryField("listClassAnnualPlansByTenantYearAge"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    ClassQuarterPlan: a
      .model({
        tenantId: a.string().required(),

        classAnnualPlanId: a.id().required(),
        classAnnualPlan: a.belongsTo("ClassAnnualPlan", "classAnnualPlanId"),

        fiscalYear: a.integer().required(),
        termNo: a.integer().required(),
        title: a.string().required(),
        periodStart: a.date(),
        periodEnd: a.date(),

        ageBand: a.string().required(),
        goalTextB: a.string(),

        abilityHealthB: a.integer(),
        abilityHumanRelationsB: a.integer(),
        abilityEnvironmentB: a.integer(),
        abilityLanguageB: a.integer(),
        abilityExpressionB: a.integer(),

        draftText: a.string(),
        aiSuggestedText: a.string(),
        finalText: a.string(),
        status: a.ref("PlanStatus"),

        quarterEvents: a.hasMany("QuarterEvent", "classQuarterPlanId"),
        monthPlans: a.hasMany("ClassMonthPlan", "classQuarterPlanId"),
      })
      .secondaryIndexes((index) => [
        index("classAnnualPlanId")
          .sortKeys(["termNo"])
          .queryField("listClassQuarterPlansByAnnualTerm"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    QuarterEvent: a
      .model({
        classQuarterPlanId: a.id().required(),
        classQuarterPlan: a.belongsTo("ClassQuarterPlan", "classQuarterPlanId"),

        label: a.string().required(),
        eventMonth: a.integer(),
        sortOrder: a.integer(),
      })
      .secondaryIndexes((index) => [
        index("classQuarterPlanId")
          .sortKeys(["sortOrder"])
          .queryField("listQuarterEventsByPlan"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    ClassMonthPlan: a
      .model({
        tenantId: a.string().required(),

        classQuarterPlanId: a.id().required(),
        classQuarterPlan: a.belongsTo("ClassQuarterPlan", "classQuarterPlanId"),

        fiscalYear: a.integer().required(),
        monthKey: a.string().required(), // 2026-04
        title: a.string().required(),
        periodStart: a.date(),
        periodEnd: a.date(),

        ageBand: a.string().required(),
        goalTextC: a.string(),

        abilityHealthC: a.integer(),
        abilityHumanRelationsC: a.integer(),
        abilityEnvironmentC: a.integer(),
        abilityLanguageC: a.integer(),
        abilityExpressionC: a.integer(),

        draftText: a.string(),
        aiSuggestedText: a.string(),
        finalText: a.string(),
        status: a.ref("PlanStatus"),

        monthEvents: a.hasMany("MonthEvent", "classMonthPlanId"),
        weekPlans: a.hasMany("ClassWeekPlan", "classMonthPlanId"),
      })
      .secondaryIndexes((index) => [
        index("classQuarterPlanId")
          .sortKeys(["monthKey"])
          .queryField("listClassMonthPlansByQuarterMonth"),
        index("tenantId")
          .sortKeys(["monthKey"])
          .queryField("listClassMonthPlansByTenantMonth"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    MonthEvent: a
      .model({
        classMonthPlanId: a.id().required(),
        classMonthPlan: a.belongsTo("ClassMonthPlan", "classMonthPlanId"),

        label: a.string().required(),
        eventDate: a.date(),
        sortOrder: a.integer(),
      })
      .secondaryIndexes((index) => [
        index("classMonthPlanId")
          .sortKeys(["sortOrder"])
          .queryField("listMonthEventsByPlan"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    ClassWeekPlan: a
      .model({
        classMonthPlanId: a.id().required(),
        classMonthPlan: a.belongsTo("ClassMonthPlan", "classMonthPlanId"),

        weekNo: a.integer().required(),
        title: a.string().required(),
        periodStart: a.date(),
        periodEnd: a.date(),

        ageBand: a.string().required(),
        goalTextC: a.string(),

        abilityHealthD: a.integer(),
        abilityHumanRelationsD: a.integer(),
        abilityEnvironmentD: a.integer(),
        abilityLanguageD: a.integer(),
        abilityExpressionD: a.integer(),

        status: a.ref("PlanStatus"),

        assignments: a.hasMany(
          "ClassWeekPracticeAssignment",
          "classWeekPlanId",
        ),
        dayPlans: a.hasMany("ClassDayPlan", "classWeekPlanId"),
      })
      .secondaryIndexes((index) => [
        index("classMonthPlanId")
          .sortKeys(["weekNo"])
          .queryField("listClassWeekPlansByMonthWeek"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    ClassWeekPracticeAssignment: a
      .model({
        classWeekPlanId: a.id().required(),
        classWeekPlan: a.belongsTo("ClassWeekPlan", "classWeekPlanId"),

        dayNo: a.integer().required(),
        targetDate: a.date(),
        practiceCode: a.string(),
        eventLabel: a.string(),
        note: a.string(),
        sortOrder: a.integer(),
      })
      .secondaryIndexes((index) => [
        index("classWeekPlanId")
          .sortKeys(["dayNo"])
          .queryField("listClassWeekPracticeAssignmentsByWeekDay"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    ScheduleMonth: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        classroomId: a.id().required(),
        classroom: a.belongsTo("Classroom", "classroomId"),

        ageTargetId: a.id().required(),
        ageTarget: a.belongsTo("SchoolAnnualAgeTarget", "ageTargetId"),

        sourceClassMonthPlanId: a.id(),

        monthKey: a.string().required(), // 例: 2026-04
        title: a.string(),
        notes: a.string(),

        status: a.ref("SchedulePlanStatus").required(),
        issueType: a.ref("ScheduleIssueType"),
        issueVersion: a.integer(),

        issuedAt: a.datetime(),
        closedAt: a.datetime(),

        items: a.hasMany("ScheduleMonthItem", "scheduleMonthId"),
        weeks: a.hasMany("ScheduleWeek", "sourceScheduleMonthId"),
      })
      .secondaryIndexes((index) => [
        index("classroomId")
          .sortKeys(["monthKey"])
          .queryField("listScheduleMonthsByClassroomMonthKey"),
        index("ageTargetId")
          .sortKeys(["monthKey"])
          .queryField("listScheduleMonthsByAgeTargetMonthKey"),
        index("owner")
          .sortKeys(["monthKey"])
          .queryField("listScheduleMonthsByOwnerMonthKey"),
        index("sourceClassMonthPlanId")
          .sortKeys(["monthKey"])
          .queryField("listScheduleMonthsBySourceClassMonthPlan"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create", "update"]),
      ]),

    ScheduleMonthItem: a
      .model({
        tenantId: a.string().required(),
        owner: a.string().required(),

        scheduleMonthId: a.id().required(),
        scheduleMonth: a.belongsTo("ScheduleMonth", "scheduleMonthId"),

        weekNoInMonth: a.integer().required(), // 1..5
        dayOfWeek: a.integer().required(), // 0=Sun ... 6=Sat

        sourceType: a.ref("ScheduleSourceType").required(),

        title: a.string().required(),
        description: a.string(),
        startTime: a.string().required(), // HH:mm
        endTime: a.string().required(), // HH:mm
        sortOrder: a.integer().required(),

        practiceCode: a.string(),
        practiceTitleSnapshot: a.string(),

        scoreHealth: a.integer(),
        scoreHumanRelations: a.integer(),
        scoreEnvironment: a.integer(),
        scoreLanguage: a.integer(),
        scoreExpression: a.integer(),

        weekItems: a.hasMany("ScheduleWeekItem", "sourceMonthItemId"),
      })
      .secondaryIndexes((index) => [
        index("scheduleMonthId")
          .sortKeys(["weekNoInMonth", "dayOfWeek", "sortOrder"])
          .queryField("listScheduleMonthItemsByMonthWeekDaySort"),
        index("practiceCode").queryField(
          "listScheduleMonthItemsByPracticeCode",
        ),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("owner"),
        allow.authenticated().to(["read", "create", "update"]),
      ]),

    ClassDayPlan: a
      .model({
        classWeekPlanId: a.id().required(),
        classWeekPlan: a.belongsTo("ClassWeekPlan", "classWeekPlanId"),

        targetDate: a.date().required(),
        title: a.string().required(),
        periodStart: a.date(),
        periodEnd: a.date(),

        ageBand: a.string().required(),
        goalTextC: a.string(),

        abilityHealthC: a.integer(),
        abilityHumanRelationsC: a.integer(),
        abilityEnvironmentC: a.integer(),
        abilityLanguageC: a.integer(),
        abilityExpressionC: a.integer(),

        status: a.ref("PlanStatus"),

        programItems: a.hasMany("ClassDayProgramItem", "classDayPlanId"),
      })
      .secondaryIndexes((index) => [
        index("classWeekPlanId")
          .sortKeys(["targetDate"])
          .queryField("listClassDayPlansByWeekDate"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),

    ClassDayProgramItem: a
      .model({
        classDayPlanId: a.id().required(),
        classDayPlan: a.belongsTo("ClassDayPlan", "classDayPlanId"),

        sortOrder: a.integer(),
        startTime: a.time(),
        endTime: a.time(),
        programType: a.ref("DayProgramType").required(),
        title: a.string().required(),
        practiceCode: a.string(),
        note: a.string(),
      })
      .secondaryIndexes((index) => [
        index("classDayPlanId")
          .sortKeys(["sortOrder"])
          .queryField("listClassDayProgramItemsByDaySort"),
      ])
      .authorization((allow) => [
        allow.authenticated().to(["create", "read", "update", "delete"]),
      ]),
    EnsureFiscalYearTemplateV2Response: a.customType({
      tenantId: a.string().required(),
      fiscalYear: a.integer().required(),
      schoolAnnualPlanId: a.id().required(),
      createdSchoolAnnualPlan: a.boolean().required(),
      createdAgeTargetCount: a.integer().required(),
      createdClassAnnualPlanCount: a.integer().required(),
      createdQuarterPlanCount: a.integer().required(),
      createdMonthPlanCount: a.integer().required(),
      status: a.string().required(),
      message: a.string(),
    }),

    IssueScheduleWeekFromScheduleMonthResponse: a.customType({
      scheduleMonthId: a.id().required(),
      scheduleWeekId: a.id().required(),
      weekStartDate: a.date().required(),
      weekEndDate: a.date().required(),
      createdWeek: a.boolean().required(),
      createdItemCount: a.integer().required(),
      status: a.string().required(),
      message: a.string(),
    }),

    issueScheduleWeekFromScheduleMonth: a
      .mutation()
      .arguments({
        scheduleMonthId: a.id().required(),
        weekStartDate: a.date().required(),
        weekEndDate: a.date().required(),
        weekNo: a.integer().required(),
        issueType: a.ref("ScheduleIssueType"),
      })
      .returns(a.ref("IssueScheduleWeekFromScheduleMonthResponse"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(issueScheduleWeekFromScheduleMonthFn)),

    ensureFiscalYearTemplateV2: a
      .mutation()
      .arguments({
        tenantId: a.string().required(),
        fiscalYear: a.integer().required(),
      })
      .returns(a.ref("EnsureFiscalYearTemplateV2Response"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(ensureFiscalYearTemplateV2Fn)),
  })
  .authorization((allow) => [
    allow.resource(dailyDigest),
    allow.resource(transcribePoller),
    allow.resource(summarizeAudioFn),
    allow.resource(analyzePracticeFn),
    allow.resource(suggestPracticeLinksFn),
    allow.resource(registerPracticeLinksFn),
    allow.resource(ensureFiscalYearTemplateFn),
    allow.resource(ensureFiscalYearTemplateV2Fn),
    allow.resource(issueNextDaySchedules),
    allow.resource(analyzeTranscriptObservationsFn),
    allow.resource(issueScheduleDayFromScheduleWeekFn),
    allow.resource(issueScheduleWeekFromScheduleMonthFn),
    allow.resource(syncScheduleDayObservationsFn),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 7,
    },
  },
});
