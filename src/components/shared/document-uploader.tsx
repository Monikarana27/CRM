"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { addProfileDocumentAction, deleteProfileDocumentAction } from "@/actions/documents/document.actions";
import { X } from "lucide-react";

type Doc = { id: string; url: string; type: string };

export function DocumentUploader({ profileId, initialDocs }: { profileId: string; initialDocs: Doc[] }) {
  const [docs, setDocs] = useState(initialDocs);
  const [docType, setDocType] = useState("PHOTO");
  const [isPending, startTransition] = useTransition();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      await addProfileDocumentAction(profileId, url, docType as any);
      setDocs((d) => [{ id: crypto.randomUUID(), url, type: docType }, ...d]);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PHOTO">Photo</SelectItem>
            <SelectItem value="ID_PROOF">ID Proof</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <input type="file" onChange={handleUpload} disabled={isPending} className="text-sm" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {docs.map((d) => (
          <div key={d.id} className="relative">
            <img src={d.url} className="h-24 w-full rounded-md object-cover" />
            <button
              type="button"
              onClick={() => startTransition(async () => {
                await deleteProfileDocumentAction(d.id, profileId);
                setDocs((prev) => prev.filter((x) => x.id !== d.id));
              })}
              className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}