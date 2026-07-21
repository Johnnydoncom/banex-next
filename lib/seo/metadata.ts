/**
 * buildMetadata — a Rank-Math-style metadata factory.
 *
 * Produces a fully-formed Next.js `Metadata` object (title, description,
 * canonical, OpenGraph, Twitter, robots) from a small, page-focused input.
 * Handles sensible truncation and falls back to site defaults so every page
 * ships complete, non-duplicated meta tags.
 */
import type { Metadata } from "next"
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  TWITTER_HANDLE,
  absoluteUrl,
} from "./config"

/** Recommended max lengths for SERP display. */
const TITLE_MAX = 60
const DESC_MAX = 160

function truncate(text: string | undefined, max: number): string | undefined {
  if (!text) return text
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).trimEnd() + "…"
}

export type OgType = "website" | "article" | "product" | "profile"

export type BuildMetadataInput = {
  /** Page title WITHOUT the site-name suffix (the template adds it). */
  title?: string
  /** Set true when the title is already complete (skips the "— Banex Mall" template). */
  titleAbsolute?: boolean
  description?: string
  /** Path (e.g. "/shop/phones") or absolute URL used for the canonical + og:url. */
  path?: string
  /**
   * Explicit OG/Twitter image URLs. Leave undefined to let the route's
   * `opengraph-image.tsx` file convention generate the image (preferred).
   * Only set this to force a specific static image.
   */
  images?: (string | undefined | null)[]
  ogType?: OgType
  /** Prevent indexing (auth, checkout, thin, or private pages). */
  noindex?: boolean
  /** Extra keywords (used sparingly — modern engines largely ignore them). */
  keywords?: string[]
  /** Published/modified times for article-type pages. */
  publishedTime?: string
  modifiedTime?: string
}

export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const {
    title,
    titleAbsolute = false,
    description,
    path,
    images,
    ogType = "website",
    noindex = false,
    keywords,
    publishedTime,
    modifiedTime,
  } = input

  const desc = truncate(description, DESC_MAX) ?? SITE_DESCRIPTION
  const canonical = path ? absoluteUrl(path) : undefined

  // Only emit explicit images when provided; otherwise the route's
  // opengraph-image.tsx file convention supplies the OG/Twitter image.
  const ogImages = (images ?? [])
    .filter((u): u is string => !!u)
    .map((u) => (u.startsWith("http") ? u : absoluteUrl(u)))
  const hasImages = ogImages.length > 0

  // Title handling: absolute titles bypass the layout template.
  const resolvedTitle = title
    ? titleAbsolute
      ? truncate(title, TITLE_MAX)
      : truncate(title, TITLE_MAX - SITE_NAME.length - 3)
    : undefined

  return {
    ...(resolvedTitle
      ? { title: titleAbsolute ? { absolute: resolvedTitle } : resolvedTitle }
      : {}),
    description: desc,
    ...(keywords?.length ? { keywords } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: ogType === "product" ? "website" : ogType,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      ...(resolvedTitle ? { title: resolvedTitle } : {}),
      description: desc,
      ...(canonical ? { url: canonical } : {}),
      ...(hasImages
        ? { images: ogImages.map((url) => ({ url, width: 1200, height: 630 })) }
        : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      ...(resolvedTitle ? { title: resolvedTitle } : {}),
      description: desc,
      ...(hasImages ? { images: ogImages } : {}),
    },
  }
}

export { SITE_URL, SITE_NAME }
