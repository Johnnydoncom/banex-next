"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { useCart } from "@/components/CartContext"
import { formatNaira } from "@/lib/products"
import {
  ShieldCheck,
  Lock,
  Truck,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"

type Method = "card" | "transfer" | "ussd"
type Fulfilment = "rider" | "pickup"

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()
  const [method, setMethod] = useState<Method>("card")
  const [fulfilment, setFulfilment] = useState<Fulfilment>("rider")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const escrowFee = useMemo(() => Math.round(subtotal * 0.015), [subtotal])
  const delivery = items.length === 0 ? 0 : fulfilment === "pickup" ? 0 : subtotal > 500_000 ? 0 : 1500
  const total = subtotal + escrowFee + delivery

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setSubmitting(true)
    setTimeout(() => {
      const ref = "BNX-" + Math.random().toString(36).slice(2, 8).toUpperCase()
      setDone(ref)
      clear()
      setSubmitting(false)
      toast.success("Payment held in escrow", { description: `Order ${ref} created.` })
    }, 1200)
  }

  if (done) {
    return (
      <div className="min-h-screen">
        <Header />
        <section className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft/40">
            <CheckCircle2 className="h-8 w-8 text-brand-deep" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">Payment held in escrow</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your payment is safely held by Banex Escrow. We'll release it to the seller after you confirm delivery.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            Order reference: <span className="font-display font-semibold">{done}</span>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Keep shopping
            </Link>
            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
            >
              Back to home
            </button>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
          <ChevronLeft className="h-4 w-4" /> Continue shopping
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand-deep">Checkout</p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">Secure escrow checkout</h1>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-brand" />
          Your money is held by Banex until you confirm delivery.
        </p>
      </section>

      {items.length === 0 ? (
        <section className="mx-auto max-w-3xl px-4 pb-20 md:px-8">
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-2xl font-semibold">Your cart is empty</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a listing from any seller to start an escrow checkout.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-block rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Browse marketplace
            </Link>
          </div>
        </section>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 md:px-8 lg:grid-cols-[1.4fr_1fr]"
        >
          <div className="space-y-6">
            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">Fulfilment</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <PayOption active={fulfilment === "rider"} onClick={() => setFulfilment("rider")} icon={Truck} label="Rider delivery" sub="Same-hour citywide · ₦1,500" />
                <PayOption active={fulfilment === "pickup"} onClick={() => setFulfilment("pickup")} icon={Building2} label="In-mall pickup" sub="Concierge · ready in 15 min · Free" />
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">
                {fulfilment === "pickup" ? "Pickup contact" : "Delivery details"}
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Full name" required placeholder="Adaeze Okafor" />
                <Field label="Phone" required placeholder="+234 80 1234 5678" type="tel" />
                <Field label="Email" required placeholder="you@example.com" type="email" className="sm:col-span-2" />
                {fulfilment === "rider" ? (
                  <>
                    <Field label="Delivery address" required placeholder="12 Admiralty Way, Lekki Phase 1" className="sm:col-span-2" />
                    <Field label="City" required placeholder="Lagos" />
                    <Field label="State" required placeholder="Lagos" />
                  </>
                ) : (
                  <p className="sm:col-span-2 rounded-xl bg-surface/60 p-4 text-sm text-muted-foreground">
                    Collect at <strong>Banex Mall · Concierge desk, Ground floor</strong>. We'll text when your order is ready.
                  </p>
                )}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">Payment method</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <PayOption active={method === "card"} onClick={() => setMethod("card")} icon={CreditCard} label="Card" sub="Visa / Mastercard / Verve" />
                <PayOption active={method === "transfer"} onClick={() => setMethod("transfer")} icon={Building2} label="Bank transfer" sub="Pay via your bank app" />
                <PayOption active={method === "ussd"} onClick={() => setMethod("ussd")} icon={Smartphone} label="USSD" sub="*737#, *894# etc." />
              </div>

              {method === "card" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Card number" required placeholder="4242 4242 4242 4242" className="sm:col-span-2" />
                  <Field label="Expiry" required placeholder="MM/YY" />
                  <Field label="CVV" required placeholder="123" />
                </div>
              )}
              {method === "transfer" && (
                <p className="mt-4 rounded-xl bg-surface/60 p-4 text-sm text-muted-foreground">
                  After placing the order, you'll see a one-time virtual account number to transfer{" "}
                  <span className="font-semibold text-foreground">{formatNaira(total)}</span>. Funds are held in escrow.
                </p>
              )}
              {method === "ussd" && (
                <p className="mt-4 rounded-xl bg-surface/60 p-4 text-sm text-muted-foreground">
                  We'll generate a USSD code for your bank. Dial it from the phone linked to your account.
                </p>
              )}
            </fieldset>

            <div className="rounded-2xl border border-brand/30 bg-brand-soft/15 p-5 text-sm">
              <p className="flex items-center gap-2 font-display font-semibold text-brand-deep">
                <ShieldCheck className="h-4 w-4" /> How escrow works
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>You pay Banex — not the seller — at checkout.</li>
                <li>The seller ships your order with tracking.</li>
                <li>You confirm delivery within 48 hours of receiving it.</li>
                <li>Banex releases the funds to the seller. Issue? Open a dispute and we'll investigate.</li>
              </ol>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="font-display text-base font-semibold">Order summary</p>
              <ul className="mt-4 divide-y divide-border/60">
                {items.map((it) => (
                  <li key={it.id} className="flex gap-3 py-3">
                    <img src={it.productImage} alt={it.productName} className="h-14 w-14 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{it.productName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {it.sellerName} · Qty {it.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatNaira(it.price * it.qty)}</p>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                <Row label="Subtotal" value={formatNaira(subtotal)} />
                <Row
                  label={
                    <span className="inline-flex items-center gap-1">
                      Escrow fee <span className="text-[10px] text-muted-foreground">(1.5%)</span>
                    </span>
                  }
                  value={formatNaira(escrowFee)}
                />
                <Row
                  label={
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3 w-3" /> {fulfilment === "pickup" ? "In-mall pickup" : "Rider delivery"}
                    </span>
                  }
                  value={delivery === 0 ? "Free" : formatNaira(delivery)}
                />
                <div className="my-2 h-px bg-border" />
                <div className="flex items-center justify-between">
                  <dt className="font-display text-base font-semibold">Total</dt>
                  <dd className="font-display text-xl font-bold">{formatNaira(total)}</dd>
                </div>
              </dl>

              <button
                disabled={submitting}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
              >
                <Lock className="h-4 w-4" />
                {submitting ? "Processing…" : `Pay ${formatNaira(total)} to escrow`}
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                By paying, you agree to Banex Mall's escrow terms.
              </p>
            </div>
          </aside>
        </form>
      )}

      <Footer />
    </div>
  )
}

function Field({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}

function PayOption({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  sub: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
        active ? "border-brand bg-brand-soft/15" : "border-border bg-background hover:border-brand/60"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-brand-deep" : "text-muted-foreground"}`} />
      <span className="mt-2 text-sm font-semibold">{label}</span>
      <span className="text-[11px] text-muted-foreground">{sub}</span>
    </button>
  )
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}
