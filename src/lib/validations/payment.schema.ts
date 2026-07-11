import { z } from "zod";

export const paymentSchema = z.object({
  serviceId: z.string().min(1, "Select a service"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  method: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "PAYU", "PAYPAL", "OTHER"]).default("OTHER"),
  status: z.enum(["PAID", "PENDING", "FAILED"]).default("PENDING"),
  transactionId: z.string().optional(),
  paymentLinkUrl: z.string().optional(),
  notes: z.string().optional(),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;