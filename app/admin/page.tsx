"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ShoppingCart,
  Users,
  Package,
  Store,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Eye,
  FolderTree,
  Layers,
  RefreshCcw,
} from "lucide-react"
import { AdminStatCard } from "@/components/AdminShell"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { type DashboardData } from "@/lib/admin-api"
import { useAdminDashboard } from "@/hooks/use-swr-data"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminOverview() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken as string | undefined
  const { data, loading, error, mutate } = useAdminDashboard(token)

  /* ── Loading state ────────────────────────────────────────────── */
  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Skeleton header */}
        <div className="h-28 animate-pulse rounded-2xl bg-card border border-border" />
        {/* Skeleton stat cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
        {/* Skeleton charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    )
  }

  /* ── Error state ──────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-16">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button
          type="button"
          onClick={() => mutate()}
          className="h-auto gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-xs font-semibold text-primary-foreground"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    )
  }

  /* ── Computed metrics ─────────────────────────────────────────── */
  const totalPendingApprovals = data.pendingSellers + data.pendingProducts
  const activeSellers = data.sellers.filter((s) => s.status === "approved").length
  const activeProducts = data.products.filter((p) => p.status === "active").length
  const totalCategories = data.categories.length

  // Category distribution — top categories by listings
  const topCategories = [...data.categories]
    .sort((a, b) => b.listings_count - a.listings_count)
    .slice(0, 6)

  // Recent sellers (sorted by most recently approved/created)
  const recentSellers = [...data.sellers]
    .sort((a, b) => {
      const aDate = a.approved_at?.item || ""
      const bDate = b.approved_at?.item || ""
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-brand/10 via-card to-card p-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time snapshot of your marketplace · {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          {totalPendingApprovals > 0 && (
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-semibold text-brand-deep transition-colors hover:bg-brand/20"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {totalPendingApprovals} pending
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => mutate()}
            className="h-auto gap-2 rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
          >
            <Package className="h-3.5 w-3.5" /> Add product
          </Link>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AdminStatCard
          label="Total Products"
          value={data.totalProducts.toLocaleString()}
          icon={Package}
          accent="brand"
          hint={`${activeProducts} active`}
        />
        <AdminStatCard
          label="Total Vendors"
          value={data.totalSellers.toLocaleString()}
          icon={Store}
          accent="emerald"
          hint={`${activeSellers} approved`}
        />
        <AdminStatCard
          label="Categories"
          value={totalCategories}
          icon={FolderTree}
          accent="amber"
          hint={`${data.totalListingsCount} total listings`}
        />
        <AdminStatCard
          label="Pending Products"
          value={data.pendingProducts}
          icon={Layers}
          accent="rose"
          hint="Needs review"
        />
        <AdminStatCard
          label="Pending Sellers"
          value={data.pendingSellers}
          icon={AlertCircle}
          accent="amber"
          hint="Needs approval"
        />
      </section>

      {/* ── Content Row: Categories + Sellers + Products ────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Distribution */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="font-display text-sm font-semibold">Category Distribution</p>
            <Link
              href="/admin/categories"
              className="text-xs font-medium text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          {topCategories.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No categories found
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {topCategories.map((cat) => (
                <li key={cat.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand/15 to-brand/0 text-brand">
                    <FolderTree className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{cat.name}</p>
                    <p className="text-[11px] text-muted-foreground">/{cat.slug}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{cat.listings_count}</p>
                    <p className="text-[10px] text-muted-foreground">listings</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Sellers */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="font-display text-sm font-semibold">Vendors</p>
            <Link
              href="/admin/users"
              className="text-xs font-medium text-brand hover:underline"
            >
              Manage
            </Link>
          </div>
          {recentSellers.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No vendors found
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentSellers.map((seller) => (
                <li key={seller.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600">
                    <Store className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{seller.shop_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {seller.user.full_name} · {seller.products_count} products
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={seller.status} />
                    {seller.store_location && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{seller.store_location}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Products */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="font-display text-sm font-semibold">Recent Products</p>
            <Link
              href="/admin/products"
              className="text-xs font-medium text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentProducts.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No products found
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentProducts.map((product) => {
                const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0]
                return (
                  <li key={product.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{product.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {product.seller.shop_name} · {timeAgo(product.created_at.item)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatNaira(product.price)}</p>
                      <StatusBadge status={product.status} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand/40 hover:shadow-soft"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-amber-500/15 p-2.5">
              <Users className="h-5 w-5 text-amber-600" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">Review Vendors</p>
              <p className="text-[11px] text-muted-foreground">
                {data.pendingSellers} applications waiting
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin/products"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand/40 hover:shadow-soft"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-brand/15 p-2.5">
              <Package className="h-5 w-5 text-brand" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">Manage Products</p>
              <p className="text-[11px] text-muted-foreground">
                {data.totalProducts} total products
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin/categories"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand/40 hover:shadow-soft"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-500/15 p-2.5">
              <Eye className="h-5 w-5 text-emerald-600" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">Categories</p>
              <p className="text-[11px] text-muted-foreground">Organize your catalog</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </div>
  )
}
