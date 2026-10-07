import Link from "next/link"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { getOrderByNumber, getOrderItems } from "@/lib/shop"
import { formatPeso } from "@/lib/money"
import { StatusBadge } from "@/components/status-badge"
import { ArrowRightIcon, CheckIcon, ClockIcon, ReceiptIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ orderNumber: string }>
}

const STEPS = [
  {
    key: "pending",
    title: "Order placed",
    help: "We have your order and the items set aside.",
  },
  {
    key: "paid",
    title: "Payment confirmed",
    help: "Payment received with your chosen method.",
  },
  {
    key: "fulfilled",
    title: "Fulfilled",
    help: "Handed to the rider or ready for pickup.",
  },
] as const

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function OrderPage({ params }: Props) {
  const user = await requireUser()
  const { orderNumber } = await params

  const order = getOrderByNumber(orderNumber)
  if (!order || order.user_id !== user.id) notFound()

  const items = getOrderItems(order.id)
  const currentIndex = STEPS.findIndex((step) => step.key === order.status)
  const activeIndex = currentIndex === -1 ? STEPS.length - 1 : currentIndex

  return (
    <div className="page py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/orders" className="font-semibold text-forest hover:underline">
          Your orders
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{order.order_number}</span>
      </nav>

      <div className="card mt-5 flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <h1 className="text-3xl">{order.order_number}</h1>
          <p className="mt-2 text-sm text-muted">
            {shortDate(order.created_at)} · {order.payment_method}
            {order.payment_ref ? (
              <>
                {" "}
                · <span className="font-mono text-xs">{order.payment_ref}</span>
              </>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-muted">
            {order.customer_name} · {order.customer_email}
          </p>
        </div>
        <StatusBadge kind="order" status={order.status} />
      </div>

      <section className="mt-8" aria-label="Order progress">
        <h2 className="text-xl">Where your order is</h2>
        {order.status === "cancelled" ? (
          <div className="card mt-3 p-5">
            <p className="font-semibold">This order was cancelled.</p>
            <p className="help mt-1">
              The items went back on the shelf — nothing more will happen to this order. Start a
              new one whenever you like.
            </p>
            <Link href="/products" className="btn btn-primary mt-4">
              Browse the shop
            </Link>
          </div>
        ) : (
          <ol className="mt-3 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const done = order.status === "fulfilled" || index < activeIndex
              const current = index === activeIndex && order.status !== "fulfilled"
              return (
                <li
                  key={step.key}
                  className="card p-4"
                  aria-current={current ? "step" : undefined}
                >
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm text-muted">{step.help}</p>
                  <p className="mt-3">
                    {done ? (
                      <span className="badge badge-ok">
                        <CheckIcon width={12} height={12} /> Done
                      </span>
                    ) : current ? (
                      <span className="badge badge-info">
                        <ClockIcon width={12} height={12} /> Current step
                      </span>
                    ) : (
                      <span className="badge badge-muted">Waiting</span>
                    )}
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="mt-8" aria-label="Order items">
        <h2 className="text-xl">What you ordered</h2>
        <div className="table-wrap mt-3">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="text-right">
                  Qty
                </th>
                <th scope="col" className="text-right">
                  Price
                </th>
                <th scope="col" className="text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="text-right tabular-nums">{item.quantity}</td>
                  <td className="text-right tabular-nums">{formatPeso(item.price_cents)}</td>
                  <td className="text-right font-semibold tabular-nums">
                    {formatPeso(item.price_cents * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col items-end gap-2">
          <div className="flex w-full max-w-xs items-baseline justify-between gap-6 text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold tabular-nums">{formatPeso(order.subtotal_cents)}</span>
          </div>
          <div className="flex w-full max-w-xs items-baseline justify-between gap-6 text-sm">
            <span className="text-muted">Delivery</span>
            <span className="font-semibold text-ok">No delivery fee today</span>
          </div>
          <div className="flex w-full max-w-xs items-baseline justify-between gap-6 border-t border-line pt-3">
            <span className="font-semibold">Total</span>
            <span className="price-tag text-2xl">{formatPeso(order.total_cents)}</span>
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/receipt/${order.order_number}`} className="btn btn-primary">
          <ReceiptIcon width={18} height={18} /> View receipt
        </Link>
        <Link href="/orders" className="btn btn-ghost">
          All orders
        </Link>
        <Link href="/products" className="btn btn-ghost">
          Continue shopping <ArrowRightIcon width={18} height={18} />
        </Link>
      </div>
    </div>
  )
}
