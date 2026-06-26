"use client"

import { useState } from "react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { Users, Search, Ban, CheckCircle } from "lucide-react"

type Customer = {
  id: string
  name: string
  email: string
  status: "active" | "suspended"
  joinedAt: string
  ordersCount: number
}

const mockCustomers: Customer[] = [
  { id: "u3", name: "Ibrahim Musa", email: "ibrahim@example.com", status: "active", joinedAt: "2025-10-15", ordersCount: 12 },
  { id: "u4", name: "Funke Adeyemi", email: "funke@example.com", status: "active", joinedAt: "2025-11-22", ordersCount: 8 },
  { id: "u7", name: "Blessing Okafor", email: "blessing@example.com", status: "active", joinedAt: "2026-01-05", ordersCount: 22 },
  { id: "u8", name: "Sunday Adekunle", email: "sunday@example.com", status: "suspended", joinedAt: "2025-12-10", ordersCount: 3 },
  { id: "u10", name: "Aisha Mohammed", email: "aisha@example.com", status: "active", joinedAt: "2026-03-08", ordersCount: 7 },
]

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState(mockCustomers)

  const toggleStatus = (id: string) => {
    setCustomers(customers.map(c => 
      c.id === id ? { ...c, status: c.status === "active" ? "suspended" : "active" } : c
    ))
  }

  const columns: Column<Customer>[] = [
    {
      key: "name",
      label: "Customer",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-foreground">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "ordersCount",
      label: "Orders",
      sortable: true,
      render: (c) => <span className="text-sm font-medium">{c.ordersCount}</span>,
    },
    {
      key: "joinedAt",
      label: "Joined",
      sortable: true,
      render: (c) => <span className="text-xs text-muted-foreground">{new Date(c.joinedAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => toggleStatus(c.id)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
            title={c.status === "active" ? "Suspend Customer" : "Activate Customer"}
          >
            {c.status === "active" ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Alert Notice for Mock Data */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-600 dark:text-blue-400">
        <strong>Notice:</strong> This tab currently uses <strong>mock data</strong> while the backend endpoints for generic Customers are in development.
      </div>
      
      <DataTable
        columns={columns}
        data={customers}
        rowKey={(c) => c.id}
        searchPlaceholder="Search customer by name or email…"
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
        }
        pageSize={10}
      />
    </div>
  )
}
