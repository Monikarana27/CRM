"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { getCurrentToken, setSessionToken } from "@/lib/auth/impersonation";
import { redirect } from "next/navigation";
import { ROLE_ROUTE_MAP } from "@/lib/permissions/role-routes";
import { getTeamMemberIds } from "@/lib/hierarchy/team";

const TEAM_SCOPED_ROLES = ["SALES_TL", "SALES_MANAGER", "SERVICE_TL", "SERVICE_MANAGER"];

export async function startImpersonationAction(targetUserId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.impersonating) {
    throw new Error("Cannot impersonate while already impersonating");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target || !target.active) {
    throw new Error("Target user not found or inactive");
  }

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  const isTeamScopedRole = TEAM_SCOPED_ROLES.includes(session.user.role);

  if (isAdmin) {
    if (session.user.role === "ADMIN" && ["ADMIN", "SUPER_ADMIN"].includes(target.role)) {
      throw new Error("Admins cannot impersonate other admins or super admins");
    }
  } else if (isTeamScopedRole) {
    const teamIds = await getTeamMemberIds(session.user.id);
    if (!teamIds.includes(target.id)) {
      throw new Error("You can only impersonate members of your own team");
    }
  } else {
    throw new Error("Unauthorized");
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
  redirect(`/dashboard/${ROLE_ROUTE_MAP[admin.role] ?? admin.role.toLowerCase()}`);
}