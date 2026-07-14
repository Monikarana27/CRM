export const ROLES = ["SUPER_ADMIN", "ADMIN", "SALES", "PROFILE_CREATOR", "SERVICE", "HR"] as const;
export type Role = (typeof ROLES)[number];

export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/dashboard/admin/leads": ["SUPER_ADMIN", "ADMIN", "SALES"],
  "/dashboard/admin/profiles": ["SUPER_ADMIN", "ADMIN", "SALES", "SERVICE"],
  "/dashboard/admin/meetings": ["SUPER_ADMIN", "ADMIN", "SALES", "SERVICE"],
  "/dashboard/admin": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/sales": ["SUPER_ADMIN", "ADMIN", "SALES"],
  "/dashboard/service": ["SUPER_ADMIN", "ADMIN", "SERVICE"],
  "/dashboard/profile-creator": ["SUPER_ADMIN", "ADMIN", "PROFILE_CREATOR"],
  "/dashboard/hr": ["SUPER_ADMIN", "HR"],
};

export function canAccessRoute(role: Role, path: string): boolean {
  const sortedKeys = Object.keys(ROUTE_ACCESS).sort((a, b) => b.length - a.length);
  const matchedKey = sortedKeys.find((route) => path.startsWith(route));
  if (!matchedKey) return true;
  return ROUTE_ACCESS[matchedKey].includes(role);
}
