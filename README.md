# Paws & Claws — Pet Shop and Grooming System

A full-stack website for a neighbourhood pet shop that sells food, toys and
accessories **and** takes grooming bookings. All prices are in Philippine peso
(₱).

## Features

**Customer**
- Browse products by category, search, and view names, prices and stock
- Product pictures on every card, the detail page, cart and checkout review —
  twelve bundled illustrations plus a tidy category placeholder for items
  without one
- Cart with quantity selection, order review and live total
- Checkout with payment method (card / e-wallet / cash on delivery), an order
  number, and a printable receipt
- Order status tracking (awaiting payment → paid → fulfilled)
- Grooming booking: pick a service, type your pet's identity (name, species,
  breed, size, notes), choose your preferred date (today + 60 days), pay now or
  at the shop, and track the appointment
- Account registration and sign-in

**Admin** (`/admin`)
- Dashboard: revenue today/month, open orders, bookings, low stock, customers
- Item management (create, edit, hide/restore) with stock, category and an
  optional picture (path like `/products/bone-toy.svg` or an https:// URL)
- Order management with legal status transitions (cancel restocks automatically)
- Booking management for grooming (confirm, complete, cancel)
- Transaction history for both shop and grooming, filterable by kind and date
- Sales report: totals, shop vs grooming split, day-by-day chart, top products,
  payment-method breakdown

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS 4, design tokens in `src/app/globals.css` |
| Database | SQLite via `better-sqlite3` (file: `data/app.db`) |
| Validation | Zod (`src/lib/validation.ts`) |
| Auth | HttpOnly SameSite cookie sessions, scrypt password hashing, server-side RBAC |
| Money | Integer centavos everywhere; formatted as ₱ at the edge |

## Run it

```bash
bun install        # or: npm install
bun run dev        # or: npm run dev  → http://localhost:3000
```

The database is created and seeded automatically on first run. Demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@pawsclaws.ph` | `Admin123!` |
| Customer | `customer@example.com` | `Customer123!` |

Other scripts: `bun run build`, `bun run start`, `bun run typecheck`.

## Project layout

```
src/
  app/
    (shop)/            # public + customer pages (shop, cart, checkout, orders, grooming)
      actions/         # server actions: auth, checkout, booking
    admin/             # admin shell, dashboards, CRUD, reports (+ actions/)
    layout.tsx         # fonts, metadata
    globals.css        # design tokens + component classes
  components/          # header, cards, icons, status badges
  lib/                 # db, auth, shop, grooming, reports, validation, money
```

## Notes on `SYSTEM_ARCHITECTURE.md`

The architecture doc targets a production deployment (Postgres/Neon, Auth.js,
Stripe). This repository runs the same modular-monolith shape locally, with
documented substitutions:

- **Postgres → SQLite**: no Docker/Neon in this environment; schema lives in
  `src/lib/db.ts` with the same tables, constraints and integer minor units.
- **Stripe → payment adapter stub**: checkout validates and records a payment
  ref server-side; swap `checkout()` for a real PSP to go live.
- **Auth.js → cookie sessions**: revocable server-side rows, scrypt hashes,
  login throttling, `requireAdmin()` guard on every admin route and
  per-object ownership checks on customer pages.

## Documentation

| File | Contents |
| --- | --- |
| `SYSTEM_ARCHITECTURE.md` | System architecture overview |
| `fullstack.md` | Full-stack development notes |
| `ui.md` | UI design notes |
| `SKILL.md` | Project skill/agent instructions |

## Version control

Changes made in OpenCode are committed and pushed to GitHub automatically
shortly after each agent turn (via the `autosave` plugin in
`.opencode/plugins/autosave/`). It has two triggers — session idle and tool
execution — and skips cleanly when the working tree is already clean.
