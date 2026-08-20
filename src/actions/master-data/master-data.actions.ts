"use server";
// src/actions/master-data/master-data.actions.ts
//
// CRUD actions for the normalized master-data lookup tables.
// Modeled on Elite CRM's Religion/Community/Gothra/MotherTongue admin management,
// adapted to Sangam's server-action pattern (see call-log.actions.ts for the pattern this follows).

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { getActingUserId } from "@/lib/auth/get-acting-user";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    throw new Error("Only admins can manage master data");
  }
  return session;
}

async function logActivity(actorId: string, action: string, entityType: string, entityId: string) {
  await prisma.activityLog.create({
    data: { actorId, action, entityType, entityId },
  });
}

// ---------------- Religion ----------------

export async function getReligions() {
  return prisma.religion.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { profiles: true, castes: true } } },
  });
}

export async function createReligionAction(_prevState: unknown, formData: FormData) {
  const session = await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const existing = await prisma.religion.findUnique({ where: { name } });
  if (existing) return { error: "This religion already exists" };

  const rec = await prisma.religion.create({ data: { name } });
  await logActivity(await getActingUserId(session), "CREATE_RELIGION", "Religion", rec.id);
  revalidatePath("/dashboard/admin/master-data");
  return { error: null };
}

export async function deleteReligionAction(id: string) {
  const session = await requireAdmin();
  const inUse = await prisma.profile.count({ where: { religionId: id } });
  if (inUse > 0) {
    return { error: `Cannot delete — ${inUse} profile(s) still use this religion` };
  }
  await prisma.religion.delete({ where: { id } });
  await logActivity(await getActingUserId(session), "DELETE_RELIGION", "Religion", id);
  revalidatePath("/dashboard/admin/master-data");
  return { error: null };
}

// ---------------- Caste (Elite calls this "Community") ----------------

export async function getCastes(religionId?: string) {
  return prisma.caste.findMany({
    where: religionId ? { religionId } : {},
    orderBy: { name: "asc" },
    include: { religion: { select: { id: true, name: true } }, _count: { select: { profiles: true } } },
  });
}

export async function createCasteAction(_prevState: unknown, formData: FormData) {
  const session = await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const religionId = (formData.get("religionId") as string) || null;
  if (!name) return { error: "Name is required" };

  const existing = await prisma.caste.findFirst({ where: { name, religionId } });
  if (existing) return { error: "This caste already exists for the selected religion" };

  const rec = await prisma.caste.create({ data: { name, religionId } });
  await logActivity(await getActingUserId(session), "CREATE_CASTE", "Caste", rec.id);
  revalidatePath("/dashboard/admin/master-data");
  return { error: null };
}

export async function deleteCasteAction(id: string) {
  const session = await requireAdmin();
  const inUse = await prisma.profile.count({ where: { casteId: id } });
  if (inUse > 0) {
    return { error: `Cannot delete — ${inUse} profile(s) still use this caste` };
  }
  await prisma.caste.delete({ where: { id } });
  await logActivity(await getActingUserId(session), "DELETE_CASTE", "Caste", id);
  revalidatePath("/dashboard/admin/master-data");
  return { error: null };
}

// ---------------- Gotra ----------------

export async function getGotras() {
  return prisma.gotra.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { profiles: true } } },
  });
}

export async function createGotraAction(_prevState: unknown, formData: FormData) {
  const session = await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const existing = await prisma.gotra.findUnique({ where: { name } });
  if (existing) return { error: "This gotra already exists" };

  const rec = await prisma.gotra.create({ data: { name } });
  await logActivity(await getActingUserId(session), "CREATE_GOTRA", "Gotra", rec.id);
  revalidatePath("/dashboard/admin/master-data");
  return { error: null };
}

export async function deleteGotraAction(id: string) {
  const session = await requireAdmin();
  const inUse = await prisma.profile.count({ where: { gotraId: id } });
  if (inUse > 0) {
    return { error: `Cannot delete — ${inUse} profile(s) still use this gotra` };
  }
  await prisma.gotra.delete({ where: { id } });
  await logActivity(await getActingUserId(session), "DELETE_GOTRA", "Gotra", id);
  revalidatePath("/dashboard/admin/master-data");
  return { error: null };
}

// ---------------- Mother Tongue ----------------

export async function getMotherTongues() {
  return prisma.motherTongueRef.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { profiles: true } } },
  });
}

export async function createMotherTongueAction(_prevState: unknown, formData: FormData) {
  const session = await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const existing = await prisma.motherTongueRef.findUnique({ where: { name } });
  if (existing) return { error: "This mother tongue already exists" };

  const rec = await prisma.motherTongueRef.create({ data: { name } });
  await logActivity(await getActingUserId(session), "CREATE_MOTHER_TONGUE", "MotherTongueRef", rec.id);
  revalidatePath("/dashboard/admin/master-data");
  return { error: null };
}

export async function deleteMotherTongueAction(id: string) {
  const session = await requireAdmin();
  const inUse = await prisma.profile.count({ where: { motherTongueId: id } });
  if (inUse > 0) {
    return { error: `Cannot delete — ${inUse} profile(s) still use this mother tongue` };
  }
  await prisma.motherTongueRef.delete({ where: { id } });
  await logActivity(await getActingUserId(session), "DELETE_MOTHER_TONGUE", "MotherTongueRef", id);
  revalidatePath("/dashboard/admin/master-data");
  return { error: null };
}
