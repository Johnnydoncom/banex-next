import { fetchGenericCategory } from "@/lib/generic-api"
import { brandOgImage } from "@/lib/seo/og"

/**
 * Dynamic OG image for shop/category pages.
 *
 * The `opengraph-image.tsx` file convention can't be used inside the shop route
 * because it's an optional catch-all (`[[...slug]]`) — a metadata file there is
 * an invalid segment after the catch-all. So category OG images are served from
 * this standalone route handler and referenced via `openGraph.images` in the
 * shop page's generateMetadata.
 *
 * URL: /og/category/<slug>
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  if (slug && slug !== "all") {
    try {
      const category = await fetchGenericCategory(slug)
      if (category) {
        return brandOgImage({
          eyebrow: "Shop category",
          title: category.name,
          subtitle: category.listings_count
            ? `${category.listings_count} listings`
            : "Browse verified listings",
          imageUrl: category.image_url || null,
          badges: ["Escrow protected", "Same-hour delivery"],
        })
      }
    } catch {}
  }

  return brandOgImage({
    eyebrow: "Marketplace",
    title: "Shop everything on Banex Mall",
    subtitle: "Thousands of verified listings across Nigeria",
    badges: ["Escrow protected", "Same-hour delivery"],
  })
}
