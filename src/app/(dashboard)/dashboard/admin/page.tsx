import { auth } from "@/lib/auth/auth";
import { PlaceholderWidget } from "@/components/widgets/placeholder-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Here's what's happening across Sangam CRM today."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PlaceholderWidget title="Total Leads" />
        <PlaceholderWidget title="Active Employees" />
        <PlaceholderWidget title="Pending Payments" />
        <PlaceholderWidget title="Service Requests" />
      </div>
    </div>
  );
}