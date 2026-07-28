"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Check,
  Circle,
  Loader2,
  X,
  Minus,
  MapPin,
  Store,
  Truck,
  ShoppingBag,
  CreditCard,
  BadgeCheck,
  Package,
  PackageCheck,
  Home,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { userFetchOrderTracking, type OrderTrackingData } from "@/lib/user-api"
import { ApiError } from "@/lib/api-client"

// Human-friendly badge styling for the overall order status.
const STATUS_BADGE: Record<string, string> = {
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  refunded: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  intransit: "bg-brand-soft/30 text-brand-deep",
}

function statusBadgeClass(status: string) {
  return STATUS_BADGE[status.toLowerCase().replace(/[_\s]/g, "")] ?? "bg-brand-soft/30 text-brand-deep"
}

function prettyStatus(status: string) {
  return status.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTime(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// Per-stage glyph, shown inside a step node when it isn't completed/failed.
const STEP_ICON: Record<string, LucideIcon> = {
  placed: ShoppingBag,
  payment: CreditCard,
  seller_confirmation: BadgeCheck,
  preparing: Package,
  ready_for_pickup: PackageCheck,
  picked_up: PackageCheck,
  in_transit: Truck,
  delivered: Home,
}

// Node treatment per backend step state. Completed steps always show a check,
// the active step pulses, failed shows a cross, skipped/upcoming stay muted.
function stepVisual(state: string, key: string) {
  const StageIcon = STEP_ICON[key] ?? Circle
  switch (state) {
    case "completed":
      return {
        Icon: Check,
        node: "border-transparent bg-brand text-primary-foreground shadow-[0_4px_12px_-2px] shadow-brand/40",
        label: "text-foreground",
        connector: "bg-brand",
      }
    case "current":
      return {
        Icon: StageIcon,
        node: "border-brand bg-card text-brand ring-4 ring-brand/15",
        label: "text-foreground font-semibold",
        connector: "bg-border",
        pulse: true,
      }
    case "failed":
      return {
        Icon: X,
        node: "border-transparent bg-red-500 text-white",
        label: "text-red-600 dark:text-red-400",
        connector: "bg-border",
      }
    case "skipped":
      return {
        Icon: Minus,
        node: "border-dashed border-border bg-surface text-muted-foreground",
        label: "text-muted-foreground line-through decoration-muted-foreground/40",
        connector: "bg-border",
      }
    default: // upcoming / pending
      return {
        Icon: StageIcon,
        node: "border-border bg-surface text-muted-foreground",
        label: "text-muted-foreground",
        connector: "bg-border",
      }
  }
}

export function TrackOrderForm() {
  const { user } = useAuth()
  const [reference, setReference] = useState("")
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState<OrderTrackingData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ref = reference.trim()
    if (!ref) return

    setLoading(true)
    setError(null)
    setTracking(null)
    try {
      const data = await userFetchOrderTracking(ref)
      if (!data) {
        setError("We couldn't find an order with that reference on your account.")
      } else {
        setTracking(data)
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 419)) {
        setError("Please sign in to track your order.")
      } else if (err instanceof ApiError && err.status === 404) {
        setError("We couldn't find an order with that reference on your account.")
      } else {
        const msg = err instanceof Error ? err.message : "Something went wrong. Please try again."
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // Tracking requires an authenticated session (per the API). Prompt the guest to sign in.
  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <p className="font-display text-lg font-bold">Sign in to track your order</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          For your security, order tracking is available from your account. Sign in with the email you used at
          checkout to see live delivery status.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/track-order")}`}
            className="inline-flex items-center justify-center rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:border-brand hover:text-brand"
          >
            View my orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row"
      >
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Order reference, e.g. OR1782908533425398EC8CC4"
          className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-brand"
        />
        <Button
          variant="ghost"
          type="submit"
          disabled={loading || !reference.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-brand px-8 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Tracking…" : "Track"}
        </Button>
      </form>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Find your reference on your{" "}
        <Link href="/account/orders" className="font-medium text-brand hover:underline">
          order history
        </Link>{" "}
        or confirmation email.
      </p>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {tracking && <TrackingResult tracking={tracking} />}
    </>
  )
}

function TrackingResult({ tracking }: { tracking: OrderTrackingData }) {
  const address = tracking.fulfillment?.delivery_address
  const rate = tracking.fulfillment?.selected_rate
  const isPickup = tracking.fulfillment_type === "mall_pickup"

  const steps = tracking.steps
  const total = steps.length
  const completed = steps.filter((s) => s.state === "completed").length
  const isDelivered = tracking.current_status.toLowerCase().includes("deliver")
  const isTerminalBad = /cancel|refund|fail/i.test(tracking.current_status)
  const percent = total ? Math.round((completed / total) * 100) : 0
  // The step the order is actively on (falls back to the last completed one).
  const active = steps.find((s) => s.state === "current") ?? [...steps].reverse().find((s) => s.state === "completed")

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      {/* Hero header */}
      <div
        className={`relative px-6 py-6 sm:px-8 ${
          isDelivered
            ? "bg-gradient-to-br from-emerald-500/10 to-brand-soft/20"
            : isTerminalBad
              ? "bg-gradient-to-br from-red-500/10 to-transparent"
              : "bg-gradient-to-br from-brand-soft/25 to-transparent"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Order reference</p>
            <p className="mt-1 break-all font-display text-xl font-bold sm:text-2xl">{tracking.reference}</p>
            {active && (
              <p className="mt-2 text-sm text-muted-foreground">
                {isDelivered ? "Delivered — " : "Latest update: "}
                <span className="font-semibold text-foreground">{active.label}</span>
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${statusBadgeClass(
              tracking.current_status,
            )}`}
          >
            {isDelivered && <BadgeCheck className="h-3.5 w-3.5" />}
            {prettyStatus(tracking.current_status)}
          </span>
        </div>

        {/* Progress bar */}
        {!isTerminalBad && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>{isPickup ? "Ready for pickup" : "On the way"}</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border/70">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all duration-700"
                style={{ width: `${Math.max(percent, 6)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="px-6 py-6 sm:px-8">
        <ol>
          {steps.map((s, i) => {
            const { Icon, node, label, connector, pulse } = stepVisual(s.state, s.key)
            const time = formatTime(s.completed_at)
            const isLast = i === steps.length - 1
            return (
              <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
                {/* Vertical connector */}
                {!isLast && <span className={`absolute left-[19px] top-10 h-[calc(100%-1.75rem)] w-0.5 ${connector}`} />}
                {/* Node */}
                <span className="relative z-10">
                  {pulse && <span className="absolute inset-0 animate-ping rounded-full bg-brand/25" />}
                  <span
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${node}`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  </span>
                </span>
                {/* Text */}
                <div className="min-w-0 pt-1.5">
                  <p className={`text-sm ${label}`}>{s.label}</p>
                  {time ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
                  ) : s.state === "current" ? (
                    <p className="mt-0.5 text-xs font-medium text-brand">In progress</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Fulfillment + items */}
      <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
        <div className="bg-card p-6 sm:p-8">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
            {isPickup ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
            {isPickup ? "Pickup" : "Delivery to"}
          </p>
          {isPickup ? (
            <p className="mt-3 text-sm text-muted-foreground">Collect from Banex Mall.</p>
          ) : address ? (
            <div className="mt-3 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {[address.first_name, address.last_name].filter(Boolean).join(" ")}
                </span>
                <br />
                {address.street}
                {address.street_line_2 ? `, ${address.street_line_2}` : ""}
                <br />
                {[address.city, address.state].filter(Boolean).join(", ")}
                {address.phone ? ` · ${address.phone}` : ""}
              </span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">—</p>
          )}
          {rate && !isPickup && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Truck className="h-3.5 w-3.5 text-brand" />
              {rate.name}
              {rate.delivery_window ? ` · ${rate.delivery_window}` : ""}
            </div>
          )}
        </div>

        <div className="bg-card p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-deep">
            Items ({tracking.items.length})
          </p>
          <ul className="mt-3 space-y-3">
            {tracking.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-surface">
                  {it.primary_image_url ? (
                    <Image src={it.primary_image_url} alt={it.product_name} fill className="object-cover" sizes="56px" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{it.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {it.quantity}
                    {it.seller_shop_name ? ` · ${it.seller_shop_name}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
