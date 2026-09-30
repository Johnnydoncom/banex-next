"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ShieldCheck,
  Lock,
  Truck,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ImageOff,
  CreditCard,
  Smartphone,
  Loader2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { useCart, type CartItem } from "@/components/CartContext"
import { formatNaira } from "@/lib/products"
import { userFetchPaymentMethods, type PaymentMethodData, type ShippingRate } from "@/lib/user-api"
import {
  guestValidateShipping,
  guestCheckoutBreakdown,
  guestPlaceOrder,
  guestApiError,
  isAbortError,
  GUEST_ERROR,
  type GuestAddress,
  type GuestApiError,
  type GuestBreakdown,
  type GuestFulfillment,
  type GuestLine,
  type GuestOrderResult,
  type GuestPickupLocation,
} from "@/lib/guest-api"
import {
  saveGuestOrder,
  useGuestOrders,
  openUnpaidGuestOrder,
  guestPaymentMethods,
  guestCallbackUrl,
  resumeGuestPayment,
} from "@/lib/guest-orders"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, PayOption, Row } from "./checkout-ui"

type Fulfilment = "delivery" | "pickup"

type Contact = { firstName: string; lastName: string; email: string; phone: string }
type Street = { street: string; street_line_2: string; city: string; state: string }
type Recipient = { first_name: string; last_name: string; phone: string }

const emptyContact: Contact = { firstName: "", lastName: "", email: "", phone: "" }
const emptyStreet: Street = { street: "", street_line_2: "", city: "", state: "" }
const emptyRecipient: Recipient = { first_name: "", last_name: "", phone: "" }

// What the guest has typed survives a refresh (this tab only); cleared once the order is placed.
const DRAFT_KEY = "banex.guest-checkout"
const MAX_QTY = 99 // the guest endpoints reject quantities above this
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validPhone = (v: string) => v.replace(/\D/g, "").length >= 7

type Draft = { contact: Contact; street: Street; recipient: Recipient; fulfilment: Fulfilment; otherRecipient: boolean }

// Read once when the form mounts. Safe as initial state: the guest form only ever
// mounts in the browser, after the session check has finished.
function loadDraft(): Draft {
  const draft: Draft = { contact: emptyContact, street: emptyStreet, recipient: emptyRecipient, fulfilment: "delivery", otherRecipient: false }
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || "null")
    if (saved && typeof saved === "object") {
      if (saved.contact) draft.contact = { ...emptyContact, ...saved.contact }
      if (saved.street) draft.street = { ...emptyStreet, ...saved.street }
      if (saved.recipient) draft.recipient = { ...emptyRecipient, ...saved.recipient }
      if (saved.fulfilment === "pickup" || saved.fulfilment === "delivery") draft.fulfilment = saved.fulfilment
      if (typeof saved.otherRecipient === "boolean") draft.otherRecipient = saved.otherRecipient
    }
  } catch {}
  return draft
}

/** Cart → API lines: the same product/variant is merged and quantities kept in range. */
function toGuestLines(items: CartItem[]): GuestLine[] {
  const merged = new Map<string, GuestLine>()
  for (const it of items) {
    const key = `${it.productId}:${it.productVariantId ?? ""}`
    const quantity = Math.min(MAX_QTY, Math.max(1, (merged.get(key)?.quantity ?? 0) + it.qty))
    merged.set(key, {
      product_id: it.productId,
      ...(it.productVariantId ? { product_variant_id: it.productVariantId } : {}),
      quantity,
    })
  }
  return Array.from(merged.values())
}

// Identifies the part of an address that delivery rates depend on.
const streetKey = (a: { street: string; street_line_2?: string; city: string; state: string }) =>
  [a.street, a.street_line_2 ?? "", a.city, a.state].map((s) => s.trim().toLowerCase()).join("|")

/** Turn a per-item API failure into something a shopper can act on. */
function lineProblem(info: GuestApiError) {
  if (info.status === 404 || info.code === GUEST_ERROR.productNotFound) return "No longer available."
  if (info.fields.product_variant_id) return "Pick an option on the product page and add it again."
  if (Object.keys(info.fields).some((k) => k.endsWith(".quantity"))) return `Quantity must be between 1 and ${MAX_QTY}.`
  return info.message
}

export function GuestCheckout() {
  const { items, clear, remove, isSyncing } = useCart()

  // ── Form ───────────────────────────────────────────────────────────────────
  const [draft] = useState(loadDraft)
  const [contact, setContact] = useState<Contact>(draft.contact)
  const [fulfilment, setFulfilment] = useState<Fulfilment>(draft.fulfilment)
  const [street, setStreet] = useState<Street>(draft.street)
  const [otherRecipient, setOtherRecipient] = useState(draft.otherRecipient)
  const [recipient, setRecipient] = useState<Recipient>(draft.recipient)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Payment ────────────────────────────────────────────────────────────────
  const [methods, setMethods] = useState<PaymentMethodData[] | null>(null) // null = loading
  const [methodId, setMethodId] = useState("")

  // ── Pricing ────────────────────────────────────────────────────────────────
  // The address the delivery options were requested for. Editing the street,
  // city or state afterwards makes those options (and the total) stale.
  const [quotedAddress, setQuotedAddress] = useState<GuestAddress | null>(null)
  const [quote, setQuote] = useState<{ key: string; rates: ShippingRate[]; pickup: GuestPickupLocation | null } | null>(null)
  const [selectedRateId, setSelectedRateId] = useState("")
  const [pricing, setPricing] = useState<{ key: string; breakdown: GuestBreakdown } | null>(null)
  const [pricingError, setPricingError] = useState<{ key: string; message: string } | null>(null)
  const [lineIssues, setLineIssues] = useState<Record<string, string>>({}) // cart item id → what's wrong with it
  const [attempt, setAttempt] = useState(0)
  const quoteKeyRef = useRef<string | null>(null) // scope the cached shipping options belong to
  const pricedRef = useRef<string | null>(null) // last request that was priced successfully

  // ── Order ──────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)
  const [outcome, setOutcome] = useState<{ result: GuestOrderResult; paymentUrl: string | null } | null>(null)

  const fType: GuestFulfillment = fulfilment === "pickup" ? "mall_pickup" : "delivery"
  const lines = useMemo(() => toGuestLines(items), [items])
  const linesKey = lines.map((l) => `${l.product_id}:${l.product_variant_id ?? ""}:${l.quantity}`).join("|")
  const quotedKey = quotedAddress ? streetKey(quotedAddress) : ""
  const addressStale = fType === "delivery" && !!quotedAddress && quotedKey !== streetKey(street)

  // scopeKey: what the shipping options depend on. priceKey: what the total depends on.
  const scopeKey = `${fType}|${linesKey}|${fType === "delivery" ? quotedKey : ""}`
  const priceKey = `${scopeKey}|${fType === "delivery" ? selectedRateId : "mall_pickup"}`
  const ready = lines.length > 0 && !isSyncing && (fType === "mall_pickup" || !!quotedAddress)

  // Only ever show results that belong to what is on screen right now.
  const currentQuote = quote?.key === scopeKey ? quote : null
  const breakdown = pricing?.key === priceKey && !addressStale ? pricing.breakdown : null
  const priceError = pricingError?.key === priceKey && !addressStale ? pricingError.message : null
  // A flagged item stays flagged until it is removed or the cart prices cleanly.
  const issues = Object.fromEntries(Object.entries(lineIssues).filter(([id]) => items.some((it) => it.id === id)))
  const hasIssues = Object.keys(issues).length > 0
  const calculating = ready && !addressStale && !breakdown && !priceError

  // ── Draft: keep what has been typed ────────────────────────────────────────
  useEffect(() => {
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ contact, street, recipient, fulfilment, otherRecipient }))
    } catch {}
  }, [contact, street, recipient, fulfilment, otherRecipient])

  // ── Payment methods a guest can use ────────────────────────────────────────
  useEffect(() => {
    let active = true
    userFetchPaymentMethods()
      .then((all) => {
        if (!active) return
        const usable = guestPaymentMethods(all)
        setMethods(usable)
        setMethodId((current) => (usable.some((m) => m.id === current) ? current : usable[0]?.id ?? ""))
      })
      .catch(() => {
        if (active) setMethods([])
      })
    return () => {
      active = false
    }
  }, [])

  // ── Shipping options + totals (debounced, cancellable) ─────────────────────
  useEffect(() => {
    if (!ready) return
    const requestKey = `${priceKey}#${attempt}`
    if (pricedRef.current === requestKey) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const address = fType === "delivery" ? quotedAddress ?? undefined : undefined
      try {
        // 1. Shipping options — only when the cart, the mode or the address changed.
        if (quoteKeyRef.current !== scopeKey) {
          const validation = await guestValidateShipping({ fulfillmentType: fType, items: lines, address }, controller.signal)
          if (controller.signal.aborted) return
          const rates = validation.shipping?.rates ?? []
          quoteKeyRef.current = scopeKey
          setQuote({ key: scopeKey, rates, pickup: validation.pickup_location ?? null })

          if (fType === "delivery") {
            if (rates.length === 0) {
              setPricingError({ key: priceKey, message: "We don't deliver to this address yet. Try in-mall pickup instead." })
              return
            }
            if (!rates.some((r) => r.id === selectedRateId)) {
              const suggested = validation.shipping?.suggested_rate_id
              // Selecting a rate changes priceKey, which re-runs this effect to price it.
              setSelectedRateId(rates.some((r) => r.id === suggested) ? (suggested as string) : rates[0].id)
              return
            }
          }
        }

        // 2. Totals.
        const result = await guestCheckoutBreakdown(
          { fulfillmentType: fType, items: lines, address, rateId: fType === "delivery" ? selectedRateId : undefined },
          controller.signal,
        )
        if (controller.signal.aborted) return
        pricedRef.current = requestKey
        setPricing({ key: priceKey, breakdown: result })
        setPricingError(null)
        setLineIssues({})
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) return
        const info = guestApiError(err, "We couldn't calculate your order total.")
        let message = info.message
        if (info.code === GUEST_ERROR.rateUnavailable) {
          quoteKeyRef.current = null // the options are no longer valid — fetch them again next time
          message = "We couldn't find a delivery option for this address. Check the city and state, or choose in-mall pickup."
        }
        setPricingError({ key: priceKey, message })

        // A problem with a product? Find out which one so it can be removed.
        const itemRelated =
          info.status === 404 ||
          info.code === GUEST_ERROR.productNotFound ||
          Object.keys(info.fields).some((k) => k.startsWith("items") || k === "product_variant_id")
        if (itemRelated) {
          const checked = await Promise.all(
            items.map(async (it) => {
              try {
                await guestCheckoutBreakdown({ fulfillmentType: "mall_pickup", items: toGuestLines([it]) }, controller.signal)
                return null
              } catch (e) {
                const problem = guestApiError(e)
                return problem.status === 0 ? null : ([it.id, lineProblem(problem)] as const)
              }
            }),
          )
          if (controller.signal.aborted) return
          const found = Object.fromEntries(checked.filter((c): c is readonly [string, string] => c !== null))
          setLineIssues(found)
          if (Object.keys(found).length > 0) {
            setPricingError({ key: priceKey, message: "Some items in your cart can't be ordered. Remove them to continue." })
          }
        }
      }
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // `lines`/`items` are covered by linesKey (inside scopeKey/priceKey).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fType, scopeKey, priceKey, selectedRateId, quotedAddress, attempt])

  // ── Field helpers ──────────────────────────────────────────────────────────
  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: "" } : e))
  const onContact = (key: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setContact((c) => ({ ...c, [key]: e.target.value }))
    clearError(key)
  }
  const onStreet = (key: keyof Street) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setStreet((s) => ({ ...s, [key]: e.target.value }))
    clearError(key)
  }
  const onRecipient = (key: keyof Recipient) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient((r) => ({ ...r, [key]: e.target.value }))
    clearError(`recipient_${key}`)
  }

  // Who receives a delivery: the buyer, unless they named someone else.
  const receiver: Recipient = otherRecipient
    ? recipient
    : { first_name: contact.firstName, last_name: contact.lastName, phone: contact.phone }

  const buildAddress = (): GuestAddress => ({
    first_name: receiver.first_name.trim(),
    last_name: receiver.last_name.trim(),
    phone: receiver.phone.trim(),
    street: street.street.trim(),
    ...(street.street_line_2.trim() ? { street_line_2: street.street_line_2.trim() } : {}),
    city: street.city.trim(),
    state: street.state.trim(),
  })

  /** "delivery" checks what a shipping quote needs; "order" checks everything. */
  const validate = (scope: "delivery" | "order") => {
    const e: Record<string, string> = {}

    // The buyer's own name and phone: always needed to order, and needed for a
    // delivery quote when the buyer is also the one receiving it.
    if (scope === "order" || !otherRecipient) {
      if (!contact.firstName.trim()) e.firstName = "Enter your first name."
      if (!contact.lastName.trim()) e.lastName = "Enter your last name."
      if (!validPhone(contact.phone)) e.phone = "Enter a valid phone number."
    }
    if (scope === "order" && !EMAIL_RE.test(contact.email.trim())) e.email = "Enter a valid email address."

    if (fulfilment === "delivery") {
      if (otherRecipient) {
        if (!recipient.first_name.trim()) e.recipient_first_name = "Enter the recipient's first name."
        if (!recipient.last_name.trim()) e.recipient_last_name = "Enter the recipient's last name."
        if (!validPhone(recipient.phone)) e.recipient_phone = "Enter the recipient's phone number."
      }
      if (!street.street.trim()) e.street = "Enter the street address."
      if (!street.city.trim()) e.city = "Enter the city."
      if (!street.state.trim()) e.state = "Enter the state."
    }
    return e
  }

  const showErrors = (e: Record<string, string>) => {
    setErrors(e)
    const first = Object.values(e).find(Boolean)
    if (first) toast.error(first)
    return !first
  }

  // Ask again even when nothing changed (after an error, or the same address).
  const requote = () => {
    quoteKeyRef.current = null
    pricedRef.current = null
    setPricingError(null)
    setAttempt((a) => a + 1)
  }

  const getDeliveryOptions = () => {
    if (!showErrors(validate("delivery"))) return
    setQuotedAddress(buildAddress())
    requote()
  }

  // ── Place order ────────────────────────────────────────────────────────────
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitLock.current) return
    if (!showErrors(validate("order"))) return
    if (fType === "delivery" && (!quotedAddress || addressStale || !selectedRateId)) {
      toast.error("Choose a delivery option for your address first.")
      return
    }
    if (!breakdown) {
      toast.error("Your order total is still being calculated.")
      return
    }
    if (!methodId) {
      toast.error("Choose a payment method.")
      return
    }

    submitLock.current = true
    setSubmitting(true)
    let leaving = false
    try {
      const email = contact.email.trim()
      const result = await guestPlaceOrder({
        fulfillmentType: fType,
        items: lines,
        name: `${contact.firstName.trim()} ${contact.lastName.trim()}`,
        email,
        phone: contact.phone.trim(),
        paymentMethodId: methodId,
        callbackUrl: guestCallbackUrl(),
        // The rates were quoted for quotedAddress; who receives it may have been edited since.
        address: fType === "delivery" ? buildAddress() : undefined,
        rateId: fType === "delivery" ? selectedRateId : undefined,
      })
      if (!result?.order?.reference) throw new Error("Unexpected response from the server. Please try again.")

      // Remember the order on this device: the payment callback needs the email,
      // and it lets the buyer come back to track it or finish paying.
      saveGuestOrder({
        reference: result.order.reference,
        email,
        paymentReference: result.payment_intent?.reference ?? null,
        total: result.total_amount ?? result.order.summary?.total ?? breakdown.summary.total,
        placedAt: Date.now(),
        paid: false,
      })
      try {
        window.sessionStorage.removeItem(DRAFT_KEY)
      } catch {}

      const paymentUrl = result.payment_intent?.authorization_url ?? null
      setOutcome({ result, paymentUrl }) // before clearing the cart, so the empty-cart screen never flashes
      await clear()

      if (paymentUrl) {
        leaving = true
        window.location.assign(paymentUrl)
      }
    } catch (err) {
      const info = guestApiError(err, "We couldn't place your order. Please try again.")
      const f = info.fields
      const mapped: Record<string, string> = {}
      if (f.name) mapped.firstName = f.name
      if (f.email) mapped.email = f.email
      if (f.phone) mapped.phone = f.phone
      if (f["address.first_name"]) mapped[otherRecipient ? "recipient_first_name" : "firstName"] = f["address.first_name"]
      if (f["address.last_name"]) mapped[otherRecipient ? "recipient_last_name" : "lastName"] = f["address.last_name"]
      if (f["address.phone"]) mapped[otherRecipient ? "recipient_phone" : "phone"] = f["address.phone"]
      if (f["address.street"]) mapped.street = f["address.street"]
      if (f["address.city"]) mapped.city = f["address.city"]
      if (f["address.state"]) mapped.state = f["address.state"]
      if (Object.keys(mapped).length) setErrors(mapped)
      toast.error(info.message)
      // Prices, stock or delivery options may have moved — get fresh numbers.
      if (info.status !== 0) requote()
    } finally {
      if (!leaving) {
        submitLock.current = false
        setSubmitting(false)
      }
    }
  }

  // ── Screens ────────────────────────────────────────────────────────────────
  if (outcome) return <OrderPlaced outcome={outcome} />

  if (isSyncing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    )
  }

  const pickup = currentQuote?.pickup ?? breakdown?.pickup_location ?? null
  const rates = fType === "delivery" && !addressStale ? currentQuote?.rates ?? [] : []
  const summary = breakdown?.summary
  const canPay = !!breakdown && !!methodId && !hasIssues && !submitting

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
        <>
          <UnpaidOrderNotice />
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
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/60 px-5 py-4 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <UserRound className="h-4 w-4 flex-none text-brand" />
                <span>
                  <span className="font-semibold text-foreground">Checking out as a guest.</span> No account needed.
                </span>
              </p>
              <Link href="/login?callbackUrl=/checkout" className="font-semibold text-brand hover:underline">
                Have an account? Sign in
              </Link>
            </div>

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">Your details</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="First name" autoComplete="given-name" value={contact.firstName} onChange={onContact("firstName")} error={errors.firstName} />
                <Field label="Last name" autoComplete="family-name" value={contact.lastName} onChange={onContact("lastName")} error={errors.lastName} />
                <Field label="Email" type="email" inputMode="email" autoComplete="email" value={contact.email} onChange={onContact("email")} error={errors.email} />
                <Field label="Phone" type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={onContact("phone")} error={errors.phone} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                You&apos;ll need this email and your order reference to track the order.
              </p>
            </fieldset>

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">Fulfilment</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <PayOption active={fulfilment === "delivery"} onClick={() => setFulfilment("delivery")} icon={Truck} label="Rider delivery" sub="To your address · Cost varies" />
                <PayOption active={fulfilment === "pickup"} onClick={() => setFulfilment("pickup")} icon={Building2} label="In-mall pickup" sub="Collect at Banex Mall · Free" />
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">
                {fulfilment === "pickup" ? "Pickup location" : "Delivery address"}
              </legend>

              {fulfilment === "pickup" ? (
                <div className="mt-3 flex items-start gap-3 rounded-xl bg-surface/60 p-4 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 flex-none text-brand" />
                  {pickup ? (
                    <p>
                      <strong className="text-foreground">{pickup.name}</strong>
                      <br />
                      {[pickup.street, pickup.street_line_2, pickup.city].filter(Boolean).join(", ")}
                      {pickup.phone ? (
                        <>
                          <br />
                          {pickup.phone}
                        </>
                      ) : null}
                    </p>
                  ) : (
                    <p>Collect your order at Banex Mall. We&apos;ll let you know when it&apos;s ready.</p>
                  )}
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Street address" className="sm:col-span-2" autoComplete="address-line1" value={street.street} onChange={onStreet("street")} error={errors.street} />
                  <Field label="Apartment, landmark (optional)" className="sm:col-span-2" autoComplete="address-line2" value={street.street_line_2} onChange={onStreet("street_line_2")} />
                  <Field label="City" autoComplete="address-level2" value={street.city} onChange={onStreet("city")} error={errors.city} />
                  <Field label="State" autoComplete="address-level1" value={street.state} onChange={onStreet("state")} error={errors.state} />

                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground sm:col-span-2">
                    <Checkbox checked={otherRecipient} onCheckedChange={(v) => setOtherRecipient(v === true)} />
                    Someone else will receive this order
                  </label>
                  {otherRecipient && (
                    <>
                      <Field label="Recipient first name" value={recipient.first_name} onChange={onRecipient("first_name")} error={errors.recipient_first_name} />
                      <Field label="Recipient last name" value={recipient.last_name} onChange={onRecipient("last_name")} error={errors.recipient_last_name} />
                      <Field label="Recipient phone" type="tel" inputMode="tel" className="sm:col-span-2" value={recipient.phone} onChange={onRecipient("phone")} error={errors.recipient_phone} />
                    </>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      {addressStale
                        ? "The address changed — update the delivery options."
                        : quotedAddress
                          ? "Delivery options are shown below."
                          : "We'll show the delivery options and cost for this address."}
                    </p>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={getDeliveryOptions}
                      className={`ml-auto rounded-full border px-4 py-2 text-xs font-semibold hover:border-brand hover:bg-brand-soft/25 hover:text-brand-deep ${
                        !quotedAddress || addressStale ? "border-brand bg-brand-soft/15 text-brand-deep" : "border-border bg-card"
                      }`}
                    >
                      {quotedAddress ? "Update delivery options" : "See delivery options"}
                    </Button>
                  </div>
                </div>
              )}
            </fieldset>

            {rates.length > 0 && (
              <fieldset className="rounded-2xl border border-border bg-card p-6">
                <legend className="px-1 font-display text-base font-semibold">Shipping method</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {rates.map((rate) => (
                    <button
                      key={rate.id}
                      type="button"
                      aria-pressed={selectedRateId === rate.id}
                      onClick={() => setSelectedRateId(rate.id)}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        selectedRateId === rate.id ? "border-brand bg-brand-soft/15" : "border-border bg-background hover:border-brand/60"
                      }`}
                    >
                      <span className="text-sm font-semibold">{rate.name}</span>
                      {rate.delivery_window && <span className="mt-1 text-xs text-muted-foreground">{rate.delivery_window}</span>}
                      <span className="mt-2 text-sm font-semibold text-brand">{formatNaira(rate.fee)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="rounded-2xl border border-border bg-card p-6">
              <legend className="px-1 font-display text-base font-semibold">Payment method</legend>
              {methods === null ? (
                <div className="mt-3 animate-pulse text-sm text-muted-foreground">Loading payment methods...</div>
              ) : methods.length === 0 ? (
                <p className="mt-3 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                  Online payment isn&apos;t available for guest checkout right now.{" "}
                  <Link href="/login?callbackUrl=/checkout" className="font-semibold underline">
                    Sign in
                  </Link>{" "}
                  to see other ways to pay.
                </p>
              ) : (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {methods.map((pm) => (
                      <PayOption
                        key={pm.id}
                        active={methodId === pm.id}
                        onClick={() => setMethodId(pm.id)}
                        slug={pm.slug}
                        icon={pm.slug.includes("card") ? CreditCard : Smartphone}
                        imageUrl={pm.image || undefined}
                        label={pm.name}
                        sub={pm.slug === "paystack" ? "Card, bank transfer or USSD" : undefined}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Wallet and direct bank transfer are available when you{" "}
                    <Link href="/login?callbackUrl=/checkout" className="font-medium text-brand hover:underline">
                      sign in
                    </Link>
                    .
                  </p>
                </>
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
                <li>Banex releases the funds to the seller. Issue? Open a dispute and we&apos;ll investigate.</li>
              </ol>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="font-display text-base font-semibold">Order summary</p>
              <ul className="mt-4 divide-y divide-border/60">
                {items.map((it) => {
                  // Prices come from the server quote once there is one — the cart's copy may be out of date.
                  const quoted = breakdown?.cart.items.find(
                    (q) => q.product_id === it.productId && (!it.productVariantId || q.product_variant_id === it.productVariantId),
                  )
                  const unit = quoted ? Number(quoted.unit_price) : it.price
                  const attrs = it.variantAttributes ? Object.values(it.variantAttributes).join(" · ") : ""
                  return (
                    <li key={it.id} className="flex gap-3 py-3">
                      {it.productImage ? (
                        <img src={it.productImage} alt={it.productName} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">{it.productName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {attrs ? `${attrs} · ` : ""}Qty {Math.min(it.qty, MAX_QTY)}
                        </p>
                        {issues[it.id] && (
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] font-medium text-rose-600">
                            {issues[it.id]}
                            <button type="button" onClick={() => remove(it.id)} className="inline-flex items-center gap-1 font-semibold underline">
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold">{formatNaira(unit * Math.min(it.qty, MAX_QTY))}</p>
                    </li>
                  )
                })}
              </ul>

              <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                <Row label="Subtotal" value={summary ? formatNaira(summary.subtotal) : "..."} />
                <Row
                  label={
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3 w-3" /> {fulfilment === "pickup" ? "In-mall pickup" : "Rider delivery"}
                    </span>
                  }
                  value={summary ? (summary.delivery_fee ? formatNaira(summary.delivery_fee) : "Free") : "..."}
                />
                {!!summary?.vat_amount && <Row label="VAT" value={formatNaira(summary.vat_amount)} />}
                <div className="my-2 h-px bg-border" />
                <div className="flex items-center justify-between">
                  <dt className="font-display text-base font-semibold">Total</dt>
                  <dd className="font-display text-xl font-bold">{summary ? formatNaira(summary.total) : "..."}</dd>
                </div>
              </dl>

              {priceError ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                  <p className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" /> {priceError}
                  </p>
                  {!hasIssues && (
                    <button type="button" onClick={requote} className="mt-2 inline-flex items-center gap-1 font-semibold underline">
                      <RefreshCw className="h-3 w-3" /> Try again
                    </button>
                  )}
                </div>
              ) : calculating ? (
                <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" /> Calculating your total…
                </p>
              ) : !breakdown ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  {addressStale
                    ? "Update the delivery options to see your new total."
                    : "Enter your delivery address to see delivery options and your total."}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={!canPay}
                className="mt-5 h-auto w-full gap-2 rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-primary-foreground"
              >
                <Lock className="h-4 w-4" />
                {submitting ? "Processing…" : summary ? `Pay ${formatNaira(summary.total)} to escrow` : "Pay to escrow"}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                By paying, you agree to Banex Mall&apos;s escrow terms.
              </p>
            </div>
          </aside>
        </form>
      )}
    </section>
  )
}

// ─── After the order is created ───────────────────────────────────────────────

function OrderPlaced({ outcome }: { outcome: { result: GuestOrderResult; paymentUrl: string | null } }) {
  const { result, paymentUrl } = outcome
  const reference = result.order.reference
  const total = result.total_amount ?? result.order.summary?.total
  const bank = result.manual_payment_instructions

  // Normally the browser is already on its way to the payment page.
  if (paymentUrl) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand" />
        <h1 className="font-display text-2xl font-bold">Taking you to secure payment…</h1>
        <p className="text-sm text-muted-foreground">
          Your order <span className="font-semibold text-foreground">{reference}</span> has been created.
        </p>
        <a href={paymentUrl} className="text-sm font-semibold text-brand hover:underline">
          Not redirected? Continue to payment
        </a>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft/40">
        <CheckCircle2 className="h-8 w-8 text-brand-deep" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">Order placed</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Keep your order reference — you&apos;ll need it, with your email, to track this order.
        {!bank && " It hasn't been paid for yet: open Track order to complete the payment."}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
        Order reference: <span className="font-display font-semibold">{reference}</span>
      </div>
      {bank && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#0ba4db]/30 bg-[#0ba4db]/5 p-5 text-left text-sm text-muted-foreground">
          <p className="font-display font-semibold text-[#0ba4db]">
            Transfer {total != null ? formatNaira(total) : "the order total"} to:
          </p>
          {bank.bank_name && <p className="mt-2"><strong className="text-foreground">Bank:</strong> {bank.bank_name}</p>}
          {bank.account_name && <p><strong className="text-foreground">Account name:</strong> {bank.account_name}</p>}
          {bank.account_number && <p><strong className="text-foreground">Account number:</strong> {bank.account_number}</p>}
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={`/track-order?reference=${encodeURIComponent(reference)}`}
          className="rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Track order
        </Link>
        <Link href="/" className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand">
          Back to home
        </Link>
      </div>
    </section>
  )
}

// ─── An order from this device that was never paid ────────────────────────────
// The cart is emptied when an order is created, so a buyer who abandons the
// payment page would otherwise have no way back to it.

function UnpaidOrderNotice() {
  const order = openUnpaidGuestOrder(useGuestOrders())
  const [busy, setBusy] = useState(false)

  if (!order) return null

  const pay = async () => {
    setBusy(true)
    try {
      const next = await resumeGuestPayment(order)
      if (next.status === "paid") {
        toast.success("This order has already been paid.")
        setBusy(false)
        return
      }
      window.location.assign(next.url) // stay busy while the browser leaves
    } catch (err) {
      toast.error(guestApiError(err, "We couldn't start the payment.").message)
      setBusy(false)
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold text-amber-900 dark:text-amber-200">You have an order waiting for payment</p>
        <p className="mt-0.5 break-all text-xs text-amber-800 dark:text-amber-300">
          {order.reference}
          {order.total != null ? ` · ${formatNaira(order.total)}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/track-order?reference=${encodeURIComponent(order.reference)}`}
          className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:border-brand hover:text-brand"
        >
          Track order
        </Link>
        <Button
          type="button"
          onClick={pay}
          disabled={busy}
          className="h-auto gap-2 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Complete payment
        </Button>
      </div>
    </div>
  )
}
