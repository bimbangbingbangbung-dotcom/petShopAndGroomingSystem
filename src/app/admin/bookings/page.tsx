import Link from "next/link"
import type { Appointment, AppointmentStatus } from "@/lib/db"
import { listAllAppointments, SIZE_LABELS } from "@/lib/grooming"
import { formatPeso } from "@/lib/money"
import { updateAppointmentStatus } from "@/app/admin/actions/appointments"
import { StatusBadge } from "@/components/status-badge"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ status?: string; error?: string }>
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

const EMPTY: Record<string, { title: string; body: string }> = {
  "": { title: "No bookings yet.", body: "Bookings appear here as soon as a customer picks a date." },
  requested: {
    title: "No bookings are waiting for you.",
    body: "New requests land here until you confirm or cancel them.",
  },
  confirmed: {
    title: "No confirmed bookings right now.",
    body: "Confirm a request to move it into this list.",
  },
  completed: {
    title: "Nothing has been completed yet.",
    body: "Mark a booking complete once the pet has been groomed.",
  },
  cancelled: {
    title: "Nothing has been cancelled.",
    body: "Cancelled bookings stay here so you can reopen one if plans change.",
  },
}

interface BookingAction {
  to: AppointmentStatus
  label: string
  cls: string
}

const ACTIONABLE: Record<AppointmentStatus, BookingAction[]> = {
  requested: [
    { to: "confirmed", label: "Confirm", cls: "btn btn-primary btn-sm" },
    { to: "cancelled", label: "Cancel", cls: "btn btn-danger btn-sm" },
  ],
  confirmed: [
    { to: "completed", label: "Complete", cls: "btn btn-primary btn-sm" },
    { to: "cancelled", label: "Cancel", cls: "btn btn-danger btn-sm" },
  ],
  cancelled: [{ to: "requested", label: "Reopen", cls: "btn btn-ghost btn-sm" }],
  completed: [],
}

function petLine(appointment: Appointment): string {
  const parts = [appointment.pet_species.charAt(0).toUpperCase() + appointment.pet_species.slice(1)]
  if (appointment.pet_breed) parts.push(appointment.pet_breed)
  parts.push(SIZE_LABELS[appointment.pet_size])
  return parts.join(" · ")
}

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const sp = await searchParams
  const rawStatus = typeof sp.status === "string" ? sp.status : ""
  const status = FILTERS.some((filter) => filter.value === rawStatus) ? rawStatus : ""
  const error = typeof sp.error === "string" ? sp.error : ""

  const appointments = listAllAppointments(status ? { status } : {})
  const empty = EMPTY[status]

  return (
    <div className="page py-8">
      <header>
        <h1 className="section-title">Bookings</h1>
        <p className="mt-2 text-muted">
          {appointments.length} {appointments.length === 1 ? "booking" : "bookings"}
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}

      <nav aria-label="Filter bookings" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === status
          return (
            <Link
              key={filter.value || "all"}
              href={filter.value ? `/admin/bookings?status=${filter.value}` : "/admin/bookings"}
              className={
                active
                  ? "badge badge-info min-h-11 px-4 text-sm"
                  : "badge badge-muted min-h-11 px-4 text-sm hover:border-forest hover:text-forest"
              }
              aria-current={active ? "page" : undefined}
            >
              {filter.label}
            </Link>
          )
        })}
      </nav>

      {appointments.length === 0 ? (
        <div className="card mt-6 px-6 py-10 text-center">
          <p className="font-display text-lg">{empty.title}</p>
          <p className="mt-1 text-sm text-muted">{empty.body}</p>
        </div>
      ) : (
        <div className="table-wrap mt-6">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Booking</th>
                <th scope="col">Date</th>
                <th scope="col">Pet</th>
                <th scope="col">Service</th>
                <th scope="col">Price</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="whitespace-nowrap font-medium">{appointment.appointment_number}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(appointment.preferred_date)}</td>
                  <td>
                    <span className="block font-medium">{appointment.pet_name}</span>
                    <span className="block text-xs text-muted">{petLine(appointment)}</span>
                  </td>
                  <td>{appointment.service_name}</td>
                  <td className="whitespace-nowrap">
                    <span className="price-tag">{formatPeso(appointment.price_cents)}</span>
                  </td>
                  <td>
                    <StatusBadge kind="appointment" status={appointment.status} />
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {ACTIONABLE[appointment.status].map((action) => (
                        <form key={action.to} action={updateAppointmentStatus}>
                          <input type="hidden" name="id" value={appointment.id} />
                          <input type="hidden" name="status" value={action.to} />
                          <button type="submit" className={action.cls}>
                            {action.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
