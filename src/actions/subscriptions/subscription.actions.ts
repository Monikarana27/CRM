"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { subscriptionSchema } from "@/lib/validations/subscription.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireStaff() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function logActivity(actorId: string, action: string, entityId: string) {
  await prisma.activityLog.create({
    data: { actorId, action, entityType: "Subscription", entityId },
  });
}

export async function getSubscriptions(filter?: { status?: "ACTIVE" | "HOLD" | "EXPIRED" }) {
  await requireStaff();
  return prisma.subscription.findMany({
    where: filter?.status ? { status: filter.status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      profile: { select: { id: true, name: true, profileCode: true } },
      plan: { select: { id: true, name: true, price: true } },
    },
  });
}

export async function getSubscriptionById(id: string) {
  await requireStaff();
  return prisma.subscription.findUnique({
    where: { id },
    include: { profile: true, plan: true },
  });
}

export async function createSubscriptionAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const parsed = subscriptionSchema.safeParse({
    profileId: formData.get("profileId"),
    planId: formData.get("planId"),
    status: formData.get("status") || "ACTIVE",
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan) {
    return { error: "Selected plan not found" };
  }

  const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const subscription = await prisma.subscription.create({
    data: {
      profileId: parsed.data.profileId,
      planId: parsed.data.planId,
      status: parsed.data.status,
      startDate,
      endDate,
      createdById: session.user.id,
    },
  });

  await logActivity(session.user.id, "CREATE_SUBSCRIPTION", subscription.id);

  revalidatePath("/dashboard/admin/subscriptions");
  redirect("/dashboard/admin/subscriptions");
}

export async function updateSubscriptionStatusAction(
  subscriptionId: string,
  status: "ACTIVE" | "HOLD" | "EXPIRED"
) {
  const session = await requireStaff();

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status },
  });

  await logActivity(session.user.id, `SUBSCRIPTION_STATUS_${status}`, subscriptionId);

  revalidatePath("/dashboard/admin/subscriptions");
}
