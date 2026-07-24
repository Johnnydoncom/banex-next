/**
 * Admin API functions — typed fetchers for the admin dashboard.
 *
 * All functions require an auth token (Bearer) from the NextAuth session.
 * Uses the existing api-client infrastructure for consistency.
 */

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

export async function createAdminCategory(data: FormData, token: string) {
  return proxyFetchFormData<{ category: AdminCategory }>("/admin/categories", token, "POST", data)
}

export async function updateAdminCategory(id: string, data: FormData, token: string) {
  // Laravel expects _method=PUT when updating via multipart form data.
  data.append("_method", "PUT")
  return proxyFetchFormData<{ category: AdminCategory }>(`/admin/categories/${id}`, token, "POST", data)
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

/**
 * Seller status is controlled by two toggles on the API:
 *  - toggle-approval   → flips pending ⇄ approved
 *  - toggle-suspension → flips approved ⇄ suspended (accepts an optional note)
 */
export async function toggleAdminSellerApproval(id: string, token: string) {
  return proxyFetch<{ seller: AdminSeller }>(`/admin/sellers/${id}/toggle-approval`, token, "POST")
}

export async function toggleAdminSellerSuspension(id: string, token: string, note?: string) {
  const body = note ? new URLSearchParams({ note }).toString() : undefined
  const headers = note ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined

  return proxyFetch<{ seller: AdminSeller }>(
    `/admin/sellers/${id}/toggle-suspension`,
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
  type: string // "user" | "admin"
  registered_via?: string
  phone: string | null
  email_verified_at: { item: string } | null
  status?: "active" | "suspended" | "pending"
  is_suspended?: boolean
  suspended_at?: { item: string } | null
  has_store?: boolean
  store_status?: string | null
  seller: { id: string; shop_name: string; slug: string; status: string } | null
  wallet?: { balance: number; currency: string } | null
  orders_count?: number
  created_at: { item: string }
  updated_at?: { item: string }
}

type AdminUsersData = {
  users: AdminUser[]
  pagination: { current_page: number; per_page: number; total: number; last_page: number }
}

/**
 * Fetch users. The API filters by `has_seller` (0 = buyers only, 1 = users
 * who own a shop) and `search`, NOT by a `type` field. Admin accounts are
 * distinguished by `type === "admin"` in the payload.
 */
export async function fetchAdminUsers(token: string, opts?: { has_seller?: 0 | 1; search?: string }) {
  const params = new URLSearchParams()
  if (opts?.has_seller !== undefined) params.set("has_seller", String(opts.has_seller))
  if (opts?.search) params.set("search", opts.search)
  const qs = params.toString() ? `?${params.toString()}` : ""
  return proxyFetch<AdminUsersData>(`/admin/users${qs}`, token)
}

export async function fetchAdminUser(id: string, token: string) {
  return proxyFetch<{ user: AdminUser }>(`/admin/users/${id}`, token)
}

/** Update editable user fields (full_name, phone). Sent as urlencoded. */
export async function updateAdminUser(id: string, data: { full_name?: string | null; phone?: string | null }, token: string) {
  const params = new URLSearchParams()
  if (data.full_name !== undefined && data.full_name !== null) params.set("full_name", data.full_name)
  if (data.phone !== undefined && data.phone !== null) params.set("phone", data.phone)
  return proxyFetch<{ user: AdminUser }>(`/admin/users/${id}`, token, "PUT", params.toString(), {
    "Content-Type": "application/x-www-form-urlencoded",
  })
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
  status: "pending" | "processing" | "completed" | "failed" | "rejected" | "cancelled"
  amount: number
  currency: string
  bank_name: string | null
  bank_code: string | null
  account_number: string | null
  account_name: string | null
  user: { id: string; full_name: string; email: string }
  processed_at: { item: string } | null
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
  id: number | string
  slug: string
  name: string
  commission_percent: number
  commission_percent_label?: string
  sort_order?: number
  is_active?: boolean
  updated_at: { item: string }
}

export async function fetchAdminSellerTiers(token: string) {
  return proxyFetch<{ seller_tiers: AdminSellerTier[] }>("/admin/seller-tiers", token)
}

/**
 * Seller tiers are updated in bulk via PUT /admin/seller-tiers with a
 * `{ tiers: [{ id, slug, name?, commission_percent }] }` payload.
 */
export type AdminSellerTierUpdate = { id: number | string; slug: string; name?: string; commission_percent: number }

export async function updateAdminSellerTiers(tiers: AdminSellerTierUpdate[], token: string) {
  return proxyFetch<{ seller_tiers: AdminSellerTier[] }>("/admin/seller-tiers", token, "PUT", { tiers })
}

// ─── Admin Seller Payouts ─────────────────────────────────────────────────────

// Shape verified live 2026-07-23. Payouts are aggregated per seller (no id/reference/status).
export type AdminPayout = {
  seller: { id: string; shop_name: string; slug: string }
  line_count: number
  payable_total: number
  paid_total?: number
  currency: string
  paid_at?: { item: string } | null
}

// A single settlement line under a seller's payout (from the per-seller detail).
export type AdminPayoutLine = {
  id: string
  order_id: string
  order_created_at: { item: string }
  product_name: string
  quantity: number
  line_seller_total: number
  line_platform_fee: number
  commission_percent: number
  currency: string
  settlement_status: string
}

export async function fetchAdminPayouts(token: string) {
  return proxyFetch<{ seller_payouts: AdminPayout[]; pagination?: any }>("/admin/seller-payouts", token)
}

export async function fetchAdminPayoutHistory(token: string) {
  return proxyFetch<{ seller_payouts: AdminPayout[]; pagination: any }>("/admin/seller-payouts/history", token)
}

/** Payable settlement lines for one seller (used to gather order_item_ids for mark-paid). */
export async function fetchAdminPayoutLines(sellerId: string, token: string) {
  return proxyFetch<{ lines: AdminPayoutLine[] }>(`/admin/seller-payouts/${sellerId}`, token)
}

/**
 * Mark a payout as paid. The API keys payouts by the underlying order items,
 * so it expects `order_item_ids[]` plus an optional payment reference.
 */
export async function markAdminPayoutPaid(orderItemIds: string[], token: string, reference?: string) {
  const params = new URLSearchParams()
  orderItemIds.forEach((id, i) => params.append(`order_item_ids[${i}]`, id))
  if (reference) params.append("reference", reference)
  return proxyFetch<{ payout: AdminPayout }>(
    "/admin/seller-payouts/mark-paid",
    token,
    "POST",
    params.toString(),
    { "Content-Type": "application/x-www-form-urlencoded" }
  )
}

// ─── Admin Orders ─────────────────────────────────────────────────────────────

export type AdminOrderItem = {
  id: string
  product_id: string
  seller_id: string
  status: string
  product_name: string
  unit_price: number
  quantity: number
  line_total: number
  weight_kg?: string
  currency: string
  seller_shop_name: string | null
  primary_image_url: string | null
}

export type AdminOrder = {
  id: string
  reference: string
  status: string
  fulfillment_type?: string
  user: { id: string; name: string; email: string }
  summary: { subtotal: number; delivery_fee: number; total: number; currency: string }
  item_count: number
  // `items` is only present on the single-order (detail) response.
  items?: AdminOrderItem[]
  created_at: { item: string }
  updated_at?: { item: string }
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

export async function updateAdminOrderStatus(id: string, status: "in-process" | "in-transit" | "in-delivered", token: string) {
  return proxyFetch<{ order: AdminOrder }>(`/admin/orders/${id}/mark-${status}`, token, "POST")
}

export async function sellerActionAdminOrder(orderId: string, itemId: string, action: "accept" | "decline", token: string, reason?: string) {
  const body = action === "decline" && reason ? { reason } : undefined
  return proxyFetch<{ order: AdminOrder }>(`/admin/orders/${orderId}/items/${itemId}/${action}`, token, "POST", body)
}

// ─── Admin Revenue ────────────────────────────────────────────────────────────

// Shape verified live 2026-07-23 against GET /admin/platform-revenue.
export type AdminRevenueSummary = {
  currency: string
  anticipated_fee: number
  payable_fee: number
  realized_fee: number
  collectible_fee: number
  seller_payouts: { pending_total: number; payable_total: number; paid_out_total: number }
  line_counts: { pending: number; payable: number; paid_out: number; void: number }
  period: { from: string | null; to: string | null }
}

export type AdminRevenueLine = {
  id: string
  order_id: string
  order_reference: string
  order_created_at: { item: string }
  order_status: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  line_seller_total: number
  line_platform_fee: number
  commission_percent: number
  settlement_status: string
  item_status: string
  currency: string
  created_at: { item: string }
  seller: { id: string; shop_name: string; slug: string } | null
}

export async function fetchAdminRevenueSummary(token: string) {
  return proxyFetch<{ platform_revenue: AdminRevenueSummary }>("/admin/platform-revenue", token)
}

export async function fetchAdminRevenueLines(token: string) {
  return proxyFetch<{ lines: AdminRevenueLine[]; pagination: any }>("/admin/platform-revenue/lines", token)
}

// ─── Admin Payment Methods ────────────────────────────────────────────────────

// Shape verified live 2026-07-23 against GET /admin/payment-methods.
export type AdminPaymentMethod = {
  id: string
  name: string
  slug: string
  image: string | null
  status: "active" | "inactive"
  status_updated_at: { item: string } | null
  transactions_count: number
  manual_payment_instructions?: {
    bank_name?: string
    account_name?: string
    account_number?: string
    instructions?: string
  } | null
}

export async function fetchAdminPaymentMethods(token: string) {
  return proxyFetch<{ payment_methods: AdminPaymentMethod[] }>("/admin/payment-methods", token)
}

/**
 * Update a payment method. Sent as multipart form data (POST + _method=PUT)
 * so an optional `image` file can be included. `status` is "active"/"inactive".
 */
export async function updateAdminPaymentMethod(
  id: string,
  data: { name?: string; status?: "active" | "inactive"; image?: File | null; remove_image?: boolean },
  token: string
) {
  const form = new FormData()
  if (data.name !== undefined) form.append("name", data.name)
  if (data.status !== undefined) form.append("status", data.status)
  if (data.image) form.append("image", data.image)
  if (data.remove_image) form.append("remove_image", "1")
  form.append("_method", "PUT")
  return proxyFetchFormData<{ payment_method: AdminPaymentMethod }>(`/admin/payment-methods/${id}`, token, "POST", form)
}

// ─── Admin Settings ───────────────────────────────────────────────────────────
// Site-wide settings. Shape verified live 2026-07-24 against GET /admin/settings.
// GET is admin-only; the manual-payment bank details are ALSO exposed publicly via
// /generic/payment-methods (Bank Transfer method's manual_payment_instructions).

export type AdminManualPayment = {
  bank_name: string | null
  account_name: string | null
  account_number: string | null
  instructions: string | null
}

export type AdminSettings = {
  admin_notification_emails: string[]
  support_email: string | null
  manual_payment: AdminManualPayment
  updated_at?: { item: string }
}

export type AdminSettingsUpdate = {
  support_email?: string | null
  admin_notification_emails?: string[]
  manual_payment?: Partial<AdminManualPayment>
}

export async function fetchAdminSettings(token: string) {
  return proxyFetch<{ settings: AdminSettings }>("/admin/settings", token)
}

/** Update site-wide settings. Sent as JSON to PUT /admin/settings. */
export async function updateAdminSettings(data: AdminSettingsUpdate, token: string) {
  return proxyFetch<{ settings: AdminSettings }>("/admin/settings", token, "PUT", data)
}

// ─── Admin Payments ───────────────────────────────────────────────────────────

export type AdminPayment = {
  id: string
  reference: string
  amount: number
  currency: string
  status: string
  proof_status: string
  proof_mime: string | null
  proof_size: number | null
  proof_uploaded_at: { item: string } | null
  proof_reviewed_at: { item: string } | null
  proof_rejection_reason: string | null
  payment_method: { id: string; name: string; slug: string } | null
  order: {
    id: string
    reference: string
    status: string
    total: number
    currency: string
    created_at: { item: string }
    buyer: { id: string; name: string; email: string } | null
    items?: {
      id: string
      product_name: string
      unit_price: number
      quantity: number
      line_total: number
      seller_shop_name: string | null
    }[]
  } | null
  has_proof: boolean
  proof_download_url: string | null
  created_at: { item: string }
}

// Admin payment review covers manual (proof-of-payment) transfers under
// the /admin/payments/manual namespace.
export async function fetchAdminPayments(token: string) {
  return proxyFetch<{ payments: AdminPayment[]; pagination: any }>("/admin/payments/manual/pending-review", token)
}

export async function fetchAdminPayment(id: string, token: string) {
  return proxyFetch<{ payment: AdminPayment }>(`/admin/payments/${id}/manual`, token)
}

export async function approveAdminPayment(id: string, token: string) {
  return proxyFetch<{ payment: AdminPayment }>(`/admin/payments/${id}/manual/approve`, token, "POST")
}

export async function rejectAdminPayment(id: string, token: string, reason: string) {
  return proxyFetch<{ payment: AdminPayment }>(`/admin/payments/${id}/manual/reject`, token, "POST", { reason })
}

export async function downloadAdminPaymentProof(id: string, token: string) {
  // Returns the stored proof-of-payment (URL or file reference).
  return proxyFetch<{ url: string }>(`/admin/payments/${id}/manual/proof`, token)
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
