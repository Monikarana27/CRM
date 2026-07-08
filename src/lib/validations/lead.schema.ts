import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  source: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "PENDING", "CLOSED"]).default("NEW"),
  notes: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;