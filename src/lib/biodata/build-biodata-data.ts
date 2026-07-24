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

// profile.photoUrl is stored as a relative web path like "/uploads/xxx.jpg".
// react-pdf's Image component can't reliably resolve relative paths (or even
// same-origin http URLs) during server-side PDF rendering — on Windows a
// leading "/uploads/..." resolves against the current drive root, producing
// "C:\uploads\..." and an ENOENT. Reading the file directly off disk and
// inlining it as a base64 data URI sidesteps all of that.
async function resolvePhotoDataUri(photoUrl: string | null): Promise<string | null> {
  if (!photoUrl) return null;

  // Only handle our own local relative uploads; real absolute URLs
  // (e.g. S3/Cloudinary, if you move to that later) pass through unchanged —
  // react-pdf can fetch those over http(s) fine.
  if (!photoUrl.startsWith("/uploads/")) return photoUrl;

  try {
    const ext = path.extname(photoUrl).toLowerCase();
    const mime = EXT_TO_MIME[ext] ?? "image/jpeg";
    const absolutePath = path.join(process.cwd(), "public", photoUrl);
    const fileBuffer = await readFile(absolutePath);
    return `data:${mime};base64,${fileBuffer.toString("base64")}`;
  } catch (err) {
    console.error(`Could not read profile photo at ${photoUrl}:`, err);
    return null; // falls back to the "NO PHOTO" placeholder in the template
  }
}

export async function buildBiodataData(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { partnerPreference: true },
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
    motherTongue: profile.motherTongue,
    bodyType: profile.bodyType,
    complexion: profile.complexion,
    bloodGroup: profile.bloodGroup,
    healthStatus: profile.healthStatus,
    nativePlace: profile.nativePlace,
    aboutYourself: profile.aboutYourself,
    city: profile.city,
    state: profile.state,
    country: profile.country,
    religion: profile.religion,
    caste: profile.caste,
    subCaste: profile.subCaste,
    gotra: profile.gotra,
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
          religion: profile.partnerPreference.religion,
          caste: profile.partnerPreference.caste,
          qualification: profile.partnerPreference.qualification,
          profession: profile.partnerPreference.profession,
          aboutDesiredPartner: profile.partnerPreference.aboutDesiredPartner,
        }
      : null,
  };
}

export type BiodataData = NonNullable<Awaited<ReturnType<typeof buildBiodataData>>>;