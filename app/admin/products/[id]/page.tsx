"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Check, X, Power, PowerOff, Store, Tag, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { fetchAdminProduct, updateAdminProductStatus, type AdminProduct } from "@/lib/admin-api"

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (session?.accessToken) {
      loadProduct()
    }
  }, [session])

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

  const handleAction = async (action: "approve" | "reject" | "activate" | "deactivate") => {
    if (!product || !session?.accessToken) return
    setActionLoading(true)

    try {
      await updateAdminProductStatus(product.id, action, session.accessToken)
      
      const statusMap: Record<string, AdminProduct["status"]> = {
        approve: "active",
        reject: "rejected",
        activate: "active",
        deactivate: "inactive",
      }
      
      setProduct((prev) => prev ? { ...prev, status: statusMap[action] || prev.status } : null)
      toast.success(`Product ${action}d successfully.`)
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} product`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <h2 className="text-xl font-bold">Product not found</h2>
        <Link href="/admin/products" className="text-brand hover:underline">Return to products</Link>
      </div>
    )
  }

  const images = product.images?.length > 0 
    ? product.images.sort((a, b) => a.sort_order - b.sort_order).map(i => i.url) 
    : ["/assets/placeholder.jpg"]

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Images */}
        <div className="space-y-3 lg:col-span-1">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl border border-border">
              <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold">{product.name}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={product.status as any} />
                  {product.brand && <span className="text-xs text-muted-foreground">Brand: {product.brand}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {product.status === "pending" && (
                  <>
                    <button onClick={() => handleAction("approve")} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"><Check className="h-3.5 w-3.5" /> Approve</button>
                    <button onClick={() => handleAction("reject")} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"><X className="h-3.5 w-3.5" /> Reject</button>
                  </>
                )}
                {product.status === "active" && (
                  <button onClick={() => handleAction("deactivate")} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-60"><PowerOff className="h-3.5 w-3.5" /> Deactivate</button>
                )}
                {product.status === "inactive" && (
                  <button onClick={() => handleAction("activate")} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"><Power className="h-3.5 w-3.5" /> Activate</button>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Price</p>
                <p className="mt-1 font-display text-xl font-bold">{product.currency === "NGN" ? "₦" : product.currency}{product.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Location</p>
                <p className="mt-1 text-sm font-semibold">{product.location || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Category</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm"><Tag className="h-3.5 w-3.5 text-brand" /> {product.category?.name || "Uncategorized"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Seller</p>
                <Link href={`/admin/sellers/${product.seller?.slug || product.seller_id}`} className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                  <Store className="h-3.5 w-3.5" /> {product.seller?.shop_name || "Unknown"}
                </Link>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-base font-semibold">Description</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold">Metadata</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(product.created_at.item).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Product ID</p>
                <p className="text-sm font-mono text-xs">{product.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reviews</p>
                <p className="text-sm">{product.reviews_count} (Avg: {product.rating_average || 0})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Flags</p>
                <p className="text-sm">
                  {product.is_featured ? "Featured, " : ""}
                  {product.is_escrow_enabled ? "Escrow" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
