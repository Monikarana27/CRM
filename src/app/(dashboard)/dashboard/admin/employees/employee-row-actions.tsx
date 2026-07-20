"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  toggleEmployeeActiveAction,
  resetEmployeePasswordAction,
} from "@/actions/employees/employee.actions";
import { MoreHorizontal, Pencil, Power, PowerOff, KeyRound, Activity, Copy, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EmployeeRowActionsProps {
  employee: {
    id: string;
    name: string;
    active: boolean;
  };
}

export function EmployeeRowActions({ employee }: EmployeeRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isResetting, startResetTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      toggleEmployeeActiveAction(employee.id, !employee.active);
    });
  }

  function handleResetPassword() {
    startResetTransition(async () => {
      const result = await resetEmployeePasswordAction(employee.id);
      setTempPassword(result.password);
    });
  }

  function copyPassword() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function closeResetDialog() {
    setResetOpen(false);
    setTempPassword(null);
    setCopied(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/employees/${employee.id}/edit`}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/activity-logs?actor=${employee.id}`}>
              <Activity className="mr-2 h-3.5 w-3.5" />
              View Activity
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setResetOpen(true)}>
            <KeyRound className="mr-2 h-3.5 w-3.5" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setConfirmOpen(true)}
            className={employee.active ? "text-destructive" : "text-emerald-600"}
          >
            {employee.active ? (
              <PowerOff className="mr-2 h-3.5 w-3.5" />
            ) : (
              <Power className="mr-2 h-3.5 w-3.5" />
            )}
            {employee.active ? "Disable" : "Activate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={resetOpen} onOpenChange={(open) => (open ? setResetOpen(true) : closeResetDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {tempPassword
                ? `New password generated for ${employee.name}. Copy and share it securely — it won't be shown again.`
                : `Generate a new temporary password for ${employee.name}?`}
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
              <code className="flex-1 font-mono text-sm">{tempPassword}</code>
              <Button variant="outline" size="sm" onClick={copyPassword}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeResetDialog}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={isResetting}>
                {isResetting ? "Generating..." : "Generate New Password"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {employee.active ? "Disable this employee?" : "Re-activate this employee?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {employee.active
                ? `${employee.name} will no longer be able to log in. You can re-enable their account anytime.`
                : `${employee.name} will regain access to log in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={isPending}>
              {employee.active ? "Disable" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}