"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { callLogSchema } from "@/lib/validations/call-log.schema";
import { revalidatePath } from "next/cache";

async function requireStaff() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

async function logActivity(actorId: string, action: string, entityId: string) {
  await prisma.activityLog.create({
    data: { actorId, action, entityType: "CallLog", entityId },
  });
}

export async function getCallLogs() {
  await requireStaff();
  return prisma.callLog.findMany({
    orderBy: { calledAt: "desc" },
    include: {
      profile: { select: { id: true, name: true, profileCode: true } },
    },
  });
}

export async function createCallLogAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const parsed = callLogSchema.safeParse({
    profileId: formData.get("profileId"),
    outcome: formData.get("outcome") || "CONNECTED",
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const callLog = await prisma.callLog.create({
    data: {
      profileId: parsed.data.profileId,
      outcome: parsed.data.outcome,
      notes: parsed.data.notes || null,
      createdById: session.user.id,
    },
  });

  await logActivity(session.user.id, "CREATE_CALL_LOG", callLog.id);

  revalidatePath("/dashboard/admin/meetings");
  return { error: null };
}