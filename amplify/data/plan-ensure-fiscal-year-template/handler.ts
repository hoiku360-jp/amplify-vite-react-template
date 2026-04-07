import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

import type { Schema } from "../resource";
import { env } from "$amplify/env/ensure-fiscal-year-template";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function lastDayOfMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function getFiscalYearStart(fiscalYear: number) {
  return formatDate(fiscalYear, 4, 1);
}

function getFiscalYearEnd(fiscalYear: number) {
  return formatDate(fiscalYear + 1, 3, 31);
}

function buildYearPlanKey(classroomId: string, fiscalYear: number) {
  return `classroom:${classroomId}:fy:${fiscalYear}:year`;
}

function buildTermPlanKey(
  classroomId: string,
  fiscalYear: number,
  termNo: number
) {
  return `classroom:${classroomId}:fy:${fiscalYear}:term:${termNo}`;
}

function buildMonthPlanKey(classroomId: string, monthKey: string) {
  return `classroom:${classroomId}:month:${monthKey}`;
}

function getTermDefs(fiscalYear: number) {
  return [
    {
      termNo: 1,
      title: `${fiscalYear}年4-6月`,
      start: formatDate(fiscalYear, 4, 1),
      end: formatDate(fiscalYear, 6, 30),
      months: [
        { year: fiscalYear, month: 4 },
        { year: fiscalYear, month: 5 },
        { year: fiscalYear, month: 6 },
      ],
    },
    {
      termNo: 2,
      title: `${fiscalYear}年7-9月`,
      start: formatDate(fiscalYear, 7, 1),
      end: formatDate(fiscalYear, 9, 30),
      months: [
        { year: fiscalYear, month: 7 },
        { year: fiscalYear, month: 8 },
        { year: fiscalYear, month: 9 },
      ],
    },
    {
      termNo: 3,
      title: `${fiscalYear}年10-12月`,
      start: formatDate(fiscalYear, 10, 1),
      end: formatDate(fiscalYear, 12, 31),
      months: [
        { year: fiscalYear, month: 10 },
        { year: fiscalYear, month: 11 },
        { year: fiscalYear, month: 12 },
      ],
    },
    {
      termNo: 4,
      title: `${fiscalYear + 1}年1-3月`,
      start: formatDate(fiscalYear + 1, 1, 1),
      end: formatDate(fiscalYear + 1, 3, 31),
      months: [
        { year: fiscalYear + 1, month: 1 },
        { year: fiscalYear + 1, month: 2 },
        { year: fiscalYear + 1, month: 3 },
      ],
    },
  ];
}

export const handler: Schema["ensureFiscalYearTemplate"]["functionHandler"] =
  async (event) => {
    const { classroomId, fiscalYear } = event.arguments;

    const { data: existingPlans, errors: listErrors } =
      await client.models.Plan.list({
        filter: { classroomId: { eq: classroomId } },
        limit: 5000,
      });

    if (listErrors?.length) {
      throw new Error(listErrors.map((e) => e.message).join("\n"));
    }

    const plans = existingPlans ?? [];

    const existingByPlanKey = new Map<string, Schema["Plan"]["type"]>();
    for (const p of plans) {
      const key = p.planKey ?? "";
      if (key) existingByPlanKey.set(key, p);
    }

    let createdYear = false;
    let createdTermCount = 0;
    let createdMonthCount = 0;

    const yearPlanKey = buildYearPlanKey(classroomId, fiscalYear);

    let yearPlan = existingByPlanKey.get(yearPlanKey);

    if (!yearPlan) {
      const created = await client.models.Plan.create({
        classroomId,
        planType: "YEAR",
        title: `${fiscalYear}年度`,
        fiscalYear,
        planKey: yearPlanKey,
        periodStart: getFiscalYearStart(fiscalYear),
        periodEnd: getFiscalYearEnd(fiscalYear),
        status: "DRAFT",
      });

      if (created.errors?.length) {
        throw new Error(created.errors.map((e) => e.message).join("\n"));
      }

      yearPlan = created.data ?? undefined;
      if (!yearPlan?.id) {
        throw new Error("Failed to create year plan");
      }

      existingByPlanKey.set(yearPlanKey, yearPlan);
      createdYear = true;
    }

    const termDefs = getTermDefs(fiscalYear);

    for (const termDef of termDefs) {
      const termPlanKey = buildTermPlanKey(
        classroomId,
        fiscalYear,
        termDef.termNo
      );

      let termPlan = existingByPlanKey.get(termPlanKey);

      if (!termPlan) {
        const created = await client.models.Plan.create({
          classroomId,
          parentPlanId: yearPlan.id,
          planType: "TERM",
          title: termDef.title,
          fiscalYear,
          termNo: termDef.termNo,
          planKey: termPlanKey,
          periodStart: termDef.start,
          periodEnd: termDef.end,
          status: "DRAFT",
        });

        if (created.errors?.length) {
          throw new Error(created.errors.map((e) => e.message).join("\n"));
        }

        termPlan = created.data ?? undefined;
        if (!termPlan?.id) {
          throw new Error(`Failed to create term plan: ${termDef.termNo}`);
        }

        existingByPlanKey.set(termPlanKey, termPlan);
        createdTermCount += 1;
      }

      for (const m of termDef.months) {
        const monthKey = `${m.year}-${pad2(m.month)}`;
        const monthPlanKey = buildMonthPlanKey(classroomId, monthKey);

        let monthPlan = existingByPlanKey.get(monthPlanKey);

        if (!monthPlan) {
          const created = await client.models.Plan.create({
            classroomId,
            parentPlanId: termPlan.id,
            planType: "MONTH",
            title: `${m.year}年${m.month}月`,
            fiscalYear,
            termNo: termDef.termNo,
            monthKey,
            planKey: monthPlanKey,
            periodStart: formatDate(m.year, m.month, 1),
            periodEnd: formatDate(m.year, m.month, lastDayOfMonth(m.year, m.month)),
            status: "DRAFT",
          });

          if (created.errors?.length) {
            throw new Error(created.errors.map((e) => e.message).join("\n"));
          }

          monthPlan = created.data ?? undefined;
          if (!monthPlan?.id) {
            throw new Error(`Failed to create month plan: ${monthKey}`);
          }

          existingByPlanKey.set(monthPlanKey, monthPlan);
          createdMonthCount += 1;
        }
      }
    }

    return {
      classroomId,
      fiscalYear,
      yearPlanId: yearPlan.id,
      createdYear,
      createdTermCount,
      createdMonthCount,
      status: "OK",
      message: "年度テンプレートを準備しました。",
    };
  };