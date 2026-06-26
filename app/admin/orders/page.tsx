"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, Download } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

type Order = {
  id: string
  orderNumber: string
  customer: string
  items: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  date: string
}

const mockOrders: Order[] = [
  { id: "o1", orderNumber: "ORD-1042", customer: "Adewale O.", items: 2, total: 380000, status: "pending", date: "2026-06-22T10:15:00Z" },
  { id: "o2", orderNumber: "ORD-1041", customer: "Chioma E.", items: 1, total: 750000, status: "processing", date: "2026-06-21T14:20:00Z" },
  { id: "o3", orderNumber: "ORD-1040", customer: "Ibrahim M.", items: 4, total: 120000, status: "shipped", date: "2026-06-20T09:05:00Z" },
  { id: "o4", orderNumber: "ORD-1039", customer: "Funke A.", items: 1, total: 300000, status: "delivered", date: "2026-06-18T16:45:00Z" },
  { id: "o5", orderNumber: "ORD-1038", customer: "Blessing O.", items: 3, total: 95000, status: "delivered", date: "2026-06-18T11:10:00Z" },
  { id: "o6", orderNumber: "ORD-1037", customer: "Sunday A.", items: 1, total: 45000, status: "cancelled", date: "2026-06-17T08:30:00Z" },
]

type Tab = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<Tab>("all")
  const [orders, setOrders] = useState(mockOrders)

  const filtered = orders.filter((o) => {
    if (tab === "all") return true
    return o.status === tab
  })

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: orders.length },
    { key: "pending", label: "Pending", count: orders.filter((o) => o.status === "pending").length },
    { key: "processing", label: "Processing", count: orders.filter((o) => o.status === "processing").length },
    { key: "shipped", label: "Shipped", count: orders.filter((o) => o.status === "shipped").length },
    { key: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter((o) => o.status === "cancelled").length },
  ]

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      label: "Order",
      sortable: true,
      render: (o) => (
        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">
          {o.orderNumber}
        </Link>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (o) => <span className="text-sm">{o.customer}</span>,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (o) => (
        <div>
          <p className="text-sm">{new Date(o.date).toLocaleDateString()}</p>
          <p className="text-[11px] text-muted-foreground">{new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      ),
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (o) => (
        <div>
          <p className="text-sm font-semibold">₦{o.total.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">{o.items} items</p>
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

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(o) => o.id}
        searchPlaceholder="Search by order # or customer…"
        searchFilter={(o, q) => o.orderNumber.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)}
        pageSize={15}
      />
    </div>
  )
}
