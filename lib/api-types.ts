/**
 * Shared API response types for the Banex Marketplace backend.
 * Derived from the BANEX MARKETPLACE Postman collection.
 */

// ─── Generic / Shared ────────────────────────────────────────────────────────

export type ApiCategory = {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  listings_count: number
  image_url: string | null
}

export type ApiCategoryRef = {
  id: string
  name: string
  slug: string
  image_url: string | null
}

// ─── Mall Vendor (homepage) ───────────────────────────────────────────────────

export type ApiMallVendor = {
  id: string
  shop_name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  location: string | null
  tier: "premium" | "standard" | "basic"
  is_kyc_verified: boolean
  is_open: boolean
  rating_average: number | null
  reviews_count: number
  delivery_estimate_minutes: number | null
  delivery_fee: number | null
  delivery_currency: string
  whatsapp: string | null
  listings_count: number
  category: ApiCategoryRef | null
}

// ─── Product (listing) ────────────────────────────────────────────────────────

export type ApiProductImage = {
  url: string
  sort_order: number
  is_primary: boolean
}

export type ApiSellerRef = {
  id: string
  shop_name: string
  slug: string
}

export type ApiProduct = {
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
  images: ApiProductImage[]
  seller: ApiSellerRef | null
  category: ApiCategoryRef | null
}

// ─── Homepage ─────────────────────────────────────────────────────────────────

export type ApiHomepageData = {
  categories: ApiCategory[]
  mall_vendors: ApiMallVendor[]
  featured_listings: ApiProduct[]
  popular_listings: ApiProduct[]
}

export type ApiHomepageResponse = {
  success: boolean
  code: number
  locale: string
  message: string
  data: ApiHomepageData
}
