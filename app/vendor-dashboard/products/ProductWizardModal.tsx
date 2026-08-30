"use client"

import { useEffect, useRef, useState } from "react"
import { X, Plus, BarChart2, FileText, ImageIcon, Tag, ListChecks, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import {
  sellerCreateProduct, sellerUpdateProduct, sellerPricingPreview,
  type SellerProduct, type PricingSummary,
} from "@/lib/seller-api"
import { formatNaira } from "@/lib/products"
import { VariantsEditor, variantsFromProduct, inferAttrs, appendVariants, validateVariants, type VariantRow, type AttrKey } from "@/components/VariantsEditor"
import { WizardStepper, WizardFooter, DraftRestoredBanner, FieldError, type WizardStep } from "@/components/Wizard"
import { useDraftPersistence } from "@/hooks/use-draft-persistence"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const DRAFT_KEY = "banex:draft:vendor-product-new"

const STEPS: WizardStep[] = [
  { key: "details", label: "Details", icon: FileText },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "pricing", label: "Pricing", icon: Tag },
  { key: "options", label: "Options", icon: ListChecks },
  { key: "review", label: "Review", icon: CheckCircle2 },
]

type ProductForm = {
  name: string
  brand: string
  category_id: string
  description: string
  regular_price: string
  sales_price: string
  stock_quantity: string
  weight_kg: string
  location: string
  delivery_estimate: string
  is_nationwide_delivery: boolean
  is_authentic_only: boolean
  specifications: string[]
  primary_image_index: number
}

const defaultForm = (): ProductForm => ({
  name: "", brand: "", category_id: "", description: "",
  regular_price: "", sales_price: "", stock_quantity: "", weight_kg: "",
  location: "", delivery_estimate: "",
  is_nationwide_delivery: false, is_authentic_only: true,
  specifications: [""], primary_image_index: 0,
})

function formFromProduct(p: SellerProduct): ProductForm {
  return {
    name: p.name,
    brand: p.brand ?? "",
    category_id: p.category_id ?? "",
    description: p.description ?? "",
    regular_price: String(p.regular_price ?? p.price),
    sales_price: p.sales_price != null && Number(p.sales_price) > 0 ? String(p.sales_price) : "",
    stock_quantity: String(p.stock_quantity ?? ""),
    weight_kg: String(p.weight_kg ?? ""),
    location: p.location ?? "",
    delivery_estimate: p.delivery_estimate ?? "",
    is_nationwide_delivery: p.is_nationwide_delivery,
    is_authentic_only: p.is_authentic_only,
    specifications: p.specifications?.length ? p.specifications : [""],
    primary_image_index: 0,
  }
}

type PreviewImg = { url: string; file?: File; id?: string }

export function ProductWizardModal({
  editProduct,
  token,
  allowedCategories,
  rootCategory,
  subCount,
  onClose,
  onSaved,
}: {
  editProduct: SellerProduct | null
  token: string
  allowedCategories: { id: string; name: string }[]
  rootCategory: { name: string } | null
  subCount: number
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!editProduct
  const [step, setStep] = useState(0)
  const [furthest, setFurthest] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<ProductForm>(editProduct ? formFromProduct(editProduct) : defaultForm())
  const [previewImages, setPreviewImages] = useState<PreviewImg[]>(
    editProduct?.images?.map((i) => ({ url: i.url, id: i.id })) ?? [],
  )
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const variable = !!editProduct?.has_variants && (editProduct?.variants?.length ?? 0) > 0
  const [hasVariants, setHasVariants] = useState(variable)
  const [variantRows, setVariantRows] = useState<VariantRow[]>(variable ? variantsFromProduct(editProduct?.variants) : [])
  const [variantAttrs, setVariantAttrs] = useState<AttrKey[]>(variable ? inferAttrs(editProduct?.variants) : ["color"])

  const [saving, setSaving] = useState(false)
  const [pricingPreview, setPricingPreview] = useState<PricingSummary | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Draft persistence — only for NEW products (never overwrite an edit in progress).
  const { hasDraft, savedAt, clear: clearDraft } = useDraftPersistence(
    DRAFT_KEY,
    !isEdit,
    { form: { ...form, images: [] }, hasVariants, variantRows, variantAttrs },
    (d: any) => {
      if (d.form) setForm((f) => ({ ...f, ...d.form }))
      if (typeof d.hasVariants === "boolean") setHasVariants(d.hasVariants)
      if (Array.isArray(d.variantRows) && d.variantRows.length) setVariantRows(d.variantRows)
      if (Array.isArray(d.variantAttrs) && d.variantAttrs.length) setVariantAttrs(d.variantAttrs)
    },
  )

  // Debounced pricing preview from the regular/sale price.
  useEffect(() => {
    const regular = parseFloat(form.regular_price)
    const sales = parseFloat(form.sales_price)
    if (hasVariants || !form.regular_price || isNaN(regular) || regular <= 0) {
      setPricingPreview(null)
      return
    }
    const validSale = !isNaN(sales) && sales > 0 && sales < regular ? sales : undefined
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    previewTimerRef.current = setTimeout(async () => {
      setLoadingPreview(true)
      try {
        setPricingPreview(await sellerPricingPreview(regular, validSale, token))
      } catch {
        setPricingPreview(null)
      } finally {
        setLoadingPreview(false)
      }
    }, 700)
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current) }
  }, [form.regular_price, form.sales_price, hasVariants, token])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPreviewImages((prev) => [...prev, ...files.map((file) => ({ url: URL.createObjectURL(file), file }))])
    setErrors((x) => ({ ...x, images: "" }))
  }

  function removeImage(index: number, e: React.MouseEvent) {
    e.stopPropagation()
    const img = previewImages[index]
    if (img.id) setDeletedImageIds((prev) => [...prev, img.id!])
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
    setForm((f) => {
      let np = f.primary_image_index
      if (np === index) np = 0
      else if (np > index) np -= 1
      return { ...f, primary_image_index: np }
    })
  }

  // ── Per-step validation ─────────────────────────────────────────────────────
  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!form.name.trim()) e.name = "Product name is required."
      if (!form.category_id) e.category_id = "Select a category."
      if (!form.description.trim()) e.description = "Add a short description."
    } else if (s === 1) {
      if (previewImages.length === 0) e.images = "Add at least one product image."
    } else if (s === 2) {
      if (hasVariants) {
        const err = validateVariants(variantRows, variantAttrs)
        if (err) e.variants = err
      } else {
        const regular = Number(form.regular_price)
        const sales = Number(form.sales_price)
        if (!form.regular_price || regular <= 0) e.regular_price = "Enter a valid regular price."
        else if (form.sales_price.trim() !== "" && sales > 0 && sales >= regular)
          e.sales_price = "Sale price must be less than the regular price."
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
    setErrors({}); setStep(i); setFurthest((f) => Math.max(f, i))
  }

  async function handleSave() {
    for (let s = 0; s < STEPS.length - 1; s++) {
      const e = validateStep(s)
      if (Object.keys(e).length) { setStep(s); setErrors(e); toast.error(Object.values(e)[0]); return }
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("brand", form.brand)
      fd.append("category_id", form.category_id)
      fd.append("description", form.description)
      if (hasVariants) {
        appendVariants(fd, variantRows, variantAttrs)
      } else {
        fd.append("regular_price", form.regular_price)
        if (isEdit) {
          fd.append("sales_price", form.sales_price.trim() !== "" && Number(form.sales_price) > 0 ? form.sales_price : "0")
        } else if (form.sales_price.trim() !== "" && Number(form.sales_price) > 0) {
          fd.append("sales_price", form.sales_price)
        }
        fd.append("stock_quantity", form.stock_quantity)
      }
      fd.append("weight_kg", form.weight_kg)
      fd.append("location", form.location)
      fd.append("delivery_estimate", form.delivery_estimate)
      fd.append("is_nationwide_delivery", form.is_nationwide_delivery ? "1" : "0")
      fd.append("is_authentic_only", form.is_authentic_only ? "1" : "0")
      fd.append("primary_image_index", String(form.primary_image_index))
      form.specifications.filter(Boolean).forEach((s, i) => fd.append(`specifications[${i}]`, s))
      previewImages.filter((img) => img.file).forEach((img) => fd.append("images[]", img.file!))
      if (isEdit && deletedImageIds.length > 0) deletedImageIds.forEach((id) => fd.append("delete_image_ids[]", id))

      if (isEdit) {
        fd.append("_method", "PUT")
        await sellerUpdateProduct(editProduct!.id, fd, token)
        toast.success("Product updated")
      } else {
        await sellerCreateProduct(fd, token)
        clearDraft()
        toast.success("Product created")
      }
      onSaved()
    } catch (e: any) {
      toast.error(e.message || "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  const discardDraft = () => {
    clearDraft()
    setForm(defaultForm())
    setPreviewImages([])
    setHasVariants(false)
    setVariantRows([])
    setVariantAttrs(["color"])
    setErrors({})
    setStep(0)
    setFurthest(0)
    toast.success("Draft discarded")
  }

  const salePreviewInvalid =
    !hasVariants && form.sales_price.trim() !== "" && Number(form.sales_price) > 0 && Number(form.sales_price) >= Number(form.regular_price)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex h-screen w-full max-w-xl flex-col overflow-hidden border-l border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + stepper */}
        <div className="space-y-4 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">{isEdit ? "Edit Product" : "Add Product"}</h2>
              <p className="text-xs text-muted-foreground">
                {isEdit ? "Update the details below" : "A few quick steps — progress is saved automatically"}
              </p>
            </div>
            <Button variant="ghost" type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <WizardStepper steps={STEPS} current={step} furthest={furthest} onStepClick={jumpTo} />
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {!isEdit && hasDraft && step === 0 && <DraftRestoredBanner savedAt={savedAt} onDiscard={discardDraft} />}

          {/* Step 0 — Details */}
          {step === 0 && (
            <div className="space-y-5">
              <F label="Product Name *">
                <Input value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((x) => ({ ...x, name: "" })) }} placeholder="e.g. Samsung Galaxy S24" />
                <FieldError message={errors.name} />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Brand">
                  <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="e.g. Samsung" />
                </F>
                <F label={rootCategory ? `Category * (under ${rootCategory.name})` : "Category *"}>
                  <Select value={form.category_id} onValueChange={(val) => { setForm((f) => ({ ...f, category_id: val })); setErrors((x) => ({ ...x, category_id: "" })) }}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {allowedCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {rootCategory && subCount === 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">No subcategories yet — using {rootCategory.name}.</p>
                  )}
                  <FieldError message={errors.category_id} />
                </F>
              </div>
              <F label="Description *">
                <Textarea value={form.description} onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setErrors((x) => ({ ...x, description: "" })) }} rows={4} placeholder="Describe your product..." />
                <FieldError message={errors.description} />
              </F>
            </div>
          )}

          {/* Step 1 — Media */}
          {step === 1 && (
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Images</label>
              <div className="flex flex-wrap gap-2">
                {previewImages.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setForm((f) => ({ ...f, primary_image_index: i }))}
                    className={`relative group h-20 w-20 cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${form.primary_image_index === i ? "border-emerald-500 shadow-emerald-500/30 shadow-md" : "border-border"}`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    {form.primary_image_index === i && (
                      <span className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-center text-[9px] font-bold text-white py-0.5">PRIMARY</span>
                    )}
                    <Button variant="ghost" type="button" onClick={(e) => removeImage(i, e)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-rose-500 group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" type="button" onClick={() => fileInputRef.current?.click()} className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                  <Plus className="h-5 w-5" />
                  <span className="text-[9px] font-semibold">Add photo</span>
                </Button>
                <Input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Click an image to set it as primary.</p>
              <FieldError message={errors.images} />
            </div>
          )}

          {/* Step 2 — Pricing */}
          {step === 2 && (
            <div className="space-y-5">
              <div className={`grid gap-4 ${hasVariants ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4"}`}>
                {!hasVariants && (
                  <>
                    <F label="Regular Price (₦) *">
                      <Input type="number" value={form.regular_price} onChange={(e) => { setForm((f) => ({ ...f, regular_price: e.target.value })); setErrors((x) => ({ ...x, regular_price: "" })) }} placeholder="0" />
                    </F>
                    <F label="Sale Price (₦)">
                      <Input type="number" value={form.sales_price} onChange={(e) => { setForm((f) => ({ ...f, sales_price: e.target.value })); setErrors((x) => ({ ...x, sales_price: "" })) }} placeholder="Optional" />
                    </F>
                    <F label="Stock Qty">
                      <Input type="number" value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} placeholder="0" />
                    </F>
                  </>
                )}
                <F label="Weight (kg)">
                  <Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} placeholder="0.5" />
                </F>
              </div>
              {!hasVariants && <FieldError message={errors.regular_price || errors.sales_price} />}
              {salePreviewInvalid && !errors.sales_price && (
                <p className="text-[11px] text-rose-600">Sale price must be less than the regular price.</p>
              )}

              <div>
                <VariantsEditor enabled={hasVariants} onToggle={setHasVariants} rows={variantRows} onChange={setVariantRows} attrs={variantAttrs} onAttrsChange={setVariantAttrs} />
                <FieldError message={errors.variants} />
              </div>

              {(pricingPreview || loadingPreview) && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700">Pricing Breakdown</p>
                    {loadingPreview && <span className="ml-auto text-[10px] text-muted-foreground animate-pulse">Calculating…</span>}
                  </div>
                  {pricingPreview && !loadingPreview && (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Listing Price</span>
                        <span className="font-semibold">
                          {formatNaira(pricingPreview.listing_price)}
                          {pricingPreview.is_on_sale && pricingPreview.regular_price != null && (
                            <span className="ml-1.5 font-normal text-muted-foreground line-through">{formatNaira(pricingPreview.regular_price)}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Commission ({pricingPreview.commission_percent_label})</span>
                        <span className="font-semibold text-rose-600">− {formatNaira(pricingPreview.commission_amount)}</span>
                      </div>
                      <div className="my-1 border-t border-emerald-500/20" />
                      <div className="flex justify-between">
                        <span className="font-semibold text-emerald-700">You Receive</span>
                        <span className="font-bold text-emerald-700 text-sm">{formatNaira(pricingPreview.seller_receives)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Options */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <F label="Location">
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Banex Mall" />
                </F>
                <F label="Delivery Estimate">
                  <Input value={form.delivery_estimate} onChange={(e) => setForm((f) => ({ ...f, delivery_estimate: e.target.value }))} placeholder="e.g. 1-2 days" />
                </F>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Specifications</label>
                <div className="space-y-2">
                  {form.specifications.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={s}
                        onChange={(e) => {
                          const specs = [...form.specifications]; specs[i] = e.target.value
                          setForm((f) => ({ ...f, specifications: specs }))
                        }}
                        placeholder={`Spec ${i + 1} (e.g. RAM: 8GB)`}
                      />
                      {form.specifications.length > 1 && (
                        <Button variant="ghost" type="button" onClick={() => setForm((f) => ({ ...f, specifications: f.specifications.filter((_, j) => j !== i) }))} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-rose-500 hover:text-rose-600">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" type="button" onClick={() => setForm((f) => ({ ...f, specifications: [...f.specifications, ""] }))} className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline">
                    <Plus className="h-3.5 w-3.5" /> Add specification
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Toggle checked={form.is_nationwide_delivery} onChange={(v) => setForm((f) => ({ ...f, is_nationwide_delivery: v }))} label="Nationwide delivery available" />
                <Toggle checked={form.is_authentic_only} onChange={(v) => setForm((f) => ({ ...f, is_authentic_only: v }))} label="Authentic products only" />
              </div>
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-semibold">Review your product</h3>
              <div className="grid gap-3 rounded-xl bg-surface/60 p-4 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Name:</span> <strong>{form.name || "—"}</strong></div>
                <div><span className="text-muted-foreground">Brand:</span> <strong>{form.brand || "—"}</strong></div>
                <div><span className="text-muted-foreground">Category:</span> <strong>{allowedCategories.find((c) => c.id === form.category_id)?.name || "—"}</strong></div>
                {hasVariants ? (
                  <div><span className="text-muted-foreground">Variants:</span> <strong>{variantRows.length} option{variantRows.length !== 1 ? "s" : ""}</strong></div>
                ) : (
                  <>
                    <div>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      {form.sales_price.trim() !== "" && Number(form.sales_price) > 0 && Number(form.sales_price) < Number(form.regular_price) ? (
                        <strong>{formatNaira(form.sales_price)} <span className="font-normal text-muted-foreground line-through">{formatNaira(form.regular_price)}</span></strong>
                      ) : (
                        <strong>{formatNaira(form.regular_price || 0)}</strong>
                      )}
                    </div>
                    <div><span className="text-muted-foreground">Stock:</span> <strong>{form.stock_quantity || "—"}</strong></div>
                  </>
                )}
                <div><span className="text-muted-foreground">Images:</span> <strong>{previewImages.length}</strong></div>
              </div>
              {form.description && <p className="line-clamp-3 text-xs text-muted-foreground">{form.description}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <WizardFooter
            isFirst={step === 0}
            isLast={step === STEPS.length - 1}
            submitting={saving}
            onBack={goBack}
            onNext={goNext}
            onSubmit={handleSave}
            onCancel={onClose}
            submitLabel={isEdit ? "Update Product" : "Create Product"}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
