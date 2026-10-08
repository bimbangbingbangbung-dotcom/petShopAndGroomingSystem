import Link from "next/link"
import type { Product } from "@/lib/db"
import { formatPeso } from "@/lib/money"
import { AddToCart } from "@/components/add-to-cart"
import { ProductImage } from "@/components/product-image"

export function ProductCard({ product }: { product: Product }) {
  const out = product.stock <= 0
  const low = !out && product.stock <= 5

  return (
    <article className="card flex flex-col overflow-hidden">
      <Link
        href={`/products/${product.slug}`}
        className="group flex flex-1 flex-col border-b border-line transition-colors"
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-mist">
          <ProductImage
            name={product.name}
            category={product.category}
            image={product.image}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 px-4 pb-5 pt-4">
          <span className="text-xs font-semibold text-muted">{product.category}</span>
          <span className="font-display text-lg font-semibold leading-snug text-ink">
            {product.name}
          </span>
          <span className="price-tag mt-auto pt-2 text-xl">
            {formatPeso(product.price_cents)}
          </span>
        </div>
      </Link>

      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="text-xs text-muted">
          {out ? (
            <span className="badge badge-danger">Out of stock</span>
          ) : low ? (
            <span className="badge badge-warn">Only {product.stock} left</span>
          ) : (
            <span className="badge badge-ok">In stock</span>
          )}
        </p>
        <AddToCart product={product} stock={product.stock} showQuantity={false} />
      </div>
    </article>
  )
}
