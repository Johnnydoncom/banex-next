import { fetchGenericCategories, GenericCategory } from "@/lib/generic-api"
import { HeaderClient } from "./HeaderClient"

export async function Header() {
  let categories: GenericCategory[] = []
  try {
    const categoriesData = await fetchGenericCategories()
    categories = categoriesData.categories || []
  } catch (e) {
    console.error("[header] Failed to fetch categories:", e)
  }

  return <HeaderClient categories={categories} />
}
