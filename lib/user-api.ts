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
  id: string            // Server cart-item ID
  product_id: string
  product: {
    id: string
    name: string
    price: number
    currency: string
    primary_image_url: string | null  // Real API field (not images[])
    category?: { id: string; name: string; slug: string } | null
  }
  seller: {
    id: string
    shop_name: string
    slug: string
  } | null
  quantity: number
  unit_price: number    // Real API field (not "price")
  line_total: number    // Real API field (not "subtotal")
}

export type CartData = {
  id: string
  user_id?: string
  items: CartItemData[]
  summary: {
    items_count: number
    subtotal: number
    currency: string
    seller_count?: number
  }
}

export type AddressData = {
  id: string
  label?: string
  first_name: string
  last_name: string
  phone: string
  email?: string
  street: string
  street_line_2?: string | null
  city: string
  state: string
  country: string
  post_code?: string
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

export type PaymentMethodData = {
  id: string
  name: string
  slug: string
  image: string | null
  status: string
}

export type WalletData = {
  balance: number
  currency: string
}

// ─── CART ─────────────────────────────────────────────────────────────────────
// Endpoint reference (confirmed via Postman):
//   GET    /user/cart                       → fetch cart
//   POST   /user/cart/items                 → add item  { product_id, quantity }
//   PUT    /user/cart/items/:productId       → update qty { quantity }  (uses productId, NOT cart-item id)
//   DELETE /user/cart/items/:productId       → remove item (uses productId, NOT cart-item id)
//   DELETE /user/cart/                      → clear entire cart
//   POST   /user/cart/sync                  → sync local items

export async function userFetchCart() {
  const res = await apiGet<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart`)
  return res.data?.cart
}

export async function userAddToCart(productId: string, quantity: number) {
  // Correct endpoint: POST /user/cart/items  (NOT /user/cart)
  const res = await apiPost<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/items`, {
    product_id: productId,
    quantity,
  })
  return res.data?.cart
}

export async function userUpdateCartQty(productId: string, quantity: number) {
  // Correct: uses productId in path (NOT the cart-item uuid)
  const res = await apiPut<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/items/${productId}`, {
    quantity,
  })
  return res.data?.cart
}

export async function userRemoveFromCart(productId: string) {
  // Correct: uses productId in path (NOT the cart-item uuid)
  const res = await apiDelete<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/items/${productId}`)
  return res.data?.cart
}

export async function userClearCart() {
  // Trailing slash required as per Postman: DELETE /user/cart/
  const res = await apiDelete<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/`)
  return res.data?.cart
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

export type ShippingRate = {
  id: string
  code: string
  name: string
  fee: number
  currency: string
  delivery_window: string
}

export type ShippingValidation = {
  fulfillment_type: string
  shipping?: {
    weight_kg: number
    currency: string
    rates: ShippingRate[]
    suggested_rate_id: string
  }
}

export async function userCheckoutValidateShipping(fulfillmentType: "delivery" | "mall_pickup", addressId?: string) {
  const body: any = { fulfillment_type: fulfillmentType }
  if (addressId) body.address_id = addressId
  const res = await apiPost<ApiEnvelope<{ shipping_validation: ShippingValidation }>>(`${PROXY_BASE}/user/checkout/validate-shipping`, body)
  return res.data?.shipping_validation
}

export async function userCheckoutBreakdown(fulfillmentType: "delivery" | "mall_pickup", addressId?: string, rateId?: string) {
  const body: any = { fulfillment_type: fulfillmentType }
  if (addressId) body.address_id = addressId
  if (rateId) body.rate_id = rateId
  const res = await apiPost<ApiEnvelope<{ breakdown: CheckoutBreakdown }>>(`${PROXY_BASE}/user/checkout/breakdown`, body)
  return res.data?.breakdown
}

export async function userCheckoutPlaceOrder(fulfillmentType: "delivery" | "mall_pickup", paymentMethodId: string, addressId?: string, rateId?: string) {
  const body: any = { fulfillment_type: fulfillmentType, payment_method_id: paymentMethodId }
  if (addressId) body.address_id = addressId
  if (rateId) body.rate_id = rateId
  const res = await apiPost<ApiEnvelope<{ order: OrderData; payment_reference?: string; authorization_url?: string }>>(`${PROXY_BASE}/user/orders`, body)
  return res.data
}

export async function userCheckoutVerifyPayment(orderId: string) {
  const res = await apiPost<ApiEnvelope<{ order: OrderData }>>(`${PROXY_BASE}/user/orders/${orderId}/payment/verify`, {})
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

// ─── PAYMENT & WALLET ─────────────────────────────────────────────────────────

export async function userFetchPaymentMethods() {
  const res = await apiGet<ApiEnvelope<{ payment_methods: PaymentMethodData[] }>>(`${PROXY_BASE}/generic/payment-methods`)
  return res.data?.payment_methods || []
}

export async function userFetchWallet() {
  const res = await apiGet<ApiEnvelope<{ wallet: WalletData }>>(`${PROXY_BASE}/user/wallet`)
  return res.data?.wallet
}

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
// Based on Postman collection:
//   GET    /user/wishlist         → data.wishlist: [{id, product_id, created_at}]
//   POST   /user/wishlist         → data.item: {id, product_id, created_at}
//   DELETE /user/wishlist/{id}    → (uses wishlist item id, not product_id)
//   POST   /user/wishlist/sync    → body: product_ids[], response: data.wishlist

export type WishlistItemData = {
  id: string          // server wishlist item ID (used for DELETE)
  product_id: string  // the product ID
  created_at?: { item: string }
  // Note: the API does NOT embed a full product object in wishlist responses.
  // Product details must come from the local GenericProduct data when toggling.
  product?: {
    id: string
    name: string
    slug: string
    price: number
    currency?: string
    images?: { url: string; is_primary: boolean }[]
    seller?: {
      id: string
      shop_name: string
      slug: string
    } | null
  } | null
}

export async function userFetchWishlist() {
  const res = await apiGet<ApiEnvelope<{ wishlist: WishlistItemData[] }>>(`${PROXY_BASE}/user/wishlist`)
  return res.data?.wishlist || []
}

export async function userAddWishlist(productId: string) {
  const res = await apiPost<ApiEnvelope<{ item: WishlistItemData }>>(`${PROXY_BASE}/user/wishlist`, { product_id: productId })
  return res.data?.item || null
}

export async function userRemoveWishlist(wishlistItemId: string) {
  // wishlistItemId is the server-side wishlist item id (NOT the product id)
  const res = await apiDelete<ApiEnvelope<null>>(`${PROXY_BASE}/user/wishlist/${wishlistItemId}`)
  return res.data
}

export async function userSyncWishlist(productIds: string[]) {
  // The API accepts product_ids[] in form-urlencoded but we send JSON.
  // When sending JSON, use product_ids as an array: { product_ids: [...] }
  const res = await apiPost<ApiEnvelope<{ wishlist: WishlistItemData[] }>>(`${PROXY_BASE}/user/wishlist/sync`, { product_ids: productIds })
  return res.data?.wishlist || []
}

