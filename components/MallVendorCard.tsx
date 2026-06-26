import Link from "next/link"
import { BadgeCheck, Bike, Clock, MapPin, Star } from "lucide-react"
import type { ApiMallVendor } from "@/lib/api-types"

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)
}

export function MallVendorCard({
  vendor,
  compact = false,
}: {
  vendor: ApiMallVendor
  compact?: boolean
}) {
  const tierLabel =
    vendor.tier === "premium" ? "Premium" : vendor.tier === "basic" ? null : null
  const isAnchor = false // API doesn't expose anchor tier yet; extend when available

  return (
    <Link
      href={`/vendor/${vendor.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-soft"
    >
      {/* Banner */}
      <div className={`relative overflow-hidden ${compact ? "h-28" : "h-36"}`}>
        {vendor.cover_image_url ? (
          <img
            src={vendor.cover_image_url}
            alt={vendor.shop_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-brand opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

        {tierLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-deep backdrop-blur">
            {tierLabel}
          </span>
        )}

        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${
            vendor.is_open ? "bg-emerald-500/90 text-white" : "bg-card/90 text-muted-foreground"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${vendor.is_open ? "bg-white" : "bg-muted-foreground"}`}
          />
          {vendor.is_open ? "Open now" : "Closed"}
        </span>

        <div className="absolute inset-x-3 bottom-2 text-white">
          <p className="font-display text-base font-bold leading-tight drop-shadow">{vendor.shop_name}</p>
          {vendor.description && (
            <p className="line-clamp-1 text-[11px] opacity-90">{vendor.description}</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs">
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <Star className="h-3 w-3 fill-brand text-brand" />
          {vendor.rating_average != null ? vendor.rating_average.toFixed(1) : "New"}
          <span className="text-muted-foreground">({vendor.reviews_count})</span>
        </span>
        {vendor.location && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3 text-brand" /> {vendor.location}
          </span>
        )}
      </div>

      {/* Delivery row */}
      <div className="flex items-center justify-between border-t border-border/60 bg-surface/40 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Bike className="h-3 w-3 text-brand" />
          {vendor.delivery_estimate_minutes ? `${vendor.delivery_estimate_minutes} min` : "Visit"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {vendor.delivery_fee ? formatNaira(vendor.delivery_fee) : "—"}
        </span>
        {vendor.is_kyc_verified && (
          <span className="inline-flex items-center gap-1 text-brand-deep">
            <BadgeCheck className="h-3 w-3" /> KYC
          </span>
        )}
      </div>
    </Link>
  )
}
