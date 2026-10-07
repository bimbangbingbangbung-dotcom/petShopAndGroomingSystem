import Link from "next/link"
import { listAllOrders } from "@/lib/shop"
import { formatPeso } from "@/lib/money"
import { StatusBadge } from "@/components/status-badge"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ status?: string; error?: string }>
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
]

const EMPTY: Record<string, { title: string; body: string }> = {
  "": {
    title: "No orders yet.",
    body: "Orders appear here as soon as a customer checks out.",
  },
  pending: {
    title: "No orders are awaiting payment.",
    body: "New checkouts land here until their payment comes through.",
  },
  paid: {
    title: "No paid orders right now.",
    body: "Mark an awaiting-payment order as paid once you have seen the funds.",
  },
  fulfilled: {
    title: "No fulfilled orders yet.",
    body: "Hand an order over, then mark it fulfilled to keep the record here.",
  },
  cancelled: {
    title: "Nothing has been cancelled.",
    body: "Cancelled orders are kept here so you can still see what happened.",
  },
}

/** "Mon D, YYYY, h:mm am" — matches the timestamps shown across the admin. */
function formatWhen(iso: string): string {
  const date = new Date(iso)
  const day = date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
  const hour24 = date.getHours()
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${day}, ${hour}:${minute} ${hour24 < 12 ? "am" : "pm"}`
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams
  const rawStatus = typeof sp.status === "string" ? sp.status : ""
  const status = FILTERS.some((filter) => filter.value === rawStatus) ? rawStatus : ""
  const error = typeof sp.error === "string" ? sp.error : ""

  const orders = listAllOrders(status ? { status } : {})
  const total = orders.reduce((sum, order) => sum + order.total_cents, 0)
  const empty = EMPTY[status]

  return (
    <div className="page py-8">
      <header>
        <h1 className="section-title">Orders</h1>
        <p className="mt-2 text-muted">
          {orders.length} {orders.length === 1 ? "order" : "orders"} · {formatPeso(total)}
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

      <nav aria-label="Filter orders" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === status
          return (
            <Link
              key={filter.value || "all"}
              href={filter.value ? `/admin/orders?status=${filter.value}` : "/admin/orders"}
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

      {orders.length === 0 ? (
        <div className="card mt-6 px-6 py-10 text-center">
          <p className="font-display text-lg">{empty.title}</p>
          <p className="mt-1 text-sm text-muted">{empty.body}</p>
        </div>
      ) : (
        <div className="table-wrap mt-6">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Placed</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap font-medium">{order.order_number}</td>
                  <td>
                    <span className="block">{order.customer_name}</span>
                    <span className="block text-xs text-muted">{order.customer_email}</span>
                  </td>
                  <td>{order.item_count}</td>
                  <td className="whitespace-nowrap">
                    <span className="price-tag">{formatPeso(order.total_cents)}</span>
                  </td>
                  <td>
                    <StatusBadge kind="order" status={order.status} />
                  </td>
                  <td className="whitespace-nowrap text-muted">{formatWhen(order.created_at)}</td>
                  <td className="text-right">
                    <Link href={`/admin/orders/${order.id}`} className="btn btn-ghost btn-sm">
                      View
                    </Link>
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
