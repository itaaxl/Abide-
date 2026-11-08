import { z } from "zod";

export const PASSWORD_RULES = [
  { id: "length", label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { id: "letter", label: "At least one letter", test: (p: string) => /\p{L}/u.test(p) },
  { id: "number", label: "At least one number", test: (p: string) => /\d/.test(p) },
] as const;

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export const passwordSchema = z
  .string()
  .max(128, "Password is too long.")
  .refine((p) => PASSWORD_RULES.every((r) => r.test(p)), "Password does not meet the requirements.");
