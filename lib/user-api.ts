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
  product_variant_id: string | null
  // {color,size} object, or `[]` when the variant has no attributes (simple product)
  variant_attributes?: Record<string, string> | string[] | null
  variant?: {
    id: string
    sku: string | null
    attributes: Record<string, string> | string[] | null
    price: number
    stock_quantity: number
    in_stock: boolean
    is_default: boolean
  } | null
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
  fulfillment_type: string
  cart: CartData
  summary: {
    subtotal: number
    delivery_fee?: number
    escrow_fee?: number
    total: number
    currency: string
  }
  shipping?: {
    weight_kg: number
    currency: string
    selected_rate?: ShippingRate
  }
}

export type OrderData = {
  id: string
  reference: string
  status: string
  fulfillment_type: "delivery" | "mall_pickup"
  currency?: string
  created_at: string | { item: string }  // API returns { item: "ISO string" }
  delivery_address?: AddressData
  shipping?: {
    weight_kg: number
    currency: string
    selected_rate?: ShippingRate
  }
  summary?: {        // present on single order / place-order response
    subtotal: number
    delivery_fee?: number
    total: number
    currency: string
  }
  lines_summary?: {  // present on list response
    subtotal: number
    currency: string
    item_count: number
  }
  items: {
    id: string
    product_id?: string
    product_variant_id?: string | null
    variant_attributes?: Record<string, string> | string[] | null
    seller_id?: string
    product_name: string
    primary_image_url?: string | null  // API field (not product_image)
    seller_shop_name?: string          // API field (not seller_name)
    unit_price: number                 // API field (not price)
    quantity: number
    line_total: number                 // API field (not subtotal)
    status?: string
    currency?: string
  }[]
  payment_intent?: {
    authorization_url: string
    access_code: string
    reference: string
  }
  // Present on order detail when manual (bank-transfer) payment is used
  payment?: {
    id: string
    reference: string
    status: string  // e.g. "pending", "paid"
    proof_status: string | null  // "pending_review" | "approved" | "rejected" | null
    proof_rejection_reason?: string | null
    payment_method?: {
      id: string
      name: string
      slug: string  // "manual" for bank transfer
    }
    has_proof: boolean
  } | null
}

export type PaymentMethodData = {
  id: string
  name: string
  slug: string
  image: string | null
  status: string
  manual_payment_instructions?: {
    bank_name?: string
    account_name?: string
    account_number?: string
    instructions?: string
  } | null
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

export async function userAddToCart(productId: string, quantity: number, productVariantId?: string | null) {
  // POST /user/cart/items — include product_variant_id when the product has variants
  // (omit it and the backend uses the product's default variant).
  const body: Record<string, any> = { product_id: productId, quantity }
  if (productVariantId) body.product_variant_id = productVariantId
  const res = await apiPost<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/items`, body)
  return res.data?.cart
}

export async function userUpdateCartQty(productVariantId: string, quantity: number) {
  // BREAKING (variants): the path segment is the product_variant_id, NOT the product id.
  const res = await apiPut<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/items/${productVariantId}`, {
    quantity,
  })
  return res.data?.cart
}

export async function userRemoveFromCart(productVariantId: string) {
  // BREAKING (variants): the path segment is the product_variant_id, NOT the product id.
  const res = await apiDelete<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/items/${productVariantId}`)
  return res.data?.cart
}

export async function userClearCart() {
  // Trailing slash required as per Postman: DELETE /user/cart/
  const res = await apiDelete<ApiEnvelope<{ cart: CartData }>>(`${PROXY_BASE}/user/cart/`)
  return res.data?.cart
}

export async function userSyncCart(
  items: { product_id: string; product_variant_id?: string | null; quantity: number }[],
) {
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

export async function userCheckoutPlaceOrder(
  fulfillmentType: "delivery" | "mall_pickup",
  paymentMethodId: string,
  addressId?: string,
  rateId?: string,
  callbackUrl?: string
) {
  const body: any = { fulfillment_type: fulfillmentType, payment_method_id: paymentMethodId }
  if (addressId) body.address_id = addressId
  if (rateId) body.rate_id = rateId
  if (callbackUrl) body.callback_url = callbackUrl
  const res = await apiPost<ApiEnvelope<{
    order: OrderData
    payment_intent?: {
      authorization_url: string
      access_code: string
      reference: string
    }
    total_amount?: number
  }>>(`${PROXY_BASE}/user/orders`, body)
  return res.data
}

export async function userCheckoutVerifyPayment(orderReference: string) {
  const res = await apiPost<ApiEnvelope<{ order: OrderData }>>(`${PROXY_BASE}/user/orders/${orderReference}/payment/verify`, {})
  return res.data?.order
}

// Upload manual payment proof (bank transfer receipt)
// Endpoint: POST /user/orders/:orderId/payment/manual/proof
// Body: FormData with field "receipt" (image file)
export async function userUploadPaymentProof(orderId: string, file: File): Promise<{ payment: OrderData["payment"] }> {
  const formData = new FormData()
  formData.append("receipt", file)

  const response = await fetch(`${PROXY_BASE}/user/orders/${orderId}/payment/manual/proof`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — browser auto-sets multipart/form-data with boundary
  })

  const json = await response.json() as ApiEnvelope<{ payment: OrderData["payment"] }>
  if (!json.success) {
    throw new Error(json.message || "Failed to upload payment proof")
  }
  return json.data
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export type OrderPagination = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export async function userFetchOrders(page = 1, perPage = 15) {
  const res = await apiGet<ApiEnvelope<{ orders: OrderData[]; pagination: OrderPagination }>>(
    `${PROXY_BASE}/user/orders?per_page=${perPage}&page=${page}`
  )
  return {
    orders: res.data?.orders || [],
    pagination: res.data?.pagination,
  }
}

export async function userFetchOrder(id: string) {
  const res = await apiGet<ApiEnvelope<{ order: OrderData }>>(`${PROXY_BASE}/user/orders/${id}`)
  return res.data?.order
}

// Buyer confirms they've received the order — POST /user/orders/:orderId/mark-complete.
// Only allowed while the order is in transit (out for delivery / ready for pickup);
// it moves the order to delivered/received. Keyed by order id (not reference).
export async function userMarkOrderComplete(orderId: string) {
  const res = await apiPost<ApiEnvelope<{ order: OrderData }>>(
    `${PROXY_BASE}/user/orders/${orderId}/mark-complete`,
    {},
  )
  return res.data?.order ?? null
}

// ─── ORDER TRACKING ───────────────────────────────────────────────────────────
// GET /user/orders/:reference/tracking — keyed by the order REFERENCE (e.g.
// "OR1782908533425398EC8CC4"), not the id. Requires an authenticated session.
// Verified live 2026-07-28.
export type OrderTrackingStep = {
  key: string
  label: string
  // completed | current | upcoming | skipped | failed (backend-driven)
  state: string
  completed_at: string | null
}

export type OrderTrackingData = {
  order_id: string
  reference: string
  fulfillment_type: "delivery" | "mall_pickup"
  current_status: string
  steps: OrderTrackingStep[]
  fulfillment?: {
    type: "delivery" | "mall_pickup"
    delivery_address?: AddressData | null
    selected_rate?: {
      id: string
      code: string
      name: string
      fee: number
      currency: string
      delivery_window?: string | null
    } | null
  } | null
  items: {
    id: string
    product_name: string
    quantity: number
    status?: string
    seller_shop_name?: string
    primary_image_url?: string | null
  }[]
}

export async function userFetchOrderTracking(reference: string) {
  const res = await apiGet<ApiEnvelope<{ tracking: OrderTrackingData }>>(
    `${PROXY_BASE}/user/orders/${encodeURIComponent(reference)}/tracking`,
  )
  return res.data?.tracking ?? null
}

// Re-initialize payment for an existing pending order
// Calls POST /user/orders/:orderId/payment/initialize → returns a fresh Paystack authorization_url
// callbackUrl: the absolute URL Paystack should redirect to after payment
export async function userInitializeOrderPayment(orderId: string, paymentMethodId: string, callbackUrl: string) {
  const res = await apiPost<ApiEnvelope<{
    payment_intent: {
      authorization_url: string
      access_code: string
      reference: string
    }
    total_amount?: number
  }>>(`${PROXY_BASE}/user/orders/${orderId}/payment/initialize`, {
    payment_method_id: paymentMethodId,
    callback_url: callbackUrl,
  })
  return res.data
}

// ─── PAYMENT & WALLET ─────────────────────────────────────────────────────────

export async function userFetchPaymentMethods() {
  const res = await apiGet<ApiEnvelope<{ payment_methods: PaymentMethodData[] }>>(`${PROXY_BASE}/generic/payment-methods`)
  return res.data?.payment_methods || []
}

export async function userFetchWallet() {
  const res = await apiGet<ApiEnvelope<{ wallet: WalletData; transactions: any[] }>>(`${PROXY_BASE}/user/wallet`)
  return res.data
}

// ─── BANK ACCOUNTS ─────────────────────────────────────────────────────────────

export type BankAccountData = {
  id: string
  bank_name: string
  bank_code: string | null
  account_number: string
  account_name: string
  is_default: boolean
  created_at?: { item: string }
  updated_at?: { item: string }
}

export async function userFetchBankAccounts() {
  const res = await apiGet<ApiEnvelope<{ bank_accounts: BankAccountData[] }>>(`${PROXY_BASE}/user/wallet/bank-accounts`)
  return res.data?.bank_accounts || []
}

export async function userCreateBankAccount(data: {
  bank_name: string
  bank_code?: string
  account_number: string
  account_name: string
  is_default?: boolean
}) {
  const res = await apiPost<ApiEnvelope<{ bank_account: BankAccountData }>>(`${PROXY_BASE}/user/wallet/bank-accounts`, data)
  return res.data?.bank_account
}

export async function userUpdateBankAccount(id: string, data: {
  bank_name?: string
  bank_code?: string
  account_number?: string
  account_name?: string
  is_default?: boolean
}) {
  const res = await apiPut<ApiEnvelope<{ bank_account: BankAccountData }>>(`${PROXY_BASE}/user/wallet/bank-accounts/${id}`, data)
  return res.data?.bank_account
}

export async function userDeleteBankAccount(id: string) {
  const res = await apiDelete<ApiEnvelope<null>>(`${PROXY_BASE}/user/wallet/bank-accounts/${id}`)
  return res.data
}

// ─── WITHDRAWALS ──────────────────────────────────────────────────────────────

export type WithdrawalData = {
  id: string
  status: "pending" | "approved" | "rejected" | "processed"
  amount: number
  currency: string
  bank_name: string
  bank_code: string | null
  account_number: string
  account_name: string
  processed_at: { item: string } | null
  created_at: { item: string }
  updated_at: { item: string }
}

export async function userFetchWithdrawals(page = 1) {
  const res = await apiGet<ApiEnvelope<{ withdrawals: WithdrawalData[]; pagination: { current_page: number; per_page: number; total: number; last_page: number } }>>(
    `${PROXY_BASE}/user/wallet/withdrawals?page=${page}`
  )
  return res.data ?? { withdrawals: [], pagination: null }
}

export async function userCreateWithdrawal(data: { bank_account_id: string; amount: number }) {
  const res = await apiPost<ApiEnvelope<{ withdrawal: WithdrawalData; wallet: WalletData }>>(
    `${PROXY_BASE}/user/wallet/withdrawals`,
    data
  )
  return res.data
}


// Based on Postman collection:
//   GET    /user/wishlist         → data.wishlist: [{id, product_id, created_at}]
//   POST   /user/wishlist         → data.item: {id, product_id, created_at}
//   DELETE /user/wishlist/{id}    → (uses wishlist item id, not product_id)
//   POST   /user/wishlist/sync    → body: product_ids[], response: data.wishlist

export type WishlistItemData = {
  id: string          // server wishlist item ID (used for DELETE)
  product_id: string  // the product ID
  created_at?: { item: string }
  // The wishlist API embeds a lightweight product summary (verified live 2026-07-25):
  // { name, image, price, url } — `url` is the absolute product page URL.
  product?: {
    name: string
    image: string | null
    price: number
    url: string
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

