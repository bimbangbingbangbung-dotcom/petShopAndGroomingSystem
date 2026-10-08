"use client"

import type { ReactNode } from "react"

interface Props {
  /** Native confirm() question shown before the form submits. */
  message: string
  className?: string
  children: ReactNode
}

/**
 * Submit button that asks "are you sure?" before firing its server action.
 * Used for every destructive admin action (delete, cancel) so nothing
 * important happens on a single mis-click.
 */
export function ConfirmButton({ message, className, children }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
