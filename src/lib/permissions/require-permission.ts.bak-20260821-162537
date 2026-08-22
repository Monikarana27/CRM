import "server-only";
import { auth } from "@/lib/auth/auth";
import { can } from "@/lib/permissions/can";
import type { Role, PermissionAction } from "@prisma/client";

export async function requirePermission(module: string, action: PermissionAction) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (!session.user.active) {
    throw new Error("Account is inactive");
  }
  const allowed = await can(session.user.role as Role, module, action);
  if (!allowed) {
    throw new Error(`Forbidden: missing ${action} permission on ${module}`);
  }
  return session;
}