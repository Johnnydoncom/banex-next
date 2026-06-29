import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "./api-client"

// Because these requests are often made from client components that need the user session,
// we proxy them through the Next.js API route (/api/proxy/[...path]) to inject the
// server-side HTTP-only session token securely.
const PROXY_BASE = "/api/proxy"

// ─── Shared Envelope ──────────────────────────────────────────────────────────
type ApiEnvelope<T> = {
  success: boolean
  code: number
  locale: string
  message: string
  data: T
}

// ─── Models ───────────────────────────────────────────────────────────────────

export type CartItemData = {
  id: string // Server ID
  product_id: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    currency: string
    images: { url: string; is_primary: boolean }[]
  }
  seller: {
    id: string
    shop_name: string
    slug: string
  }
  quantity: number
  price: number
  subtotal: number
}

export type CartData = {
  items: CartItemData[]
  subtotal: number
  total: number
}

export type AddressData = {
  id: string
  label?: string
  full_name: string
  phone: string
  email?: string
  street_address: string
  city: string
  state: string
  is_default: boolean
}

export type CheckoutBreakdown = {
  subtotal: number
  shipping_fee: number
  escrow_fee: number
  total: number
  currency: string
  shipping_type: "delivery" | "pickup"
  estimated_delivery?: string
}

export type OrderData = {
  id: string
  reference: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total_amount: number
  shipping_fee: number
  escrow_fee: number
  currency: string
  shipping_type: "delivery" | "pickup"
  shipping_address?: AddressData
  payment_status: "pending" | "paid" | "failed"
  created_at: string
  items: {
    id: string
    product_name: string
    product_image?: string
    seller_name: string
    quantity: number
    price: number
    subtotal: number
  }[]
}

// ─── CART ─────────────────────────────────────────────────────────────────────

export async function userFetchCart() {
  const res = await apiGet<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart`)
  return res.data?.cart
}

export async function userAddToCart(productId: string, quantity: number) {
  const res = await apiPost<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart`, {
    product_id: productId,
    quantity,
  })
  return res.data?.cart
}

export async function userUpdateCartQty(cartItemId: string, quantity: number) {
  const res = await apiPut<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/${cartItemId}`, {
    quantity,
  })
  return res.data?.cart
}

export async function userRemoveFromCart(cartItemId: string) {
  const res = await apiDelete<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/${cartItemId}`)
  return res.data?.cart
}

export async function userClearCart() {
  const res = await apiDelete<ApiEnvelope<null>>(`${PROXY_BASE}/user/cart`)
  return res.data
}

export async function userSyncCart(items: { product_id: string; quantity: number }[]) {
  const res = await apiPost<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/sync`, { items })
  return res.data?.cart
}

// ─── ADDRESSES ────────────────────────────────────────────────────────────────

export async function userFetchAddresses() {
  const res = await apiGet<ApiEnvelope<{ addresses: AddressData[] }>>(`${PROXY_BASE}/user/addresses`)
  return res.data?.addresses || []
}

export async function userCreateAddress(data: Partial<AddressData>) {
  const res = await apiPost<ApiEnvelope<{ address: AddressData }>>(`${PROXY_BASE}/user/addresses`, data)
  return res.data?.address
}

export async function userUpdateAddress(id: string, data: Partial<AddressData>) {
  const res = await apiPut<ApiEnvelope<{ address: AddressData }>>(`${PROXY_BASE}/user/addresses/${id}`, data)
  return res.data?.address
}

export async function userDeleteAddress(id: string) {
  const res = await apiDelete<ApiEnvelope<null>>(`${PROXY_BASE}/user/addresses/${id}`)
  return res.data
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────

export async function userCheckoutValidateShipping(type: "delivery" | "pickup") {
  const res = await apiPost<ApiEnvelope<any>>(`${PROXY_BASE}/user/checkout/validate-shipping`, { type })
  return res.data
}

export async function userCheckoutBreakdown(shippingType: "delivery" | "pickup", addressId?: string) {
  const body: any = { shipping_type: shippingType }
  if (addressId) body.address_id = addressId
  const res = await apiPost<ApiEnvelope<{ breakdown: CheckoutBreakdown }>>(`${PROXY_BASE}/user/checkout/breakdown`, body)
  return res.data?.breakdown
}

export async function userCheckoutPlaceOrder(shippingType: "delivery" | "pickup", paymentMethod: string, addressId?: string) {
  const body: any = { shipping_type: shippingType, payment_method: paymentMethod }
  if (addressId) body.address_id = addressId
  const res = await apiPost<ApiEnvelope<{ order: OrderData; payment_reference?: string; authorization_url?: string }>>(`${PROXY_BASE}/user/checkout/place-order`, body)
  return res.data
}

export async function userCheckoutVerifyPayment(reference: string) {
  const res = await apiPost<ApiEnvelope<{ order: OrderData }>>(`${PROXY_BASE}/user/checkout/verify-payment`, { reference })
  return res.data?.order
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export async function userFetchOrders() {
  const res = await apiGet<ApiEnvelope<{ orders: OrderData[] }>>(`${PROXY_BASE}/user/orders`)
  return res.data?.orders || []
}

export async function userFetchOrder(id: string) {
  const res = await apiGet<ApiEnvelope<{ order: OrderData }>>(`${PROXY_BASE}/user/orders/${id}`)
  return res.data?.order
}
