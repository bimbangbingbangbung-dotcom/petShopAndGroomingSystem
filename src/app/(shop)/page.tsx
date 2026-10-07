import Link from "next/link"
import { listProducts, categories } from "@/lib/shop"
import { listServices, quotePrice } from "@/lib/grooming"
import { formatPesoWhole } from "@/lib/money"
import { ProductCard } from "@/components/product-card"
import { ArrowRightIcon, CheckIcon, ScissorsIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const featured = listProducts().slice(0, 6)
  const services = listServices()
  const cats = categories()

  return (
    <>
      {/* Hero — the grooming price board is the one bold element on the page. */}
      <section className="border-b border-line bg-mist">
        <div className="page grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl">
              Your pet&apos;s groceries, plus a bath day they&apos;ll actually enjoy.
            </h1>
            <p className="mt-5 max-w-[58ch] text-lg text-muted">
              Order food, toys and accessories for delivery, or book a grooming slot and pick
              the date that suits you. Every price is in peso, every order gets a number and a
              receipt you can print.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-accent px-6">
                Browse the shop <ArrowRightIcon width={18} height={18} />
              </Link>
              <Link href="/grooming" className="btn btn-ghost px-6">
                <ScissorsIcon width={18} height={18} /> Book a groom
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <CheckIcon width={16} height={16} className="text-ok" /> Same-day city delivery
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon width={16} height={16} className="text-ok" /> Grooming from ₱150
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon width={16} height={16} className="text-ok" /> Printable receipts
              </li>
            </ul>
          </div>

          <aside className="card overflow-hidden" aria-label="Grooming price board">
            <div className="flex items-center justify-between border-b border-line bg-forest px-5 py-3 text-white">
              <p className="font-display text-lg">Today at the grooming bar</p>
              <ScissorsIcon width={18} height={18} />
            </div>
            <ul className="divide-y divide-line">
              {services.map((service) => (
                <li key={service.id} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                  <span>
                    <span className="font-medium">{service.name}</span>
                    <span className="block text-xs text-muted">{service.description}</span>
                  </span>
                  <span className="price-tag whitespace-nowrap text-lg">
                    {formatPesoWhole(quotePrice(service.base_price_cents, "xs"))}
                    <span className="text-xs font-normal text-muted">up</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-line bg-lather px-5 py-3 text-xs text-muted">
              Final price depends on your pet&apos;s size — you&apos;ll see it before you pay.
            </p>
          </aside>
        </div>
      </section>

      {/* Featured products */}
      <section className="page py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Fresh on the shelves</h2>
            <p className="mt-2 text-muted">Food, toys and care picked by the shop staff.</p>
          </div>
          <Link href="/products" className="btn btn-ghost">
            See all products <ArrowRightIcon width={18} height={18} />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="card mt-6 px-6 py-10 text-center">
            <p className="font-display text-lg">The shelves are empty right now.</p>
            <p className="mt-1 text-sm text-muted">New stock arrives weekly — check back soon.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {cats.map((cat) => (
            <Link key={cat} href={`/products?category=${encodeURIComponent(cat)}`} className="badge badge-muted hover:border-forest hover:text-forest">
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Grooming explainer */}
      <section className="bg-forest text-white">
        <div className="page grid gap-10 py-14 lg:grid-cols-2">
          <div>
            <h2 className="section-title">Booking a groom takes a minute</h2>
            <p className="mt-3 max-w-[54ch] text-white/80">
              Tell us about your pet — name, species, breed and size — pick a service and the
              date you prefer. We confirm the slot, and your pet&apos;s record follows them
              from visit to visit.
            </p>
            <Link href="/grooming" className="btn btn-accent mt-6 px-6">
              Pick a date <ArrowRightIcon width={18} height={18} />
            </Link>
          </div>
          <ol className="grid gap-4">
            {[
              ["Choose a service", "Bath, full groom, nails or de-shed — priced by your pet's size."],
              ["Tell us about your pet", "Name, species, breed and anything we should know before handling."],
              ["Pick your date and pay", "Choose any day in the next 60 days, pay now or at the shop."],
            ].map(([title, body], index) => (
              <li key={title} className="flex gap-4 rounded-lg border border-white/20 bg-white/5 p-4">
                <span className="font-display text-2xl font-bold text-marigold">{index + 1}</span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-white/75">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Order flow */}
      <section className="page py-14">
        <h2 className="section-title">Ordering, start to finish</h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ["Fill your cart", "Browse by category, choose a quantity, review the total before you pay."],
            ["Pay at checkout", "Card, e-wallet or cash on delivery — the total is confirmed on the server."],
            ["Get your order number", "A receipt and a live status page show where your order is."],
          ].map(([title, body], index) => (
            <li key={title} className="card p-5">
              <span className="font-display text-3xl font-bold text-marigold-deep">{index + 1}</span>
              <h3 className="mt-2 text-xl">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
