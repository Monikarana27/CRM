import { getLeadById } from "@/actions/leads/lead.actions";
import { getLeadTimeline } from "@/actions/leads/lead-remark.actions";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { notFound } from "next/navigation";
import { LeadRemarkForm } from "./lead-remark-form";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();
  const timeline = await getLeadTimeline(id);

  return (
    <div className="space-y-6">
      <DashboardHero title={lead.name} subtitle={`${lead.phone} · ${lead.status}`} />
      <LeadRemarkForm leadId={id} />
      <div className="space-y-3">
        {timeline.map((t: (typeof timeline)[number]) => (
          <div key={t.id} className="rounded-lg border p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span className="font-medium text-foreground">{t.outcome.replace("_", " ")}</span>
              <span>{t.actor.name} · {new Date(t.createdAt).toLocaleString("en-IN")}</span>
            </div>
            {t.remark && <p className="mt-1">{t.remark}</p>}
          </div>
        ))}
        {timeline.length === 0 && <p className="text-sm text-muted-foreground">No call activity yet.</p>}
      </div>
    </div>
  );
}
