"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { planSchema } from "@/lib/validations/plan.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function logActivity(actorId: string, action: string, entityId: string) {
  await prisma.activityLog.create({
    data: { actorId, action, entityType: "Plan", entityId },
  });
}

export async function getPlans() {
  await requireAdmin();
  return prisma.plan.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getActivePlans() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });
}

export async function getPlanById(id: string) {
  await requireAdmin();
  return prisma.plan.findUnique({ where: { id } });
}

export async function createPlanAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireAdmin();

  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
    description: formData.get("description"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const plan = await prisma.plan.create({ data: parsed.data });

  await logActivity(session.user.id, "CREATE_PLAN", plan.id);

  revalidatePath("/dashboard/admin/plans");
  redirect("/dashboard/admin/plans");
}

export async function updatePlanAction(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireAdmin();

  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
    description: formData.get("description"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.plan.update({ where: { id }, data: parsed.data });

  await logActivity(session.user.id, "UPDATE_PLAN", id);

  revalidatePath("/dashboard/admin/plans");
  redirect("/dashboard/admin/plans");
}

export async function togglePlanActiveAction(id: string, active: boolean) {
  const session = await requireAdmin();
  await prisma.plan.update({ where: { id }, data: { active } });
  await logActivity(session.user.id, active ? "ACTIVATE_PLAN" : "DEACTIVATE_PLAN", id);
  revalidatePath("/dashboard/admin/plans");
}
