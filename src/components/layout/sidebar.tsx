"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_CONFIG } from "@/config/navigation";
import type { Role } from "@/lib/permissions/roles";

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administration",
  SALES: "Sales Workspace",
  PROFILE_CREATOR: "Profile Creator",
  SERVICE: "Service Workspace",
  HR: "Human Resources",
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_CONFIG[role];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
      <div className="px-4 pb-2 pt-6">
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {ROLE_LABEL[role]}
        </p>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Phase 1 — Foundation
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            Core CRM modules launching soon
          </p>
        </div>
      </div>
    </aside>
  );
}