import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { getOrderItems, listOrdersForUser } from "@/lib/shop"
import { formatPeso } from "@/lib/money"
import { StatusBadge } from "@/components/status-badge"
import { ArrowRightIcon, BoxIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function OrdersPage() {
  const user = await requireUser()
  const orders = listOrdersForUser(user.id)

  return (
    <div className="page py-10">
      <div className="max-w-2xl">
        <h1 className="section-title">Your orders</h1>
        <p className="mt-2 text-muted">
          Every order keeps its number, receipt and status. Signed in as {user.email}.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="card mt-6 px-6 py-12 text-center">
          <BoxIcon width={28} height={28} className="mx-auto text-muted" />
          <p className="mt-3 font-display text-xl">No orders yet.</p>
          <p className="mt-1 text-sm text-muted">
            When you buy something from the shop, it shows up here with its receipt.
          </p>
          <Link href="/products" className="btn btn-primary mt-5">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {orders.map((order) => {
            const items = getOrderItems(order.id)
            const count = items.reduce((sum, item) => sum + item.quantity, 0)
            return (
              <article key={order.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/orders/${order.order_number}`}
                    className="font-display text-lg font-semibold text-forest hover:underline"
                  >
                    {order.order_number}
                  </Link>
                  <StatusBadge kind="order" status={order.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {shortDate(order.created_at)} · {count} {count === 1 ? "item" : "items"}
                </p>
                <p className="mt-3 price-tag text-xl">{formatPeso(order.total_cents)}</p>
                <Link
                  href={`/orders/${order.order_number}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
                >
                  View order <ArrowRightIcon width={16} height={16} />
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
