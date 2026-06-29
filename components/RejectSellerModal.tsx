"use client"

import { useState } from "react"
import { AlertCircle, X, Loader2 } from "lucide-react"

type RejectSellerModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  shopName: string
}

export function RejectSellerModal({ isOpen, onClose, onConfirm, shopName }: RejectSellerModalProps) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    setLoading(true)
    try {
      await onConfirm(reason)
    } finally {
      setLoading(false)
      setReason("")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertCircle className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold">Reject Seller</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          You are about to reject the application for <strong>{shopName}</strong>. Please provide a reason. The vendor will see this reason in their dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Rejection Reason <span className="text-rose-500">*</span></label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="min-h-[100px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
              placeholder="e.g. Invalid documents provided, incomplete shop details..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject Application
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
