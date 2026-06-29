"use client"

import { use, useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Upload, X, Loader2, Star, Check, Ban,
  Power, PowerOff, ShieldCheck, Trash2, ImagePlus, Save,
} from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  fetchAdminCategories,
  fetchAdminSellers,
  fetchAdminProduct,
  updateAdminProduct,
  approveAdminProduct,
  rejectAdminProduct,
  activateAdminProduct,
  deactivateAdminProduct,
  type AdminCategory,
  type AdminSeller,
  type AdminProduct,
} from "@/lib/admin-api"
import { RichTextEditor } from "@/components/RichTextEditor"
import { LocationSelect } from "@/components/LocationSelect"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"

// ─── Existing image entry (from server) ──────────────────────────────────────

type ExistingImage = {
  id: string
  url: string
  sort_order: number
  is_primary: boolean
  /** marked for deletion */
  toDelete?: boolean
}

// ─── New upload entry ─────────────────────────────────────────────────────────

type NewImage = {
  file: File
  preview: string
}

// ─── Reject reason modal ──────────────────────────────────────────────────────

function RejectModal({
  open,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  loading: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
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
            <p className="text-xs text-muted-foreground">Provide a reason for the seller</p>
          </div>
        </div>
        <label className="mb-1.5 block text-xs font-semibold">
          Reason <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Images are low quality, description is missing…"
          rows={4}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-surface disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
            {loading ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    category_id: "",
    seller_id: "",
    location: "Lagos",
    delivery_estimate: "3 - 5 days",
    is_nationwide_delivery: false,
    is_authentic_only: false,
    is_featured: false,
    is_escrow_enabled: false,
  })

  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ])

  // Existing images from the server
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  // New files the admin uploads
  const [newImages, setNewImages] = useState<NewImage[]>([])
  // Which slot is primary? "existing:id" or "new:idx"
  const [primaryKey, setPrimaryKey] = useState<string>("")

  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Status action states
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatusAction, setPendingStatusAction] = useState<
    "approve" | "activate" | "deactivate" | null
  >(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)

  const update = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }))

  // ── Spec helpers ───────────────────────────────────────────────────────────
  const addSpec = () =>
    setSpecifications((p) => [...p, { key: "", value: "" }])
  const removeSpec = (i: number) =>
    setSpecifications((p) => p.filter((_, idx) => idx !== i))
  const updateSpec = (i: number, field: "key" | "value", val: string) =>
    setSpecifications((p) => {
      const next = [...p]
      next[i][field] = val
      return next
    })

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session?.accessToken) loadAll(session.accessToken)
  }, [session?.accessToken])

  const loadAll = async (token: string) => {
    try {
      setLoadingData(true)
      const [catsRes, sellersRes, productRes] = await Promise.all([
        fetchAdminCategories(token),
        fetchAdminSellers(token),
        fetchAdminProduct(id, token),
      ])

      setCategories(catsRes.data?.categories ?? [])
      setSellers(sellersRes.data?.sellers ?? [])

      const p = productRes.data?.product
      if (p) {
        setProduct(p)

        setForm({
          name: p.name ?? "",
          brand: p.brand ?? "",
          description: p.description ?? "",
          price: p.price?.toString() ?? "",
          category_id: p.category_id ?? "",
          seller_id: p.seller_id ?? "",
          location: p.location ?? "Lagos",
          delivery_estimate: p.delivery_estimate ?? "3 - 5 days",
          is_nationwide_delivery: p.is_nationwide_delivery ?? false,
          is_authentic_only: p.is_authentic_only ?? false,
          is_featured: p.is_featured ?? false,
          is_escrow_enabled: p.is_escrow_enabled ?? false,
        })

        // Parse specifications: ["Storage => 512GB"]
        if (Array.isArray(p.specifications) && p.specifications.length > 0) {
          setSpecifications(
            p.specifications.map((s) => {
              const [key = "", value = ""] = s.split("=>").map((x) => x.trim())
              return { key, value }
            })
          )
        }

        // Load existing images sorted by sort_order
        const sorted = [...(p.images ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order
        )
        setExistingImages(sorted)

        // Default primary = the image marked is_primary (or first)
        const primary = sorted.find((i) => i.is_primary) ?? sorted[0]
        if (primary) setPrimaryKey(`existing:${primary.id}`)
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load product")
    } finally {
      setLoadingData(false)
    }
  }

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const totalActive = existingImages.filter((i) => !i.toDelete).length + newImages.length
    const canAdd = Math.max(0, 5 - totalActive)
    const toAdd = files.slice(0, canAdd).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setNewImages((prev) => [...prev, ...toAdd])
    // Reset input so same file can be re-selected if removed
    e.target.value = ""
  }

  const markExistingForDeletion = (imgId: string) => {
    setExistingImages((prev) =>
      prev.map((i) => (i.id === imgId ? { ...i, toDelete: true } : i))
    )
    if (primaryKey === `existing:${imgId}`) {
      // Auto-assign primary to first non-deleted existing, else first new
      const nextExisting = existingImages.find(
        (i) => !i.toDelete && i.id !== imgId
      )
      if (nextExisting) {
        setPrimaryKey(`existing:${nextExisting.id}`)
      } else if (newImages.length > 0) {
        setPrimaryKey("new:0")
      } else {
        setPrimaryKey("")
      }
    }
  }

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(newImages[idx].preview)
    setNewImages((prev) => prev.filter((_, i) => i !== idx))
    if (primaryKey === `new:${idx}`) {
      const nextNew = newImages.length > 1 ? "new:0" : ""
      setPrimaryKey(nextNew)
    }
  }

  const totalSlots =
    existingImages.filter((i) => !i.toDelete).length + newImages.length

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!session?.accessToken) return
    if (!form.name.trim()) { toast.error("Product name is required."); return }
    if (!form.price || Number(form.price) <= 0) { toast.error("Enter a valid price."); return }
    if (!form.category_id) { toast.error("Please select a category."); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("brand", form.brand)
      fd.append("description", form.description)
      fd.append("price", form.price)
      fd.append("category_id", form.category_id)
      fd.append("seller_id", form.seller_id)
      fd.append("location", form.location)
      fd.append("delivery_estimate", form.delivery_estimate)
      fd.append("is_nationwide_delivery", form.is_nationwide_delivery ? "1" : "0")
      fd.append("is_authentic_only", form.is_authentic_only ? "1" : "0")
      fd.append("is_featured", form.is_featured ? "1" : "0")
      fd.append("is_escrow_enabled", form.is_escrow_enabled ? "1" : "0")

      specifications.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          fd.append("specifications[]", `${key.trim()} => ${value.trim()}`)
        }
      })

      // New image files
      newImages.forEach((img, i) => {
        fd.append("images[]", img.file)
      })

      // IDs to delete
      existingImages
        .filter((i) => i.toDelete)
        .forEach((i) => fd.append("delete_image_ids[]", i.id))

      // Primary image: tell the backend which one is primary
      // For existing primary, send the image id; for a new upload, send its index among new images
      if (primaryKey.startsWith("existing:")) {
        fd.append("primary_image_id", primaryKey.replace("existing:", ""))
      } else if (primaryKey.startsWith("new:")) {
        const idx = parseInt(primaryKey.replace("new:", ""), 10)
        fd.append("primary_image_index", String(idx))
      }

      await updateAdminProduct(id, fd, session.accessToken)
      toast.success("Product updated successfully!")
      router.push(`/admin/products/${id}`)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update product")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Status actions ─────────────────────────────────────────────────────────
  const triggerStatusAction = (action: "approve" | "activate" | "deactivate") => {
    setPendingStatusAction(action)
    setConfirmOpen(true)
  }

  const handleStatusConfirm = async () => {
    if (!product || !session?.accessToken || !pendingStatusAction) return
    setStatusLoading(true)
    try {
      let nextStatus: AdminProduct["status"] = product.status
      if (pendingStatusAction === "approve") {
        await approveAdminProduct(product.id, session.accessToken)
        nextStatus = "active"
        toast.success("Product approved.")
      } else if (pendingStatusAction === "activate") {
        await activateAdminProduct(product.id, session.accessToken)
        nextStatus = "active"
        toast.success("Product activated.")
      } else if (pendingStatusAction === "deactivate") {
        await deactivateAdminProduct(product.id, session.accessToken)
        nextStatus = "inactive"
        toast.success("Product deactivated.")
      }
      setProduct((p) => p ? { ...p, status: nextStatus } : null)
    } catch (err: any) {
      toast.error(err.message ?? "Action failed")
    } finally {
      setStatusLoading(false)
      setConfirmOpen(false)
      setPendingStatusAction(null)
    }
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!product || !session?.accessToken) return
    setRejectLoading(true)
    try {
      await rejectAdminProduct(product.id, session.accessToken, reason)
      setProduct((p) => p ? { ...p, status: "rejected", rejection_reason: reason || null } : null)
      toast.success("Product rejected.")
      setRejectOpen(false)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reject product")
    } finally {
      setRejectLoading(false)
    }
  }

  // ── Confirm dialog copy ────────────────────────────────────────────────────
  const confirmCopy = (() => {
    if (pendingStatusAction === "approve")
      return { title: "Approve this product?", desc: "It will become publicly visible.", label: "Approve", destructive: false }
    if (pendingStatusAction === "activate")
      return { title: "Activate this product?", desc: "Buyers will be able to see and purchase it.", label: "Activate", destructive: false }
    return { title: "Deactivate this product?", desc: "It will be hidden from buyers.", label: "Deactivate", destructive: true }
  })()

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-xl font-bold">Product not found</p>
        <Link href="/admin/products" className="text-brand hover:underline">
          Back to products
        </Link>
      </div>
    )
  }

  const activeExisting = existingImages.filter((i) => !i.toDelete)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/products/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Edit Product</h1>
            <p className="mt-0.5 text-sm text-muted-foreground truncate max-w-xs">
              {product.name}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-brand disabled:opacity-60"
        >
          {submitting ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
          ) : (
            <><Save className="h-3.5 w-3.5" /> Save Changes</>
          )}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column: images + status ──────────────────────────────── */}
        <div className="space-y-6 lg:col-span-1">

          {/* Status Card */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-semibold">Product Status</h2>
              <StatusBadge status={product.status} />
            </div>

            <div className="space-y-2">
              {/* Approve — pending only */}
              {product.status === "pending" && (
                <button
                  onClick={() => triggerStatusAction("approve")}
                  disabled={statusLoading}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Approve Product</span>
                </button>
              )}

              {/* Reject — pending only */}
              {product.status === "pending" && (
                <button
                  onClick={() => setRejectOpen(true)}
                  disabled={statusLoading}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-60 transition-colors"
                >
                  <Ban className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              )}

              {/* Activate — inactive / rejected / draft */}
              {(product.status === "inactive" ||
                product.status === "rejected" ||
                product.status === "draft") && (
                <button
                  onClick={() => triggerStatusAction("activate")}
                  disabled={statusLoading}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  <Power className="h-4 w-4" />
                  <span>
                    {product.status === "rejected" ? "Override & Activate" : "Activate"}
                  </span>
                </button>
              )}

              {/* Deactivate — active only */}
              {product.status === "active" && (
                <button
                  onClick={() => triggerStatusAction("deactivate")}
                  disabled={statusLoading}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-60 transition-colors"
                >
                  <PowerOff className="h-4 w-4" />
                  <span>Deactivate</span>
                </button>
              )}

              {(product.status === "active") && (
                <p className="text-[11px] text-muted-foreground pt-1 pl-1">
                  Product is currently live on the marketplace.
                </p>
              )}
              {product.status === "pending" && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 pt-1 pl-1">
                  Awaiting admin review before going live.
                </p>
              )}
              {product.status === "rejected" && product.rejection_reason && (
                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 p-3">
                  <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                    Rejection reason:
                  </p>
                  <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">
                    {product.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Images Card */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-semibold">Images</h2>
              <span className="text-[11px] text-muted-foreground">
                {totalSlots} / 5
              </span>
            </div>

            <div className="space-y-2">
              {/* Existing images from server */}
              {activeExisting.map((img) => {
                const isThisPrimary = primaryKey === `existing:${img.id}`
                return (
                  <div
                    key={img.id}
                    className={`group relative flex items-center gap-3 rounded-xl border-2 p-2 transition-colors ${
                      isThisPrimary
                        ? "border-brand bg-brand/5"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg">
                      <Image
                        src={img.url}
                        alt="product image"
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      {isThisPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                          <Star className="h-2.5 w-2.5" fill="currentColor" />
                          Primary
                        </span>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                        {img.url.split("/").pop()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!isThisPrimary && (
                        <button
                          onClick={() => setPrimaryKey(`existing:${img.id}`)}
                          title="Set as primary"
                          className="rounded-lg p-1 text-muted-foreground hover:text-brand hover:bg-brand/10"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => markExistingForDeletion(img.id)}
                        title="Remove image"
                        className="rounded-lg p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* New uploaded images */}
              {newImages.map((img, idx) => {
                const key = `new:${idx}`
                const isThisPrimary = primaryKey === key
                return (
                  <div
                    key={idx}
                    className={`group relative flex items-center gap-3 rounded-xl border-2 p-2 transition-colors ${
                      isThisPrimary
                        ? "border-brand bg-brand/5"
                        : "border-dashed border-border hover:border-brand/40"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg">
                      <img
                        src={img.preview}
                        alt="new upload"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      {isThisPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                          <Star className="h-2.5 w-2.5" fill="currentColor" />
                          Primary
                        </span>
                      )}
                      <p className="mt-0.5 text-[11px] text-emerald-600 font-medium">New upload</p>
                      <p className="text-[11px] text-muted-foreground truncate">{img.file.name}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!isThisPrimary && (
                        <button
                          onClick={() => setPrimaryKey(key)}
                          title="Set as primary"
                          className="rounded-lg p-1 text-muted-foreground hover:text-brand hover:bg-brand/10"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => removeNewImage(idx)}
                        title="Remove image"
                        className="rounded-lg p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Upload button */}
              {totalSlots < 5 && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border p-3 text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Add images</p>
                    <p className="text-[11px]">{5 - totalSlots} slot(s) remaining</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: all form fields ─────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Basic info */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. iPhone 16 Pro Max"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => update("brand", e.target.value)}
                    placeholder="e.g. Apple"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => update("description", val)}
                  placeholder="Describe the product in detail…"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => update("category_id", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Seller
                  </label>
                  <select
                    value={form.seller_id}
                    onChange={(e) => update("seller_id", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value="">Assign to seller</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shop_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Logistics */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4">Pricing & Logistics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Price (₦) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  placeholder="350000"
                  min="0"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Delivery Estimate
                </label>
                <input
                  type="text"
                  value={form.delivery_estimate}
                  onChange={(e) => update("delivery_estimate", e.target.value)}
                  placeholder="e.g. 3 - 5 days"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Location
                </label>
                <LocationSelect
                  value={form.location}
                  onChange={(val) => update("location", val)}
                  placeholder="Select state…"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 pt-4 border-t border-border">
              {(
                [
                  ["is_nationwide_delivery", "Nationwide Delivery"],
                  ["is_authentic_only", "Authentic Only"],
                  ["is_featured", "Featured Product"],
                  ["is_escrow_enabled", "Escrow Enabled"],
                ] as [keyof typeof form, string][]
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface/60 transition-colors"
                >
                  <div
                    onClick={() => update(key, !form[key])}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      form[key] ? "bg-brand" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        form[key] ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4">Specifications</h2>
            <div className="space-y-2">
              {specifications.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => updateSpec(i, "key", e.target.value)}
                    placeholder="Key (e.g. Storage)"
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpec(i, "value", e.target.value)}
                    placeholder="Value (e.g. 512GB)"
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <button
                    onClick={() => removeSpec(i)}
                    className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addSpec}
                className="mt-1 text-xs font-semibold text-brand hover:underline"
              >
                + Add Specification
              </button>
            </div>
          </div>

          {/* Save footer */}
          <div className="flex justify-end gap-3">
            <Link
              href={`/admin/products/${id}`}
              className="rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-surface transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-brand disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) { setConfirmOpen(false); setPendingStatusAction(null) }
        }}
        title={confirmCopy.title}
        description={confirmCopy.desc}
        confirmLabel={confirmCopy.label}
        destructive={confirmCopy.destructive}
        onConfirm={handleStatusConfirm}
        loading={statusLoading}
      />

      {/* Reject modal */}
      <RejectModal
        open={rejectOpen}
        loading={rejectLoading}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectOpen(false)}
      />
    </div>
  )
}
