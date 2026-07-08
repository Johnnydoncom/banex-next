"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  DollarSign, Package, TrendingUp, Star, ArrowRight,
  Store, Plus, CheckCircle2, XCircle, Clock, ShoppingBag
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { StatCard } from "@/components/DashboardLayout"
import { sellerFetchApplication, sellerFetchOrders, type SellerProfile, type SellerOrder } from "@/lib/seller-api"
import { userFetchWallet } from "@/lib/user-api"
import { formatNaira } from "@/lib/products"

function statusConfig(status: string) {
  switch (status) {
    case "accepted": return { label: "Accepted", cls: "bg-emerald-500/15 text-emerald-700" }
    case "paid": return { label: "Pending Action", cls: "bg-amber-500/15 text-amber-700" }
    case "declined": return { label: "Declined", cls: "bg-rose-500/15 text-rose-700" }
    case "delivered": return { label: "Delivered", cls: "bg-blue-500/15 text-blue-700" }
    default: return { label: status, cls: "bg-surface text-muted-foreground" }
  }
}

function orderDate(val: { item: string } | string | undefined) {
  if (!val) return ""
  const raw = typeof val === "string" ? val : val.item
  return new Date(raw).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
}

export default function VendorOverview() {
  const { user, session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function load() {
      try {
        const [prof, ordersRes, walletRes] = await Promise.all([
          sellerFetchApplication(token!),
          sellerFetchOrders(token!),
          userFetchWallet().catch(() => null),
        ])
        if (cancelled) return
        setProfile(prof)
        setOrders(ordersRes.orders || [])
        setWalletBalance(walletRes?.wallet?.balance ?? null)
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  // Derived stats from real data
  const totalRevenue = orders.reduce((sum, o) => sum + (o.lines_summary?.subtotal ?? 0), 0)
  const pendingCount = orders.filter(o => o.items?.some(i => i.status === "paid")).length
  const recentOrders = orders.slice(0, 5)

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-emerald-500/10 via-card to-card p-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile ? profile.shop_name : "Your store"} · {profile?.store_location ?? ""}
          </p>
          {profile?.status === "pending" && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock className="h-3 w-3" /> Application under review
            </span>
          )}
          {profile?.status === "approved" && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Approved seller
            </span>
          )}
          {profile?.status === "rejected" && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-700">
              <XCircle className="h-3 w-3" /> {profile.rejection_reason ?? "Application rejected"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href="/vendor-dashboard/products"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add product
          </Link>
          {profile?.slug && (
            <Link
              href={`/store/${profile.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
            >
              <Store className="h-3.5 w-3.5" /> View store
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Order Revenue"
          value={formatNaira(totalRevenue)}
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          label="Total Orders"
          value={orders.length}
          icon={Package}
          accent="brand"
        />
        <StatCard
          label="Active Products"
          value={profile?.products_count ?? 0}
          icon={TrendingUp}
          accent="amber"
        />
        <StatCard
          label="Store Rating"
          value={profile?.rating_average ? `${profile.rating_average.toFixed(1)} ★` : "No reviews"}
          icon={Star}
          accent="rose"
        />
      </section>

      {/* Wallet + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <section className="rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="font-display text-sm font-semibold">Recent Orders</p>
            <Link href="/vendor-dashboard/orders" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
              <p className="font-semibold text-sm">No orders yet</p>
              <p className="text-xs text-muted-foreground">Orders will appear here once customers purchase from your store.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => {
                const cfg = statusConfig(o.status)
                return (
                  <li key={o.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface/20 transition-colors">
                    <div>
                      <p className="font-semibold text-sm font-display">{o.reference}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.items?.length ?? 0} item{(o.items?.length ?? 0) !== 1 ? "s" : ""} · {orderDate(o.created_at as any)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${cfg.cls}`}>{cfg.label}</span>
                      <p className="font-semibold text-sm">{formatNaira(o.lines_summary?.subtotal ?? 0)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Right panel: wallet + actions */}
        <div className="space-y-4">
          {/* Wallet balance */}
          <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100/70">Wallet Balance</p>
            <p className="mt-2 font-display text-3xl font-bold">
              {walletBalance !== null ? formatNaira(walletBalance) : "—"}
            </p>
            <Link
              href="/vendor-dashboard/finances"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              Manage finances <ArrowRight className="h-3 w-3" />
            </Link>
          </section>

          {/* Pending orders alert */}
          {pendingCount > 0 && (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="font-display text-sm font-semibold text-amber-800">Action required</p>
              <p className="mt-1 text-xs text-amber-700/80">
                You have <strong>{pendingCount}</strong> order{pendingCount > 1 ? "s" : ""} waiting for acceptance.
              </p>
              <Link
                href="/vendor-dashboard/orders"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
              >
                Review orders <ArrowRight className="h-3 w-3" />
              </Link>
            </section>
          )}

          {/* Quick links */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick links</p>
            <div className="space-y-1">
              {[
                { label: "Add a new product", href: "/vendor-dashboard/products" },
                { label: "Edit store profile", href: "/vendor-dashboard/store" },
                { label: "Withdraw earnings", href: "/vendor-dashboard/finances" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-surface/40 transition-colors"
                >
                  {l.label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
