"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Shield, ShieldCheck, Plus, Edit2, Trash2, Loader2, Lock, KeyRound } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  fetchAdminRoles, createAdminRole, updateAdminRole, deleteAdminRole,
  type AdminRole,
} from "@/lib/admin-api"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// "orders.view" → group "orders", action "view". Group permissions by resource.
function groupPermissions(perms: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const p of perms) {
    const [resource] = p.split(".")
    ;(groups[resource] ||= []).push(p)
  }
  return groups
}

const prettify = (s: string) => s.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export default function AdminRolesPage() {
  const { session } = useAuth()
  const token = (session as any)?.accessToken as string | undefined

  const [roles, setRoles] = useState<AdminRole[]>([])
  const [allPermissions, setAllPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminRole | null>(null)
  const [form, setForm] = useState<{ name: string; label: string; permissions: string[] }>({ name: "", label: "", permissions: [] })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetchAdminRoles(token)
      setRoles(res.data?.roles ?? [])
      setAllPermissions(res.data?.permissions ?? [])
    } catch (e: any) {
      toast.error(e.message || "Failed to load roles")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const grouped = useMemo(() => groupPermissions(allPermissions), [allPermissions])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", label: "", permissions: [] })
    setModalOpen(true)
  }

  const openEdit = (r: AdminRole) => {
    setEditing(r)
    setForm({ name: r.name, label: r.label || "", permissions: [...(r.permissions || [])] })
    setModalOpen(true)
  }

  const togglePerm = (p: string) =>
    setForm((f) => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p] }))

  const toggleGroup = (perms: string[]) =>
    setForm((f) => {
      const allOn = perms.every((p) => f.permissions.includes(p))
      const set = new Set(f.permissions)
      perms.forEach((p) => (allOn ? set.delete(p) : set.add(p)))
      return { ...f, permissions: [...set] }
    })

  const readOnly = !!editing?.is_system

  const handleSave = async () => {
    if (!token) return
    if (!editing && !form.name.trim()) return toast.error("Enter a role key (e.g. finance_admin).")
    if (form.permissions.length === 0) return toast.error("Select at least one permission.")
    setSaving(true)
    try {
      if (editing) {
        await updateAdminRole(editing.name, { label: form.label.trim() || undefined, permissions: form.permissions }, token)
        toast.success("Role updated.")
      } else {
        await createAdminRole({ name: form.name.trim(), label: form.label.trim() || undefined, permissions: form.permissions }, token)
        toast.success("Role created.")
      }
      setModalOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message || "Failed to save role")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminRole(deleteTarget.name, token)
      toast.success("Role deleted.")
      setDeleteTarget(null)
      load()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete role")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Roles &amp; Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define what each admin role can access. System roles are locked.</p>
        </div>
        <Button type="button" onClick={openCreate} className="inline-flex h-auto items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-deep">
          <Plus className="h-4 w-4" /> Create Role
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div key={r.name} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${r.is_system ? "bg-brand/10 text-brand" : "bg-emerald-500/10 text-emerald-600"}`}>
                    {r.is_system ? <ShieldCheck className="h-[18px] w-[18px]" /> : <Shield className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="font-display font-bold">{r.label || prettify(r.name)}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{r.name}</p>
                  </div>
                </div>
                {r.is_system && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"><Lock className="h-2.5 w-2.5" /> System</span>
                )}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" /> {r.permissions?.length ?? 0} permission{(r.permissions?.length ?? 0) === 1 ? "" : "s"}
              </p>
              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <Button type="button" variant="outline" onClick={() => openEdit(r)} className="h-auto flex-1 gap-1.5 rounded-lg py-2 text-xs font-semibold">
                  <Edit2 className="h-3.5 w-3.5" /> {r.is_system ? "View" : "Edit"}
                </Button>
                {!r.is_system && (
                  <Button type="button" variant="ghost" onClick={() => setDeleteTarget(r)} className="h-auto gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit / View modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border p-6">
              <h3 className="font-display text-lg font-bold">{editing ? (readOnly ? "Role Permissions" : "Edit Role") : "Create Role"}</h3>
              {readOnly && <p className="mt-1 text-xs text-amber-600">This is a system role — its permissions can't be changed.</p>}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold">Role Key</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))} disabled={!!editing} placeholder="e.g. finance_admin" className="rounded-xl px-3 py-2.5 font-mono" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold">Display Label</Label>
                  <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} disabled={readOnly} placeholder="e.g. Finance Admin" className="rounded-xl px-3 py-2.5" />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs font-semibold">Permissions</Label>
                  <span className="text-[11px] text-muted-foreground">{form.permissions.length} selected</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(grouped).map(([resource, perms]) => {
                    const allOn = perms.every((p) => form.permissions.includes(p))
                    return (
                      <div key={resource} className="rounded-xl border border-border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wide text-brand-deep">{prettify(resource)}</p>
                          {!readOnly && (
                            <button type="button" onClick={() => toggleGroup(perms)} className="text-[11px] font-semibold text-brand hover:underline">
                              {allOn ? "Clear" : "Select all"}
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((p) => {
                            const on = form.permissions.includes(p)
                            return (
                              <button
                                key={p}
                                type="button"
                                disabled={readOnly}
                                onClick={() => togglePerm(p)}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-70 ${on ? "border-brand bg-brand text-primary-foreground" : "border-border bg-card hover:border-brand"}`}
                              >
                                {p.split(".").slice(1).join(".") || p}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-border p-6">
              {!readOnly && (
                <Button type="button" onClick={handleSave} disabled={saving} className="h-auto flex-1 gap-2 rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save Changes" : "Create Role"}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="h-auto flex-1 rounded-full py-2.5 text-sm font-semibold">{readOnly ? "Close" : "Cancel"}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete role?"
        description={`Delete the "${deleteTarget?.label || deleteTarget?.name}" role? Admins with this role will lose its permissions.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
