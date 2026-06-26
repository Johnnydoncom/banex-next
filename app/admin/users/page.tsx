"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Store, Clock, Eye, Check, X, Ban } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "sonner"

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

type User = {
  id: string
  name: string
  email: string
  role: "admin" | "vendor" | "customer"
  status: "active" | "suspended" | "pending"
  storeName?: string
  joinedAt: string
  ordersCount: number
}

const mockUsers: User[] = [
  { id: "u1", name: "Adewale Okonkwo", email: "adewale@example.com", role: "vendor", status: "active", storeName: "Goldline Mobile", joinedAt: "2025-08-12", ordersCount: 128 },
  { id: "u2", name: "Chioma Eze", email: "chioma@example.com", role: "vendor", status: "active", storeName: "Glow Cosmetics", joinedAt: "2025-09-03", ordersCount: 96 },
  { id: "u3", name: "Ibrahim Musa", email: "ibrahim@example.com", role: "customer", status: "active", joinedAt: "2025-10-15", ordersCount: 12 },
  { id: "u4", name: "Funke Adeyemi", email: "funke@example.com", role: "customer", status: "active", joinedAt: "2025-11-22", ordersCount: 8 },
  { id: "u5", name: "Lagos Fashion Hub", email: "info@lagosfashion.ng", role: "vendor", status: "pending", storeName: "Lagos Fashion Hub", joinedAt: "2026-06-20", ordersCount: 0 },
  { id: "u6", name: "TechZone NG", email: "hello@techzone.ng", role: "vendor", status: "pending", storeName: "TechZone NG", joinedAt: "2026-06-19", ordersCount: 0 },
  { id: "u7", name: "Blessing Okafor", email: "blessing@example.com", role: "customer", status: "active", joinedAt: "2026-01-05", ordersCount: 22 },
  { id: "u8", name: "Sunday Adekunle", email: "sunday@example.com", role: "customer", status: "suspended", joinedAt: "2025-12-10", ordersCount: 3 },
  { id: "u9", name: "AutoParts NG", email: "info@autoparts.ng", role: "vendor", status: "active", storeName: "AutoParts NG", joinedAt: "2026-02-14", ordersCount: 45 },
  { id: "u10", name: "Aisha Mohammed", email: "aisha@example.com", role: "customer", status: "active", joinedAt: "2026-03-08", ordersCount: 7 },
  { id: "u11", name: "CrystalBeads", email: "info@crystalbeads.ng", role: "vendor", status: "pending", storeName: "CrystalBeads Jewelry", joinedAt: "2026-06-21", ordersCount: 0 },
  { id: "u12", name: "Admin User", email: "admin@banexmall.com", role: "admin", status: "active", joinedAt: "2025-01-01", ordersCount: 0 },
]

type Tab = "all" | "vendors" | "pending"

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>("all")
  const [users, setUsers] = useState(mockUsers)
  const [confirmAction, setConfirmAction] = useState<{ user: User; action: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const filtered = users.filter((u) => {
    if (tab === "vendors") return u.role === "vendor" && u.status !== "pending"
    if (tab === "pending") return u.status === "pending"
    return true
  })

  const handleAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)

    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const token = ... // get from session
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const endpoint = `${apiUrl}/admin/sellers/${confirmAction.user.id}/${confirmAction.action}`
      await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
    } catch (err) {}
    */

    // ----- MOCK -----
    await new Promise((r) => setTimeout(r, 800))

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== confirmAction.user.id) return u
        if (confirmAction.action === "approve") return { ...u, status: "active" as const }
        if (confirmAction.action === "reject") return { ...u, status: "suspended" as const }
        if (confirmAction.action === "suspend") return { ...u, status: "suspended" as const }
        return u
      }),
    )

    toast.success(
      `${confirmAction.user.name} has been ${confirmAction.action === "approve" ? "approved" : confirmAction.action === "reject" ? "rejected" : "suspended"}.`,
    )
    setActionLoading(false)
    setConfirmAction(null)
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All Users", count: users.length },
    { key: "vendors", label: "Vendors", count: users.filter((u) => u.role === "vendor" && u.status !== "pending").length },
    { key: "pending", label: "Pending Applications", count: users.filter((u) => u.status === "pending").length },
  ]

  const columns: Column<User>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (u) => (
        <div>
          <Link href={`/admin/users/${u.id}`} className="font-semibold hover:text-brand">
            {u.name}
          </Link>
          <p className="text-[11px] text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize">
          {u.role === "vendor" ? <Store className="h-3 w-3 text-emerald-500" /> : u.role === "admin" ? <Users className="h-3 w-3 text-brand" /> : null}
          {u.role}
        </span>
      ),
    },
    {
      key: "storeName",
      label: "Store",
      render: (u) => u.storeName ? <span className="text-sm">{u.storeName}</span> : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: "joinedAt",
      label: "Joined",
      sortable: true,
      render: (u) => <span className="text-xs text-muted-foreground">{new Date(u.joinedAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/users/${u.id}`}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
            title="View"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          {u.status === "pending" && (
            <>
              <button
                onClick={() => setConfirmAction({ user: u, action: "approve" })}
                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/15"
                title="Approve"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setConfirmAction({ user: u, action: "reject" })}
                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/15"
                title="Reject"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {u.status === "active" && u.role !== "admin" && (
            <button
              onClick={() => setConfirmAction({ user: u, action: "suspend" })}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-600"
              title="Suspend"
            >
              <Ban className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Users & Vendors</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all users, vendors, and pending applications.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(u) => u.id}
        searchPlaceholder="Search by name or email…"
        searchFilter={(u, q) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        }
        pageSize={10}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.action === "approve"
            ? `Approve ${confirmAction.user.name}?`
            : confirmAction?.action === "reject"
              ? `Reject ${confirmAction?.user.name}?`
              : `Suspend ${confirmAction?.user.name}?`
        }
        description={
          confirmAction?.action === "approve"
            ? "This vendor will be activated and can start selling products."
            : confirmAction?.action === "reject"
              ? "This vendor application will be rejected."
              : "This user will be suspended and lose access."
        }
        confirmLabel={confirmAction?.action === "approve" ? "Approve" : confirmAction?.action === "reject" ? "Reject" : "Suspend"}
        destructive={confirmAction?.action !== "approve"}
        onConfirm={handleAction}
        loading={actionLoading}
      />
    </div>
  )
}
