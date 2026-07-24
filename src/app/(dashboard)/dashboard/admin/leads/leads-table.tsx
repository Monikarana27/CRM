"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { LeadAssignmentHistoryDialog } from "./lead-assignment-history-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AssignAction } from "@/components/shared/assign-action";
import {
  assignLeadAction,
  unassignLeadAction,
  bulkAssignLeadsAction,
} from "@/actions/leads/lead.actions";
import { sendToProfileCreationAction } from "@/actions/profile-queue/profile-queue.actions";
import { MoreHorizontal, ArrowRightCircle, Pencil, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  status: string;
  followUpDate: Date | null;
  createdAt: Date;
  assignedTo: { id: string; name: string } | null;
  convertedProfileId: string | null;
  profileQueue: { id: string; status: string } | null;
};

type Employee = { id: string; name: string };

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-100 text-amber-700 border-amber-200",
  CONVERTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
  INTERESTED: "bg-green-100 text-green-700 border-green-200",
  NOT_INTERESTED: "bg-red-100 text-red-700 border-red-200",
};

function LeadRowActions({ lead }: { lead: LeadRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  function handleSendToProfile() {
    startTransition(async () => {
      const result = await sendToProfileCreationAction(lead.id);
      setError(result?.error ?? null);
    });
  }

  if (lead.profileQueue) {
    return (
      <div className="flex justify-end">
        <Badge variant="outline" className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {lead.profileQueue.status === "COMPLETED" ? "Profile Created" : "In Profile Queue"}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/leads/${lead.id}/edit`}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setHistoryOpen(true)}>
            <History className="mr-2 h-3.5 w-3.5" />
            View Assignment History
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSendToProfile} disabled={isPending}>
            <ArrowRightCircle className="mr-2 h-3.5 w-3.5" />
            {isPending ? "Sending..." : "Send to Profile Creation"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <span className="text-xs text-destructive">{error}</span>}
      <LeadAssignmentHistoryDialog
        leadId={lead.id}
        leadName={lead.name}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
}
export function LeadsTable({
  leads,
  employees,
  canAssign = true,
}: {
  leads: LeadRow[];
  employees: Employee[];
  canAssign?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [assignedFilter, setAssignedFilter] = useState("ALL");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEmployeeId, setBulkEmployeeId] = useState("");
  const [isBulkAssigning, startBulkAssign] = useTransition();

  const sourceOptions = useMemo(
    () => Array.from(new Set(leads.map((l) => l.source).filter(Boolean))) as string[],
    [leads]
  );

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
      if (sourceFilter !== "ALL" && l.source !== sourceFilter) return false;
      if (canAssign) {
        if (assignedFilter === "UNASSIGNED_ONLY" && l.assignedTo) return false;
        if (assignedFilter !== "ALL" && assignedFilter !== "UNASSIGNED_ONLY" && l.assignedTo?.id !== assignedFilter)
          return false;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, assignedFilter, canAssign]);

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkAssign() {
    if (selected.size === 0 || !bulkEmployeeId) return;
    startBulkAssign(async () => {
      await bulkAssignLeadsAction(Array.from(selected), bulkEmployeeId);
      setSelected(new Set());
      setBulkEmployeeId("");
    });
  }

  async function handleAssign(leadId: string, employeeId: string) {
    await assignLeadAction(leadId, employeeId);
  }

  async function handleUnassign(leadId: string) {
    await unassignLeadAction(leadId);
  }

  const columns: Column<LeadRow>[] = [
    ...(canAssign
      ? [
          {
            key: "select",
            header: (
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-input" />
            ),
            render: (row: LeadRow) => (
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggleOne(row.id)}
                className="h-4 w-4 rounded border-input"
              />
            ),
          } as Column<LeadRow>,
        ]
      : []),
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => (
        <Link href={`/dashboard/admin/leads/${row.id}`} className="font-medium text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
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
      key: "followUpDate",
      header: "Follow-up",
      sortable: true,
      accessor: (row) => (row.followUpDate ? new Date(row.followUpDate).getTime() : 0),
      render: (row) => (row.followUpDate ? new Date(row.followUpDate).toLocaleDateString("en-IN") : "—"),
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
      render: (row) =>
        canAssign ? (
          <AssignAction
            entityId={row.id}
            currentAssignee={row.assignedTo}
            employees={employees}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
          />
        ) : (
          <span className="text-sm text-muted-foreground">{row.assignedTo?.name ?? "—"}</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => <LeadRowActions lead={row} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="INTERESTED">Interested</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
            <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sources</SelectItem>
            {sourceOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canAssign && (
          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Assigned Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Employees</SelectItem>
              <SelectItem value="UNASSIGNED_ONLY">Unassigned</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {canAssign && (
        <div className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
          <span className="text-sm font-medium text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected` : "Select rows below to bulk assign"}
          </span>
          <Select value={bulkEmployeeId} onValueChange={setBulkEmployeeId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Assign to employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkAssign} disabled={selected.size === 0 || !bulkEmployeeId || isBulkAssigning}>
            {isBulkAssigning ? "Assigning..." : "Bulk Assign"}
          </Button>
          {selected.size > 0 && (
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          )}
        </div>
      )}

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search leads by name or phone..."
        emptyMessage="No leads yet. Add your first inquiry."
      />
    </div>
  );
}