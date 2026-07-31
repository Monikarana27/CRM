// Pure scoring logic — deliberately NOT a server action (no "use server"),
// since this never touches the database. Just takes data in, returns
// scored data out.
//
// Weights reflect real matchmaking priority in the Indian context:
// caste and religion are typically the most decisive factors after the
// hard filters, income/profession matter a lot, city matters least
// (many clients are open to relocation).

type ScorableProfile = {
  id: string;
  city: string | null;
  religion: string | null;
  caste: string | null;
  profession: string | null;
  annualIncome: string | null;
};

type PreferenceForScoring = {
  city?: string | null;
  religion?: string | null;
  caste?: string | null;
  profession?: string | null;
  annualIncome?: string | null;
} | null;

export function scoreAndRank<T extends ScorableProfile>(
  candidates: T[],
  preference: PreferenceForScoring
): (T & { score: number })[] {
  const scored = candidates.map((candidate) => {
    let score = 40; // baseline — candidate already passed hard filters to get here

    if (preference?.caste && candidate.caste === preference.caste) score += 20;
    if (preference?.religion && candidate.religion === preference.religion) score += 15;
    if (preference?.annualIncome && candidate.annualIncome === preference.annualIncome) score += 15;
    if (preference?.profession && candidate.profession === preference.profession) score += 10;
    if (preference?.city && candidate.city === preference.city) score += 5;

    return { ...candidate, score: Math.min(score, 100) };
  });

  return scored.sort((a, b) => b.score - a.score);
}