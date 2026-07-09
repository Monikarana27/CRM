"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { meetingSchema } from "@/lib/validations/meeting.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireStaff() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

async function logActivity(actorId: string, action: string, entityId: string) {
  await prisma.activityLog.create({
    data: { actorId, action, entityType: "Meeting", entityId },
  });
}

export async function getMeetings(filter?: { status?: string }) {
  await requireStaff();
  return prisma.meeting.findMany({
    where: filter?.status ? { status: filter.status as any } : {},
    orderBy: { scheduledAt: "desc" },
    include: {
      profile: { select: { id: true, name: true, profileCode: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function getMeetingById(id: string) {
  await requireStaff();
  return prisma.meeting.findUnique({ where: { id } });
}

export async function createMeetingAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const parsed = meetingSchema.safeParse({
    profileId: formData.get("profileId"),
    type: formData.get("type") || "TELE",
    status: formData.get("status") || "SCHEDULED",
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes"),
    assignedToId: formData.get("assignedToId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const meeting = await prisma.meeting.create({
    data: {
      profileId: parsed.data.profileId,
      type: parsed.data.type,
      status: parsed.data.status,
      scheduledAt: new Date(parsed.data.scheduledAt),
      notes: parsed.data.notes || null,
      assignedToId: parsed.data.assignedToId || null,
      createdById: session.user.id,
    },
  });

  await logActivity(session.user.id, "CREATE_MEETING", meeting.id);

  revalidatePath("/dashboard/admin/meetings");
  redirect("/dashboard/admin/meetings");
}

export async function updateMeetingStatusAction(
  meetingId: string,
  status: "SCHEDULED" | "COMPLETED" | "MISSED" | "CANCELLED"
) {
  const session = await requireStaff();

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status },
  });

  await logActivity(session.user.id, `MEETING_STATUS_${status}`, meetingId);

  revalidatePath("/dashboard/admin/meetings");
}