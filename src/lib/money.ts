// Money is stored and computed as integer centavos everywhere (never floats).
// Display format is Philippine peso.

export function formatPeso(cents: number): string {
  const pesos = cents / 100
  return `₱${pesos.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPesoWhole(cents: number): string {
  if (cents % 100 === 0) {
    return `₱${(cents / 100).toLocaleString("en-PH")}`
  }
  return formatPeso(cents)
}

/** Parse a peso input like "1,234.50" or "350" into centavos. Returns null when invalid. */
export function parsePeso(input: string): number | null {
  const cleaned = input.replace(/[₱,\s]/g, "")
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const [pesos, fraction = ""] = cleaned.split(".")
  const centavos = `${fraction.padEnd(2, "0")}`
  return Number(pesos) * 100 + Number(centavos)
}
