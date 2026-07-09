import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getSalesStats } from "@/lib/stats/dashboard-stats";
import { Contact, UserSquare2, CalendarClock } from "lucide-react";

export default async function SalesDashboardPage() {
  const session = await auth();
  const stats = await getSalesStats(session!.user.id);

  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Here's your sales activity for today."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatWidget
          title="My Leads"
          value={stats.myLeads}
          icon={Contact}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatWidget
          title="My Profiles"
          value={stats.myProfiles}
          icon={UserSquare2}
          colorClass="bg-violet-50 text-violet-600"
        />
        <StatWidget
          title="Follow-ups Due"
          value={stats.followUpsDue}
          icon={CalendarClock}
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>
    </div>
  );
}