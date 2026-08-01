import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { findCompatibleProfiles } from "@/actions/matching/matching.actions";
import { scoreAndRank } from "@/lib/matching/scoring";
import { generatePitch } from "@/lib/ai/agents/pitch.agent";
import { generateSearchBrief } from "@/lib/ai/agents/brief.agent";

const MIN_MATCHES_THRESHOLD = 5;
const MAX_PITCHES_TO_GENERATE = 8;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.accountType === "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { profileId } = await req.json();
    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const client = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { partnerPreference: true, subscriptions: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const hasActiveSub = client.subscriptions.some((s) => s.status === "ACTIVE");
    if (!hasActiveSub) {
      return NextResponse.json(
        { error: "This profile has no active subscription — not a paid client" },
        { status: 400 }
      );
    }

    const candidates = await findCompatibleProfiles(profileId);
    const ranked = scoreAndRank(candidates, client.partnerPreference);

    if (ranked.length >= MIN_MATCHES_THRESHOLD) {
      const topCandidates = ranked.slice(0, MAX_PITCHES_TO_GENERATE);

      const matches = await Promise.all(
        topCandidates.map(async (candidate) => {
          try {
            const ageMatch =
              candidate.dob != null
                ? Math.floor((Date.now() - new Date(candidate.dob).getTime()) / 3.15576e10)
                : null;

            const pitch = await generatePitch({
              clientName: client.name,
              clientCity: client.city,
              candidateName: candidate.name,
              candidateCity: candidate.city,
              candidateProfession: candidate.profession ?? null,
              candidateAge: ageMatch,
              matchScore: candidate.score,
            });

            return {
              profile: {
                id: candidate.id,
                profileCode: candidate.profileCode,
                name: candidate.name,
                city: candidate.city,
                religion: candidate.religion,
              },
              score: candidate.score,
              reasoning: pitch.reasoning,
              whatsappDraft: pitch.whatsappDraft,
            };
          } catch (err) {
            console.error(`Pitch generation failed for candidate ${candidate.id}:`, err);
            return null;
          }
        })
      );

      return NextResponse.json({
        mode: "internal_matches",
        matches: matches.filter(Boolean),
      });
    } else {
      const brief = await generateSearchBrief({
        clientName: client.name,
        preference: client.partnerPreference,
      });

      return NextResponse.json({
        mode: "search_brief",
        brief,
        internalMatchCount: ranked.length,
      });
    }
  } catch (err) {
    console.error("match-suggestions route error:", err);
    return NextResponse.json({ error: "Failed to generate match suggestions" }, { status: 500 });
  }
}
