"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { salesTargetSchema } from "@/lib/validations/sales-target.schema";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

async function requireStaff() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

async function logActivity(actorId: string, action: string, entityId: string) {
  await prisma.activityLog.create({
    data: { actorId, action, entityType: "SalesTarget", entityId },
  });
}

/**
 * Achieved amount is auto-derived: sum of PAID payments for services
 * belonging to profiles currently assigned to this user, paid within
 * the given month/year.
 */
async function getAchievedAmount(userId: string, month: number, year: number) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const result = await prisma.payment.aggregate({
    where: {
      status: "PAID",
      paidAt: { gte: monthStart, lte: monthEnd },
      service: {
        profile: { assignedToId: userId },
      },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

export async function getSalesTargetsForMonth(month: number, year: number) {
  await requireAdmin();

  const employees = await prisma.user.findMany({
    where: { active: true, role: { in: ["SALES", "SERVICE"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const targets = await prisma.salesTarget.findMany({
    where: { month, year },
  });

  const results = await Promise.all(
    employees.map(async (emp) => {
      const target = targets.find((t) => t.userId === emp.id);
      const achieved = await getAchievedAmount(emp.id, month, year);
      return {
        employee: emp,
        targetAmount: target?.targetAmount ?? null,
        achievedAmount: achieved,
      };
    })
  );

  return results;
}

export async function getMyTarget(userId: string, month: number, year: number) {
  await requireStaff();

  const target = await prisma.salesTarget.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });

  const achieved = await getAchievedAmount(userId, month, year);

  return {
    targetAmount: target?.targetAmount ?? null,
    achievedAmount: achieved,
  };
}

export async function setSalesTargetAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireAdmin();

  const parsed = salesTargetSchema.safeParse({
    userId: formData.get("userId"),
    month: formData.get("month"),
    year: formData.get("year"),
    targetAmount: formData.get("targetAmount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const target = await prisma.salesTarget.upsert({
    where: {
      userId_month_year: {
        userId: parsed.data.userId,
        month: parsed.data.month,
        year: parsed.data.year,
      },
    },
    update: { targetAmount: parsed.data.targetAmount },
    create: {
      userId: parsed.data.userId,
      month: parsed.data.month,
      year: parsed.data.year,
      targetAmount: parsed.data.targetAmount,
      createdById: session.user.id,
    },
  });

  await logActivity(session.user.id, "SET_SALES_TARGET", target.id);

  revalidatePath("/dashboard/admin/sales-targets");
  return { error: null };
}