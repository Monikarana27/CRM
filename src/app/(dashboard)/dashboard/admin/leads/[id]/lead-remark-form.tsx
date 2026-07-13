"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { addLeadRemarkAction } from "@/actions/leads/lead-remark.actions";

const OUTCOMES = ["INTERESTED", "FOLLOW_UP", "NOT_INTERESTED", "DNP"];

export function LeadRemarkForm({ leadId }: { leadId: string }) {
  const [outcome, setOutcome] = useState("INTERESTED");
  const [remark, setRemark] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-end gap-3 rounded-lg border p-4">
      <div className="w-48 space-y-1">
        <label className="text-xs text-muted-foreground">Call Outcome</label>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <input
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        placeholder="Remark..."
        className="h-10 flex-1 rounded-md border border-input px-3 text-sm"
      />
      <Button
        disabled={isPending}
        onClick={() => startTransition(async () => {
          await addLeadRemarkAction(leadId, outcome as any, remark);
          setRemark("");
        })}
      >
        {isPending ? "Saving..." : "Add Remark"}
      </Button>
    </div>
  );
}