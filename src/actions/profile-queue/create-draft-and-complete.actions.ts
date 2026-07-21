"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { generateProfileCode } from "@/lib/utils/profile-code";
import { profileSchema } from "@/lib/validations/profile.schema";
import { extractProfileData, extractPartnerPreferenceData } from "@/lib/utils/profile-data";
import { redirect } from "next/navigation";

export async function createDraftProfileFromQueueAction(
  queueId: string,
  _prevState: unknown,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN", "PROFILE_CREATOR"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const gender = String(formData.get("gender") || "");
  const source = String(formData.get("source") || "").trim();

  if (!name || !phone || !["MALE", "FEMALE", "OTHER"].includes(gender)) {
    return { error: "Name, phone, and gender are required." };
  }

  const profileCode = await generateProfileCode(gender as "MALE" | "FEMALE" | "OTHER");

  const profile = await prisma.profile.create({
    data: {
      profileCode,
      name,
      phone,
      email: email || null,
      source: source || null,
      gender: gender as "MALE" | "FEMALE" | "OTHER",
      status: "UNASSIGNED",
      approvalStatus: "PENDING_APPROVAL",
      createdById: session.user.id,
      partnerPreference: { create: {} },
    },
  });

  await prisma.profileQueue.update({
    where: { id: queueId },
    data: { createdProfileId: profile.id },
  });

  await prisma.activityLog.create({
    data: {
      actorId: session.user.id,
      action: "CREATE_DRAFT_PROFILE_FROM_QUEUE",
      entityType: "Profile",
      entityId: profile.id,
    },
  });

  redirect(`/dashboard/profile-creator/create/${queueId}`);
}

export async function updateAndCompleteQueueAction(
  queueId: string,
  profileId: string,
  _prevState: unknown,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN", "PROFILE_CREATOR"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const profileData = extractProfileData(parsed);
  const ppData = extractPartnerPreferenceData(parsed);
  if (!profileData || !ppData) return { error: "Invalid form data" };

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      ...profileData,
      partnerPreference: { upsert: { create: ppData, update: ppData } },
    },
  });

  await prisma.profileQueue.update({
    where: { id: queueId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      actorId: session.user.id,
      action: "COMPLETE_PROFILE_FROM_QUEUE",
      entityType: "Profile",
      entityId: profileId,
    },
  });

  redirect(`/dashboard/profile-creator`);
}
