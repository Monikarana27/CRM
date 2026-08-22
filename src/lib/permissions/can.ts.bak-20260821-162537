import { prisma } from "@/lib/db/prisma";
import type { Role, PermissionAction } from "@prisma/client";

const RANK: Record<PermissionAction, number> = { VIEW: 1, CREATE: 2, EDIT: 3, ASSIGN: 3, APPROVE: 4, FULL: 5 };

export async function can(role: Role, module: string, minAction: PermissionAction): Promise<boolean> {
  const grants = await prisma.rolePermission.findMany({
    where: { role, permission: { module } },
    include: { permission: true },
  });
  return grants.some((g) => RANK[g.permission.action] >= RANK[minAction]);
}