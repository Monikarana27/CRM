import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getSalesStats } from "@/lib/stats/dashboard-stats";

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
          lines={[{ label: "Assigned to Me", value: stats.myLeads }]}
          actionLabel="View Leads"
          actionHref="/dashboard/sales/leads"
        />
        <StatWidget
          title="My Profiles"
          lines={[{ label: "Assigned to Me", value: stats.myProfiles }]}
          actionLabel="View Profiles"
          actionHref="/dashboard/sales/profiles"
        />
        <StatWidget
          title="Follow-ups Due"
          lines={[{ label: "Scheduled", value: stats.followUpsDue }]}
          actionLabel="View Follow-ups"
          actionHref="/dashboard/sales/follow-ups"
        />
      </div>
    </div>
  );
}