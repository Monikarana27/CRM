"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
type Employee = { id: string; name: string };

interface ScheduleMeetingFormProps {
  profiles: Profile[];
  employees: Employee[];
  action: (prevState: unknown, formData: FormData) => Promise<{ error: string | null }>;
}

export function ScheduleMeetingForm({ profiles, employees, action }: ScheduleMeetingFormProps) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  const [profileId, setProfileId] = useState("");
  const [profileTwoId, setProfileTwoId] = useState("");
  const [type, setType] = useState("TELE");
  const [assignedToId, setAssignedToId] = useState("");

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Profile One</Label>
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
              <Label>Profile Two (match)</Label>
              <Select value={profileTwoId} onValueChange={setProfileTwoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the matching profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter((p) => p.id !== profileId)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.profileCode})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="profileTwoId" value={profileTwoId} />
            </div>

            <div className="space-y-2">
              <Label>Meeting Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TELE">Tele Meeting</SelectItem>
                  <SelectItem value="FACE_TO_FACE">Face to Face</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="type" value={type} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Assign To (optional)</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="assignedToId" value={assignedToId} />
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

          <input type="hidden" name="status" value="SCHEDULED" />

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending || !profileId || !profileTwoId}>
              {isPending ? "Scheduling..." : "Schedule Meeting"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/meetings">
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