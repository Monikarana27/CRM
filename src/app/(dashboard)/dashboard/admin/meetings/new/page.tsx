import { DashboardHero } from "@/components/layout/dashboard-hero";
import { prisma } from "@/lib/db/prisma";
import { createMeetingAction } from "@/actions/meetings/meeting.actions";
import { ScheduleMeetingForm } from "./schedule-meeting-form";

export default async function NewMeetingPage() {
  const [profiles, employees] = await Promise.all([
    prisma.profile.findMany({
      select: { id: true, name: true, profileCode: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Schedule Meeting"
        subtitle="Set up a face-to-face or tele meeting for a profile."
      />
      <ScheduleMeetingForm
        profiles={profiles}
        employees={employees}
        action={createMeetingAction}
      />
    </div>
  );
}