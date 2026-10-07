"use client"

// Client-side cart cache. Prices here are advisory only — the server
// reprices every line from the database at checkout.
export interface CartLine {
  productId: number
  name: string
  priceCents: number
  quantity: number
}

const KEY = "pc_cart_v1"
const EVENT = "pc-cart-changed"

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartLine[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l) =>
        typeof l.productId === "number" &&
        typeof l.name === "string" &&
        typeof l.priceCents === "number" &&
        typeof l.quantity === "number",
    )
  } catch {
    return []
  }
}

function writeCart(lines: CartLine[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(lines))
  window.dispatchEvent(new Event(EVENT))
}

export function addToCart(line: { productId: number; name: string; priceCents: number; quantity?: number }): void {
  const lines = readCart()
  const existing = lines.find((l) => l.productId === line.productId)
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + (line.quantity ?? 1))
  } else {
    lines.push({ ...line, quantity: Math.min(99, line.quantity ?? 1) })
  }
  writeCart(lines)
}

export function setQuantity(productId: number, quantity: number): void {
  const lines = readCart()
  const line = lines.find((l) => l.productId === productId)
  if (!line) return
  if (quantity < 1) {
    writeCart(lines.filter((l) => l.productId !== productId))
    return
  }
  line.quantity = Math.min(99, quantity)
  writeCart(lines)
}

export function removeLine(productId: number): void {
  writeCart(readCart().filter((l) => l.productId !== productId))
}

export function clearCart(): void {
  writeCart([])
}

export function cartCount(lines?: CartLine[]): number {
  return (lines ?? readCart()).reduce((sum, l) => sum + l.quantity, 0)
}

export function cartTotal(lines?: CartLine[]): number {
  return (lines ?? readCart()).reduce((sum, l) => sum + l.priceCents * l.quantity, 0)
}

export function subscribeToCart(fn: () => void): () => void {
  const handler = () => fn()
  window.addEventListener(EVENT, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}
