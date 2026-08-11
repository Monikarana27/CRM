import { auth } from "@/lib/auth/auth";
import { StatWidget } from "@/components/widgets/stat-widget";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { getServiceStats, getTeamServiceStats } from "@/lib/stats/dashboard-stats";
import { getTeamSalesTargetsForMonth } from "@/actions/sales-targets/sales-target.actions";
import { getTeamMemberIds } from "@/lib/hierarchy/team";
import { SalesTargetsGrid } from "@/components/shared/sales-targets-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, PhoneCall, Users } from "lucide-react";

const SERVICE_TEAM_ROLES = ["SERVICE_TL", "SERVICE_MANAGER"];

export default async function ServiceDashboardPage() {
  const session = await auth();
  const stats = await getServiceStats(session!.user.id);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const quickActions = [
    { label: "Assigned Profiles", href: "/dashboard/service/profiles", color: "bg-blue-500" },
    { label: "Meetings", href: "/dashboard/admin/meetings", color:"bg-cyan-500" },
    { label: "Welcome Calls", href: "/dashboard/service/welcome-calls", color: "bg-emerald-500" },
    { label: "Service Status", href: "/dashboard/admin/subscriptions", color: "bg-amber-500" },
  ];

  const isTeamRole = SERVICE_TEAM_ROLES.includes(session!.user.role);
  let teamIds: string[] = [];
  let teamStats: Awaited<ReturnType<typeof getTeamServiceStats>> | null = null;
  let teamTargets: Awaited<ReturnType<typeof getTeamSalesTargetsForMonth>> = [];

  if (isTeamRole) {
    teamIds = await getTeamMemberIds(session!.user.id);
    teamStats = await getTeamServiceStats(teamIds);
    teamTargets = await getTeamSalesTargetsForMonth(currentMonth, currentYear);
  }

  return (
    <div className="space-y-6">
      <DashboardHero
        title={`Welcome back, ${session?.user?.name}`}
        subtitle="Here's your service activity for today."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Assigned Profiles"
          lines={[{ label: "Assigned to Me", value: stats.assignedProfiles }]}
          actionLabel="View Profiles"
          actionHref="/dashboard/service/profiles"
        />
        <StatWidget
          title="Meetings Today"
          lines={[{ label: "Scheduled Today", value: stats.meetingsToday }]}
          actionLabel="View Meetings"
          actionHref="/dashboard/admin/meetings"
        />
        <StatWidget
          title="Active Subscriptions"
          lines={[{ label: "Active", value: stats.activeServiceCount }]}
          actionLabel="View Subscriptions"
          actionHref="/dashboard/admin/subscriptions"
        />
        <StatWidget
          title="Needs Attention"
          lines={[
            { label: "On Hold", value: stats.onHoldProfiles },
            { label: "Expired", value: stats.expiredServiceCount },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="My Leads"
          lines={[{ label: "Total", value: stats.myLeads }]}
          actionLabel="View Leads"
          actionHref="/dashboard/admin/leads"
        />
        <StatWidget
          title="New Leads"
          lines={[{ label: "New", value: stats.leads.newLeads }]}
        />
        <StatWidget
          title="Converted Leads"
          lines={[{ label: "Converted", value: stats.leads.convertedLeads }]}
        />
        <StatWidget
          title="Pending Follow-ups"
          lines={[{ label: "Pending", value: stats.leads.pendingLeads }]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.upcomingMeetings.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No upcoming meetings scheduled.
              </p>
            ) : (
              stats.upcomingMeetings.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{m.profile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(m.scheduledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">{m.type.replace("_", " ")}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PhoneCall className="h-4 w-4 text-emerald-600" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{stats.todaysActivityCount}</p>
            <p className="text-sm text-muted-foreground">actions logged today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className={`${action.color} flex h-11 items-center justify-center rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90`}
          >
            {action.label}
          </a>
        ))}
      </div>

      {isTeamRole && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">My Team</h2>
          </div>

          {teamIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don't have any team members assigned yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatWidget
                  title="Team Assigned Profiles"
                  lines={[{ label: "Assigned to Team", value: teamStats!.assignedProfiles }]}
                />
                <StatWidget
                  title="Team Meetings Today"
                  lines={[{ label: "Scheduled Today", value: teamStats!.meetingsToday }]}
                />
                <StatWidget
                  title="Team Active Subscriptions"
                  lines={[{ label: "Active", value: teamStats!.activeServiceCount }]}
                />
                <StatWidget
                  title="Team Needs Attention"
                  lines={[
                    { label: "On Hold", value: teamStats!.onHoldProfiles },
                    { label: "Expired", value: teamStats!.expiredServiceCount },
                  ]}
                />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Team Targets {monthLabel}
                </h3>
                <SalesTargetsGrid
                  targets={teamTargets}
                  selectedMonth={currentMonth}
                  selectedYear={currentYear}
                  isImpersonating={false}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}