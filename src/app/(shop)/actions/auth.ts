"use server"

import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import {
  authenticate,
  clearLoginAttempts,
  createSession,
  destroySession,
  recordFailedLogin,
  throttleStatus,
} from "@/lib/auth"
import { hashPasswordSync } from "@/lib/auth-hash"
import type { FormState } from "@/lib/form"
import { fieldErrors, firstMessage, loginSchema, registerSchema } from "@/lib/validation"

function safeNext(next: string | undefined, fallback: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next
  return fallback
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? undefined,
    password: formData.get("password") ?? undefined,
    // formData.get() returns null when the field is absent — Zod wants undefined.
    next: typeof formData.get("next") === "string" ? formData.get("next") : undefined,
  })
  if (!parsed.success) {
    return { error: firstMessage(parsed.error), fieldErrors: fieldErrors(parsed.error) }
  }

  const throttle = throttleStatus(parsed.data.email)
  if (throttle.blocked) {
    return {
      error: `Too many sign-in attempts. Try again in ${throttle.retryAfterSec} seconds.`,
      fieldErrors: {},
    }
  }

  const user = authenticate(parsed.data.email, parsed.data.password)
  if (!user) {
    recordFailedLogin(parsed.data.email)
    return { error: "Wrong email or password.", fieldErrors: {} }
  }

  clearLoginAttempts(parsed.data.email)
  await createSession(user.id)
  redirect(safeNext(parsed.data.next, user.role === "admin" ? "/admin" : "/"))
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: firstMessage(parsed.error), fieldErrors: fieldErrors(parsed.error) }
  }

  const existing = db().prepare("SELECT id FROM users WHERE email = ?").get(parsed.data.email)
  if (existing) {
    return { error: "An account with that email already exists.", fieldErrors: { email: "Already registered." } }
  }

  const info = db()
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')")
    .run(parsed.data.name, parsed.data.email, hashPasswordSync(parsed.data.password))

  await createSession(Number(info.lastInsertRowid))
  redirect(safeNext(String(formData.get("next") ?? ""), "/"))
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect("/")
}
