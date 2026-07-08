"use client"

import { useEffect, useState } from "react"
import { Banknote, CheckCircle, XCircle, Ban, Loader2 } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminWithdrawals, completeAdminWithdrawal, rejectAdminWithdrawal, cancelAdminWithdrawal, type AdminWithdrawal } from "@/lib/admin-api"
import { toast } from "sonner"

export default function AdminWithdrawalsPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([])
  const [loading, setLoading] = useState(true)

  const [confirmAction, setConfirmAction] = useState<{
    withdrawal: AdminWithdrawal
    action: "complete" | "reject" | "cancel"
  } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetchAdminWithdrawals(token)
      setWithdrawals(res.data?.withdrawals || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load withdrawals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleAction = async () => {
    if (!confirmAction || !token) return
    setActionLoading(true)
    try {
      if (confirmAction.action === "complete") {
        await completeAdminWithdrawal(confirmAction.withdrawal.id, token)
        toast.success("Withdrawal marked as completed")
      } else if (confirmAction.action === "reject") {
        if (!rejectReason) {
          toast.error("Please provide a rejection reason")
          setActionLoading(false)
          return
        }
        await rejectAdminWithdrawal(confirmAction.withdrawal.id, token, rejectReason)
        toast.success("Withdrawal rejected")
      } else if (confirmAction.action === "cancel") {
        await cancelAdminWithdrawal(confirmAction.withdrawal.id, token)
        toast.success("Withdrawal cancelled")
      }
      setConfirmAction(null)
      setRejectReason("")
      loadData()
    } catch (err: any) {
      toast.error(err.message || `Failed to ${confirmAction.action} withdrawal`)
    } finally {
      setActionLoading(false)
    }
  }

  const columns: Column<AdminWithdrawal>[] = [
    {
      key: "reference",
      label: "Reference",
      sortable: true,
      render: (w) => <span className="font-semibold text-brand">{w.reference}</span>,
    },
    {
      key: "seller",
      label: "Seller",
      sortable: true,
      render: (w) => (
        <div>
          <p className="font-medium">{w.seller?.shop_name || "Unknown"}</p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (w) => (
        <div>
          <p className="font-semibold text-emerald-600">₦{w.amount?.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Receives: ₦{w.seller_receives?.toLocaleString()}</p>
        </div>
      ),
    },
    {
      key: "bank_details",
      label: "Bank Details",
      render: (w) => (
        <div className="text-xs">
          <p className="font-semibold">{w.bank_name || "N/A"}</p>
          <p>{w.account_number || "N/A"}</p>
          <p className="text-muted-foreground">{w.account_name || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (w) => <StatusBadge status={w.status} />,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (w) => <span className="text-xs text-muted-foreground">{new Date(w.created_at?.item).toLocaleString()}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (w) => {
        if (w.status !== "pending" && w.status !== "processing") {
          return null
        }
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setConfirmAction({ withdrawal: w, action: "complete" })}
              className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
              title="Complete"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmAction({ withdrawal: w, action: "reject" })}
              className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmAction({ withdrawal: w, action: "cancel" })}
              className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
              title="Cancel"
            >
              <Ban className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Banknote className="h-6 w-6 text-brand" /> Withdrawals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage seller withdrawal requests.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading withdrawals...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={withdrawals}
          rowKey={(w) => w.id}
          searchPlaceholder="Search by reference or seller..."
          searchFilter={(w, q) =>
            w.reference.toLowerCase().includes(q) ||
            (w.seller?.shop_name || "").toLowerCase().includes(q)
          }
          pageSize={10}
        />
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
            setRejectReason("")
          }
        }}
        onConfirm={handleAction}
        title={
          confirmAction?.action === "complete"
            ? "Complete Withdrawal"
            : confirmAction?.action === "reject"
            ? "Reject Withdrawal"
            : "Cancel Withdrawal"
        }
        description={`Are you sure you want to ${confirmAction?.action} withdrawal ${confirmAction?.withdrawal.reference}?`}
        confirmLabel={
          actionLoading
            ? "Processing..."
            : confirmAction?.action === "complete"
            ? "Yes, Complete"
            : confirmAction?.action === "reject"
            ? "Yes, Reject"
            : "Yes, Cancel"
        }
        destructive={confirmAction?.action !== "complete"}
      >
        {confirmAction?.action === "reject" && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Reason for Rejection</label>
            <textarea
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-brand focus:outline-none"
              rows={3}
              placeholder="Enter reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
