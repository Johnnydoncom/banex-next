"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { fetchAdminCategory, createAdminCategory, updateAdminCategory, deleteAdminCategory } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminCategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isNew = id === "new"
  const router = useRouter()
  const { data: session } = useSession()

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "box",
    sort_order: "1",
    is_active: "true",
  })
  
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (session?.accessToken && id !== "new") {
      loadCategory()
    }
  }, [session?.accessToken, id])

  const loadCategory = async () => {
    try {
      setLoading(true)
      const res = await fetchAdminCategory(id, session!.accessToken!)
      const cat = res.data.category
      setForm({
        name: cat.name || "",
        slug: cat.slug || "",
        description: "", // The API model doesn't explicitly have description but we'll leave it in the form
        icon: cat.icon || "box",
        sort_order: cat.sort_order?.toString() || "1",
        is_active: cat.is_active ? "true" : "false",
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to load category")
      router.push("/admin/categories")
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!session?.accessToken) return
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append("name", form.name)
      if (form.slug) fd.append("slug", form.slug)
      fd.append("icon", form.icon)
      fd.append("sort_order", String(parseInt(form.sort_order, 10) || 0))
      fd.append("is_active", form.is_active === "true" ? "1" : "0")

      if (isNew) {
        await createAdminCategory(fd, session.accessToken)
        toast.success("Category created successfully.")
      } else {
        await updateAdminCategory(id, fd, session.accessToken)
        toast.success("Category updated successfully.")
      }

      router.push("/admin/categories")
    } catch (err: any) {
      toast.error(err.message || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!session?.accessToken || isNew) return
    if (!confirm(`Delete category "${form.name}"? This may affect products assigned to it.`)) return
    setDeleting(true)
    try {
      await deleteAdminCategory(id, session.accessToken)
      toast.success("Category deleted")
      router.push("/admin/categories")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/categories" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to categories
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold">{isNew ? "Add Category" : "Edit Category"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{isNew ? "Create a new product category." : "Update category details."}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <Label htmlFor="cat-name" className="mb-1.5 block text-xs text-muted-foreground">Category Name</Label>
            <Input id="cat-name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
          </div>
          <div>
            <Label htmlFor="cat-slug" className="mb-1.5 block text-xs text-muted-foreground">Slug</Label>
            <Input id="cat-slug" type="text" value={form.slug} onChange={(e) => update("slug", e.target.value)} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
          </div>
          <div>
            <Label htmlFor="cat-icon" className="mb-1.5 block text-xs text-muted-foreground">Icon (lucide name)</Label>
            <Input id="cat-icon" type="text" value={form.icon} onChange={(e) => update("icon", e.target.value)} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cat-sort" className="mb-1.5 block text-xs text-muted-foreground">Sort Order</Label>
              <Input id="cat-sort" type="number" value={form.sort_order} onChange={(e) => update("sort_order", e.target.value)} className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand" />
            </div>
            <div>
              <Label htmlFor="cat-status" className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
              <Select value={form.is_active} onValueChange={(v) => update("is_active", v)}>
                <SelectTrigger id="cat-status" className="rounded-xl px-4 py-2.5 h-auto"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 flex justify-between border-t border-border pt-4">
            {!isNew && (
              <Button type="button" variant="ghost" onClick={handleDelete} disabled={deleting} className="h-auto gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {deleting ? "Deleting…" : "Delete Category"}
              </Button>
            )}
            <Button type="button" onClick={handleSave} disabled={saving} className="h-auto gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Category"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
