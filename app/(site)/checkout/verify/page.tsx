"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { userCheckoutVerifyPayment } from "@/lib/user-api"

type VerifyState = "verifying" | "success" | "error"

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Paystack returns ?reference=... in the callback URL
  const reference = searchParams.get("reference") || searchParams.get("trxref")
  const orderId = searchParams.get("orderId")

  const [state, setState] = useState<VerifyState>("verifying")
  const [orderRef, setOrderRef] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")

  useEffect(() => {
    if (!reference && !orderId) {
      setErrorMsg("Missing payment reference. Please contact support.")
      setState("error")
      return
    }

    // We use the orderId if passed (set in the Paystack callback URL config),
    // otherwise we must find the order by reference from the orders list.
    // The backend verify endpoint takes the order UUID.
    const id = orderId || reference!

    userCheckoutVerifyPayment(id)
      .then((order) => {
        if (order) {
          setOrderRef(order.reference)
          setState("success")
          toast.success("Payment confirmed!")
        } else {
          setErrorMsg("Payment could not be verified. Please check your orders page.")
          setState("error")
        }
      })
      .catch((err: any) => {
        setErrorMsg(err.message || "Failed to verify payment. Please check your orders.")
        setState("error")
      })
  }, [reference, orderId])

  if (state === "verifying") {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand" />
        <h1 className="font-display text-2xl font-bold">Verifying your payment…</h1>
        <p className="text-sm text-muted-foreground">Please wait while we confirm your payment with Paystack.</p>
      </section>
    )
  }

  if (state === "error") {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
          <XCircle className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="font-display text-2xl font-bold">Verification Failed</h1>
        <p className="text-sm text-muted-foreground">{errorMsg}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/account/orders"
            className="rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            View Orders
          </Link>
          <button
            onClick={() => router.push("/checkout")}
            className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            Back to Checkout
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft/40">
        <CheckCircle2 className="h-8 w-8 text-brand-deep" />
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Payment Confirmed!</h1>
      <p className="text-sm text-muted-foreground">
        Your payment is safely held by Banex Escrow. We'll release it to the seller after you confirm delivery.
      </p>
      {orderRef && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
          Order reference: <span className="font-display font-semibold">{orderRef}</span>
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/account/orders"
          className="rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Track My Order
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
        >
          Back to Home
        </Link>
      </div>
    </section>
  )
}

export default function CheckoutVerifyPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </section>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
