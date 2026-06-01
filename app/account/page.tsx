"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Package, Heart, MapPin, Wallet, ArrowRight, ShoppingBag } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { StatCard } from "@/components/DashboardLayout"

type RecentOrder = {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
}

export default function AccountOverview() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [counts, setCounts] = useState({ orders: 0, wishlist: 0, addresses: 0, spent: 0 })

  useEffect(() => {
    if (!user) return
    let cancelled = false

    // ----- ACTUAL FETCH IMPLEMENTATION (Commented out as requested) -----
    /*
    async function fetchData() {
      try {
        const token = (user as any).accessToken
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        
        const [oRes, wRes, aRes] = await Promise.all([
          fetch(`${apiUrl}/user/orders?limit=5`, { headers }),
          fetch(`${apiUrl}/user/wishlists/count`, { headers }),
          fetch(`${apiUrl}/user/addresses/count`, { headers }),
        ])
        
        if (cancelled) return
        
        const oData = await oRes.json().catch(() => ({ data: [] }))
        const wCount = await wRes.json().catch(() => ({ count: 0 }))
        const aCount = await aRes.json().catch(() => ({ count: 0 }))
        
        const list = (oData?.data ?? []) as RecentOrder[]
        setOrders(list)
        const spent = list.reduce((s, o) => s + Number(o.total || 0), 0)
        setCounts({
          orders: oData?.meta?.total ?? list.length,
          wishlist: wCount?.count ?? 0,
          addresses: aCount?.count ?? 0,
          spent,
        })
      } catch (error) {}
    }
    fetchData()
    */

    // ----- MOCK DATA IMPLEMENTATION -----
    setTimeout(() => {
      if (cancelled) return
      const list: RecentOrder[] = [
        { id: "1", order_number: "ORD-123", status: "delivered", total: 15000, created_at: new Date().toISOString() },
        { id: "2", order_number: "ORD-124", status: "shipped", total: 55000, created_at: new Date(Date.now() - 86400000).toISOString() },
      ]
      setOrders(list)
      setCounts({ orders: 12, wishlist: 5, addresses: 2, spent: 245000 })
    }, 500)

    return () => { cancelled = true }
  }, [user])

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
        <StatCard label="Total orders" value={counts.orders} icon={Package} accent="brand" />
        <StatCard label="Total spent" value={`₦${counts.spent.toLocaleString()}`} icon={Wallet} accent="emerald" />
        <StatCard label="Saved items" value={counts.wishlist} icon={Heart} accent="rose" />
        <StatCard label="Addresses" value={counts.addresses} icon={MapPin} accent="amber" />
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-display text-sm font-semibold">Recent orders</p>
          <Link href="/account/orders" className="text-xs font-medium text-brand hover:underline">See all</Link>
        </div>
        {orders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium">No orders yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Your purchases will appear here.</p>
            <Link href="/shop" className="mt-4 inline-flex rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground">
              Browse the mall
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{o.order_number}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()} · ₦{Number(o.total).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusTone(o.status)}`}>
                  {o.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function statusTone(s: string) {
  switch (s) {
    case "delivered": return "bg-emerald-500/15 text-emerald-700"
    case "shipped": return "bg-blue-500/15 text-blue-700"
    case "confirmed": return "bg-brand-soft/40 text-brand-deep"
    case "cancelled": return "bg-rose-500/15 text-rose-700"
    default: return "bg-amber-500/15 text-amber-700"
  }
}
