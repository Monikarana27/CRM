"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function sendToProfileCreationAction(leadId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  if (lead.status !== "CONTACTED") throw new Error("Lead must be marked Interested (Contacted) first");

  const existing = await prisma.profileQueue.findUnique({ where: { leadId } });
  if (existing) throw new Error("Already sent to Profile Creation");

  const queueEntry = await prisma.profileQueue.create({
    data: { leadId, sentById: session.user.id },
  });

  await prisma.activityLog.create({
    data: { actorId: session.user.id, action: "SEND_TO_PROFILE_CREATION", entityType: "Lead", entityId: leadId },
  });

  revalidatePath("/dashboard/admin/leads");
  return queueEntry;
}

export async function getProfileQueue() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN", "PROFILE_CREATOR"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return prisma.profileQueue.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    orderBy: { sentToQueueAt: "desc" },
    include: { lead: true },
  });
}

export async function markQueueCompletedAction(queueId: string, profileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.profileQueue.update({
    where: { id: queueId },
    data: { status: "COMPLETED", createdProfileId: profileId },
  });

  revalidatePath("/dashboard/profile-creator/queue");
}