import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="page w-full py-16">
        <div className="card mx-auto max-w-xl p-8 text-center sm:p-10">
          <p className="eyebrow">404 — page not found</p>
          <h1 className="mt-2 text-3xl">We couldn&apos;t find that page</h1>
          <p className="prose-copy mx-auto mt-3">
            The link may be out of date, or the page has moved. Head back home, or see what&apos;s
            on the shelves.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary">
              Go to home
            </Link>
            <Link href="/products" className="btn btn-ghost">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
