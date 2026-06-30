import { apiGet, ApiError } from "@/lib/api-client"

// ─── Shared Envelope ──────────────────────────────────────────────────────────
type ApiEnvelope<T> = {
  success: boolean
  code: number
  locale: string
  message: string
  data: T
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type GenericCategory = {
  id: string
  name: string
  slug: string
  icon: string | null
  sort_order: number
  listings_count: number
  image_url: string | null
  subcategories?: { name: string; slug: string }[] // Assuming simple subcategories for UI
}

export type GenericProduct = {
  id: string
  name: string
  slug: string
  brand: string | null
  price: number
  currency: string
  location: string | null
  in_stock: boolean
  rating_average: number | null
  reviews_count: number
  is_featured: boolean
  is_nationwide_delivery: boolean
  is_authentic_only: boolean
  images: { url: string; sort_order: number; is_primary: boolean }[]
  seller: { id: string; shop_name: string; slug: string } | null
  category: { id: string; name: string; slug: string; image_url: string | null } | null
  description?: string | null
  specifications?: string[]
  delivery_estimate?: string | null
}

export type GenericSeller = {
  id: string
  shop_name: string
  slug: string
  phone: string | null
  location: string | null
  description: string | null
  listings_count: number
  category: { id: string; name: string; slug: string; image_url: string | null } | null
  cover_image_url?: string | null
  tier?: string
  is_kyc_verified?: boolean
  is_open?: boolean
  rating_average?: number | null
  reviews_count?: number
  delivery_estimate_minutes?: number | null
  delivery_fee?: number | null
  delivery_currency?: string
  whatsapp?: string | null
}

export type Pagination = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function fetchGenericHome() {
  const res = await apiGet<ApiEnvelope<{
    categories: GenericCategory[]
    mall_vendors: GenericSeller[]
    featured_listings: GenericProduct[]
    popular_listings: GenericProduct[]
  }>>("/generic/home")
  return res.data
}

export async function fetchGenericCategories() {
  const res = await apiGet<ApiEnvelope<{ categories: GenericCategory[]; total_listings_count: number }>>("/generic/categories")
  return res.data
}

export async function fetchGenericCategory(slug: string) {
  const res = await apiGet<ApiEnvelope<{ category: GenericCategory }>>(`/generic/categories/${slug}`)
  return res.data.category
}

export async function fetchGenericProducts(params?: {
  q?: string
  category?: string
  subcategory?: string
  brand?: string
  seller_id?: string
  sort?: string
  min_price?: number
  max_price?: number
}) {
  const searchParams: Record<string, any> = {}
  if (params?.q) searchParams["filter[search]"] = params.q
  if (params?.category) searchParams["filter[category_slug]"] = params.category
  if (params?.brand) searchParams["filter[brand]"] = params.brand
  if (params?.seller_id) searchParams["filter[seller_id]"] = params.seller_id
  if (params?.min_price !== undefined) searchParams["filter[min_price]"] = params.min_price
  if (params?.max_price !== undefined) searchParams["filter[max_price]"] = params.max_price
  
  const res = await apiGet<ApiEnvelope<{ products: GenericProduct[]; pagination: Pagination }>>("/generic/products", {
    params: searchParams,
  })
  return res.data
}

export async function fetchGenericProduct(slug: string) {
  const res = await apiGet<ApiEnvelope<{ product: GenericProduct; comparable_products: GenericProduct[] }>>(`/generic/products/slug/${slug}`)
  return res.data
}

export async function fetchGenericSellers() {
  const res = await apiGet<ApiEnvelope<{ sellers: GenericSeller[]; pagination: Pagination }>>("/generic/sellers")
  return res.data
}

export async function fetchGenericSeller(slug: string) {
  const res = await apiGet<ApiEnvelope<{ seller: GenericSeller; products: GenericProduct[]; pagination: Pagination }>>(`/generic/sellers/${slug}`)
  return res.data
}
