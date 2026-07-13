"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function addProfileDocumentAction(profileId: string, url: string, type: "PHOTO" | "ID_PROOF" | "OTHER") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.profileDocument.create({ data: { profileId, url, type } });
  revalidatePath(`/dashboard/admin/profiles/${profileId}/edit`);
}

export async function getProfileDocuments(profileId: string) {
  return prisma.profileDocument.findMany({ where: { profileId }, orderBy: { uploadedAt: "desc" } });
}

export async function deleteProfileDocumentAction(id: string, profileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  await prisma.profileDocument.delete({ where: { id } });
  revalidatePath(`/dashboard/admin/profiles/${profileId}/edit`);
}