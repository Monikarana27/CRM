import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { FunnelBreakdown } from "@/components/widgets/funnel-breakdown";
import { ConversionRateCard } from "@/components/widgets/conversion-rate-card";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getAdminStats, getRecentActivity } from "@/lib/stats/dashboard-stats";
import { QuickActions } from "@/components/widgets/quick-actions";
import { NotificationsPanel } from "@/components/widgets/notifications-panel";
import { getNotifications } from "@/lib/stats/notifications";
import { RecentActivity } from "@/components/widgets/recent-activity";

export default async function AdminDashboardPage() {
  const session = await auth();
  const [stats, recentActivity, notifications] = await Promise.all([
    getAdminStats(),
    getRecentActivity(10),
    getNotifications(),
  ]);

  const servicesProgress =
    stats.services.activeServices + stats.services.holdServices + stats.services.expiredServices > 0
      ? (stats.services.activeServices /
          (stats.services.activeServices + stats.services.holdServices + stats.services.expiredServices)) *
        100
      : 0;

  const paymentsTotal =
    stats.payments.paidPayments + stats.payments.pendingPayments + stats.payments.failedPayments;
  const paymentsProgress = paymentsTotal > 0 ? (stats.payments.paidPayments / paymentsTotal) * 100 : 0;

  const employeesProgress =
    stats.employees.totalEmployees > 0
      ? (stats.employees.activeEmployees / stats.employees.totalEmployees) * 100
      : 0;

  const funnelTotal = stats.leads.totalLeads;
  const profileFunnelTotal =
    stats.profileAssignment.assigned + stats.profileAssignment.reassigned + stats.profileAssignment.unassigned;

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
    {
      label: "Assigned Profiles",
      value: stats.profileAssignment.assigned,
      total: profileFunnelTotal,
      colorClass: "border-violet-400 bg-violet-50",
      barColorClass: "bg-violet-500",
    },
    {
      label: "Re-assigned Profiles",
      value: stats.profileAssignment.reassigned,
      total: profileFunnelTotal,
      colorClass: "border-purple-400 bg-purple-50",
      barColorClass: "bg-purple-500",
    },
    {
      label: "Unassigned Profiles",
      value: stats.profileAssignment.unassigned,
      total: profileFunnelTotal,
      colorClass: "border-gray-400 bg-gray-50",
      barColorClass: "bg-gray-500",
    },
  ];

  const currentMonth = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Here's what's happening across Sangam CRM today."
      />

      <QuickActions />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Profiles"
          badge={{
            text: `${stats.profiles.totalProfiles} Total`,
            className: "bg-muted text-muted-foreground border-border",
          }}
          lines={[
            { label: "Total", value: stats.profiles.totalProfiles },
            { label: "Male", value: stats.profiles.maleProfiles },
            { label: "Female", value: stats.profiles.femaleProfiles },
          ]}
          progress={{ value: 100, colorClass: "bg-primary" }}
          actionLabel="View Profiles"
          actionHref="/dashboard/admin/profiles"
        />

        <StatWidget
          title="Ongoing Services"
          badge={{ text: "Live Data", className: "bg-muted text-muted-foreground border-border" }}
          lines={[
            { label: "Active", value: stats.services.activeServices },
            { label: "On Hold", value: stats.services.holdServices },
            { label: "Expired", value: stats.services.expiredServices },
          ]}
          progress={{ value: servicesProgress, colorClass: "bg-primary" }}
          actionLabel="View Subscriptions"
          actionHref="/dashboard/admin/subscriptions"
        />
        <StatWidget
          title="Today's Summary"
          badge={{ text: "Live", className: "bg-muted text-muted-foreground border-border" }}
          lines={[
            { label: "New Leads", value: stats.todaysSummary.newLeadsToday },
            { label: "Profiles Created", value: stats.todaysSummary.profilesCreatedToday },
            { label: "Meetings Today", value: stats.todaysSummary.meetingsToday },
            { label: "Pending Approvals", value: stats.todaysSummary.pendingApprovals },
            { label: "Active Services", value: stats.todaysSummary.activeServices },
          ]}
          progress={{ value: 100, colorClass: "bg-primary" }}
          actionLabel="View Approvals"
          actionHref="/dashboard/admin/profiles?filter=pending-approval"
        />

        <StatWidget
          title="Payments"
          badge={{
            text: `₹${stats.payments.totalCollected.toLocaleString("en-IN")}`,
            className: "bg-muted text-muted-foreground border-border",
          }}
          lines={[
            { label: "Paid", value: stats.payments.paidPayments },
            { label: "Pending", value: stats.payments.pendingPayments },
            { label: "Failed", value: stats.payments.failedPayments },
          ]}
          progress={{ value: paymentsProgress, colorClass: "bg-primary" }}
          actionLabel="View Payments"
          actionHref="/dashboard/admin/payments"
        />

        <StatWidget
          title="Employees"
          badge={{
            text: `${stats.employees.totalEmployees} Total`,
            className: "bg-muted text-muted-foreground border-border",
          }}
          lines={[
            { label: "Active", value: stats.employees.activeEmployees },
            { label: "Total", value: stats.employees.totalEmployees },
          ]}
          progress={{ value: employeesProgress, colorClass: "bg-primary" }}
          actionLabel="Manage Staff"
          actionHref="/dashboard/admin/employees"
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
        <div className="flex flex-col gap-4">
          <ConversionRateCard
            rate={stats.leads.conversionRate}
            month={currentMonth}
            todaysActivityCount={stats.todaysActivityCount}
          />
          <RecentActivity items={recentActivity} />
          <NotificationsPanel items={notifications} />
        </div>
      </div>
    </div>
  );
}







