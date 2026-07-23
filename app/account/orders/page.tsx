"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { userFetchOrders, type OrderData, type OrderPagination } from "@/lib/user-api"
import { formatNaira } from "@/lib/products"

// The API returns created_at as { item: "ISO string" } — handle both shapes
function parseDate(raw: string | { item: string } | undefined): string {
  if (!raw) return ""
  if (typeof raw === "string") return raw
  return raw.item
}

const STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const
type StatusFilter = (typeof STATUSES)[number]

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [pagination, setPagination] = useState<OrderPagination | undefined>()
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    userFetchOrders(page)
      .then(({ orders: data, pagination: pg }) => {
        if (cancelled) return
        setOrders(data)
        setPagination(pg)
      })
      .catch((err) => console.error(err))
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [user?.id, page])

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false
    if (q && !o.reference.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">Track your purchases.</p>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #"
            className="h-9 w-56 rounded-full bg-card pl-9 pr-3 text-xs focus-visible:border-brand"
          />
        </label>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            type="button"
            variant={filter === s ? "default" : "outline"}
            key={s}
            onClick={() => { setFilter(s); setPage(1) }}
            className={`h-auto rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${
              filter === s
                ? "bg-gradient-brand text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No orders found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or start shopping.</p>
          <Link href="/shop" className="mt-4 inline-flex rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground">
            Browse the mall
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const dateStr = parseDate(o.created_at)
            // Total: prefer summary.total (detail view) or lines_summary.subtotal (list view)
            const total = o.summary?.total ?? o.lines_summary?.subtotal
            return (
              <li key={o.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/40 px-5 py-3">
                  <div>
                    <p className="font-display text-sm font-semibold">{o.reference}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {dateStr ? new Date(dateStr).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusTone(o.status)}`}>
                        {o.status}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                        o.fulfillment_type === "mall_pickup" ? "bg-blue-500/15 text-blue-700" : "bg-brand-soft/20 text-brand-deep"
                      }`}>
                        {o.fulfillment_type === "mall_pickup" ? "Pickup" : "Delivery"}
                      </span>
                    </div>
                    {total !== undefined && (
                      <p className="text-sm font-bold">{formatNaira(total)}</p>
                    )}
                    <Link
                      href={`/account/orders/${o.id}`}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand"
                    >
                      View details
                    </Link>
                  </div>
                </div>

                {/* Order items */}
                <ul className="divide-y divide-border">
                  {(o.items ?? []).slice(0, 3).map((it) => (
                    <li key={it.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-surface">
                        {it.primary_image_url && (
                          <img src={it.primary_image_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{it.product_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Qty {it.quantity} · {formatNaira(it.unit_price)}
                          {it.seller_shop_name && ` · ${it.seller_shop_name}`}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{formatNaira(it.line_total)}</p>
                    </li>
                  ))}
                  {(o.items?.length ?? 0) > 3 && (
                    <li className="px-5 py-2 text-[11px] text-muted-foreground">
                      +{o.items.length - 3} more items
                    </li>
                  )}
                </ul>

                {/* Delivery address (if present) */}
                {o.delivery_address && (
                  <div className="border-t border-border px-5 py-2 text-[11px] text-muted-foreground">
                    Deliver to: {o.delivery_address.first_name} {o.delivery_address.last_name} · {o.delivery_address.street}, {o.delivery_address.city}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 w-8 rounded-full bg-card text-muted-foreground hover:border-brand hover:text-brand"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
            disabled={page === pagination.last_page}
            className="h-8 w-8 rounded-full bg-card text-muted-foreground hover:border-brand hover:text-brand"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function statusTone(s: string) {
  switch (s) {
    case "delivered": return "bg-emerald-500/15 text-emerald-700"
    case "paid":      return "bg-emerald-500/15 text-emerald-700"
    case "shipped":   return "bg-blue-500/15 text-blue-700"
    case "processing": return "bg-brand-soft/40 text-brand-deep"
    case "cancelled": return "bg-rose-500/15 text-rose-700"
    default:          return "bg-amber-500/15 text-amber-700"
  }
}
