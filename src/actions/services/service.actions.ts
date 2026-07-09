"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { serviceSchema } from "@/lib/validations/service.schema";
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
    data: { actorId, action, entityType: "Service", entityId },
  });
}

export async function getServices(filter?: { status?: "ACTIVE" | "HOLD" | "EXPIRED" }) {
  await requireStaff();
  return prisma.service.findMany({
    where: filter?.status ? { status: filter.status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      profile: { select: { id: true, name: true, profileCode: true } },
      plan: { select: { id: true, name: true, price: true } },
    },
  });
}

export async function getServiceById(id: string) {
  await requireStaff();
  return prisma.service.findUnique({
    where: { id },
    include: { profile: true, plan: true },
  });
}

export async function createServiceAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const parsed = serviceSchema.safeParse({
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

  const service = await prisma.service.create({
    data: {
      profileId: parsed.data.profileId,
      planId: parsed.data.planId,
      status: parsed.data.status,
      startDate,
      endDate,
      createdById: session.user.id,
    },
  });

  await logActivity(session.user.id, "CREATE_SERVICE", service.id);

  revalidatePath("/dashboard/admin/services");
  redirect("/dashboard/admin/services");
}

export async function updateServiceStatusAction(
  serviceId: string,
  status: "ACTIVE" | "HOLD" | "EXPIRED"
) {
  const session = await requireStaff();

  await prisma.service.update({
    where: { id: serviceId },
    data: { status },
  });

  await logActivity(session.user.id, `SERVICE_STATUS_${status}`, serviceId);

  revalidatePath("/dashboard/admin/services");
}