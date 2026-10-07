// Grooming domain: services, pet-aware pricing, bookings.
// Duration/price depends on the pet, not just the service (SYSTEM_ARCHITECTURE.md §5.2).
import { randomBytes } from "node:crypto"
import { db, type Appointment, type AppointmentStatus, type PetSize, type Service } from "./db"
import type { ActionResult } from "./shop"

/** Bigger pets cost more — same idea as the doc's duration × size × coat math. */
export const SIZE_FACTORS: Record<PetSize, number> = { xs: 1, s: 1.25, m: 1.5, l: 2, xl: 2.5 }

export const SIZE_LABELS: Record<PetSize, string> = {
  xs: "Extra small (under 5 kg)",
  s: "Small (5–10 kg)",
  m: "Medium (10–20 kg)",
  l: "Large (20–35 kg)",
  xl: "Extra large (35 kg+)",
}

export const PET_SPECIES = ["dog", "cat", "other"] as const

export function listServices(activeOnly = true): Service[] {
  const sql = activeOnly ? "SELECT * FROM services WHERE active = 1 ORDER BY base_price_cents" : "SELECT * FROM services ORDER BY name"
  return db().prepare(sql).all() as Service[]
}

export function getService(id: number): Service | undefined {
  return db().prepare("SELECT * FROM services WHERE id = ?").get(id) as Service | undefined
}

/** Price for a service on a given pet size, rounded to whole pesos. */
export function quotePrice(basePriceCents: number, size: PetSize): number {
  return Math.round((basePriceCents * SIZE_FACTORS[size]) / 100) * 100
}

function makeAppointmentNumber(): string {
  const now = new Date()
  const y = String(now.getFullYear()).slice(2)
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const suffix = randomBytes(3).toString("hex").toUpperCase().slice(0, 4)
  return `GR-${y}${m}${d}-${suffix}`
}

export function preferredDateIsValid(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const chosen = new Date(`${date}T00:00:00`)
  if (Number.isNaN(chosen.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today.getTime() + 60 * 86_400_000)
  return chosen >= today && chosen <= limit
}

export function bookAppointment(input: {
  userId: number
  serviceId: number
  preferredDate: string
  petName: string
  petSpecies: string
  petBreed: string
  petSize: PetSize
  petNotes: string
  paymentMethod: "pay_now" | "pay_at_shop"
}): ActionResult<{ appointment: Appointment }> {
  const service = getService(input.serviceId)
  if (!service || !service.active) {
    return { ok: false, code: "service_missing", message: "That grooming service is not available.", field: "serviceId" }
  }
  if (!preferredDateIsValid(input.preferredDate)) {
    return {
      ok: false,
      code: "invalid_date",
      message: "Choose a date from today up to 60 days ahead.",
      field: "preferredDate",
    }
  }
  if (!input.petName.trim()) {
    return { ok: false, code: "pet_name", message: "Tell us your pet's name.", field: "petName" }
  }
  if (!PET_SPECIES.includes(input.petSpecies as (typeof PET_SPECIES)[number])) {
    return { ok: false, code: "pet_species", message: "Choose your pet's species.", field: "petSpecies" }
  }
  if (!SIZE_FACTORS[input.petSize]) {
    return { ok: false, code: "pet_size", message: "Choose your pet's size.", field: "petSize" }
  }

  const price = quotePrice(service.base_price_cents, input.petSize)
  const methodLabel = input.paymentMethod === "pay_now" ? "Paid online" : "Pay at shop"
  const status: AppointmentStatus = input.paymentMethod === "pay_now" ? "confirmed" : "requested"
  const number = makeAppointmentNumber()

  try {
    const appointment = db().transaction(() => {
      const info = db()
        .prepare(
          `INSERT INTO appointments
             (appointment_number, user_id, service_id, service_name, preferred_date, pet_name, pet_species,
              pet_breed, pet_size, pet_notes, price_cents, status, payment_method)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          number,
          input.userId,
          service.id,
          service.name,
          input.preferredDate,
          input.petName.trim(),
          input.petSpecies,
          input.petBreed.trim(),
          input.petSize,
          input.petNotes.trim(),
          price,
          status,
          methodLabel,
        )

      if (input.paymentMethod === "pay_now") {
        db()
          .prepare(
            `INSERT INTO transactions (kind, reference, user_id, customer_name, amount_cents, method, status)
             VALUES ('grooming', ?, ?, (SELECT name FROM users WHERE id = ?), ?, ?, 'paid')`,
          )
          .run(number, input.userId, input.userId, price, methodLabel)
      }
      return db().prepare("SELECT * FROM appointments WHERE id = ?").get(Number(info.lastInsertRowid)) as Appointment
    })()
    return { ok: true, data: { appointment } }
  } catch (error) {
    console.error("[booking]", error)
    return { ok: false, code: "server_error", message: "We could not book that slot. Please try again." }
  }
}

export function listAppointmentsForUser(userId: number): Appointment[] {
  return db()
    .prepare("SELECT * FROM appointments WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Appointment[]
}

export function listAllAppointments(opts: { status?: string } = {}): Appointment[] {
  const where = opts.status ? "WHERE a.status = ?" : ""
  const params = opts.status ? [opts.status] : []
  return db()
    .prepare(`SELECT a.* FROM appointments a ${where} ORDER BY a.preferred_date DESC, a.created_at DESC`)
    .all(...params) as Appointment[]
}

export function getAppointmentByNumber(number: string): Appointment | undefined {
  return db().prepare("SELECT * FROM appointments WHERE appointment_number = ?").get(number) as
    | Appointment
    | undefined
}

/**
 * Admin status transition for a booking.
 * Completing a "pay at shop" booking records its transaction; cancelling a paid
 * booking refunds it — history is never rewritten, only appended/annotated.
 */
export function setAppointmentStatus(id: number, status: AppointmentStatus): ActionResult {
  const appt = db().prepare("SELECT * FROM appointments WHERE id = ?").get(id) as Appointment | undefined
  if (!appt) return { ok: false, code: "not_found", message: "Appointment not found." }

  const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
    requested: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: ["requested"],
  }
  if (!allowed[appt.status].includes(status)) {
    return {
      ok: false,
      code: "invalid_transition",
      message: `A booking marked “${appt.status}” cannot move to “${status}”.`,
    }
  }

  db().transaction(() => {
    if (status === "completed" && appt.payment_method === "Pay at shop") {
      db()
        .prepare(
          `INSERT INTO transactions (kind, reference, user_id, customer_name, amount_cents, method, status)
           VALUES ('grooming', ?, ?, (SELECT name FROM users WHERE id = ?), ?, ?, 'paid')`,
        )
        .run(appt.appointment_number, appt.user_id, appt.user_id, appt.price_cents, "Pay at shop")
    }
    if (status === "cancelled" && appt.payment_method === "Paid online") {
      db()
        .prepare("UPDATE transactions SET status = 'refunded' WHERE reference = ? AND status = 'paid'")
        .run(appt.appointment_number)
    }
    db()
      .prepare(
        "UPDATE appointments SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
      )
      .run(status, id)
  })()

  return { ok: true }
}
