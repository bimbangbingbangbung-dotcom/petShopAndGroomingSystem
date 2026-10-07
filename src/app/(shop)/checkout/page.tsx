"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { placeOrder } from "@/app/(shop)/actions/checkout"
import { cartTotal, readCart, subscribeToCart, type CartLine } from "@/lib/cart-client"
import { formatPeso } from "@/lib/money"

const PAYMENT_OPTIONS = [
  {
    value: "card",
    label: "Card",
    help: "Credit or debit card, charged as soon as you place the order.",
  },
  {
    value: "e_wallet",
    label: "E-wallet",
    help: "GCash, Maya and other Philippine wallets.",
  },
  {
    value: "cod",
    label: "Cash on delivery",
    help: "Pay the rider when your order arrives.",
  },
] as const

export default function CheckoutPage() {
  const [state, action, pending] = useActionState(placeOrder, undefined)
  const [mounted, setMounted] = useState(false)
  const [lines, setLines] = useState<CartLine[]>([])

  useEffect(() => {
    const sync = () => setLines(readCart())
    setMounted(true)
    sync()
    return subscribeToCart(sync)
  }, [])

  const errors = state?.fieldErrors
  const total = cartTotal(lines)
  const linePayload = JSON.stringify(
    lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
  )

  if (mounted && lines.length === 0) {
    return (
      <div className="page py-12">
        <div className="card mx-auto max-w-lg px-6 py-12 text-center">
          <h1 className="text-2xl">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted">
            Add food, toys or care items, then come back here to pay.
          </p>
          <Link href="/products" className="btn btn-primary mt-5">
            Browse the shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page py-10">
      <div className="max-w-2xl">
        <h1 className="section-title">Checkout</h1>
        <p className="mt-2 text-muted">
          Confirm where your order goes, pick how you&apos;ll pay, and we&apos;ll price everything
          from the shelf before anything is charged.
        </p>
      </div>

      <form action={action} className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5 sm:p-6">
          <input type="hidden" name="lines" value={linePayload} />

          <h2 className="text-xl">Your details</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div className="field">
              <label htmlFor="customerName">Name for this order</label>
              <input
                id="customerName"
                name="customerName"
                type="text"
                autoComplete="name"
                required
                className="input"
                aria-invalid={errors?.customerName ? true : undefined}
                aria-describedby={errors?.customerName ? "customerName-error" : undefined}
              />
              {errors?.customerName && (
                <p id="customerName-error" className="field-error">
                  {errors.customerName}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="customerEmail">Email for the receipt</label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                autoComplete="email"
                required
                className="input"
                aria-invalid={errors?.customerEmail ? true : undefined}
                aria-describedby={
                  errors?.customerEmail ? "customerEmail-error" : "customerEmail-help"
                }
              />
              <p id="customerEmail-help" className="help">
                Use the email on your account.
              </p>
              {errors?.customerEmail && (
                <p id="customerEmail-error" className="field-error">
                  {errors.customerEmail}
                </p>
              )}
            </div>
          </div>

          <fieldset className="mt-6 border-t border-line pt-5">
            <legend className="text-sm font-semibold text-ink">Payment method</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-forest has-[:checked]:bg-mist"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    required
                    className="mt-1 h-5 w-5 shrink-0 accent-forest"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{option.help}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors?.paymentMethod && <p className="field-error mt-2">{errors.paymentMethod}</p>}
          </fieldset>
        </div>

        <aside className="card h-fit p-5 sm:p-6" aria-label="Order summary">
          <h2 className="text-xl">Your order</h2>

          {!mounted ? (
            <p className="help mt-4">Loading your cart…</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {lines.map((line) => (
                <li key={line.productId} className="flex items-start justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{line.name}</span>
                    <span className="block text-xs text-muted">
                      {line.quantity} × {formatPeso(line.priceCents)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatPeso(line.priceCents * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold tabular-nums">{formatPeso(total)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-semibold text-ok">No delivery fee today</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
            <span className="font-semibold">Total</span>
            <span className="price-tag text-2xl">{formatPeso(total)}</span>
          </div>

          {state?.error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-accent mt-5 w-full"
            disabled={pending || !mounted || lines.length === 0}
          >
            {pending ? "Placing your order…" : `Pay ${formatPeso(total)}`}
          </button>

          <p className="help mt-3">
            The server checks stock and prices before anything is charged, so the total you see
            here is the total you pay.
          </p>

          <Link href="/cart" className="btn btn-ghost mt-3 w-full">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  )
}
