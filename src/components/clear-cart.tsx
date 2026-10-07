"use client"

import { useEffect } from "react"
import { clearCart } from "@/lib/cart-client"

/**
 * Empties the local cart once an order receipt with ?placed=1 is on screen.
 * The server has already taken the stock and recorded the payment at this
 * point, so the browser cart must not linger and invite a double order.
 */
export function ClearCartOnReceipt() {
  useEffect(() => {
    clearCart()
  }, [])
  return null
}
