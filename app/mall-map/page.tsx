"use client"

import Link from "next/link"
import { useState } from "react"
import { Navigation, Bike, Store } from "lucide-react"
import { PageShell } from "@/components/PageShell"
import { vendors, FLOORS, type Vendor } from "@/lib/vendors"

export default function MallMapPage() {
  const [floor, setFloor] = useState<typeof FLOORS[number]>("Ground")
  const [active, setActive] = useState<Vendor | null>(null)
  const onFloor = vendors.filter((v) => v.floor === floor)

  return (
    <PageShell
      eyebrow="Visit the mall"
      title="Mall map & shop locator"
      description="Banex Mall is a real, physical mall in Abuja. Tap any pin to see the shop, opening hours and how to get there. You can also order rider delivery from any tenant — same-hour across the city."
    >
      <div className="flex flex-wrap gap-2">
        {FLOORS.map((f) => (
          <button
            key={f}
            onClick={() => { setFloor(f); setActive(null) }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              floor === f ? "bg-gradient-brand text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:border-brand hover:text-brand"
            }`}
          >
            {f} floor
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Map */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <div
            className="relative w-full aspect-[4/3]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "8% 8%",
              backgroundColor: "var(--color-surface)",
            }}
          >
            {/* Mall outline */}
            <div className="pointer-events-none absolute inset-4 rounded-3xl border-2 border-dashed border-brand/40" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-brand bg-brand-soft/30 px-4 py-2 text-xs font-semibold text-brand-deep">
              Atrium · {floor} floor
            </div>

            {onFloor.map((v) => {
              const isActive = active?.id === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => setActive(v)}
                  style={{ left: `${v.map.x}%`, top: `${v.map.y}%` }}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <span className={`relative flex items-center justify-center rounded-full border-2 transition-all ${
                    isActive
                      ? "h-10 w-10 border-brand-deep bg-gradient-brand shadow-brand"
                      : "h-7 w-7 border-brand bg-card hover:scale-110"
                  }`}>
                    <Store className={`h-3.5 w-3.5 ${isActive ? "text-primary-foreground" : "text-brand-deep"}`} />
                    {v.tier === "Anchor" && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-amber-400 px-1 text-[8px] font-bold text-amber-950">★</span>
                    )}
                  </span>
                  <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
                    {v.name}
                  </span>
                </button>
              )
            })}
            {onFloor.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No tenants on this floor yet.
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border bg-surface/60 px-4 py-2 text-[11px] text-muted-foreground">
            <span>{onFloor.length} shops on {floor} floor</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand" /> Open
              <span className="ml-3 inline-flex h-2 w-2 items-center justify-center rounded-full bg-amber-400 text-[7px] text-amber-950">★</span> Anchor tenant
            </span>
          </div>
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl border border-border bg-card p-5">
          {active ? (
            <div>
              <img src={active.banner} alt={active.name} className="h-32 w-full rounded-xl object-cover" />
              <p className="mt-3 font-display text-xl font-bold">{active.name}</p>
              <p className="text-sm text-muted-foreground">{active.tagline}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Stall" value={`${active.floor} · ${active.stall}`} />
                <Row label="Hours" value={active.hours} />
                <Row label="Status" value={active.openNow ? "Open now" : "Closed"} />
                <Row label="Rider ETA" value={active.deliveryMins ? `${active.deliveryMins} min` : "Visit only"} />
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/vendor/${active.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  <Bike className="h-3.5 w-3.5" /> Order online
                </Link>
                <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:border-brand hover:text-brand">
                  <Navigation className="h-3.5 w-3.5" /> Directions in-mall
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p className="font-display text-base font-semibold text-foreground">Tap a shop on the map</p>
              <p className="mt-2">Pins show every tenant on the {floor} floor. Anchor tenants are marked with a ★.</p>
              <p className="mt-4 text-xs">
                Looking for something specific? <Link href="/vendors" className="text-brand hover:underline">Open the vendor directory</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}
