import Link from "next/link"
import { notFound } from "next/navigation"
import type { OrderStatus } from "@/lib/db"
import { getOrderById, getOrderItems } from "@/lib/shop"
import { formatPeso } from "@/lib/money"
import { updateOrderStatus } from "@/app/admin/actions/orders"
import { StatusBadge } from "@/components/status-badge"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: ["pending"],
}

const ACTION_LABELS: Record<OrderStatus, { label: string; cls: string }> = {
  paid: { label: "Mark paid", cls: "btn btn-primary btn-sm" },
  fulfilled: { label: "Mark fulfilled", cls: "btn btn-primary btn-sm" },
  cancelled: { label: "Cancel and restock", cls: "btn btn-danger btn-sm" },
  pending: { label: "Reopen as pending", cls: "btn btn-ghost btn-sm" },
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

export default async function AdminOrderDetailPage({ params, searchParams }: Props) {
  const { id: rawId } = await params
  const sp = await searchParams
  const orderId = Number(rawId)
  const order = Number.isInteger(orderId) ? getOrderById(orderId) : undefined
  if (!order) notFound()

  const items = getOrderItems(order.id)
  const error = typeof sp.error === "string" ? sp.error : ""
  const transitions = NEXT_STATUS[order.status]

  return (
    <div className="page py-8">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="section-title">{order.order_number}</h1>
        <StatusBadge kind="order" status={order.status} />
        <p className="text-muted">{formatWhen(order.created_at)}</p>
      </header>

      <p className="mt-3">
        <Link href="/admin/orders" className="btn btn-ghost btn-sm">
          Back to orders
        </Link>
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="card">
          <h2 className="border-b border-line px-5 py-4 text-xl">Items</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Unit price</th>
                  <th scope="col">Line total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.quantity}</td>
                    <td className="whitespace-nowrap text-muted">{formatPeso(item.price_cents)}</td>
                    <td className="whitespace-nowrap">
                      <span className="price-tag">{formatPeso(item.price_cents * item.quantity)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="border-b-0 text-right font-semibold text-muted">
                    Subtotal
                  </td>
                  <td className="border-b-0 whitespace-nowrap text-right font-semibold">
                    {formatPeso(order.subtotal_cents)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="border-b-0 text-right font-semibold text-muted">
                    Total
                  </td>
                  <td className="border-b-0 whitespace-nowrap text-right">
                    <span className="price-tag text-lg">{formatPeso(order.total_cents)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="grid content-start gap-6">
          <section className="card">
            <h2 className="border-b border-line px-5 py-4 text-xl">Customer</h2>
            <dl className="grid gap-3 px-5 py-4 text-sm">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="font-medium">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="font-medium">{order.customer_email}</dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <h2 className="border-b border-line px-5 py-4 text-xl">Payment</h2>
            <dl className="grid gap-3 px-5 py-4 text-sm">
              <div>
                <dt className="text-muted">Method</dt>
                <dd className="font-medium">{order.payment_method}</dd>
              </div>
              <div>
                <dt className="text-muted">Reference</dt>
                <dd className="font-medium">{order.payment_ref ?? "Not recorded"}</dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <h2 className="border-b border-line px-5 py-4 text-xl">Update status</h2>
            <div className="px-5 py-4">
              {transitions.length === 0 ? (
                <p className="text-sm text-muted">
                  This order is closed. No further status changes are available.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {transitions.map((next) => (
                    <form key={next} action={updateOrderStatus}>
                      <input type="hidden" name="id" value={order.id} />
                      <input type="hidden" name="status" value={next} />
                      <button type="submit" className={ACTION_LABELS[next].cls}>
                        {ACTION_LABELS[next].label}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
