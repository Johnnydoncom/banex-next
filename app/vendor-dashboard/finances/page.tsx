"use client"

import { useState } from "react"
import {
  Landmark, ArrowUpRight, ArrowDownRight, Plus, Trash2, Edit2,
  AlertCircle, Clock, CheckCircle2, XCircle, CreditCard,
  TrendingUp, BarChart3, Wallet, List, ChevronLeft, ChevronRight, Loader2
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  userCreateBankAccount, userUpdateBankAccount, userDeleteBankAccount,
  type BankAccountData,
} from "@/lib/user-api"
import { sellerCreateWithdrawal } from "@/lib/seller-api"
import { formatNaira } from "@/lib/products"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useSellerWallet,
  useSellerTransactions,
  useSellerEarnings,
  useSellerEarningsLines,
  useSellerWithdrawals,
  useBankAccounts,
} from "@/hooks/use-swr-data"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withdrawStatus(status: string) {
  switch (status) {
    case "approved": return { l: "Approved", c: "bg-emerald-500/15 text-emerald-700", Icon: CheckCircle2 }
    case "processed": return { l: "Processed", c: "bg-blue-500/15 text-blue-700", Icon: CheckCircle2 }
    case "rejected": return { l: "Rejected", c: "bg-rose-500/15 text-rose-700", Icon: XCircle }
    case "cancelled": return { l: "Cancelled", c: "bg-rose-500/15 text-rose-700", Icon: XCircle }
    case "pending": return { l: "Pending", c: "bg-amber-500/15 text-amber-700", Icon: Clock }
    default: return { l: status, c: "bg-surface text-muted-foreground", Icon: AlertCircle }
  }
}

function earningsStatus(status: string) {
  switch (status) {
    case "paid_out":
    case "settled": return { l: "Paid Out", c: "bg-emerald-500/15 text-emerald-700" }
    case "payable": return { l: "Payable", c: "bg-blue-500/15 text-blue-700" }
    case "void":
    case "reversed": return { l: "Void", c: "bg-rose-500/15 text-rose-700" }
    default: return { l: "Pending", c: "bg-amber-500/15 text-amber-700" }
  }
}

function fmtDate(val: { item: string } | string | undefined) {
  if (!val) return ""
  const raw = typeof val === "string" ? val : val.item
  return new Date(raw).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
}

type Tab = "overview" | "earnings" | "transactions" | "withdrawals"

// ─── Component ────────────────────────────────────────────────────────────────

export default function VendorFinancesPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [tab, setTab] = useState<Tab>("overview")
  const [txPage, setTxPage] = useState(1)
  const [earningsPage, setEarningsPage] = useState(1)
  const [withdrawPage, setWithdrawPage] = useState(1)

  // Data hooks — all using SELLER-specific endpoints
  const { wallet, loading: walletLoading, mutate: mutateWallet } = useSellerWallet(token)
  const { transactions, pagination: txPag, loading: txLoading, mutate: mutateTx } = useSellerTransactions(token, txPage)
  const { earnings, loading: earningsLoading, mutate: mutateEarnings } = useSellerEarnings(token)
  const { lines, pagination: linesPag, loading: linesLoading } = useSellerEarningsLines(token, earningsPage)
  const { withdrawals, pagination: wdPag, loading: withdrawLoading, mutate: mutateWithdrawals } = useSellerWithdrawals(token, withdrawPage)
  const { bankAccounts, loading: banksLoading, mutate: mutateBanks } = useBankAccounts(token)

  const balance = wallet?.balance ?? null

  // Modals
  const [showBankModal, setShowBankModal] = useState(false)
  const [editBank, setEditBank] = useState<BankAccountData | null>(null)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  // Bank form
  const [bankForm, setBankForm] = useState({ bank_name: "", account_number: "", account_name: "", is_default: false })
  const [savingBank, setSavingBank] = useState(false)

  // Withdraw form
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", bank_account_id: "" })
  const [savingWithdraw, setSavingWithdraw] = useState(false)

  function openAddBank() {
    setEditBank(null)
    setBankForm({ bank_name: "", account_number: "", account_name: "", is_default: bankAccounts.length === 0 })
    setShowBankModal(true)
  }

  function openEditBank(b: BankAccountData) {
    setEditBank(b)
    setBankForm({ bank_name: b.bank_name, account_number: b.account_number, account_name: b.account_name, is_default: b.is_default })
    setShowBankModal(true)
  }

  async function handleSaveBank() {
    setSavingBank(true)
    try {
      if (editBank) {
        await userUpdateBankAccount(editBank.id, bankForm)
        toast.success("Bank account updated")
      } else {
        await userCreateBankAccount(bankForm)
        toast.success("Bank account added")
      }
      mutateBanks()
      setShowBankModal(false)
    } catch (e: any) {
      toast.error(e.message || "Failed to save bank account")
    } finally {
      setSavingBank(false)
    }
  }

  async function handleDeleteBank(id: string) {
    if (!confirm("Remove this bank account?")) return
    try {
      await userDeleteBankAccount(id)
      mutateBanks()
      toast.success("Bank account removed")
    } catch (e: any) {
      toast.error(e.message || "Failed to delete bank account")
    }
  }

  async function handleWithdraw() {
    if (!token) return
    const amt = parseFloat(withdrawForm.amount)
    if (isNaN(amt) || amt <= 0) { toast.error("Invalid amount"); return }
    if (!withdrawForm.bank_account_id) { toast.error("Select a bank account"); return }
    if (balance !== null && amt > balance) { toast.error("Insufficient balance"); return }

    setSavingWithdraw(true)
    try {
      await sellerCreateWithdrawal({ amount: amt, bank_account_id: withdrawForm.bank_account_id }, token)
      mutateWithdrawals()
      mutateWallet()
      toast.success("Withdrawal request submitted")
      setShowWithdrawModal(false)
      setWithdrawForm(f => ({ ...f, amount: "" }))
    } catch (e: any) {
      toast.error(e.message || "Failed to submit withdrawal")
    } finally {
      setSavingWithdraw(false)
    }
  }

  const TABS: { id: Tab; label: string; Icon: any }[] = [
    { id: "overview", label: "Overview", Icon: Wallet },
    { id: "earnings", label: "Earnings", Icon: BarChart3 },
    { id: "transactions", label: "Transactions", Icon: List },
    { id: "withdrawals", label: "Withdrawals", Icon: Landmark },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Finances</h1>
          <p className="text-sm text-muted-foreground">Earnings, wallet balance, transactions, and withdrawals.</p>
        </div>
        <Button variant="ghost" type="button"
          onClick={() => setShowWithdrawModal(true)}
          disabled={!balance || balance <= 0 || bankAccounts.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowUpRight className="h-4 w-4" /> Withdraw Funds
        </Button>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Wallet balance */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100/70">Available Balance</p>
          <p className="mt-2 font-display text-3xl font-bold">
            {walletLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : balance !== null ? formatNaira(balance) : "—"}
          </p>
          <p className="mt-1 text-xs text-emerald-100/60">{wallet?.currency ?? "NGN"}</p>
        </div>
        {/* Lifetime earned */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Lifetime Earnings</p>
          <p className="mt-2 font-display text-2xl font-bold">
            {earningsLoading ? "..." : earnings?.lifetime_total !== undefined ? formatNaira(earnings.lifetime_total) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Net of commission</p>
        </div>
        {/* Payable */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Available to Withdraw</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-600">
            {earningsLoading ? "..." : earnings?.payable_total !== undefined ? formatNaira(earnings.payable_total) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Cleared for payout</p>
        </div>
        {/* Pending */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pending</p>
          <p className="mt-2 font-display text-2xl font-bold text-amber-600">
            {earningsLoading ? "..." : earnings?.pending_total !== undefined ? formatNaira(earnings.pending_total) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Awaiting clearance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map(t => (
          <Button variant="ghost" type="button"
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              tab === t.id
                ? "bg-emerald-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
            }`}
          >
            <t.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </Button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bank accounts */}
          <div className="lg:col-span-1 space-y-4">
            <section className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <p className="font-display text-sm font-semibold">Bank Accounts</p>
                <Button variant="ghost" type="button" onClick={openAddBank} className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {banksLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
              ) : bankAccounts.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm font-medium">No bank accounts</p>
                  <p className="text-xs text-muted-foreground mt-1">Add a bank account to withdraw funds.</p>
                  <Button variant="ghost" type="button" onClick={openAddBank} className="mt-3 text-xs font-semibold text-emerald-600 hover:underline">+ Add account</Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {bankAccounts.map(b => (
                    <li key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface/20 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{b.bank_name}</p>
                          {b.is_default && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-600">Default</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{b.account_number} · {b.account_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" type="button" onClick={() => openEditBank(b)} className="text-muted-foreground hover:text-emerald-600"><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" type="button" onClick={() => handleDeleteBank(b.id)} className="text-muted-foreground hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Recent withdrawals */}
          <div className="lg:col-span-2">
            <section className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <p className="font-display text-sm font-semibold">Recent Withdrawals</p>
                <Button variant="ghost" type="button" onClick={() => setTab("withdrawals")} className="text-xs font-medium text-emerald-600 hover:underline">View all</Button>
              </div>
              {withdrawLoading ? (
                <div className="p-6 text-center animate-pulse text-sm text-muted-foreground">Loading...</div>
              ) : withdrawals.length === 0 ? (
                <div className="p-12 text-center">
                  <Landmark className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-3 font-medium">No withdrawals yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Your withdrawal requests will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface/40">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">Amount</th>
                        <th className="px-5 py-3 font-semibold hidden sm:table-cell">Account</th>
                        <th className="px-5 py-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {withdrawals.slice(0, 5).map(w => {
                        const st = withdrawStatus(w.status)
                        return (
                          <tr key={w.id} className="hover:bg-surface/20 transition-colors">
                            <td className="px-5 py-3 text-xs text-muted-foreground">{fmtDate(w.created_at)}</td>
                            <td className="px-5 py-3 font-semibold">{formatNaira(w.amount)}</td>
                            <td className="px-5 py-3 hidden sm:table-cell">
                              <p className="text-xs font-medium">{w.bank_name}</p>
                              <p className="text-[10px] text-muted-foreground">***{w.account_number?.slice(-4)}</p>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${st.c}`}>
                                <st.Icon className="h-3 w-3" /> {st.l}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ── Earnings tab ── */}
      {tab === "earnings" && (
        <div className="space-y-6">
          {/* Summary cards */}
          {earnings && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Lifetime Earnings</p>
                <p className="mt-2 font-display text-2xl font-bold">{formatNaira(earnings.lifetime_total)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/10 bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Paid Out</p>
                <p className="mt-2 font-display text-2xl font-bold text-emerald-600">{formatNaira(earnings.paid_out_total)}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/10 bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pending Payout</p>
                <p className="mt-2 font-display text-2xl font-bold text-amber-600">{formatNaira(earnings.pending_total)}</p>
              </div>
            </div>
          )}

          {/* Earnings lines */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <p className="font-display text-sm font-semibold">Earnings Breakdown</p>
              <p className="text-xs text-muted-foreground mt-0.5">Per-order commission and net earnings</p>
            </div>
            {linesLoading ? (
              <div className="p-10 text-center animate-pulse text-sm text-muted-foreground">Loading earnings...</div>
            ) : lines.length === 0 ? (
              <div className="p-12 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 font-medium text-sm">No earnings yet</p>
                <p className="text-xs text-muted-foreground mt-1">Earnings appear after customers purchase from your store.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface/40">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Order</th>
                        <th className="px-5 py-3 font-semibold text-right">Gross</th>
                        <th className="px-5 py-3 font-semibold text-right text-rose-600">Commission</th>
                        <th className="px-5 py-3 font-semibold text-right text-emerald-600">You Receive</th>
                        <th className="px-5 py-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lines.map(l => {
                        const st = earningsStatus(l.settlement_status ?? l.status ?? "")
                        return (
                          <tr key={l.id} className="hover:bg-surface/20 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-semibold font-display">{l.order_reference}</p>
                              <p className="text-[10px] text-muted-foreground">{fmtDate(l.created_at)}</p>
                            </td>
                            <td className="px-5 py-3 text-right">{formatNaira(l.line_total ?? l.gross_amount ?? 0)}</td>
                            <td className="px-5 py-3 text-right text-rose-600">
                              -{formatNaira(l.line_platform_fee ?? l.commission_amount ?? 0)}
                              <span className="ml-1 text-[10px] text-muted-foreground">({l.commission_percent}%)</span>
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-emerald-600">{formatNaira(l.line_seller_total ?? l.net_amount ?? 0)}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${st.c}`}>{st.l}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {linesPag && linesPag.last_page > 1 && (
                  <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
                    <span>Page {linesPag.current_page} of {linesPag.last_page}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" type="button" disabled={earningsPage <= 1} onClick={() => setEarningsPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40 hover:bg-surface"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" type="button" disabled={earningsPage >= linesPag.last_page} onClick={() => setEarningsPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40 hover:bg-surface"><ChevronRight className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {/* ── Transactions tab ── */}
      {tab === "transactions" && (
        <section className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="font-display text-sm font-semibold">Wallet Transactions</p>
            <p className="text-xs text-muted-foreground mt-0.5">All credits and debits from your seller wallet</p>
          </div>
          {txLoading ? (
            <div className="p-10 text-center animate-pulse text-sm text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <List className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 font-medium text-sm">No transactions yet</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {transactions.map(t => (
                  <li key={t.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.type === "credit" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                        {t.type === "credit" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtDate(t.created_at)}</p>
                        {t.reference && <p className="text-[10px] text-muted-foreground">Ref: {t.reference}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${t.type === "credit" ? "text-emerald-600" : "text-foreground"}`}>
                        {t.type === "credit" ? "+" : "-"}{formatNaira(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Bal: {formatNaira(t.balance_after)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {txPag && txPag.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
                  <span>Page {txPag.current_page} of {txPag.last_page} · {txPag.total} total</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" type="button" disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40 hover:bg-surface"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" type="button" disabled={txPage >= txPag.last_page} onClick={() => setTxPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40 hover:bg-surface"><ChevronRight className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Withdrawals tab ── */}
      {tab === "withdrawals" && (
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <p className="font-display text-sm font-semibold">Withdrawal History</p>
              <p className="text-xs text-muted-foreground mt-0.5">All withdrawal requests from your seller wallet</p>
            </div>
            <Button variant="ghost" type="button"
              onClick={() => setShowWithdrawModal(true)}
              disabled={!balance || balance <= 0 || bankAccounts.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" /> New Withdrawal
            </Button>
          </div>
          {withdrawLoading ? (
            <div className="p-10 text-center animate-pulse text-sm text-muted-foreground">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-12 text-center">
              <Landmark className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 font-medium text-sm">No withdrawals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Request a withdrawal to transfer earnings to your bank.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface/40">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold hidden sm:table-cell">Account</th>
                      <th className="px-5 py-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map(w => {
                      const st = withdrawStatus(w.status)
                      return (
                        <tr key={w.id} className="hover:bg-surface/20 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-brand">{w.reference}</td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">{fmtDate(w.created_at)}</td>
                          <td className="px-5 py-3 font-bold">{formatNaira(w.amount)}</td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <p className="text-xs font-medium">{w.bank_name}</p>
                            <p className="text-[10px] text-muted-foreground">***{w.account_number?.slice(-4)}</p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${st.c}`}>
                              <st.Icon className="h-3 w-3" /> {st.l}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {wdPag && wdPag.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
                  <span>Page {wdPag.current_page} of {wdPag.last_page} · {wdPag.total} total</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" type="button" disabled={withdrawPage <= 1} onClick={() => setWithdrawPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40 hover:bg-surface"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" type="button" disabled={withdrawPage >= wdPag.last_page} onClick={() => setWithdrawPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40 hover:bg-surface"><ChevronRight className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Bank Account Modal ── */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold">{editBank ? "Edit Bank Account" : "Add Bank Account"}</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium">
                Bank Name
                <Input value={bankForm.bank_name} onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))} className="mt-1" placeholder="e.g. GTBank" />
              </label>
              <label className="block text-xs font-medium">
                Account Number
                <Input value={bankForm.account_number} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))} className="mt-1" placeholder="10 digits" />
              </label>
              <label className="block text-xs font-medium">
                Account Name
                <Input value={bankForm.account_name} onChange={e => setBankForm(f => ({ ...f, account_name: e.target.value }))} className="mt-1" placeholder="John Doe" />
              </label>
              <label className="flex items-center gap-2 text-xs font-medium mt-2">
                <Checkbox checked={bankForm.is_default} onCheckedChange={(checked) => setBankForm(f => ({ ...f, is_default: checked as boolean }))} />
                Set as default for withdrawals
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" type="button" onClick={handleSaveBank} disabled={savingBank || !bankForm.bank_name || !bankForm.account_number} className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-700">
                {savingBank ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" type="button" onClick={() => setShowBankModal(false)} className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Withdraw Modal ── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold">Withdraw Funds</h3>
            <p className="mt-1 text-xs text-muted-foreground">Available balance: <strong className="text-foreground">{formatNaira(balance ?? 0)}</strong></p>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-medium">
                Amount (₦)
                <Input type="number" value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} className="mt-1" placeholder="0.00" />
              </label>
              <label className="block text-xs font-medium">
                Withdraw to
                <div className="mt-1">
                  <Select value={withdrawForm.bank_account_id} onValueChange={(val) => setWithdrawForm(f => ({ ...f, bank_account_id: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.bank_name} - ***{b.account_number.slice(-4)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" type="button" onClick={handleWithdraw} disabled={savingWithdraw || !withdrawForm.amount || !withdrawForm.bank_account_id} className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-700">
                {savingWithdraw ? "Processing..." : "Withdraw"}
              </Button>
              <Button variant="ghost" type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
