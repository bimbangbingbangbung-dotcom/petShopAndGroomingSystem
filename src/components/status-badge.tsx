import type { AppointmentStatus, OrderStatus } from "@/lib/db"

const ORDER: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Awaiting payment", cls: "badge-warn" },
  paid: { label: "Paid", cls: "badge-info" },
  fulfilled: { label: "Fulfilled", cls: "badge-ok" },
  cancelled: { label: "Cancelled", cls: "badge-danger" },
}

const APPOINTMENT: Record<AppointmentStatus, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "badge-warn" },
  confirmed: { label: "Confirmed", cls: "badge-info" },
  completed: { label: "Completed", cls: "badge-ok" },
  cancelled: { label: "Cancelled", cls: "badge-danger" },
}

const TRANSACTION: Record<string, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "badge-ok" },
  refunded: { label: "Refunded", cls: "badge-danger" },
}

/** Status is always text + colour, never colour alone (ui.md priority 1). */
export function StatusBadge({
  kind,
  status,
}: {
  kind: "order" | "appointment" | "transaction"
  status: string
}) {
  const source =
    kind === "order" ? ORDER : kind === "appointment" ? APPOINTMENT : TRANSACTION
  const entry = (source as Record<string, { label: string; cls: string }>)[status]
  if (!entry) return <span className="badge badge-muted">{status}</span>
  return <span className={`badge ${entry.cls}`}>{entry.label}</span>
}
