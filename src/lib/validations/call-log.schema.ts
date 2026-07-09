import { z } from "zod";

export const callLogSchema = z.object({
  profileId: z.string().min(1, "Select a profile"),
  outcome: z.enum(["CONNECTED", "NOT_ANSWERED", "BUSY", "INVALID_NUMBER", "FOLLOW_UP_NEEDED"]).default("CONNECTED"),
  notes: z.string().optional(),
});

export type CallLogInput = z.infer<typeof callLogSchema>;