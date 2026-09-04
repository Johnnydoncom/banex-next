"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Eye, Users, Package, Store, RefreshCcw, TrendingUp, ImageOff, Loader2,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { AdminStatCard } from "@/components/AdminShell"
import { useAdminAnalyticsViews } from "@/hooks/use-swr-data"
import { formatNaira, saleInfo } from "@/lib/products"
import { Button } from "@/components/ui/button"

// Local YYYY-MM-DD (avoids UTC shifting the day).
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return ymd(d)
}

const PRESETS = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
] as const

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" })
}

export default function AdminAnalyticsPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken as string | undefined

  const [preset, setPreset] = useState<string>("30")
  const [from, setFrom] = useState<string>(daysAgo(30))
  const [to, setTo] = useState<string>(ymd(new Date()))

  const { data, loading, mutate } = useAdminAnalyticsViews(token, from, to)

  const applyPreset = (days: number, key: string) => {
    setPreset(key)
    setFrom(daysAgo(days))
    setTo(ymd(new Date()))
  }

  const chartData = useMemo(
    () => (data?.views_by_day ?? []).map((d) => ({ ...d, label: shortDate(d.date) })),
    [data?.views_by_day],
  )
  const peak = useMemo(() => Math.max(1, ...chartData.map((d) => d.views)), [chartData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Product & storefront views
            {data?.period ? ` · ${shortDate(data.period.from)} – ${shortDate(data.period.to)}` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => mutate()}
          className="h-auto gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Date range controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              type="button"
              variant="ghost"
              onClick={() => applyPreset(p.days, p.key)}
              className={`h-auto rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                preset === p.key ? "bg-gradient-brand text-primary-foreground shadow-brand" : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-muted-foreground">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => { setFrom(e.target.value); setPreset("custom") }}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:border-brand focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            To
            <input
              type="date"
              value={to}
              min={from}
              max={ymd(new Date())}
              onChange={(e) => { setTo(e.target.value); setPreset("custom") }}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:border-brand focus:outline-none"
            />
          </label>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        <>
          {/* KPI tiles */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Total Views" value={(data?.totals.views ?? 0).toLocaleString()} icon={Eye} accent="brand" />
            <AdminStatCard label="Unique Visitors" value={(data?.totals.unique_visitors ?? 0).toLocaleString()} icon={Users} accent="emerald" />
            <AdminStatCard label="Products Viewed" value={(data?.totals.unique_products ?? 0).toLocaleString()} icon={Package} accent="amber" />
            <AdminStatCard label="Sellers Viewed" value={(data?.totals.unique_sellers ?? 0).toLocaleString()} icon={Store} accent="rose" />
          </section>

          {/* Views over time */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />
              <h2 className="font-display text-sm font-semibold">Views over time</h2>
            </div>
            {chartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No views in this period.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand, #6366f1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-brand, #6366f1)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" tickLine={false} axisLine={false} width={36} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
                      labelStyle={{ fontWeight: 600 }}
                      formatter={(v: any) => [`${v} views`, ""]}
                    />
                    <Area type="monotone" dataKey="views" stroke="var(--color-brand, #6366f1)" strokeWidth={2} fill="url(#viewsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Top products + sellers */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Most viewed products */}
            <section className="rounded-2xl border border-border bg-card lg:col-span-2">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-display text-sm font-semibold">Most viewed products</h2>
              </div>
              {(data?.most_viewed_products?.length ?? 0) === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No product views yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data!.most_viewed_products.map((p, i) => {
                    const img = p.images?.find((x) => x.is_primary)?.url ?? p.images?.[0]?.url
                    const s = saleInfo(p)
                    return (
                      <li key={p.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface/20">
                        <span className="w-4 flex-none text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                        <div className="relative h-11 w-11 flex-none overflow-hidden rounded-lg border border-border bg-surface">
                          {img ? (
                            <img src={img} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/product/${p.slug}`} target="_blank" className="line-clamp-1 text-sm font-medium hover:text-brand hover:underline">
                            {p.name}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{formatNaira(p.price)}</span>
                            {s.onSale && <span className="text-muted-foreground line-through">{formatNaira(s.original!)}</span>}
                            <span>· {p.category?.name ?? "—"}</span>
                          </p>
                        </div>
                        <span className="inline-flex flex-none items-center gap-1 rounded-full bg-brand-soft/20 px-2.5 py-1 text-xs font-bold text-brand-deep">
                          <Eye className="h-3 w-3" /> {p.views}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* Most viewed sellers */}
            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-display text-sm font-semibold">Most viewed sellers</h2>
              </div>
              {(data?.most_viewed_sellers?.length ?? 0) === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No seller views yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data!.most_viewed_sellers.map((sv, i) => (
                    <li key={sv.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface/20">
                      <span className="w-4 flex-none text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-brand/15 to-brand/5 text-brand">
                        <Store className="h-4 w-4" />
                      </div>
                      <Link href={`/admin/users/sellers/${sv.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand hover:underline">
                        {sv.shop_name}
                      </Link>
                      <span className="inline-flex flex-none items-center gap-1 rounded-full bg-brand-soft/20 px-2.5 py-1 text-xs font-bold text-brand-deep">
                        <Eye className="h-3 w-3" /> {sv.views}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
