"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { userCheckoutVerifyPayment } from "@/lib/user-api"
import { guestVerifyPayment, guestApiError, GUEST_ERROR } from "@/lib/guest-api"
import { findGuestOrder, saveGuestOrder, resumeGuestPayment } from "@/lib/guest-orders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// verifying → success | pending (guest: not paid yet) | needs-email (guest, unknown device) | error
type VerifyState = "verifying" | "success" | "pending" | "needs-email" | "error"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useAuth()
  // Paystack returns ?reference=... (the payment reference) in the callback URL
  const reference = searchParams.get("reference") || searchParams.get("trxref")
  const orderId = searchParams.get("orderId")

  const [state, setState] = useState<VerifyState>("verifying")
  const [orderRef, setOrderRef] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")
  // Set once we know this payment belongs to a guest order (no account).
  const [guest, setGuest] = useState<{ email: string; orderReference: string | null } | null>(null)
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState("")
  const [paying, setPaying] = useState(false)
  const started = useRef(false)

  const verifyGuest = async (email: string, knownOrderReference: string | null) => {
    if (!reference) return
    setGuest({ email, orderReference: knownOrderReference })
    setState("verifying")
    try {
      const order = await guestVerifyPayment(reference, email)
      const ref = order?.reference ?? knownOrderReference
      if (ref) saveGuestOrder({ reference: ref, email, paymentReference: reference, paid: true })
      setGuest({ email, orderReference: ref })
      setOrderRef(ref)
      setState("success")
      toast.success("Payment confirmed!")
    } catch (err) {
      const info = guestApiError(err, "Failed to verify payment.")
      if (info.code === GUEST_ERROR.paymentPending) {
        setState("pending")
      } else if (info.status === 404) {
        // Unknown payment for this email — most likely a different email was used.
        setEmailError("We couldn't find a payment for that email. Enter the email you used at checkout.")
        setState("needs-email")
      } else {
        setErrorMsg(info.message)
        setState("error")
      }
    }
  }

  // Nothing to verify without a reference — no request needed to know that.
  const missingReference = !reference && !orderId

  const start = () => {
    // A guest order placed on this device: we remembered which email it belongs to.
    const stored = findGuestOrder(reference)
    if (stored) {
      verifyGuest(stored.email, stored.reference)
      return
    }

    if (status !== "authenticated") {
      // Guest payment opened somewhere we have no record of — ask for the email.
      if (reference) {
        setState("needs-email")
      } else {
        setErrorMsg("Missing payment reference. Please contact support.")
        setState("error")
      }
      return
    }

    // Signed-in order. The backend verify endpoint takes the payment reference
    // (or the order id passed along in the callback URL).
    const id = reference || orderId

    userCheckoutVerifyPayment(id!)
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
  }

  // Once, when the session state is known.
  useEffect(() => {
    if (missingReference || status === "loading" || started.current) return
    started.current = true
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingReference, status])

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault()
    const email = emailInput.trim()
    if (!EMAIL_RE.test(email)) {
      setEmailError("Enter a valid email address.")
      return
    }
    setEmailError("")
    verifyGuest(email, null)
  }

  const payAgain = async () => {
    if (!guest?.orderReference) return
    setPaying(true)
    try {
      const next = await resumeGuestPayment({ reference: guest.orderReference, email: guest.email, paymentReference: reference })
      if (next.status === "paid") {
        setOrderRef(guest.orderReference)
        setState("success")
        setPaying(false)
        return
      }
      window.location.assign(next.url) // stay busy while the browser leaves
    } catch (err) {
      toast.error(guestApiError(err, "We couldn't start the payment.").message)
      setPaying(false)
    }
  }

  const trackHref = orderRef || guest?.orderReference
    ? `/track-order?reference=${encodeURIComponent((orderRef || guest?.orderReference) as string)}`
    : "/track-order"

  if (missingReference) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
          <XCircle className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="font-display text-2xl font-bold">Verification Failed</h1>
        <p className="text-sm text-muted-foreground">Missing payment reference. Please contact support.</p>
        <Link href="/" className="mt-4 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground">
          Back to Home
        </Link>
      </section>
    )
  }

  if (state === "verifying") {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand" />
        <h1 className="font-display text-2xl font-bold">Verifying your payment…</h1>
        <p className="text-sm text-muted-foreground">Please wait while we confirm your payment with Paystack.</p>
      </section>
    )
  }

  if (state === "needs-email") {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-bold">Confirm your payment</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email you used at checkout so we can confirm this payment.
        </p>
        <form onSubmit={submitEmail} noValidate className="mt-2 w-full space-y-3 text-left">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-label="Email used at checkout"
            aria-invalid={emailError ? true : undefined}
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value)
              setEmailError("")
            }}
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-brand"
          />
          {emailError && <p className="text-xs font-medium text-rose-600">{emailError}</p>}
          <Button
            type="submit"
            className="h-auto w-full rounded-full bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground"
          >
            Confirm payment
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Ordered from your account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/checkout/verify?reference=${reference ?? ""}`)}`}
            className="font-medium text-brand hover:underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    )
  }

  if (state === "pending") {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="font-display text-2xl font-bold">Payment not completed</h1>
        <p className="text-sm text-muted-foreground">
          We haven&apos;t received your payment for this order yet. If you&apos;ve just paid, give it a moment and
          check again.
        </p>
        {guest?.orderReference && (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            Order reference: <span className="font-display font-semibold">{guest.orderReference}</span>
          </div>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {guest?.orderReference && (
            <Button
              type="button"
              onClick={payAgain}
              disabled={paying}
              className="h-auto gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              {paying && <Loader2 className="h-4 w-4 animate-spin" />} Pay now
            </Button>
          )}
          <Button
            variant="ghost"
            type="button"
            disabled={paying}
            onClick={() => guest && verifyGuest(guest.email, guest.orderReference)}
            className="h-auto rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:bg-card hover:text-brand"
          >
            Check again
          </Button>
        </div>
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
          {guest || status !== "authenticated" ? (
            <Link
              href={trackHref}
              className="rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Track Order
            </Link>
          ) : (
            <Link
              href="/account/orders"
              className="rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              View Orders
            </Link>
          )}
          <Button variant="ghost" type="button"
            onClick={() => router.push("/checkout")}
            className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            Back to Checkout
          </Button>
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
      {guest && (
        <p className="max-w-md text-xs text-muted-foreground">
          Keep this reference — you&apos;ll need it, with <span className="font-medium text-foreground">{guest.email}</span>,
          to track your order.
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={guest ? trackHref : "/account/orders"}
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
