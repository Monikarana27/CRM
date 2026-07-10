"use client";

import { endImpersonationAction } from "@/actions/auth/impersonation.actions";
import { useTransition } from "react";

export function ImpersonationBanner({ originalUserName }: { originalUserName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between bg-destructive px-6 py-2 text-sm font-medium text-destructive-foreground">
      <span>Viewing as this employee — signed in as {originalUserName}</span>
      <button
        onClick={() => startTransition(() => endImpersonationAction())}
        disabled={isPending}
        className="rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
      >
        {isPending ? "Returning..." : "Return to Admin Account"}
      </button>
    </div>
  );
}