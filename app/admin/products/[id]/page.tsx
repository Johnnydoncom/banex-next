"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, Check, X, Power, PowerOff, Store, Tag,
  Loader2, Edit2, ShieldCheck, AlertTriangle, Ban, RotateCcw,
  PackageCheck, Clock, TrendingUp,
} from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  fetchAdminProduct,
  approveAdminProduct,
  rejectAdminProduct,
  activateAdminProduct,
  deactivateAdminProduct,
  type AdminProduct,
} from "@/lib/admin-api"

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
          Rejection Reason{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this product is being rejected…"
          rows={4}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
        />

        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Rejecting…</>
            ) : (
              <><Ban className="h-3.5 w-3.5" /> Confirm Rejection</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status action bar ────────────────────────────────────────────────────────

function ActionBar({
  product,
  onApprove,
  onReject,
  onActivate,
  onDeactivate,
  loading,
}: {
  product: AdminProduct
  onApprove: () => void
  onReject: () => void
  onActivate: () => void
  onDeactivate: () => void
  loading: boolean
}) {
  const s = product.status

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      >
        <Edit2 className="h-3.5 w-3.5" /> Edit
      </Link>

      {/* Pending → Approve */}
      {s === "pending" && (
        <button
          onClick={onApprove}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Approve Product
        </button>
      )}

      {/* Pending → Reject */}
      {s === "pending" && (
        <button
          onClick={onReject}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-60 transition-colors"
        >
          <Ban className="h-3.5 w-3.5" /> Reject
        </button>
      )}

      {/* Active → Deactivate */}
      {s === "active" && (
        <button
          onClick={onDeactivate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" />}
          Deactivate
        </button>
      )}

      {/* Inactive / Rejected / Draft → Activate */}
      {(s === "inactive" || s === "rejected" || s === "draft") && (
        <button
          onClick={onActivate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
          {s === "rejected" ? "Override & Activate" : "Activate"}
        </button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Confirm dialog (approve / activate / deactivate)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<"approve" | "activate" | "deactivate" | null>(null)

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)

  // Image carousel index
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (session?.accessToken) loadProduct()
  }, [session?.accessToken])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const res = await fetchAdminProduct(id, session!.accessToken!)
      setProduct(res.data.product)
    } catch (err: any) {
      toast.error(err.message || "Failed to load product details")
    } finally {
      setLoading(false)
    }
  }

  const triggerConfirm = (action: "approve" | "activate" | "deactivate") => {
    setPendingAction(action)
    setConfirmDialogOpen(true)
  }

  const handleConfirmedAction = async () => {
    if (!product || !session?.accessToken || !pendingAction) return
    setActionLoading(true)
    try {
      if (pendingAction === "approve") {
        await approveAdminProduct(product.id, session.accessToken)
        setProduct((p) => p ? { ...p, status: "active" } : null)
        toast.success("Product approved successfully.")
      } else if (pendingAction === "activate") {
        await activateAdminProduct(product.id, session.accessToken)
        setProduct((p) => p ? { ...p, status: "active" } : null)
        toast.success("Product activated.")
      } else if (pendingAction === "deactivate") {
        await deactivateAdminProduct(product.id, session.accessToken)
        setProduct((p) => p ? { ...p, status: "inactive" } : null)
        toast.success("Product deactivated.")
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to ${pendingAction} product`)
    } finally {
      setActionLoading(false)
      setConfirmDialogOpen(false)
      setPendingAction(null)
    }
  }

  const handleReject = async (reason: string) => {
    if (!product || !session?.accessToken) return
    setRejectLoading(true)
    try {
      await rejectAdminProduct(product.id, session.accessToken, reason)
      setProduct((p) => p ? { ...p, status: "rejected", rejection_reason: reason || null } : null)
      toast.success("Product rejected.")
      setRejectModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to reject product")
    } finally {
      setRejectLoading(false)
    }
  }

  // Confirm dialog copy
  const confirmCopy = () => {
    if (pendingAction === "approve")
      return {
        title: `Approve "${product?.name}"?`,
        desc: "This product will become publicly visible and available for purchase.",
        label: "Approve Product",
        destructive: false,
      }
    if (pendingAction === "activate")
      return {
        title: `Activate "${product?.name}"?`,
        desc: "Buyers will be able to see and purchase this product again.",
        label: "Activate",
        destructive: false,
      }
    return {
      title: `Deactivate "${product?.name}"?`,
      desc: "This product will be hidden from buyers until reactivated.",
      label: "Deactivate",
      destructive: true,
    }
  }
  const cc = confirmCopy()

  // ── Loading / empty states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <h2 className="text-xl font-bold">Product not found</h2>
        <Link href="/admin/products" className="text-brand hover:underline">
          Return to products
        </Link>
      </div>
    )
  }

  const images =
    product.images?.length > 0
      ? product.images.sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url)
      : ["/assets/placeholder.jpg"]

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Image panel ───────────────────────────────────────────────── */}
        <div className="space-y-3 lg:col-span-1">
          {/* Main image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border">
            <Image
              src={images[imgIdx]}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`relative h-16 w-16 flex-none overflow-hidden rounded-xl border-2 transition-colors ${
                    i === imgIdx ? "border-brand" : "border-border hover:border-brand/50"
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Status banner */}
          <div
            className={`rounded-xl border px-4 py-3 ${
              product.status === "active"
                ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10"
                : product.status === "pending"
                ? "border-amber-200 bg-amber-50 dark:bg-amber-500/10"
                : product.status === "rejected"
                ? "border-rose-200 bg-rose-50 dark:bg-rose-500/10"
                : "border-border bg-surface/60"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Status
            </p>
            <StatusBadge status={product.status} />
            {product.status === "pending" && (
              <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                Awaiting your review. Approve or reject this product.
              </p>
            )}
            {product.status === "rejected" && product.rejection_reason && (
              <p className="mt-2 text-[11px] text-rose-700 dark:text-rose-400">
                <span className="font-semibold">Reason:</span> {product.rejection_reason}
              </p>
            )}
          </div>
        </div>

        {/* ── Details panel ─────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold">{product.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {product.brand && (
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {product.brand}
                    </span>
                  )}
                  {product.category && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" /> {product.category.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <ActionBar
                product={product}
                onApprove={() => triggerConfirm("approve")}
                onReject={() => setRejectModalOpen(true)}
                onActivate={() => triggerConfirm("activate")}
                onDeactivate={() => triggerConfirm("deactivate")}
                loading={actionLoading}
              />
            </div>

            {/* Key metrics */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-surface/60 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Price</p>
                <p className="mt-1 font-display text-xl font-bold">
                  {product.currency === "NGN" ? "₦" : product.currency}
                  {product.price.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-surface/60 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Reviews</p>
                <p className="mt-1 font-display text-xl font-bold">{product.reviews_count}</p>
                <p className="text-[11px] text-muted-foreground">
                  Avg: {product.rating_average ?? "N/A"}
                </p>
              </div>
              <div className="rounded-xl bg-surface/60 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Location</p>
                <p className="mt-1 text-sm font-semibold">{product.location || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Seller & category */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold">Seller Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Shop</p>
                <Link
                  href={`/admin/sellers/${product.seller?.slug || product.seller_id}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                >
                  <Store className="h-3.5 w-3.5" />
                  {product.seller?.shop_name || "Unknown"}
                </Link>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Category</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <Tag className="h-3.5 w-3.5 text-brand" />
                  {product.category?.name || "Uncategorized"}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-base font-semibold">Description</h2>
              <div
                className="mt-3 prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold">Metadata</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Product ID</p>
                <p className="mt-0.5 font-mono text-xs text-foreground break-all">{product.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-0.5 text-sm">{new Date(product.created_at.item).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Featured</p>
                <p className="mt-0.5 text-sm">{product.is_featured ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Escrow</p>
                <p className="mt-0.5 text-sm">{product.is_escrow_enabled ? "Enabled" : "Disabled"}</p>
              </div>
              {product.rejection_reason && (
                <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 p-3">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Rejection Reason</p>
                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{product.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!open) { setConfirmDialogOpen(false); setPendingAction(null) }
        }}
        title={cc.title}
        description={cc.desc}
        confirmLabel={cc.label}
        destructive={cc.destructive}
        onConfirm={handleConfirmedAction}
        loading={actionLoading}
      />

      {/* Reject modal */}
      <RejectReasonModal
        open={rejectModalOpen}
        productName={product.name}
        onConfirm={handleReject}
        onCancel={() => setRejectModalOpen(false)}
        loading={rejectLoading}
      />
    </div>
  )
}
