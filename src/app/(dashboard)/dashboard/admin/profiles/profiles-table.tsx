"use client";

import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProfileAssignAction } from "./profile-assign-action";

type ProfileRow = {
  id: string;
  profileCode: string;
  name: string;
  gender: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  status: string;
  createdAt: Date;
  assignedTo: { id: string; name: string } | null;
};

type Employee = { id: string; name: string };

const STATUS_STYLES: Record<string, string> = {
  UNASSIGNED: "bg-amber-100 text-amber-700 border-amber-200",
  ASSIGNED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
  ON_HOLD: "bg-orange-100 text-orange-700 border-orange-200",
  EXPIRED: "bg-red-100 text-red-700 border-red-200",
};

export function ProfilesTable({
  profiles,
  employees,
}: {
  profiles: ProfileRow[];
  employees: Employee[];
}) {
  const columns: Column<ProfileRow>[] = [
    {
      key: "profileCode",
      header: "ID",
      sortable: true,
      render: (row) => (
        <Link
          href={`/dashboard/admin/profiles/${row.id}/edit`}
          className="font-medium text-primary hover:underline"
        >
          {row.profileCode}
        </Link>
      ),
    },
    { key: "name", header: "Name", sortable: true },
    {
      key: "gender",
      header: "Gender",
      render: (row) => (
        <span className="text-muted-foreground">{row.gender}</span>
      ),
    },
    { key: "phone", header: "Phone" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant="outline" className={STATUS_STYLES[row.status] ?? ""}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created On",
      sortable: true,
      accessor: (row) => new Date(row.createdAt).getTime(),
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "assign",
      header: "Assigned To",
      render: (row) => (
        <ProfileAssignAction
          profileId={row.id}
          currentAssignee={row.assignedTo}
          employees={employees}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={profiles}
      columns={columns}
      searchPlaceholder="Search by name, ID, or phone..."
      emptyMessage="No profiles found in this view."
    />
  );
}