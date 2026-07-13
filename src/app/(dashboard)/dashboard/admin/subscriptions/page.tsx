import Link from "next/link";
import { getSubscriptions } from "@/actions/subscriptions/subscription.actions";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SubscriptionsTable } from "./subscriptions-table";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const validStatus = ["ACTIVE", "HOLD", "EXPIRED"].includes(status ?? "")
    ? (status as "ACTIVE" | "HOLD" | "EXPIRED")
    : undefined;

  const subscriptions = await getSubscriptions(validStatus ? { status: validStatus } : undefined);

  const tabs = [
    { label: "All Subscriptions", value: undefined },
    { label: "Active", value: "ACTIVE" },
    { label: "Hold", value: "HOLD" },
    { label: "Expired", value: "EXPIRED" },
  ];

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Subscriptions"
        subtitle="Manage active subscriptions across your profiles."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = validStatus === tab.value;
            const href = tab.value
              ? `/dashboard/admin/subscriptions?status=${tab.value}`
              : "/dashboard/admin/subscriptions";
            return (
              <Link
                key={tab.label}
                href={href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/subscriptions/new">
            <Plus className="mr-2 h-4 w-4" />
            Attach Subscription
          </Link>
        </Button>
      </div>

      <SubscriptionsTable subscriptions={subscriptions} />
    </div>
  );
}
