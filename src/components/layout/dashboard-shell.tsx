import { auth } from "@/lib/auth/auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import type { Role } from "@/lib/permissions/roles";

export async function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      {session?.user?.impersonating && session.user.originalUserName && (
        <ImpersonationBanner originalUserName={session.user.originalUserName} />
      )}
      <div className="flex flex-1">
        <Sidebar role={role} />
        <div className="flex flex-1 flex-col min-w-0">
          <Header role={role} />
          <main className="flex-1 bg-muted/30 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

