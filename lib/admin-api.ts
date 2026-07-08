/**
 * Admin API functions — typed fetchers for the admin dashboard.
 *
 * All functions require an auth token (Bearer) from the NextAuth session.
 * Uses the existing api-client infrastructure for consistency.
 */

import { apiGet } from "@/lib/api-client"

// ─── Shared API envelope ──────────────────────────────────────────────────────

type ApiEnvelope<T> = {
  success: boolean
  code: number
  locale: string
  message: string
  data: T
}

// ─── Proxy Helpers ────────────────────────────────────────────────────────────

/**
 * Helper to fetch from the Next.js API proxy to avoid CORS.
 * All paths must start with a slash (e.g., /admin/categories).
 */
async function proxyFetch<T>(path: string, token: string, method = "GET", body?: any, customHeaders?: Record<string, string>): Promise<ApiEnvelope<T>> {
  const url = `/api/proxy${path}`
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...customHeaders,
  }

  if (body && !customHeaders?.["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  })

  const textData = await res.text()
  let data
  try {
    data = textData ? JSON.parse(textData) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`)
  }

  return data as ApiEnvelope<T>
}

async function proxyFetchFormData<T>(path: string, token: string, method = "POST", formData: FormData): Promise<ApiEnvelope<T>> {
  const url = `/api/proxy${path}`
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }

  // Note: Do not set Content-Type for FormData, the browser handles it (including the boundary string).

  const res = await fetch(url, {
    method,
    headers,
    body: formData,
  })

  const textData = await res.text()
  let data
  try {
    data = textData ? JSON.parse(textData) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`)
  }

  return data as ApiEnvelope<T>
}

// ─── Admin Categories ─────────────────────────────────────────────────────────

export type AdminCategory = {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  is_active: boolean
  listings_count: number
  created_at: { item: string }
  updated_at: { item: string }
  image_url: string | null
}

type AdminCategoriesData = {
  categories: AdminCategory[]
  total_listings_count: number
}

export async function fetchAdminCategories(token: string) {
  return proxyFetch<AdminCategoriesData>("/admin/categories", token)
}

export async function fetchAdminCategory(id: string, token: string) {
  return proxyFetch<{ category: AdminCategory }>(`/admin/categories/${id}`, token)
}

export async function createAdminCategory(data: Partial<AdminCategory>, token: string) {
  return proxyFetch<{ category: AdminCategory }>("/admin/categories", token, "POST", data)
}

export async function updateAdminCategory(id: string, data: Partial<AdminCategory>, token: string) {
  return proxyFetch<{ category: AdminCategory }>(`/admin/categories/${id}`, token, "PUT", data)
}

export async function deleteAdminCategory(id: string, token: string) {
  return proxyFetch<null>(`/admin/categories/${id}`, token, "DELETE")
}

// ─── Admin Sellers ────────────────────────────────────────────────────────────

export type AdminSeller = {
  id: string
  shop_name: string
  slug: string
  phone: string | null
  location: string | null
  category_id: string | null
  category: { id: string; name: string; slug: string; image_url: string | null } | null
  description: string | null
  tier: string
  cover_image_url: string | null
  operating_hours: string | null
  floor: string | null
  shop_no: string | null
  store_location: string | null
  whatsapp_contact_id: string | null
  is_kyc_verified: boolean | number
  delivery_estimate_minutes: number | null
  delivery_fee: number | null
  delivery_currency: string
  rating_average: number | null
  reviews_count: number
  status: "pending" | "approved" | "rejected" | "suspended"
  rejection_reason: string | null
  products_count: number
  approved_at: { item: string } | null
  user: { id: string; full_name: string; email: string }
}

type AdminSellersData = {
  sellers: AdminSeller[]
  pagination: { current_page: number; per_page: number; total: number; last_page: number }
}

export async function fetchAdminSellers(token: string) {
  return proxyFetch<AdminSellersData>("/admin/sellers", token)
}

export async function fetchAdminSeller(id: string, token: string) {
  return proxyFetch<{ seller: AdminSeller }>(`/admin/sellers/${id}`, token)
}

export async function storeAdminSeller(data: FormData, token: string) {
  return proxyFetchFormData<{ seller: AdminSeller }>("/admin/sellers", token, "POST", data)
}

export async function updateAdminSeller(id: string, data: FormData, token: string) {
  return proxyFetchFormData<{ seller: AdminSeller }>(`/admin/sellers/${id}`, token, "POST", data)
}

export async function updateAdminSellerStatus(
  id: string,
  action: "approve" | "reject" | "suspend",
  token: string,
  reason?: string
) {
  const body = reason ? new URLSearchParams({ reason }).toString() : undefined
  const headers = reason ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined

  return proxyFetch<{ seller: AdminSeller }>(
    `/admin/sellers/${id}/${action}`,
    token,
    "POST",
    body,
    headers
  )
}

// ─── Admin Products ───────────────────────────────────────────────────────────

export type AdminProduct = {
  id: string
  seller_id: string
  category_id: string
  name: string
  slug: string
  brand: string | null
  description: string | null
  price: number
  currency: string
  location: string | null
  status: "draft" | "pending" | "active" | "inactive" | "rejected"
  rejection_reason: string | null
  is_featured: boolean
  is_escrow_enabled: boolean
  is_nationwide_delivery: boolean
  is_authentic_only: boolean
  in_stock: boolean
  delivery_estimate: string | null
  specifications: string[]
  rating_average: number | null
  reviews_count: number
  created_at: { item: string }
  updated_at: { item: string }
  deleted_at: { item: string } | null
  images: { id: string; url: string; sort_order: number; is_primary: boolean }[]
  seller: { id: string; shop_name: string; slug: string }
  category: { id: string; name: string; slug: string; image_url: string | null } | null
}


type AdminProductsData = {
  products: AdminProduct[]
  pagination: { current_page: number; per_page: number; total: number; last_page: number }
}

export async function fetchAdminProducts(token: string, status?: string) {
  const qs = status ? `?filter[status]=${status}` : ""
  return proxyFetch<AdminProductsData>(`/admin/products${qs}`, token)
}

export async function fetchAdminProduct(id: string, token: string) {
  return proxyFetch<{ product: AdminProduct }>(`/admin/products/${id}`, token)
}

export async function createAdminProduct(formData: FormData, token: string) {
  return proxyFetchFormData<{ product: AdminProduct }>("/admin/products", token, "POST", formData)
}

export async function updateAdminProduct(id: string, formData: FormData, token: string) {
  // Laravel expects _method=PUT when submitting form data for a PUT/PATCH request
  formData.append("_method", "PUT")
  return proxyFetchFormData<{ product: AdminProduct }>(`/admin/products/${id}`, token, "POST", formData)
}

/**
 * Product status transitions:
 *  - approved  → POST /admin/products/{id}/approved   (pending → active)
 *  - reject    → POST /admin/products/{id}/reject     (pending → rejected), body: { reason }
 *  - activate  → POST /admin/products/{id}/activate   (inactive/rejected → active)
 *  - deactivate→ POST /admin/products/{id}/deactivate (active → inactive)
 */
export async function approveAdminProduct(id: string, token: string) {
  return proxyFetch<{ product: AdminProduct }>(`/admin/products/${id}/approve`, token, "POST")
}

export async function rejectAdminProduct(id: string, token: string, reason?: string) {
  return proxyFetch<{ product: AdminProduct }>(`/admin/products/${id}/reject`, token, "POST", reason ? { reason } : undefined)
}

export async function activateAdminProduct(id: string, token: string) {
  return proxyFetch<{ product: AdminProduct }>(`/admin/products/${id}/activate`, token, "POST")
}

export async function deactivateAdminProduct(id: string, token: string) {
  return proxyFetch<{ product: AdminProduct }>(`/admin/products/${id}/deactivate`, token, "POST")
}

/** @deprecated Use the individual action functions above instead */
export async function updateAdminProductStatus(id: string, action: "approve" | "reject" | "activate" | "deactivate", token: string) {
  const actionMap: Record<string, string> = { approve: "approved", reject: "reject", activate: "activate", deactivate: "deactivate" }
  return proxyFetch<{ product: AdminProduct }>(`/admin/products/${id}/${actionMap[action]}`, token, "POST")
}

// ─── Admin WhatsApp Contacts ──────────────────────────────────────────────────

export type AdminWhatsAppContact = {
  id: string
  phone_number: string
  label: string
  is_active: boolean
  sellers_count: number
  created_at: { item: string }
  updated_at: { item: string }
}

type AdminWhatsAppContactsData = {
  whatsapp_contacts: AdminWhatsAppContact[]
}

export async function fetchAdminWhatsAppContacts(token: string) {
  return proxyFetch<AdminWhatsAppContactsData>("/admin/whatsapp-contacts", token)
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string
  full_name: string | null
  email: string
  type: "admin" | "vendor" | "customer"
  status: "active" | "suspended" | "pending"
  phone: string | null
  email_verified_at: string | null
  created_at: { item: string }
  updated_at: { item: string }
  seller: { id: string; shop_name: string; slug: string; status: string } | null
}

type AdminUsersData = {
  users: AdminUser[]
  pagination: { current_page: number; per_page: number; total: number; last_page: number }
}

export async function fetchAdminUsers(token: string, type?: "admin" | "vendor" | "customer") {
  const qs = type ? `?filter[type]=${type}` : ""
  return proxyFetch<AdminUsersData>(`/admin/users${qs}`, token)
}

export async function fetchAdminUser(id: string, token: string) {
  return proxyFetch<{ user: AdminUser }>(`/admin/users/${id}`, token)
}

export async function updateAdminUser(id: string, data: Partial<AdminUser>, token: string) {
  return proxyFetch<{ user: AdminUser }>(`/admin/users/${id}`, token, "PUT", data)
}

export async function toggleUserVerification(id: string, token: string) {
  return proxyFetch<{ user: AdminUser }>(`/admin/users/${id}/toggle-verification`, token, "POST")
}

export async function toggleUserSuspension(id: string, token: string) {
  return proxyFetch<{ user: AdminUser }>(`/admin/users/${id}/toggle-suspension`, token, "POST")
}

// ─── Admin WhatsApp Contacts (Extended) ───────────────────────────────────────

export async function storeAdminWhatsAppContact(data: Partial<AdminWhatsAppContact>, token: string) {
  return proxyFetch<{ whatsapp_contact: AdminWhatsAppContact }>("/admin/whatsapp-contacts", token, "POST", data)
}

export async function updateAdminWhatsAppContact(id: string, data: Partial<AdminWhatsAppContact>, token: string) {
  return proxyFetch<{ whatsapp_contact: AdminWhatsAppContact }>(`/admin/whatsapp-contacts/${id}`, token, "PUT", data)
}

export async function deleteAdminWhatsAppContact(id: string, token: string) {
  return proxyFetch<null>(`/admin/whatsapp-contacts/${id}`, token, "DELETE")
}

// ─── Admin Withdrawals ────────────────────────────────────────────────────────

export type AdminWithdrawal = {
  id: string
  seller_id: string
  reference: string
  amount: number
  status: "pending" | "processing" | "completed" | "failed" | "rejected" | "cancelled"
  seller_receives: number
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  seller: { id: string; shop_name: string; slug: string }
  created_at: { item: string }
  updated_at: { item: string }
}

export async function fetchAdminWithdrawals(token: string, status?: string) {
  const qs = status ? `?filter[status]=${status}` : ""
  return proxyFetch<{ withdrawals: AdminWithdrawal[]; pagination: any }>(`/admin/withdrawals${qs}`, token)
}

export async function fetchAdminWithdrawal(id: string, token: string) {
  return proxyFetch<{ withdrawal: AdminWithdrawal }>(`/admin/withdrawals/${id}`, token)
}

export async function completeAdminWithdrawal(id: string, token: string) {
  return proxyFetch<{ withdrawal: AdminWithdrawal }>(`/admin/withdrawals/${id}/complete`, token, "POST")
}

export async function rejectAdminWithdrawal(id: string, token: string, reason: string) {
  return proxyFetch<{ withdrawal: AdminWithdrawal }>(`/admin/withdrawals/${id}/reject`, token, "POST", { reason })
}

export async function cancelAdminWithdrawal(id: string, token: string) {
  return proxyFetch<{ withdrawal: AdminWithdrawal }>(`/admin/withdrawals/${id}/cancel`, token, "POST")
}

// ─── Admin Seller Tiers ───────────────────────────────────────────────────────

export type AdminSellerTier = {
  id: string
  name: string
  commission_percent: number
  benefits: string[]
  created_at: { item: string }
  updated_at: { item: string }
}

export async function fetchAdminSellerTiers(token: string) {
  return proxyFetch<{ tiers: AdminSellerTier[] }>("/admin/seller-tiers", token)
}

export async function updateAdminSellerTier(id: string, data: Partial<AdminSellerTier>, token: string) {
  return proxyFetch<{ tier: AdminSellerTier }>(`/admin/seller-tiers/${id}`, token, "PUT", data)
}

// ─── Admin Seller Payouts ─────────────────────────────────────────────────────

export type AdminPayout = {
  id: string
  seller_id: string
  amount: number
  status: "pending" | "paid"
  reference: string
  seller: { id: string; shop_name: string; slug: string }
  created_at: { item: string }
  updated_at: { item: string }
}

export async function fetchAdminPayouts(token: string) {
  return proxyFetch<{ payouts: AdminPayout[]; pagination: any }>("/admin/seller-payouts", token)
}

export async function fetchAdminPayoutHistory(token: string) {
  return proxyFetch<{ history: AdminPayout[]; pagination: any }>("/admin/seller-payouts/history", token)
}

export async function fetchAdminPayout(id: string, token: string) {
  return proxyFetch<{ payout: AdminPayout }>(`/admin/seller-payouts/${id}`, token)
}

export async function markAdminPayoutPaid(id: string, token: string) {
  return proxyFetch<{ payout: AdminPayout }>(`/admin/seller-payouts/${id}/mark-paid`, token, "POST")
}

// ─── Admin Orders ─────────────────────────────────────────────────────────────

export type AdminOrder = {
  id: string
  reference: string
  status: "pending" | "processing" | "in_transit" | "delivered" | "cancelled" | "disputed"
  total_amount: number
  customer_id: string
  customer: { id: string; full_name: string; email: string }
  items: {
    id: string
    product_name: string
    quantity: number
    unit_price: number
    seller: { id: string; shop_name: string }
    status: string
  }[]
  created_at: { item: string }
  updated_at: { item: string }
}

export async function fetchAdminOrders(token: string, status?: string) {
  const qs = status ? `?filter[status]=${status}` : ""
  return proxyFetch<{ orders: AdminOrder[]; pagination: any }>(`/admin/orders${qs}`, token)
}

export async function fetchAdminOrder(id: string, token: string) {
  return proxyFetch<{ order: AdminOrder }>(`/admin/orders/${id}`, token)
}

export async function cancelAdminOrder(id: string, token: string) {
  return proxyFetch<{ order: AdminOrder }>(`/admin/orders/${id}/cancel`, token, "POST")
}

export async function updateAdminOrderStatus(id: string, status: "process" | "transit" | "deliver", token: string) {
  return proxyFetch<{ order: AdminOrder }>(`/admin/orders/${id}/mark-${status}`, token, "POST")
}

export async function sellerActionAdminOrder(orderId: string, itemId: string, action: "accept" | "decline", token: string, reason?: string) {
  const body = action === "decline" && reason ? { reason } : undefined
  return proxyFetch<{ order: AdminOrder }>(`/admin/orders/${orderId}/items/${itemId}/${action}`, token, "POST", body)
}

// ─── Admin Revenue ────────────────────────────────────────────────────────────

export type AdminRevenueSummary = {
  total_revenue: number
  pending_revenue: number
  available_revenue: number
}

export type AdminRevenueLine = {
  id: string
  amount: number
  description: string
  type: string
  created_at: { item: string }
}

export async function fetchAdminRevenueSummary(token: string) {
  return proxyFetch<{ summary: AdminRevenueSummary }>("/admin/revenue/summary", token)
}

export async function fetchAdminRevenueLines(token: string) {
  return proxyFetch<{ lines: AdminRevenueLine[]; pagination: any }>("/admin/revenue/lines", token)
}

// ─── Admin Payment Methods ────────────────────────────────────────────────────

export type AdminPaymentMethod = {
  id: string
  name: string
  slug: string
  is_active: boolean
  configuration: Record<string, any>
  created_at: { item: string }
  updated_at: { item: string }
}

export async function fetchAdminPaymentMethods(token: string) {
  return proxyFetch<{ payment_methods: AdminPaymentMethod[] }>("/admin/payment-methods", token)
}

export async function updateAdminPaymentMethod(id: string, data: Partial<AdminPaymentMethod>, token: string) {
  return proxyFetch<{ payment_method: AdminPaymentMethod }>(`/admin/payment-methods/${id}`, token, "PUT", data)
}

// ─── Admin Payments ───────────────────────────────────────────────────────────

export type AdminPayment = {
  id: string
  order_id: string
  amount: number
  method: string
  status: "pending" | "approved" | "rejected"
  reference: string
  proof_of_payment_url?: string
  order: { id: string; reference: string; customer: { full_name: string } }
  created_at: { item: string }
  updated_at: { item: string }
}

export async function fetchAdminPayments(token: string) {
  return proxyFetch<{ payments: AdminPayment[]; pagination: any }>("/admin/payments", token)
}

export async function fetchAdminPayment(id: string, token: string) {
  return proxyFetch<{ payment: AdminPayment }>(`/admin/payments/${id}`, token)
}

export async function approveAdminPayment(id: string, token: string) {
  return proxyFetch<{ payment: AdminPayment }>(`/admin/payments/${id}/approve`, token, "POST")
}

export async function rejectAdminPayment(id: string, token: string, reason: string) {
  return proxyFetch<{ payment: AdminPayment }>(`/admin/payments/${id}/reject`, token, "POST", { reason })
}

export async function downloadAdminPaymentProof(id: string, token: string) {
  // Assuming this returns a URL or file blob. We'll return the raw response envelope.
  return proxyFetch<{ url: string }>(`/admin/payments/${id}/proof`, token)
}

// ─── Aggregated Dashboard Data ────────────────────────────────────────────────

export type DashboardData = {
  categories: AdminCategory[]
  totalListingsCount: number
  sellers: AdminSeller[]
  totalSellers: number
  pendingSellers: number
  products: AdminProduct[]
  totalProducts: number
  pendingProducts: number
  recentProducts: AdminProduct[]
}

/**
 * Fetch all data needed for the admin overview dashboard.
 *
 * Routes through the Next.js API proxy at /api/admin/dashboard to avoid
 * CORS issues. The proxy fetches categories, sellers, and products
 * server-side and returns a unified response.
 */
export async function fetchDashboardData(token: string): Promise<DashboardData> {
  const res = await fetch("/api/admin/dashboard", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `Dashboard request failed (${res.status})`)
  }

  const json = await res.json()
  const { categories: catData, sellers: sellerData, products: productData } = json.data

  const categories: AdminCategory[] = catData?.categories ?? []
  const sellers: AdminSeller[] = sellerData?.sellers ?? []
  const products: AdminProduct[] = productData?.products ?? []

  return {
    categories,
    totalListingsCount: catData?.total_listings_count ?? 0,
    sellers,
    totalSellers: sellerData?.pagination?.total ?? sellers.length,
    pendingSellers: sellers.filter((s) => s.status === "pending").length,
    products,
    totalProducts: productData?.pagination?.total ?? products.length,
    pendingProducts: products.filter((p) => p.status === "pending").length,
    recentProducts: [...products]
      .sort((a, b) => new Date(b.created_at.item).getTime() - new Date(a.created_at.item).getTime())
      .slice(0, 5),
  }
}
