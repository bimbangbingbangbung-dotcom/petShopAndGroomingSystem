import Link from "next/link"
import { listProducts } from "@/lib/shop"
import { formatPeso } from "@/lib/money"
import { setProductActive } from "@/app/admin/actions/products"
import { PlusIcon } from "@/components/icons"
import { ProductImage } from "@/components/product-image"
import { ConfirmButton } from "@/components/confirm-button"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ category?: string; showHidden?: string; error?: string; saved?: string }>
}

function stockBadgeClass(stock: number): string {
  if (stock === 0) return "badge badge-danger"
  if (stock <= 5) return "badge badge-warn"
  return "badge badge-ok"
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams
  const category = typeof sp.category === "string" ? sp.category : ""
  const showHidden = sp.showHidden === "1"
  const error = typeof sp.error === "string" ? sp.error : ""
  const saved = sp.saved === "1"

  const all = listProducts({ includeInactive: true })
  const categoryList = [...new Set(all.map((product) => product.category))].sort((a, b) =>
    a.localeCompare(b),
  )
  const products = all.filter(
    (product) =>
      (showHidden || product.active === 1) && (!category || product.category === category),
  )

  return (
    <div className="page py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Items</h1>
          <p className="mt-2 text-muted">
            {products.length} {products.length === 1 ? "item" : "items"}
            {category ? ` in ${category}` : ""}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-accent">
          <PlusIcon width={18} height={18} /> Add item
        </Link>
      </header>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-6 rounded-md border border-ok/30 bg-ok-bg px-4 py-3 text-sm font-medium text-ok">
          Item saved.
        </p>
      ) : null}

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="field w-full sm:w-56">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" className="select" defaultValue={category}>
            <option value="">All categories</option>
            {categoryList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pb-2.5">
          <input
            id="showHidden"
            name="showHidden"
            type="checkbox"
            value="1"
            defaultChecked={showHidden}
            className="h-4 w-4 accent-forest"
          />
          <label htmlFor="showHidden" className="text-sm font-semibold">
            Show hidden items
          </label>
        </div>
        <button type="submit" className="btn btn-ghost">
          Apply filter
        </button>
      </form>

      {products.length === 0 ? (
        <div className="card mt-6 px-6 py-10 text-center">
          <p className="font-display text-lg">
            {category || showHidden ? "No items match this filter." : "No items on the shelves yet."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {category || showHidden
              ? "Change the category or show hidden items, or add a new item."
              : "Add your first item to start filling the shop."}
          </p>
        </div>
      ) : (
        <div className="table-wrap mt-6">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="block h-10 w-14 shrink-0 overflow-hidden rounded border border-line"
                      >
                        <ProductImage
                          name={product.name}
                          category={product.category}
                          image={product.image}
                          compact
                        />
                      </span>
                      <span>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="font-medium text-forest hover:underline"
                        >
                          {product.name}
                        </Link>
                        {product.active === 0 ? (
                          <span className="block text-xs text-muted">Hidden from the shop</span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-muted">{product.category}</td>
                  <td className="whitespace-nowrap">
                    <span className="price-tag">{formatPeso(product.price_cents)}</span>
                  </td>
                  <td>
                    <span className={stockBadgeClass(product.stock)}>{product.stock} left</span>
                  </td>
                  <td>
                    {product.active === 1 ? (
                      <span className="badge badge-ok">Active</span>
                    ) : (
                      <span className="badge badge-muted">Hidden</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="btn btn-ghost btn-sm"
                      >
                        Edit
                      </Link>
                      <form action={setProductActive}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="active" value={product.active === 1 ? "0" : "1"} />
                        {product.active === 1 ? (
                          <ConfirmButton
                            message={`Delete "${product.name}" from the shop? It stops appearing to customers. You can restore it later from "Show hidden items".`}
                            className="btn btn-ghost btn-sm"
                          >
                            Delete
                          </ConfirmButton>
                        ) : (
                          <button type="submit" className="btn btn-ghost btn-sm">
                            Restore
                          </button>
                        )}
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
