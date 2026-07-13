"use client";

import Link from "next/link";
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
import { updateSubscriptionStatusAction } from "@/actions/subscriptions/subscription.actions";

type SubscriptionRow = {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  profile: { id: string; name: string; profileCode: string };
  plan: { id: string; name: string; price: number };
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  HOLD: "bg-orange-100 text-orange-700 border-orange-200",
  EXPIRED: "bg-red-100 text-red-700 border-red-200",
};

function StatusSelect({ subscription }: { subscription: SubscriptionRow }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(subscription.status);

  function handleChange(newStatus: string) {
    setValue(newStatus);
    startTransition(() => {
      updateSubscriptionStatusAction(subscription.id, newStatus as "ACTIVE" | "HOLD" | "EXPIRED");
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-8 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="HOLD">Hold</SelectItem>
        <SelectItem value="EXPIRED">Expired</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function SubscriptionsTable({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const columns: Column<SubscriptionRow>[] = [
    {
      key: "profile",
      header: "Profile",
      render: (row) => (
        <Link
          href={`/dashboard/admin/profiles/${row.profile.id}/edit`}
          className="font-medium text-primary hover:underline"
        >
          {row.profile.name}{" "}
          <span className="text-xs text-muted-foreground">
            ({row.profile.profileCode})
          </span>
        </Link>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (row) => (
        <span>
          {row.plan.name}{" "}
          <span className="text-xs text-muted-foreground tabular-nums">
            (₹{row.plan.price.toLocaleString("en-IN")})
          </span>
        </span>
      ),
    },
    {
      key: "startDate",
      header: "Start Date",
      sortable: true,
      accessor: (row) => new Date(row.startDate).getTime(),
      render: (row) => new Date(row.startDate).toLocaleDateString("en-IN"),
    },
    {
      key: "endDate",
      header: "End Date",
      sortable: true,
      accessor: (row) => (row.endDate ? new Date(row.endDate).getTime() : 0),
      render: (row) =>
        row.endDate ? new Date(row.endDate).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusSelect subscription={row} />,
    },
  ];

  return (
    <DataTable
      data={subscriptions}
      columns={columns}
      searchPlaceholder="Search by profile name..."
      emptyMessage="No subscriptions in this view."
    />
  );
}
