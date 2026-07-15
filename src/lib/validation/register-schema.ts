import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    confirmEmail: z.string().trim().min(1, "Please confirm your email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number")
      .regex(/[^A-Za-z0-9]/, "Must include at least one special character (!@#$%...)"),
    confirmPassword: z.string().min(1, "Please confirm your password"),

    // Contact
    prefix: z.string().optional(),
    firstName: z.string().trim().min(1, "First name is required").max(100),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    phone: z
      .string()
      .trim()
      .min(7, "Phone number is required")
      .regex(/^[\d\s\-+().]{7,}$/, "Enter a valid phone number"),

    // Delivery address
    addressLine1: z.string().trim().min(1, "Delivery address is required").max(300),
    city: z.string().trim().min(1, "City is required").max(120),
    state: z.string().trim().min(1, "State / province is required").max(120),
    postalCode: z.string().trim().min(1, "ZIP / postal code is required").max(32),
    country: z.string().trim().min(1, "Country is required").max(120),

    // Business
    company: z.string().trim().min(1, "Company / clinic name is required").max(200),
    businessPhone: z
      .string()
      .trim()
      .min(7, "Business phone is required")
      .regex(/^[\d\s\-+().]{7,}$/, "Enter a valid business phone number"),
    specialty: z.string().trim().max(200).optional(),
    website: z.string().trim().max(300).optional(),

    // Medical license
    licenseHolderName: z.string().trim().min(1, "Name on the license is required").max(200),
    profession: z.string().trim().min(1, "License type is required").max(200),
    licenseNumber: z.string().trim().min(1, "License number is required").max(120),
    licenseExpiry: z.string().min(1, "License expiry date is required"),
    licenseState: z.string().trim().min(1, "State / county issued is required").max(120),
    licenseCountry: z.string().trim().min(1, "Country issued is required").max(120),
  })
  .refine((d) => d.email === d.confirmEmail, {
    message: "Emails do not match",
    path: ["confirmEmail"],
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (d) => {
      const t = new Date(d.licenseExpiry);
      return !isNaN(t.getTime()) && t > new Date();
    },
    { message: "License expiry must be a valid future date", path: ["licenseExpiry"] }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export function flattenErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
