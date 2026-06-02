"use server";

import { withTenant } from "@/lib/with-tenant";
import type { Money } from "@naql/core";
import { advances, attendance, auditLogs, employees, expenses } from "@naql/db/schema";
import { computePayslip } from "@naql/payroll";
import type { Payslip } from "@naql/payroll";
import { and, between, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface PayrollRunResult {
  month: string; // "2026-06"
  payslips: (Payslip & { employeeName: string })[];
  totalNetPaid: Money;
  totalEmployerCost: Money;
}

const payrollRunSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12),
  workingDays: z.number().int().min(18).max(23).default(22),
});

/**
 * Idempotent payroll run for one org/month.
 * Returns payslips for all active employees.
 * Does NOT auto-commit salary payments — owner reviews then approves.
 */
export const runPayroll = withTenant(
  "payroll:run",
  async ({ db, orgId, userId: actorId }, input: unknown) => {
    const { year, month, workingDays } = payrollRunSchema.parse(input);

    const monthLabel = `${year}-${String(month).padStart(2, "0")}`;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59); // last day of month

    const employeeList = await db
      .select()
      .from(employees)
      .where(eq(employees.organizationId, orgId));

    const payslips: (Payslip & { employeeName: string })[] = [];

    for (const emp of employeeList) {
      // Count absence days this month
      const absenceRows = await db
        .select({ status: attendance.status })
        .from(attendance)
        .where(
          and(
            eq(attendance.organizationId, orgId),
            eq(attendance.employeeId, emp.id),
            between(attendance.date, monthStart, monthEnd)
          )
        );

      const absenceDays = absenceRows.filter((r) => r.status === "absent").length;

      // Sum unrepaid advances for this month
      const advanceRows = await db
        .select({ amount: advances.amount })
        .from(advances)
        .where(
          and(
            eq(advances.organizationId, orgId),
            eq(advances.employeeId, emp.id),
            eq(advances.repaid, false),
            between(advances.grantedAt, monthStart, monthEnd)
          )
        );

      const advancesCentimes = advanceRows.reduce((s, a) => s + a.amount, 0) as Money;

      const payslip = computePayslip({
        employeeId: emp.id,
        grossCentimes: emp.baseSalary as Money,
        absenceDays,
        workingDays,
        advancesCentimes,
      });

      payslips.push({ ...payslip, employeeName: emp.fullName });

      // Record salary expense (audit — PII redacted in message)
      await db.insert(auditLogs).values({
        organizationId: orgId,
        actorUserId: actorId,
        entity: "payroll",
        entityId: `${emp.id}:${monthLabel}`,
        action: "approve",
        after: {
          month: monthLabel,
          employeeId: emp.id,
          net: "[REDACTED]",
          absenceDays,
        },
      });

      // Mark this month's advances as repaid
      if (advancesCentimes > 0) {
        await db
          .update(advances)
          .set({ repaid: true })
          .where(
            and(
              eq(advances.organizationId, orgId),
              eq(advances.employeeId, emp.id),
              eq(advances.repaid, false),
              between(advances.grantedAt, monthStart, monthEnd)
            )
          );
      }

      // Create salary expense entry for cost tracking
      await db.insert(expenses).values({
        organizationId: orgId,
        category: "salary",
        amount: payslip.net,
        spentAt: monthEnd,
        description: `Salaire ${emp.fullName} — ${monthLabel}`,
        source: "manual",
      });
    }

    const totalNetPaid = payslips.reduce((s, p) => s + p.net, 0) as Money;
    const totalEmployerCost = payslips.reduce((s, p) => s + p.totalEmployerCost, 0) as Money;

    revalidatePath("/hr/payroll");

    return {
      month: monthLabel,
      payslips,
      totalNetPaid,
      totalEmployerCost,
    } satisfies PayrollRunResult;
  }
);
