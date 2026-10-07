import Link from "next/link"
import { notFound } from "next/navigation"
import { getProduct, listProducts } from "@/lib/shop"
import { updateProduct } from "@/app/admin/actions/products"
import { ArrowRightIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id: rawId } = await params
  const sp = await searchParams
  const productId = Number(rawId)
  const product = Number.isInteger(productId) ? getProduct(productId) : undefined
  if (!product) notFound()

  const error = typeof sp.error === "string" ? sp.error : ""
  const saved = sp.saved === "1"
  const categoryList = [...new Set(listProducts({ includeInactive: true }).map((p) => p.category))].sort(
    (a, b) => a.localeCompare(b),
  )

  return (
    <div className="page py-8">
      <header>
        <h1 className="section-title">Edit item</h1>
        <p className="mt-2 text-muted">{product.name}</p>
      </header>

      {error ? (
        <p
          role="alert"
          className="mt-6 max-w-2xl rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-6 max-w-2xl rounded-md border border-ok/30 bg-ok-bg px-4 py-3 text-sm font-medium text-ok">
          Item saved.
        </p>
      ) : null}

      <form action={updateProduct} className="mt-6 grid max-w-2xl gap-5">
        <input type="hidden" name="id" value={product.id} />

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" className="input" required defaultValue={product.name} />
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            name="category"
            type="text"
            className="input"
            list="product-categories"
            required
            defaultValue={product.category}
          />
          <datalist id="product-categories">
            {categoryList.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <p className="help">Pick an existing category or type a new one.</p>
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className="textarea"
            rows={4}
            defaultValue={product.description}
          />
        </div>

        <div className="field">
          <label htmlFor="price">Price</label>
          <input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            className="input"
            required
            placeholder="125.00"
            defaultValue={(product.price_cents / 100).toFixed(2)}
          />
          <p className="help">In Philippine peso.</p>
        </div>

        <div className="field">
          <label htmlFor="stock">Stock on hand</label>
          <input
            id="stock"
            name="stock"
            type="number"
            min={0}
            step={1}
            className="input"
            required
            defaultValue={product.stock}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            value="1"
            defaultChecked={product.active === 1}
            className="h-4 w-4 accent-forest"
          />
          <label htmlFor="active" className="text-sm font-semibold">
            Visible in the shop
          </label>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-line pt-5">
          <button type="submit" className="btn btn-primary">
            Save item
          </button>
          <Link href="/admin/products" className="btn btn-ghost">
            <ArrowRightIcon width={18} height={18} className="rotate-180" /> Back to items
          </Link>
        </div>
      </form>
    </div>
  )
}
