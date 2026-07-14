"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { leadSchema } from "@/lib/validations/lead.schema";
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
    data: { actorId, action, entityType: "Lead", entityId },
  });
}

export async function getLeads(filter?: { assignedToId?: string }) {
  const session = await requireStaff();
  const scopedFilter =
    session.user.role === "SALES"
      ? { assignedToId: session.user.id }
      : filter?.assignedToId
      ? { assignedToId: filter.assignedToId }
      : {};

  return prisma.lead.findMany({
    where: scopedFilter,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function getLeadById(id: string) {
  await requireStaff();
  return prisma.lead.findUnique({ where: { id } });
}

export async function createLeadAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    source: formData.get("source"),
    status: formData.get("status") || "NEW",
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const lead = await prisma.lead.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      source: parsed.data.source || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      createdById: session.user.id,
    },
  });

  await logActivity(session.user.id, "CREATE_LEAD", lead.id);

  revalidatePath("/dashboard/admin/leads");
  redirect("/dashboard/admin/leads");
}

export async function updateLeadAction(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    source: formData.get("source"),
    status: formData.get("status") || "NEW",
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.lead.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      source: parsed.data.source || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
  });

  await logActivity(session.user.id, "UPDATE_LEAD", id);

  revalidatePath("/dashboard/admin/leads");
  redirect("/dashboard/admin/leads");
}

export async function assignLeadAction(leadId: string, employeeId: string) {
  const session = await requireStaff();

  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId: employeeId },
  });

  await logActivity(session.user.id, "ASSIGN_LEAD", leadId);

  revalidatePath("/dashboard/admin/leads");
}

export async function unassignLeadAction(leadId: string) {
  const session = await requireStaff();

  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId: null },
  });

  await logActivity(session.user.id, "UNASSIGN_LEAD", leadId);

  revalidatePath("/dashboard/admin/leads");
}

export async function bulkAssignLeadsAction(leadIds: string[], employeeId: string) {
  const session = await requireStaff();

  await prisma.lead.updateMany({
    where: { id: { in: leadIds } },
    data: { assignedToId: employeeId },
  });

  for (const leadId of leadIds) {
    await logActivity(session.user.id, "BULK_ASSIGN_LEAD", leadId);
  }

  revalidatePath("/dashboard/admin/leads");
}

export async function convertLeadToProfileAction(leadId: string) {
  const session = await requireStaff();

  if (!["SUPER_ADMIN", "ADMIN", "PROFILE_CREATOR"].includes(session.user.role)) {
    throw new Error("Only Profile Creators can convert leads to profiles");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) throw new Error("Lead not found");

  if (lead.convertedProfileId) {
    redirect(`/dashboard/admin/profiles/${lead.convertedProfileId}/edit`);
  }

  const profileCode = await generateProfileCode("OTHER");

  const profile = await prisma.profile.create({
    data: {
      profileCode,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      gender: "OTHER",
      status: "UNASSIGNED",
      createdById: session.user.id,
      partnerPreference: { create: {} },
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "CONVERTED",
      convertedProfileId: profile.id,
    },
  });

  await logActivity(
    session.user.id,
    "CONVERT_LEAD_TO_PROFILE",
    leadId
  );

  revalidatePath("/dashboard/admin/leads");
  redirect(`/dashboard/admin/profiles/${profile.id}/edit`);
}
