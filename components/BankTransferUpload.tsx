"use client"

import { useState, useRef } from "react"
import { Upload, Loader2, AlertTriangle, FileImage, X, CheckCircle2, Landmark, Clock } from "lucide-react"
import { toast } from "sonner"
import { formatNaira } from "@/lib/products"
import { userUploadPaymentProof, type OrderData } from "@/lib/user-api"

export function BankTransferUploadScreen({
  order,
  paymentInstructions,
  onSuccess,
  onSkip,
  compact = false,
}: {
  order: OrderData
  paymentInstructions?: { bank_name?: string; account_name?: string; account_number?: string; instructions?: string } | null
  onSuccess: (updatedOrder?: OrderData) => void
  onSkip?: () => void
  compact?: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (!selected.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }
      if (selected.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB")
        return
      }
      setFile(selected)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a receipt image first")
      return
    }
    setSubmitting(true)
    try {
      const data = await userUploadPaymentProof(order.id, file)
      toast.success("Receipt uploaded successfully! We will review it shortly.")
      // Call onSuccess with the updated order containing the new payment proof status
      onSuccess({ ...order, payment: data.payment })
    } catch (err: any) {
      toast.error(err.message || "Failed to upload receipt")
    } finally {
      setSubmitting(false)
    }
  }

  const total = order.summary?.total ?? order.lines_summary?.subtotal ?? 0
  const proofStatus = order.payment?.proof_status
  const isUnderReview = proofStatus === "pending_review"
  const isApproved = proofStatus === "approved"

  if (isApproved) {
    return (
      <section className={`mx-auto max-w-xl px-4 text-center ${compact ? "py-6" : "py-12"}`}>
        {!compact && (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        )}
        <h1 className={`${compact ? "mt-2 text-xl" : "mt-6 text-2xl"} font-display font-bold`}>Payment Approved</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your bank transfer payment has been approved.</p>
        <div className="mt-4 flex justify-center">
          {onSkip && (
            <button onClick={onSkip} className="rounded-full bg-surface px-6 py-2 text-sm font-semibold hover:bg-muted">Continue</button>
          )}
        </div>
      </section>
    )
  }

  if (isUnderReview && !file) {
    return (
      <section className={`mx-auto max-w-xl px-4 text-center ${compact ? "py-6" : "py-12"}`}>
        {!compact && (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft/40">
            <Clock className="h-8 w-8 text-brand-deep" />
          </div>
        )}
        <h1 className={`${compact ? "mt-2 text-xl" : "mt-6 text-2xl"} font-display font-bold`}>Receipt Under Review</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You have already uploaded a receipt for this order. We will verify the payment shortly.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          {onSkip && (
            <button onClick={onSkip} className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:border-foreground hover:text-foreground">
              Go Back
            </button>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="rounded-full border border-brand/50 bg-brand-soft/10 px-6 py-3 text-sm font-semibold text-brand hover:bg-brand-soft/20">
            Re-upload Receipt
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>
      </section>
    )
  }

  return (
    <section className={`mx-auto max-w-xl px-4 text-center ${compact ? "py-6" : "py-12 md:py-16"}`}>
      {!compact && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft/40">
            <Clock className="h-8 w-8 text-brand-deep" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold md:text-3xl">Awaiting Payment</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your order <span className="font-semibold text-foreground">{order.reference}</span> has been placed, but requires manual payment via Bank Transfer.
          </p>
        </>
      )}

      {/* Payment Instructions */}
      {paymentInstructions && (
        <div className={`${compact ? "mt-4 p-4" : "mt-8 p-5"} rounded-2xl border border-[#0ba4db]/30 bg-[#0ba4db]/5 text-left text-sm`}>
          <p className="flex items-center gap-2 font-display font-semibold text-[#0ba4db]">
            <Landmark className="h-4 w-4" /> Please transfer <span className="font-bold text-lg">{formatNaira(total)}</span> to:
          </p>
          <div className="mt-3 space-y-2 text-muted-foreground">
            {paymentInstructions.bank_name && (
              <p><strong className="text-foreground">Bank:</strong> {paymentInstructions.bank_name}</p>
            )}
            {paymentInstructions.account_name && (
              <p><strong className="text-foreground">Account Name:</strong> {paymentInstructions.account_name}</p>
            )}
            {paymentInstructions.account_number && (
              <p className="flex items-center gap-2">
                <strong className="text-foreground">Account Number:</strong>
                <span className="font-mono text-base font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border tracking-wider">{paymentInstructions.account_number}</span>
              </p>
            )}
            {paymentInstructions.instructions && (
              <div className="pt-2 mt-2 border-t border-[#0ba4db]/10 whitespace-pre-wrap leading-relaxed">
                {paymentInstructions.instructions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Box */}
      <div className={compact ? "mt-4" : "mt-8"}>
        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/50 p-10 hover:border-brand/60 hover:bg-brand-soft/5 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border shadow-sm">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Click to upload your receipt</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-brand/40 bg-brand-soft/10 p-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <FileImage className="h-5 w-5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              disabled={submitting}
              className="rounded-full p-2 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className={`${compact ? "mt-5" : "mt-8"} flex flex-col sm:flex-row justify-center gap-3`}>
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={submitting}
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:border-foreground hover:text-foreground disabled:opacity-50"
          >
            Upload later
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={!file || submitting}
          className="relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-8 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Uploading..." : "Submit Receipt"}
        </button>
      </div>
    </section>
  )
}
