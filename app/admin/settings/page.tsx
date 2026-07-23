"use client"

import { useState, useEffect } from "react"
import { Loader2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { fetchAdminPaymentMethods, updateAdminPaymentMethod, type AdminPaymentMethod } from "@/lib/admin-api"
import { Switch } from "@/components/ui/switch"

export default function AdminSettingsPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>([])
  const [loadingPMs, setLoadingPMs] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoadingPMs(true)
    fetchAdminPaymentMethods(token)
      .then((res) => setPaymentMethods(res.data?.payment_methods || []))
      .catch(() => toast.error("Failed to load payment methods"))
      .finally(() => setLoadingPMs(false))
  }, [token])

  const togglePaymentMethod = async (pm: AdminPaymentMethod) => {
    if (!token) return
    const nextActive = pm.status !== "active"
    const nextStatus = nextActive ? "active" : "inactive"
    setSavingId(pm.id)
    // Optimistic update
    setPaymentMethods((prev) => prev.map((p) => (p.id === pm.id ? { ...p, status: nextStatus } : p)))
    try {
      await updateAdminPaymentMethod(pm.id, { status: nextStatus }, token)
      toast.success(`${pm.name} is now ${nextStatus}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment method")
      // Revert on failure
      setPaymentMethods((prev) => prev.map((p) => (p.id === pm.id ? { ...p, status: pm.status } : p)))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6 container">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure marketplace payment methods.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <section>
          <h2 className="font-display text-lg font-semibold border-b border-border pb-2 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand" /> Payment Methods
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Enable or disable the payment methods buyers can use at checkout.
          </p>
          {loadingPMs ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-surface/30">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/30 p-6 text-center text-sm text-muted-foreground">
              No payment methods found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{pm.name}</h3>
                    <p className="text-xs text-muted-foreground">{pm.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {savingId === pm.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Switch
                      checked={pm.status === "active"}
                      disabled={savingId === pm.id}
                      onCheckedChange={() => togglePaymentMethod(pm)}
                      aria-label={`Toggle ${pm.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
