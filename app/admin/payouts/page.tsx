"use client"

import { useEffect, useState } from "react"
import { Coins, CheckCircle, Loader2, History } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchAdminPayouts,
  fetchAdminPayoutHistory,
  markAdminPayoutPaid,
  type AdminPayout,
} from "@/lib/admin-api"
import { toast } from "sonner"

export default function AdminPayoutsPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [payouts, setPayouts] = useState<AdminPayout[]>([])
  const [history, setHistory] = useState<AdminPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")

  const [confirmPayout, setConfirmPayout] = useState<AdminPayout | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    if (!token) return
    try {
      setLoading(true)
      const [pendingRes, historyRes] = await Promise.all([
        fetchAdminPayouts(token),
        fetchAdminPayoutHistory(token),
      ])
      setPayouts(pendingRes.data?.payouts || [])
      setHistory(historyRes.data?.history || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load payouts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleMarkPaid = async () => {
    if (!confirmPayout || !token) return
    setActionLoading(true)
    try {
      await markAdminPayoutPaid(confirmPayout.id, token)
      toast.success("Payout marked as paid")
      setConfirmPayout(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to mark payout as paid")
    } finally {
      setActionLoading(false)
    }
  }

  const columns: Column<AdminPayout>[] = [
    {
      key: "reference",
      label: "Reference",
      sortable: true,
      render: (p) => <span className="font-semibold text-brand">{p.reference}</span>,
    },
    {
      key: "seller",
      label: "Seller",
      sortable: true,
      render: (p) => <span className="font-medium">{p.seller?.shop_name || "Unknown"}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (p) => <span className="font-bold text-emerald-600">₦{p.amount?.toLocaleString()}</span>,
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
  ]

  const pendingColumns: Column<AdminPayout>[] = [
    ...columns,
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (p) =>
        p.status === "pending" ? (
          <button
            onClick={() => setConfirmPayout(p)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Mark Paid
          </button>
        ) : null,
    },
  ]

  const currentData = activeTab === "pending" ? payouts : history
  const currentColumns = activeTab === "pending" ? pendingColumns : columns

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Coins className="h-6 w-6 text-brand" /> Seller Payouts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage pending seller payouts and view history.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface/60 p-1 w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === "pending"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Coins className="h-3.5 w-3.5" /> Pending
          {payouts.length > 0 && (
            <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] text-brand font-bold">
              {payouts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === "history"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-3.5 w-3.5" /> History
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading payouts...</p>
        </div>
      ) : (
        <DataTable
          columns={currentColumns}
          data={currentData}
          rowKey={(p) => p.id}
          searchPlaceholder="Search by reference or seller..."
          searchFilter={(p, q) =>
            p.reference?.toLowerCase().includes(q) ||
            (p.seller?.shop_name || "").toLowerCase().includes(q)
          }
          pageSize={15}
        />
      )}

      <ConfirmDialog
        open={!!confirmPayout}
        onOpenChange={(open) => !open && setConfirmPayout(null)}
        title="Mark Payout as Paid"
        description={`Are you sure you want to mark payout ${confirmPayout?.reference} for ${confirmPayout?.seller?.shop_name} as paid? This action cannot be undone.`}
        confirmLabel={actionLoading ? "Processing..." : "Yes, Mark Paid"}
        destructive={false}
        onConfirm={handleMarkPaid}
      />
    </div>
  )
}
