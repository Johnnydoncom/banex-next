"use client"

import { useState } from "react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { Shield, ShieldAlert, Key } from "lucide-react"

type AdminUser = {
  id: string
  name: string
  email: string
  role: "super_admin" | "manager" | "support"
  status: "active" | "suspended"
  lastLogin: string
}

const mockAdmins: AdminUser[] = [
  { id: "a1", name: "Super Admin", email: "admin@banexmall.com", status: "active", role: "super_admin", lastLogin: "2026-06-25T14:30:00Z" },
  { id: "a2", name: "John Manager", email: "john@banexmall.com", status: "active", role: "manager", lastLogin: "2026-06-24T09:15:00Z" },
  { id: "a3", name: "Support Agent", email: "support@banexmall.com", status: "suspended", role: "support", lastLogin: "2026-05-10T11:00:00Z" },
]

export default function AdminStaffPage() {
  const [admins, setAdmins] = useState(mockAdmins)

  const toggleStatus = (id: string) => {
    setAdmins(admins.map(a => 
      a.id === id ? { ...a, status: a.status === "active" ? "suspended" : "active" } : a
    ))
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "Staff Member",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            {a.role === "super_admin" ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </div>
          <div>
            <div className="font-medium text-foreground">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (a) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-xs font-medium capitalize">
          <Key className="h-3 w-3 text-muted-foreground" />
          {a.role.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: "lastLogin",
      label: "Last Login",
      sortable: true,
      render: (a) => <span className="text-xs text-muted-foreground">{new Date(a.lastLogin).toLocaleString()}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          {a.role !== "super_admin" && (
            <button
              onClick={() => toggleStatus(a.id)}
              className="text-xs font-medium text-brand hover:underline"
            >
              {a.status === "active" ? "Suspend" : "Activate"}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Alert Notice for Mock Data */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-600 dark:text-blue-400">
        <strong>Notice:</strong> This tab currently uses <strong>mock data</strong> while the backend endpoints for Admin accounts are in development.
      </div>
      
      <DataTable
        columns={columns}
        data={admins}
        rowKey={(a) => a.id}
        searchPlaceholder="Search staff by name or email…"
        searchFilter={(a, q) =>
          a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
        }
        pageSize={10}
      />
    </div>
  )
}
