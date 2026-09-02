"use client"

import { use, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { fetchAdminCategory, createAdminCategory, updateAdminCategory, deleteAdminCategory, appendSeoFields, type AdminCategory } from "@/lib/admin-api"
import { useAdminCategories } from "@/hooks/use-swr-data"
import { rootCategories } from "@/lib/categories"
import { SeoFieldsEditor, emptySeo, seoFromApi, type SeoFields } from "@/components/SeoFieldsEditor"
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
    parent_id: "",
  })

  // Root categories the new/edited category can be nested under.
  const { categories: allCategories } = useAdminCategories(session?.accessToken as string | undefined)
  const parentOptions = rootCategories(allCategories as AdminCategory[]).filter((c) => c.id !== id)
  
  // Category image (multipart `image`) + SEO overrides.
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [seo, setSeo] = useState<SeoFields>(emptySeo())
  const [seoResolved, setSeoResolved] = useState<NonNullable<AdminCategory["seo"]>["resolved"] | null>(null)

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
        parent_id: cat.parent_id || "",
      })
      setExistingImageUrl(cat.image_url ?? null)
      setSeo(seoFromApi(cat.seo))
      setSeoResolved(cat.seo?.resolved ?? null)
    } catch (err: any) {
      toast.error(err.message || "Failed to load category")
      router.push("/admin/categories")
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearPickedImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

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
      // Send parent_id only when nesting under a root — omitting it keeps/creates a
      // top-level category. (The API rejects an empty parent_id and enforces a
      // 2-level hierarchy: a category with subcategories can't itself be nested.)
      if (form.parent_id) fd.append("parent_id", form.parent_id)
      if (imageFile) fd.append("image", imageFile)
      appendSeoFields(fd, seo)

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
            <Label htmlFor="cat-parent" className="mb-1.5 block text-xs text-muted-foreground">Parent Category</Label>
            <Select value={form.parent_id || "none"} onValueChange={(v) => update("parent_id", v === "none" ? "" : v)}>
              <SelectTrigger id="cat-parent" className="rounded-xl px-4 py-2.5 h-auto"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top-level category)</SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">Choose a parent to make this a subcategory. Leave as top-level for a department.</p>
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

          {/* Category image */}
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Category Image</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 flex-none overflow-hidden rounded-xl border border-border bg-surface">
                {imagePreview || existingImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview || existingImageUrl || ""} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-auto gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
                  <ImagePlus className="h-3.5 w-3.5" /> {existingImageUrl || imagePreview ? "Replace image" : "Upload image"}
                </Button>
                {imageFile && (
                  <Button type="button" variant="ghost" onClick={clearPickedImage} className="h-auto gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-rose-600">
                    <X className="h-3 w-3" /> Cancel new image
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground">Shown on the category hero and used for the OG share image.</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImagePick} />
            </div>
          </div>

          {/* SEO */}
          <div className="border-t border-border pt-4">
            <h2 className="mb-1 font-display text-sm font-semibold">SEO</h2>
            <p className="mb-4 text-xs text-muted-foreground">How this category page appears on Google and social shares.</p>
            <SeoFieldsEditor value={seo} onChange={(patch) => setSeo((s) => ({ ...s, ...patch }))} resolved={seoResolved} />
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
