import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "SALES", "PROFILE_CREATOR", "SERVICE"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.active) redirect("/login?error=inactive");
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    redirect(`/dashboard/${session.user.role.toLowerCase()}`);
  }
  const shellRole = session.user.role === "SUPER_ADMIN" ? "ADMIN" : session.user.role;
  return <DashboardShell role={shellRole as any}>{children}</DashboardShell>;
}
