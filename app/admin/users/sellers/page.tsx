"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Ban, Store, Edit } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { toggleAdminSellerApproval, toggleAdminSellerSuspension, type AdminSeller } from "@/lib/admin-api"
import { useAdminSellers } from "@/hooks/use-swr-data"

type Tab = "all" | "approved" | "pending" | "suspended"

export default function AdminSellersPage() {
  const { data: session } = useSession()
  const token = session?.accessToken as string | undefined
  const [tab, setTab] = useState<Tab>("all")

  const { sellers, loading, mutate } = useAdminSellers(token)

  const [confirmAction, setConfirmAction] = useState<{ seller: AdminSeller; action: "approval" | "suspension" } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const filtered = sellers.filter((s) => {
    if (tab === "approved") return s.status === "approved"
    if (tab === "pending") return s.status === "pending"
    if (tab === "suspended") return s.status === "suspended"
    return true
  })

  const handleAction = async () => {
    if (!confirmAction || !session?.accessToken) return
    const { seller, action } = confirmAction
    const token = session.accessToken as string
    setActionLoading(true)

    try {
      if (action === "approval") {
        await toggleAdminSellerApproval(seller.id, token)
        toast.success(seller.status === "approved" ? "Seller approval revoked" : "Seller approved")
      } else {
        await toggleAdminSellerSuspension(seller.id, token)
        toast.success(seller.status === "suspended" ? "Seller unsuspended" : "Seller suspended")
      }
      mutate()
    } catch (error: any) {
      toast.error(error.message || `Failed to update seller ${action}`)
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All Sellers", count: sellers.length },
    { key: "approved", label: "Approved", count: sellers.filter((s) => s.status === "approved").length },
    { key: "pending", label: "Pending", count: sellers.filter((s) => s.status === "pending").length },
    { key: "suspended", label: "Suspended", count: sellers.filter((s) => s.status === "suspended").length },
  ]

  const columns: Column<AdminSeller>[] = [
    {
      key: "shop_name",
      label: "Shop / Owner",
      sortable: true,
      render: (s) => (
        <div>
          <Link href={`/admin/users/sellers/${s.slug}`} className="font-semibold hover:text-brand flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5 text-emerald-500" />
            {s.shop_name}
          </Link>
          <p className="text-[11px] text-muted-foreground mt-0.5">{s.user?.full_name} ({s.user?.email})</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "location",
      label: "Location",
      render: (s) => s.location ? <span className="text-xs">{s.location}</span> : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: "products_count",
      label: "Products",
      sortable: true,
      render: (s) => <span className="text-xs font-medium">{s.products_count}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/users/sellers/${s.id}`}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
            title="Edit Seller"
          >
            <Edit className="h-3.5 w-3.5" />
          </Link>
          {(s.status === "pending" || s.status === "rejected") && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setConfirmAction({ seller: s, action: "approval" })}
              className="h-auto w-auto rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/15"
              title="Approve Seller"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          {s.status === "approved" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setConfirmAction({ seller: s, action: "suspension" })}
              className="h-auto w-auto rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-600"
              title="Suspend Seller"
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          )}
          {s.status === "suspended" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setConfirmAction({ seller: s, action: "suspension" })}
              className="h-auto w-auto rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/15"
              title="Unsuspend Seller"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-surface/60 p-1 w-full max-w-lg">
          {tabs.map((t) => (

            <Button
              type="button"
              variant="ghost"
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`h-auto flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${tab === t.key
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
            </Button>
          ))}
        </div>
        {/* <Link
          href="/admin/users/sellers/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-deep"
        >
          <Plus className="h-4 w-4" />
          Add Seller
        </Link> */}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border border-dashed">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-r-transparent"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(s) => s.id}
          searchPlaceholder="Search shop or owner name…"
          searchFilter={(s, q) =>
            s.shop_name.toLowerCase().includes(q) ||
            !!(s.user?.full_name && s.user.full_name.toLowerCase().includes(q)) ||
            !!(s.user?.email && s.user.email.toLowerCase().includes(q))
          }
          pageSize={10}
        />
      )}

      {/* Confirm dialog */}
      {(() => {
        const seller = confirmAction?.seller
        const isApproval = confirmAction?.action === "approval"
        const isApproved = seller?.status === "approved"
        const isSuspended = seller?.status === "suspended"
        const title = isApproval
          ? isApproved
            ? `Revoke approval for ${seller?.shop_name}?`
            : `Approve ${seller?.shop_name}?`
          : isSuspended
          ? `Unsuspend ${seller?.shop_name}?`
          : `Suspend ${seller?.shop_name}?`
        const description = isApproval
          ? isApproved
            ? "This vendor will move back to pending and their products will be hidden."
            : "This vendor will be activated and their products will be visible."
          : isSuspended
          ? "This seller will be reactivated and their listings shown again."
          : "This seller will be suspended and their listings hidden."
        const confirmLabel = isApproval ? (isApproved ? "Revoke" : "Approve") : isSuspended ? "Unsuspend" : "Suspend"
        const destructive = isApproval ? isApproved : !isSuspended
        return (
          <ConfirmDialog
            open={!!confirmAction}
            onOpenChange={(open) => !open && setConfirmAction(null)}
            title={title}
            description={description}
            confirmLabel={confirmLabel}
            destructive={destructive}
            onConfirm={() => handleAction()}
            loading={actionLoading}
          />
        )
      })()}
    </div>
  )
}
