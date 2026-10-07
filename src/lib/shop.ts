// Retail domain: catalog, checkout, order status. Money math and stock
// decisions live here on the server — the client's prices are advisory.
import { randomBytes } from "node:crypto"
import { db, type Order, type OrderItem, type Product } from "./db"

export interface CartLine {
  productId: number
  quantity: number
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; code: string; message: string; field?: string }

export function listProducts(opts: { category?: string; q?: string; includeInactive?: boolean } = {}): Product[] {
  const where: string[] = []
  const params: unknown[] = []
  if (!opts.includeInactive) where.push("active = 1")
  if (opts.category) {
    where.push("category = ?")
    params.push(opts.category)
  }
  if (opts.q) {
    where.push("(name LIKE ? OR description LIKE ?)")
    params.push(`%${opts.q}%`, `%${opts.q}%`)
  }
  const sql = `SELECT * FROM products ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY name COLLATE NOCASE`
  return db().prepare(sql).all(...params) as Product[]
}

export function categories(): string[] {
  const rows = db()
    .prepare("SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category COLLATE NOCASE")
    .all() as Array<{ category: string }>
  return rows.map((r) => r.category)
}

export function getProduct(id: number): Product | undefined {
  return db().prepare("SELECT * FROM products WHERE id = ?").get(id) as Product | undefined
}

export function getProductBySlug(slug: string): Product | undefined {
  return db().prepare("SELECT * FROM products WHERE slug = ?").get(slug) as Product | undefined
}

function makeOrderNumber(): string {
  const now = new Date()
  const y = String(now.getFullYear()).slice(2)
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const suffix = randomBytes(3).toString("hex").toUpperCase().slice(0, 4)
  return `PC-${y}${m}${d}-${suffix}`
}

/**
 * Validate, reprice and take payment in one transaction:
 * stock check → decrement → order(paid) → items → transaction row.
 * Never trusts client-side prices (fullstack.md: server-side domain logic).
 */
export function checkout(input: {
  userId: number
  customerName: string
  customerEmail: string
  lines: CartLine[]
  paymentMethod: "card" | "e_wallet" | "cod"
}): ActionResult<{ order: Order; items: OrderItem[] }> {
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    return { ok: false, code: "empty_cart", message: "Your cart is empty." }
  }
  for (const line of input.lines) {
    if (!Number.isInteger(line.productId) || !Number.isInteger(line.quantity)) {
      return { ok: false, code: "invalid_line", message: "That cart line is not valid." }
    }
    if (line.quantity < 1 || line.quantity > 99) {
      return { ok: false, code: "invalid_quantity", message: "Quantity must be between 1 and 99." }
    }
  }

  const run = db().transaction((): ActionResult<{ order: Order; items: OrderItem[] }> => {
    let subtotal = 0
    const resolved: Array<{ product: Product; quantity: number }> = []

    for (const line of input.lines) {
      const product = db()
        .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
        .get(line.productId) as Product | undefined
      if (!product) {
        return { ok: false, code: "product_missing", message: "An item in your cart is no longer available." }
      }
      if (product.stock < line.quantity) {
        return {
          ok: false,
          code: "out_of_stock",
          message: `Only ${product.stock} left of “${product.name}”.`,
          field: "stock",
        }
      }
      subtotal += product.price_cents * line.quantity
      resolved.push({ product, quantity: line.quantity })
    }

    const orderNumber = makeOrderNumber()
    const paymentRef = `pay_${randomBytes(8).toString("hex")}`
    const methodLabel = { card: "Card", e_wallet: "E-wallet", cod: "Cash on delivery" }[input.paymentMethod]

    const insertOrder = db().prepare(
      `INSERT INTO orders
         (order_number, user_id, status, subtotal_cents, total_cents, payment_method, payment_ref,
          customer_name, customer_email)
       VALUES (?, ?, 'paid', ?, ?, ?, ?, ?, ?)`,
    )
    const info = insertOrder.run(
      orderNumber,
      input.userId,
      subtotal,
      subtotal,
      methodLabel,
      paymentRef,
      input.customerName.trim(),
      input.customerEmail.trim().toLowerCase(),
    )
    const orderId = Number(info.lastInsertRowid)

    const insertItem = db().prepare(
      `INSERT INTO order_items (order_id, product_id, name, price_cents, quantity) VALUES (?, ?, ?, ?, ?)`,
    )
    const decrementStock = db().prepare(
      "UPDATE products SET stock = stock - ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
    )
    for (const { product, quantity } of resolved) {
      insertItem.run(orderId, product.id, product.name, product.price_cents, quantity)
      decrementStock.run(quantity, product.id)
    }

    db()
      .prepare(
        `INSERT INTO transactions (kind, reference, user_id, customer_name, amount_cents, method, status)
         VALUES ('shop', ?, ?, ?, ?, ?, 'paid')`,
      )
      .run(orderNumber, input.userId, input.customerName.trim(), subtotal, methodLabel)

    const order = db().prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Order
    const items = db().prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId) as OrderItem[]
    return { ok: true, data: { order, items } }
  })

  try {
    return run()
  } catch (error) {
    console.error("[checkout]", error)
    return { ok: false, code: "server_error", message: "We could not complete your order. Please try again." }
  }
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  return db().prepare("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) as Order | undefined
}

export function getOrderItems(orderId: number): OrderItem[] {
  return db().prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId) as OrderItem[]
}

export function listOrdersForUser(userId: number): Order[] {
  return db()
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Order[]
}

export function listAllOrders(opts: { status?: string } = {}): Array<Order & { item_count: number }> {
  const where = opts.status ? "WHERE o.status = ?" : ""
  const params = opts.status ? [opts.status] : []
  return db()
    .prepare(
      `SELECT o.*, (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id = o.id) AS item_count
       FROM orders o ${where} ORDER BY o.created_at DESC`,
    )
    .all(...params) as Array<Order & { item_count: number }>
}

/** Admin status transition. Cancelling restocks the items it already took. */
export function setOrderStatus(orderId: number, status: Order["status"]): ActionResult {
  const order = getOrderById(orderId)
  if (!order) return { ok: false, code: "not_found", message: "Order not found." }

  const allowed: Record<string, string[]> = {
    pending: ["paid", "cancelled"],
    paid: ["fulfilled", "cancelled"],
    fulfilled: [],
    cancelled: ["pending"],
  }
  if (!allowed[order.status].includes(status)) {
    return {
      ok: false,
      code: "invalid_transition",
      message: `An order marked “${order.status}” cannot move to “${status}”.`,
    }
  }

  db().transaction(() => {
    if (status === "cancelled" && order.status === "paid") {
      for (const item of getOrderItems(orderId)) {
        if (item.product_id) {
          db().prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(item.quantity, item.product_id)
        }
      }
      db()
        .prepare("UPDATE transactions SET status = 'refunded' WHERE reference = ? AND status = 'paid'")
        .run(order.order_number)
    }
    db()
      .prepare("UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
      .run(status, orderId)
  })()

  return { ok: true }
}

export function getOrderById(orderId: number): Order | undefined {
  return db().prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Order | undefined
}
