import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { FunnelBreakdown } from "@/components/widgets/funnel-breakdown";
import { ConversionRateCard } from "@/components/widgets/conversion-rate-card";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getAdminStats } from "@/lib/stats/dashboard-stats";

export default async function AdminDashboardPage() {
  const session = await auth();
  const stats = await getAdminStats();

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Profiles"
          badge={{
            text: `${stats.profiles.totalProfiles} Total`,
            className: "bg-amber-100 text-amber-700 border-amber-200",
          }}
          lines={[
            { label: "Total", value: stats.profiles.totalProfiles },
            { label: "Male", value: stats.profiles.maleProfiles },
            { label: "Female", value: stats.profiles.femaleProfiles },
          ]}
          progress={{ value: 100, colorClass: "bg-amber-500" }}
          actionLabel="View Profiles"
          actionHref="/dashboard/admin/profiles"
        />

        <StatWidget
          title="Ongoing Services"
          badge={{ text: "Live Data", className: "bg-emerald-100 text-emerald-700 border-emerald-200" }}
          lines={[
            { label: "Active", value: stats.services.activeServices },
            { label: "On Hold", value: stats.services.holdServices },
            { label: "Expired", value: stats.services.expiredServices },
          ]}
          progress={{ value: servicesProgress, colorClass: "bg-emerald-500" }}
          actionLabel="View Services"
          actionHref="/dashboard/admin/services"
        />

        <StatWidget
          title="Payments"
          badge={{
            text: `₹${stats.payments.totalCollected.toLocaleString("en-IN")}`,
            className: "bg-red-100 text-red-700 border-red-200",
          }}
          lines={[
            { label: "Paid", value: stats.payments.paidPayments },
            { label: "Pending", value: stats.payments.pendingPayments },
            { label: "Failed", value: stats.payments.failedPayments },
          ]}
          progress={{ value: paymentsProgress, colorClass: "bg-red-500" }}
          actionLabel="View Payments"
          actionHref="/dashboard/admin/payments"
        />

        <StatWidget
          title="Employees"
          badge={{
            text: `${stats.employees.totalEmployees} Total`,
            className: "bg-violet-100 text-violet-700 border-violet-200",
          }}
          lines={[
            { label: "Active", value: stats.employees.activeEmployees },
            { label: "Total", value: stats.employees.totalEmployees },
          ]}
          progress={{ value: employeesProgress, colorClass: "bg-violet-500" }}
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
        <ConversionRateCard
          rate={stats.leads.conversionRate}
          month={currentMonth}
          todaysActivityCount={stats.todaysActivityCount}
        />
      </div>
    </div>
  );
}