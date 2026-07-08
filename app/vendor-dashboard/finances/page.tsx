"use client"

import { useEffect, useState } from "react"
import { Landmark, ArrowUpRight, ArrowDownRight, Plus, Trash2, Edit2, AlertCircle, Clock, CheckCircle2, XCircle, CreditCard } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  userFetchWallet, userFetchBankAccounts, userFetchWithdrawals,
  userCreateBankAccount, userUpdateBankAccount, userDeleteBankAccount,
  userCreateWithdrawal, type BankAccountData, type WithdrawalData
} from "@/lib/user-api"
import { formatNaira } from "@/lib/products"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function withdrawStatus(status: string) {
  switch (status) {
    case "approved": return { l: "Approved", c: "bg-emerald-500/15 text-emerald-700", icon: CheckCircle2 }
    case "processed": return { l: "Processed", c: "bg-blue-500/15 text-blue-700", icon: CheckCircle2 }
    case "rejected": return { l: "Rejected", c: "bg-rose-500/15 text-rose-700", icon: XCircle }
    case "pending": return { l: "Pending", c: "bg-amber-500/15 text-amber-700", icon: Clock }
    default: return { l: status, c: "bg-surface text-muted-foreground", icon: AlertCircle }
  }
}

export default function VendorFinancesPage() {
  const { user } = useAuth()
  
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      userFetchWallet().catch(() => null),
      userFetchBankAccounts().catch(() => []),
      userFetchWithdrawals().catch(() => ({ withdrawals: [], pagination: null }))
    ]).then(([wRes, bRes, wdRes]) => {
      setBalance(wRes?.wallet?.balance ?? 0)
      setTransactions(wRes?.transactions ?? [])
      setBankAccounts(bRes as BankAccountData[])
      setWithdrawals((wdRes as any)?.withdrawals ?? [])
      
      // Auto-select default bank for withdrawal if available
      const defBank = (bRes as BankAccountData[]).find(b => b.is_default) || (bRes as BankAccountData[])[0]
      if (defBank) {
        setWithdrawForm(f => ({ ...f, bank_account_id: defBank.id }))
      }
    }).finally(() => setLoading(false))
  }, [user])

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
        const updated = await userUpdateBankAccount(editBank.id, bankForm)
        if (updated) setBankAccounts(prev => prev.map(b => b.id === updated.id ? updated : b))
        toast.success("Bank account updated")
      } else {
        const created = await userCreateBankAccount(bankForm)
        if (created) setBankAccounts(prev => [...prev, created])
        toast.success("Bank account added")
      }
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
      setBankAccounts(prev => prev.filter(b => b.id !== id))
      toast.success("Bank account removed")
    } catch (e: any) {
      toast.error(e.message || "Failed to delete bank account")
    }
  }

  async function handleWithdraw() {
    const amt = parseFloat(withdrawForm.amount)
    if (isNaN(amt) || amt <= 0) { toast.error("Invalid amount"); return }
    if (!withdrawForm.bank_account_id) { toast.error("Select a bank account"); return }
    if (balance !== null && amt > balance) { toast.error("Insufficient balance"); return }
    
    setSavingWithdraw(true)
    try {
      const res = await userCreateWithdrawal({ amount: amt, bank_account_id: withdrawForm.bank_account_id })
      if (res?.withdrawal) setWithdrawals(prev => [res.withdrawal, ...prev])
      if (res?.wallet) setBalance(res.wallet.balance)
      toast.success("Withdrawal request submitted")
      setShowWithdrawModal(false)
      setWithdrawForm(f => ({ ...f, amount: "" }))
    } catch (e: any) {
      toast.error(e.message || "Failed to submit withdrawal")
    } finally {
      setSavingWithdraw(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Finances & Wallet</h1>
        <p className="text-sm text-muted-foreground">Manage your earnings, bank accounts, and withdrawals.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Wallet & Banks */}
        <div className="space-y-6 lg:col-span-1">
          {/* Balance Card */}
          <section className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-lg">
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100/70">Available Balance</p>
              <p className="mt-2 font-display text-4xl font-bold">
                {loading ? "..." : balance !== null ? formatNaira(balance) : "—"}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={loading || !balance || balance <= 0 || bankAccounts.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-80 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" /> Withdraw
                </button>
              </div>
            </div>
            {/* BG pattern */}
            <Landmark className="absolute -bottom-6 -right-6 h-32 w-32 text-white opacity-10" />
          </section>

          {/* Bank Accounts */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="font-display text-sm font-semibold">Bank Accounts</p>
              <button onClick={openAddBank} className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {loading ? (
              <div className="p-5 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
            ) : bankAccounts.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm font-medium">No bank accounts</p>
                <p className="text-xs text-muted-foreground mt-1">Add a bank account to withdraw funds.</p>
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
                      <button onClick={() => openEditBank(b)} className="text-muted-foreground hover:text-emerald-600"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDeleteBank(b.id)} className="text-muted-foreground hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right Column: Transactions & Withdrawals */}
        <div className="space-y-6 lg:col-span-2">
          {/* Withdrawal History */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <p className="font-display text-sm font-semibold">Withdrawal History</p>
            </div>
            {loading ? (
              <div className="p-5 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
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
                      <th className="px-5 py-3 font-semibold">Account</th>
                      <th className="px-5 py-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map(w => {
                      const st = withdrawStatus(w.status)
                      const Icon = st.icon
                      return (
                        <tr key={w.id} className="hover:bg-surface/20 transition-colors">
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {new Date(w.created_at as any).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 font-semibold">{formatNaira(w.amount)}</td>
                          <td className="px-5 py-3">
                            <p className="text-xs font-medium">{w.bank_name}</p>
                            <p className="text-[10px] text-muted-foreground">***{w.account_number.slice(-4)}</p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${st.c}`}>
                              <Icon className="h-3 w-3" /> {st.l}
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

          {/* Recent Wallet Transactions */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <p className="font-display text-sm font-semibold">Recent Transactions</p>
            </div>
            {loading ? (
              <div className="p-5 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No recent transactions.</div>
            ) : (
              <ul className="divide-y divide-border">
                {transactions.map(t => (
                  <li key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.type === 'credit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                        {t.type === 'credit' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className={`font-semibold text-sm ${t.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
                      {t.type === 'credit' ? '+' : '-'}{formatNaira(t.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Modals */}
      
      {/* Bank Account Modal */}
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
              <button onClick={handleSaveBank} disabled={savingBank || !bankForm.bank_name || !bankForm.account_number} className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-700">
                {savingBank ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setShowBankModal(false)} className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
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
              <button onClick={handleWithdraw} disabled={savingWithdraw || !withdrawForm.amount || !withdrawForm.bank_account_id} className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-emerald-700">
                {savingWithdraw ? "Processing..." : "Withdraw"}
              </button>
              <button onClick={() => setShowWithdrawModal(false)} className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-semibold hover:border-foreground/30">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
