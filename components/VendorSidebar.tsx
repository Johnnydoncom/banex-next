"use client"

import Link from "next/link"
import { Star, MapPin, Bike, Store, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { vendors, sortedByProminence, type Vendor } from "@/lib/vendors"

type Props = {
  selectedSlug?: string
  onSelect?: (slug: string | undefined) => void
  filterCategory?: string
}

export function VendorSidebar({ selectedSlug, onSelect, filterCategory }: Props) {
  const [q, setQ] = useState("")
  const list = useMemo(() => {
    let v: Vendor[] = sortedByProminence
    if (filterCategory && filterCategory !== "all") {
      v = v.filter((x) => x.categories.includes(filterCategory))
    }
    if (q.trim()) {
      const s = q.toLowerCase()
      v = v.filter((x) => x.name.toLowerCase().includes(s) || x.tagline.toLowerCase().includes(s))
    }
    return v
  }, [q, filterCategory])

  return (
    <aside className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="inline-flex items-center gap-2 font-display text-sm font-semibold">
          <Store className="h-4 w-4 text-brand" /> Mall vendors
        </p>
        <Link href="/vendors" className="text-[11px] font-medium text-brand hover:underline">
          All ({vendors.length})
        </Link>
      </div>
      <div className="border-b border-border px-3 py-2.5">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendors…"
            className="h-9 w-full rounded-full border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-brand"
          />
        </label>
      </div>

      <ul className="max-h-[640px] overflow-y-auto p-2">
        <li>
          <button
            onClick={() => onSelect?.(undefined)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
              !selectedSlug ? "bg-brand-soft/30 font-medium text-brand-deep" : "text-muted-foreground hover:bg-surface"
            }`}
          >
            <span>All vendors</span>
            <span className="text-[10px]">{list.length}</span>
          </button>
        </li>
        {list.map((v) => {
          const active = selectedSlug === v.slug
          return (
            <li key={v.id}>
              <button
                onClick={() => onSelect?.(v.slug)}
                className={`mt-1 flex w-full items-start gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                  active ? "border-brand bg-brand-soft/20" : "border-transparent hover:border-border hover:bg-surface/60"
                }`}
              >
                <div className="relative h-11 w-11 flex-none overflow-hidden rounded-lg">
                  <img src={v.avatar} alt={v.name} className="h-full w-full object-cover" loading="lazy" />
                  {v.tier === "Anchor" && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-gradient-brand px-1 text-[8px] font-bold text-primary-foreground">★</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-xs font-semibold text-foreground">
                    {v.name}
                    <span className={`h-1.5 w-1.5 flex-none rounded-full ${v.openNow ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-brand text-brand" /> {v.rating}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" /> {v.stall}
                    </span>
                    {v.deliveryMins > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Bike className="h-2.5 w-2.5" /> {v.deliveryMins}m
                      </span>
                    )}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
