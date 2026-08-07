// Pure scoring logic — deliberately NOT a server action (no "use server"),
// since this never touches the database. Just takes data in, returns
// scored data out.
//
// Weights reflect real matchmaking priority in the Indian context:
// caste and religion are typically the most decisive factors after the
// hard filters, income/profession matter a lot, city matters least
// (many clients are open to relocation).
//
// UPDATED for master-data normalization: caste/religion are now compared by
// ID (religionId/casteId) instead of free-text name. This is a genuine
// improvement, not just a mechanical change — before this, "Brahmin" vs
// "brahmin" vs "Brahmin " (trailing space) would silently score as a
// non-match. After normalization, two profiles pointing at the same
// Religion/Caste row are guaranteed to match correctly.

type ScorableProfile = {
  id: string;
  city: string | null;
  religionId: string | null;
  casteId: string | null;
  profession: string | null;
  annualIncome: string | null;
};

type PreferenceForScoring = {
  city?: string | null;
  religionId?: string | null;
  casteId?: string | null;
  profession?: string | null;
  annualIncome?: string | null;
} | null;

export function scoreAndRank<T extends ScorableProfile>(
  candidates: T[],
  preference: PreferenceForScoring
): (T & { score: number })[] {
  const scored = candidates.map((candidate) => {
    let score = 40; // baseline — candidate already passed hard filters to get here

    if (preference?.casteId && candidate.casteId === preference.casteId) score += 20;
    if (preference?.religionId && candidate.religionId === preference.religionId) score += 15;
    if (preference?.annualIncome && candidate.annualIncome === preference.annualIncome) score += 15;
    if (preference?.profession && candidate.profession === preference.profession) score += 10;
    if (preference?.city && candidate.city === preference.city) score += 5;

    return { ...candidate, score: Math.min(score, 100) };
  });

  return scored.sort((a, b) => b.score - a.score);
}

// CALL-SITE NOTE: whatever calls scoreAndRank() today passes
// { religion: profile.religion, caste: profile.caste, ... } — those call
// sites (matching.actions.ts and possibly service/matching page.tsx /
// ai-suggestions.tsx) need to pass religionId/casteId instead. tsc --noEmit
// will point at the exact lines once this file is dropped in.
