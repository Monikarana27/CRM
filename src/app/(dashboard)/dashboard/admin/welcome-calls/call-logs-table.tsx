"use client";

import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";

type CallLogRow = {
  id: string;
  outcome: string;
  notes: string | null;
  calledAt: Date;
  profile: { id: string; name: string; profileCode: string };
};

const OUTCOME_STYLES: Record<string, string> = {
  CONNECTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NOT_ANSWERED: "bg-amber-100 text-amber-700 border-amber-200",
  BUSY: "bg-orange-100 text-orange-700 border-orange-200",
  INVALID_NUMBER: "bg-red-100 text-red-700 border-red-200",
  FOLLOW_UP_NEEDED: "bg-blue-100 text-blue-700 border-blue-200",
};

export function CallLogsTable({ callLogs }: { callLogs: CallLogRow[] }) {
  const columns: Column<CallLogRow>[] = [
    {
      key: "profile",
      header: "Profile",
      render: (row) => (
        <span className="font-medium">
          {row.profile.name}{" "}
          <span className="text-xs text-muted-foreground">
            ({row.profile.profileCode})
          </span>
        </span>
      ),
    },
    {
      key: "outcome",
      header: "Outcome",
      render: (row) => (
        <Badge variant="outline" className={OUTCOME_STYLES[row.outcome] ?? ""}>
          {row.outcome.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "calledAt",
      header: "Called At",
      sortable: true,
      accessor: (row) => new Date(row.calledAt).getTime(),
      render: (row) =>
        new Date(row.calledAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      key: "notes",
      header: "Notes",
      render: (row) => (
        <span className="max-w-xs truncate text-sm text-muted-foreground">
          {row.notes ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={callLogs}
      columns={columns}
      searchPlaceholder="Search by profile name..."
      emptyMessage="No calls logged yet."
    />
  );
}