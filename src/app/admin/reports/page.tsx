import Link from "next/link"
import { daysAgoISO, salesReport, todayISO } from "@/lib/reports"
import { formatPeso, formatPesoWhole } from "@/lib/money"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
}

function methodLabel(method: string): string {
  return method.charAt(0).toUpperCase() + method.slice(1)
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const sp = await searchParams
  const today = todayISO()
  let from = typeof sp.from === "string" && DATE_PATTERN.test(sp.from) ? sp.from : daysAgoISO(30)
  let to = typeof sp.to === "string" && DATE_PATTERN.test(sp.to) ? sp.to : today
  if (from > to) [from, to] = [to, from]

  const report = salesReport(from, to)
  const max = report.by_day.reduce(
    (peak, day) => Math.max(peak, day.shop_cents + day.grooming_cents),
    0,
  )

  const tiles = [
    { label: "Total sales", value: formatPeso(report.total_cents), money: true },
    { label: "Shop sales", value: formatPeso(report.shop_cents), money: true },
    { label: "Grooming sales", value: formatPeso(report.grooming_cents), money: true },
    { label: "Refunds", value: formatPeso(report.refunded_cents), money: true },
    { label: "Orders", value: report.order_count.toLocaleString("en-PH"), money: false },
    { label: "Bookings", value: report.appointment_count.toLocaleString("en-PH"), money: false },
  ]

  const quickLinks = [
    { label: "Last 7 days", href: `/admin/reports?from=${daysAgoISO(7)}&to=${today}` },
    {
      label: "This month",
      href: `/admin/reports?from=${today.slice(0, 7)}-01&to=${today}`,
    },
  ]

  return (
    <div className="page py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Sales report</h1>
          <p className="mt-2 text-muted">
            {formatDate(from)} to {formatDate(to)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href} className="btn btn-ghost btn-sm">
              {link.label}
            </Link>
          ))}
        </div>
      </header>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="field w-full sm:w-48">
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" className="input" defaultValue={from} />
        </div>
        <div className="field w-full sm:w-48">
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" className="input" defaultValue={to} />
        </div>
        <button type="submit" className="btn btn-primary">
          Apply range
        </button>
      </form>

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

      <section className="card mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-xl">Sales by day</h2>
          <ul className="flex flex-wrap gap-4 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-forest" aria-hidden="true" /> Shop
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-marigold" aria-hidden="true" /> Grooming
            </li>
          </ul>
        </div>

        <div className="px-5 py-5">
          {max === 0 ? (
            <p className="text-sm text-muted">
              No sales in this range yet. Pick a wider range to compare against a busier week.
            </p>
          ) : (
            <div className="flex h-48 items-end gap-px" aria-hidden="true">
              {report.by_day.map((day) => (
                <div
                  key={day.date}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end gap-px"
                >
                  <div
                    className="bg-marigold"
                    style={{ height: `${(day.grooming_cents / max) * 100}%` }}
                  />
                  <div className="bg-forest" style={{ height: `${(day.shop_cents / max) * 100}%` }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto border-t border-line">
          <table className="table">
            <caption className="px-5 pt-4 text-left font-display text-lg font-semibold">
              Day by day
            </caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Shop</th>
                <th scope="col">Grooming</th>
                <th scope="col">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {report.by_day.map((day) => (
                <tr key={day.date}>
                  <td className="whitespace-nowrap">{formatDate(day.date)}</td>
                  <td className="whitespace-nowrap">{formatPeso(day.shop_cents)}</td>
                  <td className="whitespace-nowrap">{formatPeso(day.grooming_cents)}</td>
                  <td>{day.transactions.toLocaleString("en-PH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="border-b border-line px-5 py-4 text-xl">Top products</h2>
          {report.top_products.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="font-display text-lg">No product sales in this range.</p>
              <p className="mt-1 text-sm text-muted">
                Paid orders show up here as soon as one comes through.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_products.map((product) => (
                    <tr key={product.name}>
                      <td className="font-medium">{product.name}</td>
                      <td>{product.quantity.toLocaleString("en-PH")}</td>
                      <td className="whitespace-nowrap">
                        <span className="price-tag">{formatPeso(product.revenue_cents)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="border-b border-line px-5 py-4 text-xl">Sales by payment method</h2>
          {report.by_method.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="font-display text-lg">No payments in this range.</p>
              <p className="mt-1 text-sm text-muted">
                Try a wider date range to see how customers are paying.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Method</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.by_method.map((row) => (
                    <tr key={row.method}>
                      <td className="font-medium">{methodLabel(row.method)}</td>
                      <td className="whitespace-nowrap">
                        <span className="price-tag">{formatPesoWhole(row.amount_cents)}</span>
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
