import type { Metadata } from "next"
import { Archivo, Fraunces } from "next/font/google"
import "./globals.css"

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Paws & Claws — Pet shop & grooming",
    template: "%s · Paws & Claws",
  },
  description:
    "Neighbourhood pet shop and grooming parlor. Order food, toys and accessories online, or book a grooming slot for your pet. Prices in Philippine peso.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PH" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
