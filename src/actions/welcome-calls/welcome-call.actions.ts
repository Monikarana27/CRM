"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { getTeamMemberIds } from "@/lib/hierarchy/team";

async function requireStaff() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

const TEAM_ROLES = ["SALES_TL", "SALES_MANAGER", "SERVICE_TL", "SERVICE_MANAGER"];
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const SALES_ROLES = ["SALES", "SALES_TL", "SALES_MANAGER"];
const SERVICE_ROLES = ["SERVICE", "SERVICE_TL", "SERVICE_MANAGER"];

export async function getWelcomeCalls(filter?: {
  status?: "PENDING" | "COMPLETED";
  department?: "SALES" | "SERVICE";
}) {
  const session = await requireStaff();
  const role = session.user.role;

  let scopeFilter: Record<string, unknown> = {};

  if (ADMIN_ROLES.includes(role)) {
    scopeFilter = filter?.department
      ? { assignedTo: { role: { in: filter.department === "SALES" ? SALES_ROLES : SERVICE_ROLES } } }
      : {};
  } else if (TEAM_ROLES.includes(role)) {
    const teamIds = await getTeamMemberIds(session.user.id);
    scopeFilter = { assignedToId: { in: [session.user.id, ...teamIds] } };
  } else {
    scopeFilter = { assignedToId: session.user.id };
  }

  return prisma.welcomeCall.findMany({
    where: {
      ...scopeFilter,
      ...(filter?.status ? { status: filter.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { id: true, name: true, phone: true, email: true } },
      profile: { select: { id: true, name: true, phone: true, email: true, profileCode: true } },
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  });
}

export async function markWelcomeCallCompleteAction(id: string, attachmentUrl: string) {
  const session = await requireStaff();

  const entry = await prisma.welcomeCall.findUnique({ where: { id }, select: { assignedToId: true } });
  if (!entry) throw new Error("Not found");
  if (entry.assignedToId !== session.user.id && !ADMIN_ROLES.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  await prisma.welcomeCall.update({
    where: { id },
    data: { status: "COMPLETED", attachmentUrl, completedAt: new Date() },
  });

  revalidatePath("/dashboard/welcome-calls");
}