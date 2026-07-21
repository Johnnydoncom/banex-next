"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Package, Truck, Home } from "lucide-react"

const steps = [
  { icon: CheckCircle2, label: "Order placed", time: "Today, 9:12 AM" },
  { icon: Package, label: "Packed by seller", time: "Today, 11:40 AM" },
  { icon: Truck, label: "Out for delivery", time: "In transit" },
  { icon: Home, label: "Delivered", time: "Pending" },
]

export function TrackOrderForm() {
  const [orderId, setOrderId] = useState("")
  const [shown, setShown] = useState<string | null>(null)

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setShown(orderId || "BNX-DEMO-001")
        }}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row"
      >
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="e.g. BNX-2026-04823"
          className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-brand"
        />
        <button type="submit" className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-brand px-8 text-sm font-semibold text-primary-foreground">
          Track
        </button>
      </form>

      {shown && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Order ID</p>
              <p className="font-display text-lg font-bold">{shown}</p>
            </div>
            <span className="rounded-full bg-brand-soft/30 px-3 py-1 text-xs font-semibold text-brand-deep">In transit</span>
          </div>
          <ol className="mt-6 space-y-5">
            {steps.map((s, i) => {
              const Icon = i < 3 ? s.icon : Circle
              const active = i < 3
              return (
                <li key={s.label} className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-brand text-primary-foreground" : "bg-surface text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.time}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </>
  )
}
