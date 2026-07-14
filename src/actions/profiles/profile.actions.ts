"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { profileSchema } from "@/lib/validations/profile.schema";
import { generateProfileCode } from "@/lib/utils/profile-code";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function extractProfileData(parsed: ReturnType<typeof profileSchema.safeParse>) {
  if (!parsed.success) return null;
  const d = parsed.data;
  return {
    source: d.source || null,
    sourceInfo: d.sourceInfo || null,
    email: d.email || null,
    altEmail: d.altEmail || null,
    phone: d.phone,
    altPhone: d.altPhone || null,
    contactPerson: d.contactPerson || null,
    creatingFor: d.creatingFor || null,
    name: d.name,
    gender: d.gender,
    dob: d.dob ? new Date(d.dob) : null,
    maritalStatus: d.maritalStatus || null,
    height: d.height || null,
    weightKg: d.weightKg || null,
    motherTongue: d.motherTongue || null,
    bodyType: d.bodyType || null,
    complexion: d.complexion || null,
    bloodGroup: d.bloodGroup || null,
    healthStatus: d.healthStatus || null,
    nativePlace: d.nativePlace || null,
    aboutYourself: d.aboutYourself || null,
    country: d.country || null,
    state: d.state || null,
    city: d.city || null,
    citizenship: d.citizenship || null,
    countryGrewUp: d.countryGrewUp || null,
    visaStatus: d.visaStatus || null,
    religion: d.religion || null,
    caste: d.caste || null,
    subCaste: d.subCaste || null,
    gotra: d.gotra || null,
    timeOfBirth: d.timeOfBirth || null,
    placeOfBirth: d.placeOfBirth || null,
    manglik: d.manglik || null,
    highestQualification: d.highestQualification || null,
    educationField: d.educationField || null,
    institute: d.institute || null,
    workLocation: d.workLocation || null,
    workingWith: d.workingWith || null,
    profession: d.profession || null,
    businessName: d.businessName || null,
    designation: d.designation || null,
    annualIncome: d.annualIncome || null,
    diet: d.diet || null,
    drinking: d.drinking || null,
    smoking: d.smoking || null,
    fatherOccupation: d.fatherOccupation || null,
    motherOccupation: d.motherOccupation || null,
    brothers: d.brothers ?? 0,
    brothersMarried: d.brothersMarried ?? 0,
    sisters: d.sisters ?? 0,
    sistersMarried: d.sistersMarried ?? 0,
    familyType: d.familyType || null,
    affluence: d.affluence || null,
    familyValues: d.familyValues || null,
    familyBio: d.familyBio || null,
    familyAnnualIncome: d.familyAnnualIncome || null,
  };
}

function extractPartnerPreferenceData(parsed: ReturnType<typeof profileSchema.safeParse>) {
  if (!parsed.success) return null;
  const d = parsed.data;
  return {
    minAge: d.ppMinAge ?? null,
    maxAge: d.ppMaxAge ?? null,
    minHeight: d.ppMinHeight || null,
    maxHeight: d.ppMaxHeight || null,
    maritalStatus: d.ppMaritalStatus || null,
    motherTongue: d.ppMotherTongue || null,
    religion: d.ppReligion || null,
    caste: d.ppCaste || null,
    manglikStatus: d.ppManglikStatus || null,
    hasChildrenOk: d.ppHasChildrenOk || null,
    country: d.ppCountry || null,
    state: d.ppState || null,
    city: d.ppCity || null,
    qualification: d.ppQualification || null,
    workingWith: d.ppWorkingWith || null,
    profession: d.ppProfession || null,
    annualIncome: d.ppAnnualIncome || null,
    diet: d.ppDiet || null,
    drinking: d.ppDrinking || null,
    smoking: d.ppSmoking || null,
    aboutDesiredPartner: d.ppAboutDesiredPartner || null,
  };
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

  await prisma.profile.update({
    where: { id },
    data: {
      ...profileData,
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
