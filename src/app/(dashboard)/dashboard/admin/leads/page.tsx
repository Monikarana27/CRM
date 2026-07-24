import Link from "next/link";
import { getLeads } from "@/actions/leads/lead.actions";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeadsTable } from "./leads-table";

export default async function LeadsPage() {
  const session = await auth();
  const role = session!.user.role;
  const canAssign = role === "ADMIN" || role === "SUPER_ADMIN";

  const leads = await getLeads();
  const employees = canAssign
    ? await prisma.user.findMany({
        where: { active: true, role: "SALES" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <DashboardHero
        title={canAssign ? "Sales Leads" : "My Leads"}
        subtitle={
          canAssign
            ? "Track and convert inbound inquiries."
            : "Your assigned leads — call, follow up, and convert."
        }
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{canAssign ? "All Leads" : "My Leads"}</h2>
        {canAssign && (
          <Button asChild>
            <Link href="/dashboard/admin/leads/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Link>
          </Button>
        )}
      </div>

      <LeadsTable leads={leads} employees={employees} canAssign={canAssign} />
    </div>
  );
}