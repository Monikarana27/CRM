"use client";

import { useState, useTransition } from "react";
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
import { searchProfilesAction, sendSelectedProfilesAction } from "@/actions/profile-shares/profile-share.actions";

type Ref = { id: string; name: string };
type Result = {
  id: string;
  name: string;
  profileCode: string;
  gender: string;
  dob: Date | null;
  city: string | null;
  religion: { name: string } | null;
  caste: { name: string } | null;
};

function calcAge(dob: Date | null) {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function ProfileSearchForm({
  clientProfileId,
  clientEmail,
  religions,
  castes,
}: {
  clientProfileId: string;
  clientEmail: string;
  religions: Ref[];
  castes: Ref[];
}) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [email, setEmail] = useState(clientEmail);
  const [isSearching, startSearch] = useTransition();
  const [isSending, startSending] = useTransition();
  const [sent, setSent] = useState<number | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  function updateFilter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function search() {
    startSearch(async () => {
      const data = await searchProfilesAction({
        gender: (filters.gender as any) || undefined,
        minAge: filters.minAge ? parseInt(filters.minAge) : undefined,
        maxAge: filters.maxAge ? parseInt(filters.maxAge) : undefined,
        religionId: filters.religionId || undefined,
        casteId: filters.casteId || undefined,
        manglik: filters.manglik || undefined,
        country: filters.country || undefined,
        state: filters.state || undefined,
        city: filters.city || undefined,
        annualIncome: filters.annualIncome || undefined,
        educationField: filters.educationField || undefined,
        highestQualification: filters.highestQualification || undefined,
      });
      setResults(data as Result[]);
      setSelected([]);
    });
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function send() {
    startSending(async () => {
      setSendError(null);
      const result = await sendSelectedProfilesAction(clientProfileId, email, selected);
      if (result.error) {
        setSendError(result.error);
        return;
      }
      setSent(result.count);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={filters.gender ?? ""} onValueChange={(v) => updateFilter("gender", v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Min Age</Label>
          <Input type="number" value={filters.minAge ?? ""} onChange={(e) => updateFilter("minAge", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Max Age</Label>
          <Input type="number" value={filters.maxAge ?? ""} onChange={(e) => updateFilter("maxAge", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Religion</Label>
          <Select value={filters.religionId ?? ""} onValueChange={(v) => updateFilter("religionId", v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              {religions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Caste</Label>
          <Select value={filters.casteId ?? ""} onValueChange={(v) => updateFilter("casteId", v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              {castes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Manglik</Label>
          <Input value={filters.manglik ?? ""} onChange={(e) => updateFilter("manglik", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input value={filters.country ?? ""} onChange={(e) => updateFilter("country", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input value={filters.state ?? ""} onChange={(e) => updateFilter("state", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={filters.city ?? ""} onChange={(e) => updateFilter("city", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Annual Income</Label>
          <Input value={filters.annualIncome ?? ""} onChange={(e) => updateFilter("annualIncome", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Education Field</Label>
          <Input value={filters.educationField ?? ""} onChange={(e) => updateFilter("educationField", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Education Level</Label>
          <Input value={filters.highestQualification ?? ""} onChange={(e) => updateFilter("highestQualification", e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={search} disabled={isSearching}>{isSearching ? "Searching..." : "Search"}</Button>
        <Button variant="outline" onClick={() => { setFilters({}); setResults([]); }}>Reset</Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="p-3"></th>
                  <th className="p-3 font-medium">ID</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Age</th>
                  <th className="p-3 font-medium">City</th>
                  <th className="p-3 font-medium">Religion</th>
                  <th className="p-3 font-medium">Caste</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td className="p-3">{r.profileCode}</td>
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3">{calcAge(r.dob)}</td>
                    <td className="p-3">{r.city ?? "—"}</td>
                    <td className="p-3">{r.religion?.name ?? "—"}</td>
                    <td className="p-3">{r.caste?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@email.com"
              className="w-64"
            />
            <Button disabled={isSending || selected.length === 0 || !email} onClick={send}>
              {isSending ? "Sending..." : sent !== null ? `Sent ✓ (${sent})` : `Send ${selected.length} Profiles`}
            </Button>
          </div>
          {sendError && (
            <p className="text-sm text-destructive">Failed to send: {sendError}</p>
          )}
        </div>
      )}
    </div>
  );
}