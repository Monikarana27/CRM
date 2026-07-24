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
  const session = await requireStaff();
  const isScopedRole = ["SALES", "SERVICE"].includes(session.user.role);

  return prisma.meeting.findMany({
    where: {
      ...(isScopedRole ? { assignedToId: session.user.id } : {}),
      ...(filter?.status ? { status: filter.status as any } : {}),
    },
    orderBy: { scheduledAt: "desc" },
    include: {
      profile: { select: { id: true, name: true, profileCode: true } },
      profileTwo: { select: { id: true, name: true, profileCode: true } },
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
    profileTwoId: formData.get("profileTwoId"),
    type: formData.get("type") || "TELE",
    status: formData.get("status") || "SCHEDULED",
    outcome: formData.get("outcome") || "PENDING",
    scheduledAt: formData.get("scheduledAt"),
    reminderAt: formData.get("reminderAt"),
    notes: formData.get("notes"),
    assignedToId: formData.get("assignedToId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);

  // Default reminder to 1 day before the meeting if not explicitly set.
  const reminderAt = parsed.data.reminderAt
    ? new Date(parsed.data.reminderAt)
    : new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);

  const meeting = await prisma.meeting.create({
    data: {
      profileId: parsed.data.profileId,
      profileTwoId: parsed.data.profileTwoId || null,
      type: parsed.data.type,
      status: parsed.data.status,
      outcome: parsed.data.outcome,
      scheduledAt,
      reminderAt,
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

export async function updateMeetingOutcomeAction(
  meetingId: string,
  outcome: "PENDING" | "POSITIVE" | "NEGATIVE" | "ONE_SIDED" | "FOLLOW_UP_NEEDED"
) {
  const session = await requireStaff();

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { outcome },
  });

  await logActivity(session.user.id, `MEETING_OUTCOME_${outcome}`, meetingId);

  revalidatePath("/dashboard/admin/meetings");
}

export async function rescheduleMeetingAction(meetingId: string, scheduledAt: string) {
  const session = await requireStaff();

  const newDate = new Date(scheduledAt);

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      scheduledAt: newDate,
      status: "SCHEDULED",
      // push the reminder along with the new date, keeping the same 1-day-before offset
      reminderAt: new Date(newDate.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  await logActivity(session.user.id, "RESCHEDULE_MEETING", meetingId);

  revalidatePath("/dashboard/admin/meetings");
}

export async function updateMeetingNotesAction(meetingId: string, notes: string) {
  const session = await requireStaff();

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { notes: notes || null },
  });

  await logActivity(session.user.id, "UPDATE_MEETING_NOTES", meetingId);

  revalidatePath("/dashboard/admin/meetings");
}
