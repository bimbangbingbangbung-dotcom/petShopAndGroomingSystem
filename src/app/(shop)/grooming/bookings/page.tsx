import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { listAppointmentsForUser, SIZE_LABELS } from "@/lib/grooming"
import { formatPeso } from "@/lib/money"
import { StatusBadge } from "@/components/status-badge"
import { ArrowRightIcon, CalendarIcon, ScissorsIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ booked?: string }>
}

function appointmentDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function speciesLabel(species: string): string {
  return species.charAt(0).toUpperCase() + species.slice(1)
}

export default async function BookingsPage({ searchParams }: Props) {
  const user = await requireUser()
  const { booked } = await searchParams
  const appointments = listAppointmentsForUser(user.id)

  return (
    <div className="page py-10">
      <div className="max-w-2xl">
        <h1 className="section-title">Your grooming bookings</h1>
        <p className="mt-2 text-muted">
          Each visit keeps its number, date and price. Signed in as {user.email}.
        </p>
      </div>

      {booked && (
        <div className="mt-6 rounded-md border border-ok/30 bg-ok-bg px-4 py-4">
          <p className="font-display text-lg font-semibold text-ok">
            Appointment {booked} is booked.
          </p>
          <p className="mt-1 text-sm text-ink">
            Next step: watch the status here — requested bookings move to confirmed during shop
            hours, Mon–Sat 9:00 am – 6:00 pm.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/grooming" className="btn btn-primary btn-sm">
              Book another groom
            </Link>
          </div>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="card mt-6 px-6 py-12 text-center">
          <ScissorsIcon width={28} height={28} className="mx-auto text-muted" />
          <p className="mt-3 font-display text-xl">No grooming bookings yet.</p>
          <p className="mt-1 text-sm text-muted">
            Pick a service and a date and your pet&apos;s appointment shows up here.
          </p>
          <Link href="/grooming" className="btn btn-primary mt-5">
            Book a groom
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-display text-lg font-semibold">
                  {appointment.appointment_number}
                </span>
                <StatusBadge kind="appointment" status={appointment.status} />
              </div>

              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <CalendarIcon width={16} height={16} />
                {appointmentDate(appointment.preferred_date)} · {appointment.service_name}
              </p>

              <p className="mt-3 text-sm">
                <span className="font-semibold">{appointment.pet_name}</span>{" "}
                <span className="text-muted">
                  · {speciesLabel(appointment.pet_species)}
                  {appointment.pet_breed ? ` · ${appointment.pet_breed}` : ""} ·{" "}
                  {SIZE_LABELS[appointment.pet_size]}
                </span>
              </p>

              {appointment.pet_notes && (
                <p className="mt-1 text-sm text-muted">Note: {appointment.pet_notes}</p>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-sm text-muted">{appointment.payment_method}</span>
                <span className="price-tag text-lg">{formatPeso(appointment.price_cents)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {appointments.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/grooming" className="btn btn-primary">
            Book another groom <ArrowRightIcon width={18} height={18} />
          </Link>
          <Link href="/products" className="btn btn-ghost">
            Shop for your pet
          </Link>
        </div>
      )}
    </div>
  )
}
