import { z } from "zod";

export const meetingSchema = z.object({
  profileId: z.string().min(1, "Select a profile"),
  type: z.enum(["FACE_TO_FACE", "TELE"]).default("TELE"),
  status: z.enum(["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"]).default("SCHEDULED"),
  scheduledAt: z.string().min(1, "Select a date and time"),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

export type MeetingInput = z.infer<typeof meetingSchema>;