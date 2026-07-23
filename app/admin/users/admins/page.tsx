"use client"

import { useEffect, useState } from "react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { Shield, ShieldAlert, Key, Loader2 } from "lucide-react"
import { type AdminUser } from "@/lib/admin-api"
import { useAuth } from "@/hooks/use-auth"
import { useAdminUsers } from "@/hooks/use-swr-data"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminStaffPage() {
  const { session, user } = useAuth()
  const token = (session as any)?.accessToken
  const { users, loading } = useAdminUsers(token)
  const admins = users.filter((u) => u.type === "admin")

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "Staff Member",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            {/* If we had specific admin roles, we could distinguish here. For now, use a generic shield */}
             <Shield className="h-4 w-4" />
          </div>
          <div>
            <Link href={`/admin/users/${a.id}`} className="font-medium text-brand hover:underline">
              {a.full_name || "Unknown"} {(user as any)?.id === a.id ? "(You)" : ""}
            </Link>
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
          {a.type}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (a) => <StatusBadge status={a.status ?? (a.is_suspended || a.suspended_at ? "suspended" : a.email_verified_at ? "active" : "pending")} />,
    },
    {
      key: "created_at",
      label: "Joined",
      sortable: true,
      render: (a) => <span className="text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at.item).toLocaleDateString() : "Unknown"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
           <Link href={`/admin/users/${a.id}`} className="text-xs font-medium text-brand hover:underline">
             View
           </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading administrators...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={admins}
          rowKey={(a) => a.id}
          searchPlaceholder="Search staff by name or email…"
          searchFilter={(a, q) =>
            (a.full_name || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)
          }
          pageSize={10}
        />
      )}
    </div>
  )
}
