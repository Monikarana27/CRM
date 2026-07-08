import { DashboardHero } from "@/components/layout/dashboard-hero";
import { LeadForm } from "../lead-form";
import { createLeadAction } from "@/actions/leads/lead.actions";

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <DashboardHero
        title="Add Lead"
        subtitle="Log a new inbound inquiry."
      />
      <LeadForm mode="create" action={createLeadAction} />
    </div>
  );
}