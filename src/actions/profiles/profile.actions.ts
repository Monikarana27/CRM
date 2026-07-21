"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { profileSchema } from "@/lib/validations/profile.schema";
import { generateProfileCode } from "@/lib/utils/profile-code";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractProfileData, extractPartnerPreferenceData } from "@/lib/utils/profile-data";

async function requireStaff() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function logActivity(actorId: string, action: string, entityId: string) {
  await prisma.activityLog.create({
    data: { actorId, action, entityType: "Profile", entityId },
  });
}

export async function getProfiles(filter?: {
  status?: "UNASSIGNED" | "ASSIGNED" | "REASSIGNED" | "ON_HOLD" | "EXPIRED";
  assignedToId?: string;
  source?: string;
}) {
  const session = await requireStaff();
  const isScopedRole = ["SALES", "SERVICE"].includes(session.user.role);

  return prisma.profile.findMany({
    where: {
      ...(isScopedRole ? { assignedToId: session.user.id } : {}),
      ...(!isScopedRole && filter?.status ? { status: filter.status } : {}),
      ...(!isScopedRole && filter?.assignedToId ? { assignedToId: filter.assignedToId } : {}),
      ...(filter?.source ? { source: filter.source } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function getProfileById(id: string) {
  await requireStaff();
  return prisma.profile.findUnique({
    where: { id },
    include: { partnerPreference: true },
  });
}



export async function createProfileAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const profileData = extractProfileData(parsed);
  const ppData = extractPartnerPreferenceData(parsed);
  if (!profileData || !ppData) {
    return { error: "Invalid form data" };
  }

  const profileCode = await generateProfileCode(parsed.data.gender);

  const profile = await prisma.profile.create({
    data: {
      ...profileData,
      profileCode,
      createdById: session.user.id,
      partnerPreference: { create: ppData },
    },
  });

  await logActivity(session.user.id, "CREATE_PROFILE", profile.id);

  revalidatePath("/dashboard/admin/profiles");
  redirect(`/dashboard/admin/profiles`);
}

export async function updateProfileAction(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const profileData = extractProfileData(parsed);
  const ppData = extractPartnerPreferenceData(parsed);
  if (!profileData || !ppData) {
    return { error: "Invalid form data" };
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { id },
    select: { approvalStatus: true },
  });

  await prisma.profile.update({
    where: { id },
    data: {
      ...profileData,
      ...(currentProfile?.approvalStatus === "NEEDS_CHANGES"
        ? { approvalStatus: "PENDING_APPROVAL" as const, approvalNotes: null }
        : {}),
      partnerPreference: {
        upsert: {
          create: ppData,
          update: ppData,
        },
      },
    },
  });

  await logActivity(session.user.id, "UPDATE_PROFILE", id);

  revalidatePath("/dashboard/admin/profiles");
  redirect(`/dashboard/admin/profiles`);
}

export async function assignProfileAction(profileId: string, employeeId: string) {
  const session = await requireStaff();

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  const wasAssigned = !!profile?.assignedToId;

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      assignedToId: employeeId,
      assignedAt: new Date(),
      status: wasAssigned ? "REASSIGNED" : "ASSIGNED",
    },
  });

  await logActivity(
    session.user.id,
    wasAssigned ? "REASSIGN_PROFILE" : "ASSIGN_PROFILE",
    profileId
  );

  revalidatePath("/dashboard/admin/profiles");
}

export async function unassignProfileAction(profileId: string) {
  const session = await requireStaff();

  await prisma.profile.update({
    where: { id: profileId },
    data: { assignedToId: null, assignedAt: null, status: "UNASSIGNED" },
  });

  await logActivity(session.user.id, "UNASSIGN_PROFILE", profileId);

  revalidatePath("/dashboard/admin/profiles");
}

export async function bulkAssignProfilesAction(profileIds: string[], employeeId: string) {
  const session = await requireStaff();

  await prisma.profile.updateMany({
    where: { id: { in: profileIds } },
    data: { assignedToId: employeeId, assignedAt: new Date(), status: "ASSIGNED" },
  });

  for (const id of profileIds) {
    await logActivity(session.user.id, "BULK_ASSIGN_PROFILE", id);
  }

  revalidatePath("/dashboard/admin/profiles");
}

export async function approveProfileAction(profileId: string) {
  const session = await requireStaff();
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    throw new Error("Only Admins can approve profiles");
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { approvalStatus: "APPROVED", approvalNotes: null },
  });

  await logActivity(session.user.id, "APPROVE_PROFILE", profileId);
  revalidatePath("/dashboard/admin/profiles");
}

export async function rejectProfileAction(profileId: string, notes: string) {
  const session = await requireStaff();
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    throw new Error("Only Admins can reject profiles");
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { approvalStatus: "NEEDS_CHANGES", approvalNotes: notes || null },
  });

  await logActivity(session.user.id, "REJECT_PROFILE", profileId);
  revalidatePath("/dashboard/admin/profiles");
}

export async function getProfileHistory(profileId: string) {
  await requireStaff();
  return prisma.activityLog.findMany({
    where: { entityType: "Profile", entityId: profileId },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
  });
}
