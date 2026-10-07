// Reporting: admin dashboard numbers, transaction history and the sales report.
// Every figure is aggregated in SQL from the transactions/order tables.
import { db } from "./db"

export interface TransactionRow {
  id: number
  kind: "shop" | "grooming"
  reference: string
  customer_name: string
  amount_cents: number
  method: string
  status: "paid" | "refunded"
  created_at: string
}

export interface DayBucket {
  date: string
  shop_cents: number
  grooming_cents: number
  transactions: number
}

export interface SalesReport {
  from: string
  to: string
  shop_cents: number
  grooming_cents: number
  total_cents: number
  refunded_cents: number
  order_count: number
  appointment_count: number
  by_day: DayBucket[]
  top_products: Array<{ name: string; quantity: number; revenue_cents: number }>
  by_method: Array<{ method: string; amount_cents: number }>
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function todayISO(): string {
  return isoDay(new Date())
}

export function daysAgoISO(days: number): string {
  return isoDay(new Date(Date.now() - days * 86_400_000))
}

export function adminStats() {
  const q = <T>(sql: string, ...params: unknown[]): T => db().prepare(sql).get(...params) as T

  const today = todayISO()
  return {
    revenue_today: q<{ v: number }>(
      "SELECT COALESCE(SUM(amount_cents),0) AS v FROM transactions WHERE status = 'paid' AND substr(created_at,1,10) = ?",
      today,
    ).v,
    revenue_month: q<{ v: number }>(
      "SELECT COALESCE(SUM(amount_cents),0) AS v FROM transactions WHERE status = 'paid' AND substr(created_at,1,7) = ?",
      today.slice(0, 7),
    ).v,
    orders_open: q<{ v: number }>(
      "SELECT COUNT(*) AS v FROM orders WHERE status IN ('pending','paid')",
    ).v,
    orders_total: q<{ v: number }>("SELECT COUNT(*) AS v FROM orders").v,
    appointments_today: q<{ v: number }>(
      "SELECT COUNT(*) AS v FROM appointments WHERE preferred_date = ? AND status IN ('requested','confirmed')",
      today,
    ).v,
    appointments_open: q<{ v: number }>(
      "SELECT COUNT(*) AS v FROM appointments WHERE status IN ('requested','confirmed')",
    ).v,
    low_stock: q<{ v: number }>(
      "SELECT COUNT(*) AS v FROM products WHERE active = 1 AND stock <= 5",
    ).v,
    products: q<{ v: number }>("SELECT COUNT(*) AS v FROM products WHERE active = 1").v,
    customers: q<{ v: number }>("SELECT COUNT(*) AS v FROM users WHERE role = 'customer'").v,
  }
}

export function listTransactions(opts: { kind?: "shop" | "grooming"; from?: string; to?: string; limit?: number } = {}): TransactionRow[] {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.kind) {
    where.push("kind = ?")
    params.push(opts.kind)
  }
  if (opts.from) {
    where.push("substr(created_at,1,10) >= ?")
    params.push(opts.from)
  }
  if (opts.to) {
    where.push("substr(created_at,1,10) <= ?")
    params.push(opts.to)
  }
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 1000)
  const sql = `SELECT id, kind, reference, customer_name, amount_cents, method, status, created_at
               FROM transactions
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY created_at DESC LIMIT ?`
  return db().prepare(sql).all(...params, limit) as TransactionRow[]
}

export function salesReport(from: string, to: string): SalesReport {
  const d = db()

  const totals = d
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN kind = 'shop'        AND status = 'paid' THEN amount_cents END), 0) AS shop,
         COALESCE(SUM(CASE WHEN kind = 'grooming'    AND status = 'paid' THEN amount_cents END), 0) AS grooming,
         COALESCE(SUM(CASE WHEN status = 'refunded'  THEN amount_cents END), 0) AS refunded
       FROM transactions WHERE substr(created_at,1,10) BETWEEN ? AND ?`,
    )
    .get(from, to) as { shop: number; grooming: number; refunded: number }

  const orderCount = d
    .prepare(
      "SELECT COUNT(*) AS v FROM orders WHERE status IN ('paid','fulfilled') AND substr(created_at,1,10) BETWEEN ? AND ?",
    )
    .get(from, to) as { v: number }

  const appointmentCount = d
    .prepare(
      "SELECT COUNT(*) AS v FROM appointments WHERE status IN ('requested','confirmed','completed') AND substr(created_at,1,10) BETWEEN ? AND ?",
    )
    .get(from, to) as { v: number }

  const rawDays = d
    .prepare(
      `SELECT substr(created_at,1,10) AS date,
              SUM(CASE WHEN kind = 'shop'     THEN amount_cents ELSE 0 END) AS shop_cents,
              SUM(CASE WHEN kind = 'grooming' THEN amount_cents ELSE 0 END) AS grooming_cents,
              COUNT(*) AS transactions
       FROM transactions
       WHERE status = 'paid' AND substr(created_at,1,10) BETWEEN ? AND ?
       GROUP BY date ORDER BY date`,
    )
    .all(from, to) as Array<{ date: string; shop_cents: number; grooming_cents: number; transactions: number }>

  // Fill every day in range so the chart has a continuous x-axis.
  const byDay: DayBucket[] = []
  const map = new Map(rawDays.map((row) => [row.date, row]))
  for (let t = new Date(`${from}T00:00:00Z`).getTime(); t <= new Date(`${to}T00:00:00Z`).getTime(); t += 86_400_000) {
    const date = isoDay(new Date(t))
    const row = map.get(date)
    byDay.push(
      row ?? { date, shop_cents: 0, grooming_cents: 0, transactions: 0 },
    )
    if (byDay.length > 370) break
  }

  const topProducts = d
    .prepare(
      `SELECT oi.name AS name, SUM(oi.quantity) AS quantity, SUM(oi.quantity * oi.price_cents) AS revenue_cents
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status IN ('paid','fulfilled') AND substr(o.created_at,1,10) BETWEEN ? AND ?
       GROUP BY oi.name ORDER BY revenue_cents DESC LIMIT 5`,
    )
    .all(from, to) as Array<{ name: string; quantity: number; revenue_cents: number }>

  const byMethod = d
    .prepare(
      `SELECT method, SUM(amount_cents) AS amount_cents
       FROM transactions WHERE status = 'paid' AND substr(created_at,1,10) BETWEEN ? AND ?
       GROUP BY method ORDER BY amount_cents DESC`,
    )
    .all(from, to) as Array<{ method: string; amount_cents: number }>

  return {
    from,
    to,
    shop_cents: totals.shop,
    grooming_cents: totals.grooming,
    total_cents: totals.shop + totals.grooming,
    refunded_cents: totals.refunded,
    order_count: orderCount.v,
    appointment_count: appointmentCount.v,
    by_day: byDay,
    top_products: topProducts,
    by_method: byMethod,
  }
}
