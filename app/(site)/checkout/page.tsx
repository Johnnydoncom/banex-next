"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
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
  MapPin,
  Plus
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { 
  userCheckoutBreakdown, 
  userCheckoutPlaceOrder, 
  userFetchAddresses, 
  userCreateAddress,
  type AddressData,
  type CheckoutBreakdown
} from "@/lib/user-api"

type Method = "card" | "transfer" | "ussd"
type Fulfilment = "delivery" | "pickup"

export default function CheckoutPage() {
  const { items, clear, isSyncing } = useCart()
  const { status } = useAuth()
  const router = useRouter()
  
  const [method, setMethod] = useState<Method>("card")
  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery")
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [breakdown, setBreakdown] = useState<CheckoutBreakdown | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  
  // New address form
  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone: "",
    street_address: "",
    city: "",
    state: ""
  })

  // Ensure user is logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.info("Please log in to checkout")
      router.push("/login?callbackUrl=/checkout")
    }
  }, [status, router])

  // Fetch addresses
  useEffect(() => {
    if (status === "authenticated") {
      userFetchAddresses().then(data => {
        setAddresses(data)
        const def = data.find(a => a.is_default) || data[0]
        if (def) setSelectedAddressId(def.id)
        else setShowNewAddress(true)
      }).catch(() => toast.error("Failed to load addresses"))
    }
  }, [status])

  // Fetch breakdown when fulfillment or address changes
  useEffect(() => {
    if (status !== "authenticated" || items.length === 0 || isSyncing) return

    const loadBreakdown = async () => {
      try {
        const bd = await userCheckoutBreakdown(fulfilment, fulfilment === "delivery" ? selectedAddressId : undefined)
        if (bd) setBreakdown(bd)
      } catch (err: any) {
        toast.error(err.message || "Failed to calculate order total")
      }
    }

    if (fulfilment === "pickup" || selectedAddressId) {
      loadBreakdown()
    }
  }, [fulfilment, selectedAddressId, items.length, status, isSyncing])

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const addr = await userCreateAddress(newAddress)
      if (addr) {
        setAddresses(prev => [...prev, addr])
        setSelectedAddressId(addr.id)
        setShowNewAddress(false)
        toast.success("Address saved")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save address")
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || status !== "authenticated") return
    if (fulfilment === "delivery" && !selectedAddressId) {
      toast.error("Please select a delivery address")
      return
    }

    setSubmitting(true)
    try {
      const res = await userCheckoutPlaceOrder(
        fulfilment,
        method,
        fulfilment === "delivery" ? selectedAddressId : undefined
      )
      
      if (res?.order) {
        setDone(res.order.reference)
        clear()
        toast.success("Order placed successfully")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to place order")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || isSyncing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    )
  }

  if (done) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft/40">
          <CheckCircle2 className="h-8 w-8 text-brand-deep" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">Order Confirmed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your payment is safely held by Banex Escrow. We'll release it to the seller after you confirm delivery.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
          Order reference: <span className="font-display font-semibold">{done}</span>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/account/orders"
            className="rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Track Order
          </Link>
          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            Back to home
          </button>
        </div>
      </section>
    )
  }

  return (
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

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
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
      ) : (
        <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">Fulfilment</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <PayOption active={fulfilment === "delivery"} onClick={() => setFulfilment("delivery")} icon={Truck} label="Rider delivery" sub="Same-hour citywide · Cost varies" />
                <PayOption active={fulfilment === "pickup"} onClick={() => setFulfilment("pickup")} icon={Building2} label="In-mall pickup" sub="Concierge · ready in 15 min · Free" />
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">
                {fulfilment === "pickup" ? "Pickup Instructions" : "Delivery Address"}
              </legend>
              
              {fulfilment === "pickup" ? (
                <p className="mt-3 rounded-xl bg-surface/60 p-4 text-sm text-muted-foreground">
                  Collect at <strong>Banex Mall · Concierge desk, Ground floor</strong>. We'll text when your order is ready.
                </p>
              ) : (
                <div className="mt-3">
                  {!showNewAddress && addresses.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {addresses.map(addr => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                            selectedAddressId === addr.id ? "border-brand bg-brand-soft/15" : "border-border bg-background hover:border-brand/60"
                          }`}
                        >
                          <span className="font-semibold text-sm">{addr.full_name}</span>
                          <span className="mt-1 text-xs text-muted-foreground line-clamp-1">{addr.street_address}</span>
                          <span className="text-xs text-muted-foreground">{addr.city}, {addr.state}</span>
                          <span className="mt-2 text-[11px] font-medium text-foreground">{addr.phone}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowNewAddress(true)}
                        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-muted-foreground hover:border-brand hover:text-brand"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-sm font-medium">Add New Address</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Full name" required value={newAddress.full_name} onChange={e => setNewAddress({...newAddress, full_name: e.target.value})} />
                      <Field label="Phone" type="tel" required value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                      <Field label="Street address" className="sm:col-span-2" required value={newAddress.street_address} onChange={e => setNewAddress({...newAddress, street_address: e.target.value})} />
                      <Field label="City" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                      <Field label="State" required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                      
                      <div className="sm:col-span-2 flex items-center justify-between mt-2">
                        {addresses.length > 0 && (
                          <button type="button" onClick={() => setShowNewAddress(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCreateAddress}
                          disabled={submitting}
                          className="rounded-full bg-card border border-border px-4 py-2 text-xs font-semibold hover:border-brand hover:text-brand ml-auto"
                        >
                          {submitting ? "Saving..." : "Save Address"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </fieldset>

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">Payment method</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <PayOption active={method === "card"} onClick={() => setMethod("card")} icon={CreditCard} label="Card" sub="Visa / Mastercard / Verve" />
                <PayOption active={method === "transfer"} onClick={() => setMethod("transfer")} icon={Building2} label="Bank transfer" sub="Pay via your bank app" />
                <PayOption active={method === "ussd"} onClick={() => setMethod("ussd")} icon={Smartphone} label="USSD" sub="*737#, *894# etc." />
              </div>
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
                <Row label="Subtotal" value={breakdown ? formatNaira(breakdown.subtotal) : "..."} />
                <Row
                  label={
                    <span className="inline-flex items-center gap-1">
                      Escrow fee <span className="text-[10px] text-muted-foreground">(1.5%)</span>
                    </span>
                  }
                  value={breakdown ? formatNaira(breakdown.escrow_fee) : "..."}
                />
                <Row
                  label={
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3 w-3" /> {fulfilment === "pickup" ? "In-mall pickup" : "Rider delivery"}
                    </span>
                  }
                  value={breakdown ? (breakdown.shipping_fee === 0 ? "Free" : formatNaira(breakdown.shipping_fee)) : "..."}
                />
                <div className="my-2 h-px bg-border" />
                <div className="flex items-center justify-between">
                  <dt className="font-display text-base font-semibold">Total</dt>
                  <dd className="font-display text-xl font-bold">{breakdown ? formatNaira(breakdown.total) : "..."}</dd>
                </div>
              </dl>

              <button
                disabled={submitting || !breakdown}
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Lock className="h-4 w-4" />
                {submitting ? "Processing…" : `Pay ${breakdown ? formatNaira(breakdown.total) : "..."} to escrow`}
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                By paying, you agree to Banex Mall's escrow terms.
              </p>
            </div>
          </aside>
        </form>
      )}
    </section>
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
