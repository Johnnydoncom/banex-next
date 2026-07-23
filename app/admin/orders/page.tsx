"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { type AdminOrder } from "@/lib/admin-api"
import { useAdminOrders } from "@/hooks/use-swr-data"

const prettify = (s: string) => s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export default function AdminOrdersPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [tab, setTab] = useState<string>("all")

  const { orders, loading } = useAdminOrders(token)

  const filtered = orders.filter((o) => {
    if (tab === "all") return true
    return o.status === tab
  })

  // Build status tabs dynamically from the statuses actually present in the data.
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.status) acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "All", count: orders.length },
    ...Object.keys(statusCounts)
      .sort()
      .map((s) => ({ key: s, label: prettify(s), count: statusCounts[s] })),
  ]

  const columns: Column<AdminOrder>[] = [
    {
      key: "reference",
      label: "Order",
      sortable: true,
      render: (o) => (
        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">
          {o.reference}
        </Link>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (o) => (
        <div>
          <p className="text-sm">{o.user?.name || "Unknown"}</p>
          <p className="text-[11px] text-muted-foreground">{o.user?.email}</p>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (o) => {
        const d = new Date(o.created_at?.item || Date.now())
        return (
          <div>
            <p className="text-sm">{d.toLocaleDateString()}</p>
            <p className="text-[11px] text-muted-foreground">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        )
      },
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (o) => (
        <div>
          <p className="text-sm font-semibold">₦{o.summary?.total?.toLocaleString() ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">{o.item_count ?? 0} item{o.item_count === 1 ? "" : "s"}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (o) => (
        <div className="flex items-center justify-end">
          <Link href={`/admin/orders/${o.id}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground" title="View">
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor and manage all marketplace orders.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-surface/60 p-1">
        {tabs.map((t) => (
          <Button type="button" variant="ghost" key={t.key} onClick={() => setTab(t.key)} className={`h-auto flex-1 min-w-[80px] rounded-lg px-3 py-2 text-xs font-semibold ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            {t.count > 0 && <span className="ml-1.5 rounded-full bg-border/50 px-1.5 py-0.5 text-[10px] text-foreground">{t.count}</span>}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />)}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(o) => o.id}
          searchPlaceholder="Search by order ref or customer…"
          searchFilter={(o, q) => o.reference?.toLowerCase().includes(q) || (o.user?.name || "").toLowerCase().includes(q) || (o.user?.email || "").toLowerCase().includes(q)}
          pageSize={15}
        />
      )}
    </div>
  )
}
