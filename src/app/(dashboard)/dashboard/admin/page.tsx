import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getAdminStats } from "@/lib/stats/dashboard-stats";

export default async function AdminDashboardPage() {
  const session = await auth();
  const stats = await getAdminStats();

  const leadsProgress =
    stats.leads.totalLeads > 0
      ? (stats.leads.convertedLeads / stats.leads.totalLeads) * 100
      : 0;

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
          title="Profile Hold"
          lines={[{ label: "On Hold", value: stats.profiles.profilesOnHold }]}
          progress={{
            value:
              stats.profiles.totalProfiles > 0
                ? (stats.profiles.profilesOnHold / stats.profiles.totalProfiles) * 100
                : 0,
            colorClass: "bg-orange-500",
          }}
          actionLabel="Details"
          actionHref="/dashboard/admin/profiles?status=ON_HOLD"
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
          title="Leads"
          badge={{
            text: `${stats.leads.totalLeads} Total`,
            className: "bg-cyan-100 text-cyan-700 border-cyan-200",
          }}
          lines={[
            { label: "New", value: stats.leads.newLeads },
            { label: "Contacted", value: stats.leads.contactedLeads },
            { label: "Converted", value: stats.leads.convertedLeads },
            { label: "Pending", value: stats.leads.pendingLeads },
            { label: "Closed", value: stats.leads.closedLeads },
          ]}
          progress={{ value: leadsProgress, colorClass: "bg-cyan-500" }}
          actionLabel="Manage Leads"
          actionHref="/dashboard/admin/leads"
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
          title="Meetings"
          lines={[
            { label: "Face to Face", value: stats.meetings.faceToFaceMeetings },
            { label: "Tele Meeting", value: stats.meetings.teleMeetings },
          ]}
          actionLabel="View Meetings"
          actionHref="/dashboard/admin/meetings"
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
    </div>
  );
}