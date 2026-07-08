"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, Download } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminOrders, type AdminOrder } from "@/lib/admin-api"
import { toast } from "sonner"

type Tab = "all" | "pending" | "processing" | "in_transit" | "delivered" | "cancelled" | "disputed"

export default function AdminOrdersPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [tab, setTab] = useState<Tab>("all")
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchAdminOrders(token)
      .then((res) => setOrders(res.data?.orders || []))
      .catch((e) => toast.error(e.message || "Failed to load orders"))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = orders.filter((o) => {
    if (tab === "all") return true
    return o.status === tab
  })

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: orders.length },
    { key: "pending", label: "Pending", count: orders.filter((o) => o.status === "pending").length },
    { key: "processing", label: "Processing", count: orders.filter((o) => o.status === "processing").length },
    { key: "in_transit", label: "In Transit", count: orders.filter((o) => o.status === "in_transit").length },
    { key: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter((o) => o.status === "cancelled").length },
    { key: "disputed", label: "Disputed", count: orders.filter((o) => o.status === "disputed").length },
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
      render: (o) => <span className="text-sm">{o.customer?.full_name || "Unknown"}</span>,
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
      key: "total_amount",
      label: "Total",
      sortable: true,
      render: (o) => (
        <div>
          <p className="text-sm font-semibold">₦{o.total_amount?.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">{o.items?.length || 0} items</p>
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
        <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-surface">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-surface/60 p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 min-w-[80px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            {t.count > 0 && <span className="ml-1.5 rounded-full bg-border/50 px-1.5 py-0.5 text-[10px] text-foreground">{t.count}</span>}
          </button>
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
          searchFilter={(o, q) => o.reference?.toLowerCase().includes(q) || o.customer?.full_name?.toLowerCase().includes(q)}
          pageSize={15}
        />
      )}
    </div>
  )
}
