"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Package, Search } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { userFetchOrders, type OrderData } from "@/lib/user-api"

const STATUSES = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const

export default function OrdersPage() {
  const { user, session } = useAuth()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    async function fetchOrders() {
      try {
        const data = await userFetchOrders()
        if (cancelled) return
        setOrders(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchOrders()

    return () => { cancelled = true }
  }, [user])

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
          <p className="text-sm text-muted-foreground">Track your purchases and download invoices.</p>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #"
            className="h-9 w-56 rounded-full border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-brand"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === s
                ? "bg-gradient-brand text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No orders found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or start shopping.</p>
          <Link href="/shop" className="mt-4 inline-flex rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground">Browse the mall</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/40 px-5 py-3">
                <div>
                  <p className="font-display text-sm font-semibold">{o.reference}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Placed {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusTone(o.status)}`}>{o.status}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                    o.payment_status === "paid" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                  }`}>{o.payment_status}</span>
                  <p className="text-sm font-bold">₦{Number(o.total_amount).toLocaleString()}</p>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {(o.items ?? []).slice(0, 3).map((it) => (
                  <li key={it.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-surface">
                      {it.product_image && <img src={it.product_image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{it.product_name}</p>
                      <p className="text-[11px] text-muted-foreground">Qty {it.quantity} · ₦{Number(it.price).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
                {(o.items?.length ?? 0) > 3 && (
                  <li className="px-5 py-2 text-[11px] text-muted-foreground">+{o.items.length - 3} more items</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function statusTone(s: string) {
  switch (s) {
    case "delivered": return "bg-emerald-500/15 text-emerald-700"
    case "shipped": return "bg-blue-500/15 text-blue-700"
    case "processing": return "bg-brand-soft/40 text-brand-deep"
    case "cancelled": return "bg-rose-500/15 text-rose-700"
    default: return "bg-amber-500/15 text-amber-700"
  }
}
