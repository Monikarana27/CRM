import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { FunnelBreakdown } from "@/components/widgets/funnel-breakdown";
import { ConversionRateCard } from "@/components/widgets/conversion-rate-card";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getSalesStats } from "@/lib/stats/dashboard-stats";
import { getMyTarget } from "@/actions/sales-targets/sales-target.actions";
import { Card, CardContent } from "@/components/ui/card";

export default async function SalesDashboardPage() {
  const session = await auth();
  const stats = await getSalesStats(session!.user.id);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const myTarget = await getMyTarget(session!.user.id, currentMonth, currentYear);

  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const targetPct =
    myTarget.targetAmount && myTarget.targetAmount > 0
      ? Math.min((myTarget.achievedAmount / myTarget.targetAmount) * 100, 100)
      : 0;
  const remaining = myTarget.targetAmount
    ? Math.max(myTarget.targetAmount - myTarget.achievedAmount, 0)
    : 0;

  const funnelTotal = stats.leads.totalLeads;

  const funnelRows = [
    {
      label: "New Leads",
      value: stats.leads.newLeads,
      total: funnelTotal,
      colorClass: "border-blue-400 bg-blue-50",
      barColorClass: "bg-blue-500",
    },
    {
      label: "Contacted Leads",
      value: stats.leads.contactedLeads,
      total: funnelTotal,
      colorClass: "border-cyan-400 bg-cyan-50",
      barColorClass: "bg-cyan-500",
    },
    {
      label: "Converted Leads",
      value: stats.leads.convertedLeads,
      total: funnelTotal,
      colorClass: "border-emerald-400 bg-emerald-50",
      barColorClass: "bg-emerald-500",
    },
    {
      label: "Pending Follow-ups",
      value: stats.leads.pendingLeads,
      total: funnelTotal,
      colorClass: "border-amber-400 bg-amber-50",
      barColorClass: "bg-amber-500",
    },
    {
      label: "Not Interested",
      value: stats.leads.notInterestedLeads,
      total: funnelTotal,
      colorClass: "border-red-400 bg-red-50",
      barColorClass: "bg-red-500",
    },
  ];

  const quickActions = [
  { label: "Call New Leads", href: "/dashboard/admin/leads?status=NEW", color: "bg-blue-500" },
  { label: "Contacted Leads", href: "/dashboard/admin/leads?status=CONTACTED", color: "bg-cyan-500" },
  { label: "View Converted", href: "/dashboard/admin/leads?status=CONVERTED", color: "bg-emerald-500" },
  { label: "Pending Follow-ups", href: "/dashboard/admin/leads?status=PENDING", color: "bg-amber-500" },
  { label: "Not Interested", href: "/dashboard/admin/leads?status=NOT_INTERESTED", color: "bg-red-500" },
];
  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Track your leads, conversions, and follow-ups."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Total Leads"
          lines={[{ label: "All Leads", value: stats.myLeads }]}
          actionLabel="View Leads"
          actionHref="/dashboard/admin/leads"
        />
        <StatWidget
          title="Converted Leads"
          lines={[{ label: "This Total", value: stats.leads.convertedLeads }]}
        />
        <StatWidget
          title="New Leads Today"
          lines={[{ label: "Today", value: stats.newLeadsToday }]}
        />
        <StatWidget
          title="Follow-ups Due"
          lines={[{ label: "Scheduled", value: stats.followUpsDue }]}
          actionLabel="View Meetings"
          actionHref="/dashboard/admin/meetings"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FunnelBreakdown
            title="Lead Pipeline"
            subtitle="Current lead status breakdown"
            badge="Live Overview"
            rows={funnelRows}
          />
        </div>
        <ConversionRateCard
          rate={stats.leads.conversionRate}
          month={monthLabel}
          todaysActivityCount={stats.todaysActivityCount}
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="bg-gradient-to-br from-primary to-[oklch(0.22_0.08_275)] p-6">
          {myTarget.targetAmount === null ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-primary-foreground/90">
              <p className="text-lg font-semibold">No target assigned to you for {monthLabel}</p>
              <p className="text-sm text-primary-foreground/70">
                Contact your admin to assign a monthly target.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="text-primary-foreground">
                <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
                  My Target — {monthLabel}
                </p>
                <p className="font-display text-2xl font-bold">{session?.user?.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-primary-foreground">
                <div>
                  <p className="text-xs text-primary-foreground/70">Target</p>
                  <p className="font-semibold tabular-nums">
                    ₹{myTarget.targetAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/70">Achieved</p>
                  <p className="font-semibold tabular-nums">
                    ₹{myTarget.achievedAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/70">Remaining</p>
                  <p className="font-semibold tabular-nums">₹{remaining.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-accent text-accent">
                <span className="text-sm font-bold">{targetPct.toFixed(0)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className={`${action.color} flex h-11 items-center justify-center rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90`}>
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}