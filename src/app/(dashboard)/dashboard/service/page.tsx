import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getServiceStats } from "@/lib/stats/dashboard-stats";

export default async function ServiceDashboardPage() {
  const session = await auth();
  const stats = await getServiceStats(session!.user.id);

  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Here's your service activity for today."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatWidget
          title="Assigned Profiles"
          lines={[{ label: "Assigned to Me", value: stats.assignedProfiles }]}
          actionLabel="View Profiles"
          actionHref="/dashboard/service/profiles"
        />
        <StatWidget
          title="Meetings Today"
          lines={[{ label: "Scheduled Today", value: stats.meetingsToday }]}
          actionLabel="View Meetings"
          actionHref="/dashboard/admin/meetings"
        />
        <StatWidget
          title="Service Status"
          lines={[{ label: "Active Services", value: stats.activeServiceCount }]}
          actionLabel="View Services"
          actionHref="/dashboard/admin/services"
        />
      </div>
    </div>
  );
}