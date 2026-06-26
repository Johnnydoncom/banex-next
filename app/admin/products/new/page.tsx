"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, X } from "lucide-react"
import { toast } from "sonner"

export default function AdminNewProductPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    category: "",
    sku: "",
    stock: "",
    sellerId: "",
  })
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const steps = ["Basic Info", "Images", "Pricing & Inventory", "Review"]

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleImageAdd = () => {
    // In production, this would open a file picker and upload
    setImages((prev) => [...prev, `/assets/phone-1.jpg`])
    toast.info("Mock image added")
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => formData.append(k, v))
    // images would be File objects
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    await fetch(`${apiUrl}/admin/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: formData,
    })
    */

    await new Promise((r) => setTimeout(r, 1200))
    toast.success("Product created successfully!")
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold">Add Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a new product listing.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              i === step
                ? "bg-gradient-brand text-primary-foreground shadow-brand"
                : i < step
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-surface text-muted-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
              {i < step ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="product-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">Product Name</label>
              <input id="product-name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. iPhone 16 Pro Max" />
            </div>
            <div>
              <label htmlFor="product-description" className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea id="product-description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="Describe the product…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="product-category" className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                <select id="product-category" value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">Select category</option>
                  <option value="phones-tablets">Phones & Tablets</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="beauty">Beauty</option>
                  <option value="home-garden">Home & Garden</option>
                  <option value="food">Food</option>
                  <option value="vehicles">Vehicles</option>
                </select>
              </div>
              <div>
                <label htmlFor="product-seller" className="mb-1.5 block text-xs font-medium text-muted-foreground">Seller</label>
                <select id="product-seller" value={form.sellerId} onChange={(e) => update("sellerId", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">Assign to seller</option>
                  <option value="u1">Goldline Mobile</option>
                  <option value="u2">Glow Cosmetics</option>
                  <option value="u9">AutoParts NG</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Images */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload product images (up to 5).</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button onClick={handleImageAdd} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                  <Upload className="h-6 w-6" />
                  <span className="text-[10px] font-medium">Add Image</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-price" className="mb-1.5 block text-xs font-medium text-muted-foreground">Price (₦)</label>
              <input id="product-price" type="number" value={form.price} onChange={(e) => update("price", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="350000" />
            </div>
            <div>
              <label htmlFor="product-compare-price" className="mb-1.5 block text-xs font-medium text-muted-foreground">Compare-at Price (₦)</label>
              <input id="product-compare-price" type="number" value={form.comparePrice} onChange={(e) => update("comparePrice", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="400000" />
            </div>
            <div>
              <label htmlFor="product-sku" className="mb-1.5 block text-xs font-medium text-muted-foreground">SKU</label>
              <input id="product-sku" type="text" value={form.sku} onChange={(e) => update("sku", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="NTP-001" />
            </div>
            <div>
              <label htmlFor="product-stock" className="mb-1.5 block text-xs font-medium text-muted-foreground">Stock Quantity</label>
              <input id="product-stock" type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="50" />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-display text-base font-semibold">Review Product</h3>
            <div className="grid gap-3 rounded-xl bg-surface/60 p-4 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">Name:</span> <strong>{form.name || "—"}</strong></div>
              <div><span className="text-muted-foreground">Category:</span> <strong>{form.category || "—"}</strong></div>
              <div><span className="text-muted-foreground">Price:</span> <strong>₦{Number(form.price || 0).toLocaleString()}</strong></div>
              <div><span className="text-muted-foreground">Stock:</span> <strong>{form.stock || "—"}</strong></div>
              <div><span className="text-muted-foreground">SKU:</span> <strong>{form.sku || "—"}</strong></div>
              <div><span className="text-muted-foreground">Images:</span> <strong>{images.length}</strong></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {form.description?.slice(0, 150) || "No description"}
              {(form.description?.length ?? 0) > 150 ? "…" : ""}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40">
            Previous
          </button>
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} className="rounded-xl bg-gradient-brand px-5 py-2 text-xs font-semibold text-primary-foreground shadow-brand">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-gradient-brand px-5 py-2 text-xs font-semibold text-primary-foreground shadow-brand disabled:opacity-60">
              {submitting ? "Creating…" : "Create Product"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
