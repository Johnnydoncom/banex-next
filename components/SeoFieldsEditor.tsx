"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export type SeoFields = {
  title: string
  description: string
  keywords: string
  robots: string
  canonical_url: string
}

export const emptySeo = (): SeoFields => ({ title: "", description: "", keywords: "", robots: "", canonical_url: "" })

/** Build editable SeoFields from an API `seo` object (override fields, null → ""). */
export function seoFromApi(
  seo?: { title?: string | null; description?: string | null; keywords?: string | null; robots?: string | null; canonical_url?: string | null } | null,
): SeoFields {
  return {
    title: seo?.title ?? "",
    description: seo?.description ?? "",
    keywords: seo?.keywords ?? "",
    robots: seo?.robots ?? "",
    canonical_url: seo?.canonical_url ?? "",
  }
}

const TITLE_MAX = 60
const DESC_MAX = 160

/**
 * SEO override editor. Every field is optional — blank means "auto-generate from
 * the record". When a `resolved` (auto) value is provided it's shown as the
 * placeholder so the admin sees what will be used if they leave the field blank.
 */
export function SeoFieldsEditor({
  value,
  onChange,
  resolved,
}: {
  value: SeoFields
  onChange: (patch: Partial<SeoFields>) => void
  resolved?: { title?: string | null; description?: string | null; keywords?: string | null; robots?: string | null; canonical_url?: string | null } | null
}) {
  const counter = (len: number, max: number) => (
    <span className={`text-[10px] tabular-nums ${len > max ? "text-rose-500" : "text-muted-foreground"}`}>{len}/{max}</span>
  )
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface/40 p-3 text-[11px] text-muted-foreground">
        Optional — leave blank to auto-generate SEO from the product/category. Anything you set here overrides the default.
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="block text-xs text-muted-foreground">Meta Title</Label>
          {counter(value.title.length, TITLE_MAX)}
        </div>
        <Input
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={resolved?.title ?? "Auto from name…"}
          className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="block text-xs text-muted-foreground">Meta Description</Label>
          {counter(value.description.length, DESC_MAX)}
        </div>
        <Textarea
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={resolved?.description ?? "Auto from description…"}
          rows={3}
          className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
        />
      </div>

      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">Meta Keywords <span className="text-muted-foreground/70">— comma separated</span></Label>
        <Input
          value={value.keywords}
          onChange={(e) => onChange({ keywords: e.target.value })}
          placeholder={resolved?.keywords ?? "e.g. phones, itel, android"}
          className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Canonical URL</Label>
          <Input
            value={value.canonical_url}
            onChange={(e) => onChange({ canonical_url: e.target.value })}
            placeholder={resolved?.canonical_url ?? "Auto"}
            className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Robots</Label>
          <Input
            value={value.robots}
            onChange={(e) => onChange({ robots: e.target.value })}
            placeholder={resolved?.robots ?? "index,follow"}
            className="rounded-xl px-4 py-2.5 focus-visible:border-brand focus-visible:ring-brand"
          />
        </div>
      </div>
    </div>
  )
}
