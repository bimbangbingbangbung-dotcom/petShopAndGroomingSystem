import Link from "next/link"
import { notFound } from "next/navigation"
import { getProductBySlug, listProducts } from "@/lib/shop"
import { formatPeso } from "@/lib/money"
import { AddToCart } from "@/components/add-to-cart"
import { ProductCard } from "@/components/product-card"
import { ProductImage } from "@/components/product-image"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product || product.active === 0) notFound()

  const related = listProducts({ category: product.category })
    .filter((candidate) => candidate.id !== product.id)
    .slice(0, 3)

  const stockBadge =
    product.stock <= 0
      ? { cls: "badge-danger", text: "Out of stock" }
      : product.stock <= 5
        ? { cls: "badge-warn", text: `Only ${product.stock} left` }
        : { cls: "badge-ok", text: "In stock" }

  return (
    <div className="page py-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/products" className="font-semibold text-forest hover:underline">
          All products
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/products?category=${encodeURIComponent(product.category)}`}
          className="hover:text-forest hover:underline"
        >
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-lg border border-line bg-mist">
            <ProductImage
              name={product.name}
              category={product.category}
              image={product.image}
            />
          </div>
          <p className="eyebrow mt-7">{product.category}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">{product.name}</h1>
          <p className="prose-copy mt-4">{product.description}</p>
          <p className="mt-6 text-sm text-muted">
            Same-day city delivery · Stock is checked again when you pay.
          </p>
        </div>

        <aside className="card h-fit p-5 sm:p-6" aria-label={`Buy ${product.name}`}>
          <p className="price-tag text-3xl sm:text-4xl">{formatPeso(product.price_cents)}</p>
          <p className="mt-3">
            <span className={`badge ${stockBadge.cls}`}>{stockBadge.text}</span>
          </p>
          <div className="mt-5">
            <AddToCart
              product={{ id: product.id, name: product.name, price_cents: product.price_cents }}
              stock={product.stock}
              showQuantity
            />
          </div>
          <p className="help mt-4">
            Free delivery in the city today. Add the item, set a quantity, then review your cart
            before you pay.
          </p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14 border-t border-line pt-10">
          <h2 className="section-title">More for your pet</h2>
          <p className="mt-2 text-muted">Other {product.category.toLowerCase()} picks from the shelves.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
