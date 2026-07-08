import { auth } from "@/lib/auth/auth";
import { PlaceholderWidget } from "@/components/widgets/placeholder-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";

export default async function ServiceDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Here's your service activity for today."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PlaceholderWidget title="Assigned Profiles" />
        <PlaceholderWidget title="Meetings Today" />
        <PlaceholderWidget title="Service Status" />
      </div>
    </div>
  );
}