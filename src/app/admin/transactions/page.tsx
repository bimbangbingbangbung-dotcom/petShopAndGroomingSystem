import { daysAgoISO, listTransactions, todayISO } from "@/lib/reports"
import { formatPeso } from "@/lib/money"
import { StatusBadge } from "@/components/status-badge"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ kind?: string; from?: string; to?: string }>
}

const KINDS = [
  { value: "", label: "All" },
  { value: "shop", label: "Shop" },
  { value: "grooming", label: "Grooming" },
]

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** "Mon D, YYYY, h:mm am" — matches the timestamps shown across the admin. */
function formatWhen(iso: string): string {
  const date = new Date(iso)
  const day = date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
  const hour24 = date.getHours()
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${day}, ${hour}:${minute} ${hour24 < 12 ? "am" : "pm"}`
}

export default async function AdminTransactionsPage({ searchParams }: Props) {
  const sp = await searchParams
  const rawKind = typeof sp.kind === "string" ? sp.kind : ""
  const kind = KINDS.some((entry) => entry.value === rawKind && entry.value !== "")
    ? (rawKind as "shop" | "grooming")
    : undefined
  const from = typeof sp.from === "string" && DATE_PATTERN.test(sp.from) ? sp.from : daysAgoISO(30)
  const to = typeof sp.to === "string" && DATE_PATTERN.test(sp.to) ? sp.to : todayISO()

  const rows = listTransactions({ kind, from, to })
  const paid = rows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.amount_cents, 0)
  const refunded = rows
    .filter((row) => row.status === "refunded")
    .reduce((sum, row) => sum + row.amount_cents, 0)

  const summary = [
    { label: "Transactions", value: rows.length.toLocaleString("en-PH") },
    { label: "Total paid", value: formatPeso(paid) },
    { label: "Total refunded", value: formatPeso(refunded) },
  ]

  return (
    <div className="page py-8">
      <header>
        <h1 className="section-title">Transaction history</h1>
        <p className="mt-2 text-muted">Every payment taken by the shop and the grooming bar.</p>
      </header>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="field w-full sm:w-48">
          <label htmlFor="kind">Kind</label>
          <select id="kind" name="kind" className="select" defaultValue={kind ?? ""}>
            {KINDS.map((entry) => (
              <option key={entry.value || "all"} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field w-full sm:w-48">
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" className="input" defaultValue={from} />
        </div>
        <div className="field w-full sm:w-48">
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" className="input" defaultValue={to} />
        </div>
        <button type="submit" className="btn btn-ghost">
          Apply filter
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <div key={item.label} className="card p-5">
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card mt-6 px-6 py-10 text-center">
          <p className="font-display text-lg">No transactions in this range.</p>
          <p className="mt-1 text-sm text-muted">
            Widen the dates above or switch the kind filter to see more.
          </p>
        </div>
      ) : (
        <div className="table-wrap mt-6">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Kind</th>
                <th scope="col">Reference</th>
                <th scope="col">Customer</th>
                <th scope="col">Method</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-muted">{formatWhen(row.created_at)}</td>
                  <td>
                    <span className={row.kind === "shop" ? "badge badge-info" : "badge badge-warn"}>
                      {row.kind === "shop" ? "Shop" : "Grooming"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap font-medium">{row.reference}</td>
                  <td>{row.customer_name}</td>
                  <td className="whitespace-nowrap text-muted">{row.method}</td>
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
    </div>
  )
}
