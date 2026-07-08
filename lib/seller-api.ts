/**
 * Seller API — typed fetchers for the Merchant Center (vendor dashboard).
 *
 * Mirrors the proxyFetch pattern from admin-api.ts.
 * All routes go through /api/proxy so the server-side session token is
 * injected by the Next.js proxy route securely.
 */

// ─── Shared envelope ──────────────────────────────────────────────────────────

type ApiEnvelope<T> = {
  success: boolean
  code: number
  locale: string
  message: string
  data: T
}

// ─── Proxy helpers ────────────────────────────────────────────────────────────

async function proxyFetch<T>(
  path: string,
  token: string,
  method = "GET",
  body?: any,
  customHeaders?: Record<string, string>
): Promise<ApiEnvelope<T>> {
  const url = `/api/proxy${path}`
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...customHeaders,
  }

  if (body && !customHeaders?.["Content-Type"] && typeof body !== "string") {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : undefined,
  })

  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`)
  }
  return data as ApiEnvelope<T>
}

async function proxyFetchFormData<T>(
  path: string,
  token: string,
  method = "POST",
  formData: FormData
): Promise<ApiEnvelope<T>> {
  const url = `/api/proxy${path}`
  const res = await fetch(url, {
    method,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    body: formData,
  })
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`)
  }
  return data as ApiEnvelope<T>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SellerProfile = {
  id: string
  shop_name: string
  slug: string
  phone: string | null
  location: string | null
  category_id: string | null
  category: { id: string; name: string; slug: string } | null
  description: string | null
  tier: string
  cover_image_url: string | null
  operating_hours: string | null
  floor: string | null
  shop_no: string | null
  store_location: string | null
  whatsapp_contact_id: string | null
  delivery_estimate_minutes: number | null
  delivery_fee: number | null
  delivery_currency: string
  rating_average: number | null
  reviews_count: number
  status: "pending" | "approved" | "rejected" | "suspended"
  rejection_reason: string | null
  products_count: number
  approved_at: { item: string } | null
  created_at?: { item: string }
  updated_at?: { item: string }
}

export type SellerProduct = {
  id: string
  seller_id: string
  category_id: string | null
  name: string
  slug: string
  brand: string | null
  description: string | null
  specifications: string[] | null
  price: number
  currency: string
  location: string | null
  delivery_estimate: string | null
  rating_average: number | null
  reviews_count: number
  is_escrow_enabled: boolean
  is_nationwide_delivery: boolean
  is_authentic_only: boolean
  is_featured: boolean
  status: "active" | "inactive" | "pending" | "rejected"
  rejection_reason: string | null
  approved_at: { item: string } | null
  created_at: { item: string }
  updated_at: { item: string }
  images: { id: string; url: string; is_primary: boolean; sort_order: number }[]
  seller: { id: string; shop_name: string; slug: string } | null
  category: { id: string; name: string; slug: string } | null
  stock_quantity?: number
  weight_kg?: number | string
}

export type SellerOrderItem = {
  id: string
  product_id: string
  seller_id: string
  status: "paid" | "accepted" | "declined" | "delivered" | "disputed"
  decline_reason: string | null
  product_name: string
  unit_price: number
  quantity: number
  line_total: number
  weight_kg: string | null
  currency: string
  seller_shop_name: string
  primary_image_url: string | null
}

export type SellerOrder = {
  id: string
  reference: string
  status: string
  fulfillment_type: "delivery" | "mall_pickup"
  items: SellerOrderItem[]
  lines_summary: {
    subtotal: number
    currency: string
    item_count: number
  }
  created_at: { item: string } | string
  delivery_address?: {
    first_name: string
    last_name: string
    street: string
    city: string
    state: string
    country: string
    phone: string
  } | null
}

export type SellerOrderPagination = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

// ─── Seller Application / Profile ─────────────────────────────────────────────

export async function sellerFetchApplication(token: string) {
  const res = await proxyFetch<{ seller: SellerProfile }>("/seller/application", token)
  return res.data?.seller ?? null
}

export async function sellerApply(
  data: {
    shop_name: string
    phone: string
    email?: string
    location: string
    floor: string
    shop_no: string
    category_id: string
    description: string
    operating_hours?: string
    delivery_estimate_minutes?: number
    delivery_fee?: number
  },
  token: string
) {
  const res = await proxyFetch<{ seller: SellerProfile }>("/seller/apply", token, "POST", data)
  return res.data?.seller ?? null
}

export async function sellerUpdateProfile(formData: FormData, token: string) {
  // API requires _method=PUT sent as FormData field alongside form fields
  const res = await proxyFetchFormData<{ seller: SellerProfile }>("/seller/profile", token, "POST", formData)
  return res.data?.seller ?? null
}

// ─── Seller Products ──────────────────────────────────────────────────────────

export async function sellerFetchProducts(token: string) {
  const res = await proxyFetch<{ products: SellerProduct[] }>("/seller/products", token)
  return res.data?.products ?? []
}

export async function sellerFetchProduct(id: string, token: string) {
  const res = await proxyFetch<{ product: SellerProduct }>(`/seller/products/${id}`, token)
  return res.data?.product ?? null
}

export async function sellerCreateProduct(formData: FormData, token: string) {
  const res = await proxyFetchFormData<{ product: SellerProduct }>("/seller/products", token, "POST", formData)
  return res.data?.product ?? null
}

export async function sellerUpdateProduct(id: string, formData: FormData, token: string) {
  // Requires _method=PUT in formData
  const res = await proxyFetchFormData<{ product: SellerProduct }>(`/seller/products/${id}`, token, "POST", formData)
  return res.data?.product ?? null
}

export async function sellerUpdateStock(id: string, stockQuantity: number, token: string) {
  const res = await proxyFetch<{ product: SellerProduct }>(
    `/seller/products/${id}/stock`,
    token,
    "PATCH",
    { stock_quantity: stockQuantity }
  )
  return res.data?.product ?? null
}

export async function sellerDeleteProduct(id: string, token: string) {
  await proxyFetch<null>(`/seller/products/${id}`, token, "DELETE")
}

export type PricingSummary = {
  listing_price: number
  commission_percent: number
  commission_percent_label: string
  commission_amount: number
  seller_receives: number
  currency: string
}

export async function sellerPricingPreview(price: number, token: string): Promise<PricingSummary | null> {
  const fd = new FormData()
  fd.append("price", String(price))
  const res = await proxyFetchFormData<{ pricing_summary: PricingSummary }>(
    "/seller/products/pricing-preview",
    token,
    "POST",
    fd
  )
  return res.data?.pricing_summary ?? null
}

// ─── Seller Orders ─────────────────────────────────────────────────────────────

export async function sellerFetchOrders(token: string, page = 1) {
  const res = await proxyFetch<{ orders: SellerOrder[]; pagination: SellerOrderPagination }>(
    `/seller/orders?page=${page}`,
    token
  )
  return res.data ?? { orders: [], pagination: null }
}

export async function sellerFetchOrder(id: string, token: string) {
  const res = await proxyFetch<{ order: SellerOrder }>(`/seller/orders/${id}`, token)
  return res.data?.order ?? null
}

export async function sellerAcceptOrderItem(orderId: string, itemId: string, token: string) {
  const res = await proxyFetch<{ order: SellerOrder }>(
    `/seller/orders/${orderId}/items/${itemId}/accept`,
    token,
    "POST"
  )
  return res.data?.order ?? null
}

export async function sellerDeclineOrderItem(orderId: string, itemId: string, reason: string, token: string) {
  const res = await proxyFetch<{ order: SellerOrder }>(
    `/seller/orders/${orderId}/items/${itemId}/decline`,
    token,
    "POST",
    { reason }
  )
  return res.data?.order ?? null
}

// ─── Seller Finances ──────────────────────────────────────────────────────────
// These are seller-specific finance endpoints, distinct from the customer wallet.

export type SellerWallet = {
  balance: number
  currency: string
  total_earned: number
  total_withdrawn: number
}

export type SellerTransaction = {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  reference: string | null
  balance_before: number
  balance_after: number
  created_at: { item: string }
}

export type SellerEarningsSummary = {
  total_earned: number
  commission_paid: number
  net_earnings: number
  pending_payout: number
  currency: string
}

export type SellerEarningsLine = {
  id: string
  order_id: string
  order_reference: string
  gross_amount: number
  commission_amount: number
  net_amount: number
  commission_percent: number
  status: "pending" | "settled" | "reversed"
  created_at: { item: string }
}

export type SellerFinanceOverview = {
  wallet: SellerWallet
  earnings: SellerEarningsSummary
}

export type SellerWithdrawal = {
  id: string
  reference: string
  amount: number
  status: "pending" | "approved" | "rejected" | "processed" | "cancelled"
  bank_name: string
  account_number: string
  account_name: string
  bank_code: string | null
  bank_account_id: string
  created_at: { item: string }
  updated_at: { item: string }
  processed_at: { item: string } | null
}

export async function sellerFetchWallet(token: string) {
  const res = await proxyFetch<{ wallet: SellerWallet }>("/seller/finance/wallet", token)
  return res.data?.wallet ?? null
}

export async function sellerFetchTransactions(token: string, page = 1) {
  const res = await proxyFetch<{ transactions: SellerTransaction[]; pagination: { current_page: number; per_page: number; total: number; last_page: number } }>(
    `/seller/finance/wallet/transactions?page=${page}`,
    token
  )
  return res.data ?? { transactions: [], pagination: null }
}

export async function sellerFetchEarningsSummary(token: string) {
  const res = await proxyFetch<{ summary: SellerEarningsSummary }>("/seller/finance/earnings/summary", token)
  return res.data?.summary ?? null
}

export async function sellerFetchEarningsLines(token: string, page = 1) {
  const res = await proxyFetch<{ lines: SellerEarningsLine[]; pagination: { current_page: number; per_page: number; total: number; last_page: number } }>(
    `/seller/finance/earnings/lines?page=${page}`,
    token
  )
  return res.data ?? { lines: [], pagination: null }
}

export async function sellerFetchFinanceOverview(token: string) {
  const res = await proxyFetch<{ wallet: SellerWallet; earnings: SellerEarningsSummary }>("/seller/finance/overview", token)
  return res.data ?? null
}

export async function sellerFetchWithdrawals(token: string, page = 1) {
  const res = await proxyFetch<{ withdrawals: SellerWithdrawal[]; pagination: { current_page: number; per_page: number; total: number; last_page: number } }>(
    `/seller/finance/withdrawals?page=${page}`,
    token
  )
  return res.data ?? { withdrawals: [], pagination: null }
}

export async function sellerFetchWithdrawal(id: string, token: string) {
  const res = await proxyFetch<{ withdrawal: SellerWithdrawal }>(`/seller/finance/withdrawals/${id}`, token)
  return res.data?.withdrawal ?? null
}

export async function sellerCreateWithdrawal(data: { bank_account_id: string; amount: number }, token: string) {
  const res = await proxyFetch<{ withdrawal: SellerWithdrawal; wallet: SellerWallet }>(
    "/seller/finance/withdrawals",
    token,
    "POST",
    data
  )
  return res.data ?? null
}

