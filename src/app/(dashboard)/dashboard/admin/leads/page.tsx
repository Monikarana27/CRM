import Link from "next/link";
import { getLeads } from "@/actions/leads/lead.actions";
import { prisma } from "@/lib/db/prisma";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeadsTable } from "./leads-table";

export default async function LeadsPage() {
  const leads = await getLeads();
  const employees = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Sales Leads"
        subtitle="Track and convert inbound inquiries."
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Leads</h2>
        <Button asChild>
          <Link href="/dashboard/admin/leads/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Link>
        </Button>
      </div>

      <LeadsTable leads={leads} employees={employees} />
    </div>
  );
}