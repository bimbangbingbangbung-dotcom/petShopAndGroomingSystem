import Link from "next/link"
import { listServices, PET_SPECIES, quotePrice, SIZE_LABELS } from "@/lib/grooming"
import { formatPesoWhole } from "@/lib/money"
import { book } from "./actions/book"
import { ArrowRightIcon, CalendarIcon, CheckIcon, ScissorsIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ error?: string }>
}

const SIZE_OPTIONS = Object.entries(SIZE_LABELS)

function isoDay(daysAhead: number): string {
  const date = new Date(Date.now() + daysAhead * 86_400_000)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function readError(message: string | undefined): string | null {
  if (!message) return null
  try {
    return decodeURIComponent(message)
  } catch {
    return message
  }
}

function speciesLabel(species: string): string {
  return species.charAt(0).toUpperCase() + species.slice(1)
}

export default async function GroomingPage({ searchParams }: Props) {
  const { error } = await searchParams
  const errorMessage = readError(error)
  const services = listServices()

  return (
    <>
      <section className="border-b border-line bg-mist">
        <div className="page py-12 sm:py-16">
          <p className="eyebrow">Grooming</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Book a bath, trim or full groom</h1>
          <p className="mt-4 max-w-[58ch] text-lg text-muted">
            Pick a service, tell us about your pet and choose a date. The final price is worked
            out from your pet&apos;s size before you confirm.
          </p>
        </div>
      </section>

      <div className="page py-10">
        {errorMessage && (
          <p
            role="alert"
            className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
          >
            {errorMessage}
          </p>
        )}

        <div className={`grid gap-8 lg:grid-cols-[1.4fr_1fr]${errorMessage ? " mt-6" : ""}`}>
          <form action={book} className="card p-5 sm:p-6">
            <h2 className="text-xl">Choose a service</h2>
            <fieldset className="mt-4">
              <legend className="sr-only">Grooming service</legend>
              {services.length === 0 ? (
                <p className="help">
                  No services are open for booking right now. Call the shop on (02) 8123 4567 and
                  we&apos;ll fit your pet in.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-forest has-[:checked]:bg-mist"
                    >
                      <input
                        type="radio"
                        name="serviceId"
                        value={service.id}
                        required
                        className="mt-1 h-5 w-5 shrink-0 accent-forest"
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-sm font-semibold">{service.name}</span>
                          <span className="price-tag text-base">
                            <span className="text-xs font-normal text-muted">from</span>
                            {formatPesoWhole(quotePrice(service.base_price_cents, "xs"))}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs text-muted">{service.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <p className="help mt-3">
                The total depends on your pet&apos;s size — confirmed on the next step.
              </p>
            </fieldset>

            <h2 className="mt-8 border-t border-line pt-6 text-xl">About your pet</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="petName">Pet name</label>
                <input
                  id="petName"
                  name="petName"
                  type="text"
                  required
                  maxLength={60}
                  className="input"
                  placeholder="Buddy"
                />
              </div>

              <div className="field">
                <label htmlFor="petSpecies">Species</label>
                <select id="petSpecies" name="petSpecies" required className="select" defaultValue="dog">
                  {PET_SPECIES.map((species) => (
                    <option key={species} value={species}>
                      {speciesLabel(species)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="petBreed">Breed</label>
                <input
                  id="petBreed"
                  name="petBreed"
                  type="text"
                  maxLength={60}
                  className="input"
                  placeholder="Shih Tzu"
                />
                <p className="help">Optional.</p>
              </div>

              <div className="field">
                <label htmlFor="petSize">Size</label>
                <select id="petSize" name="petSize" required className="select" defaultValue="m">
                  {SIZE_OPTIONS.map(([size, label]) => (
                    <option key={size} value={size}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field sm:col-span-2">
                <label htmlFor="petNotes">Anything we should know before handling your pet?</label>
                <textarea
                  id="petNotes"
                  name="petNotes"
                  rows={3}
                  maxLength={500}
                  className="textarea"
                  placeholder="Nervous around dryers, sensitive left ear, likes treats…"
                />
              </div>
            </div>

            <h2 className="mt-8 border-t border-line pt-6 text-xl">Date and payment</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="preferredDate">Preferred date</label>
                <input
                  id="preferredDate"
                  name="preferredDate"
                  type="date"
                  required
                  min={isoDay(0)}
                  max={isoDay(60)}
                  className="input"
                />
                <p className="help">Today up to 60 days ahead.</p>
              </div>

              <fieldset className="sm:col-span-2">
                <legend className="text-sm font-semibold text-ink">
                  How you&apos;d like to pay
                </legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-forest has-[:checked]:bg-mist">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pay_now"
                      required
                      className="mt-1 h-5 w-5 shrink-0 accent-forest"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        Pay now with card or e-wallet
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        Paid before the visit — your slot shows as confirmed.
                      </span>
                    </span>
                  </label>

                  <label className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-forest has-[:checked]:bg-mist">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pay_at_shop"
                      required
                      className="mt-1 h-5 w-5 shrink-0 accent-forest"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">Pay at the shop</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        Cash or card when you drop your pet off.
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <button type="submit" className="btn btn-accent px-6">
                <ScissorsIcon width={18} height={18} /> Book this slot
              </button>
              <Link href="/grooming/bookings" className="btn btn-ghost">
                View my bookings
              </Link>
            </div>
            <p className="help mt-3">
              You&apos;ll need to sign in if you haven&apos;t already — we&apos;ll bring you right
              back to this form.
            </p>
          </form>

          <aside className="h-fit">
            <div className="card p-5">
              <h2 className="text-xl">How booking works</h2>
              <ol className="mt-4 flex flex-col gap-4">
                {[
                  ["Pick your service", "Bath, full groom, nails or de-shed — priced by size."],
                  ["Tell us about your pet", "Name, species, breed and anything we should know."],
                  ["Choose a date and pay", "Any day in the next 60 days, now or at the shop."],
                ].map(([title, body], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="block text-sm text-muted">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="card mt-4 p-5">
              <h2 className="text-xl">Good to know</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-ok" />
                  Shop hours are Mon–Sat, 9:00 am – 6:00 pm.
                </li>
                <li className="flex items-start gap-2">
                  <CalendarIcon width={16} height={16} className="mt-0.5 shrink-0 text-ok" />
                  Pay-at-shop bookings are confirmed during those hours.
                </li>
                <li className="flex items-start gap-2">
                  <ScissorsIcon width={16} height={16} className="mt-0.5 shrink-0 text-ok" />
                  Bring vaccination records for first-time visitors.
                </li>
              </ul>
              <Link href="/grooming/bookings" className="btn btn-ghost mt-4 w-full">
                See your bookings <ArrowRightIcon width={18} height={18} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
