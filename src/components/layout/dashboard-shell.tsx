import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { Role } from "@/lib/permissions/roles";

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}