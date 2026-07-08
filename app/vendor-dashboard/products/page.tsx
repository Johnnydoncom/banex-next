"use client"

import { useEffect, useState, useRef } from "react"
import { Search, Plus, PackageOpen, Edit2, Trash2, X, ImageOff, Package2, AlertCircle, ChevronUp, ChevronDown } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  sellerFetchProducts, sellerCreateProduct, sellerUpdateProduct,
  sellerUpdateStock, sellerDeleteProduct, type SellerProduct
} from "@/lib/seller-api"
import { fetchGenericCategories, type GenericCategory } from "@/lib/generic-api"
import { formatNaira } from "@/lib/products"

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

export default function VendorProductsPage() {
  const { user, session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [products, setProducts] = useState<SellerProduct[]>([])
  const [categories, setCategories] = useState<GenericCategory[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<SellerProduct | null>(null)
  const [form, setForm] = useState<ProductForm>(defaultForm())
  const [saving, setSaving] = useState(false)
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])

  // Stock update inline
  const [stockEditId, setStockEditId] = useState<string | null>(null)
  const [stockVal, setStockVal] = useState("")

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([sellerFetchProducts(token), fetchGenericCategories()])
      .then(([prods, cats]) => {
        setProducts(prods)
        setCategories(cats?.categories ?? [])
      })
      .catch((e) => toast.error(e.message || "Failed to load products"))
      .finally(() => setLoading(false))
  }, [token])

  function openAdd() {
    setEditProduct(null)
    setForm(defaultForm())
    setImagePreviewUrls([])
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
    setImagePreviewUrls(p.images?.map((i) => i.url) ?? [])
    setShowModal(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setForm((f) => ({ ...f, images: [...f.images, ...files] }))
    files.forEach((file) => {
      const url = URL.createObjectURL(file)
      setImagePreviewUrls((prev) => [...prev, url])
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
      fd.append("primary_image_index", String(form.primary_image_index))
      form.specifications.filter(Boolean).forEach((s, i) => fd.append(`specifications[${i}]`, s))
      form.images.forEach((img) => fd.append("images[]", img))

      if (editProduct) {
        fd.append("_method", "PUT")
        const updated = await sellerUpdateProduct(editProduct.id, fd, token)
        if (updated) setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p))
        toast.success("Product updated")
      } else {
        const created = await sellerCreateProduct(fd, token)
        if (created) setProducts((prev) => [created, ...prev])
        toast.success("Product created")
      }
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
      setProducts((prev) => prev.filter((p) => p.id !== id))
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
      const updated = await sellerUpdateStock(id, qty, token)
      if (updated) setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p))
      setStockEditId(null)
      toast.success("Stock updated")
    } catch (e: any) {
      toast.error(e.message || "Failed to update stock")
    }
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} listing{products.length !== 1 ? "s" : ""} in your store</p>
        </div>
        <div className="flex gap-2">
          <label className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products"
              className="h-9 w-52 rounded-full border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
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
                            <input
                              type="number"
                              value={stockVal}
                              onChange={(e) => setStockVal(e.target.value)}
                              className="h-7 w-16 rounded border border-border bg-background px-2 text-xs outline-none focus:border-emerald-500"
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
                  {imagePreviewUrls.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setForm((f) => ({ ...f, primary_image_index: i }))}
                      className={`relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${form.primary_image_index === i ? "border-emerald-500 shadow-emerald-500/30 shadow-md" : "border-border"}`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      {form.primary_image_index === i && (
                        <span className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-center text-[9px] font-bold text-white py-0.5">PRIMARY</span>
                      )}
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
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Samsung Galaxy S24" />
              </F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Brand">
                  <input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="e.g. Samsung" />
                </F>
                <F label="Category *">
                  <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="select-input">
                    <option value="">Select...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </F>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <F label="Price (₦) *">
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0" />
                </F>
                <F label="Stock Qty *">
                  <input type="number" value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} placeholder="0" />
                </F>
                <F label="Weight (kg) *">
                  <input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} placeholder="0.5" />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Location">
                  <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Banex Mall" />
                </F>
                <F label="Delivery Estimate">
                  <input value={form.delivery_estimate} onChange={(e) => setForm((f) => ({ ...f, delivery_estimate: e.target.value }))} placeholder="e.g. 1-2 days" />
                </F>
              </div>
              <F label="Description *">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe your product..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </F>

              {/* Specifications */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Specifications</label>
                <div className="space-y-2">
                  {form.specifications.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={s}
                        onChange={(e) => {
                          const specs = [...form.specifications]
                          specs[i] = e.target.value
                          setForm((f) => ({ ...f, specifications: specs }))
                        }}
                        placeholder={`Spec ${i + 1} (e.g. RAM: 8GB)`}
                        className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500"
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
const _selectCls = "h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500"
declare module "react" {
  // Extend CSSProperties if needed — no-op
}

// Add a style element for the .select-input class used above:
if (typeof document !== "undefined") {
  const style = document.getElementById("vcss") || document.createElement("style")
  style.id = "vcss"
  style.textContent = `
    .select-input { height:2.25rem; width:100%; border-radius:0.75rem; border:1px solid hsl(var(--border)); background:hsl(var(--background)); padding-left:0.75rem; padding-right:0.75rem; font-size:0.875rem; outline:none; }
    .select-input:focus { border-color: rgb(16 185 129); }
  `
  if (!document.getElementById("vcss")) document.head.appendChild(style)
}

// For all text inputs within F labels, add standard classes — use a wrapper
// Actually simpler: apply the class directly in the JSX above. Let's ensure:
// Add className to all inputs inside F via the style override approach
if (typeof document !== "undefined") {
  const style2 = document.getElementById("vcss2") || document.createElement("style")
  style2.id = "vcss2"
  style2.textContent = `
    label input:not([type=checkbox]):not([type=file]), label textarea {
      display:block; width:100%; border-radius:0.75rem; border:1px solid hsl(var(--border));
      background:hsl(var(--background)); padding:0.5rem 0.75rem; font-size:0.875rem; outline:none;
    }
    label input:not([type=checkbox]):not([type=file]) { height:2.25rem; }
    label input:not([type=checkbox]):not([type=file]):focus,
    label textarea:focus { border-color: rgb(16 185 129); }
  `
  if (!document.getElementById("vcss2")) document.head.appendChild(style2)
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-muted-foreground/30"}`}
      >
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </label>
  )
}
