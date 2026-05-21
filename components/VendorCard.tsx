"use client"

import Link from "next/link"
import { Star, Clock, MapPin, BadgeCheck, Bike } from "lucide-react"
import { motion } from "framer-motion"
import type { Vendor } from "@/lib/vendors"
import { formatNaira } from "@/lib/products"

export function VendorCard({ vendor, index = 0, compact = false }: { vendor: Vendor; index?: number; compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link
        href={`/vendor/${vendor.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-soft"
      >
        <div className={`relative overflow-hidden ${compact ? "h-28" : "h-36"}`}>
          <img src={vendor.banner} alt={vendor.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          {vendor.tier === "Anchor" && (
            <span className="absolute left-3 top-3 rounded-full bg-gradient-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-soft">
              ★ Anchor tenant
            </span>
          )}
          {vendor.tier === "Premium" && (
            <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-deep backdrop-blur">
              Premium
            </span>
          )}
          <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${vendor.openNow ? "bg-emerald-500/90 text-white" : "bg-card/90 text-muted-foreground"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${vendor.openNow ? "bg-white" : "bg-muted-foreground"}`} />
            {vendor.openNow ? "Open now" : "Closed"}
          </span>
          <div className="absolute inset-x-3 bottom-2 text-white">
            <p className="font-display text-base font-bold leading-tight drop-shadow">{vendor.name}</p>
            <p className="line-clamp-1 text-[11px] opacity-90">{vendor.tagline}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Star className="h-3 w-3 fill-brand text-brand" /> {vendor.rating}
            <span className="text-muted-foreground">({vendor.reviews})</span>
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3 text-brand" /> {vendor.floor} · {vendor.stall}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 bg-surface/40 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bike className="h-3 w-3 text-brand" /> {vendor.deliveryMins ? `${vendor.deliveryMins} min` : "Visit"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {vendor.riderFee ? formatNaira(vendor.riderFee) : "—"}
          </span>
          {vendor.verified && (
            <span className="inline-flex items-center gap-1 text-brand-deep">
              <BadgeCheck className="h-3 w-3" /> KYC
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
