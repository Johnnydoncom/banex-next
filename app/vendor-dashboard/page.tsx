"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { DollarSign, Package, TrendingUp, Users, ArrowRight, Eye, Store } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { StatCard } from "@/components/DashboardLayout"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

type VendorStats = {
  revenue: number
  orders_count: number
  products_count: number
  views: number
  recent_orders: any[]
}

const chartData = [
  { name: "Mon", rev: 4000 },
  { name: "Tue", rev: 3000 },
  { name: "Wed", rev: 2000 },
  { name: "Thu", rev: 2780 },
  { name: "Fri", rev: 1890 },
  { name: "Sat", rev: 2390 },
  { name: "Sun", rev: 3490 },
]

export default function VendorOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<VendorStats | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    async function fetchStats() {
      try {
        const token = (user as any).accessToken
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        
        const res = await fetch(`${apiUrl}/vendor/stats`, { headers })
        const data = await res.json()
        if (cancelled) return
        setStats(data?.data || null)
      } catch (err) {}
    }
    fetchStats()
    */

    // ----- MOCK DATA -----
    setTimeout(() => {
      if (cancelled) return
      setStats({
        revenue: 1250000,
        orders_count: 48,
        products_count: 124,
        views: 3420,
        recent_orders: [
          { id: "1", order_number: "ORD-999", status: "pending", total: 45000, created_at: new Date().toISOString() },
          { id: "2", order_number: "ORD-998", status: "shipped", total: 12500, created_at: new Date(Date.now() - 3600000).toISOString() },
        ]
      })
    }, 500)

    return () => { cancelled = true }
  }, [user])

  if (!stats) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading dashboard…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-emerald-500/10 via-card to-card p-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/vendor-dashboard/products" className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700">
            <Package className="h-3.5 w-3.5" /> Add product
          </Link>
          <Link href={`/store/your-store`} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-primary-foreground">
            <Store className="h-3.5 w-3.5" /> View store
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={`₦${stats.revenue.toLocaleString()}`} icon={DollarSign} accent="emerald" />
        <StatCard label="Total Orders" value={stats.orders_count} icon={Package} accent="brand" />
        <StatCard label="Active Products" value={stats.products_count} icon={TrendingUp} accent="amber" />
        <StatCard label="Store Views" value={stats.views.toLocaleString()} icon={Eye} accent="rose" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <p className="font-display text-sm font-semibold">Revenue overview</p>
          </div>
          <div className="h-[300px] p-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₦${v}`} />
                <Tooltip />
                <Line type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="font-display text-sm font-semibold">Recent orders</p>
            <Link href="/vendor-dashboard/orders" className="text-xs font-medium text-emerald-600 hover:underline">View all</Link>
          </div>
          {stats.recent_orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No orders yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent_orders.map((o) => (
                <li key={o.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{o.order_number}</p>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">₦{o.total.toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
