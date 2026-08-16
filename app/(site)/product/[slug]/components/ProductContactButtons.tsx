"use client"

import { Phone, MessageCircle } from "lucide-react"
import type { GenericProduct } from "@/lib/generic-api"

/**
 * Contact actions on the single product page. Uses the product's assigned
 * WhatsApp contact (digits) for a "Chat on WhatsApp" + "Call" pair. Banex Mall is
 * the seller, so the message is framed as contacting Banex Mall — no vendor name
 * is surfaced. Renders nothing when no contact is assigned.
 */
export function ProductContactButtons({ product }: { product: GenericProduct }) {
  const digits = (product.seller?.whatsapp || "").replace(/[^\d]/g, "")
  if (!digits) return null

  const waLink = `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi Banex Mall, I'm interested in the "${product.name}" listing.`,
  )}`

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
      >
        <svg className="h-4 w-4 shrink-0" fill="currentColor" strokeWidth={2.2} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1c-41.9-42-97.7-65.1-157-65.1-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480 117.7 449.1c32.4 17.7 68.9 27 106.1 27l.1 0c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zM325.1 300.5c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6z" /></svg> Chat on WhatsApp
      </a>
      <a
        href={`tel:+${digits}`}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
      >
        <Phone className="h-4 w-4" /> Call to order
      </a>
    </div>
  )
}
