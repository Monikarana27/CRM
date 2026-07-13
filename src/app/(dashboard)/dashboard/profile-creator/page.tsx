import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getProfileQueue } from "@/actions/profile-queue/profile-queue.actions";
import Link from "next/link";

export default async function ProfileCreatorDashboard() {
  const queue = await getProfileQueue();
  return (
    <div className="space-y-6">
      <DashboardHero title="Profile Creator Dashboard" subtitle={`${queue.length} leads in queue`} />
      <div className="space-y-2">
        {queue.map((q: (typeof queue)[number]) => (
          <Link key={q.id} href={`/dashboard/profile-creator/create/${q.id}`} className="block rounded-lg border p-4 hover:bg-muted/50">
            <p className="font-medium">{q.lead.name}</p>
            <p className="text-sm text-muted-foreground">{q.lead.phone} · {q.status}</p>
          </Link>
        ))}
        {queue.length === 0 && <p className="text-sm text-muted-foreground">No leads waiting.</p>}
      </div>
    </div>
  );
}
