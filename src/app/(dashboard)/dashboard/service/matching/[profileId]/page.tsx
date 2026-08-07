import { findCompatibleProfiles } from "@/actions/matching/matching.actions";
import { prisma } from "@/lib/db/prisma";
import AiSuggestions from "./ai-suggestions";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { MatchingResults } from "./matching-results";

export default async function MatchingPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  const rawMatches = await findCompatibleProfiles(profileId);

  // CHANGED: map religion relation -> flat .name string, matching what
  // MatchingResults' Match type expects (kept that type unchanged/flat
  // rather than pushing relation objects into the client component).
  const matches = rawMatches.map((m) => ({
    id: m.id,
    name: m.name,
    profileCode: m.profileCode,
    city: m.city,
    religion: m.religion?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <DashboardHero title={`Matches for ${profile?.name}`} subtitle={`${matches.length} compatible profiles found`} />
      <MatchingResults matches={matches} clientEmail={profile?.email ?? ""} />
      <AiSuggestions profileId={profileId} />
    </div>
  );
}
