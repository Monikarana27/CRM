"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { getActingUserId } from "@/lib/auth/get-acting-user";
import { sendProfileEmail } from "@/lib/email/send-profile-email";

export async function sendMatchedProfilesAction(clientProfileId: string, toEmail: string, profileIds: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const profiles = await prisma.profile.findMany({ where: { id: { in: profileIds } } });

  for (const p of profiles) {
    await sendProfileEmail(toEmail, p.name, p.profileCode, p.photoUrl);
  }

  await prisma.activityLog.create({
    data: { actorId: await getActingUserId(session), action: "SEND_MATCHED_PROFILES", entityType: "Profile", entityId: profileIds[0] },
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