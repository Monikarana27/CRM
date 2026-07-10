import { DashboardHero } from "@/components/layout/dashboard-hero";
import { prisma } from "@/lib/db/prisma";
import { createCallLogAction } from "@/actions/call-logs/call-log.actions";
import { LogCallForm } from "./log-call-form";

export default async function NewCallLogPage() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, name: true, profileCode: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Log Call"
        subtitle="Record a welcome or follow-up call outcome."
      />
      <LogCallForm profiles={profiles} action={createCallLogAction} />
    </div>
  );
}