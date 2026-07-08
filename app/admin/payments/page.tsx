"use client"

import { useEffect, useState } from "react"
import { CreditCard, CheckCircle, XCircle, Download, Loader2, ExternalLink } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchAdminPayments,
  approveAdminPayment,
  rejectAdminPayment,
  downloadAdminPaymentProof,
  type AdminPayment,
} from "@/lib/admin-api"
import { toast } from "sonner"

type ActionType = "approve" | "reject"

export default function AdminPaymentsPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected">("all")

  const [confirmAction, setConfirmAction] = useState<{
    payment: AdminPayment
    action: ActionType
  } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetchAdminPayments(token)
      setPayments(res.data?.payments || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const filtered = payments.filter((p) => tab === "all" || p.status === tab)

  const tabs: { key: typeof tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: payments.length },
    { key: "pending", label: "Pending", count: payments.filter((p) => p.status === "pending").length },
    { key: "approved", label: "Approved", count: payments.filter((p) => p.status === "approved").length },
    { key: "rejected", label: "Rejected", count: payments.filter((p) => p.status === "rejected").length },
  ]

  const handleAction = async () => {
    if (!confirmAction || !token) return
    setActionLoading(true)
    try {
      if (confirmAction.action === "approve") {
        await approveAdminPayment(confirmAction.payment.id, token)
        toast.success("Payment approved")
      } else {
        if (!rejectReason.trim()) {
          toast.error("Please provide a rejection reason")
          setActionLoading(false)
          return
        }
        await rejectAdminPayment(confirmAction.payment.id, token, rejectReason)
        toast.success("Payment rejected")
      }
      setConfirmAction(null)
      setRejectReason("")
      loadData()
    } catch (err: any) {
      toast.error(err.message || `Failed to ${confirmAction.action} payment`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadProof = async (payment: AdminPayment) => {
    if (!token) return
    try {
      if (payment.proof_of_payment_url) {
        window.open(payment.proof_of_payment_url, "_blank")
        return
      }
      const res = await downloadAdminPaymentProof(payment.id, token)
      if (res.data?.url) window.open(res.data.url, "_blank")
    } catch (err: any) {
      toast.error("Could not retrieve proof of payment")
    }
  }

  const columns: Column<AdminPayment>[] = [
    {
      key: "reference",
      label: "Reference",
      sortable: true,
      render: (p) => <span className="font-semibold text-brand">{p.reference}</span>,
    },
    {
      key: "order",
      label: "Order / Customer",
      render: (p) => (
        <div className="text-sm">
          <p className="font-medium">{p.order?.reference || "—"}</p>
          <p className="text-xs text-muted-foreground">{p.order?.customer?.full_name || "Unknown"}</p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (p) => <span className="font-semibold">₦{p.amount?.toLocaleString()}</span>,
    },
    {
      key: "method",
      label: "Method",
      render: (p) => (
        <span className="inline-block rounded-full bg-surface px-2 py-0.5 text-xs font-medium capitalize">
          {p.method}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (p) => (
        <span className="text-xs text-muted-foreground">
          {new Date(p.created_at?.item).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          {p.proof_of_payment_url && (
            <button
              onClick={() => handleDownloadProof(p)}
              className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
              title="View Proof"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {p.status === "pending" && (
            <>
              <button
                onClick={() => setConfirmAction({ payment: p, action: "approve" })}
                className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                title="Approve"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmAction({ payment: p, action: "reject" })}
                className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                title="Reject"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-brand" /> Payments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and action payment transactions.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-surface/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 min-w-[80px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-border/50 px-1.5 py-0.5 text-[10px] text-foreground">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading payments...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(p) => p.id}
          searchPlaceholder="Search by reference or customer..."
          searchFilter={(p, q) =>
            p.reference?.toLowerCase().includes(q) ||
            (p.order?.customer?.full_name || "").toLowerCase().includes(q)
          }
          pageSize={15}
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
        title={confirmAction?.action === "approve" ? "Approve Payment" : "Reject Payment"}
        description={`Are you sure you want to ${confirmAction?.action} payment ${confirmAction?.payment?.reference}?`}
        confirmLabel={
          actionLoading
            ? "Processing..."
            : confirmAction?.action === "approve"
            ? "Yes, Approve"
            : "Yes, Reject"
        }
        destructive={confirmAction?.action === "reject"}
        onConfirm={handleAction}
      />
    </div>
  )
}
