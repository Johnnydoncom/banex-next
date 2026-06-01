"use client"

import { useEffect, useState } from "react"
import { MapPin, Plus, Trash2, Star } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

type Address = {
  id: string
  label: string
  recipient: string
  phone: string
  street: string
  city: string
  state: string
  country: string
  is_default: boolean
}

export default function AddressesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Address[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    label: "Home",
    recipient: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "Nigeria",
    is_default: false,
  })

  const load = async () => {
    if (!user) return

    // ----- ACTUAL FETCH IMPLEMENTATION (Commented out) -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const res = await fetch(`${apiUrl}/user/addresses`, { headers })
      const data = await res.json()
      setItems(data?.data || [])
    } catch (err) {
      console.error(err)
    }
    */

    // ----- MOCK DATA IMPLEMENTATION -----
    setItems([
      {
        id: "1", label: "Home", recipient: "Johnny Doncom", phone: "08012345678",
        street: "123 Main St", city: "Lagos", state: "Lagos", country: "Nigeria", is_default: true
      }
    ])
  }

  useEffect(() => {
    void load()
  }, [user])

  const save = async () => {
    if (!user) return
    if (!form.recipient || !form.phone || !form.street || !form.city || !form.state) {
      toast.error("Fill in all fields")
      return
    }

    // ----- ACTUAL FETCH IMPLEMENTATION (Commented out) -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const res = await fetch(`${apiUrl}/user/addresses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error("Failed to add address")
    } catch (err: any) {
      toast.error(err.message)
      return
    }
    */

    // ----- MOCK UPDATE -----
    setItems(prev => [
      ...prev.map(i => form.is_default ? { ...i, is_default: false } : i),
      { ...form, id: Math.random().toString() }
    ])
    
    toast.success("Address added")
    setOpen(false)
    setForm({ label: "Home", recipient: "", phone: "", street: "", city: "", state: "", country: "Nigeria", is_default: false })
  }

  const remove = async (id: string) => {
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      await fetch(`${apiUrl}/user/addresses/${id}`, { method: 'DELETE', headers })
    } catch (err) {
      console.error(err)
    }
    */
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success("Address removed")
  }

  const setDefault = async (id: string) => {
    if (!user) return
    // ----- ACTUAL FETCH IMPLEMENTATION -----
    /*
    try {
      const token = (user as any).accessToken
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      await fetch(`${apiUrl}/user/addresses/${id}/default`, { method: 'POST', headers })
    } catch (err) {
      console.error(err)
    }
    */
    setItems(prev => prev.map(i => ({ ...i, is_default: i.id === id })))
    toast.success("Default address updated")
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Addresses</h1>
          <p className="text-sm text-muted-foreground">Where should your orders be delivered?</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground">
              <Plus className="h-3.5 w-3.5" /> Add address
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New address</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              {[
                ["label", "Label (Home, Office...)"],
                ["recipient", "Recipient full name"],
                ["phone", "Phone"],
                ["street", "Street address"],
                ["city", "City"],
                ["state", "State"],
                ["country", "Country"],
              ].map(([k, label]) => (
                <label key={k} className="block">
                  <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                  <input
                    value={(form as never)[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
                  />
                </label>
              ))}
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                />
                Set as default
              </label>
            </div>
            <DialogFooter>
              <button onClick={save} className="rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground">
                Save address
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No addresses yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add a delivery address to speed up checkout.</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((a) => (
            <li key={a.id} className="relative rounded-2xl border border-border bg-card p-4">
              {a.is_default && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-soft/40 px-2 py-0.5 text-[10px] font-semibold text-brand-deep">
                  <Star className="h-2.5 w-2.5 fill-brand text-brand" /> Default
                </span>
              )}
              <p className="font-display text-sm font-semibold">{a.label}</p>
              <p className="mt-1 text-sm">{a.recipient}</p>
              <p className="text-xs text-muted-foreground">{a.phone}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {a.street}, {a.city}, {a.state}, {a.country}
              </p>
              <div className="mt-4 flex gap-2">
                {!a.is_default && (
                  <button onClick={() => setDefault(a.id)} className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium hover:border-brand hover:text-brand">
                    Set default
                  </button>
                )}
                <button onClick={() => remove(a.id)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-rose-600 hover:border-rose-500">
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
