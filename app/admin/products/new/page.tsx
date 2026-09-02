"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Upload, X, Loader2, Star,
  FileText, ImageIcon, Tag, ListChecks, CheckCircle2, Search,
} from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  fetchAdminCategories,
  fetchAdminSellers,
  createAdminProduct,
  pricingPreviewAdminProduct,
  appendSeoFields,
  AdminCategory,
  AdminSeller,
  type PricingSummary,
} from "@/lib/admin-api"
import { SeoFieldsEditor, emptySeo, type SeoFields } from "@/components/SeoFieldsEditor"
import { RichTextEditor } from "@/components/RichTextEditor"
import { LocationSelect } from "@/components/LocationSelect"
import { VariantsEditor, emptyVariantRow, appendVariants, validateVariants, type VariantRow, type AttrKey } from "@/components/VariantsEditor"
import { flattenCategories, subcategoriesOf, findCategory } from "@/lib/categories"
import { WizardStepper, WizardFooter, DraftRestoredBanner, FieldError, type WizardStep } from "@/components/Wizard"
import { useDraftPersistence } from "@/hooks/use-draft-persistence"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const fmtNaira = (n: number | string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(n) || 0)

// The Banex Mall house account can list under any category; other sellers are
// restricted to their own department's subcategories.
const BANEX_MALL_SELLER_ID = "019e8813-b50f-7270-98a9-bf5889e4161c"

const DRAFT_KEY = "banex:draft:admin-product-new"

const STEPS: WizardStep[] = [
  { key: "details", label: "Details", icon: FileText },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "pricing", label: "Pricing", icon: Tag },
  { key: "options", label: "Options", icon: ListChecks },
  { key: "seo", label: "SEO", icon: Search },
  { key: "review", label: "Review", icon: CheckCircle2 },
]

type FormState = {
  name: string
  brand: string
  description: string
  regular_price: string
  sales_price: string
  category_id: string
  stock_quantity: string
  seller_id: string
  weight_kg: string
  location: string
  delivery_estimate: string
  is_nationwide_delivery: boolean
  is_authentic_only: boolean
  is_featured: boolean
  is_escrow_enabled: boolean
}

const defaultForm = (): FormState => ({
  name: "",
  brand: "",
  description: "",
  regular_price: "",
  sales_price: "",
  category_id: "",
  stock_quantity: "",
  seller_id: "",
  weight_kg: "",
  location: "Lagos",
  delivery_estimate: "3 - 5 days",
  is_nationwide_delivery: true,
  is_authentic_only: true,
  is_featured: false,
  is_escrow_enabled: true,
})

export default function AdminNewProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState(0)
  const [furthest, setFurthest] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<FormState>(defaultForm())

  const [specifications, setSpecifications] = useState([{ key: "", value: "" }])
  const [seo, setSeo] = useState<SeoFields>(emptySeo())
  const [hasVariants, setHasVariants] = useState(false)
  const [variantRows, setVariantRows] = useState<VariantRow[]>([emptyVariantRow(true)])
  const [variantAttrs, setVariantAttrs] = useState<AttrKey[]>(["color"])

  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)

  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pricingPreview, setPricingPreview] = useState<PricingSummary | null>(null)

  const update = (key: keyof FormState, value: any) => setForm((f) => ({ ...f, [key]: value }))

  // ── Draft persistence (everything serializable; images are re-added) ────────
  const { hasDraft, savedAt, clear: clearDraft } = useDraftPersistence(
    DRAFT_KEY,
    true,
    { form, specifications, seo, hasVariants, variantRows, variantAttrs },
    (d) => {
      if (d.form) setForm((f) => ({ ...f, ...d.form }))
      if (Array.isArray(d.specifications) && d.specifications.length) setSpecifications(d.specifications)
      if (d.seo) setSeo((s) => ({ ...s, ...d.seo }))
      if (typeof d.hasVariants === "boolean") setHasVariants(d.hasVariants)
      if (Array.isArray(d.variantRows) && d.variantRows.length) setVariantRows(d.variantRows)
      if (Array.isArray(d.variantAttrs) && d.variantAttrs.length) setVariantAttrs(d.variantAttrs)
    },
  )

  // Live commission preview for a simple product once a seller + regular price are set.
  useEffect(() => {
    const regular = Number(form.regular_price)
    const sales = Number(form.sales_price)
    if (hasVariants || !form.seller_id || !regular || regular <= 0 || !session?.accessToken) {
      setPricingPreview(null)
      return
    }
    const validSale = sales > 0 && sales < regular ? sales : undefined
    const t = setTimeout(async () => {
      try {
        const res = await pricingPreviewAdminProduct(
          { seller_id: form.seller_id, regular_price: regular, sales_price: validSale },
          session.accessToken as string,
        )
        setPricingPreview(res.data?.pricing_summary ?? null)
      } catch {
        setPricingPreview(null)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [form.regular_price, form.sales_price, form.seller_id, hasVariants, session?.accessToken])

  // Only the Banex Mall house account may sell across ALL categories; every other
  // seller is limited to the subcategories of their own (root) department.
  const selectedSeller = sellers.find((s) => s.id === form.seller_id)
  const isBanexMall = form.seller_id === BANEX_MALL_SELLER_ID
  const sellerRoot = findCategory(categories, selectedSeller?.category_id)
  const sellerSubcats = subcategoriesOf(categories, selectedSeller?.category_id)
  const categoryOptions = isBanexMall
    ? flattenCategories(categories)
    : (sellerSubcats.length ? sellerSubcats : sellerRoot ? [sellerRoot] : []).map((node) => ({ node, depth: 0 }))

  // Changing the seller changes the allowed categories → reset the picked category.
  const onSellerChange = (sellerId: string) =>
    setForm((f) => ({ ...f, seller_id: sellerId, category_id: "" }))

  const addSpecification = () => setSpecifications((prev) => [...prev, { key: "", value: "" }])
  const removeSpecification = (index: number) => setSpecifications((prev) => prev.filter((_, i) => i !== index))
  const updateSpecification = (index: number, field: "key" | "value", val: string) => {
    setSpecifications((prev) => {
      const next = [...prev]
      next[index][field] = val
      return next
    })
  }

  useEffect(() => {
    if (session?.accessToken) loadData(session.accessToken)
  }, [session?.accessToken])

  const loadData = async (token: string) => {
    try {
      setLoadingData(true)
      const [catsRes, sellersRes] = await Promise.all([
        fetchAdminCategories(token),
        fetchAdminSellers(token),
      ])
      setCategories(catsRes.data?.categories || [])
      setSellers(sellersRes.data?.sellers || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories or sellers")
    } finally {
      setLoadingData(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      setImages((prev) => [...prev, ...newImages].slice(0, 5))
      setErrors((e) => ({ ...e, images: "" }))
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[indexToRemove].preview)
      return prev.filter((_, i) => i !== indexToRemove)
    })
    if (primaryImageIndex === indexToRemove) setPrimaryImageIndex(0)
    else if (primaryImageIndex > indexToRemove) setPrimaryImageIndex((p) => p - 1)
  }

  // ── Per-step validation ─────────────────────────────────────────────────────
  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!form.name.trim()) e.name = "Product name is required."
      if (!form.seller_id) e.seller_id = "Choose the owning seller."
      if (!form.category_id) e.category_id = "Select a category."
    } else if (s === 1) {
      if (images.length === 0) e.images = "Add at least one product image."
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
        if (form.stock_quantity !== "" && Number(form.stock_quantity) < 0) e.stock_quantity = "Stock can't be negative."
      }
    }
    return e
  }

  const goNext = () => {
    const e = validateStep(step)
    setErrors(e)
    if (Object.keys(e).length) { toast.error(Object.values(e)[0]); return }
    setStep((s) => {
      const n = Math.min(STEPS.length - 1, s + 1)
      setFurthest((f) => Math.max(f, n))
      return n
    })
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

  const handleSubmit = async () => {
    if (!session?.accessToken) return
    // Full validation across all input steps before submitting.
    for (let s = 0; s < STEPS.length - 1; s++) {
      const e = validateStep(s)
      if (Object.keys(e).length) { setStep(s); setErrors(e); toast.error(Object.values(e)[0]); return }
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", form.name)
      formData.append("brand", form.brand)
      formData.append("category_id", form.category_id)
      formData.append("description", form.description)
      if (hasVariants) {
        appendVariants(formData, variantRows, variantAttrs)
      } else {
        formData.append("regular_price", form.regular_price)
        if (form.sales_price.trim() !== "" && Number(form.sales_price) > 0) {
          formData.append("sales_price", form.sales_price)
        }
        formData.append("stock_quantity", form.stock_quantity)
      }
      formData.append("seller_id", form.seller_id)
      formData.append("weight_kg", form.weight_kg)
      formData.append("location", form.location)
      formData.append("delivery_estimate", form.delivery_estimate)
      formData.append("is_nationwide_delivery", form.is_nationwide_delivery ? "1" : "0")
      formData.append("is_authentic_only", form.is_authentic_only ? "1" : "0")
      formData.append("is_featured", form.is_featured ? "1" : "0")
      formData.append("is_escrow_enabled", form.is_escrow_enabled ? "1" : "0")
      specifications.forEach((spec) => {
        if (spec.key && spec.value) formData.append("specifications[]", `${spec.key} => ${spec.value}`)
      })
      formData.append("primary_image_index", String(primaryImageIndex))
      images.forEach((img) => formData.append("images[]", img.file))
      appendSeoFields(formData, seo)

      await createAdminProduct(formData, session.accessToken)
      clearDraft()
      toast.success("Product created successfully!")
      router.push("/admin/products")
    } catch (err: any) {
      toast.error(err.message || "Failed to create product")
      setSubmitting(false)
    }
  }

  const discardDraft = () => {
    clearDraft()
    setForm(defaultForm())
    setSpecifications([{ key: "", value: "" }])
    setSeo(emptySeo())
    setHasVariants(false)
    setVariantRows([emptyVariantRow(true)])
    setVariantAttrs(["color"])
    setImages([])
    setPrimaryImageIndex(0)
    setErrors({})
    setStep(0)
    setFurthest(0)
    toast.success("Draft discarded")
  }

  if (loadingData) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold">Add Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a new product listing — your progress is saved automatically.</p>
      </div>

      {hasDraft && step === 0 && <DraftRestoredBanner savedAt={savedAt} onDiscard={discardDraft} />}

      <div className="rounded-2xl border border-border bg-card p-6">
        <WizardStepper steps={STEPS} current={step} furthest={furthest} onStepClick={jumpTo} />

        <div className="mt-8">
          {/* Step 0 — Details */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="product-name" className="mb-1.5 block text-xs text-muted-foreground">Product Name <span className="text-rose-500">*</span></Label>
                  <Input id="product-name" type="text" value={form.name} onChange={(e) => { update("name", e.target.value); setErrors((x) => ({ ...x, name: "" })) }} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" placeholder="e.g. iPhone 16 Pro Max" />
                  <FieldError message={errors.name} />
                </div>
                <div>
                  <Label htmlFor="product-brand" className="mb-1.5 block text-xs text-muted-foreground">Brand</Label>
                  <Input id="product-brand" type="text" value={form.brand} onChange={(e) => update("brand", e.target.value)} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" placeholder="e.g. Apple" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="product-seller" className="mb-1.5 block text-xs text-muted-foreground">Seller <span className="text-rose-500">*</span></Label>
                  <Select value={form.seller_id} onValueChange={(v) => { onSellerChange(v); setErrors((x) => ({ ...x, seller_id: "", category_id: "" })) }}>
                    <SelectTrigger id="product-seller" className="h-auto rounded-xl px-4 py-2.5"><SelectValue placeholder="Assign to seller" /></SelectTrigger>
                    <SelectContent>
                      {sellers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.shop_name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.seller_id} />
                </div>
                <div>
                  <Label htmlFor="product-category" className="mb-1.5 block text-xs text-muted-foreground">
                    Category{!isBanexMall && sellerRoot ? ` (under ${sellerRoot.name})` : ""} <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={form.category_id} onValueChange={(v) => { update("category_id", v); setErrors((x) => ({ ...x, category_id: "" })) }} disabled={!form.seller_id}>
                    <SelectTrigger id="product-category" className="h-auto rounded-xl px-4 py-2.5">
                      <SelectValue placeholder={form.seller_id ? "Select category" : "Select a seller first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(({ node, depth }) => (
                        <SelectItem key={node.id} value={node.id}>
                          {depth > 0 ? `  ${"— ".repeat(depth)}${node.name}` : node.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.category_id} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Description</Label>
                <RichTextEditor value={form.description} onChange={(val) => update("description", val)} placeholder="Describe the product…" />
              </div>
            </div>
          )}

          {/* Step 1 — Media */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Product images</p>
                <p className="text-xs text-muted-foreground">Upload up to 5. Click the star to set the primary/featured image.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((img, i) => (
                  <div key={i} className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${primaryImageIndex === i ? "border-brand" : "border-border"} bg-muted`}>
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setPrimaryImageIndex(i)} title="Set as primary" className={`absolute left-1 top-1 h-auto w-auto rounded-full p-1.5 ${primaryImageIndex === i ? "bg-brand text-white hover:bg-brand" : "bg-black/50 text-white/50 hover:text-white hover:bg-black/50"}`}>
                      <Star className="h-3 w-3" fill={primaryImageIndex === i ? "currentColor" : "none"} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(i)} className="absolute right-1 top-1 h-auto w-auto rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/50">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                    <Upload className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Add Image</span>
                    <Input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
              <FieldError message={errors.images} />
            </div>
          )}

          {/* Step 2 — Pricing & Inventory */}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {!hasVariants && (
                <>
                  <div>
                    <Label htmlFor="product-price" className="mb-1.5 block text-xs text-muted-foreground">Regular Price (₦) <span className="text-rose-500">*</span></Label>
                    <Input id="product-price" type="number" value={form.regular_price} onChange={(e) => { update("regular_price", e.target.value); setErrors((x) => ({ ...x, regular_price: "" })) }} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" placeholder="350000" />
                    <FieldError message={errors.regular_price} />
                  </div>
                  <div>
                    <Label htmlFor="product-sale-price" className="mb-1.5 block text-xs text-muted-foreground">Sale Price (₦) <span className="text-muted-foreground/70">— optional</span></Label>
                    <Input id="product-sale-price" type="number" value={form.sales_price} onChange={(e) => { update("sales_price", e.target.value); setErrors((x) => ({ ...x, sales_price: "" })) }} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" placeholder="Leave blank for none" />
                    <FieldError message={errors.sales_price} />
                  </div>
                  <div>
                    <Label htmlFor="product-stock" className="mb-1.5 block text-xs text-muted-foreground">Stock Quantity</Label>
                    <Input id="product-stock" type="number" value={form.stock_quantity} onChange={(e) => update("stock_quantity", e.target.value)} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" placeholder="50" />
                    <FieldError message={errors.stock_quantity} />
                  </div>
                  {pricingPreview && (
                    <div className="sm:col-span-2 rounded-xl border border-brand/30 bg-brand-soft/10 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">Pricing breakdown</p>
                      <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">Listing price</p>
                          <p className="font-display font-bold">
                            {fmtNaira(pricingPreview.listing_price)}
                            {pricingPreview.is_on_sale && pricingPreview.regular_price != null && (
                              <span className="ml-1.5 text-xs font-medium text-muted-foreground line-through">{fmtNaira(pricingPreview.regular_price)}</span>
                            )}
                          </p>
                          {pricingPreview.is_on_sale && !!pricingPreview.discount_amount && (
                            <p className="text-[10px] font-semibold text-emerald-600">On sale · save {fmtNaira(pricingPreview.discount_amount)}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">Commission ({pricingPreview.commission_percent_label})</p>
                          <p className="font-display font-bold text-rose-600">−{fmtNaira(pricingPreview.commission_amount)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">Seller receives</p>
                          <p className="font-display font-bold text-emerald-600">{fmtNaira(pricingPreview.seller_receives)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="sm:col-span-2">
                <VariantsEditor enabled={hasVariants} onToggle={setHasVariants} rows={variantRows} onChange={setVariantRows} attrs={variantAttrs} onAttrsChange={setVariantAttrs} />
                <FieldError message={errors.variants} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="product-weight" className="mb-1.5 block text-xs text-muted-foreground">Weight (kg)</Label>
                <Input id="product-weight" type="number" step="0.01" value={form.weight_kg} onChange={(e) => update("weight_kg", e.target.value)} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" placeholder="1.5" />
              </div>
            </div>
          )}

          {/* Step 3 — Options (logistics + specs + flags) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Location</Label>
                  <LocationSelect value={form.location} onChange={(val) => update("location", val)} placeholder="Select state..." />
                </div>
                <div>
                  <Label htmlFor="product-delivery-estimate" className="mb-1.5 block text-xs text-muted-foreground">Delivery Estimate</Label>
                  <Input id="product-delivery-estimate" type="text" value={form.delivery_estimate} onChange={(e) => update("delivery_estimate", e.target.value)} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" placeholder="e.g. 3 - 5 days" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Specifications</p>
                <div className="space-y-2">
                  {specifications.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input type="text" value={spec.key} onChange={(e) => updateSpecification(i, "key", e.target.value)} placeholder="Key (e.g. Storage)" className="flex-1 rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                      <Input type="text" value={spec.value} onChange={(e) => updateSpecification(i, "value", e.target.value)} placeholder="Value (e.g. 512GB)" className="flex-1 rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeSpecification(i)} className="h-auto w-auto rounded-xl p-2.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="link" onClick={addSpecification} className="h-auto p-0 text-xs font-medium text-brand hover:underline">
                    + Add Specification
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
                <Label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox checked={form.is_nationwide_delivery} onCheckedChange={(v) => update("is_nationwide_delivery", v === true)} /> Nationwide Delivery
                </Label>
                <Label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox checked={form.is_authentic_only} onCheckedChange={(v) => update("is_authentic_only", v === true)} /> Authentic Only
                </Label>
                <Label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox checked={form.is_featured} onCheckedChange={(v) => update("is_featured", v === true)} /> Featured Product
                </Label>
                <Label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox checked={form.is_escrow_enabled} onCheckedChange={(v) => update("is_escrow_enabled", v === true)} /> Escrow Enabled
                </Label>
              </div>
            </div>
          )}

          {/* Step 4 — SEO */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-base font-semibold">Search engine optimization</h3>
                <p className="text-xs text-muted-foreground">Control how this product appears on Google and social shares.</p>
              </div>
              <SeoFieldsEditor value={seo} onChange={(patch) => setSeo((s) => ({ ...s, ...patch }))} />
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-semibold">Review Product</h3>
              <div className="grid gap-3 rounded-xl bg-surface/60 p-4 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Name:</span> <strong>{form.name || "—"}</strong></div>
                <div><span className="text-muted-foreground">Brand:</span> <strong>{form.brand || "—"}</strong></div>
                <div><span className="text-muted-foreground">Category:</span> <strong>{categories.find((c) => c.id === form.category_id)?.name || flattenCategories(categories).find((c) => c.node.id === form.category_id)?.node.name || "—"}</strong></div>
                <div><span className="text-muted-foreground">Seller:</span> <strong>{sellers.find((s) => s.id === form.seller_id)?.shop_name || "—"}</strong></div>
                {hasVariants ? (
                  <div><span className="text-muted-foreground">Variants:</span> <strong>{variantRows.length} option{variantRows.length !== 1 ? "s" : ""}</strong></div>
                ) : (
                  <div>
                    <span className="text-muted-foreground">Price:</span>{" "}
                    {form.sales_price.trim() !== "" && Number(form.sales_price) > 0 && Number(form.sales_price) < Number(form.regular_price) ? (
                      <strong>₦{Number(form.sales_price).toLocaleString()} <span className="font-normal text-muted-foreground line-through">₦{Number(form.regular_price || 0).toLocaleString()}</span></strong>
                    ) : (
                      <strong>₦{Number(form.regular_price || 0).toLocaleString()}</strong>
                    )}
                  </div>
                )}
                {!hasVariants && <div><span className="text-muted-foreground">Stock:</span> <strong>{form.stock_quantity || "—"}</strong></div>}
                <div><span className="text-muted-foreground">Weight:</span> <strong>{form.weight_kg ? `${form.weight_kg} kg` : "—"}</strong></div>
                <div><span className="text-muted-foreground">Images:</span> <strong>{images.length}</strong></div>
                <div><span className="text-muted-foreground">SEO:</span> <strong>{seo.title || seo.description || seo.keywords ? "Custom" : "Auto"}</strong></div>
              </div>
              <div className="text-xs text-muted-foreground prose prose-sm dark:prose-invert max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: form.description || "No description" }} />
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-4">
          <WizardFooter
            isFirst={step === 0}
            isLast={step === STEPS.length - 1}
            submitting={submitting}
            onBack={goBack}
            onNext={goNext}
            onSubmit={handleSubmit}
            submitLabel="Create Product"
          />
        </div>
      </div>
    </div>
  )
}
