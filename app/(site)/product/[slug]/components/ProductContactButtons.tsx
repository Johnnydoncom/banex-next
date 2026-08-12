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
        <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
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
