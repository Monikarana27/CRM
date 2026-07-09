import Link from "next/link";
import { getServices } from "@/actions/services/service.actions";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ServicesTable } from "./services-table";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const validStatus = ["ACTIVE", "HOLD", "EXPIRED"].includes(status ?? "")
    ? (status as "ACTIVE" | "HOLD" | "EXPIRED")
    : undefined;

  const services = await getServices(validStatus ? { status: validStatus } : undefined);

  const tabs = [
    { label: "All Services", value: undefined },
    { label: "Active", value: "ACTIVE" },
    { label: "Hold", value: "HOLD" },
    { label: "Expired", value: "EXPIRED" },
  ];

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Services"
        subtitle="Manage active subscriptions across your profiles."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = validStatus === tab.value;
            const href = tab.value
              ? `/dashboard/admin/services?status=${tab.value}`
              : "/dashboard/admin/services";
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
          <Link href="/dashboard/admin/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Attach Service
          </Link>
        </Button>
      </div>

      <ServicesTable services={services} />
    </div>
  );
}