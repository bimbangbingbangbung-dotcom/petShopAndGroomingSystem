"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cartCount, subscribeToCart } from "@/lib/cart-client"
import { logout } from "@/app/(shop)/actions/auth"
import { CartIcon, MenuIcon, PawIcon, ScissorsIcon, UserIcon, XIcon } from "@/components/icons"

interface Props {
  user: { name: string; role: "customer" | "admin" } | null
}

export function SiteHeader({ user }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(cartCount())
    update()
    return subscribeToCart(update)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const links = [
    { href: "/products", label: "Shop" },
    { href: "/grooming", label: "Grooming" },
    ...(user ? [{ href: "/orders", label: "My orders" }] : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ]

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-lather/95 backdrop-blur">
      <div className="bg-forest text-white">
        <div className="page flex min-h-9 items-center justify-between text-xs sm:text-sm">
          <p>Grooming slots open Monday to Saturday · Same-day delivery in the city</p>
          <p className="hidden sm:block">Prices in Philippine peso</p>
        </div>
      </div>

      <div className="page flex min-h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-forest" aria-label="Paws and Claws, home">
          <PawIcon width={26} height={26} />
          <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Paws <span className="text-marigold-deep">&amp;</span> Claws
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link" aria-current={pathname.startsWith(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href="/cart" className="nav-link relative" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            <CartIcon />
            <span className="ml-1 hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-marigold px-1 text-xs font-bold text-ink">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {user ? (
            <form action={logout} className="hidden items-center gap-2 sm:flex">
              <span className="flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm text-muted">
                <UserIcon width={18} height={18} />
                {user.name.split(" ")[0]}
              </span>
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Sign in
            </Link>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon width={18} height={18} /> : <MenuIcon width={18} height={18} />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="page border-t border-line py-3 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
            <Link href="/grooming" className="nav-link">
              <ScissorsIcon width={18} height={18} /> Book a groom
            </Link>
            {user ? (
              <form action={logout}>
                <button type="submit" className="btn btn-ghost w-full justify-start">
                  Sign out ({user.name.split(" ")[0]})
                </button>
              </form>
            ) : (
              <>
                <Link href="/login" className="nav-link">
                  Sign in
                </Link>
                <Link href="/register" className="nav-link">
                  Create an account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
