
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/issue-schedule-week-from-schedule-month";
import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

type HandlerArgs = {
  scheduleMonthId: string;
  weekStartDate: string;
  weekEndDate: string;
  weekNo: number;
  issueType?: "AUTO" | "MANUAL";
};

async function listAll(listFn: any, args: Record<string, unknown>) {
  const rows: any[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res: any = await listFn({
      ...args,
      nextToken,
    });

    if (Array.isArray(res?.data) && res.data.length > 0) {
      rows.push(...res.data);
    }

    nextToken = res?.nextToken;
  } while (nextToken);

  return rows;
}

export const handler: Schema["issueScheduleWeekFromScheduleMonth"]["functionHandler"] =
  async (event) => {
    const args = event.arguments as HandlerArgs;
    const issueType = args.issueType ?? "MANUAL";

    const monthRes = await client.models.ScheduleMonth.list({
      filter: {
        id: { eq: args.scheduleMonthId },
      },
    });

    const month = monthRes.data?.[0];
    if (!month) {
      throw new Error(`ScheduleMonth not found: ${args.scheduleMonthId}`);
    }

    const existingWeekRes = await client.models.ScheduleWeek.list({
      filter: {
        sourceScheduleMonthId: { eq: month.id },
        weekStartDate: { eq: args.weekStartDate },
        weekEndDate: { eq: args.weekEndDate },
      },
    });

    const existingWeek = existingWeekRes.data?.[0];
    if (existingWeek) {
      return {
        scheduleMonthId: month.id,
        scheduleWeekId: existingWeek.id,
        weekStartDate: args.weekStartDate,
        weekEndDate: args.weekEndDate,
        createdWeek: false,
        createdItemCount: 0,
        status: "ALREADY_ISSUED",
        message: "同じ週案は既に発行済みです。",
      };
    }

    const monthItems = await listAll(client.models.ScheduleMonthItem.list, {
      filter: {
        scheduleMonthId: { eq: month.id },
        weekNoInMonth: { eq: args.weekNo },
      },
    });

    const sortedMonthItems = [...monthItems].sort((a: any, b: any) => {
      const d = (a?.dayOfWeek ?? 0) - (b?.dayOfWeek ?? 0);
      if (d !== 0) return d;
      return (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0);
    });

    const weekCreateRes = await client.models.ScheduleWeek.create({
      tenantId: month.tenantId,
      owner: month.owner,
      classroomId: month.classroomId,
      ageTargetId: month.ageTargetId,
      sourceScheduleMonthId: month.id,
      sourceClassMonthPlanId: month.sourceClassMonthPlanId ?? undefined,
      monthKey: month.monthKey,
      weekNo: args.weekNo,
      weekStartDate: args.weekStartDate,
      weekEndDate: args.weekEndDate,
      status: "ACTIVE",
      issueType,
      issueVersion: 1,
      title: month.title
        ? `${month.title} / 第${args.weekNo}週`
        : `第${args.weekNo}週`,
      notes: month.notes ?? undefined,
      issuedAt: new Date().toISOString(),
    });

    const week = weekCreateRes.data;
    if (!week) {
      throw new Error(
        weekCreateRes.errors?.map((e: any) => e.message).join(", ") ||
          "ScheduleWeek create failed"
      );
    }

    let createdItemCount = 0;

    for (const item of sortedMonthItems) {
      const duplicateRes = await client.models.ScheduleWeekItem.list({
        filter: {
          scheduleWeekId: { eq: week.id },
          sourceMonthItemId: { eq: item.id },
        },
      });

      if ((duplicateRes.data?.length ?? 0) > 0) {
        continue;
      }

      const weekItemRes = await client.models.ScheduleWeekItem.create({
        tenantId: month.tenantId,
        owner: month.owner,
        scheduleWeekId: week.id,
        sourceMonthItemId: item.id,
        dayOfWeek: item.dayOfWeek,
        sourceType: item.sourceType,
        title: item.title,
        eventLabel: item.title,
        description: item.description ?? undefined,
        startTime: item.startTime,
        endTime: item.endTime,
        sortOrder: item.sortOrder,
        practiceCode: item.practiceCode ?? undefined,
        practiceTitleSnapshot: item.practiceTitleSnapshot ?? undefined,
        scoreHealth: item.scoreHealth ?? 0,
        scoreHumanRelations: item.scoreHumanRelations ?? 0,
        scoreEnvironment: item.scoreEnvironment ?? 0,
        scoreLanguage: item.scoreLanguage ?? 0,
        scoreExpression: item.scoreExpression ?? 0,
      });

      if (!weekItemRes.data) {
        throw new Error(
          weekItemRes.errors?.map((e: any) => e.message).join(", ") ||
            `ScheduleWeekItem create failed: ${item.title}`
        );
      }

      createdItemCount += 1;
    }

    return {
      scheduleMonthId: month.id,
      scheduleWeekId: week.id,
      weekStartDate: args.weekStartDate,
      weekEndDate: args.weekEndDate,
      createdWeek: true,
      createdItemCount,
      status: "ISSUED",
      message: "週案を発行しました。",
    };
  };
