import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo/config"
import {
  fetchGenericCategories,
  fetchGenericSellers,
  fetchGenericProducts,
} from "@/lib/generic-api"

/**
 * Dynamic sitemap. Combines static marketplace pages with live categories,
 * vendors and products pulled from the backend. Every fetch is guarded so a
 * backend hiccup degrades gracefully to the static entries instead of failing
 * the build/route.
 *
 * Revalidated hourly so new listings appear without a redeploy.
 */
export const revalidate = 3600

const STATIC_PATHS: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, freq: "daily" },
  { path: "/shop", priority: 0.9, freq: "daily" },
  { path: "/vendors", priority: 0.8, freq: "daily" },
  { path: "/top-sellers", priority: 0.6, freq: "weekly" },
  { path: "/mall-map", priority: 0.5, freq: "monthly" },
  { path: "/sell", priority: 0.6, freq: "monthly" },
  { path: "/become-seller", priority: 0.6, freq: "monthly" },
  { path: "/delivery", priority: 0.4, freq: "monthly" },
  { path: "/returns", priority: 0.4, freq: "monthly" },
  { path: "/help", priority: 0.5, freq: "monthly" },
  { path: "/contact", priority: 0.4, freq: "monthly" },
  { path: "/track-order", priority: 0.3, freq: "monthly" },
]

/** Page through products up to a sane cap so the sitemap stays performant. */
async function collectProducts(maxPages = 20) {
  const slugs: { slug: string; updated?: string }[] = []
  try {
    const first = await fetchGenericProducts()
    first.products?.forEach((p) => slugs.push({ slug: p.slug }))
    const lastPage = Math.min(first.pagination?.last_page ?? 1, maxPages)
    // Note: fetchGenericProducts currently fetches page 1; if the backend
    // supports ?page=, extend here. Kept to first page to avoid over-fetching.
    void lastPage
  } catch {
    /* backend unavailable — static entries still ship */
  }
  return slugs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((s) => ({
    url: absoluteUrl(s.path),
    lastModified: now,
    changeFrequency: s.freq,
    priority: s.priority,
  }))

  const [categoriesRes, sellersRes, products] = await Promise.all([
    fetchGenericCategories().catch(() => null),
    fetchGenericSellers().catch(() => null),
    collectProducts(),
  ])

  const categoryEntries: MetadataRoute.Sitemap =
    categoriesRes?.categories?.map((c) => ({
      url: absoluteUrl(`/shop/${c.slug}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    })) ?? []

  const vendorEntries: MetadataRoute.Sitemap =
    sellersRes?.sellers?.map((v) => ({
      url: absoluteUrl(`/vendor/${v.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })) ?? []

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/product/${p.slug}`),
    lastModified: p.updated ? new Date(p.updated) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticEntries, ...categoryEntries, ...vendorEntries, ...productEntries]
}
