"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { profileSchema } from "@/lib/validations/profile.schema";
import { generateProfileCode } from "@/lib/utils/profile-code";
import { redirect } from "next/navigation";

export async function createProfileFromQueueAction(queueId: string, _prevState: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN", "PROFILE_CREATOR"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const profileCode = await generateProfileCode(parsed.data.gender);

  const profile = await prisma.profile.create({
    data: {
      profileCode,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      gender: parsed.data.gender,
      status: "UNASSIGNED",
      approvalStatus: "PENDING_APPROVAL",
      createdById: session.user.id,
      partnerPreference: { create: {} },
    },
  });

  await prisma.profileQueue.update({
    where: { id: queueId },
    data: { status: "COMPLETED", createdProfileId: profile.id },
  });

  await prisma.activityLog.create({
    data: { actorId: session.user.id, action: "CREATE_PROFILE_FROM_QUEUE", entityType: "Profile", entityId: profile.id },
  });

  redirect(`/dashboard/profile-creator`);
}