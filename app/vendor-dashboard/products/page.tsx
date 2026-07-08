"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Plus, PackageOpen, Edit2, Trash2, X, ImageOff, Package2, AlertCircle, ChevronUp, ChevronDown, BarChart2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  sellerCreateProduct, sellerUpdateProduct,
  sellerUpdateStock, sellerDeleteProduct, sellerPricingPreview,
  type SellerProduct, type PricingSummary
} from "@/lib/seller-api"
import { useSellerProducts, useCategories } from "@/hooks/use-swr-data"
import { formatNaira } from "@/lib/products"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
type ProductForm = {
  name: string
  brand: string
  category_id: string
  description: string
  price: string
  stock_quantity: string
  weight_kg: string
  location: string
  delivery_estimate: string
  is_nationwide_delivery: boolean
  is_authentic_only: boolean
  specifications: string[]
  images: File[]
  primary_image_index: number
}

const defaultForm = (): ProductForm => ({
  name: "",
  brand: "",
  category_id: "",
  description: "",
  price: "",
  stock_quantity: "",
  weight_kg: "",
  location: "",
  delivery_estimate: "",
  is_nationwide_delivery: false,
  is_authentic_only: true,
  specifications: [""],
  images: [],
  primary_image_index: 0,
})

function statusBadge(status: string) {
  switch (status) {
    case "active": return "bg-emerald-500/15 text-emerald-700"
    case "pending": return "bg-amber-500/15 text-amber-700"
    case "rejected": return "bg-rose-500/15 text-rose-700"
    default: return "bg-surface text-muted-foreground"
  }
}

type PreviewImg = { url: string; file?: File; id?: string }

export default function VendorProductsPage() {
  const { user, session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const { products: fetchedProducts, loading: productsLoading, mutate: mutateProducts } = useSellerProducts(token)
  const { categories } = useCategories()

  const [products, setProducts] = useState<SellerProduct[] | null>(null)
  const loading = productsLoading && products === null

  // Sync SWR data into local state so we can do optimistic updates
  useEffect(() => {
    if (fetchedProducts && products === null) {
      setProducts(fetchedProducts)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedProducts])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<SellerProduct | null>(null)
  const [form, setForm] = useState<ProductForm>(defaultForm())
  const [saving, setSaving] = useState(false)
  const [previewImages, setPreviewImages] = useState<PreviewImg[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])

  // Stock update modal
  const [stockModalProduct, setStockModalProduct] = useState<SellerProduct | null>(null)
  const [stockVal, setStockVal] = useState("")
  const [savingStock, setSavingStock] = useState(false)

  // Inline stock edit (table row)
  const [stockEditId, setStockEditId] = useState<string | null>(null)

  // Pricing preview
  const [pricingPreview, setPricingPreview] = useState<PricingSummary | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [q, setQ] = useState("")

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use effect only for the debounced pricing preview (not data loading)
  useEffect(() => {
    if (!token || !showModal) return
    const price = parseFloat(form.price)
    if (!form.price || isNaN(price) || price <= 0) {
      setPricingPreview(null)
      return
    }
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    previewTimerRef.current = setTimeout(async () => {
      setLoadingPreview(true)
      try {
        const summary = await sellerPricingPreview(price, token)
        setPricingPreview(summary)
      } catch {
        setPricingPreview(null)
      } finally {
        setLoadingPreview(false)
      }
    }, 800)
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current) }
  }, [form.price, token, showModal])

  function openAdd() {
    setEditProduct(null)
    setForm(defaultForm())
    setPreviewImages([])
    setDeletedImageIds([])
    setPricingPreview(null)
    setShowModal(true)
  }

  function openEdit(p: SellerProduct) {
    setEditProduct(p)
    setForm({
      name: p.name,
      brand: p.brand ?? "",
      category_id: p.category_id ?? "",
      description: p.description ?? "",
      price: String(p.price),
      stock_quantity: String(p.stock_quantity ?? ""),
      weight_kg: String(p.weight_kg ?? ""),
      location: p.location ?? "",
      delivery_estimate: p.delivery_estimate ?? "",
      is_nationwide_delivery: p.is_nationwide_delivery,
      is_authentic_only: p.is_authentic_only,
      specifications: p.specifications?.length ? p.specifications : [""],
      images: [],
      primary_image_index: 0,
    })
    setPreviewImages(p.images?.map((i) => ({ url: i.url, id: i.id })) ?? [])
    setDeletedImageIds([])
    setPricingPreview(null)
    setShowModal(true)
  }

  function openStockModal(p: SellerProduct) {
    setStockModalProduct(p)
    setStockVal(String(p.stock_quantity ?? 0))
  }

  async function handleStockModalSave() {
    if (!token || !stockModalProduct) return
    const qty = parseInt(stockVal)
    if (isNaN(qty) || qty < 0) { toast.error("Invalid quantity"); return }
    setSavingStock(true)
    try {
      const updated = await sellerUpdateStock(stockModalProduct.id, qty, token)
      if (updated) {
        setProducts((prev) => prev ? prev.map((p) => p.id === stockModalProduct.id ? { ...p, stock_quantity: qty } : p) : prev)
      } else {
        // API returned no body — update locally
        setProducts((prev) => prev ? prev.map((p) => p.id === stockModalProduct.id ? { ...p, stock_quantity: qty } : p) : prev)
      }
      setStockModalProduct(null)
      toast.success("Stock updated")
    } catch (e: any) {
      toast.error(e.message || "Failed to update stock")
    } finally {
      setSavingStock(false)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), file }))
    setPreviewImages((prev) => [...prev, ...newPreviews])
  }

  function removeImage(index: number, e: React.MouseEvent) {
    e.stopPropagation()
    const img = previewImages[index]
    if (img.id) {
      setDeletedImageIds((prev) => [...prev, img.id!])
    }
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
    
    setForm(f => {
      let newPrimary = f.primary_image_index
      if (newPrimary === index) {
        newPrimary = 0
      } else if (newPrimary > index) {
        newPrimary = newPrimary - 1
      }
      return { ...f, primary_image_index: newPrimary }
    })
  }

  async function handleSave() {
    if (!token) return
    if (!form.name || !form.price || !form.category_id) {
      toast.error("Name, price, and category are required")
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("brand", form.brand)
      fd.append("category_id", form.category_id)
      fd.append("description", form.description)
      fd.append("price", form.price)
      fd.append("stock_quantity", form.stock_quantity)
      fd.append("weight_kg", form.weight_kg)
      fd.append("location", form.location)
      fd.append("delivery_estimate", form.delivery_estimate)
      fd.append("is_nationwide_delivery", form.is_nationwide_delivery ? "1" : "0")
      fd.append("is_authentic_only", form.is_authentic_only ? "1" : "0")
      // Handle primary image logic (id for existing, index relative to new files for new uploads)
      const primaryImg = previewImages[form.primary_image_index]
      if (primaryImg) {
        if (primaryImg.id) {
          fd.append("primary_image_id", primaryImg.id)
        } else {
          // Find the index of this new image among the filtered new images
          const newImagesList = previewImages.filter(img => img.file)
          const newIdx = newImagesList.findIndex(img => img === primaryImg)
          if (newIdx !== -1) {
            fd.append("primary_image_index", String(newIdx))
          }
        }
      }

      form.specifications.filter(Boolean).forEach((s, i) => fd.append(`specifications[${i}]`, s))
      previewImages.filter(img => img.file).forEach(img => fd.append("images[]", img.file!))
      
      if (editProduct && deletedImageIds.length > 0) {
        deletedImageIds.forEach(id => fd.append("delete_image_ids[]", id))
      }

      if (editProduct) {
        fd.append("_method", "PUT")
        await sellerUpdateProduct(editProduct.id, fd, token)
        toast.success("Product updated")
      } else {
        await sellerCreateProduct(fd, token)
        toast.success("Product created")
      }
      mutateProducts()
      setShowModal(false)
    } catch (e: any) {
      toast.error(e.message || "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!token) return
    try {
      await sellerDeleteProduct(id, token)
      mutateProducts()
      setDeleteId(null)
      toast.success("Product deleted")
    } catch (e: any) {
      toast.error(e.message || "Failed to delete")
    }
  }

  async function handleStockSave(id: string) {
    if (!token) return
    const qty = parseInt(stockVal)
    if (isNaN(qty) || qty < 0) { toast.error("Invalid quantity"); return }
    try {
      await sellerUpdateStock(id, qty, token)
      mutateProducts()
      setStockEditId(null)
      toast.success("Stock updated")
    } catch (e: any) {
      toast.error(e.message || "Failed to update stock")
    }
  }

  const filtered = (products ?? []).filter((p) => {
    if (!q) return true
    return p.name.toLowerCase().includes(q.toLowerCase())
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">{(products ?? []).length} listing{(products ?? []).length !== 1 ? "s" : ""} in your store</p>
        </div>
        <div className="flex gap-2">
          <label className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products"
              className="h-9 w-52 rounded-full bg-card pl-9 pr-3 text-xs"
            />
          </label>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-display font-semibold">No products yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add your first product listing to start selling.</p>
          <button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" /> Add first product
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/40">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const primaryImage = p.images?.find((i) => i.is_primary)?.url ?? p.images?.[0]?.url
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-surface/20">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-surface border border-border">
                            {primaryImage ? (
                              <img src={primaryImage} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground/40" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{p.name}</p>
                            <p className="text-[11px] text-muted-foreground">{p.category?.name ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold">{formatNaira(p.price)}</td>
                      <td className="px-5 py-3">
                        {stockEditId === p.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={stockVal}
                              onChange={(e) => setStockVal(e.target.value)}
                              className="h-7 w-16 px-2 text-xs"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") handleStockSave(p.id); if (e.key === "Escape") setStockEditId(null) }}
                            />
                            <button onClick={() => handleStockSave(p.id)} className="text-emerald-600 hover:underline text-xs font-medium">Save</button>
                            <button onClick={() => setStockEditId(null)} className="text-muted-foreground hover:text-foreground text-xs">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setStockEditId(p.id); setStockVal(String(p.stock_quantity ?? 0)) }}
                            className="flex items-center gap-1 group text-sm hover:text-emerald-600"
                          >
                            {p.stock_quantity ?? 0}
                            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusBadge(p.status)}`}>
                          {p.status}
                        </span>
                        {p.rejection_reason && (
                          <p className="mt-1 text-[10px] text-rose-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {p.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openStockModal(p)}
                            title="Manage stock"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                          >
                            <Package2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div
            className="relative flex h-screen w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold">{editProduct ? "Edit Product" : "Add Product"}</h2>
                <p className="text-xs text-muted-foreground">Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form body */}
            <div className="flex-1 space-y-5 p-6">
              {/* Images */}
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
                      <button
                        type="button"
                        onClick={(e) => removeImage(i, e)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-rose-500 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[9px] font-semibold">Add photo</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Click an image to set it as primary.</p>
              </div>

              {/* Basic info */}
              <F label="Product Name *">
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Samsung Galaxy S24" />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Brand">
                  <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="e.g. Samsung" />
                </F>
                <F label="Category *">
                  <Select value={form.category_id} onValueChange={(val) => setForm((f) => ({ ...f, category_id: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <F label="Price (₦) *">
                  <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0" />
                </F>
                <F label="Stock Qty">
                  <Input type="number" value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} placeholder="0" />
                </F>
                <F label="Weight (kg)">
                  <Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} placeholder="0.5" />
                </F>
              </div>

              {/* Pricing preview panel */}
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
                        <span className="font-semibold">{formatNaira(pricingPreview.listing_price)}</span>
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
              <div className="grid grid-cols-2 gap-4">
                <F label="Location">
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Banex Mall" />
                </F>
                <F label="Delivery Estimate">
                  <Input value={form.delivery_estimate} onChange={(e) => setForm((f) => ({ ...f, delivery_estimate: e.target.value }))} placeholder="e.g. 1-2 days" />
                </F>
              </div>
              <F label="Description *">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe your product..."
                />
              </F>

              {/* Specifications */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Specifications</label>
                <div className="space-y-2">
                  {form.specifications.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={s}
                        onChange={(e) => {
                          const specs = [...form.specifications]
                          specs[i] = e.target.value
                          setForm((f) => ({ ...f, specifications: specs }))
                        }}
                        placeholder={`Spec ${i + 1} (e.g. RAM: 8GB)`}
                      />
                      {form.specifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, specifications: f.specifications.filter((_, j) => j !== i) }))}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-rose-500 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, specifications: [...f.specifications, ""] }))}
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add specification
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <Toggle
                  checked={form.is_nationwide_delivery}
                  onChange={(v) => setForm((f) => ({ ...f, is_nationwide_delivery: v }))}
                  label="Nationwide delivery available"
                />
                <Toggle
                  checked={form.is_authentic_only}
                  onChange={(v) => setForm((f) => ({ ...f, is_authentic_only: v }))}
                  label="Authentic products only"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-border px-6 py-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-700 transition-colors"
              >
                {saving ? "Saving…" : editProduct ? "Update Product" : "Create Product"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-foreground/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Manage Stock Modal */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Package2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold">Manage Stock</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{stockModalProduct.name}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface/40 p-3 mb-4 text-xs text-muted-foreground">
              Current stock: <strong className="text-foreground">{stockModalProduct.stock_quantity ?? 0} units</strong>
            </div>

            <F label="New Stock Quantity">
              <Input
                type="number"
                min="0"
                value={stockVal}
                onChange={(e) => setStockVal(e.target.value)}
                placeholder="Enter new quantity"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleStockModalSave() }}
              />
            </F>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleStockModalSave}
                disabled={savingStock}
                className="flex-1 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-700 transition-colors"
              >
                {savingStock ? "Updating…" : "Update Stock"}
              </button>
              <button
                onClick={() => setStockModalProduct(null)}
                className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
              <Trash2 className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">Delete Product?</h3>
            <p className="mt-1 text-sm text-muted-foreground">This action cannot be undone. The listing will be permanently removed.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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

// Wrap inputs automatically with standard classes via cloneElement not available — use a wrapper approach
// The input inside F must have the right classes. Convenience: just apply them inline in each callsite above.
// Override select styling:
// Removed generic styles since we now use shadcn UI components natively.

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
