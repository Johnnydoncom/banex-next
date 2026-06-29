import { FileText } from "lucide-react"

export function ProductDescription({ html }: { html: string | null }) {
  if (!html) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-12 px-4 text-center">
        <FileText className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">No description available</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
      <div 
        className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
