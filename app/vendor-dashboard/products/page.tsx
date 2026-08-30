"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Plus, PackageOpen, Edit2, Trash2, ImageOff, Package2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { sellerUpdateStock, sellerDeleteProduct, type SellerProduct } from "@/lib/seller-api"
import { useSellerProducts, useCategories, useSellerApplication } from "@/hooks/use-swr-data"
import { subcategoriesOf, findCategory } from "@/lib/categories"
import { formatNaira, saleInfo } from "@/lib/products"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductWizardModal } from "./ProductWizardModal"

function statusBadge(status: string) {
  switch (status) {
    case "active": return "bg-emerald-500/15 text-emerald-700"
    case "pending": return "bg-amber-500/15 text-amber-700"
    case "rejected": return "bg-rose-500/15 text-rose-700"
    default: return "bg-surface text-muted-foreground"
  }
}

export default function VendorProductsPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined
  const searchParams = useSearchParams()

  const PER_PAGE = 12
  const [page, setPage] = useState(1)
  const [debouncedQ, setDebouncedQ] = useState("")
  const { products: fetchedProducts, pagination, loading: productsLoading, mutate: mutateProducts } = useSellerProducts(token, page, PER_PAGE, debouncedQ)
  const { categories } = useCategories()
  const { profile } = useSellerApplication(token)

  // Sellers are limited to the subcategories of their assigned (root) category.
  const rootCategory = findCategory(categories, profile?.category_id)
  const subCats = subcategoriesOf(categories, profile?.category_id)
  const allowedCategories = subCats.length ? subCats : rootCategory ? [rootCategory] : categories

  const [products, setProducts] = useState<SellerProduct[] | null>(null)
  const loading = productsLoading && products === null

  useEffect(() => {
    if (fetchedProducts) setProducts(fetchedProducts)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedProducts])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<SellerProduct | null>(null)

  // Stock update modal
  const [stockModalProduct, setStockModalProduct] = useState<SellerProduct | null>(null)
  const [stockVal, setStockVal] = useState("")
  const [savingStock, setSavingStock] = useState(false)
  const [stockEditId, setStockEditId] = useState<string | null>(null)

  const [q, setQ] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Debounce the search box into a server-side query (and reset to the first page).
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q.trim()); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  // Open the add-product wizard immediately when linked with ?add=1.
  useEffect(() => {
    if (searchParams.get("add") === "1") openAdd()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function openAdd() { setEditProduct(null); setShowModal(true) }
  function openEdit(p: SellerProduct) { setEditProduct(p); setShowModal(true) }

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
      await sellerUpdateStock(stockModalProduct.id, qty, token)
      setProducts((prev) => prev ? prev.map((p) => p.id === stockModalProduct.id ? { ...p, stock_quantity: qty } : p) : prev)
      setStockModalProduct(null)
      toast.success("Stock updated")
    } catch (e: any) {
      toast.error(e.message || "Failed to update stock")
    } finally {
      setSavingStock(false)
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

  const filtered = products ?? []
  const totalCount = pagination?.total ?? filtered.length
  const totalPages = pagination?.last_page ?? 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">{totalCount} listing{totalCount !== 1 ? "s" : ""} in your store</p>
        </div>
        <div className="flex gap-2">
          <label className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="h-9 w-52 rounded-full bg-card pl-9 pr-3 text-xs" />
          </label>
          <Button variant="ghost" type="button" onClick={openAdd} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add product
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
          {debouncedQ ? (
            <>
              <p className="mt-3 font-display font-semibold">No products match “{debouncedQ}”</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
            </>
          ) : (
            <>
              <p className="mt-3 font-display font-semibold">No products yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add your first product listing to start selling.</p>
              <Button variant="ghost" type="button" onClick={openAdd} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                <Plus className="h-3.5 w-3.5" /> Add first product
              </Button>
            </>
          )}
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
                      <td className="px-5 py-3 font-semibold">
                        {(() => {
                          const s = saleInfo(p)
                          return s.onSale ? (
                            <span className="flex items-center gap-1.5">
                              <span className="text-emerald-700">{formatNaira(s.effective)}</span>
                              <span className="text-[11px] font-normal text-muted-foreground line-through">{formatNaira(s.original!)}</span>
                            </span>
                          ) : (
                            formatNaira(p.price)
                          )
                        })()}
                      </td>
                      <td className="px-5 py-3">
                        {stockEditId === p.id ? (
                          <div className="flex items-center gap-1">
                            <Input type="number" value={stockVal} onChange={(e) => setStockVal(e.target.value)} className="h-7 w-16 px-2 text-xs" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleStockSave(p.id); if (e.key === "Escape") setStockEditId(null) }} />
                            <Button variant="ghost" type="button" onClick={() => handleStockSave(p.id)} className="text-emerald-600 hover:underline text-xs font-medium">Save</Button>
                            <Button variant="ghost" type="button" onClick={() => setStockEditId(null)} className="text-muted-foreground hover:text-foreground text-xs">Cancel</Button>
                          </div>
                        ) : (
                          <Button variant="ghost" type="button" onClick={() => { setStockEditId(p.id); setStockVal(String(p.stock_quantity ?? 0)) }} className="flex items-center gap-1 group text-sm hover:text-emerald-600">
                            {p.stock_quantity ?? 0}
                            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusBadge(p.status)}`}>{p.status}</span>
                        {p.rejection_reason && (
                          <p className="mt-1 text-[10px] text-rose-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {p.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" type="button" onClick={() => openStockModal(p)} title="Manage stock" className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 transition-colors">
                            <Package2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" type="button" onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" type="button" onClick={() => setDeleteId(p.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Page {pagination?.current_page ?? page} of {totalPages} · {totalCount} products</span>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-semibold disabled:opacity-40 hover:border-emerald-500">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button variant="ghost" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-semibold disabled:opacity-40 hover:border-emerald-500">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit product wizard (mounts fresh each open so drafts restore correctly) */}
      {showModal && token && (
        <ProductWizardModal
          editProduct={editProduct}
          token={token}
          allowedCategories={allowedCategories.map((c) => ({ id: c.id, name: c.name }))}
          rootCategory={rootCategory ? { name: rootCategory.name } : null}
          subCount={subCats.length}
          onClose={() => setShowModal(false)}
          onSaved={() => { mutateProducts(); setShowModal(false) }}
        />
      )}

      {/* Manage Stock Modal */}
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
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">New Stock Quantity</span>
              <Input type="number" min="0" value={stockVal} onChange={(e) => setStockVal(e.target.value)} placeholder="Enter new quantity" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleStockModalSave() }} />
            </label>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" type="button" onClick={handleStockModalSave} disabled={savingStock} className="flex-1 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-700 transition-colors">
                {savingStock ? "Updating…" : "Update Stock"}
              </Button>
              <Button variant="ghost" type="button" onClick={() => setStockModalProduct(null)} className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30 transition-colors">
                Cancel
              </Button>
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
              <Button variant="ghost" type="button" onClick={() => handleDelete(deleteId)} className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors">
                Delete
              </Button>
              <Button variant="ghost" type="button" onClick={() => setDeleteId(null)} className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30 transition-colors">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
