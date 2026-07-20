"use client";

import { useMemo, useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProfileAssignAction } from "./profile-assign-action";
import { ProfileRowActions } from "./profile-row-actions";
import { bulkAssignProfilesAction } from "@/actions/profiles/profile.actions";

type ProfileRow = {
  id: string;
  profileCode: string;
  name: string;
  gender: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  status: string;
  religion: string | null;
  city: string | null;
  dob: Date | null;
  approvalStatus: string;
  createdAt: Date;
  assignedTo: { id: string; name: string } | null;
};

type Employee = { id: string; name: string };

const STATUS_STYLES: Record<string, string> = {
  UNASSIGNED: "bg-amber-100 text-amber-700 border-amber-200",
  ASSIGNED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
  ON_HOLD: "bg-orange-100 text-orange-700 border-orange-200",
  EXPIRED: "bg-red-100 text-red-700 border-red-200",
};

const APPROVAL_STYLES: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NEEDS_CHANGES: "bg-red-100 text-red-700 border-red-200",
};

function calculateAge(dob: Date | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function ProfilesTable({
  profiles,
  employees,
}: {
  profiles: ProfileRow[];
  employees: Employee[];
}) {
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [religionFilter, setReligionFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [approvalFilter, setApprovalFilter] = useState("ALL");
  const [assignedFilter, setAssignedFilter] = useState("ALL");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEmployeeId, setBulkEmployeeId] = useState("");
  const [isBulkAssigning, startBulkAssign] = useTransition();

  const religionOptions = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.religion).filter(Boolean))) as string[],
    [profiles]
  );
  const cityOptions = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.city).filter(Boolean))) as string[],
    [profiles]
  );

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (genderFilter !== "ALL" && p.gender !== genderFilter) return false;
      if (religionFilter !== "ALL" && p.religion !== religionFilter) return false;
      if (cityFilter !== "ALL" && p.city !== cityFilter) return false;
      if (approvalFilter !== "ALL" && p.approvalStatus !== approvalFilter) return false;
      if (assignedFilter === "UNASSIGNED_ONLY" && p.assignedTo) return false;
      if (assignedFilter !== "ALL" && assignedFilter !== "UNASSIGNED_ONLY" && p.assignedTo?.id !== assignedFilter)
        return false;
      const age = calculateAge(p.dob);
      if (minAge && (age === null || age < parseInt(minAge))) return false;
      if (maxAge && (age === null || age > parseInt(maxAge))) return false;
      return true;
    });
  }, [profiles, genderFilter, religionFilter, cityFilter, approvalFilter, assignedFilter, minAge, maxAge]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkAssign() {
    if (selected.size === 0 || !bulkEmployeeId) return;
    startBulkAssign(async () => {
      await bulkAssignProfilesAction(Array.from(selected), bulkEmployeeId);
      setSelected(new Set());
      setBulkEmployeeId("");
    });
  }

  const columns: Column<ProfileRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-input"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleOne(row.id)}
          className="h-4 w-4 rounded border-input"
        />
      ),
    },
    {
      key: "profileCode",
      header: "ID",
      sortable: true,
      render: (row) => (
        <Link href={`/dashboard/admin/profiles/${row.id}/edit`} className="font-medium text-primary hover:underline">
          {row.profileCode}
        </Link>
      ),
    },
    {
      key: "photo",
      header: "Photo",
      render: (row) =>
        row.photoUrl ? (
          <img src={row.photoUrl} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
            {row.name.charAt(0).toUpperCase()}
          </div>
        ),
    },
    {
      key: "manage",
      header: "Photos",
      render: (row) => (
        <Link href={`/dashboard/service/profiles/${row.id}`} className="text-sm text-primary hover:underline">
          Manage Photos
        </Link>
      ),
    },
    { key: "name", header: "Name", sortable: true },
    { key: "gender", header: "Gender", render: (row) => <span className="text-muted-foreground">{row.gender}</span> },
    {
      key: "age",
      header: "Age",
      accessor: (row) => calculateAge(row.dob) ?? 0,
      render: (row) => calculateAge(row.dob) ?? "—",
    },
    { key: "city", header: "City", render: (row) => row.city || "—" },
    { key: "religion", header: "Religion", render: (row) => row.religion || "—" },
    { key: "phone", header: "Phone" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant="outline" className={STATUS_STYLES[row.status] ?? ""}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "approvalStatus",
      header: "Approval",
      render: (row) => (
        <Badge variant="outline" className={APPROVAL_STYLES[row.approvalStatus] ?? ""}>
          {row.approvalStatus.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created On",
      sortable: true,
      accessor: (row) => new Date(row.createdAt).getTime(),
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "assign",
      header: "Assigned To",
      render: (row) => (
        <ProfileAssignAction profileId={row.id} currentAssignee={row.assignedTo} employees={employees} />
      ),
    },
    {
      key: "matches",
      header: "Matches",
      render: (row) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/service/matching/${row.id}`}>
            <Heart className="mr-1.5 h-3.5 w-3.5" />
            Find Matches
          </Link>
        </Button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => <ProfileRowActions profile={row} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Genders</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={religionFilter} onValueChange={setReligionFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Religion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Religions</SelectItem>
            {religionOptions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Cities</SelectItem>
            {cityOptions.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
            placeholder="Min age"
            className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
            placeholder="Max age"
            className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>

        <Select value={approvalFilter} onValueChange={setApprovalFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Approval Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Approval</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="NEEDS_CHANGES">Needs Changes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Assigned Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Employees</SelectItem>
            <SelectItem value="UNASSIGNED_ONLY">Unassigned</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
        <span className="text-sm font-medium text-muted-foreground">
          {selected.size > 0 ? `${selected.size} selected` : "Select rows below to bulk assign"}
        </span>
        <Select value={bulkEmployeeId} onValueChange={setBulkEmployeeId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Assign to employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleBulkAssign} disabled={selected.size === 0 || !bulkEmployeeId || isBulkAssigning}>
          {isBulkAssigning ? "Assigning..." : "Bulk Assign"}
        </Button>
        {selected.size > 0 && (
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by name, ID, or phone..."
        emptyMessage="No profiles found in this view."
      />
    </div>
  );
}