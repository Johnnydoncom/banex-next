"use client"

import { useEffect, useState } from "react"
import { Search, Package, ChevronDown, ChevronUp, CheckCircle2, XCircle, ImageOff, MapPin } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  sellerFetchOrders, sellerAcceptOrderItem, sellerDeclineOrderItem,
  type SellerOrder, type SellerOrderItem
} from "@/lib/seller-api"
import { formatNaira } from "@/lib/products"

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
  const { user, session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [filter, setFilter] = useState<typeof ORDER_STATUSES[number]>("all")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Expanded row
  const [expanded, setExpanded] = useState<string | null>(null)

  // Decline dialog
  const [declineState, setDeclineState] = useState<{ orderId: string; itemId: string } | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    sellerFetchOrders(token, page)
      .then(({ orders: o, pagination }) => {
        setOrders(o)
        setTotalPages(pagination?.last_page ?? 1)
      })
      .catch((e) => toast.error(e.message || "Failed to load orders"))
      .finally(() => setLoading(false))
  }, [token, page])

  async function handleAccept(orderId: string, itemId: string) {
    if (!token) return
    setActionLoading(itemId)
    try {
      const updated = await sellerAcceptOrderItem(orderId, itemId, token)
      if (updated) setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o))
      toast.success("Order item accepted")
    } catch (e: any) {
      toast.error(e.message || "Failed to accept")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDecline() {
    if (!token || !declineState) return
    if (!declineReason.trim()) { toast.error("Please provide a reason"); return }
    setActionLoading(declineState.itemId)
    try {
      const updated = await sellerDeclineOrderItem(declineState.orderId, declineState.itemId, declineReason, token)
      if (updated) setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o))
      setDeclineState(null)
      setDeclineReason("")
      toast.success("Order item declined")
    } catch (e: any) {
      toast.error(e.message || "Failed to decline")
    } finally {
      setActionLoading(null)
    }
  }

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
          <p className="text-sm text-muted-foreground">Manage and fulfil your customers' orders.</p>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference…"
            className="h-9 w-52 rounded-full border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === s
                ? "bg-emerald-600 text-white"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "paid" ? "Pending Action" : s}
          </button>
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
            const hasActionable = o.items?.some((i) => i.status === "paid")
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : o.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-sm">{o.reference}</p>
                        {hasActionable && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            ACTION NEEDED
                          </span>
                        )}
                      </div>
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
                </button>

                {/* Expanded: order items */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Delivery address if applicable */}
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

                    {/* Items list */}
                    <ul className="divide-y divide-border">
                      {o.items?.map((item) => (
                        <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                          {/* Product image */}
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                            {item.primary_image_url ? (
                              <img src={item.primary_image_url} alt={item.product_name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground/40" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{item.product_name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatNaira(item.unit_price)} × {item.quantity} = <strong className="text-foreground">{formatNaira(item.line_total)}</strong>
                            </p>
                            {item.decline_reason && (
                              <p className="mt-1 text-[11px] text-rose-600 italic">Reason: {item.decline_reason}</p>
                            )}
                          </div>

                          {/* Status + actions */}
                          <div className="flex flex-col items-end gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${itemStatusBadge(item.status)}`}>
                              {item.status === "paid" ? "Pending" : item.status}
                            </span>
                            {item.status === "paid" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAccept(o.id, item.id)}
                                  disabled={actionLoading === item.id}
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  {actionLoading === item.id ? "…" : "Accept"}
                                </button>
                                <button
                                  onClick={() => { setDeclineState({ orderId: o.id, itemId: item.id }); setDeclineReason("") }}
                                  disabled={actionLoading === item.id}
                                  className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-500/20 disabled:opacity-60 transition-colors"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
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
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold disabled:opacity-40 hover:border-emerald-500 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold disabled:opacity-40 hover:border-emerald-500 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Decline reason dialog */}
      {declineState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">Decline Order Item</h3>
            <p className="mt-1 text-sm text-muted-foreground">Please provide a reason for declining this item.</p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="e.g. Item is out of stock at our shop"
              className="mt-4 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-rose-500"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDecline}
                disabled={!!actionLoading}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors"
              >
                {actionLoading ? "Declining…" : "Decline Item"}
              </button>
              <button
                onClick={() => { setDeclineState(null); setDeclineReason("") }}
                className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
