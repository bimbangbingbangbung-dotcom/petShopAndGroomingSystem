import Link from "next/link"
import { categories, listProducts } from "@/lib/shop"
import { ProductCard } from "@/components/product-card"
import { SearchIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const query = (params.q ?? "").trim()
  const category = params.category ?? ""

  const products = listProducts({
    q: query || undefined,
    category: category || undefined,
  })
  const cats = categories()

  function chipHref(cat?: string): string {
    const search = new URLSearchParams()
    if (cat) search.set("category", cat)
    if (query) search.set("q", query)
    const qs = search.toString()
    return qs ? `/products?${qs}` : "/products"
  }

  return (
    <div className="page py-10">
      <div className="max-w-2xl">
        <h1 className="section-title">All products</h1>
        <p className="mt-2 text-muted">
          Food, toys, care and accessories for dogs and cats. Every price is in peso.
        </p>
      </div>

      <form method="GET" action="/products" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          Search products
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search food, toys, care…"
          className="input"
        />
        {category && <input type="hidden" name="category" value={category} />}
        <button type="submit" className="btn btn-primary sm:w-auto">
          <SearchIcon width={18} height={18} /> Search
        </button>
      </form>

      <nav aria-label="Categories" className="mt-5 flex flex-wrap gap-2">
        <Link
          href={chipHref()}
          className={`badge ${category ? "badge-muted hover:border-forest hover:text-forest" : "border-forest bg-forest text-white"}`}
          aria-current={category ? undefined : "page"}
        >
          All
        </Link>
        {cats.map((cat) => {
          const active = cat === category
          return (
            <Link
              key={cat}
              href={chipHref(cat)}
              className={`badge ${active ? "border-forest bg-forest text-white" : "badge-muted hover:border-forest hover:text-forest"}`}
              aria-current={active ? "page" : undefined}
            >
              {cat}
            </Link>
          )
        })}
      </nav>

      <p className="mt-6 text-sm text-muted">
        {products.length} {products.length === 1 ? "product" : "products"}
        {category ? ` in ${category}` : ""}
        {query ? ` matching “${query}”` : ""}
      </p>

      {products.length === 0 ? (
        <div className="card mt-4 px-6 py-12 text-center">
          <p className="font-display text-xl">
            {query
              ? `No products match “${query}”.`
              : category
                ? `Nothing on the shelf in ${category} right now.`
                : "The shelves are empty right now."}
          </p>
          <p className="mt-1 text-sm text-muted">
            Try another search, or look through every category.
          </p>
          <Link href="/products" className="btn btn-primary mt-5">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
