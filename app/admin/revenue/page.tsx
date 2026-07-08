"use client"

import { useEffect, useState } from "react"
import { TrendingUp, ArrowUpCircle, Clock, DollarSign, Loader2, Receipt } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminRevenueSummary, fetchAdminRevenueLines, type AdminRevenueSummary, type AdminRevenueLine } from "@/lib/admin-api"
import { toast } from "sonner"
import { DataTable, type Column } from "@/components/DataTable"

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
      fetchAdminRevenueSummary(token).then((res) => setSummary(res.data?.summary || null)),
      fetchAdminRevenueLines(token).then((res) => setLines(res.data?.lines || [])),
    ])
      .catch((err) => toast.error(err.message || "Failed to load revenue data"))
      .finally(() => setLoading(false))
  }, [token])

  const stats = [
    {
      label: "Total Revenue",
      value: summary?.total_revenue ?? 0,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pending Revenue",
      value: summary?.pending_revenue ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Available Revenue",
      value: summary?.available_revenue ?? 0,
      icon: DollarSign,
      color: "text-brand",
      bg: "bg-brand/10",
    },
  ]

  const columns: Column<AdminRevenueLine>[] = [
    {
      key: "description",
      label: "Description",
      sortable: true,
      render: (l) => <span className="font-medium">{l.description || "—"}</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (l) => (
        <span className="inline-block rounded-full bg-surface px-2 py-0.5 text-xs font-medium capitalize">
          {l.type}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (l) => (
        <span className="font-semibold text-emerald-600">₦{l.amount?.toLocaleString()}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (l) => (
        <span className="text-xs text-muted-foreground">
          {new Date(l.created_at?.item).toLocaleString()}
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
        <p className="mt-1 text-sm text-muted-foreground">Platform revenue overview and transaction lines.</p>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading revenue data...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold">₦{s.value.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Lines */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-brand" /> Revenue Lines
            </h2>
            <DataTable
              columns={columns}
              data={lines}
              rowKey={(l) => l.id}
              searchPlaceholder="Search transactions..."
              searchFilter={(l, q) =>
                (l.description || "").toLowerCase().includes(q) ||
                (l.type || "").toLowerCase().includes(q)
              }
              pageSize={15}
            />
          </div>
        </>
      )}
    </div>
  )
}
