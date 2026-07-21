/**
 * Typed JSON-LD schema builders for Banex Mall.
 *
 * These produce schema.org objects consumed by search engines and AI answer
 * engines (Google rich results, Bing, ChatGPT/Perplexity crawlers). Each builder
 * returns a plain object; render it with the <JsonLd> component.
 *
 * Reference: https://schema.org, https://developers.google.com/search/docs/appearance/structured-data
 */
import {
  SITE_URL,
  SITE_NAME,
  SITE_LEGAL_NAME,
  SITE_LOGO,
  SITE_DESCRIPTION,
  DEFAULT_CURRENCY,
  BUSINESS_ADDRESS,
  CONTACT,
  SOCIAL_PROFILES,
  absoluteUrl,
} from "./config"

/** Stable @id anchors so nodes can reference each other across the graph. */
export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

// ─── Organization ──────────────────────────────────────────────────────────────
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": ORG_ID,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: SITE_LOGO },
    image: SITE_LOGO,
    description: SITE_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_ADDRESS.streetAddress,
      addressLocality: BUSINESS_ADDRESS.addressLocality,
      addressRegion: BUSINESS_ADDRESS.addressRegion,
      postalCode: BUSINESS_ADDRESS.postalCode,
      addressCountry: BUSINESS_ADDRESS.addressCountry,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.telephone,
      email: CONTACT.email,
      contactType: "customer support",
      areaServed: "NG",
      availableLanguage: ["en"],
    },
    sameAs: SOCIAL_PROFILES,
    areaServed: { "@type": "Country", name: "Nigeria" },
    currenciesAccepted: DEFAULT_CURRENCY,
  }
}

// ─── WebSite (+ Sitelinks Search Box) ──────────────────────────────────────────
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-NG",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

// ─── BreadcrumbList ────────────────────────────────────────────────────────────
export type Crumb = { name: string; path: string }

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  }
}

// ─── Product (+ Offer / AggregateOffer / AggregateRating) ──────────────────────
type OfferSeller = { name: string; price: number; url?: string }

export type ProductSchemaInput = {
  name: string
  slug: string
  description?: string | null
  images?: string[]
  brand?: string | null
  sku?: string
  category?: string | null
  condition?: "New" | "Used" | "Refurbished" | string | null
  currency?: string
  price?: number
  inStock?: boolean
  ratingValue?: number | null
  reviewCount?: number | null
  /** Multiple sellers → AggregateOffer with low/high price. */
  sellers?: OfferSeller[]
}

const CONDITION_MAP: Record<string, string> = {
  New: "https://schema.org/NewCondition",
  Used: "https://schema.org/UsedCondition",
  Refurbished: "https://schema.org/RefurbishedCondition",
}

export function productSchema(p: ProductSchemaInput) {
  const currency = p.currency || DEFAULT_CURRENCY
  const url = absoluteUrl(`/product/${p.slug}`)
  const availability = p.inStock === false
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock"

  let offers: Record<string, unknown>
  if (p.sellers && p.sellers.length > 1) {
    const prices = p.sellers.map((s) => s.price).filter((n) => n > 0)
    offers = {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: p.sellers.length,
      availability,
      offers: p.sellers.map((s) => ({
        "@type": "Offer",
        price: s.price,
        priceCurrency: currency,
        availability,
        url: s.url || url,
        seller: { "@type": "Organization", name: s.name },
      })),
    }
  } else {
    offers = {
      "@type": "Offer",
      price: p.price ?? p.sellers?.[0]?.price ?? 0,
      priceCurrency: currency,
      availability,
      url,
      itemCondition: p.condition ? CONDITION_MAP[p.condition] : undefined,
      seller: { "@id": ORG_ID },
    }
  }

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    url,
    description: p.description || undefined,
    image: p.images?.length ? p.images : undefined,
    sku: p.sku || p.slug,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(p.category ? { category: p.category } : {}),
    ...(p.condition && CONDITION_MAP[p.condition]
      ? { itemCondition: CONDITION_MAP[p.condition] }
      : {}),
    offers,
  }

  if (p.ratingValue && p.reviewCount && p.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.ratingValue,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
}

// ─── Store / LocalBusiness (vendor pages) ──────────────────────────────────────
export type StoreSchemaInput = {
  name: string
  slug: string
  description?: string | null
  image?: string | null
  telephone?: string | null
  location?: string | null
  ratingValue?: number | null
  reviewCount?: number | null
}

export function storeSchema(s: StoreSchemaInput) {
  const url = absoluteUrl(`/vendor/${s.slug}`)
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${url}#store`,
    name: s.name,
    url,
    description: s.description || undefined,
    image: s.image || undefined,
    telephone: s.telephone || undefined,
    parentOrganization: { "@id": ORG_ID },
    address: {
      "@type": "PostalAddress",
      streetAddress: s.location || BUSINESS_ADDRESS.streetAddress,
      addressLocality: BUSINESS_ADDRESS.addressLocality,
      addressRegion: BUSINESS_ADDRESS.addressRegion,
      addressCountry: BUSINESS_ADDRESS.addressCountry,
    },
  }
  if (s.ratingValue && s.reviewCount && s.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: s.ratingValue,
      reviewCount: s.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }
  return schema
}

// ─── ItemList (listing / catalogue pages) ──────────────────────────────────────
export type ListItemInput = { name: string; path: string; image?: string | null }

export function itemListSchema(name: string, items: ListItemInput[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(it.path),
      name: it.name,
      ...(it.image ? { image: it.image } : {}),
    })),
  }
}

// ─── FAQPage ───────────────────────────────────────────────────────────────────
export type Faq = { q: string; a: string }

export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}

// ─── CollectionPage / generic WebPage ──────────────────────────────────────────
export function webPageSchema(opts: {
  name: string
  path: string
  description?: string
  type?: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage"
}) {
  return {
    "@context": "https://schema.org",
    "@type": opts.type || "WebPage",
    name: opts.name,
    url: absoluteUrl(opts.path),
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en-NG",
  }
}
