"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search, Store, Bike, MapPin } from "lucide-react"
import { PageShell } from "@/components/PageShell"
import { VendorCard } from "@/components/VendorCard"
import { sortedByProminence, FLOORS } from "@/lib/vendors"
import { categories } from "@/lib/categories"

export default function VendorsPage() {
  const [q, setQ] = useState("")
  const [floor, setFloor] = useState<string>("all")
  const [cat, setCat] = useState<string>("all")

  const list = useMemo(() => {
    return sortedByProminence.filter((v) => {
      if (floor !== "all" && v.floor !== floor) return false
      if (cat !== "all" && !v.categories.includes(cat)) return false
      if (q.trim()) {
        const s = q.toLowerCase()
        if (!v.name.toLowerCase().includes(s) && !v.tagline.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [q, floor, cat])

  return (
    <PageShell
      eyebrow="Tenants"
      title="Banex Mall vendors"
      description="Every shop inside our physical mall — from anchor brands to neighbourhood favourites. Order in for rider delivery or visit them in-store."
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendor or category…"
            className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-brand"
          />
        </label>
        <select value={floor} onChange={(e) => setFloor(e.target.value)} className="h-11 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-brand">
          <option value="all">All floors</option>
          {FLOORS.map((f) => <option key={f} value={f}>{f} floor</option>)}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-11 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-brand">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-brand" /> {list.length} vendors</span>
        <span className="inline-flex items-center gap-1.5"><Bike className="h-3.5 w-3.5 text-brand" /> Same-hour rider delivery</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-brand" /> <Link href="/mall-map" className="hover:text-brand">View mall map</Link></span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v, i) => (
          <VendorCard key={v.id} vendor={v} index={i} />
        ))}
      </div>
      {list.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No vendors match these filters.
        </div>
      )}
    </PageShell>
  )
}
