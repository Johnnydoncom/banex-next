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
          "/checkout",
          "/checkout/",
          "/dashboard-redirect",
          "/api/",
          "/login",
          "/signup",
          "/otp",
          "/forgot-password",
          "/reset-password",
          // Faceted/search URLs: every combination is a separate dynamic render
          // (function invocation + CPU). Category paths and ?page= stay crawlable,
          // and every product is already listed in the sitemap.
          "/*?*q=",
          "/*?*sort=",
          "/*?*min_price=",
          "/*?*max_price=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
