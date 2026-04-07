import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

import type { Schema } from "../resource";
import { env } from "$amplify/env/ensure-fiscal-year-template-v2";

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

function fiscalYearStart(fiscalYear: number) {
  return formatDate(fiscalYear, 4, 1);
}

function fiscalYearEnd(fiscalYear: number) {
  return formatDate(fiscalYear + 1, 3, 31);
}

function getQuarterDefs(fiscalYear: number) {
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

function normalizeAgeBand(v: string | null | undefined) {
  return String(v ?? "").trim();
}

export const handler: Schema["ensureFiscalYearTemplateV2"]["functionHandler"] =
  async (event) => {
    const { tenantId, fiscalYear } = event.arguments;

    // 1) 既存データ読み込み
    const [
      schoolAnnualPlanRes,
      ageTargetRes,
      classroomRes,
      classAnnualPlanRes,
      quarterPlanRes,
      monthPlanRes,
    ] = await Promise.all([
      client.models.SchoolAnnualPlan.list({
        filter: {
          tenantId: { eq: tenantId },
          fiscalYear: { eq: fiscalYear },
        },
        limit: 100,
      }),
      client.models.SchoolAnnualAgeTarget.list({
        filter: {
          tenantId: { eq: tenantId },
          fiscalYear: { eq: fiscalYear },
        },
        limit: 100,
      }),
      client.models.Classroom.list({
        filter: { tenantId: { eq: tenantId } },
        limit: 1000,
      }),
      client.models.ClassAnnualPlan.list({
        filter: {
          tenantId: { eq: tenantId },
          fiscalYear: { eq: fiscalYear },
        },
        limit: 2000,
      }),
      client.models.ClassQuarterPlan.list({
        filter: {
          tenantId: { eq: tenantId },
          fiscalYear: { eq: fiscalYear },
        },
        limit: 5000,
      }),
      client.models.ClassMonthPlan.list({
        filter: {
          tenantId: { eq: tenantId },
          fiscalYear: { eq: fiscalYear },
        },
        limit: 10000,
      }),
    ]);

    const schoolAnnualPlans = schoolAnnualPlanRes.data ?? [];
    const ageTargets = ageTargetRes.data ?? [];
    const classrooms = (classroomRes.data ?? []).filter((c) => {
      const status = String(c.status ?? "active").toLowerCase();
      return status !== "archived";
    });
    const classAnnualPlans = classAnnualPlanRes.data ?? [];
    const quarterPlans = quarterPlanRes.data ?? [];
    const monthPlans = monthPlanRes.data ?? [];

    // 2) 保育所の年計画
    let createdSchoolAnnualPlan = false;
    let schoolAnnualPlan =
      schoolAnnualPlans.find((p) => p.fiscalYear === fiscalYear) ?? null;

    if (!schoolAnnualPlan) {
      const created = await client.models.SchoolAnnualPlan.create({
        tenantId,
        fiscalYear,
        title: `${fiscalYear}年度 保育所年計画`,
        periodStart: fiscalYearStart(fiscalYear),
        periodEnd: fiscalYearEnd(fiscalYear),
        status: "DRAFT",
      });

      if (created.errors?.length) {
        throw new Error(created.errors.map((e) => e.message).join("\n"));
      }

      schoolAnnualPlan = created.data ?? null;
      if (!schoolAnnualPlan?.id) {
        throw new Error("Failed to create SchoolAnnualPlan");
      }
      createdSchoolAnnualPlan = true;
    }

    // 3) 年齢別年間方針
    const targetAgeBands = ["3歳", "4歳", "5歳"];
    let createdAgeTargetCount = 0;

    const ageTargetByAge = new Map<string, Schema["SchoolAnnualAgeTarget"]["type"]>();
    for (const item of ageTargets) {
      ageTargetByAge.set(normalizeAgeBand(item.ageBand), item);
    }

    for (let i = 0; i < targetAgeBands.length; i += 1) {
      const ageBand = targetAgeBands[i];
      if (ageTargetByAge.has(ageBand)) continue;

      const created = await client.models.SchoolAnnualAgeTarget.create({
        tenantId,
        fiscalYear,
        schoolAnnualPlanId: schoolAnnualPlan.id,
        ageBand,
        goalTextA: "",
        status: "DRAFT",
        sortOrder: i + 1,
      });

      if (created.errors?.length) {
        throw new Error(created.errors.map((e) => e.message).join("\n"));
      }

      const row = created.data;
      if (!row?.id) {
        throw new Error(`Failed to create SchoolAnnualAgeTarget: ${ageBand}`);
      }

      ageTargetByAge.set(ageBand, row);
      createdAgeTargetCount += 1;
    }

    // 4) 各クラスの年計画
    let createdClassAnnualPlanCount = 0;

    const classAnnualPlanByClassroom = new Map<
      string,
      Schema["ClassAnnualPlan"]["type"]
    >();

    for (const row of classAnnualPlans) {
      classAnnualPlanByClassroom.set(row.classroomId, row);
    }

    for (const classroom of classrooms) {
      const classroomId = classroom.id;
      const ageBand = normalizeAgeBand(classroom.ageBand);
      const ageTarget = ageTargetByAge.get(ageBand);

      if (!classroomId || !ageTarget?.id) continue;
      if (classAnnualPlanByClassroom.has(classroomId)) continue;

      const created = await client.models.ClassAnnualPlan.create({
        tenantId,
        classroomId,
        schoolAnnualPlanId: schoolAnnualPlan.id,
        schoolAnnualAgeTargetId: ageTarget.id,
        fiscalYear,
        title: `${fiscalYear}年度 ${classroom.name} 年計画`,
        periodStart: fiscalYearStart(fiscalYear),
        periodEnd: fiscalYearEnd(fiscalYear),
        ageBand,
        goalTextA: ageTarget.goalTextA ?? "",
        abilityHealthA: ageTarget.abilityHealthA ?? null,
        abilityHumanRelationsA: ageTarget.abilityHumanRelationsA ?? null,
        abilityEnvironmentA: ageTarget.abilityEnvironmentA ?? null,
        abilityLanguageA: ageTarget.abilityLanguageA ?? null,
        abilityExpressionA: ageTarget.abilityExpressionA ?? null,
        status: "DRAFT",
      });

      if (created.errors?.length) {
        throw new Error(created.errors.map((e) => e.message).join("\n"));
      }

      const row = created.data;
      if (!row?.id) {
        throw new Error(`Failed to create ClassAnnualPlan: ${classroom.name}`);
      }

      classAnnualPlanByClassroom.set(classroomId, row);
      createdClassAnnualPlanCount += 1;
    }

    // 5) 4期
    let createdQuarterPlanCount = 0;
    const quarterDefs = getQuarterDefs(fiscalYear);

    const quarterPlanKeySet = new Set(
      quarterPlans.map((p) => `${p.classAnnualPlanId}::${p.termNo}`)
    );

    for (const classAnnualPlan of classAnnualPlanByClassroom.values()) {
      for (const q of quarterDefs) {
        const key = `${classAnnualPlan.id}::${q.termNo}`;
        if (quarterPlanKeySet.has(key)) continue;

        const created = await client.models.ClassQuarterPlan.create({
          tenantId,
          classAnnualPlanId: classAnnualPlan.id,
          fiscalYear,
          termNo: q.termNo,
          title: q.title,
          periodStart: q.start,
          periodEnd: q.end,
          ageBand: classAnnualPlan.ageBand,
          goalTextB: "",
          status: "DRAFT",
        });

        if (created.errors?.length) {
          throw new Error(created.errors.map((e) => e.message).join("\n"));
        }

        quarterPlanKeySet.add(key);
        createdQuarterPlanCount += 1;
      }
    }

    // 6) 12か月
    const refreshedQuarterPlanRes = await client.models.ClassQuarterPlan.list({
      filter: {
        tenantId: { eq: tenantId },
        fiscalYear: { eq: fiscalYear },
      },
      limit: 5000,
    });

    const refreshedQuarterPlans = refreshedQuarterPlanRes.data ?? [];
    const quarterPlanByAnnualAndTerm = new Map<
      string,
      Schema["ClassQuarterPlan"]["type"]
    >();

    for (const p of refreshedQuarterPlans) {
      quarterPlanByAnnualAndTerm.set(`${p.classAnnualPlanId}::${p.termNo}`, p);
    }

    let createdMonthPlanCount = 0;
    const monthPlanKeySet = new Set(
      monthPlans.map((p) => `${p.classQuarterPlanId}::${p.monthKey}`)
    );

    for (const classAnnualPlan of classAnnualPlanByClassroom.values()) {
      for (const q of quarterDefs) {
        const quarterPlan = quarterPlanByAnnualAndTerm.get(
          `${classAnnualPlan.id}::${q.termNo}`
        );
        if (!quarterPlan?.id) continue;

        for (const m of q.months) {
          const monthKey = `${m.year}-${pad2(m.month)}`;
          const key = `${quarterPlan.id}::${monthKey}`;
          if (monthPlanKeySet.has(key)) continue;

          const created = await client.models.ClassMonthPlan.create({
            tenantId,
            classQuarterPlanId: quarterPlan.id,
            fiscalYear,
            monthKey,
            title: `${m.year}年${m.month}月`,
            periodStart: formatDate(m.year, m.month, 1),
            periodEnd: formatDate(m.year, m.month, lastDayOfMonth(m.year, m.month)),
            ageBand: classAnnualPlan.ageBand,
            goalTextC: "",
            status: "DRAFT",
          });

          if (created.errors?.length) {
            throw new Error(created.errors.map((e) => e.message).join("\n"));
          }

          monthPlanKeySet.add(key);
          createdMonthPlanCount += 1;
        }
      }
    }

    return {
      tenantId,
      fiscalYear,
      schoolAnnualPlanId: schoolAnnualPlan.id,
      createdSchoolAnnualPlan,
      createdAgeTargetCount,
      createdClassAnnualPlanCount,
      createdQuarterPlanCount,
      createdMonthPlanCount,
      status: "OK",
      message: "V2 年度テンプレートを準備しました。",
    };
  };