import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { ProfilesTable } from "@/app/(dashboard)/dashboard/admin/profiles/profiles-table";

export default async function ServiceProfilesPage() {
  const session = await auth();
  const profiles = await prisma.profile.findMany({
    where: { assignedToId: session!.user.id, approvalStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { id: true, name: true } } },
  });
  const employees = await prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } });

  return (
    <div className="space-y-6">
      <DashboardHero title="Assigned Active Profiles" subtitle="Approved profiles assigned to you." />
      <ProfilesTable profiles={profiles} employees={employees} />
    </div>
  );
}