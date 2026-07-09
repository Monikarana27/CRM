import { prisma } from "@/lib/db/prisma";

export async function getAdminStats() {
  const [totalLeads, activeEmployees, pendingPayments, activeServices] =
    await Promise.all([
      prisma.lead.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.service.count({ where: { status: "ACTIVE" } }),
    ]);

  return { totalLeads, activeEmployees, pendingPayments, activeServices };
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
