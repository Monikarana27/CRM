import { getLeads } from "@/actions/leads/lead.actions";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { LeadsTable } from "../../admin/leads/leads-table";

export default async function SalesLeadsPage() {
  const leads = await getLeads();

  return (
    <div className="space-y-6">
      <DashboardHero
        title="My Leads"
        subtitle="Your assigned leads — call, follow up, and convert."
      />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Leads</h2>
      </div>
      <LeadsTable leads={leads} employees={[]} canAssign={false} />
    </div>
  );
}
