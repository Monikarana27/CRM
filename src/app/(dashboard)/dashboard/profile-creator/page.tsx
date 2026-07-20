import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getProfileCreatorDashboard } from "@/actions/profile-queue/profile-queue.actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ProfileCreatorDashboard() {
  const { pending, inProgress, completedToday, returnedForCorrection } = await getProfileCreatorDashboard();

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Profile Creator Dashboard"
        subtitle={`${pending.length} pending · ${inProgress.length} in progress · ${returnedForCorrection.length} returned`}
      />

      {returnedForCorrection.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-destructive">Returned for Correction</h2>
          {returnedForCorrection.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/profile-creator/edit/${p.id}`}
              className="block rounded-lg border border-destructive/30 bg-destructive/5 p-4 hover:bg-destructive/10"
            >
              <p className="font-medium">{p.name} ({p.profileCode})</p>
              {p.approvalNotes && <p className="text-sm text-muted-foreground">{p.approvalNotes}</p>}
            </Link>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Pending Queue</h2>
        {pending.map((q) => (
          <Link key={q.id} href={`/dashboard/profile-creator/create/${q.id}`} className="block rounded-lg border p-4 hover:bg-muted/50">
            <p className="font-medium">{q.lead.name}</p>
            <div className="text-sm text-muted-foreground">{q.lead.phone} · <Badge variant="outline">{q.status}</Badge></div>
          </Link>
        ))}
        {pending.length === 0 && <p className="text-sm text-muted-foreground">No leads waiting.</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">In Progress</h2>
        {inProgress.map((q) => (
          <Link key={q.id} href={`/dashboard/profile-creator/create/${q.id}`} className="block rounded-lg border p-4 hover:bg-muted/50">
            <p className="font-medium">{q.lead.name}</p>
            <div className="text-sm text-muted-foreground">{q.lead.phone} · <Badge variant="outline">{q.status}</Badge></div>
          </Link>
        ))}
        {inProgress.length === 0 && <p className="text-sm text-muted-foreground">Nothing in progress.</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Completed Today</h2>
        {completedToday.map((q) => (
          <div key={q.id} className="rounded-lg border bg-emerald-50 p-4">
            <p className="font-medium">{q.lead.name}</p>
            <p className="text-sm text-muted-foreground">{q.lead.phone}</p>
          </div>
        ))}
        {completedToday.length === 0 && <p className="text-sm text-muted-foreground">Nothing completed yet today.</p>}
      </section>
    </div>
  );
}