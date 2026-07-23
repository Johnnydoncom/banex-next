"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Search } from "lucide-react"
import { GenericCategory } from "@/lib/generic-api"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function VendorFilters({ categories }: { categories: GenericCategory[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get("q") || ""
  const cat = searchParams.get("cat") || "all"

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(name, value)
    } else {
      params.delete(name)
    }
    return params.toString()
  }

  const handleSearch = useDebouncedCallback((term: string) => {
    router.push(`/vendors?${createQueryString("q", term)}`)
  }, 300)

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={q}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search vendor or description…"
          className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-brand"
        />
      </label>
      <Select value={cat} onValueChange={(value) => router.push(`/vendors?${createQueryString("cat", value)}`)}>
        <SelectTrigger className="h-11 rounded-full bg-card px-4 focus:border-brand">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
