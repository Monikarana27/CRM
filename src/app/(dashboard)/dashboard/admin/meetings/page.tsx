import Link from "next/link";
import { getMeetings } from "@/actions/meetings/meeting.actions";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MeetingsTable } from "./meetings-table";

export default async function MeetingsPage() {
  const meetings = await getMeetings();

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Meetings"
        subtitle="Track face-to-face and tele meetings across profiles."
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Meetings</h2>
        <Button asChild>
          <Link href="/dashboard/admin/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Link>
        </Button>
      </div>

      <MeetingsTable meetings={meetings} />
    </div>
  );
}