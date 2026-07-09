import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getServiceStats } from "@/lib/stats/dashboard-stats";
import { UserSquare2, CalendarClock, Activity } from "lucide-react";

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
          value={stats.assignedProfiles}
          icon={UserSquare2}
          colorClass="bg-violet-50 text-violet-600"
        />
        <StatWidget
          title="Meetings Today"
          value={stats.meetingsToday}
          icon={CalendarClock}
          colorClass="bg-amber-50 text-amber-600"
        />
        <StatWidget
          title="Active Services"
          value={stats.activeServiceCount}
          icon={Activity}
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>
    </div>
  );
}