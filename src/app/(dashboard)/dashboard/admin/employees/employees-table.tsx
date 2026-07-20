"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmployeeRowActions } from "./employee-row-actions";
import { ViewAsButton } from "@/components/shared/view-as-button";

type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  _count: {
    assignedLeads: number;
    assignedProfiles: number;
  };
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 border-violet-200",
  SALES: "bg-blue-100 text-blue-700 border-blue-200",
  SERVICE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  SALES_EMP: "Sales",
  PROFILE_EMP: "Profile",
  SERVICE_EMP: "Service",
  HR_EMP: "HR",
};

export function EmployeesTable({ employees }: { employees: EmployeeRow[] }) {
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    if (departmentFilter === "ALL") return employees;
    return employees.filter((e) => e.department === departmentFilter);
  }, [employees, departmentFilter]);

  const columns: Column<EmployeeRow>[] = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "department",
      header: "Department",
      render: (row) => (row.department ? DEPARTMENT_LABELS[row.department] ?? row.department : "—"),
    },
    { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
    { key: "email", header: "Email", sortable: true },
    {
      key: "createdAt",
      header: "Joining Date",
      sortable: true,
      accessor: (row) => new Date(row.createdAt).getTime(),
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
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
      key: "assignedLeads",
      header: "Assigned Leads",
      accessor: (row) => row._count.assignedLeads,
      render: (row) => row._count.assignedLeads,
    },
    {
      key: "assignedProfiles",
      header: "Assigned Profiles",
      accessor: (row) => row._count.assignedProfiles,
      render: (row) => row._count.assignedProfiles,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <EmployeeRowActions employee={row} />
          <ViewAsButton userId={row.id} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by department:</span>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Departments</SelectItem>
            <SelectItem value="SALES_EMP">Sales</SelectItem>
            <SelectItem value="PROFILE_EMP">Profile</SelectItem>
            <SelectItem value="SERVICE_EMP">Service</SelectItem>
            <SelectItem value="HR_EMP">HR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search employees..."
        emptyMessage="No employees yet. Add your first team member."
      />
    </div>
  );
}
