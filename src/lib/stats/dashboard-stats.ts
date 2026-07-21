import { prisma } from "@/lib/db/prisma";

async function getLeadFunnel(where: { assignedToId?: string } = {}) {
  const [newLeads, contactedLeads, convertedLeads, pendingLeads, notInterestedLeads, totalLeads] =
    await Promise.all([
      prisma.lead.count({ where: { ...where, status: "NEW" } }),
      prisma.lead.count({ where: { ...where, status: "CONTACTED" } }),
      prisma.lead.count({ where: { ...where, status: "CONVERTED" } }),
      prisma.lead.count({ where: { ...where, status: "PENDING" } }),
      prisma.lead.count({ where: { ...where, status: "NOT_INTERESTED" } }),
      prisma.lead.count({ where }),
    ]);

  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    convertedLeads,
    pendingLeads,
    notInterestedLeads,
    conversionRate,
  };
}

async function getProfileAssignmentBreakdown(where: { assignedToId?: string } = {}) {
  const [assigned, reassigned, unassigned] = await Promise.all([
    prisma.profile.count({ where: { ...where, status: "ASSIGNED" } }),
    prisma.profile.count({ where: { ...where, status: "REASSIGNED" } }),
    prisma.profile.count({ where: { ...where, status: "UNASSIGNED" } }),
  ]);
  return { assigned, reassigned, unassigned };
}

async function getTodaysActivityCount(actorId?: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return prisma.activityLog.count({
    where: {
      ...(actorId ? { actorId } : {}),
      createdAt: { gte: todayStart, lte: todayEnd },
    },
  });
}

async function getTodaysSummary() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [newLeadsToday, profilesCreatedToday, meetingsToday, pendingApprovals, activeServices] =
    await Promise.all([
      prisma.lead.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.profile.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.meeting.count({
        where: { scheduledAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.profile.count({
        where: { approvalStatus: "PENDING_APPROVAL" },
      }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
    ]);

  return { newLeadsToday, profilesCreatedToday, meetingsToday, pendingApprovals, activeServices };
}

export async function getAdminStats() {
  const [
    funnel,
    profileAssignment,
    activeEmployees,
    totalEmployees,
    activeServices,
    holdServices,
    expiredServices,
    paidPayments,
    pendingPayments,
    failedPayments,
    faceToFaceMeetings,
    teleMeetings,
    todaysActivityCount,
    totalProfiles,
    maleProfiles,
    femaleProfiles,
    profilesOnHold,
    todaysSummary,
  ] = await Promise.all([
    getLeadFunnel(),
    getProfileAssignmentBreakdown(),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "HOLD" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.meeting.count({ where: { type: "FACE_TO_FACE" } }),
    prisma.meeting.count({ where: { type: "TELE" } }),
    getTodaysActivityCount(),
    prisma.profile.count(),
    prisma.profile.count({ where: { gender: "MALE" } }),
    prisma.profile.count({ where: { gender: "FEMALE" } }),
    prisma.profile.count({ where: { status: "ON_HOLD" } }),
    getTodaysSummary(),
  ]);
  const paidAmountResult = await prisma.payment.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  return {
    leads: funnel,
    profileAssignment,
    profiles: { totalProfiles, maleProfiles, femaleProfiles, profilesOnHold },
    employees: { activeEmployees, totalEmployees },
    services: { activeServices, holdServices, expiredServices },
    payments: {
      paidPayments,
      pendingPayments,
      failedPayments,
      totalCollected: paidAmountResult._sum.amount ?? 0,
    },
    meetings: { faceToFaceMeetings, teleMeetings },
    todaysActivityCount,
    todaysSummary,
  };
}

export async function getSalesStats(userId: string) {
  const [funnel, profileAssignment, followUpsDue, todaysActivityCount, newLeadsToday, pendingLeadsCount] =
    await Promise.all([
      getLeadFunnel({ assignedToId: userId }),
      getProfileAssignmentBreakdown({ assignedToId: userId }),
      prisma.meeting.count({ where: { assignedToId: userId, status: "SCHEDULED" } }),
      getTodaysActivityCount(userId),
      prisma.lead.count({
        where: {
          assignedToId: userId,
          status: "NEW",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.lead.count({ where: { assignedToId: userId, status: "PENDING" } }),
    ]);

  return {
    leads: funnel,
    profileAssignment,
    followUpsDue,
    todaysActivityCount,
    newLeadsToday,
    pendingLeadsCount,
    myLeads: funnel.totalLeads,
    myProfiles: profileAssignment.assigned + profileAssignment.reassigned,
  };
}

export async function getServiceStats(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    assignedProfiles,
    meetingsToday,
    activeServiceCount,
    onHoldProfiles,
    expiredServiceCount,
    upcomingMeetings,
    todaysActivityCount,
  ] = await Promise.all([
    prisma.profile.count({ where: { assignedToId: userId } }),
    prisma.meeting.count({
      where: {
        assignedToId: userId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.subscription.count({
      where: { status: "ACTIVE", profile: { assignedToId: userId } },
    }),
    prisma.profile.count({ where: { assignedToId: userId, status: "ON_HOLD" } }),
    prisma.subscription.count({
      where: { status: "EXPIRED", profile: { assignedToId: userId } },
    }),
    prisma.meeting.findMany({
      where: {
        assignedToId: userId,
        scheduledAt: { gte: todayStart },
        status: "SCHEDULED",
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: { profile: { select: { name: true } } },
    }),
    getTodaysActivityCount(userId),
  ]);

  return {
    assignedProfiles,
    meetingsToday,
    activeServiceCount,
    onHoldProfiles,
    expiredServiceCount,
    upcomingMeetings,
    todaysActivityCount,
  };
}

export async function getRecentActivity(limit = 10) {
  const logs = await prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
  });

  return logs.map((log) => ({
    id: log.id,
    actorName: log.actor.name,
    action: log.action,
    entityType: log.entityType,
    createdAt: log.createdAt,
  }));
}
