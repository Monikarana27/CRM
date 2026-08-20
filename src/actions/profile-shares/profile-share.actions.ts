"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { sendProfileEmail } from "@/lib/email/send-profile-email";

async function requireStaff() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function getSharedProfilesForSubscription(subscriptionId: string) {
  await requireStaff();
  return prisma.profileShare.findMany({
    where: { subscriptionId },
    orderBy: { sharedAt: "desc" },
    include: {
      sharedProfile: { select: { id: true, name: true, profileCode: true, photoUrl: true } },
      sharedBy: { select: { id: true, name: true } },
      interests: { orderBy: { sentAt: "desc" }, take: 1 },
      comments: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
}

export async function addProfileShareCommentAction(profileShareId: string, comment: string) {
  const session = await requireStaff();
  if (!comment.trim()) return { error: "Comment cannot be empty" };

  await prisma.profileShareComment.create({
    data: { profileShareId, authorId: session.user.id, comment: comment.trim() },
  });

  revalidatePath("/dashboard/service");
  return { error: null };
}

export async function updateProspectStatusAction(
  profileShareId: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "SENT"
) {
  await requireStaff();
  await prisma.profileShare.update({
    where: { id: profileShareId },
    data: { prospectStatus: status },
  });
  revalidatePath("/dashboard/service");
}

export async function updateClientInterestAction(
  profileShareId: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "SENT"
) {
  await requireStaff();

  const existing = await prisma.interest.findFirst({
    where: { profileShareId },
    orderBy: { sentAt: "desc" },
  });

  if (existing) {
    await prisma.interest.update({
      where: { id: existing.id },
      data: { status, respondedAt: status !== "PENDING" ? new Date() : null },
    });
  } else {
    await prisma.interest.create({
      data: { profileShareId, status },
    });
  }

  revalidatePath("/dashboard/service");
}

export type ProfileSearchFilters = {
  gender?: "MALE" | "FEMALE" | "OTHER";
  minAge?: number;
  maxAge?: number;
  religionId?: string;
  casteId?: string;
  manglik?: string;
  country?: string;
  state?: string;
  city?: string;
  annualIncome?: string;
  educationField?: string;
  highestQualification?: string;
};

export async function searchProfilesAction(filters: ProfileSearchFilters) {
  await requireStaff();

  const now = new Date();
  const dobFilter: { lte?: Date; gte?: Date } = {};
  if (filters.minAge) {
    dobFilter.lte = new Date(now.getFullYear() - filters.minAge, now.getMonth(), now.getDate());
  }
  if (filters.maxAge) {
    dobFilter.gte = new Date(now.getFullYear() - filters.maxAge - 1, now.getMonth(), now.getDate());
  }

  return prisma.profile.findMany({
    where: {
      ...(filters.gender ? { gender: filters.gender } : {}),
      ...(filters.religionId ? { religionId: filters.religionId } : {}),
      ...(filters.casteId ? { casteId: filters.casteId } : {}),
      ...(filters.manglik ? { manglik: filters.manglik } : {}),
      ...(filters.country ? { country: filters.country } : {}),
      ...(filters.state ? { state: filters.state } : {}),
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.annualIncome ? { annualIncome: filters.annualIncome } : {}),
      ...(filters.educationField ? { educationField: filters.educationField } : {}),
      ...(filters.highestQualification ? { highestQualification: filters.highestQualification } : {}),
      ...(Object.keys(dobFilter).length > 0 ? { dob: dobFilter } : {}),
    },
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      religion: { select: { name: true } },
      caste: { select: { name: true } },
    },
  });
}

export async function sendSelectedProfilesAction(
  clientProfileId: string,
  toEmail: string,
  selectedProfileIds: string[]
) {
  const session = await requireStaff();

  try {
    const profiles = await prisma.profile.findMany({ where: { id: { in: selectedProfileIds } } });

    for (const p of profiles) {
      await sendProfileEmail(toEmail, p.name, p.profileCode, p.photoUrl);
    }

    await prisma.activityLog.create({
      data: {
        actorId: session.user.id,
        action: "SEND_SEARCHED_PROFILES",
        entityType: "Profile",
        entityId: selectedProfileIds[0],
      },
    });

    const subscription = await prisma.subscription.findFirst({
      where: { profileId: clientProfileId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (subscription) {
      await prisma.profileShare.createMany({
        data: selectedProfileIds.map((sharedProfileId) => ({
          subscriptionId: subscription.id,
          sharedProfileId,
          sharedById: session.user.id,
        })),
      });
    }

    revalidatePath("/dashboard/service");
    return { count: profiles.length, hasSubscription: !!subscription, error: null as string | null };
  } catch (err) {
    // Surface the real cause instead of letting it crash the whole page with a generic digest.
    console.error("sendSelectedProfilesAction failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error while sending profiles";
    return { count: 0, hasSubscription: false, error: message };
  }
}