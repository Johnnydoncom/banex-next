import { useSyncExternalStore } from "react"
import { userFetchPaymentMethods, type PaymentMethodData } from "./user-api"
import { guestInitializePayment, guestVerifyPayment, guestApiError, GUEST_ERROR } from "./guest-api"

// A guest has no account to come back to, so the orders they place are remembered
// on this device: it is how the payment callback knows which email to verify with,
// and how they find an order again to track it or finish paying.

export type StoredGuestOrder = {
  reference: string
  /** PAY… reference of the latest payment attempt. */
  paymentReference: string | null
  email: string
  total: number | null
  placedAt: number
  paid: boolean
}

const STORAGE_KEY = "banex.guest-orders"
const MAX_ORDERS = 5
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const same = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

export function readGuestOrders(): StoredGuestOrder[] {
  if (typeof window === "undefined") return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]")
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (o): o is StoredGuestOrder =>
        !!o && typeof o.reference === "string" && typeof o.email === "string" && Date.now() - Number(o.placedAt) < MAX_AGE_MS,
    )
  } catch {
    return []
  }
}

function writeGuestOrders(orders: StoredGuestOrder[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, MAX_ORDERS)))
  } catch {
    // Storage full or blocked — the order still exists, it just isn't remembered here.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT)) // "storage" only fires in OTHER tabs
}

// ─── React binding ────────────────────────────────────────────────────────────

const CHANGE_EVENT = "banex:guest-orders"
const NONE: StoredGuestOrder[] = []
let snapshot: { raw: string | null; orders: StoredGuestOrder[] } = { raw: null, orders: NONE }

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

// Must hand back the same array until the stored value actually changes.
function getSnapshot() {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {}
  if (raw !== snapshot.raw) snapshot = { raw, orders: raw ? readGuestOrders() : NONE }
  return snapshot.orders
}

/** The guest orders remembered on this device, newest first. Empty while server-rendering. */
export function useGuestOrders() {
  return useSyncExternalStore(subscribe, getSnapshot, () => NONE)
}

/** The newest order that still needs paying — if it is recent enough to still be open. */
export function openUnpaidGuestOrder(orders: StoredGuestOrder[]) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  return orders.find((o) => !o.paid && o.placedAt > dayAgo) ?? null
}

/** Add an order, or update the one with the same reference. Newest first. */
export function saveGuestOrder(order: Pick<StoredGuestOrder, "reference" | "email"> & Partial<StoredGuestOrder>) {
  const all = readGuestOrders()
  const existing = all.find((o) => same(o.reference, order.reference))
  // Fields passed as undefined mean "leave as is", not "clear".
  const changes = Object.fromEntries(Object.entries(order).filter(([, v]) => v !== undefined))
  const next: StoredGuestOrder = {
    reference: order.reference,
    email: order.email,
    paymentReference: null,
    total: null,
    placedAt: Date.now(),
    paid: false,
    ...existing,
    ...changes,
  }
  writeGuestOrders([next, ...all.filter((o) => !same(o.reference, order.reference))])
  return next
}

/** Look an order up by its order reference OR its payment reference. */
export function findGuestOrder(reference: string | null | undefined) {
  if (!reference) return null
  return readGuestOrders().find((o) => same(o.reference, reference) || same(o.paymentReference, reference)) ?? null
}

// ─── Payment ──────────────────────────────────────────────────────────────────

/**
 * Methods a guest can complete on their own. Wallet needs an account, and bank
 * transfer needs a receipt upload — the API has no guest endpoint for that.
 */
export function guestPaymentMethods(methods: PaymentMethodData[]) {
  return methods.filter(
    (m) => m.status === "active" && m.slug !== "wallet" && m.slug !== "manual" && !m.manual_payment_instructions,
  )
}

export const guestCallbackUrl = () => `${window.location.origin}/checkout/verify`

/**
 * Take an unpaid guest order back to the payment gateway. First asks the backend
 * whether the last attempt actually went through (so nobody pays twice), then
 * starts a new attempt and returns where to send the buyer.
 */
export async function resumeGuestPayment(
  order: Pick<StoredGuestOrder, "reference" | "email"> & { paymentReference?: string | null },
): Promise<{ status: "paid" } | { status: "redirect"; url: string }> {
  if (order.paymentReference) {
    try {
      await guestVerifyPayment(order.paymentReference, order.email)
      saveGuestOrder({ reference: order.reference, email: order.email, paid: true })
      return { status: "paid" }
    } catch (err) {
      const info = guestApiError(err)
      // "Still pending" is the expected answer for an unpaid order, and a rejected
      // lookup will be reported properly by initialize below. But if the check
      // itself never reached the server, don't start another payment blind.
      if (info.code !== GUEST_ERROR.paymentPending && info.status === 0) throw err
    }
  }

  const method = guestPaymentMethods(await userFetchPaymentMethods())[0]
  if (!method) throw new Error("Online payment is unavailable right now. Please try again shortly.")

  const result = await guestInitializePayment(order.reference, {
    email: order.email,
    paymentMethodId: method.id,
    callbackUrl: guestCallbackUrl(),
  })
  const url = result.payment_intent?.authorization_url
  if (!url) throw new Error("We couldn't start the payment. Please try again.")

  saveGuestOrder({
    reference: order.reference,
    email: order.email,
    paymentReference: result.payment_intent?.reference ?? order.paymentReference ?? undefined,
    total: result.order?.summary?.total,
  })
  return { status: "redirect", url }
}
