"use client"

import { useEffect, useState } from "react"
import { Coins, CheckCircle, Loader2, History } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchAdminPayouts,
  fetchAdminPayoutHistory,
  fetchAdminPayoutLines,
  markAdminPayoutPaid,
  type AdminPayout,
} from "@/lib/admin-api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function money(amount: number | undefined, currency = "NGN") {
  const prefix = currency === "NGN" || !currency ? "₦" : `${currency} `
  return `${prefix}${(amount ?? 0).toLocaleString()}`
}

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
      setPayouts(pendingRes.data?.seller_payouts || [])
      setHistory(historyRes.data?.seller_payouts || [])
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
      // The aggregated payout doesn't carry line ids, so fetch this seller's
      // payable settlement lines and settle them.
      const linesRes = await fetchAdminPayoutLines(confirmPayout.seller.id, token)
      const orderItemIds = (linesRes.data?.lines || [])
        .filter((l) => l.settlement_status === "payable")
        .map((l) => l.id)
      if (orderItemIds.length === 0) {
        toast.error("No payable lines found for this seller.")
        setConfirmPayout(null)
        return
      }
      await markAdminPayoutPaid(orderItemIds, token)
      toast.success(`Payout for ${confirmPayout.seller.shop_name} marked as paid`)
      setConfirmPayout(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to mark payout as paid")
    } finally {
      setActionLoading(false)
    }
  }

  const baseColumns: Column<AdminPayout>[] = [
    {
      key: "seller",
      label: "Seller",
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold">{p.seller?.shop_name || "Unknown"}</p>
          <p className="text-[11px] text-muted-foreground">/{p.seller?.slug}</p>
        </div>
      ),
    },
    {
      key: "line_count",
      label: "Items",
      sortable: true,
      render: (p) => <span className="text-sm">{p.line_count ?? 0}</span>,
    },
    {
      key: "amount",
      label: activeTab === "history" ? "Paid Out" : "Payable",
      sortable: true,
      render: (p) => (
        <span className="font-bold text-emerald-600">
          {money(activeTab === "history" ? (p.paid_total ?? p.payable_total) : p.payable_total, p.currency)}
        </span>
      ),
    },
  ]

  const pendingColumns: Column<AdminPayout>[] = [
    ...baseColumns,
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (p) =>
        (p.payable_total ?? 0) > 0 ? (
          <Button
            type="button"
            onClick={() => setConfirmPayout(p)}
            className="h-auto gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Mark Paid
          </Button>
        ) : null,
    },
  ]

  const historyColumns: Column<AdminPayout>[] = [
    ...baseColumns,
    {
      key: "paid_at",
      label: "Paid On",
      sortable: true,
      render: (p) => (
        <span className="text-xs text-muted-foreground">
          {p.paid_at?.item ? new Date(p.paid_at.item).toLocaleString() : "—"}
        </span>
      ),
    },
  ]

  const currentData = activeTab === "pending" ? payouts : history
  const currentColumns = activeTab === "pending" ? pendingColumns : historyColumns

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Coins className="h-6 w-6 text-brand" /> Seller Payouts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Settle payable balances owed to sellers and view payout history.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface/60 p-1 w-fit">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab("pending")}
          className={`h-auto flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold ${
            activeTab === "pending"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Coins className="h-3.5 w-3.5" /> Payable
          {payouts.length > 0 && (
            <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] text-brand font-bold">
              {payouts.length}
            </span>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab("history")}
          className={`h-auto flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold ${
            activeTab === "history"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-3.5 w-3.5" /> History
        </Button>
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
          rowKey={(p) => p.seller?.id ?? p.seller?.slug}
          searchPlaceholder="Search by seller..."
          searchFilter={(p, q) => (p.seller?.shop_name || "").toLowerCase().includes(q)}
          pageSize={15}
        />
      )}

      <ConfirmDialog
        open={!!confirmPayout}
        onOpenChange={(open) => !open && setConfirmPayout(null)}
        title="Mark Payout as Paid"
        description={`Settle ${money(confirmPayout?.payable_total, confirmPayout?.currency)} across ${confirmPayout?.line_count ?? 0} item(s) for ${confirmPayout?.seller?.shop_name}? This action cannot be undone.`}
        confirmLabel={actionLoading ? "Processing..." : "Yes, Mark Paid"}
        destructive={false}
        onConfirm={handleMarkPaid}
        loading={actionLoading}
      />
    </div>
  )
}
