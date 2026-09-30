import { apiPost, ApiError } from "./api-client"
import type { OrderData, OrderTrackingData, ShippingRate } from "./user-api"

// Guest checkout — order and pay without an account (Postman: Generic > Guest).
// All six endpoints are public; they go through the same-origin proxy like the
// rest of the client API. Paths and rules below were verified against the live
// API on 2026-09-30 — where they differ from the Postman collection it is noted.
const PROXY_BASE = "/api/proxy"

type ApiEnvelope<T> = {
  success: boolean
  code: number
  locale: string
  message: string
  data: T
}

// ─── Models ───────────────────────────────────────────────────────────────────

export type GuestFulfillment = "delivery" | "mall_pickup"

/** A cart line as the guest endpoints expect it. Quantity must be 1–99. */
export type GuestLine = {
  product_id: string
  /** Required for products with variants; omit for simple products. */
  product_variant_id?: string
  quantity: number
}

export type GuestAddress = {
  first_name: string
  last_name: string
  phone: string
  street: string
  street_line_2?: string
  city: string
  state: string
}

export type GuestPickupLocation = {
  name: string
  street: string
  street_line_2?: string | null
  city: string
  state: string
  country?: string
  post_code?: string | null
  phone?: string | null
  email?: string | null
}

export type GuestSummary = {
  subtotal: number
  delivery_fee: number
  vat_amount: number
  total: number
  currency: string
}

export type GuestQuoteItem = {
  product_id: string
  product_variant_id: string | null
  variant_attributes: Record<string, string> | string[] | null
  quantity: number
  unit_price: number
  line_total: number
  product: { id: string; name: string; primary_image_url: string | null }
}

export type GuestShippingValidation = {
  fulfillment_type: GuestFulfillment
  pickup_location?: GuestPickupLocation
  shipping?: {
    weight_kg: number
    currency: string
    rates: ShippingRate[]
    suggested_rate_id: string | null
  }
}

export type GuestBreakdown = {
  fulfillment_type: GuestFulfillment
  cart: { items: GuestQuoteItem[]; issues?: unknown[] }
  pickup_location?: GuestPickupLocation
  shipping?: { weight_kg: number; currency: string; selected_rate?: ShippingRate }
  summary: GuestSummary
}

export type GuestPaymentIntent = {
  /** The PAYMENT reference (PAY…) — this, not the order reference, is what verify takes. */
  reference: string
  authorization_url?: string
  access_code?: string
}

export type ManualPaymentInstructions = {
  bank_name?: string
  account_name?: string
  account_number?: string
  instructions?: string
}

export type GuestOrder = Omit<OrderData, "payment" | "summary"> & {
  summary?: GuestSummary
  pickup_location?: GuestPickupLocation
  guest?: { name: string; email: string; phone: string }
  payment?: {
    status: string
    reference: string
    paid_at: string | { item: string } | null
    proof_status: string | null
  } | null
}

export type GuestOrderResult = {
  order: GuestOrder
  payment_intent?: GuestPaymentIntent
  total_amount?: number
  manual_payment_instructions?: ManualPaymentInstructions | null
}

// Same shape as the signed-in tracking response (steps are completed | current |
// pending | skipped | failed; mall pickup carries `fulfillment.pickup_location`).
export type GuestTracking = OrderTrackingData

// ─── Errors ───────────────────────────────────────────────────────────────────

// Backend error codes the UI reacts to.
export const GUEST_ERROR = {
  validation: 115,
  productNotFound: 218,
  rateUnavailable: 229,
  orderNotFound: 230,
  paymentPending: 232,
} as const

export type GuestApiError = {
  message: string
  status: number
  code: number | null
  /** Laravel field errors, first message per field — keys like "email", "address.city", "items.0.quantity". */
  fields: Record<string, string>
}

/** Normalise anything thrown by a guest call into one predictable shape. */
export function guestApiError(err: unknown, fallback = "Something went wrong. Please try again."): GuestApiError {
  if (err instanceof ApiError) {
    const body = err.data as { code?: number; data?: { messages?: Record<string, string[] | string> } | null } | null
    const fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(body?.data?.messages ?? {})) {
      const first = Array.isArray(value) ? value[0] : value
      if (first) fields[key] = String(first)
    }
    return { message: err.message || fallback, status: err.status, code: body?.code ?? null, fields }
  }
  return { message: err instanceof Error && err.message ? err.message : fallback, status: 0, code: null, fields: {} }
}

export function isAbortError(err: unknown) {
  return err instanceof DOMException ? err.name === "AbortError" : (err as { name?: string } | null)?.name === "AbortError"
}

// ─── Checkout: quotes ─────────────────────────────────────────────────────────

type QuoteInput = {
  fulfillmentType: GuestFulfillment
  items: GuestLine[]
  /** Required when fulfillmentType is "delivery". */
  address?: GuestAddress
}

function quoteBody({ fulfillmentType, items, address }: QuoteInput) {
  const body: Record<string, unknown> = { fulfillment_type: fulfillmentType, items }
  if (fulfillmentType === "delivery" && address) body.address = address
  return body
}

/**
 * POST /generic/guest/checkout/validate-shipping
 * Delivery → the courier rates available for the address (422 / code 229 when the
 * area can't be served). Mall pickup → the pickup location and its free "rate".
 */
export async function guestValidateShipping(input: QuoteInput, signal?: AbortSignal) {
  const res = await apiPost<ApiEnvelope<{ shipping_validation: GuestShippingValidation }>>(
    `${PROXY_BASE}/generic/guest/checkout/validate-shipping`,
    quoteBody(input),
    { signal },
  )
  return res.data.shipping_validation
}

/**
 * POST /generic/guest/checkout/breakdown
 * The authoritative totals (current prices, delivery fee, VAT). Delivery needs the
 * `rate_id` chosen from validate-shipping.
 */
export async function guestCheckoutBreakdown(input: QuoteInput & { rateId?: string }, signal?: AbortSignal) {
  const body = quoteBody(input)
  if (input.fulfillmentType === "delivery" && input.rateId) body.rate_id = input.rateId
  const res = await apiPost<ApiEnvelope<{ breakdown: GuestBreakdown }>>(
    `${PROXY_BASE}/generic/guest/checkout/breakdown`,
    body,
    { signal },
  )
  return res.data.breakdown
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * POST /generic/guest/orders
 * `callback_url` is REQUIRED for gateway (Paystack) payments even though Postman
 * doesn't list it — it is where Paystack sends the buyer back to.
 */
export async function guestPlaceOrder(input: {
  fulfillmentType: GuestFulfillment
  items: GuestLine[]
  name: string
  email: string
  phone: string
  paymentMethodId: string
  callbackUrl: string
  address?: GuestAddress
  rateId?: string
}) {
  const body = quoteBody(input)
  if (input.fulfillmentType === "delivery" && input.rateId) body.rate_id = input.rateId
  body.name = input.name
  body.email = input.email
  body.phone = input.phone
  body.payment_method_id = input.paymentMethodId
  body.callback_url = input.callbackUrl
  const res = await apiPost<ApiEnvelope<GuestOrderResult>>(`${PROXY_BASE}/generic/guest/orders`, body)
  return res.data
}

/**
 * POST /generic/guest/orders/track   (Postman shows /generic/guest/orders — that is
 * Place Order; the live route is /track.) The email must be the one used at
 * checkout; a mismatch answers 404 like an unknown reference.
 */
export async function guestTrackOrder(reference: string, email: string) {
  const res = await apiPost<ApiEnvelope<{ tracking: GuestTracking }>>(`${PROXY_BASE}/generic/guest/orders/track`, {
    reference,
    email,
  })
  return res.data.tracking
}

/**
 * POST /generic/guest/orders/:paymentReference/payment/verify
 * Takes the PAYMENT reference (PAY… — what Paystack appends to the callback URL),
 * not the order reference. Throws with code 232 while the payment is still pending.
 */
export async function guestVerifyPayment(paymentReference: string, email: string) {
  const res = await apiPost<ApiEnvelope<{ order?: GuestOrder } | null>>(
    `${PROXY_BASE}/generic/guest/orders/${encodeURIComponent(paymentReference)}/payment/verify`,
    { email },
  )
  return res.data?.order ?? null
}

/**
 * POST /generic/guest/orders/:orderReference/payment/initialize   (Postman shows
 * /payment/verify — the live route is /initialize.) Starts a fresh payment attempt
 * for an unpaid order; takes the ORDER reference.
 */
export async function guestInitializePayment(
  orderReference: string,
  input: { email: string; paymentMethodId: string; callbackUrl: string },
) {
  const res = await apiPost<ApiEnvelope<GuestOrderResult>>(
    `${PROXY_BASE}/generic/guest/orders/${encodeURIComponent(orderReference)}/payment/initialize`,
    { email: input.email, payment_method_id: input.paymentMethodId, callback_url: input.callbackUrl },
  )
  return res.data
}
