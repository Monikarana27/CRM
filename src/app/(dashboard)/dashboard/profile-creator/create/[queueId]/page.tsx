import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { ProfileForm } from "@/app/(dashboard)/dashboard/admin/profiles/profile-form";
import { createProfileFromQueueAction } from "@/actions/profile-queue/create-from-queue.action";
import { markQueueInProgressAction } from "@/actions/profile-queue/profile-queue.actions";

export default async function CreateFromQueuePage({ params }: { params: Promise<{ queueId: string }> }) {
  const { queueId } = await params;
  const queueEntry = await prisma.profileQueue.findUnique({ where: { id: queueId }, include: { lead: true } });
  if (!queueEntry) notFound();

  await markQueueInProgressAction(queueId);

  const boundAction = createProfileFromQueueAction.bind(null, queueId);

  return (
    <div className="space-y-6">
      <DashboardHero title={`Create Profile — ${queueEntry.lead.name}`} subtitle={queueEntry.lead.phone} />
      <ProfileForm
        mode="create"
        defaultValues={{ name: queueEntry.lead.name, phone: queueEntry.lead.phone, email: queueEntry.lead.email }}
        action={boundAction}
      />
    </div>
  );
}