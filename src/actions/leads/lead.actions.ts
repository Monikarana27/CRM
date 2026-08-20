"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { getActingUserId } from "@/lib/auth/get-acting-user";
import { leadSchema } from "@/lib/validations/lead.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getNextSalesAssignee, createWelcomeCallEntry } from "@/lib/assignment/auto-assign";

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
      profileQueue: { select: { id: true, status: true } },
      remarks: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { remark: true, outcome: true, createdAt: true },
      },
    },
  });
}

export async function getFollowUpLeads() {
  const session = await requireStaff();
  const scopedFilter = session.user.role === "SALES" ? { assignedToId: session.user.id } : {};

  return prisma.lead.findMany({
    where: { ...scopedFilter, followUpDate: { not: null } },
    orderBy: { followUpDate: "asc" },
    include: {
      assignedTo: { select: { id: true, name: true } },
      remarks: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { remark: true, outcome: true },
      },
    },
  });
}

export async function ensureFollowUpNotifications() {
  const session = await requireStaff();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  if (session.user.role === "SALES") {
    const dueLeads = await prisma.lead.findMany({
      where: {
        assignedToId: session.user.id,
        followUpDate: { lte: new Date() },
      },
      select: { id: true, name: true },
    });

    for (const lead of dueLeads) {
      const content = `Follow-up due: ${lead.name}`;
      const existing = await prisma.notification.findFirst({
        where: {
          recipientId: session.user.id,
          type: "LEAD_FOLLOWUP",
          content,
          createdAt: { gte: startOfDay },
        },
      });
      if (!existing) {
        await prisma.notification.create({
          data: { recipientId: session.user.id, type: "LEAD_FOLLOWUP", content },
        });
      }
    }
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const overdueWelcomeCalls = await prisma.welcomeCall.findMany({
    where: {
      assignedToId: session.user.id,
      status: "PENDING",
      createdAt: { lte: twoDaysAgo },
    },
    include: {
      lead: { select: { name: true } },
      profile: { select: { name: true } },
    },
  });

  for (const wc of overdueWelcomeCalls) {
    const contactName = wc.lead?.name ?? wc.profile?.name ?? "Unknown";
    const content = `Welcome call pending 2+ days: ${contactName}`;
    const existing = await prisma.notification.findFirst({
      where: {
        recipientId: session.user.id,
        type: "WELCOME_CALL_OVERDUE",
        content,
        createdAt: { gte: startOfDay },
      },
    });
    if (!existing) {
      await prisma.notification.create({
        data: { recipientId: session.user.id, type: "WELCOME_CALL_OVERDUE", content },
      });
    }
  }
}

export async function getLeadById(id: string) {
  const session = await requireStaff();
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return null;
  if (session.user.role === "SALES" && lead.assignedToId !== session.user.id) {
    return null;
  }
  return lead;
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
    gender: formData.get("gender"),
    source: formData.get("source"),
    status: formData.get("status") || "NEW",
    notes: formData.get("notes"),
    followUpDate: formData.get("followUpDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.lead.findFirst({
    where: { phone: parsed.data.phone },
  });
  if (existing) {
    return { error: "A lead with this phone number already exists." };
  }

  const autoAssignedToId = await getNextSalesAssignee();

  const lead = await prisma.lead.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      source: parsed.data.source || null,
      status: parsed.data.status,
      gender: parsed.data.gender || null,
      notes: parsed.data.notes || null,
      followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : null,
      createdById: session.user.id,
      assignedToId: autoAssignedToId,
    },
  });

  if (autoAssignedToId) {
    await prisma.leadAssignmentHistory.create({
      data: {
        leadId: lead.id,
        fromEmployeeId: null,
        toEmployeeId: autoAssignedToId,
        changedById: session.user.id,
      },
    });
    await createWelcomeCallEntry({ leadId: lead.id, assignedToId: autoAssignedToId });
  }

  await logActivity(await getActingUserId(session), "CREATE_LEAD", lead.id);

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
    gender: formData.get("gender"), 
    source: formData.get("source"),
    status: formData.get("status") || "NEW",
    notes: formData.get("notes"),
    followUpDate: formData.get("followUpDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.lead.findFirst({
    where: { phone: parsed.data.phone, NOT: { id } },
  });
  if (existing) {
    return { error: "Another lead already uses this phone number." };
  }

  await prisma.lead.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      source: parsed.data.source || null,
      gender: parsed.data.gender || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : null,
    },
  });

  await logActivity(await getActingUserId(session), "UPDATE_LEAD", id);

  revalidatePath("/dashboard/admin/leads");
  redirect("/dashboard/admin/leads");
}

export async function assignLeadAction(leadId: string, employeeId: string) {
  const session = await requireStaff();
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const previous = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { assignedToId: true },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId: employeeId },
  });

  await prisma.leadAssignmentHistory.create({
    data: {
      leadId,
      fromEmployeeId: previous?.assignedToId ?? null,
      toEmployeeId: employeeId,
      changedById: session.user.id,
    },
  });

  await logActivity(await getActingUserId(session), "ASSIGN_LEAD", leadId);
  await createWelcomeCallEntry({ leadId, assignedToId: employeeId });

  revalidatePath("/dashboard/admin/leads");
}

export async function unassignLeadAction(leadId: string) {
  const session = await requireStaff();
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const previous = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { assignedToId: true },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId: null },
  });

  await prisma.leadAssignmentHistory.create({
    data: {
      leadId,
      fromEmployeeId: previous?.assignedToId ?? null,
      toEmployeeId: null,
      changedById: session.user.id,
    },
  });

  await logActivity(await getActingUserId(session), "UNASSIGN_LEAD", leadId);

  revalidatePath("/dashboard/admin/leads");
}

export async function bulkAssignLeadsAction(leadIds: string[], employeeId: string) {
  const session = await requireStaff();
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const leadsBefore = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, assignedToId: true },
  });

  await prisma.lead.updateMany({
    where: { id: { in: leadIds } },
    data: { assignedToId: employeeId },
  });

  await prisma.leadAssignmentHistory.createMany({
    data: leadsBefore.map((lead) => ({
      leadId: lead.id,
      fromEmployeeId: lead.assignedToId,
      toEmployeeId: employeeId,
      changedById: session.user.id,
    })),
  });

  for (const leadId of leadIds) {
    await logActivity(await getActingUserId(session), "BULK_ASSIGN_LEAD", leadId);
    await createWelcomeCallEntry({ leadId, assignedToId: employeeId });
  }

  revalidatePath("/dashboard/admin/leads");
}

export async function getLeadAssignmentHistory(leadId: string) {
  await requireStaff();
  return prisma.leadAssignmentHistory.findMany({
    where: { leadId },
    orderBy: { changedAt: "desc" },
    include: {
      fromEmployee: { select: { id: true, name: true } },
      toEmployee: { select: { id: true, name: true } },
      changedBy: { select: { id: true, name: true } },
    },
  });
}