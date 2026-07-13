export const ROLES = ["SUPER_ADMIN", "ADMIN", "SALES", "PROFILE_CREATOR", "SERVICE", "HR"] as const;
export type Role = (typeof ROLES)[number];

export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/dashboard/admin": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/sales": ["SUPER_ADMIN", "ADMIN", "SALES"],
  "/dashboard/service": ["SUPER_ADMIN", "ADMIN", "SERVICE"],
};

export function canAccessRoute(role: Role, path: string): boolean {
  const matchedKey = Object.keys(ROUTE_ACCESS).find((route) =>
    path.startsWith(route)
  );
  if (!matchedKey) return true;
  return ROUTE_ACCESS[matchedKey].includes(role);
}
