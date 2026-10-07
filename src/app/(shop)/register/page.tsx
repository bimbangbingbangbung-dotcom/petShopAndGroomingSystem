"use client"

import { use, useActionState } from "react"
import Link from "next/link"
import { register } from "@/app/(shop)/actions/auth"

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default function RegisterPage({ searchParams }: Props) {
  const { next } = use(searchParams)
  const [state, action, pending] = useActionState(register, undefined)
  const errors = state?.fieldErrors

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login"

  return (
    <div className="page flex justify-center py-12 sm:py-20">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-3xl">Create an account</h1>
        <p className="mt-2 text-muted">
          Keep your orders, receipts and grooming bookings in one place.
        </p>

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
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="input"
              aria-invalid={errors?.name ? true : undefined}
              aria-describedby={errors?.name ? "name-error" : undefined}
            />
            {errors?.name && (
              <p id="name-error" className="field-error">
                {errors.name}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              className="input"
              aria-invalid={errors?.password ? true : undefined}
              aria-describedby={errors?.password ? "password-error" : undefined}
            />
            <p id="password-help" className="help">
              At least 8 characters.
            </p>
            {errors?.password && (
              <p id="password-error" className="field-error">
                {errors.password}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending ? "Creating your account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-forest hover:underline">
            Sign in
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
