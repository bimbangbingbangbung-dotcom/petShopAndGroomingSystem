"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import type { AppointmentStatus } from "@/lib/db"
import { setAppointmentStatus } from "@/lib/grooming"

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
]

export async function updateAppointmentStatus(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = Number(formData.get("id"))
  const raw = String(formData.get("status") ?? "")
  if (!Number.isInteger(id) || !APPOINTMENT_STATUSES.includes(raw as AppointmentStatus)) {
    redirect("/admin/bookings?error=" + encodeURIComponent("That booking change is not valid."))
  }
  const status = raw as AppointmentStatus

  // setAppointmentStatus re-checks the transition and settles payment history.
  const result = setAppointmentStatus(id, status)
  if (!result.ok) {
    redirect("/admin/bookings?error=" + encodeURIComponent(result.message))
  }

  revalidatePath("/admin")
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/transactions")
}
