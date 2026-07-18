import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  source: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "PENDING", "NOT_INTERESTED", "CLOSED"]).default("NEW"),
  notes: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
