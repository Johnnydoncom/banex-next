"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useRef } from "react"
import { useCart } from "@/components/CartContext"
import { BankTransferUploadScreen } from "@/components/BankTransferUpload"
import { formatNaira } from "@/lib/products"
import {
  ShieldCheck,
  Lock,
  Truck,
  Building2,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Plus,
  ImageOff,
  Wallet as WalletIcon,
  CreditCard as CreditCardIcon,
  Smartphone as SmartphoneIcon,
  Landmark as LandmarkIcon,
  Upload,
  Loader2,
  AlertTriangle,
  FileImage,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  userCheckoutBreakdown,
  userCheckoutPlaceOrder,
  userFetchAddresses,
  userCreateAddress,
  userFetchPaymentMethods,
  userFetchWallet,
  userCheckoutValidateShipping,
  userUploadPaymentProof,
  type OrderData,
  type ShippingRate,
  type AddressData,
  type CheckoutBreakdown,
  type PaymentMethodData,
  type WalletData
} from "@/lib/user-api"

type Fulfilment = "delivery" | "pickup"

export default function CheckoutPage() {
  const { items, clear, isSyncing } = useCart()
  const { status } = useAuth()
  const router = useRouter()

  const [method, setMethod] = useState<string>("card")
  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery")
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])
  const [wallet, setWallet] = useState<WalletData | null>(null)

  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRateId, setSelectedRateId] = useState<string>("")
  const validateCacheRef = useRef<{ fType: string; addressId: string; itemsLen: number } | null>(null)

  const [breakdown, setBreakdown] = useState<CheckoutBreakdown | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  // Bank-transfer pending order — show receipt upload screen
  const [bankTransferOrder, setBankTransferOrder] = useState<OrderData | null>(null)

  // Ref to hold the AbortController for the in-flight breakdown request
  const breakdownAbortRef = useRef<AbortController | null>(null)
  // Ref to hold the debounce timer for breakdown fetches
  const breakdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // New address form
  const [newAddress, setNewAddress] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "NG"
  })

  // Ensure user is logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.info("Please log in to checkout")
      router.push("/login?callbackUrl=/checkout")
    }
  }, [status, router])

  // Fetch addresses, payment methods and wallet
  useEffect(() => {
    if (status === "authenticated") {
      Promise.all([
        userFetchAddresses(),
        userFetchPaymentMethods(),
        userFetchWallet().catch(() => null)
      ]).then(([addrData, methodsData, walletData]) => {
        setAddresses(addrData)
        const def = addrData.find(a => a.is_default) || addrData[0]
        if (def) setSelectedAddressId(def.id)
        else setShowNewAddress(true)

        setPaymentMethods(methodsData)
        if (walletData) setWallet(walletData.wallet)

        // Select first active method by default if current method isn't in list
        if (methodsData.length > 0 && !methodsData.find(m => m.slug === "card" || m.slug === method)) {
          setMethod(methodsData.find(m => m.status === "active")?.slug || "")
        }
      }).catch((err) => {
        console.error(err)
        toast.error("Failed to load checkout dependencies")
      })
    }
  }, [status])

  // Fetch breakdown when fulfilment, address or selected rate changes — debounced + abortable
  useEffect(() => {
    if (status !== "authenticated" || items.length === 0 || isSyncing) return
    if (fulfilment === "delivery" && !selectedAddressId) return

    if (breakdownTimerRef.current) clearTimeout(breakdownTimerRef.current)
    if (breakdownAbortRef.current) breakdownAbortRef.current.abort()

    const controller = new AbortController()
    breakdownAbortRef.current = controller

    breakdownTimerRef.current = setTimeout(async () => {
      if (controller.signal.aborted) return
      try {
        const fType = fulfilment === "pickup" ? "mall_pickup" : "delivery"
        let currentRateId = selectedRateId

        // 1. Fetch shipping validation & rates (only if address/fulfilment/items changed)
        const needsValidation =
          !validateCacheRef.current ||
          validateCacheRef.current.fType !== fType ||
          validateCacheRef.current.addressId !== (selectedAddressId || "") ||
          validateCacheRef.current.itemsLen !== items.length

        if (needsValidation) {
          const validateRes = await userCheckoutValidateShipping(
            fType,
            fType === "delivery" ? selectedAddressId : undefined
          )

          if (controller.signal.aborted) return

          if (validateRes) {
            const rates = validateRes.shipping?.rates || []
            setShippingRates(rates)
            // If current rate is invalid or empty, update it
            if (fType === "delivery" && (!currentRateId || !rates.find(r => r.id === currentRateId))) {
              currentRateId = validateRes.shipping?.suggested_rate_id || (rates.length > 0 ? rates[0].id : "")
              setSelectedRateId(currentRateId)
            }
          }

          validateCacheRef.current = {
            fType,
            addressId: selectedAddressId || "",
            itemsLen: items.length,
          }
        }

        // 2. Fetch final breakdown
        const bd = await userCheckoutBreakdown(
          fType,
          fType === "delivery" ? selectedAddressId : undefined,
          fType === "delivery" ? currentRateId : undefined
        )
        if (!controller.signal.aborted && bd) setBreakdown(bd)
      } catch (err: any) {
        if (!controller.signal.aborted) {
          toast.error(err.message || "Failed to calculate order total")
        }
      }
    }, 350)

    return () => {
      if (breakdownTimerRef.current) clearTimeout(breakdownTimerRef.current)
      controller.abort()
    }
  }, [fulfilment, selectedAddressId, selectedRateId, items.length, status, isSyncing])

  const handleCreateAddress = async () => {
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
    if (!method) {
      toast.error("Please select a payment method")
      return
    }

    setSubmitting(true)
    try {
      const fType = fulfilment === "pickup" ? "mall_pickup" : "delivery"
      // Build callback URL for Paystack to redirect back to after payment
      const callbackUrl = `${window.location.origin}/checkout/verify`
      const res = await userCheckoutPlaceOrder(
        fType,
        method,
        fType === "delivery" ? selectedAddressId : undefined,
        fType === "delivery" ? selectedRateId : undefined,
        callbackUrl
      )

      if (!res?.order) {
        toast.error("Unexpected response from server. Please try again.")
        return
      }

      clear()

      // If the API returns a Paystack authorization_url, redirect the user there to complete payment
      if (res.payment_intent?.authorization_url) {
        toast.success("Redirecting to payment gateway…")
        // Store orderId so the verify page can use it as fallback
        sessionStorage.setItem("pending_order_id", res.order.id)
        // Small delay so the toast is visible before navigation
        await new Promise(r => setTimeout(r, 800))
        window.location.href = res.payment_intent.authorization_url
        return
      }

      // For manual/bank-transfer payments: show receipt upload screen
      const selectedPm = paymentMethods.find(pm => pm.id === method)
      if (selectedPm?.slug === "manual" || selectedPm?.manual_payment_instructions) {
        setBankTransferOrder(res.order)
        toast.success("Order placed! Please upload your bank transfer receipt.")
        return
      }

      // For wallet or other non-redirect payments, show the confirmation screen directly
      setDone(res.order.reference)
      toast.success("Order placed successfully")
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

  if (bankTransferOrder) {
    return (
      <BankTransferUploadScreen
        order={bankTransferOrder}
        paymentInstructions={paymentMethods.find(pm => pm.id === method)?.manual_payment_instructions}
        onSuccess={() => router.push(`/account/orders/${bankTransferOrder.id}`)}
        onSkip={() => router.push(`/account/orders/${bankTransferOrder.id}`)}
      />
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
                          className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${selectedAddressId === addr.id ? "border-brand bg-brand-soft/15" : "border-border bg-background hover:border-brand/60"
                            }`}
                        >
                          <span className="font-semibold text-sm">{addr.first_name} {addr.last_name}</span>
                          <span className="mt-1 text-xs text-muted-foreground line-clamp-1">{addr.street}</span>
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
                      <Field label="First name" required value={newAddress.first_name} onChange={e => setNewAddress({ ...newAddress, first_name: e.target.value })} />
                      <Field label="Last name" required value={newAddress.last_name} onChange={e => setNewAddress({ ...newAddress, last_name: e.target.value })} />
                      <Field label="Phone" type="tel" required value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
                      <Field label="Street address" className="sm:col-span-2" required value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} />
                      <Field label="City" required value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                      <Field label="State" required value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />

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

            {/* Shipping Rates */}
            {fulfilment === "delivery" && shippingRates.length > 0 && !showNewAddress && (
              <fieldset className="rounded-2xl border border-border bg-card p-6">
                <legend className="px-1 font-display text-base font-semibold">Shipping Method</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {shippingRates.map((rate) => (
                    <button
                      key={rate.id}
                      type="button"
                      onClick={() => setSelectedRateId(rate.id)}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${selectedRateId === rate.id ? "border-brand bg-brand-soft/15" : "border-border bg-background hover:border-brand/60"
                        }`}
                    >
                      <span className="font-semibold text-sm">{rate.name}</span>
                      <span className="mt-1 text-xs text-muted-foreground">{rate.delivery_window}</span>
                      <span className="mt-2 text-sm font-semibold text-brand">{formatNaira(rate.fee)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">Payment method</legend>
              {paymentMethods.length === 0 ? (
                <div className="mt-3 text-sm text-muted-foreground animate-pulse">Loading payment methods...</div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map(pm => {
                    if (pm.status !== "active") return null

                    const isWallet = pm.slug === "wallet"
                    const walletInsufficient = isWallet && breakdown?.summary && wallet && wallet.balance < breakdown.summary.total
                    const disabled = !!walletInsufficient
                    const icon = isWallet ? WalletIcon : (pm.slug.includes("card") ? CreditCardIcon : (pm.slug.includes("transfer") ? LandmarkIcon : SmartphoneIcon))

                    return (
                      <PayOption
                        key={pm.id}
                        active={method === pm.id}
                        onClick={() => { if (!disabled) setMethod(pm.id) }}
                        slug={pm.slug}
                        icon={icon}
                        imageUrl={pm.image || undefined}
                        label={pm.name}
                        sub={isWallet && wallet ? `Balance: ${formatNaira(wallet.balance)}` : undefined}
                        disabled={disabled}
                      />
                    )
                  })}
                </div>
              )}
            </fieldset>

            {(() => {
              const selectedPm = paymentMethods.find(pm => pm.id === method)
              const instructions = selectedPm?.manual_payment_instructions
              if (instructions && typeof instructions === 'object') {
                return (
                  <div className="rounded-2xl border border-[#0ba4db]/30 bg-[#0ba4db]/5 p-5 text-sm">
                    <p className="flex items-center gap-2 font-display font-semibold text-[#0ba4db]">
                      <LandmarkIcon className="h-4 w-4" /> Payment Instructions
                    </p>
                    <div className="mt-3 space-y-2 text-muted-foreground">
                      {instructions.bank_name && (
                        <p><strong className="text-foreground">Bank:</strong> {instructions.bank_name}</p>
                      )}
                      {instructions.account_name && (
                        <p><strong className="text-foreground">Account Name:</strong> {instructions.account_name}</p>
                      )}
                      {instructions.account_number && (
                        <p><strong className="text-foreground">Account Number:</strong> {instructions.account_number}</p>
                      )}
                      {instructions.instructions && (
                        <div className="pt-2 mt-2 border-t border-[#0ba4db]/10 whitespace-pre-wrap leading-relaxed">
                          {instructions.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              return null
            })()}

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
                    {it.productImage ? (
                      <img src={it.productImage} alt={it.productName} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
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
                <Row label="Subtotal" value={breakdown?.summary ? formatNaira(breakdown.summary.subtotal) : "..."} />
                {breakdown?.summary?.escrow_fee !== undefined && (
                  <Row
                    label={
                      <span className="inline-flex items-center gap-1">
                        Escrow fee <span className="text-[10px] text-muted-foreground">(1.5%)</span>
                      </span>
                    }
                    value={formatNaira(breakdown.summary.escrow_fee)}
                  />
                )}
                <Row
                  label={
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3 w-3" /> {fulfilment === "pickup" ? "In-mall pickup" : "Rider delivery"}
                    </span>
                  }
                  value={breakdown?.summary ? (breakdown.summary.delivery_fee === 0 || !breakdown.summary.delivery_fee ? "Free" : formatNaira(breakdown.summary.delivery_fee)) : "..."}
                />
                <div className="my-2 h-px bg-border" />
                <div className="flex items-center justify-between">
                  <dt className="font-display text-base font-semibold">Total</dt>
                  <dd className="font-display text-xl font-bold">{breakdown?.summary ? formatNaira(breakdown.summary.total) : "..."}</dd>
                </div>
              </dl>

              <button
                disabled={submitting || !breakdown}
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Lock className="h-4 w-4" />
                {submitting ? "Processing…" : `Pay ${breakdown?.summary ? formatNaira(breakdown.summary.total) : "..."} to escrow`}
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

function PaystackLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M141.8 196.3h228.4v119.4H141.8z" fill="#0ba4db" />
      <path d="M141.8 77.2h228.4v107.5H141.8zM141.8 327.2h228.4v107.6H141.8z" fill="#0a2a4b" />
    </svg>
  )
}

function PayOption({
  active,
  onClick,
  slug,
  icon: Icon,
  imageUrl,
  label,
  sub,
  disabled
}: {
  active: boolean
  onClick: () => void
  slug?: string
  icon: React.ComponentType<{ className?: string }>
  imageUrl?: string
  label: string
  sub?: string
  disabled?: boolean
}) {
  const isPaystack = slug === "paystack"
  const isWallet = slug === "wallet"

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
        active
          ? isWallet 
            ? "border-brand bg-brand-soft/10 ring-1 ring-brand/20 shadow-sm"
            : "border-[#0ba4db] bg-[#0ba4db]/5 ring-1 ring-[#0ba4db]/20 shadow-sm"
          : disabled
            ? "border-border bg-surface/50 opacity-50 cursor-not-allowed"
            : "border-border bg-card hover:border-brand/40 hover:bg-surface/30"
      }`}
    >
      {/* Icon */}
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${
        active
          ? isWallet ? "border-brand/30 bg-brand/10 text-brand" : "border-[#0ba4db]/30 bg-[#0ba4db]/10 text-[#0ba4db]"
          : "border-border bg-background text-muted-foreground group-hover:text-foreground group-hover:border-border/80"
      }`}>
        {isPaystack ? (
          <PaystackLogo className="h-5 w-auto" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={label} className="h-5 w-auto object-contain" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      {/* Label and Sub */}
      <div className="flex-1 overflow-hidden">
        <span className={`block truncate font-display text-sm font-semibold ${active ? "text-foreground" : "text-foreground"}`}>
          {label}
        </span>
        {sub && !disabled && (
          <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">
            {sub}
          </span>
        )}
        {disabled && (
          <span className="mt-0.5 block truncate text-[11px] font-bold text-rose-500">
            Insufficient funds
          </span>
        )}
      </div>

      {/* Radio indicator */}
      <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
        active 
          ? isWallet ? "border-brand bg-brand text-white" : "border-[#0ba4db] bg-[#0ba4db] text-white"
          : "border-muted-foreground/30"
      }`}>
        {active && (
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        )}
      </div>
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
