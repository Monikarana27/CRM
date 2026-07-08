import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "SALES", "SERVICE"], {
    message: "Select a valid role",
  }),
  active: z.boolean().default(true),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;