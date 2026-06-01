"use client"

import { useEffect, useState } from "react"
import { Search, Plus, PackageOpen, Edit2, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import Image from "next/image"

type Product = {
  id: string
  name: string
  price: number
  stock: number
  status: "active" | "draft" | "out_of_stock"
  image: string | null
}

export default function VendorProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    async function fetchProducts() {
      try {
        const token = (user as any).accessToken
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        
        const res = await fetch(`${apiUrl}/vendor/products`, { headers })
        const data = await res.json()
        if (cancelled) return
        setProducts(data?.data || [])
      } catch (err) {} finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchProducts()
    */

    // ----- MOCK DATA -----
    setTimeout(() => {
      if (cancelled) return
      setProducts([
        { id: "1", name: "MacBook Air M2", price: 55000, stock: 12, status: "active", image: "/assets/cat-laptop.jpg" },
        { id: "2", name: "Samsung Galaxy S23", price: 15000, stock: 0, status: "out_of_stock", image: "/assets/phone-1.jpg" },
      ])
      setLoading(false)
    }, 500)

    return () => { cancelled = true }
  }, [user])

  const removeProduct = async (id: string) => {
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      await fetch(`${apiUrl}/vendor/products/${id}`, { method: 'DELETE', headers })
    } catch (err) {}
    */
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success("Product deleted")
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your store inventory.</p>
        </div>
        <div className="flex gap-2">
          <label className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products"
              className="h-9 w-56 rounded-full border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
            />
          </label>
          <button className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> Add product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No products found</p>
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
                {filtered.map(p => (
                  <tr key={p.id} className="transition-colors hover:bg-surface/20">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded bg-surface">
                          {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" />}
                        </div>
                        <p className="font-medium">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold">₦{p.price.toLocaleString()}</td>
                    <td className="px-5 py-3">{p.stock}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        p.status === 'active' ? 'bg-emerald-500/15 text-emerald-700' :
                        p.status === 'out_of_stock' ? 'bg-rose-500/15 text-rose-700' :
                        'bg-surface text-muted-foreground'
                      }`}>
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-emerald-600">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeProduct(p.id)} className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
