"use client"

import { use } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, MapPin, Truck, Calendar } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"

const mockOrder = {
  id: "o1",
  orderNumber: "ORD-1042",
  customer: {
    name: "Adewale Okonkwo",
    email: "adewale@example.com",
    phone: "+234 801 234 5678"
  },
  shippingAddress: "Block 4, Flat 2, 1004 Estate, Victoria Island, Lagos",
  status: "pending" as const,
  date: "2026-06-22T10:15:00Z",
  subtotal: 380000,
  shippingFee: 5000,
  total: 385000,
  items: [
    { id: "i1", name: "Noir Titan Pro", image: "/assets/phone-1.jpg", seller: "Goldline Mobile", price: 350000, quantity: 1 },
    { id: "i2", name: "Classic White Sneakers", image: "/assets/cat-sneakers.jpg", seller: "Vogue Boutique", price: 30000, quantity: 1 },
  ]
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const order = mockOrder

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="flex items-center gap-3">
          <select className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium outline-none">
            <option value="pending">Mark Pending</option>
            <option value="processing">Mark Processing</option>
            <option value="shipped">Mark Shipped</option>
            <option value="delivered">Mark Delivered</option>
            <option value="cancelled">Cancel Order</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{order.orderNumber}</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(order.date).toLocaleString()}</span>
          </div>
        </div>
        <StatusBadge status={order.status} className="px-3 py-1 text-xs" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold border-b border-border pb-4">Order Items ({order.items.length})</h2>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl border border-border">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Sold by {item.seller}</p>
                    <div className="mt-1 text-sm font-medium">₦{item.price.toLocaleString()} × {item.quantity}</div>
                  </div>
                  <div className="text-right font-semibold">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₦{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Fee</span>
                <span>₦{order.shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-border/50">
                <span>Total</span>
                <span className="text-brand">₦{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Shipping */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2"><User className="h-4 w-4" /> Customer Details</h2>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">{order.customer.name}</p>
              <p className="text-muted-foreground">{order.customer.email}</p>
              <p className="text-muted-foreground">{order.customer.phone}</p>
              <Link href="/admin/users/u1" className="text-brand hover:underline text-xs font-medium mt-2 block">View full profile</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4" /> Shipping Address</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{order.shippingAddress}</p>
          </div>
          
          <div className="rounded-2xl border border-border bg-card p-6">
             <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2"><Truck className="h-4 w-4" /> Delivery Status</h2>
             <div className="text-sm">
                <div className="relative pl-6 pb-4 border-l-2 border-brand ml-2">
                    <span className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-brand"></span>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleString()}</p>
                </div>
                <div className="relative pl-6 ml-2">
                    <span className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-border"></span>
                    <p className="font-medium text-muted-foreground">Processing</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
