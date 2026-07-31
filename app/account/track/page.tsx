"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Truck, Package, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { userFetchOrders, type OrderData } from "@/lib/user-api"
import { OrderTracker } from "@/components/OrderTracker"

export default function AccountTrackOrderPage() {
  const { user } = useAuth()
  const [inputRef, setInputRef] = useState("")
  const [activeRef, setActiveRef] = useState<string | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoadingOrders(true)

    userFetchOrders(1, 10)
      .then(({ orders }) => {
        if (cancelled) return
        setRecentOrders(orders)
        if (orders.length > 0 && !activeRef) {
          // Default to the most recent active order or just the latest order
          const active = orders.find(o => !["delivered", "cancelled", "refunded"].includes((o.status || "").toLowerCase()))
          setActiveRef(active ? active.reference : orders[0].reference)
          setInputRef(active ? active.reference : orders[0].reference)
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingOrders(false) })

    return () => { cancelled = true }
  }, [user?.id])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputRef.trim()
    if (trimmed) {
      setActiveRef(trimmed)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-deep">
          <Truck className="h-4 w-4" /> Real-time Logistics
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">Track Order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter an order reference number or choose one of your recent orders below to view live delivery & pickup progress.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={inputRef}
            onChange={(e) => setInputRef(e.target.value)}
            placeholder="Enter Order Reference (e.g., OR1782908533425398EC8CC4)"
            className="h-11 rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-medium outline-none focus:border-brand"
          />
        </div>
        <Button
          type="submit"
          disabled={!inputRef.trim()}
          className="h-11 gap-2 rounded-xl bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground"
        >
          <Truck className="h-4 w-4" /> Track Package
        </Button>
      </form>

      {/* Recent Orders Quick Select */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-brand" /> Quick Select Recent Order
        </p>
        {loadingOrders ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin text-brand" /> Loading your orders…
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recent orders found on your account.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentOrders.map((o) => {
              const isSelected = activeRef === o.reference
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setActiveRef(o.reference)
                    setInputRef(o.reference)
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all border ${
                    isSelected
                      ? "border-brand bg-brand-soft/30 text-brand-deep shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground"
                  }`}
                >
                  <span>{o.reference}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${
                    o.status === "delivered" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                  }`}>
                    {o.status}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Tracker Result */}
      {activeRef ? (
        <OrderTracker key={activeRef} reference={activeRef} />
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 font-semibold text-foreground">Select or enter an order to start tracking</p>
          <p className="mt-1 text-xs text-muted-foreground">Live step-by-step progress will be shown here.</p>
        </div>
      )}
    </div>
  )
}
