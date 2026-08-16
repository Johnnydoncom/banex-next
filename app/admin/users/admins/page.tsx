"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DataTable, type Column } from "@/components/DataTable"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Shield, ShieldAlert, Shield as ShieldIcon, Loader2, Plus, Edit2, Ban, ArrowLeft, KeyRound } from "lucide-react"
import {
  fetchAdmins, fetchAdminRoles, createAdmin, updateAdmin, toggleAdminSuspension,
  type AdminStaff, type AdminRole,
} from "@/lib/admin-api"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type FormState = { name: string; email: string; phone: string; password: string; role: string }
const emptyForm: FormState = { name: "", email: "", phone: "", password: "", role: "" }

export default function AdminStaffPage() {
  const { session, user } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [admins, setAdmins] = useState<AdminStaff[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminStaff | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [suspendTarget, setSuspendTarget] = useState<AdminStaff | null>(null)
  const [suspending, setSuspending] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [adminsRes, rolesRes] = await Promise.all([fetchAdmins(token), fetchAdminRoles(token)])
      setAdmins(adminsRes.data?.admins ?? [])
      setRoles(rolesRes.data?.roles ?? [])
    } catch (e: any) {
      toast.error(e.message || "Failed to load administrators")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const upd = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, role: roles[0]?.name ?? "" })
    setModalOpen(true)
  }

  const openEdit = (a: AdminStaff) => {
    setEditing(a)
    setForm({ name: a.full_name || "", email: a.email, phone: a.phone || "", password: "", role: a.role || "" })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!token) return
    if (!form.name.trim()) return toast.error("Name is required.")
    if (!form.email.trim()) return toast.error("Email is required.")
    if (!form.role) return toast.error("Select a role.")
    if (!editing && !form.password.trim()) return toast.error("Password is required for a new admin.")

    setSaving(true)
    try {
      if (editing) {
        const payload: any = { name: form.name.trim(), email: form.email.trim(), role: form.role, phone: form.phone.trim() || undefined }
        if (form.password.trim()) payload.password = form.password.trim()
        await updateAdmin(editing.id, payload, token)
        toast.success("Administrator updated.")
      } else {
        await createAdmin(
          { name: form.name.trim(), email: form.email.trim(), password: form.password.trim(), role: form.role, phone: form.phone.trim() || undefined },
          token,
        )
        toast.success("Administrator created.")
      }
      setModalOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message || "Failed to save administrator")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSuspension = async () => {
    if (!token || !suspendTarget) return
    setSuspending(true)
    try {
      await toggleAdminSuspension(suspendTarget.id, token)
      toast.success(suspendTarget.is_suspended ? "Administrator reinstated." : "Administrator suspended.")
      setSuspendTarget(null)
      load()
    } catch (e: any) {
      toast.error(e.message || "Failed to update suspension")
    } finally {
      setSuspending(false)
    }
  }

  const columns: Column<AdminStaff>[] = [
    {
      key: "name",
      label: "Staff Member",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${a.is_super_admin ? "bg-brand/10 text-brand" : "bg-rose-500/10 text-rose-500"}`}>
            {a.is_super_admin ? <ShieldIcon className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-medium">
              {a.full_name || "Unknown"} {(user as any)?.id === a.id && <span className="text-xs text-muted-foreground">(You)</span>}
            </p>
            <p className="text-xs text-muted-foreground">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (a) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium">
          <KeyRound className="h-3 w-3 text-muted-foreground" />
          {a.role_label || a.role || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (a) =>
        a.is_suspended ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-600"><ShieldAlert className="h-3 w-3" /> Suspended</span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
        ),
    },
    {
      key: "created_at",
      label: "Joined",
      sortable: true,
      render: (a) => <span className="text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at.item).toLocaleDateString() : "—"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (a) => {
        const isSelf = (user as any)?.id === a.id
        return (
          <div className="flex items-center justify-end gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(a)} className="h-auto w-auto rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground" title="Edit">
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            {!isSelf && !a.is_super_admin && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setSuspendTarget(a)} className={`h-auto w-auto rounded-lg p-1.5 ${a.is_suspended ? "text-emerald-600 hover:bg-emerald-500/15" : "text-muted-foreground hover:bg-rose-500/15 hover:text-rose-600"}`} title={a.is_suspended ? "Reinstate" : "Suspend"}>
                <Ban className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/users" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Administrators</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage staff members with console access and their roles.</p>
          </div>
        </div>
        <Button type="button" onClick={openCreate} className="inline-flex h-auto items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-deep">
          <Plus className="h-4 w-4" /> Add Admin
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="text-sm font-medium text-muted-foreground">Loading administrators…</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={admins}
          rowKey={(a) => a.id}
          searchPlaceholder="Search staff by name or email…"
          searchFilter={(a, q) => (a.full_name || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)}
          pageSize={15}
        />
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold">{editing ? "Edit Administrator" : "Add Administrator"}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">Full Name</Label>
                <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="e.g. Jane Doe" className="rounded-xl px-3 py-2.5" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="name@banexmall.com" className="rounded-xl px-3 py-2.5" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">Phone (optional)</Label>
                <Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+234…" className="rounded-xl px-3 py-2.5" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">Role</Label>
                <Select value={form.role} onValueChange={(v) => upd("role", v)}>
                  <SelectTrigger className="h-auto rounded-xl px-3 py-2.5"><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold">{editing ? "New Password (leave blank to keep)" : "Password"}</Label>
                <Input type="password" value={form.password} onChange={(e) => upd("password", e.target.value)} placeholder="••••••••" className="rounded-xl px-3 py-2.5" autoComplete="new-password" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" onClick={handleSave} disabled={saving} className="h-auto flex-1 gap-2 rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save Changes" : "Create Admin"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="h-auto flex-1 rounded-full py-2.5 text-sm font-semibold">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title={suspendTarget?.is_suspended ? "Reinstate administrator?" : "Suspend administrator?"}
        description={suspendTarget?.is_suspended
          ? `${suspendTarget?.full_name || "This admin"} will regain console access.`
          : `${suspendTarget?.full_name || "This admin"} will lose access to the admin console until reinstated.`}
        confirmLabel={suspendTarget?.is_suspended ? "Reinstate" : "Suspend"}
        destructive={!suspendTarget?.is_suspended}
        onConfirm={handleToggleSuspension}
        loading={suspending}
      />
    </div>
  )
}
