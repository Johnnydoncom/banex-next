"use client"

import { useState } from "react"
import { Search, Package, ChevronDown, ChevronUp, ImageOff, MapPin, Info } from "lucide-react"
import { VariantTags } from "@/components/VariantTags"
import { useAuth } from "@/hooks/use-auth"
import { formatNaira } from "@/lib/products"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSellerOrders } from "@/hooks/use-swr-data"

const ORDER_STATUSES = ["all", "paid", "accepted", "declined", "delivered"] as const

function itemStatusBadge(status: string) {
  switch (status) {
    case "accepted": return "bg-emerald-500/15 text-emerald-700"
    case "paid": return "bg-amber-500/15 text-amber-700"
    case "declined": return "bg-rose-500/15 text-rose-700"
    case "delivered": return "bg-blue-500/15 text-blue-700"
    default: return "bg-surface text-muted-foreground"
  }
}

function orderDate(val: { item: string } | string | undefined) {
  if (!val) return "—"
  const raw = typeof val === "string" ? val : (val as { item: string }).item
  return new Date(raw).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
}

export default function VendorOrdersPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [filter, setFilter] = useState<typeof ORDER_STATUSES[number]>("all")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)

  const { orders, pagination, loading } = useSellerOrders(token, page)
  const totalPages = pagination?.last_page ?? 1

  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "all" || o.items?.some((i) => i.status === filter) || o.status === filter
    const matchQ = !q || o.reference.toLowerCase().includes(q.toLowerCase())
    return matchStatus && matchQ
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">Track orders for your products across Banex Mall.</p>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference…"
            className="h-9 w-52 rounded-full bg-card pl-9 pr-3 text-xs"
          />
        </label>
      </div>

      {/* Read-only notice — vendors view records; Banex Mall manages fulfilment */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-300/60 bg-blue-50 px-4 py-3 text-xs text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>These are for your records. Order acceptance, fulfilment and delivery are handled centrally by the Banex Mall team.</span>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((s) => (
          <Button variant="ghost"
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${filter === s
                ? "bg-emerald-600 text-white"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
          >
            {s === "paid" ? "Awaiting Banex" : s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-display font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isExpanded = expanded === o.id
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Order header */}
                <Button variant="ghost"
                  onClick={() => setExpanded(isExpanded ? null : o.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-display font-semibold text-sm">{o.reference}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {orderDate(o.created_at as any)} · {o.fulfillment_type === "mall_pickup" ? "Mall Pickup" : "Delivery"}
                        · {o.items?.length ?? 0} item{(o.items?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-display font-bold text-sm">{formatNaira(o.lines_summary?.subtotal ?? 0)}</p>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </Button>

                {/* Expanded: order items */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {o.delivery_address && (
                      <div className="flex items-start gap-2 border-b border-border px-5 py-3 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                        <span>
                          <strong className="text-foreground">Deliver to:</strong>{" "}
                          {o.delivery_address.first_name} {o.delivery_address.last_name},{" "}
                          {o.delivery_address.street}, {o.delivery_address.city}, {o.delivery_address.state} ·{" "}
                          {o.delivery_address.phone}
                        </span>
                      </div>
                    )}

                    <ul className="divide-y divide-border">
                      {o.items?.map((item) => (
                        <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                            {item.primary_image_url ? (
                              <img src={item.primary_image_url} alt={item.product_name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground/40" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{item.product_name}</p>
                            <VariantTags attributes={item.variant_attributes} className="mt-0.5" />
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatNaira(item.unit_price)} × {item.quantity} = <strong className="text-foreground">{formatNaira(item.line_total)}</strong>
                            </p>
                            {item.decline_reason && (
                              <p className="mt-1 text-[11px] text-rose-600 italic">Reason: {item.decline_reason}</p>
                            )}
                          </div>

                          {/* Status only — no vendor actions (read-only) */}
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${itemStatusBadge(item.status)}`}>
                            {item.status === "paid" ? "Awaiting Banex" : item.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold disabled:opacity-40 hover:border-emerald-500 transition-colors"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold disabled:opacity-40 hover:border-emerald-500 transition-colors"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
