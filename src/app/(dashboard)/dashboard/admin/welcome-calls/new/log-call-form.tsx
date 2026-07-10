"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

type Profile = { id: string; name: string; profileCode: string };

const OUTCOME_OPTIONS = [
  "CONNECTED",
  "NOT_ANSWERED",
  "BUSY",
  "INVALID_NUMBER",
  "FOLLOW_UP_NEEDED",
];

interface LogCallFormProps {
  profiles: Profile[];
  action: (prevState: unknown, formData: FormData) => Promise<{ error: string | null }>;
}

export function LogCallForm({ profiles, action }: LogCallFormProps) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  const [profileId, setProfileId] = useState("");
  const [outcome, setOutcome] = useState("CONNECTED");

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Profile</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.profileCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="profileId" value={profileId} />
            </div>

            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="outcome" value={outcome} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending || !profileId}>
              {isPending ? "Logging..." : "Log Call"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/welcome-calls">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}