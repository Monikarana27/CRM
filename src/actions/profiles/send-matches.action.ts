"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { sendProfileEmail } from "@/lib/email/send-profile-email";

export async function sendMatchedProfilesAction(toEmail: string, profileIds: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const profiles = await prisma.profile.findMany({ where: { id: { in: profileIds } } });

  for (const p of profiles) {
    await sendProfileEmail(toEmail, p.name, p.profileCode, p.photoUrl);
  }

  await prisma.activityLog.create({
    data: { actorId: session.user.id, action: "SEND_MATCHED_PROFILES", entityType: "Profile", entityId: profileIds[0] },
  });
}