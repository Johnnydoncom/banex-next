"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, MapPin, Truck, Calendar, ImageOff } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminOrder, updateAdminOrderStatus, cancelAdminOrder, type AdminOrder } from "@/lib/admin-api"
import { toast } from "sonner"

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchAdminOrder(id, token)
      .then((res) => setOrder(res.data?.order ?? null))
      .catch((e) => toast.error(e.message || "Failed to load order"))
      .finally(() => setLoading(false))
  }, [id, token])

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!token || !order) return
    const newStatus = e.target.value
    setUpdating(true)
    try {
      if (newStatus === "cancelled") {
        if (confirm("Are you sure you want to cancel this order?")) {
          const res = await cancelAdminOrder(id, token)
          setOrder(res.data?.order ?? null)
          toast.success("Order cancelled")
        }
      } else if (newStatus === "process") {
        const res = await updateAdminOrderStatus(id, "process", token)
        setOrder(res.data?.order ?? null)
        toast.success("Order marked as processing")
      } else if (newStatus === "transit") {
        const res = await updateAdminOrderStatus(id, "transit", token)
        setOrder(res.data?.order ?? null)
        toast.success("Order marked as in transit")
      } else if (newStatus === "deliver") {
        const res = await updateAdminOrderStatus(id, "deliver", token)
        setOrder(res.data?.order ?? null)
        toast.success("Order marked as delivered")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-card" />
        <div className="h-32 animate-pulse rounded-2xl bg-card" />
        <div className="h-64 animate-pulse rounded-2xl bg-card" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Order not found. <Link href="/admin/orders" className="text-brand hover:underline">Go back</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="flex items-center gap-3">
          <select 
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium outline-none disabled:opacity-50"
            value={order.status}
            onChange={handleStatusChange}
            disabled={updating || order.status === "cancelled" || order.status === "delivered"}
          >
            <option value="pending" disabled>Pending</option>
            <option value="process">Mark Processing</option>
            <option value="transit">Mark In Transit</option>
            <option value="deliver">Mark Delivered</option>
            <option value="cancelled">Cancel Order</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{order.reference}</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(order.created_at.item).toLocaleString()}</span>
          </div>
        </div>
        <StatusBadge status={order.status} className="px-3 py-1 text-xs" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold border-b border-border pb-4">Order Items ({order.items?.length || 0})</h2>
            <ul className="divide-y divide-border">
              {order.items?.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <div className="relative flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
                    <ImageOff className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Sold by {item.seller?.shop_name || "Unknown"}</p>
                    <div className="mt-1 text-sm font-medium">₦{item.unit_price?.toLocaleString()} × {item.quantity}</div>
                  </div>
                  <div className="text-right font-semibold flex flex-col justify-between">
                    <span>₦{((item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{item.status}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between font-bold text-base mt-2 pt-2">
                <span>Total</span>
                <span className="text-brand">₦{order.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Shipping */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2"><User className="h-4 w-4" /> Customer Details</h2>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">{order.customer?.full_name || "Unknown Customer"}</p>
              <p className="text-muted-foreground">{order.customer?.email}</p>
              <Link href={`/admin/users/customers`} className="text-brand hover:underline text-xs font-medium mt-2 block">View all customers</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
             <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2"><Truck className="h-4 w-4" /> Status Timeline</h2>
             <div className="text-sm">
                <div className="relative pl-6 pb-4 border-l-2 border-brand ml-2">
                    <span className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-brand"></span>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at.item).toLocaleString()}</p>
                </div>
                <div className="relative pl-6 pb-4 border-l-2 border-border ml-2">
                    <span className={`absolute -left-[5px] top-0 h-2 w-2 rounded-full ${order.status !== "pending" ? "bg-brand" : "bg-border"}`}></span>
                    <p className={`font-medium ${order.status !== "pending" ? "" : "text-muted-foreground"}`}>Processing</p>
                </div>
                <div className="relative pl-6 ml-2">
                    <span className={`absolute -left-[5px] top-0 h-2 w-2 rounded-full ${order.status === "delivered" ? "bg-brand" : "bg-border"}`}></span>
                    <p className={`font-medium ${order.status === "delivered" ? "" : "text-muted-foreground"}`}>Delivered</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
