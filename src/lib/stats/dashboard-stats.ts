import { prisma } from "@/lib/db/prisma";

export async function getAdminStats() {
  const [
    totalLeads,
    newLeads,
    contactedLeads,
    convertedLeads,
    pendingLeads,
    closedLeads,
    totalProfiles,
    maleProfiles,
    femaleProfiles,
    profilesOnHold,
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
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({ where: { status: "CONTACTED" } }),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.lead.count({ where: { status: "PENDING" } }),
    prisma.lead.count({ where: { status: "CLOSED" } }),
    prisma.profile.count(),
    prisma.profile.count({ where: { gender: "MALE" } }),
    prisma.profile.count({ where: { gender: "FEMALE" } }),
    prisma.profile.count({ where: { status: "ON_HOLD" } }),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count(),
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.service.count({ where: { status: "HOLD" } }),
    prisma.service.count({ where: { status: "EXPIRED" } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.meeting.count({ where: { type: "FACE_TO_FACE" } }),
    prisma.meeting.count({ where: { type: "TELE" } }),
  ]);

  const paidAmountResult = await prisma.payment.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  return {
    leads: { totalLeads, newLeads, contactedLeads, convertedLeads, pendingLeads, closedLeads },
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
  };
}

export async function getSalesStats(userId: string) {
  const [myLeads, myProfiles, followUpsDue] = await Promise.all([
    prisma.lead.count({ where: { assignedToId: userId } }),
    prisma.profile.count({ where: { assignedToId: userId } }),
    prisma.meeting.count({
      where: { assignedToId: userId, status: "SCHEDULED" },
    }),
  ]);

  return { myLeads, myProfiles, followUpsDue };
}

export async function getServiceStats(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [assignedProfiles, meetingsToday, activeServiceCount] =
    await Promise.all([
      prisma.profile.count({ where: { assignedToId: userId } }),
      prisma.meeting.count({
        where: {
          assignedToId: userId,
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.service.count({
        where: {
          status: "ACTIVE",
          profile: { assignedToId: userId },
        },
      }),
    ]);

  return { assignedProfiles, meetingsToday, activeServiceCount };
}
