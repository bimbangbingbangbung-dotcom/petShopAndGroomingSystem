// SQLite data layer (local stand-in for Postgres per SYSTEM_ARCHITECTURE.md §4.3).
// Owns schema, migrations and first-run seeding. All money in integer centavos.
import Database from "better-sqlite3"
import * as fs from "node:fs"
import * as path from "node:path"
import { hashPasswordSync } from "./auth-hash"

export type Role = "customer" | "admin"
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled"
export type AppointmentStatus = "requested" | "confirmed" | "completed" | "cancelled"
export type PetSize = "xs" | "s" | "m" | "l" | "xl"

export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  role: Role
  created_at: string
}

export interface Product {
  id: number
  name: string
  slug: string
  category: string
  description: string
  price_cents: number
  stock: number
  active: number
  image: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_number: string
  user_id: number
  status: OrderStatus
  subtotal_cents: number
  total_cents: number
  payment_method: string
  payment_ref: string | null
  customer_name: string
  customer_email: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number | null
  name: string
  price_cents: number
  quantity: number
}

export interface Appointment {
  id: number
  appointment_number: string
  user_id: number
  service_id: number
  service_name: string
  preferred_date: string
  pet_name: string
  pet_species: string
  pet_breed: string
  pet_size: PetSize
  pet_notes: string
  price_cents: number
  status: AppointmentStatus
  payment_method: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: number
  name: string
  slug: string
  description: string
  base_price_cents: number
  active: number
}

export interface Transaction {
  id: number
  kind: "shop" | "grooming"
  reference: string
  user_id: number | null
  customer_name: string
  amount_cents: number
  method: string
  status: "paid" | "refunded"
  created_at: string
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,              -- sha256 of the cookie token
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE,
  category    TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active      INTEGER NOT NULL DEFAULT 1,
  image       TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS services (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  slug             TEXT    NOT NULL UNIQUE,
  description      TEXT    NOT NULL DEFAULT '',
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents >= 0),
  active           INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number    TEXT    NOT NULL UNIQUE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status          TEXT    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','paid','fulfilled','cancelled')),
  subtotal_cents  INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  total_cents     INTEGER NOT NULL CHECK (total_cents >= 0),
  payment_method  TEXT    NOT NULL DEFAULT 'card',
  payment_ref     TEXT,
  customer_name   TEXT    NOT NULL,
  customer_email  TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name        TEXT    NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  quantity    INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS appointments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_number TEXT   NOT NULL UNIQUE,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id        INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  service_name      TEXT    NOT NULL,
  preferred_date    TEXT    NOT NULL,
  pet_name          TEXT    NOT NULL,
  pet_species       TEXT    NOT NULL,
  pet_breed         TEXT    NOT NULL DEFAULT '',
  pet_size          TEXT    NOT NULL CHECK (pet_size IN ('xs','s','m','l','xl')),
  pet_notes         TEXT    NOT NULL DEFAULT '',
  price_cents       INTEGER NOT NULL CHECK (price_cents >= 0),
  status            TEXT    NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested','confirmed','completed','cancelled')),
  payment_method    TEXT    NOT NULL DEFAULT 'pay_at_shop',
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_appts_user ON appointments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appts_date ON appointments(preferred_date, status);

CREATE TABLE IF NOT EXISTS transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kind          TEXT    NOT NULL CHECK (kind IN ('shop','grooming')),
  reference     TEXT    NOT NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT    NOT NULL,
  amount_cents  INTEGER NOT NULL,
  method        TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','refunded')),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_kind ON transactions(kind, created_at);
`

const PRODUCT_SEED: Array<[string, string, string, string, number, number]> = [
  ["Premium Adult Dog Food 3kg", "premium-adult-dog-food-3kg", "Food", "Chicken and rice recipe for adult dogs. Resealable pack.", 125000, 24],
  ["Kitten Tuna Pouches 12s", "kitten-tuna-pouches-12s", "Food", "Soft wet food in gravy, formulated for kittens.", 48000, 40],
  ["Salmon Cat Kibble 1.5kg", "salmon-cat-kibble-1-5kg", "Food", "Grain-free dry food with real salmon.", 89000, 18],
  ["Squeaky Bone Toy", "squeaky-bone-toy", "Toys", "Durable rubber bone with a loud squeaker.", 14900, 60],
  ["Feather Wand Teaser", "feather-wand-teaser", "Toys", "Retractable wand with replaceable feathers.", 9900, 45],
  ["Rope Tug Toy", "rope-tug-toy", "Toys", "Braided cotton rope for interactive play.", 12900, 35],
  ["Ceramic Food Bowl", "ceramic-food-bowl", "Accessories", "Non-slip ceramic bowl, dishwasher safe.", 24900, 30],
  ["Adjustable Nylon Collar", "adjustable-nylon-collar", "Accessories", "Reflective strip, sizes XS to L.", 19900, 50],
  ["Retractable Leash 5m", "retractable-leash-5m", "Accessories", "One-button brake and lock, up to 50kg dogs.", 34900, 25],
  ["Absorbent Pee Pads 50s", "absorbent-pee-pads-50s", "Care", "Quick-dry core with odor lock, 45x60cm.", 39900, 30],
  ["Flea & Tick Spot-On", "flea-tick-spot-on", "Care", "Monthly topical treatment for dogs 10-20kg.", 29900, 20],
  ["Grooming Slicker Brush", "grooming-slicker-brush", "Care", "Fine wire bristles with comfort grip handle.", 17900, 28],
]

/** Illustrations shipped with the app, keyed by product slug (applied when no admin image is set). */
const PRODUCT_IMAGES: Record<string, string> = {
  "premium-adult-dog-food-3kg": "/products/dog-food-bag.svg",
  "kitten-tuna-pouches-12s": "/products/cat-pouches.svg",
  "salmon-cat-kibble-1-5kg": "/products/cat-kibble-bag.svg",
  "squeaky-bone-toy": "/products/bone-toy.svg",
  "feather-wand-teaser": "/products/feather-wand.svg",
  "rope-tug-toy": "/products/rope-toy.svg",
  "ceramic-food-bowl": "/products/food-bowl.svg",
  "adjustable-nylon-collar": "/products/collar.svg",
  "retractable-leash-5m": "/products/leash.svg",
  "absorbent-pee-pads-50s": "/products/pee-pads.svg",
  "flea-tick-spot-on": "/products/spot-on.svg",
  "grooming-slicker-brush": "/products/slicker-brush.svg",
}

const SERVICE_SEED: Array<[string, string, string, number]> = [
  ["Bath & Brush", "bath-brush", "Warm-water bath, blow dry, full brush-out and cologne.", 35000],
  ["Full Groom", "full-groom", "Bath, haircut to breed shape, nails, ears and sanitary trim.", 70000],
  ["Nail Trim", "nail-trim", "Clipping and smoothing with paw balm.", 15000],
  ["De-shed Treatment", "de-shed-treatment", "Undercoat rake, bath with de-shed shampoo and blow out.", 45000],
  ["Puppy First Groom", "puppy-first-groom", "Gentle introduction for dogs under 6 months.", 30000],
]

let instance: Database.Database | null = null

function open(): Database.Database {
  const dataDir = path.join(process.cwd(), "data")
  fs.mkdirSync(dataDir, { recursive: true })
  const db = new Database(path.join(dataDir, "app.db"))
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")
  db.exec(SCHEMA)

  // Migration: databases created before the `image` column existed.
  const columns = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>
  const addedImage = !columns.some((c) => c.name === "image")
  if (addedImage) {
    db.exec("ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT ''")
    backfillProductImages(db) // one-time: existing rows adopt the bundled illustrations
  }

  seed(db)
  return db
}

/** Point seeded products at their bundled illustration where none is set yet. */
function backfillProductImages(db: Database.Database) {
  const update = db.prepare("UPDATE products SET image = ? WHERE slug = ? AND image = ''")
  for (const [slug, image] of Object.entries(PRODUCT_IMAGES)) update.run(image, slug)
}

function seed(db: Database.Database) {
  const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }
  if (userCount.n > 0) return

  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
  )
  insertUser.run("Shop Admin", "admin@pawsclaws.ph", hashPasswordSync("Admin123!"), "admin")
  insertUser.run("Juan Dela Cruz", "customer@example.com", hashPasswordSync("Customer123!"), "customer")

  const insertProduct = db.prepare(
    `INSERT INTO products (name, slug, category, description, price_cents, stock)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  for (const [name, slug, category, description, price, stock] of PRODUCT_SEED) {
    insertProduct.run(name, slug, category, description, price, stock)
  }
  backfillProductImages(db)

  const insertService = db.prepare(
    "INSERT INTO services (name, slug, description, base_price_cents) VALUES (?, ?, ?, ?)",
  )
  for (const [name, slug, description, base] of SERVICE_SEED) {
    insertService.run(name, slug, description, base)
  }

  console.log("[db] seeded demo users, products and grooming services")
}

/** Shared database handle (survives Next.js dev hot reload). */
export function db(): Database.Database {
  const g = globalThis as { __pawsDb?: Database.Database }
  if (!g.__pawsDb) g.__pawsDb = open()
  return g.__pawsDb
}
