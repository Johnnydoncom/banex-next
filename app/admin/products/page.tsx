"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Plus, Eye, Check, X, Power, PowerOff, Loader2, Edit2,
  ChevronDown, AlertTriangle, ShieldCheck, ShieldOff, Ban
} from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  approveAdminProduct,
  rejectAdminProduct,
  activateAdminProduct,
  deactivateAdminProduct,
  type AdminProduct,
} from "@/lib/admin-api"
import { useAdminProducts } from "@/hooks/use-swr-data"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Tab = "all" | "pending" | "active" | "inactive" | "rejected" | "draft"

type ActionType = "approve" | "reject" | "activate" | "deactivate"

type PendingAction = {
  product: AdminProduct
  action: ActionType
}

// ─── Reject Reason Modal ──────────────────────────────────────────────────────

function RejectReasonModal({
  open,
  productName,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  productName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState("")

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
            <Ban className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold">Reject Product</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[280px]">{productName}</p>
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          Rejection Reason <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this product is being rejected…"
          rows={4}
          className="rounded-xl bg-surface px-3.5 py-2.5 resize-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
        />

        <div className="mt-4 flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-auto rounded-xl px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="h-auto gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            {loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Rejecting…</>
            ) : (
              <><Ban className="h-3.5 w-3.5" /> Confirm Rejection</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Action Button Group ──────────────────────────────────────────────────────

function ProductActionButtons({
  product,
  onAction,
}: {
  product: AdminProduct
  onAction: (action: ActionType) => void
}) {
  const s = product.status

  return (
    <div className="flex items-center justify-end gap-1">
      {/* View */}
      <Link
        href={`/admin/products/${product.id}`}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
        title="View details"
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>

      {/* Edit */}
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-brand"
        title="Edit product"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </Link>

      {/* Approve — for pending */}
      {s === "pending" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onAction("approve")}
          className="h-auto w-auto rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/15"
          title="Approve product"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Reject — for pending */}
      {s === "pending" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onAction("reject")}
          className="h-auto w-auto rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/15"
          title="Reject product"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Activate — for inactive OR rejected */}
      {(s === "inactive" || s === "rejected" || s === "draft") && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onAction("activate")}
          className="h-auto w-auto rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/15"
          title="Activate product"
        >
          <Power className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Deactivate — for active */}
      {s === "active" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onAction("deactivate")}
          className="h-auto w-auto rounded-lg p-1.5 text-muted-foreground hover:bg-amber-500/15 hover:text-amber-600"
          title="Deactivate product"
        >
          <PowerOff className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const { data: session } = useSession()
  const token = session?.accessToken as string | undefined
  const [tab, setTab] = useState<Tab>("all")

  const { products, loading, mutate } = useAdminProducts(token)

  // Confirm dialog state (approve / activate / deactivate)
  const [confirmAction, setConfirmAction] = useState<PendingAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<AdminProduct | null>(null)
  const [rejectLoading, setRejectLoading] = useState(false)

  // Tab filtering
  const filtered = products.filter((p) => {
    if (tab === "pending") return p.status === "pending"
    if (tab === "active") return p.status === "active"
    if (tab === "inactive") return p.status === "inactive"
    if (tab === "rejected") return p.status === "rejected"
    if (tab === "draft") return p.status === "draft"
    return true
  })

  const count = (s?: string) =>
    s ? products.filter((p) => p.status === s).length : products.length

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: count() },
    { key: "pending", label: "Pending", count: count("pending") },
    { key: "active", label: "Active", count: count("active") },
    { key: "inactive", label: "Inactive", count: count("inactive") },
    { key: "rejected", label: "Rejected", count: count("rejected") },
    { key: "draft", label: "Draft", count: count("draft") },
  ]

  // ── Handle non-reject actions ──────────────────────────────────────────────
  const triggerAction = (product: AdminProduct, action: ActionType) => {
    if (action === "reject") {
      setRejectTarget(product)
    } else {
      setConfirmAction({ product, action })
    }
  }

  const handleConfirmedAction = async () => {
    if (!confirmAction || !token) return
    setActionLoading(true)
    const { product, action } = confirmAction

    try {
      if (action === "approve") {
        await approveAdminProduct(product.id, token)
      } else if (action === "activate") {
        await activateAdminProduct(product.id, token)
      } else if (action === "deactivate") {
        await deactivateAdminProduct(product.id, token)
      }
      mutate()
      toast.success(
        action === "approve"
          ? "Product approved successfully."
          : action === "activate"
            ? "Product activated successfully."
            : "Product deactivated successfully."
      )
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} product`)
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  // ── Handle reject action ───────────────────────────────────────────────────
  const handleReject = async (reason: string) => {
    if (!rejectTarget || !token) return
    try {
      setRejectLoading(true)
      await rejectAdminProduct(rejectTarget.id, token, reason)
      mutate()
      toast.success("Product rejected successfully.")
      setRejectTarget(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to reject product")
    } finally {
      setRejectLoading(false)
    }
  }



  // ── Confirm dialog config ──────────────────────────────────────────────────
  const confirmConfig = () => {
    if (!confirmAction) return { title: "", description: "", label: "", destructive: false }
    const { product, action } = confirmAction
    if (action === "approve")
      return {
        title: `Approve "${product.name}"?`,
        description: "This product will become visible to buyers on the marketplace.",
        label: "Approve",
        destructive: false,
      }
    if (action === "activate")
      return {
        title: `Activate "${product.name}"?`,
        description: "This product will become visible and purchasable again.",
        label: "Activate",
        destructive: false,
      }
    return {
      title: `Deactivate "${product.name}"?`,
      description: "Buyers won't be able to see or purchase this product until it's reactivated.",
      label: "Deactivate",
      destructive: true,
    }
  }

  const cfg = confirmConfig()

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: Column<AdminProduct>[] = [
    {
      key: "name",
      label: "Product",
      sortable: true,
      render: (p) => {
        const img =
          p.images?.find((i) => i.is_primary)?.url ||
          p.images?.[0]?.url ||
          "/assets/placeholder.jpg"
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-none overflow-hidden rounded-xl border border-border">
              <Image src={img} alt={p.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/products/${p.id}`}
                className="truncate text-sm font-semibold hover:text-brand"
              >
                {p.name}
              </Link>
              <p className="text-[11px] text-muted-foreground">
                {p.category?.name || "Uncategorized"} · {p.seller?.shop_name || "—"}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (p) => (
        <span className="text-sm font-semibold">
          {p.currency === "NGN" ? "₦" : p.currency}
          {p.price.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "createdAt",
      label: "Added",
      sortable: true,
      render: (p) => (
        <span className="text-xs text-muted-foreground">
          {new Date(p.created_at.item).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (p) => (
        <ProductActionButtons product={p} onAction={(action) => triggerAction(p, action)} />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all marketplace products — approve, reject, activate or deactivate.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-brand"
        >
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Link>
      </div>

      {/* Action legend */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15">
            <Check className="h-3 w-3 text-emerald-600" />
          </span>
          Approve pending
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-rose-500/15">
            <Ban className="h-3 w-3 text-rose-600" />
          </span>
          Reject with reason
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15">
            <Power className="h-3 w-3 text-emerald-600" />
          </span>
          Activate inactive / rejected
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/15">
            <PowerOff className="h-3 w-3 text-amber-600" />
          </span>
          Deactivate live product
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-surface/60 p-1">
        {tabs.map((t) => (
          <Button
            type="button"
            variant="ghost"
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-auto rounded-lg px-3 py-2 text-xs font-semibold ${
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  t.key === "pending"
                    ? "bg-amber-500/20 text-amber-700"
                    : t.key === "rejected"
                    ? "bg-rose-500/15 text-rose-700"
                    : "bg-brand/15 text-brand"
                }`}
              >
                {t.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(p) => p.id}
          searchPlaceholder="Search products…"
          searchFilter={(p, q) =>
            p.name.toLowerCase().includes(q) ||
            (p.seller?.shop_name?.toLowerCase() ?? "").includes(q) ||
            (p.category?.name?.toLowerCase() ?? "").includes(q)
          }
          pageSize={10}
        />
      )}

      {/* Confirm dialog for approve / activate / deactivate */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={cfg.title}
        description={cfg.description}
        confirmLabel={cfg.label}
        destructive={cfg.destructive}
        onConfirm={handleConfirmedAction}
        loading={actionLoading}
      />

      {/* Reject reason modal */}
      <RejectReasonModal
        open={!!rejectTarget}
        productName={rejectTarget?.name ?? ""}
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
        loading={rejectLoading}
      />
    </div>
  )
}
