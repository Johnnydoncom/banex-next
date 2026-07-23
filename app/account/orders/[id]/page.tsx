"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft, Printer, AlertTriangle, Truck, MapPin,
  Loader2, CreditCard, CheckCircle2, Clock, XCircle, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import {
  userFetchOrder, userInitializeOrderPayment, userCheckoutVerifyPayment,
  userFetchPaymentMethods,
  type OrderData, type PaymentMethodData
} from "@/lib/user-api"
import { formatNaira } from "@/lib/products"
import { BankTransferUploadScreen } from "@/components/BankTransferUpload"

function parseDate(raw: string | { item: string } | undefined): string {
  if (!raw) return ""
  if (typeof raw === "string") return raw
  return raw.item
}

// Show the "Pay Now" banner for any order that has NOT reached a paid/fulfilled terminal state.
// This is safer than a whitelist — any unknown status from the API will default to showing the button.
const PAID_TERMINAL_STATUSES = ["paid", "delivered", "shipped", "processing", "accepted", "completed", "cancelled", "refunded"]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
    paid:             { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: "bg-emerald-500/15 text-emerald-700 border border-emerald-200", label: "Paid" },
    completed:        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: "bg-emerald-500/15 text-emerald-700 border border-emerald-200", label: "Completed" },
    delivered:        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: "bg-emerald-500/15 text-emerald-700 border border-emerald-200", label: "Delivered" },
    accepted:         { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: "bg-teal-500/15 text-teal-700 border border-teal-200", label: "Accepted" },
    processing:       { icon: <RefreshCw className="h-3.5 w-3.5" />, className: "bg-blue-500/15 text-blue-700 border border-blue-200", label: "Processing" },
    shipped:          { icon: <Truck className="h-3.5 w-3.5" />, className: "bg-blue-500/15 text-blue-700 border border-blue-200", label: "Shipped" },
    pending:          { icon: <Clock className="h-3.5 w-3.5" />, className: "bg-amber-500/15 text-amber-700 border border-amber-200", label: "Pending Payment" },
    unpaid:           { icon: <Clock className="h-3.5 w-3.5" />, className: "bg-amber-500/15 text-amber-700 border border-amber-200", label: "Unpaid" },
    payment_pending:  { icon: <Clock className="h-3.5 w-3.5" />, className: "bg-amber-500/15 text-amber-700 border border-amber-200", label: "Awaiting Payment" },
    payment_failed:   { icon: <XCircle className="h-3.5 w-3.5" />, className: "bg-rose-500/15 text-rose-700 border border-rose-200", label: "Payment Failed" },
    failed:           { icon: <XCircle className="h-3.5 w-3.5" />, className: "bg-rose-500/15 text-rose-700 border border-rose-200", label: "Payment Failed" },
    cancelled:        { icon: <XCircle className="h-3.5 w-3.5" />, className: "bg-slate-500/15 text-slate-700 border border-slate-200", label: "Cancelled" },
    refunded:         { icon: <RefreshCw className="h-3.5 w-3.5" />, className: "bg-slate-500/15 text-slate-700 border border-slate-200", label: "Refunded" },
  }
  // Fallback: any unknown status (amber = potentially unpaid) with the raw status as label
  const config = map[status] ?? { icon: <Clock className="h-3.5 w-3.5" />, className: "bg-amber-500/15 text-amber-700 border border-amber-200", label: status.replace(/_/g, " ") }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${config.className}`}>
      {config.icon}{config.label}
    </span>
  )
}


// ── Payment Section ────────────────────────────────────────────────────────────
function PaymentSection({
  order,
  paymentMethods,
  onPaymentSuccess,
}: {
  order: OrderData
  paymentMethods: PaymentMethodData[]
  onPaymentSuccess: (updated: OrderData) => void
}) {
  const [state, setState] = useState<"idle" | "loading" | "redirecting" | "verifying" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [selectedMethodId, setSelectedMethodId] = useState<string>("")

  // Check if we already have a manual payment proof uploaded
  const hasManualProof = !!order.payment?.proof_status
  const isBankTransferOrder = order.payment?.payment_method?.slug === "manual" || order.payment?.payment_method?.name?.toLowerCase().includes("bank transfer")

  // The active methods to show in the dropdown
  const activeMethods = paymentMethods.filter(m => m.status === "active")

  useEffect(() => {
    if (activeMethods.length > 0 && !selectedMethodId) {
      if (hasManualProof || isBankTransferOrder) {
        const manual = activeMethods.find(m => m.slug === "manual" || m.name.toLowerCase().includes("bank transfer"))
        if (manual) setSelectedMethodId(manual.id)
      } else {
        const card = activeMethods.find(m => m.slug === "card" || m.slug.includes("paystack"))
        setSelectedMethodId(card ? card.id : activeMethods[0].id)
      }
    }
  }, [activeMethods, selectedMethodId, hasManualProof, isBankTransferOrder])

  const selectedMethod = activeMethods.find(m => m.id === selectedMethodId)
  const isManualSelected = selectedMethod?.slug === "manual" || selectedMethod?.name.toLowerCase().includes("bank transfer") || !!selectedMethod?.manual_payment_instructions

  const total = order.summary?.total ?? order.lines_summary?.subtotal ?? 0

  const handlePaystackPay = useCallback(async () => {
    if (!selectedMethodId) {
      setErrorMsg("Please select a payment method")
      return
    }
    setState("loading")
    setErrorMsg("")
    try {
      const callbackUrl = `${window.location.origin}/checkout/verify?orderId=${order.id}`
      const data = await userInitializeOrderPayment(order.id, selectedMethodId, callbackUrl)
      if (data?.payment_intent?.authorization_url) {
        setState("redirecting")
        sessionStorage.setItem("pending_order_id", order.id)
        window.location.href = data.payment_intent.authorization_url
      } else {
        setState("verifying")
        const updated = await userCheckoutVerifyPayment(order.id)
        if (updated) {
          setState("success")
          onPaymentSuccess(updated)
        } else {
          setErrorMsg("Payment could not be initiated. Please contact support.")
          setState("error")
        }
      }
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("404") || msg.includes("405") || msg.includes("Not Found")) {
        setErrorMsg("Payment re-initialization is not available for this order. Please contact support or create a new order.")
      } else {
        setErrorMsg(msg || "Failed to initialize payment. Please try again.")
      }
      setState("error")
    }
  }, [order.id, selectedMethodId, onPaymentSuccess])

  return (
    <div className="mb-6 space-y-4">
      {/* Selector Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-700/50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-orange-400/15 blur-xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="font-display font-bold text-amber-900 dark:text-amber-300">
                Payment Required
              </h3>
            </div>
            <p className="mt-2 text-sm text-amber-800/80 dark:text-amber-400/80">
              This order is awaiting payment. Please complete your payment to confirm the order.
            </p>
            {state === "error" && !isManualSelected && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5 flex-none" />
                {errorMsg}
              </p>
            )}
            {state === "success" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 flex-none" />
                Payment confirmed! Refreshing order details…
              </p>
            )}
          </div>
          <div className="flex flex-col items-center sm:items-end flex-none">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {activeMethods.length > 0 && state !== "success" && (
                <Select
                  value={selectedMethodId}
                  onValueChange={setSelectedMethodId}
                  disabled={state !== "idle" && state !== "error"}
                >
                  <SelectTrigger className="h-11 rounded-xl border-amber-300/50 bg-white/60 px-4 text-sm font-semibold text-amber-950 backdrop-blur-sm focus:border-amber-500 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMethods.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!isManualSelected && (
                <Button
                  type="button"
                  onClick={handlePaystackPay}
                  disabled={state === "loading" || state === "redirecting" || state === "verifying" || state === "success"}
                  className={`relative h-auto min-w-[160px] gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-bold shadow-lg ${
                    state === "success"
                      ? "bg-emerald-500 text-white"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/30 active:scale-95"
                  }`}
                >
                  {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {state === "redirecting" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {state === "verifying" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {state === "success" && <CheckCircle2 className="h-4 w-4" />}
                  {(state === "idle" || state === "error") && <CreditCard className="h-4 w-4" />}
                  <span>
                    {state === "idle" && `Pay ${formatNaira(total)}`}
                    {state === "loading" && "Initializing…"}
                    {state === "redirecting" && "Redirecting…"}
                    {state === "verifying" && "Verifying…"}
                    {state === "success" && "Paid!"}
                    {state === "error" && `Retry Payment`}
                  </span>
                </Button>
              )}
            </div>
            {!isManualSelected && (
              <p className="mt-2 text-[10px] font-medium text-amber-700/60 dark:text-amber-500/60">
                🔒 Secured by Paystack
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Manual Payment Section */}
      {isManualSelected && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <BankTransferUploadScreen
            order={order}
            paymentInstructions={selectedMethod?.manual_payment_instructions}
            compact={true}
            onSuccess={(updated) => {
              if (updated) onPaymentSuccess(updated)
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrderDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])

  const loadOrder = useCallback(async (orderId: string) => {
    setError("")
    try {
      const data = await userFetchOrder(orderId)
      if (data) {
        setOrder(data)
      } else {
        setError("Order not found")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order details")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user?.id || !id) return
    setLoading(true)
    loadOrder(Array.isArray(id) ? id[0] : id)
    // Fetch payment methods to pass bank instructions if needed
    userFetchPaymentMethods().then(setPaymentMethods).catch(console.error)
  }, [user?.id, id, loadOrder])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Loading order details…</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
        <p className="mt-4 font-semibold">Could not load order</p>
        <p className="mt-2 text-sm text-muted-foreground">{error || "Order not found"}</p>
        <Button
          type="button"
          onClick={() => router.back()}
          className="mt-6 h-auto rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Go Back
        </Button>
      </div>
    )
  }

  const dateStr = parseDate(order.created_at)
  const subtotal = order.summary?.subtotal ?? order.lines_summary?.subtotal ?? 0
  const deliveryFee = order.summary?.delivery_fee ?? order.shipping?.selected_rate?.fee ?? 0
  const total = order.summary?.total ?? (subtotal + deliveryFee)
  const isUnpaid = !PAID_TERMINAL_STATUSES.includes(order.status)

  return (
    <div className="space-y-5 pb-20 print:pb-0 print:space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" /> Back to orders
        </Link>
        {!isUnpaid && (
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="h-auto gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            <Printer className="h-4 w-4" /> Download Receipt
          </Button>
        )}
      </div>

      {/* Order header card */}
      <div className="rounded-2xl border border-border bg-card p-6 print:border-none print:p-0">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="font-display text-2xl font-bold print:text-3xl">
              {isUnpaid ? "Pending Order" : "Order Receipt"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Banex Marketplace &middot; {dateStr ? new Date(dateStr).toLocaleString() : ""}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={order.status} />
            <p className="font-display text-sm font-semibold text-muted-foreground">{order.reference}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 print:mt-3">
          <span className="inline-flex rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {order.fulfillment_type === "mall_pickup" ? "🏬 Pickup" : "🚚 Delivery"}
          </span>
          {order.shipping?.selected_rate && (
            <span className="inline-flex rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
              {order.shipping.selected_rate.name} · {order.shipping.selected_rate.delivery_window}
            </span>
          )}
        </div>
      </div>

      {/* ── Payment Section (only for unpaid orders) ── */}
      {isUnpaid && (
        <PaymentSection
          order={order}
          paymentMethods={paymentMethods}
          onPaymentSuccess={(updated) => {
            setOrder(updated)
            setTimeout(() => loadOrder(order.id), 1500)
          }}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px] print:grid-cols-1">
        {/* Items */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-surface/40 px-5 py-3">
            <h2 className="font-display text-sm font-bold">
              Order Items ({order.items?.length || 0})
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {order.items?.map((it) => (
              <li key={it.id} className="flex gap-4 p-5">
                <div className="h-16 w-16 flex-none overflow-hidden rounded-xl bg-surface print:hidden">
                  {it.primary_image_url ? (
                    <img src={it.primary_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/20 text-2xl">📦</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <p className="font-semibold text-sm line-clamp-2">{it.product_name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Sold by {it.seller_shop_name || "Unknown Seller"}
                  </p>
                  {it.status && (
                    <span className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      it.status === "paid" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"
                    }`}>
                      {it.status}
                    </span>
                  )}
                </div>
                <div className="text-right flex flex-col justify-center gap-0.5 flex-none">
                  <p className="font-bold text-sm">{formatNaira(it.line_total)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {it.quantity} × {formatNaira(it.unit_price)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          {/* Payment Summary */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-surface/40 px-5 py-3">
              <h2 className="font-display text-sm font-bold">Payment Summary</h2>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="font-medium text-foreground">{formatNaira(deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 font-bold">
                <span>{isUnpaid ? "Amount Due" : "Total Paid"}</span>
                <span className={`font-display text-base ${isUnpaid ? "text-amber-700 dark:text-amber-400" : "text-brand"}`}>
                  {formatNaira(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.fulfillment_type === "delivery" && order.delivery_address && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-surface/40 px-5 py-3">
                <h2 className="font-display text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Delivery Address
                </h2>
              </div>
              <div className="p-5 text-sm space-y-1">
                <p className="font-semibold">
                  {order.delivery_address.first_name} {order.delivery_address.last_name}
                </p>
                <p className="text-muted-foreground">
                  {order.delivery_address.street}
                  {order.delivery_address.street_line_2 && <>, {order.delivery_address.street_line_2}</>}
                </p>
                <p className="text-muted-foreground">
                  {order.delivery_address.city}, {order.delivery_address.state}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  📞 {order.delivery_address.phone}
                </p>
              </div>
            </div>
          )}

          {/* Mall Pickup */}
          {order.fulfillment_type === "mall_pickup" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-surface/40 px-5 py-3">
                <h2 className="font-display text-sm font-bold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  Pickup Details
                </h2>
              </div>
              <div className="p-5 text-sm text-muted-foreground">
                Collect at the Banex Mall Concierge desk (Ground Floor). Bring this receipt and a valid ID.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
