"use client"

import { use, useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, X, Loader2, Star, Ban,
  Power, PowerOff, ShieldCheck, Trash2, ImagePlus, Save,
  FileText, ImageIcon, Tag, ListChecks, CheckCircle2, Search,
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
  appendSeoFields,
  type AdminCategory,
  type AdminSeller,
  type AdminProduct,
} from "@/lib/admin-api"
import { SeoFieldsEditor, emptySeo, seoFromApi, type SeoFields } from "@/components/SeoFieldsEditor"
import { RichTextEditor } from "@/components/RichTextEditor"
import { VariantsEditor, variantsFromProduct, inferAttrs, appendVariants, validateVariants, type VariantRow, type AttrKey } from "@/components/VariantsEditor"
import { WizardStepper, WizardFooter, FieldError, type WizardStep } from "@/components/Wizard"
import { flattenCategories, subcategoriesOf, findCategory } from "@/lib/categories"
import { LocationSelect } from "@/components/LocationSelect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"

// Banex Mall house account → all categories; other sellers → own department only.
const BANEX_MALL_SELLER_ID = "019e8813-b50f-7270-98a9-bf5889e4161c"

const STEPS: WizardStep[] = [
  { key: "details", label: "Details", icon: FileText },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "pricing", label: "Pricing", icon: Tag },
  { key: "options", label: "Options", icon: ListChecks },
  { key: "seo", label: "SEO", icon: Search },
  { key: "review", label: "Review", icon: CheckCircle2 },
]

// ─── Existing image entry (from server) ──────────────────────────────────────
type ExistingImage = {
  id: string
  url: string
  sort_order: number
  is_primary: boolean
  toDelete?: boolean
}
type NewImage = { file: File; preview: string }

// ─── Reject reason modal ──────────────────────────────────────────────────────
function RejectModal({ open, loading, onConfirm, onCancel }: {
  open: boolean; loading: boolean; onConfirm: (reason: string) => void; onCancel: () => void
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
        <Label className="mb-1.5 block text-xs font-semibold">
          Reason <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Images are low quality, description is missing…"
          rows={4}
          className="rounded-xl bg-surface px-3.5 py-2.5 resize-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="h-auto rounded-xl px-4 py-2 text-xs font-semibold">
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm(reason)} disabled={loading} className="h-auto gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
            {loading ? "Rejecting…" : "Confirm Rejection"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0)
  const [furthest, setFurthest] = useState(STEPS.length - 1) // edit: all steps reachable
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "", brand: "", description: "",
    regular_price: "", sales_price: "", stock_quantity: "",
    category_id: "", seller_id: "",
    location: "Lagos", delivery_estimate: "3 - 5 days",
    is_nationwide_delivery: false, is_authentic_only: false, is_featured: false, is_escrow_enabled: false,
  })

  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }])
  const [hasVariants, setHasVariants] = useState(false)
  const [variantRows, setVariantRows] = useState<VariantRow[]>([])
  const [variantAttrs, setVariantAttrs] = useState<AttrKey[]>(["color"])
  const [seo, setSeo] = useState<SeoFields>(emptySeo())
  const [seoResolved, setSeoResolved] = useState<NonNullable<AdminProduct["seo"]>["resolved"] | null>(null)

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newImages, setNewImages] = useState<NewImage[]>([])
  const [primaryKey, setPrimaryKey] = useState<string>("")

  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Status action states
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatusAction, setPendingStatusAction] = useState<"approve" | "activate" | "deactivate" | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  // Category scoping — Banex Mall = all; others = own subcategories.
  const selectedSeller = sellers.find((s) => s.id === form.seller_id)
  const isBanexMall = form.seller_id === BANEX_MALL_SELLER_ID
  const sellerRoot = findCategory(categories, selectedSeller?.category_id)
  const sellerSubcats = subcategoriesOf(categories, selectedSeller?.category_id)
  const baseOptions = isBanexMall
    ? flattenCategories(categories)
    : (sellerSubcats.length ? sellerSubcats : sellerRoot ? [sellerRoot] : []).map((node) => ({ node, depth: 0 }))
  const currentCat = findCategory(categories, form.category_id)
  const categoryOptions =
    currentCat && !baseOptions.some((o) => o.node.id === currentCat.id)
      ? [{ node: currentCat, depth: 0 }, ...baseOptions]
      : baseOptions
  const onSellerChange = (sellerId: string) => {
    setForm((f) => ({ ...f, seller_id: sellerId, category_id: "" }))
    setErrors((x) => ({ ...x, seller_id: "", category_id: "" }))
  }

  // Spec helpers
  const addSpec = () => setSpecifications((p) => [...p, { key: "", value: "" }])
  const removeSpec = (i: number) => setSpecifications((p) => p.filter((_, idx) => idx !== i))
  const updateSpec = (i: number, field: "key" | "value", val: string) =>
    setSpecifications((p) => { const next = [...p]; next[i][field] = val; return next })

  // Load data
  useEffect(() => {
    if (session?.accessToken) loadAll(session.accessToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const variable = !!p.has_variants && (p.variants?.length ?? 0) > 0
        setHasVariants(variable)
        setVariantRows(variable ? variantsFromProduct(p.variants) : [])
        setVariantAttrs(variable ? inferAttrs(p.variants) : ["color"])
        setSeo(seoFromApi(p.seo))
        setSeoResolved(p.seo?.resolved ?? null)
        setForm({
          name: p.name ?? "",
          brand: p.brand ?? "",
          description: p.description ?? "",
          regular_price: (p.regular_price ?? p.price)?.toString() ?? "",
          sales_price: p.sales_price != null && Number(p.sales_price) > 0 ? String(p.sales_price) : "",
          stock_quantity: p.stock_quantity?.toString() ?? "",
          category_id: p.category_id ?? "",
          seller_id: p.seller_id ?? "",
          location: p.location ?? "Lagos",
          delivery_estimate: p.delivery_estimate ?? "3 - 5 days",
          is_nationwide_delivery: p.is_nationwide_delivery ?? false,
          is_authentic_only: p.is_authentic_only ?? false,
          is_featured: p.is_featured ?? false,
          is_escrow_enabled: p.is_escrow_enabled ?? false,
        })
        if (Array.isArray(p.specifications) && p.specifications.length > 0) {
          setSpecifications(p.specifications.map((s) => {
            const [key = "", value = ""] = s.split("=>").map((x) => x.trim())
            return { key, value }
          }))
        }
        const sorted = [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
        setExistingImages(sorted)
        const primary = sorted.find((i) => i.is_primary) ?? sorted[0]
        if (primary) setPrimaryKey(`existing:${primary.id}`)
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load product")
    } finally {
      setLoadingData(false)
    }
  }

  // Image handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const totalActive = existingImages.filter((i) => !i.toDelete).length + newImages.length
    const canAdd = Math.max(0, 5 - totalActive)
    const toAdd = files.slice(0, canAdd).map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setNewImages((prev) => [...prev, ...toAdd])
    setErrors((x) => ({ ...x, images: "" }))
    e.target.value = ""
  }

  const markExistingForDeletion = (imgId: string) => {
    setExistingImages((prev) => prev.map((i) => (i.id === imgId ? { ...i, toDelete: true } : i)))
    if (primaryKey === `existing:${imgId}`) {
      const nextExisting = existingImages.find((i) => !i.toDelete && i.id !== imgId)
      if (nextExisting) setPrimaryKey(`existing:${nextExisting.id}`)
      else if (newImages.length > 0) setPrimaryKey("new:0")
      else setPrimaryKey("")
    }
  }

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(newImages[idx].preview)
    setNewImages((prev) => prev.filter((_, i) => i !== idx))
    if (primaryKey === `new:${idx}`) setPrimaryKey(newImages.length > 1 ? "new:0" : "")
  }

  const totalSlots = existingImages.filter((i) => !i.toDelete).length + newImages.length

  // ── Per-step validation ─────────────────────────────────────────────────────
  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!form.name.trim()) e.name = "Product name is required."
      if (!form.seller_id) e.seller_id = "Choose the owning seller."
      if (!form.category_id) e.category_id = "Select a category."
    } else if (s === 1) {
      if (totalSlots === 0) e.images = "Add at least one product image."
    } else if (s === 2) {
      if (hasVariants) {
        const err = validateVariants(variantRows, variantAttrs)
        if (err) e.variants = err
      } else {
        const reg = Number(form.regular_price)
        const sal = Number(form.sales_price)
        if (!form.regular_price || reg <= 0) e.regular_price = "Enter a valid regular price."
        else if (form.sales_price.trim() !== "" && sal > 0 && sal >= reg) e.sales_price = "Sale price must be less than the regular price."
        if (form.stock_quantity !== "" && Number(form.stock_quantity) < 0) e.stock_quantity = "Stock can't be negative."
      }
    }
    return e
  }

  const goNext = () => {
    const e = validateStep(step)
    setErrors(e)
    if (Object.keys(e).length) { toast.error(Object.values(e)[0]); return }
    setStep((s) => { const n = Math.min(STEPS.length - 1, s + 1); setFurthest((f) => Math.max(f, n)); return n })
  }
  const goBack = () => { setErrors({}); setStep((s) => Math.max(0, s - 1)) }
  const jumpTo = (i: number) => {
    if (i <= step) { setErrors({}); setStep(i); return }
    for (let s = step; s < i; s++) {
      const e = validateStep(s)
      if (Object.keys(e).length) { setStep(s); setErrors(e); toast.error(Object.values(e)[0]); return }
    }
    setErrors({}); setStep(i)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!session?.accessToken) return
    for (let s = 0; s < STEPS.length - 1; s++) {
      const e = validateStep(s)
      if (Object.keys(e).length) { setStep(s); setErrors(e); toast.error(Object.values(e)[0]); return }
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("brand", form.brand)
      fd.append("description", form.description)
      if (hasVariants) {
        appendVariants(fd, variantRows, variantAttrs)
      } else {
        fd.append("regular_price", form.regular_price)
        fd.append("sales_price", form.sales_price.trim() !== "" && Number(form.sales_price) > 0 ? form.sales_price : "0")
        if (form.stock_quantity !== "") fd.append("stock_quantity", form.stock_quantity)
      }
      fd.append("category_id", form.category_id)
      fd.append("seller_id", form.seller_id)
      fd.append("location", form.location)
      fd.append("delivery_estimate", form.delivery_estimate)
      fd.append("is_nationwide_delivery", form.is_nationwide_delivery ? "1" : "0")
      fd.append("is_authentic_only", form.is_authentic_only ? "1" : "0")
      fd.append("is_featured", form.is_featured ? "1" : "0")
      fd.append("is_escrow_enabled", form.is_escrow_enabled ? "1" : "0")
      specifications.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) fd.append("specifications[]", `${key.trim()} => ${value.trim()}`)
      })
      newImages.forEach((img) => fd.append("images[]", img.file))
      existingImages.filter((i) => i.toDelete).forEach((i) => fd.append("delete_image_ids[]", i.id))

      const activeExisting = existingImages.filter((i) => !i.toDelete)
      let primaryIndex = 0
      if (primaryKey.startsWith("existing:")) {
        primaryIndex = activeExisting.findIndex((i) => i.id === primaryKey.replace("existing:", ""))
      } else if (primaryKey.startsWith("new:")) {
        primaryIndex = activeExisting.length + parseInt(primaryKey.replace("new:", ""), 10)
      }
      fd.append("primary_image_index", String(Math.max(0, primaryIndex)))
      appendSeoFields(fd, seo)

      await updateAdminProduct(id, fd, session.accessToken)
      toast.success("Product updated successfully!")
      router.push(`/admin/products/${id}`)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update product")
    } finally {
      setSubmitting(false)
    }
  }

  // Status actions
  const triggerStatusAction = (action: "approve" | "activate" | "deactivate") => {
    setPendingStatusAction(action); setConfirmOpen(true)
  }
  const handleStatusConfirm = async () => {
    if (!product || !session?.accessToken || !pendingStatusAction) return
    setStatusLoading(true)
    try {
      let nextStatus: AdminProduct["status"] = product.status
      if (pendingStatusAction === "approve") { await approveAdminProduct(product.id, session.accessToken); nextStatus = "active"; toast.success("Product approved.") }
      else if (pendingStatusAction === "activate") { await activateAdminProduct(product.id, session.accessToken); nextStatus = "active"; toast.success("Product activated.") }
      else if (pendingStatusAction === "deactivate") { await deactivateAdminProduct(product.id, session.accessToken); nextStatus = "inactive"; toast.success("Product deactivated.") }
      setProduct((p) => p ? { ...p, status: nextStatus } : null)
    } catch (err: any) {
      toast.error(err.message ?? "Action failed")
    } finally {
      setStatusLoading(false); setConfirmOpen(false); setPendingStatusAction(null)
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

  const confirmCopy = (() => {
    if (pendingStatusAction === "approve") return { title: "Approve this product?", desc: "It will become publicly visible.", label: "Approve", destructive: false }
    if (pendingStatusAction === "activate") return { title: "Activate this product?", desc: "Buyers will be able to see and purchase it.", label: "Activate", destructive: false }
    return { title: "Deactivate this product?", desc: "It will be hidden from buyers.", label: "Deactivate", destructive: true }
  })()

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
        <Link href="/admin/products" className="text-brand hover:underline">Back to products</Link>
      </div>
    )
  }

  const activeExisting = existingImages.filter((i) => !i.toDelete)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/products/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Edit Product</h1>
            <p className="mt-0.5 max-w-xs truncate text-sm text-muted-foreground">{product.name}</p>
          </div>
        </div>
        <StatusBadge status={product.status} />
      </div>

      {/* Status / moderation actions — always available, independent of the wizard */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">Status actions:</span>
          {product.status === "pending" && (
            <>
              <Button type="button" onClick={() => triggerStatusAction("approve")} disabled={statusLoading} className="h-auto gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                <ShieldCheck className="h-4 w-4" /> Approve
              </Button>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} disabled={statusLoading} className="h-auto gap-2 rounded-xl border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20">
                <Ban className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
          {(product.status === "inactive" || product.status === "rejected" || product.status === "draft") && (
            <Button type="button" onClick={() => triggerStatusAction("activate")} disabled={statusLoading} className="h-auto gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
              <Power className="h-4 w-4" /> {product.status === "rejected" ? "Override & Activate" : "Activate"}
            </Button>
          )}
          {product.status === "active" && (
            <Button type="button" variant="outline" onClick={() => triggerStatusAction("deactivate")} disabled={statusLoading} className="h-auto gap-2 rounded-xl border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20">
              <PowerOff className="h-4 w-4" /> Deactivate
            </Button>
          )}
          {product.status === "active" && <span className="text-[11px] text-muted-foreground">Live on the marketplace.</span>}
          {product.status === "pending" && <span className="text-[11px] text-amber-700 dark:text-amber-400">Awaiting review before going live.</span>}
        </div>
        {product.status === "rejected" && product.rejection_reason && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Rejection reason:</p>
            <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">{product.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Wizard */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <WizardStepper steps={STEPS} current={step} furthest={furthest} onStepClick={jumpTo} />

        <div className="mt-8">
          {/* Step 0 — Details */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Product Name <span className="text-rose-500">*</span></Label>
                  <Input type="text" value={form.name} onChange={(e) => { update("name", e.target.value); setErrors((x) => ({ ...x, name: "" })) }} placeholder="e.g. iPhone 16 Pro Max" className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                  <FieldError message={errors.name} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Brand</Label>
                  <Input type="text" value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="e.g. Apple" className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Seller <span className="text-rose-500">*</span></Label>
                  <Select value={form.seller_id} onValueChange={onSellerChange}>
                    <SelectTrigger className="h-auto rounded-xl px-4 py-2.5"><SelectValue placeholder="Assign to seller" /></SelectTrigger>
                    <SelectContent>
                      {sellers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.shop_name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.seller_id} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">
                    Category{!isBanexMall && sellerRoot ? ` (under ${sellerRoot.name})` : ""} <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={form.category_id} onValueChange={(v) => { update("category_id", v); setErrors((x) => ({ ...x, category_id: "" })) }} disabled={!form.seller_id}>
                    <SelectTrigger className="h-auto rounded-xl px-4 py-2.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(({ node, depth }) => (
                        <SelectItem key={node.id} value={node.id}>{depth > 0 ? `  ${"— ".repeat(depth)}${node.name}` : node.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.category_id} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Description</Label>
                <RichTextEditor value={form.description} onChange={(val) => update("description", val)} placeholder="Describe the product in detail…" />
              </div>
            </div>
          )}

          {/* Step 1 — Media */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Product images</p>
                  <p className="text-xs text-muted-foreground">Up to 5. Click the star to set the primary image.</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{totalSlots} / 5</span>
              </div>
              <div className="space-y-2">
                {activeExisting.map((img) => {
                  const isThisPrimary = primaryKey === `existing:${img.id}`
                  return (
                    <div key={img.id} className={`group relative flex items-center gap-3 rounded-xl border-2 p-2 transition-colors ${isThisPrimary ? "border-brand bg-brand/5" : "border-border hover:border-border/80"}`}>
                      <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg">
                        <Image src={img.url} alt="product image" fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {isThisPrimary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                            <Star className="h-2.5 w-2.5" fill="currentColor" /> Primary
                          </span>
                        )}
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{img.url.split("/").pop()}</p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!isThisPrimary && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => setPrimaryKey(`existing:${img.id}`)} title="Set as primary" className="h-auto w-auto rounded-lg p-1 text-muted-foreground hover:bg-brand/10 hover:text-brand">
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button type="button" variant="ghost" size="icon" onClick={() => markExistingForDeletion(img.id)} title="Remove image" className="h-auto w-auto rounded-lg p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {newImages.map((img, idx) => {
                  const key = `new:${idx}`
                  const isThisPrimary = primaryKey === key
                  return (
                    <div key={idx} className={`group relative flex items-center gap-3 rounded-xl border-2 p-2 transition-colors ${isThisPrimary ? "border-brand bg-brand/5" : "border-dashed border-border hover:border-brand/40"}`}>
                      <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg">
                        <img src={img.preview} alt="new upload" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {isThisPrimary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                            <Star className="h-2.5 w-2.5" fill="currentColor" /> Primary
                          </span>
                        )}
                        <p className="mt-0.5 text-[11px] font-medium text-emerald-600">New upload</p>
                        <p className="truncate text-[11px] text-muted-foreground">{img.file.name}</p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!isThisPrimary && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => setPrimaryKey(key)} title="Set as primary" className="h-auto w-auto rounded-lg p-1 text-muted-foreground hover:bg-brand/10 hover:text-brand">
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeNewImage(idx)} title="Remove image" className="h-auto w-auto rounded-lg p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {totalSlots < 5 && (
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border p-3 text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface"><ImagePlus className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs font-semibold">Add images</p>
                      <p className="text-[11px]">{5 - totalSlots} slot(s) remaining</p>
                    </div>
                    <Input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                  </label>
                )}
              </div>
              <FieldError message={errors.images} />
            </div>
          )}

          {/* Step 2 — Pricing & Inventory */}
          {step === 2 && (
            <div className="space-y-4">
              {product?.pricing_summary && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-brand/30 bg-brand-soft/10 p-4 text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Listing price</p>
                    <p className="font-display font-bold">
                      ₦{product.pricing_summary.listing_price.toLocaleString()}
                      {product.pricing_summary.is_on_sale && product.pricing_summary.regular_price != null && (
                        <span className="ml-1.5 text-xs font-medium text-muted-foreground line-through">₦{product.pricing_summary.regular_price.toLocaleString()}</span>
                      )}
                    </p>
                    {product.pricing_summary.is_on_sale && !!product.pricing_summary.discount_amount && (
                      <p className="text-[10px] font-semibold text-emerald-600">On sale · save ₦{product.pricing_summary.discount_amount.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Commission ({product.pricing_summary.commission_percent_label})</p>
                    <p className="font-display font-bold text-rose-600">−₦{product.pricing_summary.commission_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Seller receives</p>
                    <p className="font-display font-bold text-emerald-600">₦{product.pricing_summary.seller_receives.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {!hasVariants && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">Regular Price (₦) <span className="text-rose-500">*</span></Label>
                    <Input type="number" value={form.regular_price} onChange={(e) => { update("regular_price", e.target.value); setErrors((x) => ({ ...x, regular_price: "" })) }} placeholder="350000" min="0" className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                    <FieldError message={errors.regular_price} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">Sale Price (₦) <span className="text-muted-foreground/70">— optional</span></Label>
                    <Input type="number" value={form.sales_price} onChange={(e) => { update("sales_price", e.target.value); setErrors((x) => ({ ...x, sales_price: "" })) }} placeholder="Blank for none" min="0" className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                    {errors.sales_price ? <FieldError message={errors.sales_price} /> : <p className="mt-1 text-[11px] text-muted-foreground">Clear to remove an active sale.</p>}
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">Stock Quantity</Label>
                    <Input type="number" value={form.stock_quantity} onChange={(e) => update("stock_quantity", e.target.value)} placeholder="50" min="0" className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                    <FieldError message={errors.stock_quantity} />
                  </div>
                </div>
              )}
              <div>
                <VariantsEditor enabled={hasVariants} onToggle={setHasVariants} rows={variantRows} onChange={setVariantRows} attrs={variantAttrs} onAttrsChange={setVariantAttrs} />
                <FieldError message={errors.variants} />
              </div>
            </div>
          )}

          {/* Step 3 — Options */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Location</Label>
                  <LocationSelect value={form.location} onChange={(val) => update("location", val)} placeholder="Select state…" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Delivery Estimate</Label>
                  <Input type="text" value={form.delivery_estimate} onChange={(e) => update("delivery_estimate", e.target.value)} placeholder="e.g. 3 - 5 days" className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Specifications</p>
                <div className="space-y-2">
                  {specifications.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input type="text" value={spec.key} onChange={(e) => updateSpec(i, "key", e.target.value)} placeholder="Key (e.g. Storage)" className="flex-1 rounded-xl px-3.5 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                      <Input type="text" value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="Value (e.g. 512GB)" className="flex-1 rounded-xl px-3.5 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeSpec(i)} className="h-auto w-auto rounded-xl p-2.5 text-muted-foreground hover:border-rose-300 hover:bg-rose-500/10 hover:text-rose-500">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="link" onClick={addSpec} className="mt-1 h-auto p-0 text-xs font-semibold text-brand hover:underline">+ Add Specification</Button>
                </div>
              </div>

              <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                {([
                  ["is_nationwide_delivery", "Nationwide Delivery"],
                  ["is_authentic_only", "Authentic Only"],
                  ["is_featured", "Featured Product"],
                  ["is_escrow_enabled", "Escrow Enabled"],
                ] as [keyof typeof form, string][]).map(([key, label]) => (
                  <Label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-surface/60">
                    <Switch checked={!!form[key]} onCheckedChange={(v) => update(key, v)} />
                    <span className="text-xs font-medium">{label}</span>
                  </Label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — SEO */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-base font-semibold">Search engine optimization</h3>
                <p className="text-xs text-muted-foreground">How this product appears on Google and social shares.</p>
              </div>
              <SeoFieldsEditor value={seo} onChange={(patch) => setSeo((s) => ({ ...s, ...patch }))} resolved={seoResolved} />
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-semibold">Review changes</h3>
              <div className="grid gap-3 rounded-xl bg-surface/60 p-4 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Name:</span> <strong>{form.name || "—"}</strong></div>
                <div><span className="text-muted-foreground">Brand:</span> <strong>{form.brand || "—"}</strong></div>
                <div><span className="text-muted-foreground">Category:</span> <strong>{currentCat?.name || "—"}</strong></div>
                <div><span className="text-muted-foreground">Seller:</span> <strong>{sellers.find((s) => s.id === form.seller_id)?.shop_name || "—"}</strong></div>
                {hasVariants ? (
                  <div><span className="text-muted-foreground">Variants:</span> <strong>{variantRows.length} option{variantRows.length !== 1 ? "s" : ""}</strong></div>
                ) : (
                  <>
                    <div>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      {form.sales_price.trim() !== "" && Number(form.sales_price) > 0 && Number(form.sales_price) < Number(form.regular_price) ? (
                        <strong>₦{Number(form.sales_price).toLocaleString()} <span className="font-normal text-muted-foreground line-through">₦{Number(form.regular_price || 0).toLocaleString()}</span></strong>
                      ) : (
                        <strong>₦{Number(form.regular_price || 0).toLocaleString()}</strong>
                      )}
                    </div>
                    <div><span className="text-muted-foreground">Stock:</span> <strong>{form.stock_quantity || "—"}</strong></div>
                  </>
                )}
                <div><span className="text-muted-foreground">Images:</span> <strong>{totalSlots}</strong></div>
                <div><span className="text-muted-foreground">SEO:</span> <strong>{seo.title || seo.description || seo.keywords ? "Custom" : "Auto"}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4">
          <WizardFooter
            isFirst={step === 0}
            isLast={step === STEPS.length - 1}
            submitting={submitting}
            onBack={goBack}
            onNext={goNext}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/admin/products/${id}`)}
            submitLabel="Save Changes"
          />
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => { if (!open) { setConfirmOpen(false); setPendingStatusAction(null) } }}
        title={confirmCopy.title}
        description={confirmCopy.desc}
        confirmLabel={confirmCopy.label}
        destructive={confirmCopy.destructive}
        onConfirm={handleStatusConfirm}
        loading={statusLoading}
      />

      {/* Reject modal */}
      <RejectModal open={rejectOpen} loading={rejectLoading} onConfirm={handleRejectConfirm} onCancel={() => setRejectOpen(false)} />
    </div>
  )
}
