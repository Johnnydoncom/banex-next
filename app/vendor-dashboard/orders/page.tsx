"use client"

import { useEffect, useState } from "react"
import { Search, Package } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

type VendorOrder = {
  id: string
  order_number: string
  status: string
  total: number
  customer_name: string
  created_at: string
}

const STATUSES = ["all", "pending", "processing", "shipped", "delivered"] as const

export default function VendorOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    async function fetchOrders() {
      try {
        const token = (user as any).accessToken
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        
        const res = await fetch(`${apiUrl}/vendor/orders`, { headers })
        const data = await res.json()
        if (cancelled) return
        setOrders(data?.data || [])
      } catch (err) {} finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchOrders()
    */

    // ----- MOCK DATA -----
    setTimeout(() => {
      if (cancelled) return
      setOrders([
        { id: "1", order_number: "ORD-999", status: "pending", total: 45000, customer_name: "John Doe", created_at: new Date().toISOString() },
        { id: "2", order_number: "ORD-998", status: "shipped", total: 12500, customer_name: "Jane Smith", created_at: new Date(Date.now() - 3600000).toISOString() },
      ])
      setLoading(false)
    }, 500)

    return () => { cancelled = true }
  }, [user])

  const updateStatus = async (id: string, status: string) => {
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      await fetch(`${apiUrl}/vendor/orders/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      })
    } catch (err) {}
    */
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    toast.success("Order status updated")
  }

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false
    if (q && !o.order_number.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Store Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and fulfill your customers&apos; orders.</p>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #"
            className="h-9 w-56 rounded-full border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === s
                ? "bg-emerald-600 text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/40">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(o => (
                  <tr key={o.id} className="transition-colors hover:bg-surface/20">
                    <td className="px-5 py-3 font-medium">{o.order_number}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">{o.customer_name}</td>
                    <td className="px-5 py-3 font-semibold">₦{o.total.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        o.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-700' :
                        o.status === 'shipped' ? 'bg-blue-500/15 text-blue-700' :
                        'bg-amber-500/15 text-amber-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <select 
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
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
