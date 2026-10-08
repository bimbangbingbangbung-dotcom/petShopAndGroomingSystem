"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { getProduct } from "@/lib/shop"
import { firstMessage, productSchema } from "@/lib/validation"

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base || "item"
}

/** Lowercase slug from the name, deduped with -2, -3… against existing rows. */
function uniqueSlug(name: string, excludeId: number | null): string {
  const base = slugify(name)
  const isTaken = (slug: string): boolean => {
    const row =
      excludeId === null
        ? db().prepare("SELECT 1 AS hit FROM products WHERE slug = ?").get(slug)
        : db().prepare("SELECT 1 AS hit FROM products WHERE slug = ? AND id <> ?").get(slug, excludeId)
    return row !== undefined
  }

  let candidate = base
  for (let suffix = 2; isTaken(candidate); suffix += 1) {
    candidate = `${base}-${suffix}`
  }
  return candidate
}

function readForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    active: formData.get("active") === "1" ? 1 : 0,
    image: formData.get("image") ?? "",
  })
}

export async function createProduct(formData: FormData): Promise<void> {
  await requireAdmin()

  const parsed = readForm(formData)
  if (!parsed.success) {
    redirect("/admin/products/new?error=" + encodeURIComponent(firstMessage(parsed.error)))
  }

  db()
    .prepare(
      `INSERT INTO products (name, slug, category, description, price_cents, stock, active, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      parsed.data.name,
      uniqueSlug(parsed.data.name, null),
      parsed.data.category,
      parsed.data.description,
      parsed.data.price,
      parsed.data.stock,
      parsed.data.active,
      parsed.data.image,
    )

  revalidatePath("/admin")
  revalidatePath("/admin/products")
  redirect("/admin/products?saved=1")
}

export async function updateProduct(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = Number(formData.get("id"))
  const existing = Number.isInteger(id) ? getProduct(id) : undefined
  if (!existing) {
    redirect("/admin/products?error=" + encodeURIComponent("That item no longer exists."))
  }

  const parsed = readForm(formData)
  if (!parsed.success) {
    redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent(firstMessage(parsed.error)))
  }

  db()
    .prepare(
      `UPDATE products
         SET name = ?, slug = ?, category = ?, description = ?, price_cents = ?, stock = ?,
             active = ?, image = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
       WHERE id = ?`,
    )
    .run(
      parsed.data.name,
      uniqueSlug(parsed.data.name, id),
      parsed.data.category,
      parsed.data.description,
      parsed.data.price,
      parsed.data.stock,
      parsed.data.active,
      parsed.data.image,
      id,
    )

  revalidatePath("/admin/products")
  redirect(`/admin/products/${id}/edit?saved=1`)
}

/** Soft delete only: items are hidden from the shop, never removed. */
export async function setProductActive(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = Number(formData.get("id"))
  const active = formData.get("active") === "1" ? 1 : 0
  if (!Number.isInteger(id) || !getProduct(id)) {
    redirect("/admin/products?error=" + encodeURIComponent("That item no longer exists."))
  }

  db()
    .prepare(
      "UPDATE products SET active = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
    )
    .run(active, id)

  revalidatePath("/admin")
  revalidatePath("/admin/products")
}
