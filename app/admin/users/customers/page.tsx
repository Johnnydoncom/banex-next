"use client"

import { useState } from "react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type AdminUser } from "@/lib/admin-api"
import { useAdminUsers } from "@/hooks/use-swr-data"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export default function AdminCustomersPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken
  const [page, setPage] = useState(1)

  const { users, pagination, loading } = useAdminUsers(token, { page })

  // All returned users have type "user" (API endpoint filters admins server-side),
  // but guard defensively anyway.
  const customers = users.filter((u) => u.type !== "admin")

  const columns: Column<AdminUser>[] = [
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
            <Link href={`/admin/users/${c.id}`} className="font-medium text-brand hover:underline">
              {c.full_name || "Unknown"}
            </Link>
            <div className="text-xs text-muted-foreground">{c.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (c) => (
        <StatusBadge
          status={
            c.status ??
            (c.is_suspended || c.suspended_at ? "suspended" : c.email_verified_at ? "active" : "pending")
          }
        />
      ),
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (c) => <span className="text-sm">{c.phone || "N/A"}</span>,
    },
    {
      key: "created_at",
      label: "Joined",
      sortable: true,
      render: (c) => (
        <span className="text-xs text-muted-foreground">
          {c.created_at?.item ? new Date(c.created_at.item).toLocaleDateString() : "Unknown"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/admin/users/${c.id}`} className="text-xs font-medium text-brand hover:underline">
            View
          </Link>
        </div>
      ),
    },
  ]

  const lastPage = pagination?.last_page ?? 1
  const total = pagination?.total ?? customers.length
  const perPage = pagination?.per_page ?? 15

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading customers...</p>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={customers}
            rowKey={(c) => c.id}
            searchPlaceholder="Search customer by name or email…"
            searchFilter={(c, q) =>
              (c.full_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)
            }
            pageSize={perPage}
          />

          {/* Server-side pagination — only show when there are multiple pages */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Page {page} of {lastPage} &mdash; {total} total customers
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-xs font-medium">
                  {page} / {lastPage}
                </span>
                <Button
                  variant="ghost"
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
