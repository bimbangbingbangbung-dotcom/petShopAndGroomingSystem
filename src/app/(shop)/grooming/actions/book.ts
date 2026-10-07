"use server"

import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { bookAppointment } from "@/lib/grooming"
import { bookingSchema, firstMessage } from "@/lib/validation"

export async function book(formData: FormData): Promise<void> {
  const parsed = bookingSchema.safeParse({
    serviceId: formData.get("serviceId"),
    preferredDate: formData.get("preferredDate"),
    petName: formData.get("petName"),
    petSpecies: formData.get("petSpecies"),
    petBreed: formData.get("petBreed") ?? "",
    petSize: formData.get("petSize"),
    petNotes: formData.get("petNotes") ?? "",
    paymentMethod: formData.get("paymentMethod"),
  })
  if (!parsed.success) {
    redirect("/grooming?error=" + encodeURIComponent(firstMessage(parsed.error)))
  }

  const user = await getSessionUser()
  if (!user) redirect("/login?next=/grooming")

  const outcome = bookAppointment({
    userId: user.id,
    serviceId: parsed.data.serviceId,
    preferredDate: parsed.data.preferredDate,
    petName: parsed.data.petName,
    petSpecies: parsed.data.petSpecies,
    petBreed: parsed.data.petBreed,
    petSize: parsed.data.petSize,
    petNotes: parsed.data.petNotes,
    paymentMethod: parsed.data.paymentMethod,
  })

  if (outcome.ok && outcome.data) {
    redirect(
      "/grooming/bookings?booked=" +
        encodeURIComponent(outcome.data.appointment.appointment_number),
    )
  }

  redirect(
    "/grooming?error=" +
      encodeURIComponent(
        outcome.ok ? "We could not book that slot. Try another date." : outcome.message,
      ),
  )
}
