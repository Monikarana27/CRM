// src/config/navigation.ts
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Contact,
  ClipboardList,
  HeartHandshake,
  CreditCard,
  Settings,
  Handshake,
  CalendarClock,
  Activity,
  PhoneCall,
  Target,
} from "lucide-react";
import type { Role } from "@/lib/permissions/roles";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_CONFIG: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Employees", href: "/dashboard/admin/employees", icon: Users },
    { label: "Profiles", href: "/dashboard/admin/profiles", icon: UserSquare2 },
    { label: "Leads", href: "/dashboard/admin/leads", icon: Contact },
    { label: "Approvals", href: "/dashboard/admin/profile-approvals", icon: ClipboardList },
  { label: "Service Overview", href: "/dashboard/admin/service-overview", icon: HeartHandshake },
    { label: "Employees & Roles", href: "/dashboard/admin/employees", icon: Users },
    { label: "Expiring Soon", href: "/dashboard/admin/subscriptions/expiring", icon: CalendarClock },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Employees", href: "/dashboard/admin/employees", icon: Users },
    { label: "Profiles", href: "/dashboard/admin/profiles", icon: UserSquare2 },
    { label: "Leads", href: "/dashboard/admin/leads", icon: Contact },
    { label: "Sales Targets", href: "/dashboard/admin/sales-targets", icon: Target },
    { label: "Assignments", href: "/dashboard/admin/assignments", icon: ClipboardList },
    { label: "Plans", href: "/dashboard/admin/plans", icon: HeartHandshake },
    { label: "Subscriptions", href: "/dashboard/admin/subscriptions", icon: HeartHandshake },
    { label: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    { label: "Meetings", href: "/dashboard/admin/meetings", icon: CalendarClock },
    { label: "Activity Logs", href: "/dashboard/admin/activity-logs", icon: Activity },
    { label: "Welcome Calls", href: "/dashboard/admin/welcome-calls", icon: PhoneCall },
      { label: "Service Overview", href: "/dashboard/admin/service-overview", icon: HeartHandshake },
      { label: "Approvals", href: "/dashboard/admin/profile-approvals", icon: ClipboardList },
      { label: "Expiring Soon", href: "/dashboard/admin/subscriptions/expiring", icon: CalendarClock },
  ],
  SALES: [
    { label: "Dashboard", href: "/dashboard/sales", icon: LayoutDashboard },
    { label: "My Leads", href: "/dashboard/sales/leads", icon: Handshake },
    { label: "My Profiles", href: "/dashboard/sales/profiles", icon: UserSquare2 },
    { label: "Follow-ups", href: "/dashboard/sales/follow-ups", icon: CalendarClock },
  ],
  PROFILE_CREATOR: [
    { label: "Dashboard", href: "/dashboard/profile-creator", icon: LayoutDashboard },
  ],
  SERVICE: [
    { label: "Dashboard", href: "/dashboard/service", icon: LayoutDashboard },
    { label: "Assigned Profiles", href: "/dashboard/service/profiles", icon: UserSquare2 },
    { label: "Meetings", href: "/dashboard/service/meetings", icon: CalendarClock },
    { label: "Service Status", href: "/dashboard/service/status", icon: Activity },
  ],
  HR: [
  { label: "Dashboard", href: "/dashboard/hr", icon: LayoutDashboard },
  { label: "Attendance", href: "/dashboard/hr/attendance", icon: CalendarClock },
  { label: "Leave", href: "/dashboard/hr/leave", icon: ClipboardList },
  { label: "Recruitment", href: "/dashboard/hr/recruitment", icon: Users },
  { label: "Performance", href: "/dashboard/hr/performance", icon: Activity },
  { label: "Payroll", href: "/dashboard/hr/payroll", icon: CreditCard },
],
};
