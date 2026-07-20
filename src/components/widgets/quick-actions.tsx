import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, UserRoundPlus, Users, CalendarPlus } from "lucide-react";

const actions = [
  {
    label: "Add Employee",
    href: "/dashboard/admin/employees/new",
    icon: UserPlus,
    colorClass: "text-violet-600 bg-violet-50 border-violet-200",
  },
  {
    label: "Create Lead",
    href: "/dashboard/admin/leads/new",
    icon: UserRoundPlus,
    colorClass: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    label: "Assign Leads",
    href: "/dashboard/admin/leads/assign",
    icon: Users,
    colorClass: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    label: "Schedule Meeting",
    href: "/dashboard/admin/meetings/new",
    icon: CalendarPlus,
    colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 pt-2">
        {actions.map(({ label, href, icon: Icon, colorClass }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center text-sm font-medium transition-colors hover:bg-accent/10"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
