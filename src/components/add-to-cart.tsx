"use client"

import { useEffect, useState, useTransition } from "react"
import { addToCart, setQuantity as setStoredQuantity } from "@/lib/cart-client"
import { MinusIcon, PlusIcon } from "@/components/icons"

interface Props {
  product: { id: number; name: string; price_cents: number }
  stock: number
  showQuantity?: boolean
}

export function AddToCart({ product, stock, showQuantity = true }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2000)
    return () => clearTimeout(t)
  }, [added])

  const out = stock <= 0

  const add = () => {
    startTransition(() => {
      addToCart({ productId: product.id, name: product.name, priceCents: product.price_cents, quantity })
      setStoredQuantity(product.id, quantity)
      setAdded(true)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showQuantity && !out && (
        <div className="flex items-center rounded-md border border-line bg-white">
          <button
            type="button"
            className="flex h-11 w-10 items-center justify-center text-muted hover:text-forest"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label={`Decrease quantity of ${product.name}`}
          >
            <MinusIcon width={16} height={16} />
          </button>
          <output
            aria-live="polite"
            className="w-8 text-center text-sm font-semibold tabular-nums"
          >
            {quantity}
          </output>
          <button
            type="button"
            className="flex h-11 w-10 items-center justify-center text-muted hover:text-forest"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            aria-label={`Increase quantity of ${product.name}`}
          >
            <PlusIcon width={16} height={16} />
          </button>
        </div>
      )}

      <button
        type="button"
        className="btn btn-accent flex-1 sm:flex-none"
        onClick={add}
        disabled={out || isPending}
      >
        {out ? "Out of stock" : added ? "Added to cart" : "Add to cart"}
      </button>
    </div>
  )
}
