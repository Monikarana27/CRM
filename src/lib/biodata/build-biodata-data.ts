import { prisma } from "@/lib/db/prisma";
import { readFile } from "fs/promises";
import path from "path";

function calculateAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

async function resolvePhotoDataUri(photoUrl: string | null): Promise<string | null> {
  if (!photoUrl) return null;
  if (!photoUrl.startsWith("/uploads/")) return photoUrl;

  try {
    const ext = path.extname(photoUrl).toLowerCase();
    const mime = EXT_TO_MIME[ext] ?? "image/jpeg";
    const absolutePath = path.join(process.cwd(), "public", photoUrl);
    const fileBuffer = await readFile(absolutePath);
    return `data:${mime};base64,${fileBuffer.toString("base64")}`;
  } catch (err) {
    console.error(`Could not read profile photo at ${photoUrl}:`, err);
    return null;
  }
}

export async function buildBiodataData(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      partnerPreference: {
        include: {
          religion: true,
          caste: true,
          motherTongueRef: true,
        },
      },
      // NEW: pull the normalized relations so we can read .name below
      religion: true,
      caste: true,
      gotra: true,
      motherTongueRef: true,
    },
  });
  if (!profile) return null;

  const photoDataUri = await resolvePhotoDataUri(profile.photoUrl);

  return {
    name: profile.name,
    profileCode: profile.profileCode,
    photoUrl: photoDataUri,
    gender: profile.gender,
    age: calculateAge(profile.dob),
    dob: profile.dob,
    height: profile.height,
    weightKg: profile.weightKg,
    maritalStatus: profile.maritalStatus,
    // CHANGED: relation object -> .name, matches how the Blade template
    // in Elite ultimately just prints the name string too
    motherTongue: profile.motherTongueRef?.name ?? null,
    bodyType: profile.bodyType,
    complexion: profile.complexion,
    bloodGroup: profile.bloodGroup,
    healthStatus: profile.healthStatus,
    nativePlace: profile.nativePlace,
    aboutYourself: profile.aboutYourself,
    city: profile.city,
    state: profile.state,
    country: profile.country,
    // CHANGED: relation objects -> .name
    religion: profile.religion?.name ?? null,
    caste: profile.caste?.name ?? null,
    subCaste: profile.subCaste, // unchanged — still free text
    gotra: profile.gotra?.name ?? null,
    timeOfBirth: profile.timeOfBirth,
    placeOfBirth: profile.placeOfBirth,
    manglik: profile.manglik,
    highestQualification: profile.highestQualification,
    educationField: profile.educationField,
    institute: profile.institute,
    profession: profile.profession,
    workingWith: profile.workingWith,
    designation: profile.designation,
    annualIncome: profile.annualIncome,
    diet: profile.diet,
    drinking: profile.drinking,
    smoking: profile.smoking,
    fatherOccupation: profile.fatherOccupation,
    motherOccupation: profile.motherOccupation,
    brothers: profile.brothers,
    brothersMarried: profile.brothersMarried,
    sisters: profile.sisters,
    sistersMarried: profile.sistersMarried,
    familyType: profile.familyType,
    familyValues: profile.familyValues,
    familyBio: profile.familyBio,
    phone: profile.phone,
    email: profile.email,
    partnerPreference: profile.partnerPreference
      ? {
          minAge: profile.partnerPreference.minAge,
          maxAge: profile.partnerPreference.maxAge,
          minHeight: profile.partnerPreference.minHeight,
          maxHeight: profile.partnerPreference.maxHeight,
          maritalStatus: profile.partnerPreference.maritalStatus,
          // CHANGED: relation objects -> .name
          religion: profile.partnerPreference.religion?.name ?? null,
          caste: profile.partnerPreference.caste?.name ?? null,
          qualification: profile.partnerPreference.qualification,
          profession: profile.partnerPreference.profession,
          aboutDesiredPartner: profile.partnerPreference.aboutDesiredPartner,
        }
      : null,
  };
}

export type BiodataData = NonNullable<Awaited<ReturnType<typeof buildBiodataData>>>;
