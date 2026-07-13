import { findCompatibleProfiles } from "@/actions/matching/matching.actions";
import { prisma } from "@/lib/db/prisma";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { MatchingResults } from "./matching-results";

export default async function MatchingPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  const matches = await findCompatibleProfiles(profileId);

  return (
    <div className="space-y-6">
      <DashboardHero title={`Matches for ${profile?.name}`} subtitle={`${matches.length} compatible profiles found`} />
      <MatchingResults matches={matches} clientEmail={profile?.email ?? ""} />
    </div>
  );
}