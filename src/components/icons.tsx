// Inline SVG icon set — no emoji, no icon font (ui.md: "SVG icons, no emoji").
import type { SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

function base(props: Props): Props {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
    ...props,
  }
}

export function PawIcon(props: Props) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <ellipse cx="7" cy="8.5" rx="2.1" ry="2.7" />
      <ellipse cx="12" cy="6.8" rx="2.1" ry="2.8" />
      <ellipse cx="17" cy="8.5" rx="2.1" ry="2.7" />
      <path d="M12 11.4c-2.6 0-5.2 2.3-5.2 4.9 0 1.9 1.5 3.1 3.2 2.7 .8-.2 1.3-.7 2-.7s1.2.5 2 .7c1.7.4 3.2-.8 3.2-2.7 0-2.6-2.6-4.9-5.2-4.9Z" />
    </svg>
  )
}

export function CartIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L20.5 8H6" />
      <circle cx="10" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </svg>
  )
}

export function UserIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c.9-3.6 3.9-5.6 7.5-5.6s6.6 2 7.5 5.6" />
    </svg>
  )
}

export function SearchIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

export function PlusIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MinusIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function TrashIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13" />
    </svg>
  )
}

export function CheckIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="m5 13 4.5 4.5L19 7" />
    </svg>
  )
}

export function ClockIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function CalendarIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>
  )
}

export function ScissorsIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <circle cx="6.5" cy="7" r="2.5" />
      <circle cx="6.5" cy="17" r="2.5" />
      <path d="M8.7 8.7 20 19M8.7 15.3 20 5" />
    </svg>
  )
}

export function ReceiptIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6L8.4 20.5 6 18.9Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

export function BoxIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 4 7.5v9l8 4 8-4v-9Z" />
      <path d="M4 7.5 12 11.5l8-4M12 11.5v9" />
    </svg>
  )
}

export function ChartIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-5M12.5 16V7.5M17 16v-3" />
    </svg>
  )
}

export function ArrowRightIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </svg>
  )
}

export function XIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function MenuIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function PrintIcon(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M7 9V4h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <rect x="7" y="14.5" width="10" height="6" rx="1" />
    </svg>
  )
}
