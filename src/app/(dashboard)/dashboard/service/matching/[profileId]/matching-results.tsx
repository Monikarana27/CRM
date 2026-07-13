"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendMatchedProfilesAction } from "@/actions/profiles/send-matches.action";

type Match = { id: string; name: string; profileCode: string; city: string | null; religion: string | null };

export function MatchingResults({ matches, clientEmail }: { matches: Match[]; clientEmail: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [email, setEmail] = useState(clientEmail);
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <label key={m.id} className="flex items-center gap-2 rounded-lg border p-3">
            <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} />
            <span className="text-sm">{m.name} ({m.profileCode}) — {m.city}, {m.religion}</span>
          </label>
        ))}
        {matches.length === 0 && <p className="text-sm text-muted-foreground">No compatible profiles found.</p>}
      </div>
      {matches.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@email.com"
            className="h-10 w-64 rounded-md border border-input px-3 text-sm"
          />
          <Button
            disabled={isPending || selected.length === 0 || !email}
            onClick={() => startTransition(async () => {
              await sendMatchedProfilesAction(email, selected);
              setSent(true);
            })}
          >
            {isPending ? "Sending..." : sent ? "Sent ✓" : `Send ${selected.length} Profiles`}
          </Button>
        </div>
      )}
    </div>
  );
}