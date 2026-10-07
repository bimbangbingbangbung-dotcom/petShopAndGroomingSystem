import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth"
import { AdminNav } from "./admin-nav"

export const metadata: Metadata = {
  title: "Admin",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminNav />
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  )
}
