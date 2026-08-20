"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Plus, Eye, Check, X, Power, PowerOff, Loader2, Edit2,
  ChevronDown, AlertTriangle, ShieldCheck, ShieldOff, Ban, Store, Boxes, Copy, Upload
} from "lucide-react"
import { useRouter } from "next/navigation"
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
  updateAdminProductStock,
  reassignAdminProductSeller,
  duplicateAdminProduct,
  fetchAdminSellers,
  type AdminProduct,
  type AdminSeller,
} from "@/lib/admin-api"
import { useAdminProducts } from "@/hooks/use-swr-data"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("all")

  const { products, loading, mutate } = useAdminProducts(token)

  // Confirm dialog state (approve / activate / deactivate)
  const [confirmAction, setConfirmAction] = useState<PendingAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<AdminProduct | null>(null)
  const [rejectLoading, setRejectLoading] = useState(false)

  // Manage owner & stock modal (uses the dedicated reassign-seller / stock endpoints)
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [manageTarget, setManageTarget] = useState<AdminProduct | null>(null)
  const [manageStock, setManageStock] = useState("")
  const [manageSellerId, setManageSellerId] = useState("")
  const [manageSaving, setManageSaving] = useState(false)

  // Duplicate modal — the endpoint clones the source but requires a new name + image(s)
  const [dupTarget, setDupTarget] = useState<AdminProduct | null>(null)
  const [dupName, setDupName] = useState("")
  const [dupImages, setDupImages] = useState<File[]>([])
  const [dupSaving, setDupSaving] = useState(false)

  const openDuplicate = (p: AdminProduct) => {
    setDupTarget(p)
    setDupName(`${p.name} (Copy)`)
    setDupImages([])
  }

  const handleDuplicate = async () => {
    if (!token || !dupTarget) return
    if (!dupName.trim()) return toast.error("Enter a name for the duplicate.")
    if (dupImages.length === 0) return toast.error("Upload at least one image for the duplicate.")
    setDupSaving(true)
    try {
      const fd = new FormData()
      fd.append("name", dupName.trim())
      dupImages.forEach((f) => fd.append("images[]", f))
      const res = await duplicateAdminProduct(dupTarget.id, fd, token)
      toast.success("Product duplicated as a draft.")
      const newId = res.data?.product?.id
      setDupTarget(null)
      if (newId) router.push(`/admin/products/${newId}/edit`)
      else mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to duplicate product")
    } finally {
      setDupSaving(false)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchAdminSellers(token).then((r) => setSellers(r.data?.sellers || [])).catch(() => { })
  }, [token])

  const openManage = (p: AdminProduct) => {
    setManageTarget(p)
    setManageStock(String(p.stock_quantity ?? 0))
    setManageSellerId(p.seller?.id || p.seller_id || "")
  }

  const saveManage = async () => {
    if (!manageTarget || !token) return
    setManageSaving(true)
    try {
      // Reassign owner only when it changed.
      if (manageSellerId && manageSellerId !== (manageTarget.seller?.id || manageTarget.seller_id)) {
        await reassignAdminProductSeller(manageTarget.id, manageSellerId, token)
      }
      // Update stock only when it changed (variant products manage stock per-variant on the edit page).
      const newStock = parseInt(manageStock, 10)
      if (!manageTarget.has_variants && !Number.isNaN(newStock) && newStock !== manageTarget.stock_quantity) {
        await updateAdminProductStock(manageTarget.id, newStock, token)
      }
      toast.success("Product updated")
      setManageTarget(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message || "Failed to update product")
    } finally {
      setManageSaving(false)
    }
  }

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
                className="text-sm font-semibold hover:text-brand"
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
      key: "stock",
      label: "Stock",
      sortable: true,
      render: (p) => (
        <span
          className={`text-sm font-semibold ${p.stock_quantity <= 0
              ? "text-rose-600"
              : p.stock_quantity <= 5
                ? "text-amber-600"
                : "text-foreground"
            }`}
        >
          {p.stock_quantity ?? 0}
          {p.stock_quantity <= 0 && <span className="ml-1 text-[10px] font-medium">(out)</span>}
        </span>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      sortable: true,
      render: (p) =>
        p.seller ? (
          <Link
            href={`/admin/users/sellers/${p.seller.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-brand hover:underline"
          >
            <Store className="h-3.5 w-3.5" /> {p.seller.shop_name}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
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
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => openManage(p)}
            title="Manage owner & stock"
            className="h-auto w-auto rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-brand"
          >
            <Boxes className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => openDuplicate(p)}
            title="Duplicate product"
            className="h-auto w-auto rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-brand"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <ProductActionButtons product={p} onAction={(action) => triggerAction(p, action)} />
        </div>
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
            className={`h-auto rounded-lg px-3 py-2 text-xs font-semibold ${tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${t.key === "pending"
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

      {/* Manage owner & stock modal */}
      {manageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold">Manage product</h3>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{manageTarget.name}</p>

            <div className="mt-5 space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">Owner (seller)</Label>
                <Select value={manageSellerId} onValueChange={setManageSellerId}>
                  <SelectTrigger className="h-auto rounded-xl px-3 py-2.5"><SelectValue placeholder="Select seller" /></SelectTrigger>
                  <SelectContent>
                    {sellers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.shop_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">Reassigns which vendor this product belongs to.</p>
              </div>

              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground">Stock quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={manageStock}
                  onChange={(e) => setManageStock(e.target.value)}
                  disabled={manageTarget.has_variants}
                  className="rounded-xl px-3 py-2.5"
                />
                {manageTarget.has_variants && (
                  <p className="mt-1 text-[11px] text-muted-foreground">This product has variants — edit stock per variant on the product page.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                onClick={saveManage}
                disabled={manageSaving}
                className="h-auto flex-1 rounded-full bg-gradient-brand py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {manageSaving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setManageTarget(null)}
                className="h-auto flex-1 rounded-full bg-card py-2.5 text-sm font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate product modal */}
      {dupTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold"><Copy className="h-4 w-4 text-brand" /> Duplicate Product</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Clones price, category, specifications, variants and owner from “{dupTarget.name}”. Give the copy a name and upload its image(s). It's created as a draft.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">New Name</Label>
                <Input value={dupName} onChange={(e) => setDupName(e.target.value)} className="rounded-xl px-3 py-2.5" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">Images</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface py-6 transition-colors hover:border-brand hover:bg-brand-soft/20">
                  <Upload className="mb-1.5 h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {dupImages.length ? `${dupImages.length} image${dupImages.length > 1 ? "s" : ""} selected` : "Click to upload image(s)"}
                  </span>
                  <Input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setDupImages(Array.from(e.target.files || []))} />
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" onClick={handleDuplicate} disabled={dupSaving} className="h-auto flex-1 gap-2 rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-60">
                {dupSaving && <Loader2 className="h-4 w-4 animate-spin" />} Duplicate
              </Button>
              <Button type="button" variant="outline" onClick={() => setDupTarget(null)} className="h-auto flex-1 rounded-full py-2.5 text-sm font-semibold">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
