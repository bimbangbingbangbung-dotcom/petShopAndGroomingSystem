import Link from "next/link"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { getOrderByNumber, getOrderItems } from "@/lib/shop"
import { formatPeso } from "@/lib/money"
import { StatusBadge } from "@/components/status-badge"
import { ClearCartOnReceipt } from "@/components/clear-cart"
import { ArrowRightIcon, ReceiptIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ placed?: string }>
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function ReceiptPage({ params, searchParams }: Props) {
  const user = await requireUser()
  const { orderNumber } = await params
  const { placed } = await searchParams

  const order = getOrderByNumber(orderNumber)
  if (!order || order.user_id !== user.id) notFound()

  const items = getOrderItems(order.id)

  return (
    <div className="page max-w-3xl py-10">
      {placed === "1" && (
        <div className="rounded-md border border-ok/30 bg-ok-bg px-4 py-4">
          <ClearCartOnReceipt />
          <p className="font-display text-lg font-semibold text-ok">
            Order {order.order_number} is placed.
          </p>
          <p className="mt-1 text-sm text-ink">
            Your receipt below stays with your account. Track the status any time from your
            orders page.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 no-print">
            <Link href="/orders" className="btn btn-primary btn-sm">
              View my orders
            </Link>
            <Link href="/products" className="btn btn-ghost btn-sm">
              Keep shopping
            </Link>
          </div>
        </div>
      )}

      <div className="card mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 eyebrow">
              <ReceiptIcon width={16} height={16} /> Receipt
            </p>
            <h1 className="mt-1 text-3xl">{order.order_number}</h1>
            <p className="mt-2 text-sm text-muted">
              {shortDate(order.created_at)} · {order.payment_method}
            </p>
          </div>
          <StatusBadge kind="order" status={order.status} />
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold">Billed to</p>
          <p className="mt-1 text-sm text-ink">{order.customer_name}</p>
          <p className="text-sm text-muted">{order.customer_email}</p>
        </div>

        <div className="table-wrap mt-6">
          <table className="table">
            <caption className="sr-only">Items on order {order.order_number}</caption>
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

        <div className="mt-6 flex flex-col items-end gap-2">
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

        <p className="help mt-6">
          Use your browser&apos;s print dialog (Ctrl+P) to save this receipt as PDF.
        </p>

        <div className="mt-5 flex flex-wrap gap-3 no-print">
          <Link href={`/orders/${order.order_number}`} className="btn btn-primary">
            Order status <ArrowRightIcon width={18} height={18} />
          </Link>
          <Link href="/orders" className="btn btn-ghost">
            All orders
          </Link>
          <Link href="/products" className="btn btn-ghost">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
