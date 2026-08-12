"use client"

import { useState, useEffect, useCallback } from "react"
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
  RefreshCw,
  Copy,
  Clock,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { userFetchOrderTracking, type OrderTrackingData } from "@/lib/user-api"
import { ApiError } from "@/lib/api-client"

const STATUS_BADGE: Record<string, string> = {
  delivered: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 font-semibold",
  cancelled: "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20 font-semibold",
  refunded: "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20 font-semibold",
  intransit: "bg-brand-soft/30 text-brand-deep border border-brand/20 dark:bg-brand-soft/20 dark:text-brand font-semibold",
  shipped: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 font-semibold",
  processing: "bg-brand-soft/30 text-brand-deep border border-brand/20 dark:bg-brand-soft/20 dark:text-brand font-semibold",
}

function statusBadgeClass(status: string) {
  return STATUS_BADGE[status.toLowerCase().replace(/[_\s]/g, "")] ?? "bg-brand-soft/30 text-brand-deep border border-brand/20 font-semibold"
}

function prettyStatus(status: string) {
  return status.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTime(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

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

function stepVisual(state: string, key: string) {
  const StageIcon = STEP_ICON[key] ?? Circle
  switch (state) {
    case "completed":
      return {
        Icon: Check,
        node: "border-transparent bg-emerald-600 text-white shadow-sm",
        labelClass: "text-foreground font-semibold",
        lineClass: "bg-emerald-500",
        pulse: false,
      }
    case "current":
      return {
        Icon: StageIcon,
        node: "border-brand bg-card text-brand ring-4 ring-brand/15 shadow-sm",
        labelClass: "text-foreground font-bold",
        lineClass: "bg-border",
        pulse: true,
      }
    case "failed":
      return {
        Icon: X,
        node: "border-transparent bg-red-500 text-white shadow-sm",
        labelClass: "text-red-600 dark:text-red-400 font-semibold",
        lineClass: "bg-border",
        pulse: false,
      }
    case "skipped":
      return {
        Icon: Minus,
        node: "border-dashed border-border bg-muted/30 text-muted-foreground/50",
        labelClass: "text-muted-foreground line-through decoration-muted-foreground/40",
        lineClass: "bg-border",
        pulse: false,
      }
    default:
      return {
        Icon: StageIcon,
        node: "border-border bg-surface text-muted-foreground/40",
        labelClass: "text-muted-foreground/80 font-medium",
        lineClass: "bg-border",
        pulse: false,
      }
  }
}

interface OrderTrackerProps {
  reference?: string
  initialData?: OrderTrackingData | null
  compact?: boolean
  showItems?: boolean
  onLoaded?: (data: OrderTrackingData) => void
}

export function OrderTracker({
  reference,
  initialData = null,
  compact = false,
  showItems = true,
  onLoaded,
}: OrderTrackerProps) {
  const [tracking, setTracking] = useState<OrderTrackingData | null>(initialData)
  const [loading, setLoading] = useState<boolean>(!initialData && !!reference)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTracking = useCallback(async (ref: string, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await userFetchOrderTracking(ref)
      if (!data) {
        setError("Could not retrieve tracking status for this reference.")
      } else {
        setTracking(data)
        if (onLoaded) onLoaded(data)
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 419)) {
        setError("Please sign in to view order tracking.")
      } else if (err instanceof ApiError && err.status === 404) {
        setError("Tracking information not found for this order.")
      } else {
        const msg = err instanceof Error ? err.message : "Failed to load tracking data."
        setError(msg)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [onLoaded])

  useEffect(() => {
    if (initialData) {
      setTracking(initialData)
      setLoading(false)
    } else if (reference) {
      fetchTracking(reference)
    }
  }, [reference, initialData, fetchTracking])

  const copyRef = (refStr: string) => {
    navigator.clipboard.writeText(refStr)
    toast.success("Order reference copied!")
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          <span className="text-sm font-medium text-muted-foreground">Loading tracking status…</span>
        </div>
      </div>
    )
  }

  if (error || !tracking) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-500/20 dark:bg-rose-500/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400">
            <X className="h-5 w-5 flex-none" />
            <p className="text-sm font-medium">{error || "No tracking information available."}</p>
          </div>
          {reference && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchTracking(reference, true)}
              className="h-8 gap-1.5 rounded-full text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          )}
        </div>
      </div>
    )
  }

  const address = tracking.fulfillment?.delivery_address
  const rate = tracking.fulfillment?.selected_rate
  const isPickup = tracking.fulfillment_type === "mall_pickup"
  const steps = tracking.steps || []
  const totalSteps = steps.length
  const completedSteps = steps.filter((s) => s.state === "completed").length
  const isDelivered = tracking.current_status.toLowerCase().includes("deliver")
  const isTerminalBad = /cancel|refund|fail/i.test(tracking.current_status)
  const percent = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0
  const activeStep = steps.find((s) => s.state === "current") ?? [...steps].reverse().find((s) => s.state === "completed")

  return (
    <div className={`overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all ${compact ? "p-4 sm:p-5" : ""}`}>
      {/* Top Header Card */}
      <div
        className={`relative p-6 sm:p-7 ${
          isDelivered
            ? "bg-gradient-to-br from-emerald-500/10 via-brand-soft/10 to-transparent"
            : isTerminalBad
              ? "bg-gradient-to-br from-red-500/10 via-transparent to-transparent"
              : "bg-gradient-to-br from-brand-soft/20 via-card to-card"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Order Tracking
              </span>
              <button
                type="button"
                onClick={() => copyRef(tracking.reference)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                title="Copy reference"
              >
                <Copy className="h-3 w-3" />
                Copy Ref
              </button>
            </div>
            <p className="mt-1 break-all font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {tracking.reference}
            </p>
            {activeStep && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                <Clock className="h-3.5 w-3.5 text-brand" />
                <span>{isDelivered ? "Delivered — " : "Current Status: "}</span>
                <span className="font-semibold text-foreground">{activeStep.label}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs ${statusBadgeClass(tracking.current_status)}`}>
              {isDelivered && <BadgeCheck className="h-3.5 w-3.5" />}
              {prettyStatus(tracking.current_status)}
            </span>
            {reference && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fetchTracking(reference, true)}
                disabled={refreshing}
                title="Refresh tracking data"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-brand" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!isTerminalBad && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {isPickup ? <Store className="h-3.5 w-3.5 text-brand" /> : <Truck className="h-3.5 w-3.5 text-brand" />}
                {isPickup ? "Pickup Progress" : "Delivery Progress"}
              </span>
              <span className="font-bold text-foreground">{percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/80">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all duration-700 shadow-xs"
                style={{ width: `${Math.max(percent, 5)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Progress Timeline - Clean, Premium & Uncluttered */}
      <div className="border-t border-border px-5 py-6 sm:px-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand" /> Timeline Progress
        </h3>

        <div className="relative pl-1 sm:pl-2">
          <ol className="relative space-y-3.5">
            {steps.map((s, i) => {
              const { Icon, node, labelClass, pulse } = stepVisual(s.state, s.key)
              const isCompleted = s.state === "completed"
              const timeStr = formatTime(s.completed_at)
              const isLast = i === steps.length - 1

              return (
                <li key={s.key} className="relative flex items-center gap-3.5 sm:gap-4">
                  {/* Vertical Connector Line */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[19px] sm:left-[21px] top-9 -bottom-3.5 w-0.5 transition-colors ${
                        isCompleted ? "bg-emerald-500" : "bg-border/70"
                      }`}
                    />
                  )}

                  {/* Node Circle */}
                  <div className="relative z-10 flex-none">
                    {pulse && <span className="absolute inset-0 animate-ping rounded-full bg-brand/30 ring-4 ring-brand/10" />}
                    <div className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 transition-all ${node}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Step Row Card */}
                  <div className="flex-1 min-w-0 rounded-2xl border border-border/60 bg-surface/30 p-3.5 sm:px-4 sm:py-3.5 transition-all hover:border-border flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-sm tracking-tight ${labelClass}`}>
                        {s.label}
                      </h4>
                    </div>

                    {/* Date & Time Timestamp - Display NOTHING when completed_at is null */}
                    {timeStr ? (
                      <div className="flex-none">
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                          {timeStr}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {/* Fulfillment + Items Section */}
      {showItems && (
        <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
          {/* Destination / Pickup Info */}
          <div className="bg-card p-6 sm:p-7">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-deep">
              {isPickup ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
              {isPickup ? "Pickup Location" : "Destination Address"}
            </p>
            {isPickup ? (
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Banex Mall Concierge Desk</p>
                <p>Ground Floor, Banex Plaza Complex</p>
                <p className="text-xs text-brand font-medium">Please present your order reference upon pickup.</p>
              </div>
            ) : address ? (
              <div className="mt-3 flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div className="text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground">
                    {[address.first_name, address.last_name].filter(Boolean).join(" ")}
                  </p>
                  <p>{address.street}{address.street_line_2 ? `, ${address.street_line_2}` : ""}</p>
                  <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>
                  {address.phone && <p className="mt-1 text-xs font-medium">📞 {address.phone}</p>}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">—</p>
            )}

            {rate && !isPickup && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border">
                <Truck className="h-3.5 w-3.5 text-brand" />
                <span>{rate.name}{rate.delivery_window ? ` · ${rate.delivery_window}` : ""}</span>
              </div>
            )}
          </div>

          {/* Items Gallery */}
          <div className="bg-card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-deep">
                Shipment Items ({tracking.items?.length || 0})
              </p>
            </div>
            <ul className="mt-3 space-y-3">
              {(tracking.items || []).map((it) => (
                <li key={it.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-surface">
                    {it.primary_image_url ? (
                      <Image src={it.primary_image_url} alt={it.product_name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{it.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {it.quantity} · Banex Mall
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
