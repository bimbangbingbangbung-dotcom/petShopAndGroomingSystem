// Shared request validation (Zod) — the single contract for every action that
// accepts user input. Server messages win over client-side checks.
import { z } from "zod"
import { parsePeso } from "./money"

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email.").email("That email doesn't look right."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().trim().optional(),
})

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().toLowerCase().min(1, "Enter your email.").email("That email doesn't look right."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "Password is too long."),
})

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter the name for this order.").max(80),
  customerEmail: z.string().trim().toLowerCase().email("Enter a valid email for your receipt."),
  paymentMethod: z.enum(["card", "e_wallet", "cod"], {
    errorMap: () => ({ message: "Choose a payment method." }),
  }),
  lines: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(50, "Your cart has too many lines."),
})

export const bookingSchema = z.object({
  serviceId: z.coerce.number().int().positive("Choose a grooming service."),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  petName: z.string().trim().min(1, "Enter your pet's name.").max(60),
  petSpecies: z.enum(["dog", "cat", "other"], { errorMap: () => ({ message: "Choose your pet's species." }) }),
  petBreed: z.string().trim().max(60).default(""),
  petSize: z.enum(["xs", "s", "m", "l", "xl"], { errorMap: () => ({ message: "Choose your pet's size." }) }),
  petNotes: z.string().trim().max(500).default(""),
  paymentMethod: z.enum(["pay_now", "pay_at_shop"], {
    errorMap: () => ({ message: "Choose how you'd like to pay." }),
  }),
})

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name.").max(120),
  category: z.string().trim().min(1, "Enter a category.").max(40),
  description: z.string().trim().max(2000).default(""),
  price: z
    .string()
    .trim()
    .min(1, "Enter a price.")
    .refine((v) => parsePeso(v) !== null, "Enter a price like 125.00")
    .transform((v) => parsePeso(v) as number),
  stock: z.coerce.number().int().min(0, "Stock can't be negative.").max(1_000_000),
  active: z.coerce.number().int().min(0).max(1).default(1),
  image: z
    .string()
    .trim()
    .max(300)
    .refine(
      (v) => v === "" || v.startsWith("/") || v.startsWith("https://"),
      "Use a path like /products/bone-toy.svg or an https:// image URL",
    )
    .default(""),
})

export type FieldErrors = Record<string, string>

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".")
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again."
}
