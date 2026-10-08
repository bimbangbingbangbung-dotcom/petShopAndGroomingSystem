import Link from "next/link"
import { listProducts } from "@/lib/shop"
import { createProduct } from "@/app/admin/actions/products"
import { ArrowRightIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function NewProductPage({ searchParams }: Props) {
  const sp = await searchParams
  const error = typeof sp.error === "string" ? sp.error : ""
  const categoryList = [...new Set(listProducts({ includeInactive: true }).map((p) => p.category))].sort(
    (a, b) => a.localeCompare(b),
  )

  return (
    <div className="page py-8">
      <header>
        <h1 className="section-title">Add item</h1>
        <p className="mt-2 text-muted">New items appear in the shop as soon as you save them.</p>
      </header>

      {error ? (
        <p
          role="alert"
          className="mt-6 max-w-2xl rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}

      <form action={createProduct} className="mt-6 grid max-w-2xl gap-5">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            className="input"
            required
            placeholder="Premium Adult Dog Food 3kg"
          />
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
            placeholder="Food"
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
            placeholder="What it is, who it is for, and anything a shopper should know."
          />
        </div>

        <div className="field">
          <label htmlFor="image">Picture</label>
          <input
            id="image"
            name="image"
            type="text"
            className="input"
            placeholder="/products/bone-toy.svg"
          />
          <p className="help">
            Optional. A path like /products/bone-toy.svg or a full https:// image URL. Leave it
            blank and the shop shows a tidy category placeholder instead.
          </p>
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
            defaultValue={0}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            value="1"
            defaultChecked
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
