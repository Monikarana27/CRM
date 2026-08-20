import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getProfileDocuments } from "@/actions/documents/document.actions";
import { DocumentUploader } from "@/components/shared/document-uploader";
import { BiodataDownloadButton } from "@/components/shared/biodata-download-button";
import { SharedProfilesTable } from "@/components/shared/shared-profiles-table";
import { getSharedProfilesForSubscription } from "@/actions/profile-shares/profile-share.actions";

export default async function ServiceProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) notFound();
  const docs = await getProfileDocuments(id);

  const activeSubscription = await prisma.subscription.findFirst({
    where: { profileId: profile.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  const sharedProfiles = activeSubscription
    ? await getSharedProfilesForSubscription(activeSubscription.id)
    : [];

  return (
  <div className="space-y-6">
    <DashboardHero
      title={profile.name}
      subtitle={`Profile ID: ${profile.profileCode}`}
    />

    <div className="flex justify-end">
      <BiodataDownloadButton profileId={id} variant="default" />
    </div>

    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-sm font-semibold">Photos & Documents</h2>
      <DocumentUploader profileId={id} initialDocs={docs} />
    </div>

    {activeSubscription && (
      <SharedProfilesTable rows={sharedProfiles} clientName={profile.name} clientProfileId={profile.id} />
    )}
  </div>
);
}