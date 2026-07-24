import { fetchGenericSettings, type PublicSettings } from "@/lib/generic-api"
import { SITE_NAME, CONTACT } from "@/lib/seo/config"

/**
 * Resolved, always-present site settings for server components.
 * Fetches the public /generic/settings endpoint (ISR-cached) and falls back to
 * the static SEO config so the UI never renders empty if the API is unavailable.
 */
export type ResolvedSiteSettings = {
  siteName: string
  logoUrl: string | null
  supportEmail: string
}

export async function getSiteSettings(): Promise<ResolvedSiteSettings> {
  let s: PublicSettings | null = null
  try {
    s = await fetchGenericSettings()
  } catch {
    // fall through to config defaults
  }
  return {
    siteName: s?.site_name?.trim() || SITE_NAME,
    logoUrl: s?.logo_url?.trim() || null,
    supportEmail: s?.support_email?.trim() || CONTACT.email,
  }
}
