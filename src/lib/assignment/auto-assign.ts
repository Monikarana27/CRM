import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/lib/permissions/roles";

async function getEligibleEmployees(roles: Role[]) {
  const now = new Date();

  const onLeaveIds = await prisma.leaveRequest.findMany({
    where: { status: "APPROVED", startDate: { lte: now }, endDate: { gte: now } },
    select: { userId: true },
  });
  const onLeaveSet = new Set(onLeaveIds.map((l) => l.userId));

  const employees = await prisma.user.findMany({
    where: { role: { in: roles }, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return employees.filter((e) => !onLeaveSet.has(e.id));
}

async function getNextInRotation(poolKey: string, roles: Role[]): Promise<string | null> {
  const eligible = await getEligibleEmployees(roles);
  if (eligible.length === 0) return null;

  const setting = await prisma.systemSetting.findUnique({ where: { key: poolKey } });
  const lastId = setting?.value ?? null;

  let nextIndex = 0;
  if (lastId) {
    const lastIndex = eligible.findIndex((e) => e.id === lastId);
    nextIndex = lastIndex === -1 ? 0 : (lastIndex + 1) % eligible.length;
  }

  const next = eligible[nextIndex];

  await prisma.systemSetting.upsert({
    where: { key: poolKey },
    create: { key: poolKey, value: next.id },
    update: { value: next.id },
  });

  return next.id;
}

// Used for: new leads, new profiles (both start life with Sales — unpaid clients).
export async function getNextSalesAssignee(): Promise<string | null> {
  return getNextInRotation("auto_assign_sales", ["SALES", "SALES_TL", "SALES_MANAGER"]);
}

// Used for: profiles whose client just made a PAID payment.
export async function getNextServiceAssignee(): Promise<string | null> {
  return getNextInRotation("auto_assign_service", ["SERVICE", "SERVICE_TL", "SERVICE_MANAGER"]);
}

export async function autoDistributeUnassignedLeads(changedById: string) {
  const unassigned = await prisma.lead.findMany({
    where: { assignedToId: null },
    select: { id: true },
  });

  let count = 0;
  for (const lead of unassigned) {
    const nextId = await getNextSalesAssignee();
    if (!nextId) break;

    await prisma.lead.update({ where: { id: lead.id }, data: { assignedToId: nextId } });
    await prisma.leadAssignmentHistory.create({
      data: { leadId: lead.id, fromEmployeeId: null, toEmployeeId: nextId, changedById },
    });
    count++;
  }
  return count;
}

export async function autoDistributeUnassignedProfiles(changedById: string) {
  const unassigned = await prisma.profile.findMany({
    where: { assignedToId: null },
    select: { id: true },
  });

  let count = 0;
  for (const profile of unassigned) {
    const nextId = await getNextSalesAssignee();
    if (!nextId) break;

    await prisma.profile.update({
      where: { id: profile.id },
      data: { assignedToId: nextId, assignedAt: new Date(), status: "ASSIGNED" },
    });
    count++;
  }
  return count;
}

// Called when a payment is confirmed PAID — moves the profile's ownership from
// whichever Sales employee had it to the next Service employee in rotation.
export async function reassignProfileToServiceOnPayment(profileId: string, changedById: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { assignedTo: { select: { role: true } } },
  });

  const serviceRoles = ["SERVICE", "SERVICE_TL", "SERVICE_MANAGER"];
  if (profile?.assignedTo && serviceRoles.includes(profile.assignedTo.role)) {
    return null; // already with a Service employee, don't shuffle on repeat payments
  }

  const nextServiceId = await getNextServiceAssignee();
  if (!nextServiceId) return null;

  await prisma.profile.update({
    where: { id: profileId },
    data: { assignedToId: nextServiceId, assignedAt: new Date(), status: "REASSIGNED" },
  });

  await prisma.activityLog.create({
    data: {
      actorId: changedById,
      action: "AUTO_REASSIGN_TO_SERVICE_ON_PAYMENT",
      entityType: "Profile",
      entityId: profileId,
    },
  });

  await createWelcomeCallEntry({ profileId, assignedToId: nextServiceId });

  return nextServiceId;
}

export async function createWelcomeCallEntry(params: {
  leadId?: string;
  profileId?: string;
  assignedToId: string;
}) {
  await prisma.welcomeCall.create({
    data: {
      leadId: params.leadId ?? null,
      profileId: params.profileId ?? null,
      assignedToId: params.assignedToId,
    },
  });
}