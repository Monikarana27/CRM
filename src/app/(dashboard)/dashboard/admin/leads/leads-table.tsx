"use client";

import Link from "next/link";
import { useTransition } from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignAction } from "@/components/shared/assign-action";
import {
  assignLeadAction,
  unassignLeadAction,
  convertLeadToProfileAction,
} from "@/actions/leads/lead.actions";
import { sendToProfileCreationAction } from "@/actions/profile-queue/profile-queue.actions";
import { ArrowRightCircle, Pencil } from "lucide-react";
type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  status: string;
  createdAt: Date;
  assignedTo: { id: string; name: string } | null;
  convertedProfileId: string | null;
};

type Employee = { id: string; name: string };

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-100 text-amber-700 border-amber-200",
  CONVERTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

function ConvertButton({ leadId, disabled }: { leadId: string; disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || isPending}
      onClick={() => startTransition(() => sendToProfileCreationAction(leadId))}
    >
      <ArrowRightCircle className="mr-1.5 h-3.5 w-3.5" />
      {disabled ? "Sent to Queue" : isPending ? "Converting..." : "Send to Profile Creation"}
    </Button>
  );
}

export function LeadsTable({
  leads,
  employees,
}: {
  leads: LeadRow[];
  employees: Employee[];
}) {
  async function handleAssign(leadId: string, employeeId: string) {
    await assignLeadAction(leadId, employeeId);
  }

  async function handleUnassign(leadId: string) {
  await unassignLeadAction(leadId);
}

  const columns: Column<LeadRow>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "phone", header: "Phone" },
    { key: "source", header: "Source" },
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
        <AssignAction
          entityId={row.id}
          currentAssignee={row.assignedTo}
          employees={employees}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/leads/${row.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <ConvertButton leadId={row.id} disabled={!!row.convertedProfileId} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={leads}
      columns={columns}
      searchPlaceholder="Search leads by name or phone..."
      emptyMessage="No leads yet. Add your first inquiry."
    />
  );
}
