"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { sendMatchedProfilesEmail } from "@/lib/email/send-profile-email";

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export async function sendMatchedProfilesAction(clientProfileId: string, toEmail: string, profileIds: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [profiles, client, sender] = await Promise.all([
    prisma.profile.findMany({
      where: { id: { in: profileIds } },
      include: { religion: { select: { name: true } }, caste: { select: { name: true } } },
    }),
    prisma.profile.findUnique({ where: { id: clientProfileId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, phone: true, role: true } }),
  ]);

  try {
    await sendMatchedProfilesEmail(
      toEmail,
      client?.name ?? "Client",
      profiles.map((p) => ({
        name: p.name,
        profileCode: p.profileCode,
        photoUrl: p.photoUrl,
        age: calcAge(p.dob),
        height: p.height,
        city: p.city,
        religionName: p.religion?.name ?? null,
        casteName: p.caste?.name ?? null,
        profession: p.profession,
        highestQualification: p.highestQualification,
      })),
      { name: sender?.name ?? "Your Relationship Manager", role: sender?.role, email: sender?.email, phone: sender?.phone }
    );
  } catch (err) {
    console.error("Failed to send matched profiles email:", err);
    // Don't let an SMTP failure crash the whole action — the ProfileShare
    // record below is still valuable even if the email itself failed.
  }

  await prisma.activityLog.create({
    data: { actorId: session.user.id, action: "SEND_MATCHED_PROFILES", entityType: "Profile", entityId: profileIds[0] },
  });

  const subscription = await prisma.subscription.findFirst({
    where: { profileId: clientProfileId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (subscription) {
    await prisma.profileShare.createMany({
      data: profileIds.map((sharedProfileId) => ({
        subscriptionId: subscription.id,
        sharedProfileId,
        sharedById: session.user.id,
      })),
    });
  }
}