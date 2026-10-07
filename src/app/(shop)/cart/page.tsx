"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  cartTotal,
  readCart,
  removeLine,
  setQuantity,
  subscribeToCart,
  type CartLine,
} from "@/lib/cart-client"
import { formatPeso } from "@/lib/money"
import { ArrowRightIcon, CartIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons"

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  const [lines, setLines] = useState<CartLine[]>([])

  useEffect(() => {
    const sync = () => setLines(readCart())
    setMounted(true)
    sync()
    return subscribeToCart(sync)
  }, [])

  const subtotal = cartTotal(lines)
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <div className="page py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">Your cart</h1>
          <p className="mt-2 text-sm text-muted">
            {!mounted
              ? "Loading your cart…"
              : `${itemCount} ${itemCount === 1 ? "item" : "items"} in the cart`}
          </p>
        </div>
      </div>

      {!mounted ? (
        <div className="card mt-6 h-48 animate-pulse bg-mist" aria-hidden="true" />
      ) : lines.length === 0 ? (
        <div className="card mt-6 px-6 py-12 text-center">
          <CartIcon width={28} height={28} className="mx-auto text-muted" />
          <p className="mt-3 font-display text-xl">Your cart is empty.</p>
          <p className="mt-1 text-sm text-muted">
            Anything you add from the shop shows up here before you pay.
          </p>
          <Link href="/products" className="btn btn-primary mt-5">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="card divide-y divide-line">
            {lines.map((line) => (
              <div key={line.productId} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products?q=${encodeURIComponent(line.name)}`}
                    className="font-semibold hover:text-forest hover:underline"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted">{formatPeso(line.priceCents)} each</p>
                </div>

                <div className="flex items-center rounded-md border border-line bg-white">
                  <button
                    type="button"
                    className="flex h-11 w-10 items-center justify-center text-muted hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={line.quantity <= 1}
                    onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    aria-label={`Decrease quantity of ${line.name}`}
                  >
                    <MinusIcon width={16} height={16} />
                  </button>
                  <output aria-live="polite" className="w-8 text-center text-sm font-semibold tabular-nums">
                    {line.quantity}
                  </output>
                  <button
                    type="button"
                    className="flex h-11 w-10 items-center justify-center text-muted hover:text-forest"
                    onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    aria-label={`Increase quantity of ${line.name}`}
                  >
                    <PlusIcon width={16} height={16} />
                  </button>
                </div>

                <p className="w-28 text-right text-sm font-semibold tabular-nums">
                  {formatPeso(line.priceCents * line.quantity)}
                </p>

                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-mist hover:text-danger"
                  onClick={() => removeLine(line.productId)}
                  aria-label={`Remove ${line.name} from cart`}
                >
                  <TrashIcon width={18} height={18} />
                </button>
              </div>
            ))}
          </div>

          <aside className="card h-fit p-5" aria-label="Cart summary">
            <h2 className="text-xl">Summary</h2>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatPeso(subtotal)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-semibold text-ok">No delivery fee today</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
              <span className="font-semibold">Total</span>
              <span className="price-tag text-2xl">{formatPeso(subtotal)}</span>
            </div>

            <Link href="/checkout" className="btn btn-accent mt-5 w-full">
              Proceed to checkout <ArrowRightIcon width={18} height={18} />
            </Link>
            <Link href="/products" className="btn btn-ghost mt-2 w-full">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}
