import Link from "next/link"
import { getSessionUser } from "@/lib/auth"
import { SiteHeader } from "@/components/site-header"
import { PawIcon } from "@/components/icons"

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user ? { name: user.name, role: user.role } : null} />

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="no-print mt-16 border-t border-line bg-mist">
        <div className="page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 font-display text-lg font-bold text-forest">
              <PawIcon width={22} height={22} /> Paws &amp; Claws
            </p>
            <p className="mt-2 text-sm text-muted">
              Food, toys and fuss-free grooming for the pets of the neighbourhood.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Shop</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li>
                <Link href="/products" className="hover:text-forest">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/grooming" className="hover:text-forest">
                  Grooming menu
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-forest">
                  Track an order
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Visit us</p>
            <p className="mt-2 text-sm text-muted">
              12 Mabini Street, Poblacion
              <br />
              Mon–Sat, 9:00 am – 6:00 pm
              <br />
              Sundays, by appointment
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Contact</p>
            <p className="mt-2 text-sm text-muted">
              (02) 8123 4567
              <br />
              hello@pawsclaws.ph
            </p>
          </div>
        </div>
        <div className="border-t border-line/70">
          <p className="page py-4 text-xs text-muted">
            © {new Date().getFullYear()} Paws &amp; Claws · All prices in Philippine peso (₱)
          </p>
        </div>
      </footer>
    </div>
  )
}
