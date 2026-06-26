"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { fetchAdminCategories, deleteAdminCategory, type AdminCategory } from "@/lib/admin-api"

export default function AdminCategoriesPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (session?.accessToken) {
      loadCategories()
    }
  }, [session?.accessToken])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const res = await fetchAdminCategories(session!.accessToken!)
      setCategories(res.data.categories)
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId || !session?.accessToken) return
    setDeleting(true)

    try {
      await deleteAdminCategory(deleteId, session.accessToken)
      setCategories((prev) => prev.filter((c) => c.id !== deleteId))
      toast.success("Category deleted successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const columns: Column<AdminCategory>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (c) => (
        <div>
          <Link href={`/admin/categories/${c.id}`} className="font-semibold hover:text-brand">
            {c.name}
          </Link>
          <p className="text-[11px] text-muted-foreground">/{c.slug}</p>
        </div>
      ),
    },
    {
      key: "sort_order",
      label: "Sort Order",
      sortable: true,
      render: (c) => (
        <span className="text-sm text-muted-foreground">{c.sort_order}</span>
      ),
    },
    {
      key: "listings_count",
      label: "Listings",
      sortable: true,
      render: (c) => <span className="text-sm font-semibold">{c.listings_count}</span>,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (c) => <span className="text-xs text-muted-foreground">{new Date(c.created_at.item).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/admin/categories/${c.id}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground" title="Edit">
            <Edit2 className="h-3.5 w-3.5" />
          </Link>
          <button onClick={() => setDeleteId(c.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-600" title="Delete">
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
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage product categories and subcategories.</p>
        </div>
        <Link href="/admin/categories/new" className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-brand">
          <Plus className="h-3.5 w-3.5" /> Add Category
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          rowKey={(c) => c.id}
          searchPlaceholder="Search categories…"
          searchFilter={(c, q) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)}
          pageSize={15}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This may affect products currently assigned to it."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
