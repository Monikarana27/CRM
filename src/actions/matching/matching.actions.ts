"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

export async function findCompatibleProfiles(profileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { partnerPreference: true },
  });
  if (!profile) throw new Error("Profile not found");

  const pref = profile.partnerPreference;
  const oppositeGender = profile.gender === "MALE" ? "FEMALE" : profile.gender === "FEMALE" ? "MALE" : undefined;

  const where: any = {
    id: { not: profileId },
    approvalStatus: "APPROVED",
    ...(oppositeGender ? { gender: oppositeGender } : {}),
  };

  if (pref?.religion) where.religion = pref.religion;
  if (pref?.caste) where.caste = pref.caste;
  if (pref?.city) where.city = pref.city;
  if (pref?.maritalStatus) where.maritalStatus = pref.maritalStatus;

  if (pref?.minAge || pref?.maxAge) {
    const now = new Date();
    where.dob = {};
    if (pref.maxAge) where.dob.gte = new Date(now.getFullYear() - pref.maxAge, now.getMonth(), now.getDate());
    if (pref.minAge) where.dob.lte = new Date(now.getFullYear() - pref.minAge, now.getMonth(), now.getDate());
  }

  return prisma.profile.findMany({
    where,
    take: 50,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, profileCode: true, city: true, religion: true, dob: true, email: true },
  });
}