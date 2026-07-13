import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { DashboardHero } from "@/components/layout/dashboard-hero";

export default async function LoginHistoryPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return <p>Unauthorized</p>;
  }

  const events = await prisma.loginEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, role: true } } },
  });

  return (
    <div className="space-y-6">
      <DashboardHero title="Login History" subtitle={`${events.length} recent logins`} />
      <div className="space-y-1">
        {events.map((e) => (
          <div key={e.id} className="flex justify-between border-b py-2 text-sm">
            <span>{e.user.name} ({e.user.role})</span>
            <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}