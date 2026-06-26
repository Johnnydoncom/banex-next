"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { fetchAdminCategory, createAdminCategory, updateAdminCategory } from "@/lib/admin-api"

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

  useEffect(() => {
    if (!isNew && session?.accessToken) {
      loadCategory()
    }
  }, [isNew, session])

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
      const payload = {
        ...form,
        sort_order: parseInt(form.sort_order, 10),
        is_active: form.is_active === "true",
      }

      if (isNew) {
        await createAdminCategory(payload, session.accessToken)
        toast.success("Category created successfully.")
      } else {
        await updateAdminCategory(id, payload, session.accessToken)
        toast.success("Category updated successfully.")
      }
      
      router.push("/admin/categories")
    } catch (err: any) {
      toast.error(err.message || "Failed to save category")
    } finally {
      setSaving(false)
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
            <label htmlFor="cat-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">Category Name</label>
            <input id="cat-name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>
          <div>
            <label htmlFor="cat-slug" className="mb-1.5 block text-xs font-medium text-muted-foreground">Slug</label>
            <input id="cat-slug" type="text" value={form.slug} onChange={(e) => update("slug", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>
          <div>
            <label htmlFor="cat-icon" className="mb-1.5 block text-xs font-medium text-muted-foreground">Icon (lucide name)</label>
            <input id="cat-icon" type="text" value={form.icon} onChange={(e) => update("icon", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cat-sort" className="mb-1.5 block text-xs font-medium text-muted-foreground">Sort Order</label>
              <input id="cat-sort" type="number" value={form.sort_order} onChange={(e) => update("sort_order", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
            </div>
            <div>
              <label htmlFor="cat-status" className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
              <select id="cat-status" value={form.is_active} onChange={(e) => update("is_active", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-border pt-4">
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
              {saving ? "Saving…" : "Save Category"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
