"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function addProfileDocumentAction(profileId: string, url: string, type: "PHOTO" | "ID_PROOF" | "OTHER") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN", "SERVICE"].includes(session.user.role)) {
    return { error: "Only Service team members can upload photos." };
  }

  if (type === "PHOTO") {
    const count = await prisma.profileDocument.count({ where: { profileId, type: "PHOTO" } });
    if (count >= 5) {
      return { error: "Maximum 5 photos allowed per profile." };
    }
  }

  const maxOrder = await prisma.profileDocument.aggregate({
    where: { profileId, type },
    _max: { order: true },
  });

  await prisma.profileDocument.create({
    data: { profileId, url, type, order: (maxOrder._max.order ?? -1) + 1 },
  });
  revalidatePath(`/dashboard/admin/profiles/${profileId}/edit`);
  return { error: null };
}

export async function getProfileDocuments(profileId: string) {
  return prisma.profileDocument.findMany({
    where: { profileId },
    orderBy: { order: "asc" },
  });
}

export async function deleteProfileDocumentAction(id: string, profileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN", "SERVICE"].includes(session.user.role)) {
    return { error: "Only Service team members can upload photos." };
  }
  await prisma.profileDocument.delete({ where: { id } });
  revalidatePath(`/dashboard/admin/profiles/${profileId}/edit`);
}

export async function setPrimaryPhotoAction(id: string, profileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN", "SERVICE"].includes(session.user.role)) {
    return { error: "Only Service team members can upload photos." };
  }

  const photos = await prisma.profileDocument.findMany({
    where: { profileId, type: "PHOTO" },
    orderBy: { order: "asc" },
  });

  const target = photos.find((p) => p.id === id);
  if (!target) return;

  const others = photos.filter((p) => p.id !== id);
  await prisma.$transaction([
    prisma.profileDocument.update({ where: { id: target.id }, data: { order: 0 } }),
    ...others.map((p, i) =>
      prisma.profileDocument.update({ where: { id: p.id }, data: { order: i + 1 } })
    ),
  ]);

  await prisma.profile.update({ where: { id: profileId }, data: { photoUrl: target.url } });
  revalidatePath(`/dashboard/admin/profiles/${profileId}/edit`);
}
