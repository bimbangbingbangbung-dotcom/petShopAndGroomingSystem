"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import type { OrderStatus } from "@/lib/db"
import { getOrderById, setOrderStatus } from "@/lib/shop"

const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled"]

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = Number(formData.get("id"))
  const raw = String(formData.get("status") ?? "")
  if (!Number.isInteger(id) || !ORDER_STATUSES.includes(raw as OrderStatus)) {
    redirect("/admin/orders?error=" + encodeURIComponent("That status change is not valid."))
  }
  const status = raw as OrderStatus

  const order = getOrderById(id)
  if (!order) {
    redirect("/admin/orders?error=" + encodeURIComponent("That order no longer exists."))
  }

  // setOrderStatus re-checks the transition and restocks on cancellation.
  const result = setOrderStatus(id, status)
  if (!result.ok) {
    redirect(`/admin/orders/${id}?error=` + encodeURIComponent(result.message))
  }

  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath("/admin/transactions")
}
