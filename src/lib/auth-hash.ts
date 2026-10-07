// Password hashing — scrypt (memory-hard) with a per-user random salt.
// Kept free of Next.js imports so the database seeder can use it too.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export function hashPasswordSync(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":")
  if (scheme !== "scrypt" || !salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  const candidate = scryptSync(password, salt, 64)
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}
