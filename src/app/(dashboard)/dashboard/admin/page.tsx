import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getAdminStats } from "@/lib/stats/dashboard-stats";
import { Contact, Users, CreditCard, HeartHandshake } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Here's what's happening across Sangam CRM today."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Total Leads"
          value={stats.totalLeads}
          icon={Contact}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatWidget
          title="Active Employees"
          value={stats.activeEmployees}
          icon={Users}
          colorClass="bg-violet-50 text-violet-600"
        />
        <StatWidget
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={CreditCard}
          colorClass="bg-amber-50 text-amber-600"
        />
        <StatWidget
          title="Active Services"
          value={stats.activeServices}
          icon={HeartHandshake}
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>
    </div>
  );
}