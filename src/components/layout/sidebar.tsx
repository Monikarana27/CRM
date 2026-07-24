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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-4 pb-2 pt-6">
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          {ROLE_LABEL[role]}
        </p>
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
          <p className="text-xs font-medium text-sidebar-foreground/70">
            Phase 1 - Foundation
          </p>
          <p className="mt-0.5 text-xs text-sidebar-foreground/40">
            Core CRM modules launching soon
          </p>
        </div>
      </div>
    </aside>
  );
}
