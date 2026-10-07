"use server"

import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { checkout } from "@/lib/shop"
import type { FormState } from "@/lib/form"
import { checkoutSchema, fieldErrors, firstMessage } from "@/lib/validation"

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  let lines: unknown = []
  const rawLines = formData.get("lines")
  if (typeof rawLines === "string") {
    try {
      lines = JSON.parse(rawLines)
    } catch {
      lines = []
    }
  }

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    paymentMethod: formData.get("paymentMethod"),
    lines,
  })
  if (!parsed.success) {
    return { error: firstMessage(parsed.error), fieldErrors: fieldErrors(parsed.error) }
  }

  const user = await getSessionUser()
  if (!user) redirect("/login?next=/checkout")

  // Prices and stock come from the database here — never from the browser.
  const outcome = checkout({
    userId: user.id,
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    lines: parsed.data.lines,
    paymentMethod: parsed.data.paymentMethod,
  })

  if (outcome.ok && outcome.data) {
    redirect("/receipt/" + outcome.data.order.order_number + "?placed=1")
  }

  return { error: outcome.ok ? "We could not complete your order. Try again." : outcome.message }
}
