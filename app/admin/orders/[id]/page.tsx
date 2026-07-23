"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, MapPin, Truck, Calendar, ImageOff } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminOrder, updateAdminOrderStatus, cancelAdminOrder, sellerActionAdminOrder, type AdminOrder } from "@/lib/admin-api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  async function handleStatusChange(newStatus: string) {
    if (!token || !order) return
    setUpdating(true)
    try {
      if (newStatus === "cancelled") {
        if (confirm("Are you sure you want to cancel this order?")) {
          const res = await cancelAdminOrder(id, token)
          setOrder(res.data?.order ?? null)
          toast.success("Order cancelled")
        }
      } else if (newStatus === "process") {
        const res = await updateAdminOrderStatus(id, "in-process", token)
        setOrder(res.data?.order ?? null)
        toast.success("Order marked as processing")
      } else if (newStatus === "transit") {
        const res = await updateAdminOrderStatus(id, "in-transit", token)
        setOrder(res.data?.order ?? null)
        toast.success("Order marked as in transit")
      } else if (newStatus === "deliver") {
        const res = await updateAdminOrderStatus(id, "in-delivered", token)
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
          <Select
            value={order.status}
            onValueChange={handleStatusChange}
            disabled={updating || order.status === "cancelled" || order.status === "delivered"}
          >
            <SelectTrigger className="w-[180px] rounded-xl bg-card text-sm font-medium">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="process">Mark Processing</SelectItem>
              <SelectItem value="transit">Mark In Transit</SelectItem>
              <SelectItem value="deliver">Mark Delivered</SelectItem>
              <SelectItem value="cancelled">Cancel Order</SelectItem>
            </SelectContent>
          </Select>
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
            <h2 className="font-display text-base font-semibold border-b border-border pb-4">Order Items ({order.items?.length ?? order.item_count ?? 0})</h2>
            <ul className="divide-y divide-border">
              {order.items?.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <div className="relative flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
                    {item.primary_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.primary_image_url} alt={item.product_name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-6 w-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Sold by {item.seller_shop_name || "Unknown"}</p>
                    <div className="mt-1 text-sm font-medium">₦{item.unit_price?.toLocaleString()} × {item.quantity}</div>
                    {/* Per-item accept/decline for seller */}
                    {(item.status === "paid" || item.status === "pending") && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setItemAction({ itemId: item.id, action: "accept" })}
                          className="h-auto rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20"
                        >
                          Accept for Seller
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setItemAction({ itemId: item.id, action: "decline" })}
                          className="h-auto rounded-lg bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-500/20"
                        >
                          Decline for Seller
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="text-right font-semibold flex flex-col justify-between">
                    <span>₦{(item.line_total ?? (item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{item.status}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              {order.summary && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₦{order.summary.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span>₦{order.summary.delivery_fee?.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-base mt-2 pt-2">
                <span>Total</span>
                <span className="text-brand">₦{order.summary?.total?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Shipping */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2"><User className="h-4 w-4" /> Customer Details</h2>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">{order.user?.name || "Unknown Customer"}</p>
              <p className="text-muted-foreground">{order.user?.email}</p>
              {order.fulfillment_type && (
                <p className="text-xs text-muted-foreground capitalize">Fulfillment: {order.fulfillment_type.replace(/_/g, " ")}</p>
              )}
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
              <Textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                placeholder="Reason for declining..."
                rows={3}
                className="mt-4 resize-none rounded-xl px-3 py-2 focus-visible:border-brand focus-visible:ring-brand"
              />
            )}
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                onClick={() => handleItemAction()}
                disabled={itemActioning || (itemAction.action === "decline" && !declineReason.trim())}
                className={`h-auto flex-1 rounded-full py-2.5 text-sm font-semibold text-white ${
                  itemAction.action === "accept" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {itemActioning ? "Processing..." : itemAction.action === "accept" ? "Confirm Accept" : "Confirm Decline"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setItemAction(null); setDeclineReason("") }}
                className="h-auto flex-1 rounded-full bg-card py-2.5 text-sm font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
