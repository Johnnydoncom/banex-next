"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2, Star } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  fetchAdminCategories,
  fetchAdminSellers,
  createAdminProduct,
  AdminCategory,
  AdminSeller,
} from "@/lib/admin-api"
import { RichTextEditor } from "@/components/RichTextEditor"
import { LocationSelect } from "@/components/LocationSelect"

export default function AdminNewProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
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
  
  const [specifications, setSpecifications] = useState([{ key: "", value: "" }])
  
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const steps = ["Basic", "Images", "Pricing", "Specs", "Review"]

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  const addSpecification = () => setSpecifications(prev => [...prev, { key: "", value: "" }])
  const removeSpecification = (index: number) => setSpecifications(prev => prev.filter((_, i) => i !== index))
  const updateSpecification = (index: number, field: "key" | "value", val: string) => {
    setSpecifications(prev => {
      const next = [...prev]
      next[index][field] = val
      return next
    })
  }

  useEffect(() => {
    if (session?.accessToken) {
      loadData(session.accessToken)
    }
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
      const newImages = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      
      setImages(prev => {
        const combined = [...prev, ...newImages]
        return combined.slice(0, 5) // max 5 images
      })
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== indexToRemove)
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(prev[indexToRemove].preview)
      return newImages
    })
    
    // Reset primary index if necessary
    if (primaryImageIndex === indexToRemove) {
      setPrimaryImageIndex(0)
    } else if (primaryImageIndex > indexToRemove) {
      setPrimaryImageIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!session?.accessToken) return
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", form.name)
      formData.append("brand", form.brand)
      formData.append("category_id", form.category_id)
      formData.append("description", form.description)
      formData.append("price", form.price)
      formData.append("stock_quantity", form.stock_quantity)
      formData.append("seller_id", form.seller_id)
      formData.append("weight_kg", form.weight_kg)
      formData.append("location", form.location)
      formData.append("delivery_estimate", form.delivery_estimate)
      
      formData.append("is_nationwide_delivery", form.is_nationwide_delivery ? "1" : "0")
      formData.append("is_authentic_only", form.is_authentic_only ? "1" : "0")
      formData.append("is_featured", form.is_featured ? "1" : "0")
      formData.append("is_escrow_enabled", form.is_escrow_enabled ? "1" : "0")
      
      specifications.forEach(spec => {
        if (spec.key && spec.value) {
          formData.append("specifications[]", `${spec.key} => ${spec.value}`)
        }
      })
      
      formData.append("primary_image_index", String(primaryImageIndex))

      // Append real files for images
      images.forEach((img) => {
        formData.append("images[]", img.file)
      })

      await createAdminProduct(formData, session.accessToken)
      
      toast.success("Product created successfully!")
      router.push("/admin/products")
    } catch (err: any) {
      toast.error(err.message || "Failed to create product")
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="product-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">Product Name</label>
                <input id="product-name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. iPhone 16 Pro Max" />
              </div>
              <div>
                <label htmlFor="product-brand" className="mb-1.5 block text-xs font-medium text-muted-foreground">Brand</label>
                <input id="product-brand" type="text" value={form.brand} onChange={(e) => update("brand", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. Apple" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
              <RichTextEditor
                value={form.description}
                onChange={(val) => update("description", val)}
                placeholder="Describe the product…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="product-category" className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                <select id="product-category" value={form.category_id} onChange={(e) => update("category_id", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="product-seller" className="mb-1.5 block text-xs font-medium text-muted-foreground">Seller</label>
                <select id="product-seller" value={form.seller_id} onChange={(e) => update("seller_id", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                  <option value="">Assign to seller</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>{s.shop_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Location</label>
                <LocationSelect 
                  value={form.location} 
                  onChange={(val) => update("location", val)} 
                  placeholder="Select state..." 
                />
              </div>
              <div>
                <label htmlFor="product-delivery-estimate" className="mb-1.5 block text-xs font-medium text-muted-foreground">Delivery Estimate</label>
                <input id="product-delivery-estimate" type="text" value={form.delivery_estimate} onChange={(e) => update("delivery_estimate", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. 3 - 5 days" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Images */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload product images (up to 5). Click the star to set the primary/featured image.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <div key={i} className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${primaryImageIndex === i ? "border-brand" : "border-border"} bg-muted`}>
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  
                  <button onClick={() => setPrimaryImageIndex(i)} title="Set as primary" className={`absolute left-1 top-1 rounded-full p-1.5 transition-colors ${primaryImageIndex === i ? "bg-brand text-white" : "bg-black/50 text-white/50 hover:text-white"}`}>
                    <Star className="h-3 w-3" fill={primaryImageIndex === i ? "currentColor" : "none"} />
                  </button>

                  <button onClick={() => removeImage(i)} className="absolute right-1 top-1 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                  <Upload className="h-6 w-6" />
                  <span className="text-[10px] font-medium">Add Image</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Inventory */}
        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-price" className="mb-1.5 block text-xs font-medium text-muted-foreground">Price (₦)</label>
              <input id="product-price" type="number" value={form.price} onChange={(e) => update("price", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="350000" />
            </div>
            <div>
              <label htmlFor="product-stock" className="mb-1.5 block text-xs font-medium text-muted-foreground">Stock Quantity</label>
              <input id="product-stock" type="number" value={form.stock_quantity} onChange={(e) => update("stock_quantity", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="50" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="product-weight" className="mb-1.5 block text-xs font-medium text-muted-foreground">Weight (kg)</label>
              <input id="product-weight" type="number" step="0.01" value={form.weight_kg} onChange={(e) => update("weight_kg", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="1.5" />
            </div>
            
            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2 mt-2 pt-4 border-t border-border">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.is_nationwide_delivery} onChange={(e) => update("is_nationwide_delivery", e.target.checked)} className="rounded border-border text-brand focus:ring-brand h-4 w-4" />
                Nationwide Delivery
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.is_authentic_only} onChange={(e) => update("is_authentic_only", e.target.checked)} className="rounded border-border text-brand focus:ring-brand h-4 w-4" />
                Authentic Only
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} className="rounded border-border text-brand focus:ring-brand h-4 w-4" />
                Featured Product
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={form.is_escrow_enabled} onChange={(e) => update("is_escrow_enabled", e.target.checked)} className="rounded border-border text-brand focus:ring-brand h-4 w-4" />
                Escrow Enabled
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Specifications */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add key-value specifications for the product (e.g. Storage: 512GB).</p>
            {specifications.map((spec, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" value={spec.key} onChange={(e) => updateSpecification(i, "key", e.target.value)} placeholder="Key (e.g. Storage)" className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                <input type="text" value={spec.value} onChange={(e) => updateSpecification(i, "value", e.target.value)} placeholder="Value (e.g. 512GB)" className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                <button onClick={() => removeSpecification(i)} className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button onClick={addSpecification} className="text-xs font-medium text-brand hover:underline">
              + Add Specification
            </button>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-display text-base font-semibold">Review Product</h3>
            <div className="grid gap-3 rounded-xl bg-surface/60 p-4 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">Name:</span> <strong>{form.name || "—"}</strong></div>
              <div><span className="text-muted-foreground">Brand:</span> <strong>{form.brand || "—"}</strong></div>
              <div><span className="text-muted-foreground">Category:</span> <strong>{categories.find(c => c.id === form.category_id)?.name || "—"}</strong></div>
              <div><span className="text-muted-foreground">Seller:</span> <strong>{sellers.find(s => s.id === form.seller_id)?.shop_name || "—"}</strong></div>
              <div><span className="text-muted-foreground">Price:</span> <strong>₦{Number(form.price || 0).toLocaleString()}</strong></div>
              <div><span className="text-muted-foreground">Stock:</span> <strong>{form.stock_quantity || "—"}</strong></div>
              <div><span className="text-muted-foreground">Weight:</span> <strong>{form.weight_kg ? `${form.weight_kg} kg` : "—"}</strong></div>
              <div><span className="text-muted-foreground">Images:</span> <strong>{images.length}</strong></div>
            </div>
            <div 
              className="text-xs text-muted-foreground prose prose-sm dark:prose-invert max-w-none line-clamp-3"
              dangerouslySetInnerHTML={{ __html: form.description || "No description" }} 
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface disabled:opacity-40">
            Previous
          </button>
          {step < 4 ? (
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
