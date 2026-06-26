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
async function proxyFetch<T>(path: string, token: string, method = "GET", body?: any): Promise<ApiEnvelope<T>> {
  const url = `/api/proxy${path}`
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }
  
  if (body) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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
  is_featured: boolean
  is_escrow_enabled: boolean
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

export async function fetchAdminProducts(token: string) {
  return proxyFetch<AdminProductsData>("/admin/products?trashed=with", token)
}

export async function fetchAdminProduct(id: string, token: string) {
  return proxyFetch<{ product: AdminProduct }>(`/admin/products/${id}`, token)
}

export async function updateAdminProductStatus(id: string, action: "approve" | "reject" | "activate" | "deactivate", token: string) {
  return proxyFetch<{ product: AdminProduct }>(`/admin/products/${id}/${action}`, token, "POST")
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
