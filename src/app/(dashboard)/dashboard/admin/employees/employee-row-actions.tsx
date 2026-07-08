"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleEmployeeActiveAction } from "@/actions/employees/employee.actions";
import { Pencil, Power, PowerOff } from "lucide-react";

interface EmployeeRowActionsProps {
  employee: {
    id: string;
    active: boolean;
  };
}

export function EmployeeRowActions({ employee }: EmployeeRowActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      toggleEmployeeActiveAction(employee.id, !employee.active);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/admin/employees/${employee.id}/edit`}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleToggle}
        className={
          employee.active
            ? "text-destructive hover:bg-destructive/10"
            : "text-emerald-600 hover:bg-emerald-50"
        }
      >
        {employee.active ? (
          <PowerOff className="h-3.5 w-3.5" />
        ) : (
          <Power className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}