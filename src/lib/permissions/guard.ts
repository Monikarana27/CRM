import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { canAccessRoute, type Role } from "@/lib/permissions/roles";

/**
 * Server Component guard. Call at the top of a dashboard layout/page.
 * Throws a redirect if the user is unauthenticated or lacks role access.
 */
export async function requireRole(path: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  if (!session.user.active) {
    redirect("/login?error=inactive");
  }

  if (!canAccessRoute(role, path)) {
    redirect(`/dashboard/${role.toLowerCase()}`);
  }

  return session;
}