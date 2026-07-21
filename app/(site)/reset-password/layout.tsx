import { buildMetadata } from "@/lib/seo/metadata"

// Auth / transactional route — keep out of the search index.
export const metadata = buildMetadata({ noindex: true })

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
