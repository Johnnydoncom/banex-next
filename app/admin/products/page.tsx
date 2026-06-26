"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Eye, Check, X, Power, PowerOff, Loader2 } from "lucide-react"
import { DataTable, type Column } from "@/components/DataTable"
import { StatusBadge } from "@/components/StatusBadge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { fetchAdminProducts, updateAdminProductStatus, type AdminProduct } from "@/lib/admin-api"

type Tab = "all" | "pending" | "active" | "inactive"

export default function AdminProductsPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<Tab>("all")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<{ product: AdminProduct; action: "approve" | "reject" | "activate" | "deactivate" } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (session?.accessToken) {
      loadProducts()
    }
  }, [session])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await fetchAdminProducts(session!.accessToken!)
      setProducts(res.data.products)
    } catch (err: any) {
      toast.error(err.message || "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter((p) => {
    if (tab === "pending") return p.status === "pending"
    if (tab === "active") return p.status === "active"
    if (tab === "inactive") return p.status === "inactive" || p.status === "rejected" || p.status === "draft"
    return true
  })

  const handleAction = async () => {
    if (!confirmAction || !session?.accessToken) return
    setActionLoading(true)

    try {
      await updateAdminProductStatus(confirmAction.product.id, confirmAction.action, session.accessToken)
      
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== confirmAction.product.id) return p
          const statusMap: Record<string, AdminProduct["status"]> = {
            approve: "active",
            reject: "rejected",
            activate: "active",
            deactivate: "inactive",
          }
          return { ...p, status: statusMap[confirmAction.action] || p.status }
        }),
      )

      toast.success(`Product ${confirmAction.action}d successfully.`)
    } catch (err: any) {
      toast.error(err.message || `Failed to ${confirmAction.action} product`)
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: products.length },
    { key: "pending", label: "Pending Review", count: products.filter((p) => p.status === "pending").length },
    { key: "active", label: "Active", count: products.filter((p) => p.status === "active").length },
    { key: "inactive", label: "Inactive", count: products.filter((p) => p.status === "inactive" || p.status === "rejected" || p.status === "draft").length },
  ]

  const columns: Column<AdminProduct>[] = [
    {
      key: "name",
      label: "Product",
      sortable: true,
      render: (p) => {
        const primaryImage = p.images?.find((img) => img.is_primary)?.url || p.images?.[0]?.url || "/assets/placeholder.jpg"
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-none overflow-hidden rounded-xl border border-border">
              <Image src={primaryImage} alt={p.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <Link href={`/admin/products/${p.id}`} className="truncate text-sm font-semibold hover:text-brand">
                {p.name}
              </Link>
              <p className="text-[11px] text-muted-foreground">{p.category?.name || "Uncategorized"}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "seller",
      label: "Seller",
      sortable: true,
      render: (p) => <span className="text-sm">{p.seller?.shop_name || "—"}</span>,
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (p) => <span className="text-sm font-semibold">{p.currency === "NGN" ? "₦" : p.currency}{p.price.toLocaleString()}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (p) => <StatusBadge status={p.status as any} />,
    },
    {
      key: "createdAt",
      label: "Added",
      sortable: true,
      render: (p) => <span className="text-xs text-muted-foreground">{new Date(p.created_at.item).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/admin/products/${p.id}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground" title="View">
            <Eye className="h-3.5 w-3.5" />
          </Link>
          {p.status === "pending" && (
            <>
              <button onClick={() => setConfirmAction({ product: p, action: "approve" })} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/15" title="Approve">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setConfirmAction({ product: p, action: "reject" })} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/15" title="Reject">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {p.status === "active" && (
            <button onClick={() => setConfirmAction({ product: p, action: "deactivate" })} className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-500/15 hover:text-amber-600" title="Deactivate">
              <PowerOff className="h-3.5 w-3.5" />
            </button>
          )}
          {p.status === "inactive" && (
            <button onClick={() => setConfirmAction({ product: p, action: "activate" })} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/15" title="Activate">
              <Power className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all marketplace products.</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-brand">
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface/60 p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(p) => p.id}
          searchPlaceholder="Search products…"
          searchFilter={(p, q) => p.name.toLowerCase().includes(q) || p.seller?.shop_name?.toLowerCase().includes(q)}
          pageSize={10}
        />
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={`${confirmAction?.action === "approve" ? "Approve" : confirmAction?.action === "reject" ? "Reject" : confirmAction?.action === "activate" ? "Activate" : "Deactivate"} "${confirmAction?.product.name}"?`}
        confirmLabel={confirmAction?.action === "approve" ? "Approve" : confirmAction?.action === "reject" ? "Reject" : confirmAction?.action === "activate" ? "Activate" : "Deactivate"}
        destructive={confirmAction?.action === "reject" || confirmAction?.action === "deactivate"}
        onConfirm={handleAction}
        loading={actionLoading}
      />
    </div>
  )
}
