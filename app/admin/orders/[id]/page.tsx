"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, MapPin, Truck, Calendar, ImageOff } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminOrder, updateAdminOrderStatus, cancelAdminOrder, sellerActionAdminOrder, type AdminOrder } from "@/lib/admin-api"
import { toast } from "sonner"

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [itemAction, setItemAction] = useState<{ itemId: string; action: "accept" | "decline" } | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [itemActioning, setItemActioning] = useState(false)

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

  async function handleItemAction(confirm_action = false) {
    if (!itemAction || !token) return
    if (itemAction.action === "decline" && !declineReason.trim()) {
      toast.error("Please provide a reason for declining")
      return
    }
    setItemActioning(true)
    try {
      const res = await sellerActionAdminOrder(id, itemAction.itemId, itemAction.action, token, declineReason || undefined)
      setOrder(res.data?.order ?? null)
      toast.success(`Item ${itemAction.action === "accept" ? "accepted" : "declined"} successfully`)
      setItemAction(null)
      setDeclineReason("")
    } catch (err: any) {
      toast.error(err.message || `Failed to ${itemAction.action} item`)
    } finally {
      setItemActioning(false)
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
                    {/* Per-item accept/decline for seller */}
                    {item.status === "paid" && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setItemAction({ itemId: item.id, action: "accept" })}
                          className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 transition-colors"
                        >
                          Accept for Seller
                        </button>
                        <button
                          onClick={() => setItemAction({ itemId: item.id, action: "decline" })}
                          className="rounded-lg bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-500/20 transition-colors"
                        >
                          Decline for Seller
                        </button>
                      </div>
                    )}
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

      {/* Item Action Modal (Accept / Decline for Seller) */}
      {itemAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold capitalize">
              {itemAction.action} Item for Seller
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {itemAction.action === "accept"
                ? "This will accept the order item on behalf of the seller."
                : "Provide a reason for declining this item."}
            </p>
            {itemAction.action === "decline" && (
              <textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                placeholder="Reason for declining..."
                rows={3}
                className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
              />
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleItemAction()}
                disabled={itemActioning || (itemAction.action === "decline" && !declineReason.trim())}
                className={`flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-colors ${
                  itemAction.action === "accept" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {itemActioning ? "Processing..." : itemAction.action === "accept" ? "Confirm Accept" : "Confirm Decline"}
              </button>
              <button
                onClick={() => { setItemAction(null); setDeclineReason("") }}
                className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30"
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
