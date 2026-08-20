"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { getActingUserId } from "@/lib/auth/get-acting-user";
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

  const d = parsed.data;
  const profileCode = await generateProfileCode(d.gender);

  const profile = await prisma.profile.create({
    data: {
      profileCode,
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
      motherTongueId: d.motherTongueId || null, // CHANGED
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
      religionId: d.religionId || null, // CHANGED
      casteId: d.casteId || null,       // CHANGED
      subCaste: d.subCaste || null,     // unchanged
      gotraId: d.gotraId || null,       // CHANGED
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
      status: "UNASSIGNED",
      approvalStatus: "PENDING_APPROVAL",
      createdById: session.user.id,
      partnerPreference: {
        create: {
          minAge: d.ppMinAge ?? null,
          maxAge: d.ppMaxAge ?? null,
          minHeight: d.ppMinHeight || null,
          maxHeight: d.ppMaxHeight || null,
          maritalStatus: d.ppMaritalStatus || null,
          motherTongueId: d.ppMotherTongueId || null, // CHANGED
          religionId: d.ppReligionId || null,         // CHANGED
          casteId: d.ppCasteId || null,               // CHANGED
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
        },
      },
    },
  });

  await prisma.profileQueue.update({
    where: { id: queueId },
    data: { status: "COMPLETED", createdProfileId: profile.id, completedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: { actorId: await getActingUserId(session), action: "CREATE_PROFILE_FROM_QUEUE", entityType: "Profile", entityId: profile.id },
  });

  redirect(`/dashboard/profile-creator`);
}
