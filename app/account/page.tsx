"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Package, Heart, MapPin, Wallet, ArrowRight, ShoppingBag, ChevronRight, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { StatCard } from "@/components/DashboardLayout"
import { StatusBadge } from "@/components/StatusBadge"
import {
  userFetchOrders,
  userFetchWishlist,
  userFetchAddresses,
  type OrderData,
} from "@/lib/user-api"

import { useRoles } from "@/hooks/use-roles"
import { Store } from "lucide-react"

// Normalise the order shape coming from the list endpoint into the simpler
// RecentOrder type used for display on the dashboard overview.
type RecentOrder = {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  item_count: number
}

function toRecentOrder(o: OrderData): RecentOrder {
  const rawDate = o.created_at
  const dateStr = typeof rawDate === "string" ? rawDate : rawDate?.item ?? ""
  const total = o.summary?.total ?? o.lines_summary?.subtotal ?? 0
  const item_count = o.lines_summary?.item_count ?? o.items?.length ?? 0
  return {
    id: o.id,
    order_number: o.reference,
    status: o.status,
    total,
    created_at: dateStr,
    item_count,
  }
}

export default function AccountOverview() {
  const { user } = useAuth()
  const { isVendor } = useRoles()
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [counts, setCounts] = useState({ orders: 0, wishlist: 0, addresses: 0, spent: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    async function fetchDashboardData() {
      try {
        const [ordersResult, wishlistItems, addresses] = await Promise.all([
          userFetchOrders(1, 5),
          userFetchWishlist(),
          userFetchAddresses(),
        ])

        if (cancelled) return

        const recentOrders = (ordersResult.orders ?? []).map(toRecentOrder)
        const spent = recentOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)

        setOrders(recentOrders)
        setCounts({
          orders: ordersResult.pagination?.total ?? recentOrders.length,
          wishlist: wishlistItems.length,
          addresses: addresses.length,
          spent,
        })
      } catch (err) {
        console.error("[AccountOverview] Failed to fetch dashboard data:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDashboardData()

    return () => { cancelled = true }
  }, [user?.id])

  const name =
    ((user as any)?.name as string | undefined) ||
    ((user as any)?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Shopper"

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-gradient-to-br from-brand/10 via-card to-card p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-deep">Welcome back</p>
        <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">
          {name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your orders, saved items and delivery addresses in one place.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground">
            <ShoppingBag className="h-3.5 w-3.5" /> Continue shopping
          </Link>
          <Link href="/account/orders" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold">
            View orders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          ))
        ) : (
          <>
            <StatCard label="Total orders" value={counts.orders} icon={Package} accent="brand" />
            <StatCard label="Total spent" value={`₦${counts.spent.toLocaleString()}`} icon={Wallet} accent="emerald" />
            <StatCard label="Saved items" value={counts.wishlist} icon={Heart} accent="rose" />
            <StatCard label="Addresses" value={counts.addresses} icon={MapPin} accent="amber" />
          </>
        )}
      </section>

      {/* Vendor CTA */}
      {user && isVendor ? (
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-600/10 to-emerald-600/5 p-6">
          <div>
            <h2 className="font-display text-lg font-bold text-emerald-800">Go to Merchant Center</h2>
            <p className="mt-1 text-sm text-muted-foreground">Manage your store products, fulfill orders, and track your finances.</p>
          </div>
          <Link href="/vendor-dashboard" className="inline-flex flex-none items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-emerald-500/30 shadow-lg hover:bg-emerald-700 transition-colors">
            <Store className="h-4 w-4" /> Merchant Center
          </Link>
        </section>
      ) : user ? (
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/10 to-brand/5 p-6">
          <div>
            <h2 className="font-display text-lg font-bold">Start Selling on Banex Mall</h2>
            <p className="mt-1 text-sm text-muted-foreground">Open your store, reach thousands of customers, and grow your business today.</p>
          </div>
          <Link href="/account/become-vendor" className="inline-flex flex-none items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-brand hover:opacity-90 transition-opacity">
            Become a Vendor
          </Link>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Recent Orders ─────────────────────────────────── */}
        <section className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-surface/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
                <Package className="h-3.5 w-3.5 text-brand-deep" />
              </span>
              <p className="font-display text-sm font-semibold">Recent Orders</p>
            </div>
            <Link
              href="/account/orders"
              className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-brand"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-10 w-10 flex-none animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded-full bg-muted" />
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                </li>
              ))}
            </ul>
          ) : orders.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
                <ShoppingBag className="h-7 w-7 text-muted-foreground/50" />
              </span>
              <p className="mt-4 font-semibold">No orders yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Your purchases will show up here once you place your first order.</p>
              <Link
                href="/shop"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2 text-xs font-semibold text-primary-foreground"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> Browse the mall
              </Link>
            </div>
          ) : (
            /* Order list */
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface/60"
                  >
                    {/* Icon */}
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/15 transition-colors group-hover:bg-brand/20">
                      <Package className="h-[18px] w-[18px] text-brand-deep" />
                    </span>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold tracking-tight group-hover:text-brand transition-colors">
                        {o.order_number}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        {o.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(o.created_at).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {o.item_count > 0 && (
                          <>
                            <span className="text-muted-foreground/50">·</span>
                            <span>{o.item_count} {o.item_count === 1 ? "item" : "items"}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-none flex-col items-end gap-1.5">
                      <p className="text-sm font-bold tabular-nums">
                        ₦{Number(o.total).toLocaleString()}
                      </p>
                      <StatusBadge status={o.status} />
                    </div>

                    <ChevronRight className="h-4 w-4 flex-none text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Footer link when there are orders */}
          {!loading && orders.length > 0 && (
            <div className="border-t border-border bg-surface/30 px-5 py-3 text-center">
              <Link
                href="/account/orders"
                className="text-xs font-semibold text-brand hover:underline"
              >
                See all orders →
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="font-display text-sm font-semibold">Quick Links</p>
          </div>
          <div className="p-3">
            <Link href="/account/profile" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface">
              Account Details <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/account/addresses" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface">
              Delivery Addresses <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/account/settings" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface">
              Change Password <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/contact" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface">
              Help & Support <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
