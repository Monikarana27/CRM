export const ROLES = ["SUPER_ADMIN", "ADMIN", "SALES", "SALES_TL", "SALES_MANAGER", "PROFILE_CREATOR", "SERVICE", "SERVICE_TL", "SERVICE_MANAGER", "HR"] as const;
export type Role = (typeof ROLES)[number];

export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/dashboard/admin/leads": ["SUPER_ADMIN", "ADMIN", "SALES", "SALES_TL", "SALES_MANAGER"],
  "/dashboard/admin/profiles": ["SUPER_ADMIN", "ADMIN", "SALES", "SALES_TL", "SALES_MANAGER", "SERVICE", "SERVICE_TL", "SERVICE_MANAGER"],
  "/dashboard/admin/meetings": ["SUPER_ADMIN", "ADMIN", "SALES", "SALES_TL", "SALES_MANAGER", "SERVICE", "SERVICE_TL", "SERVICE_MANAGER"],
  "/dashboard/admin": ["SUPER_ADMIN", "ADMIN"],
  "/dashboard/sales": ["SUPER_ADMIN", "ADMIN", "SALES", "SALES_TL", "SALES_MANAGER"],
  "/dashboard/service": ["SUPER_ADMIN", "ADMIN", "SERVICE", "SERVICE_TL", "SERVICE_MANAGER"],
  "/dashboard/profile-creator": ["SUPER_ADMIN", "ADMIN", "PROFILE_CREATOR"],
  "/dashboard/hr": ["SUPER_ADMIN", "HR"],
  "/dashboard/workspace": ["SUPER_ADMIN", "ADMIN", "SALES", "SALES_TL", "SALES_MANAGER", "SERVICE", "SERVICE_TL", "SERVICE_MANAGER", "PROFILE_CREATOR", "HR"],
  "/dashboard/welcome-calls": ["SUPER_ADMIN", "ADMIN", "SALES", "SALES_TL", "SALES_MANAGER", "SERVICE", "SERVICE_TL", "SERVICE_MANAGER"],
  "/dashboard/discounts": ["SUPER_ADMIN", "ADMIN", "SALES", "SALES_TL", "SALES_MANAGER", "SERVICE", "SERVICE_TL", "SERVICE_MANAGER"],
};

export function canAccessRoute(role: Role, path: string): boolean {
  const sortedKeys = Object.keys(ROUTE_ACCESS).sort((a, b) => b.length - a.length);
  const matchedKey = sortedKeys.find((route) => path.startsWith(route));
  if (!matchedKey) return false;
  return ROUTE_ACCESS[matchedKey].includes(role);
}