export const ROLES = ["ADMIN", "SALES", "SERVICE"] as const;
export type Role = (typeof ROLES)[number];

export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/dashboard/admin": ["ADMIN"],
  "/dashboard/sales": ["ADMIN", "SALES"],
  "/dashboard/service": ["ADMIN", "SERVICE"],
};

export function canAccessRoute(role: Role, path: string): boolean {
  const matchedKey = Object.keys(ROUTE_ACCESS).find((route) =>
    path.startsWith(route)
  );
  if (!matchedKey) return true; // unguarded route
  return ROUTE_ACCESS[matchedKey].includes(role);
}