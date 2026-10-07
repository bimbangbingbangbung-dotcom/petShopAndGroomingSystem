import Link from "next/link"
import { listAllAppointments } from "@/lib/grooming"
import { formatPeso } from "@/lib/money"
import { adminStats, listTransactions } from "@/lib/reports"
import { StatusBadge } from "@/components/status-badge"
import { ArrowRightIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

/** "Mon D, YYYY, h:mm am" — matches the timestamps shown across the admin. */
function formatWhen(iso: string): string {
  const date = new Date(iso)
  const day = date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
  const hour24 = date.getHours()
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${day}, ${hour}:${minute} ${hour24 < 12 ? "am" : "pm"}`
}

export default function AdminDashboardPage() {
  const stats = adminStats()
  const requestedBookings = listAllAppointments({ status: "requested" }).length
  const recent = listTransactions({ limit: 5 })

  const tiles = [
    { label: "Revenue today", value: formatPeso(stats.revenue_today), money: true },
    { label: "Revenue this month", value: formatPeso(stats.revenue_month), money: true },
    { label: "Open orders", value: stats.orders_open.toLocaleString("en-PH"), money: false },
    { label: "Bookings today", value: stats.appointments_today.toLocaleString("en-PH"), money: false },
    { label: "Low stock", value: stats.low_stock.toLocaleString("en-PH"), money: false },
    { label: "Customers", value: stats.customers.toLocaleString("en-PH"), money: false },
  ]

  const attention = [
    {
      href: "/admin/orders",
      label: "Open orders",
      hint: "Waiting on payment or fulfilment",
      count: stats.orders_open,
    },
    {
      href: "/admin/bookings?status=requested",
      label: "Requested bookings",
      hint: "Not confirmed yet",
      count: requestedBookings,
    },
    {
      href: "/admin/products",
      label: "Low stock",
      hint: "Five or fewer left on the shelf",
      count: stats.low_stock,
    },
  ]

  return (
    <div className="page py-8">
      <header>
        <h1 className="section-title">Dashboard</h1>
        <p className="mt-2 text-muted">Today&apos;s takings, and what still needs a decision.</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="card p-5">
            <p className="text-sm text-muted">{tile.label}</p>
            <p
              className={`mt-1 font-display text-3xl font-semibold ${tile.money ? "text-forest" : "text-ink"}`}
            >
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="border-b border-line px-5 py-4 text-xl">Needs your attention</h2>
          <ul className="divide-y divide-line">
            {attention.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:text-forest"
                >
                  <span>
                    <span className="block font-medium">{item.label}</span>
                    <span className="block text-sm text-muted">{item.hint}</span>
                  </span>
                  <span className={item.count > 0 ? "badge badge-warn" : "badge badge-muted"}>
                    {item.count.toLocaleString("en-PH")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="text-xl">Latest transactions</h2>
            <Link href="/admin/transactions" className="btn btn-ghost btn-sm">
              View all <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="font-display text-lg">No transactions yet.</p>
              <p className="mt-1 text-sm text-muted">
                Paid orders and bookings show up here as soon as money comes in.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Reference</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap text-muted">{formatWhen(row.created_at)}</td>
                      <td>
                        <span className="block font-medium">{row.reference}</span>
                        <span className="block text-xs text-muted">{row.customer_name}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="price-tag">{formatPeso(row.amount_cents)}</span>
                      </td>
                      <td>
                        <StatusBadge kind="transaction" status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
