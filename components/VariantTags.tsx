import { variantAttributes } from "@/lib/generic-api"

/** Renders variant attribute chips (e.g. Red · M). Nothing when there are none. */
export function VariantTags({
  attributes,
  className = "",
}: {
  attributes: Record<string, string> | string[] | null | undefined
  className?: string
}) {
  const attrs = variantAttributes(attributes)
  const entries = Object.entries(attrs)
  if (entries.length === 0) return null
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground"
          title={k}
        >
          {v}
        </span>
      ))}
    </span>
  )
}
