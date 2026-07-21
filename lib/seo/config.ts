/**
 * Central SEO configuration for Banex Mall.
 *
 * All site-wide SEO constants live here so metadata, structured data, sitemap,
 * robots and OG images stay consistent. The canonical origin is driven by the
 * NEXT_PUBLIC_APP_URL environment variable so it can be changed per environment
 * without touching code.
 */

/** Canonical origin (no trailing slash). Override via NEXT_PUBLIC_APP_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://marketplace.banexmall.com"
).replace(/\/$/, "")

export const SITE_NAME = "Banex Mall"
export const SITE_LEGAL_NAME = "Banex Mall Marketplace"

export const SITE_TAGLINE = "Buy & Sell Anything in Nigeria"

export const SITE_DESCRIPTION =
  "Banex Mall is Nigeria's friendly online marketplace. Order from verified vendors inside Banex Mall — phones, fashion, groceries, beauty, electronics, vehicles, property and more — delivered same-hour by our riders or ready for in-mall pickup."

/** Default social share image (absolute URL). */
export const SITE_OG_IMAGE = `${SITE_URL}/assets/og-default.jpg`

/** Brand logo used in Organization schema (absolute URL). */
export const SITE_LOGO = `${SITE_URL}/assets/logo.png`

export const SITE_LOCALE = "en_NG"
export const SITE_LANG = "en"

export const TWITTER_HANDLE = "@banexmall"

/** Physical mall address — powers LocalBusiness / Organization schema. */
export const BUSINESS_ADDRESS = {
  streetAddress: "Banex Plaza, Aminu Kano Crescent, Wuse 2",
  addressLocality: "Abuja",
  addressRegion: "FCT",
  postalCode: "900288",
  addressCountry: "NG",
}

export const CONTACT = {
  telephone: "+234-800-000-0000",
  email: "support@banexmall.com",
}

export const SOCIAL_PROFILES = [
  "https://www.facebook.com/banexmall",
  "https://www.instagram.com/banexmall",
  "https://twitter.com/banexmall",
]

export const DEFAULT_CURRENCY = "NGN"

/** Absolute URL helper — joins a path onto the canonical origin. */
export function absoluteUrl(path = "/"): string {
  if (!path) return SITE_URL
  if (path.startsWith("http")) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
