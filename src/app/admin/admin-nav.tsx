"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentType, SVGProps } from "react"
import { logout } from "@/app/(shop)/actions/auth"
import {
  ArrowRightIcon,
  BoxIcon,
  CalendarIcon,
  CartIcon,
  ChartIcon,
  PawIcon,
  ReceiptIcon,
} from "@/components/icons"

interface NavItem {
  href: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: PawIcon },
  { href: "/admin/products", label: "Items", icon: BoxIcon },
  { href: "/admin/orders", label: "Orders", icon: CartIcon },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarIcon },
  { href: "/admin/transactions", label: "Transactions", icon: ReceiptIcon },
  { href: "/admin/reports", label: "Sales report", icon: ChartIcon },
]

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Small screens: a scrollable top bar instead of the sidebar. */}
      <header className="sticky top-0 z-30 border-b border-line bg-mist md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <Link
            href="/"
            className="flex items-center gap-2 text-forest"
            aria-label="Paws and Claws, back to the shop"
          >
            <PawIcon width={22} height={22} />
            <span className="font-display text-lg font-bold">Paws &amp; Claws</span>
            <span className="badge badge-muted">Admin</span>
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link shrink-0 gap-2 whitespace-nowrap hover:bg-white"
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            >
              <item.icon width={18} height={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Desktop: sticky sidebar. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col self-start border-r border-line bg-mist md:flex">
        <div className="border-b border-line px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-forest"
            aria-label="Paws and Claws, back to the shop"
          >
            <PawIcon width={24} height={24} />
            <span className="font-display text-lg font-bold">Paws &amp; Claws</span>
          </Link>
          <p className="eyebrow mt-1">Admin</p>
        </div>

        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link w-full gap-2.5 hover:bg-white"
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            >
              <item.icon width={18} height={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-line p-3">
          <Link href="/" className="nav-link w-full gap-2 hover:bg-white">
            <ArrowRightIcon width={18} height={18} className="rotate-180" />
            Back to shop
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost btn-sm w-full">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
