import { BoxIcon } from "@/components/icons"

interface Props {
  name: string
  category: string
  image?: string | null
  /** Extra classes for the inner visual (e.g. the card's hover zoom). */
  className?: string
  /** Icon-only fallback for tight spaces like table thumbnails. */
  compact?: boolean
}

/**
 * Product visual: the stored illustration or photo when one is set, otherwise a
 * tidy category placeholder so admin-added items still look intentional.
 * Render it inside a fixed-aspect, overflow-hidden box.
 */
export function ProductImage({ name, category, image, className = "", compact = false }: Props) {
  const extra = className ? ` ${className}` : ""

  if (image) {
    return (
      // Local SVGs and arbitrary admin URLs — next/image would need per-domain config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        loading="lazy"
        className={`h-full w-full object-cover${extra}`}
      />
    )
  }

  if (compact) {
    return (
      <div
        role="img"
        aria-label={name}
        className={`flex h-full w-full items-center justify-center bg-mist text-forest/40${extra}`}
      >
        <BoxIcon className="size-5" />
      </div>
    )
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-mist text-muted${extra}`}
    >
      <BoxIcon className="size-10 text-forest/40" />
      <span className="text-xs font-semibold uppercase tracking-[0.18em]">{category}</span>
    </div>
  )
}
