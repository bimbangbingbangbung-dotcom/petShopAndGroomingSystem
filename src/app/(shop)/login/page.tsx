"use client"

import { use, useActionState } from "react"
import Link from "next/link"
import { login } from "@/app/(shop)/actions/auth"

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default function LoginPage({ searchParams }: Props) {
  const { next } = use(searchParams)
  const [state, action, pending] = useActionState(login, undefined)
  const errors = state?.fieldErrors

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register"

  return (
    <div className="page flex justify-center py-12 sm:py-20">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl">Sign in</h1>
        <p className="mt-2 text-muted">Sign in to check out and track your orders.</p>

        <form action={action} className="mt-6 flex flex-col gap-4">
          {state?.error && (
            <p
              role="alert"
              className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
            >
              {state.error}
            </p>
          )}

          <input type="hidden" name="next" value={next ?? ""} />

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              aria-invalid={errors?.email ? true : undefined}
              aria-describedby={errors?.email ? "email-error" : undefined}
            />
            {errors?.email && (
              <p id="email-error" className="field-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
              aria-invalid={errors?.password ? true : undefined}
              aria-describedby={errors?.password ? "password-error" : undefined}
            />
            {errors?.password && (
              <p id="password-error" className="field-error">
                {errors.password}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          New here?{" "}
          <Link href={registerHref} className="font-semibold text-forest hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-sm text-muted">
          <Link href="/" className="font-semibold text-forest hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
