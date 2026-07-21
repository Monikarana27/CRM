"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function sendToProfileCreationAction(leadId: string) {
  const session = await auth();
  if (!session?.user) return { error: "You must be logged in." };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { error: "This lead could not be found." };
 if (lead.status !== "INTERESTED") {
    return { error: "Please mark this lead as Interested before sending it for profile creation." };
  }

  const existing = await prisma.profileQueue.findUnique({ where: { leadId } });
  if (existing) return { error: "This lead has already been sent for profile creation." };

  const queueEntry = await prisma.profileQueue.create({
    data: { leadId, sentById: session.user.id },
  });

  await prisma.activityLog.create({
    data: { actorId: session.user.id, action: "SEND_TO_PROFILE_CREATION", entityType: "Lead", entityId: leadId },
  });

  revalidatePath("/dashboard/admin/leads");
  return { error: null };
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

export async function markQueueInProgressAction(queueId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.profileQueue.updateMany({
    where: { id: queueId, status: "PENDING" },
    data: { status: "IN_PROGRESS" },
  });
}

export async function markQueueCompletedAction(queueId: string, profileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.profileQueue.update({
    where: { id: queueId },
    data: { status: "COMPLETED", createdProfileId: profileId, completedAt: new Date() },
  });

  revalidatePath("/dashboard/profile-creator");
}

export async function getProfileCreatorDashboard() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN", "PROFILE_CREATOR"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [pending, inProgress, completedToday, returnedForCorrection] = await Promise.all([
    prisma.profileQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { sentToQueueAt: "desc" },
      include: { lead: true },
    }),
    prisma.profileQueue.findMany({
      where: { status: "IN_PROGRESS" },
      orderBy: { sentToQueueAt: "desc" },
      include: { lead: true },
    }),
    prisma.profileQueue.findMany({
      where: { status: "COMPLETED", completedAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { completedAt: "desc" },
      include: { lead: true },
    }),
    prisma.profile.findMany({
      where: { approvalStatus: "NEEDS_CHANGES", createdById: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, profileCode: true, approvalNotes: true, updatedAt: true },
    }),
  ]);

  return { pending, inProgress, completedToday, returnedForCorrection };
}