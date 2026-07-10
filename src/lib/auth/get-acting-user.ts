import { auth } from "@/lib/auth/auth";

/**
 * Returns the ID that should be recorded as the actor in ActivityLog.
 * If currently impersonating, returns the REAL admin's ID, not the
 * impersonated user's ID — so audit trails stay accurate.
 */
export async function getActingUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.impersonating && session.user.originalUserId
    ? session.user.originalUserId
    : session.user.id;
}