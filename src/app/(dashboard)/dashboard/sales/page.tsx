import { auth } from "@/lib/auth/auth";
import { PlaceholderWidget } from "@/components/widgets/placeholder-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";

export default async function SalesDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Here's your sales activity for today."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PlaceholderWidget title="My Leads" />
        <PlaceholderWidget title="My Profiles" />
        <PlaceholderWidget title="Follow-ups Due" />
      </div>
    </div>
  );
}