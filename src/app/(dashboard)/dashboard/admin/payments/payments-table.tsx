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
import { updatePaymentStatusAction } from "@/actions/payments/payment.actions";

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId: string | null;
  createdAt: Date;
  subscription: {
    profile: { id: string; name: string; profileCode: string };
    plan: { id: string; name: string };
  };
};

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
};

function StatusSelect({ payment }: { payment: PaymentRow }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(payment.status);

  function handleChange(newStatus: string) {
    setValue(newStatus);
    startTransition(() => {
      updatePaymentStatusAction(payment.id, newStatus as "PAID" | "PENDING" | "FAILED");
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-8 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PAID">Paid</SelectItem>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="FAILED">Failed</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  const columns: Column<PaymentRow>[] = [
    {
      key: "profile",
      header: "Profile",
      render: (row) => (
        <span className="font-medium">
          {row.subscription.profile.name}{" "}
          <span className="text-xs text-muted-foreground">
            ({row.subscription.profile.profileCode})
          </span>
        </span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (row) => row.subscription.plan.name,
    },
    {
  key: "amount",
  header: "Amount",
  sortable: true,
  render: (row) => (
    <span className="tabular-nums font-medium">
      {row.currency === "USD" ? "$" : "₹"}
      {row.amount.toLocaleString("en-IN")}
    </span>
  ),
},
    {
      key: "method",
      header: "Method",
      render: (row) => (
        <Badge variant="outline">{row.method.replace("_", " ")}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusSelect payment={row} />,
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      accessor: (row) => new Date(row.createdAt).getTime(),
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
  ];

  return (
    <DataTable
      data={payments}
      columns={columns}
      searchPlaceholder="Search by profile name..."
      emptyMessage="No payments recorded yet."
    />
  );
}
