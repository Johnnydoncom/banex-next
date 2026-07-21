import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo/config"

/**
 * robots.txt — allow indexing of public marketplace pages, disallow private,
 * transactional and auth areas. Points crawlers to the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/account/",
          "/admin",
          "/admin/",
          "/vendor-dashboard",
          "/vendor-dashboard/",
          "/checkout",
          "/checkout/",
          "/dashboard-redirect",
          "/api/",
          "/login",
          "/signup",
          "/otp",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
