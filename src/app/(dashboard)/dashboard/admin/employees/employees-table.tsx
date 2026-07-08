"use client";

import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { EmployeeRowActions } from "./employee-row-actions";

type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 border-violet-200",
  SALES: "bg-blue-100 text-blue-700 border-blue-200",
  SERVICE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function EmployeesTable({ employees }: { employees: EmployeeRow[] }) {
  const columns: Column<EmployeeRow>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className={ROLE_STYLES[row.role] ?? ""}>
          {row.role}
        </Badge>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (row) => (
        <Badge
          variant="outline"
          className={
            row.active
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-red-100 text-red-700 border-red-200"
          }
        >
          {row.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined On",
      sortable: true,
      accessor: (row) => new Date(row.createdAt).getTime(),
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => <EmployeeRowActions employee={row} />,
    },
  ];

  return (
    <DataTable
      data={employees}
      columns={columns}
      searchPlaceholder="Search employees..."
      emptyMessage="No employees yet. Add your first team member."
    />
  );
}