"use client";

import { useActionState, useState, useMemo } from "react";
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
type Plan = { id: string; name: string; price: number; durationDays: number };

interface AttachSubscriptionFormProps {
  profiles: Profile[];
  plans: Plan[];
  action: (prevState: unknown, formData: FormData) => Promise<{ error: string | null }>;
}

export function AttachSubscriptionForm({ profiles, plans, action }: AttachSubscriptionFormProps) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  const [profileId, setProfileId] = useState("");
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const selectedPlan = useMemo(() => plans.find((p) => p.id === planId), [planId, plans]);

  const calculatedEndDate = useMemo(() => {
    if (!selectedPlan || !startDate) return null;
    const end = new Date(startDate);
    end.setDate(end.getDate() + selectedPlan.durationDays);
    return end.toLocaleDateString("en-IN");
  }, [selectedPlan, startDate]);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
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
              <Label>Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — ₹{p.price.toLocaleString("en-IN")} ({p.durationDays} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="planId" value={planId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {calculatedEndDate && (
              <div className="space-y-2">
                <Label>Calculated End Date</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                  {calculatedEndDate}
                </div>
              </div>
            )}
          </div>

          <input type="hidden" name="status" value="ACTIVE" />

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending || !profileId || !planId}>
              {isPending ? "Attaching..." : "Attach Service"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/services">
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
