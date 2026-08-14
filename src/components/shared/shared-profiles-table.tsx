"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  addProfileShareCommentAction,
  updateProspectStatusAction,
  updateClientInterestAction,
} from "@/actions/profile-shares/profile-share.actions";
import { MessageSquare, ChevronDown } from "lucide-react";

type Comment = { id: string; comment: string; createdAt: Date; author: { name: string } };
type Row = {
  id: string;
  sharedAt: Date;
  prospectStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "SENT";
  sharedProfile: { id: string; name: string; profileCode: string; photoUrl: string | null };
  sharedBy: { id: string; name: string } | null;
  interests: { status: "PENDING" | "ACCEPTED" | "REJECTED" | "SENT" }[];
  comments: Comment[];
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  SENT: "bg-blue-100 text-blue-700 border-blue-200",
};

function StatusDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "PENDING" | "ACCEPTED" | "REJECTED" | "SENT") => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
      className={`rounded-md border px-2 py-1 text-xs font-medium ${STATUS_STYLES[value]}`}
    >
      <option value="PENDING">Pending</option>
      <option value="SENT">Sent</option>
      <option value="ACCEPTED">Accepted</option>
      <option value="REJECTED">Rejected</option>
    </select>
  );
}

function CommentThread({ profileShareId, comments }: { profileShareId: string; comments: Comment[] }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!text.trim()) return;
    startTransition(async () => {
      await addProfileShareCommentAction(profileShareId, text);
      setText("");
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {comments.length} <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-md border bg-muted/30 p-2">
          {comments.map((c) => (
            <div key={c.id} className="text-xs">
              <span className="font-medium">{c.author.name}:</span> {c.comment}
            </div>
          ))}
          {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
          <div className="flex gap-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add feedback..."
              className="h-7 flex-1 rounded border border-input px-2 text-xs"
            />
            <Button size="sm" className="h-7 px-2 text-xs" disabled={isPending} onClick={submit}>
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SharedProfilesTable({
  rows,
  clientName,
  clientProfileId,
}: {
  rows: Row[];
  clientName: string;
  clientProfileId: string;
}) {
  const [, startTransition] = useTransition();

  function handleProspectChange(id: string, status: any) {
    startTransition(() => updateProspectStatusAction(id, status));
  }
  function handleClientChange(id: string, status: any) {
    startTransition(() => updateClientInterestAction(id, status));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">All Shared Profiles With {clientName}</h3>
        <Button size="sm" asChild>
          <Link href={`/dashboard/service/profile-search/${clientProfileId}`}>Select Profiles</Link>
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Prospect</th>
              <th className="p-3 font-medium">Prospect Status</th>
              <th className="p-3 font-medium">Client Status</th>
              <th className="p-3 font-medium">Feedback</th>
              <th className="p-3 font-medium">Sent On</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const clientStatus = row.interests[0]?.status ?? "PENDING";
              return (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{row.sharedProfile.name}</p>
                    <p className="text-xs text-muted-foreground">{row.sharedProfile.profileCode}</p>
                  </td>
                  <td className="p-3">
                    <StatusDropdown value={row.prospectStatus} onChange={(v) => handleProspectChange(row.id, v)} />
                  </td>
                  <td className="p-3">
                    <StatusDropdown value={clientStatus} onChange={(v) => handleClientChange(row.id, v)} />
                  </td>
                  <td className="p-3">
                    <CommentThread profileShareId={row.id} comments={row.comments} />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(row.sharedAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No profiles have been shared yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.prospectStatus === "ACCEPTED" && (r.interests[0]?.status ?? "PENDING") === "ACCEPTED") && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          One or more matches have mutual acceptance — consider scheduling a meeting.
        </p>
      )}
    </div>
  );
}