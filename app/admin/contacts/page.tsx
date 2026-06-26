"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client"

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

type Contact = {
  id: string
  label: string
  phone_number: string
  is_active: boolean
  sellers_count?: number
}

export default function AdminContactsPage() {
  const { session, loading: authLoading } = useAuth()
  const token = (session as any)?.accessToken

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ label: "", phone_number: "", is_active: true })
  
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) {
      setLoading(false)
      return
    }
    const fetchContacts = async () => {
      try {
        const res = await apiGet<any>("api/admin/whatsapp-contacts", { token })
        if (res?.success) {
          setContacts(res.data.whatsapp_contacts || [])
        }
      } catch (err) {
        toast.error("Failed to load contacts")
      } finally {
        setLoading(false)
      }
    }
    fetchContacts()
  }, [token, authLoading])

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingId(contact.id)
      setForm({ label: contact.label, phone_number: contact.phone_number, is_active: contact.is_active })
    } else {
      setEditingId(null)
      setForm({ label: "", phone_number: "", is_active: true })
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingId) {
        const res = await apiPut<any>(`api/admin/whatsapp-contacts/${editingId}`, form, { token })
        if (res?.success) {
          setContacts((prev) => prev.map((c) => (c.id === editingId ? res.data.whatsapp_contact : c)))
          toast.success("Contact updated.")
        }
      } else {
        const res = await apiPost<any>("api/admin/whatsapp-contacts", form, { token })
        if (res?.success) {
          setContacts((prev) => [...prev, res.data.whatsapp_contact])
          toast.success("Contact added.")
        }
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to save contact")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    try {
      await apiDelete(`api/admin/whatsapp-contacts/${deleteId}`, { token })
      setContacts((prev) => prev.filter((c) => c.id !== deleteId))
      toast.success("Contact deleted.")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contact")
    } finally {
      setSaving(false)
      setDeleteId(null)
    }
  }

  const columns: Column<Contact>[] = [
    {
      key: "label",
      label: "Label",
      sortable: true,
      render: (c) => <span className="font-semibold">{c.label}</span>,
    },
    {
      key: "phone_number",
      label: "Phone Number",
      render: (c) => <span className="text-sm font-mono text-muted-foreground">{c.phone_number}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      render: (c) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.is_active ? 'bg-emerald-500/15 text-emerald-700' : 'bg-zinc-500/15 text-zinc-600'}`}>
          {c.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => handleOpenModal(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setDeleteId(c.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">WhatsApp Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage official support numbers displayed to users.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-brand">
          <Plus className="h-3.5 w-3.5" /> Add Contact
        </button>
      </div>

      <DataTable columns={columns} data={contacts} rowKey={(c) => c.id} emptyState={loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading contacts...</div> : undefined} />

      {/* Simple Custom Modal for Demo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="font-display text-xl font-bold mb-4">{editingId ? "Edit Contact" : "Add Contact"}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Label</label>
                <input type="text" value={form.label} onChange={(e) => setForm(f => ({...f, label: e.target.value}))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" placeholder="e.g. Vendor Support" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone Number</label>
                <input type="text" value={form.phone_number} onChange={(e) => setForm(f => ({...f, phone_number: e.target.value}))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono" placeholder="+234..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({...f, is_active: e.target.checked}))} className="rounded border-border text-brand focus:ring-brand" />
                <span className="text-sm font-medium">Active (visible to users)</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <button onClick={() => setModalOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Contact?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  )
}
