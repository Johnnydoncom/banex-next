"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Clock, DollarSign, Loader2, Receipt, Wallet, CheckCircle2, HandCoins } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminRevenueSummary, fetchAdminRevenueLines, type AdminRevenueSummary, type AdminRevenueLine } from "@/lib/admin-api"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"

function money(amount: number | undefined, currency = "NGN") {
  const prefix = currency === "NGN" || !currency ? "₦" : `${currency} `
  return `${prefix}${(amount ?? 0).toLocaleString()}`
}

export default function AdminRevenuePage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [summary, setSummary] = useState<AdminRevenueSummary | null>(null)
  const [lines, setLines] = useState<AdminRevenueLine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([
      fetchAdminRevenueSummary(token).then((res) => setSummary(res.data?.platform_revenue ?? null)),
      fetchAdminRevenueLines(token).then((res) => setLines(res.data?.lines ?? [])),
    ])
      .catch((err) => toast.error(err.message || "Failed to load revenue data"))
      .finally(() => setLoading(false))
  }, [token])

  const currency = summary?.currency ?? "NGN"

  // Platform commission earnings.
  const feeStats = [
    { label: "Anticipated Fee", value: summary?.anticipated_fee, hint: "Projected across all orders", icon: TrendingUp, color: "text-brand", bg: "bg-brand/10" },
    { label: "Collectible Fee", value: summary?.collectible_fee, hint: "Ready to collect", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Payable Fee", value: summary?.payable_fee, hint: "Awaiting settlement", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Realized Fee", value: summary?.realized_fee, hint: "Collected to date", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  ]

  // Seller payout obligations.
  const payoutStats = [
    { label: "Pending Payouts", value: summary?.seller_payouts?.pending_total, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Payable Payouts", value: summary?.seller_payouts?.payable_total, icon: HandCoins, color: "text-brand", bg: "bg-brand/10" },
    { label: "Paid Out", value: summary?.seller_payouts?.paid_out_total, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  ]

  const columns: Column<AdminRevenueLine>[] = [
    {
      key: "product_name",
      label: "Product / Order",
      sortable: true,
      render: (l) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{l.product_name || "—"}</p>
          <p className="text-[11px] text-muted-foreground">{l.order_reference} · Qty {l.quantity}</p>
        </div>
      ),
    },
    {
      key: "seller",
      label: "Seller",
      render: (l) => <span className="text-sm">{l.seller?.shop_name || "—"}</span>,
    },
    {
      key: "line_total",
      label: "Order Value",
      sortable: true,
      render: (l) => <span className="text-sm">{money(l.line_total, l.currency)}</span>,
    },
    {
      key: "line_platform_fee",
      label: "Platform Fee",
      sortable: true,
      render: (l) => (
        <div>
          <p className="font-semibold text-emerald-600">{money(l.line_platform_fee, l.currency)}</p>
          <p className="text-[11px] text-muted-foreground">{l.commission_percent}% commission</p>
        </div>
      ),
    },
    {
      key: "settlement_status",
      label: "Settlement",
      sortable: true,
      render: (l) => <StatusBadge status={l.settlement_status} />,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (l) => (
        <span className="text-xs text-muted-foreground">
          {l.created_at?.item ? new Date(l.created_at.item).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-brand" /> Revenue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform commission earnings and seller payout obligations.</p>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading revenue data...</p>
        </div>
      ) : (
        <>
          {/* Platform commission */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform Commission</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {feeStats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-bold">{money(s.value, currency)}</p>
                      <p className="text-[10px] text-muted-foreground">{s.hint}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seller payouts */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seller Payouts</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {payoutStats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-bold">{money(s.value, currency)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Lines */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-brand" /> Revenue Lines
              {summary?.line_counts && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({summary.line_counts.pending} pending · {summary.line_counts.payable} payable · {summary.line_counts.paid_out} paid out)
                </span>
              )}
            </h2>
            <DataTable
              columns={columns}
              data={lines}
              rowKey={(l) => l.id}
              searchPlaceholder="Search by product, order or seller..."
              searchFilter={(l, q) =>
                (l.product_name || "").toLowerCase().includes(q) ||
                (l.order_reference || "").toLowerCase().includes(q) ||
                (l.seller?.shop_name || "").toLowerCase().includes(q)
              }
              pageSize={15}
            />
          </div>
        </>
      )}
    </div>
  )
}
