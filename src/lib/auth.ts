// Session auth: HttpOnly SameSite=Lax cookie backed by a `sessions` row
// (revocable server-side — SYSTEM_ARCHITECTURE.md §10.1).
import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db, type User } from "./db"
import { verifyPassword } from "./auth-hash"

const COOKIE = "pc_session"
const SESSION_TTL_DAYS = 14
const MAX_ATTEMPTS = 5
const WINDOW_MS = 5 * 60 * 1000

/** In-memory login throttle: email -> { count, resetAt } (per process). */
const attempts = new Map<string, { count: number; resetAt: number }>()

export function throttleStatus(email: string): { blocked: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = attempts.get(email.toLowerCase())
  if (!entry || entry.resetAt < now) {
    if (entry) attempts.delete(email.toLowerCase())
    return { blocked: false, retryAfterSec: 0 }
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { blocked: true, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { blocked: false, retryAfterSec: 0 }
}

export function recordFailedLogin(email: string): void {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  entry.count += 1
}

export function clearLoginAttempts(email: string): void {
  attempts.delete(email.toLowerCase())
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString()
  db()
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, expiresAt)

  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (token) db().prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token))
  store.delete(COOKIE)
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null

  const row = db()
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    )
    .get(hashToken(token)) as User | undefined
  return row ?? null
}

/** Server-side guard for customer pages. Redirects guests to /login. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser()
  if (!user) redirect("/login?next=" + encodeURIComponent(currentPath()))
  return user
}

/** Server-side guard for /admin — deny by default (fullstack.md). */
export async function requireAdmin(): Promise<User> {
  const user = await getSessionUser()
  if (!user) redirect("/login?next=%2Fadmin")
  if (user.role !== "admin") redirect("/")
  return user
}

function currentPath(): string {
  return "/orders"
}

export function authenticate(email: string, password: string): User | null {
  const user = db()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as User | undefined
  if (!user) return null
  if (!verifyPassword(password, user.password_hash)) return null
  return user
}
