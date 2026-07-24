"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { getCurrentToken, setSessionToken } from "@/lib/auth/impersonation";
import { redirect } from "next/navigation";

export async function startImpersonationAction(targetUserId: string) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  if (session.user.impersonating) {
    throw new Error("Cannot impersonate while already impersonating");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target || !target.active) {
    throw new Error("Target user not found or inactive");
  }

  const currentToken = await getCurrentToken();
  if (!currentToken) throw new Error("No active session");

 await setSessionToken({
  ...currentToken,
  sub: target.id,
  name: target.name,
  email: target.email,
  role: target.role,
  active: target.active,
  impersonating: true,
  originalUserId: session.user.id,
  originalUserName: session.user.name,
});

  await prisma.activityLog.create({
    data: {
      actorId: session.user.id,
      action: "START_IMPERSONATION",
      entityType: "User",
      entityId: target.id,
    },
  });

  const ROLE_ROUTE_MAP: Record<string, string> = {
  SUPER_ADMIN: "admin", ADMIN: "admin", SALES: "sales",
  SERVICE: "service", PROFILE_CREATOR: "profile-creator", HR: "hr",
};
redirect(`/dashboard/${ROLE_ROUTE_MAP[target.role] ?? target.role.toLowerCase()}`);

}

export async function endImpersonationAction() {
  const session = await auth();
  if (!session?.user?.impersonating || !session.user.originalUserId) {
    throw new Error("Not currently impersonating");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.originalUserId },
  });
  if (!admin) throw new Error("Original admin account not found");

  const currentToken = await getCurrentToken();
  if (!currentToken) throw new Error("No active session");

  await setSessionToken({
  ...currentToken,
  sub: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  active: admin.active,
  impersonating: undefined,
  originalUserId: undefined,
  originalUserName: undefined,
});

  await prisma.activityLog.create({
    data: {
      actorId: admin.id,
      action: "END_IMPERSONATION",
      entityType: "User",
      entityId: session.user.id,
    },
  });

  redirect("/dashboard/admin");
}
