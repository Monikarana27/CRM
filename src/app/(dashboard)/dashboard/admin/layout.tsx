import { requireRole } from "@/lib/permissions/guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("/dashboard/admin");
  return <DashboardShell role="ADMIN">{children}</DashboardShell>;
}