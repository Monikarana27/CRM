"use client";

import { useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { updateMeetingStatusAction } from "@/actions/meetings/meeting.actions";

type MeetingRow = {
  id: string;
  type: string;
  status: string;
  scheduledAt: Date;
  notes: string | null;
  profile: { id: string; name: string; profileCode: string };
  assignedTo: { id: string; name: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MISSED: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
};

const TYPE_LABELS: Record<string, string> = {
  FACE_TO_FACE: "Face to Face",
  TELE: "Tele Meeting",
};

function StatusSelect({ meeting }: { meeting: MeetingRow }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(meeting.status);

  function handleChange(newStatus: string) {
    setValue(newStatus);
    startTransition(() => {
      updateMeetingStatusAction(
        meeting.id,
        newStatus as "SCHEDULED" | "COMPLETED" | "MISSED" | "CANCELLED"
      );
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-8 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
        <SelectItem value="COMPLETED">Completed</SelectItem>
        <SelectItem value="MISSED">Missed</SelectItem>
        <SelectItem value="CANCELLED">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function MeetingsTable({ meetings }: { meetings: MeetingRow[] }) {
  const columns: Column<MeetingRow>[] = [
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
      key: "type",
      header: "Type",
      render: (row) => (
        <Badge variant="outline">{TYPE_LABELS[row.type] ?? row.type}</Badge>
      ),
    },
    {
      key: "scheduledAt",
      header: "Scheduled At",
      sortable: true,
      accessor: (row) => new Date(row.scheduledAt).getTime(),
      render: (row) =>
        new Date(row.scheduledAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (row) => row.assignedTo?.name ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusSelect meeting={row} />,
    },
  ];

  return (
    <DataTable
      data={meetings}
      columns={columns}
      searchPlaceholder="Search by profile name..."
      emptyMessage="No meetings scheduled yet."
    />
  );
}