// Helpers for working with the category hierarchy (roots → children).
// Works for both GenericCategory and AdminCategory (both have id/parent_id/children).

export type CategoryNode = {
  id: string
  parent_id?: string | null
  name: string
  slug: string
  children?: CategoryNode[] | null
}

/** Roots are the top-level categories (parent_id null). The API already returns the
 *  tree as roots with nested `children`, so this just guards against a flat list. */
export function rootCategories<T extends CategoryNode>(list: T[]): T[] {
  const roots = list.filter((c) => !c.parent_id)
  return roots.length ? roots : list
}

/** Find a category anywhere in the tree by id. */
export function findCategory<T extends CategoryNode>(list: T[], id: string | null | undefined): T | undefined {
  if (!id) return undefined
  for (const c of list) {
    if (c.id === id) return c
    const found = c.children && findCategory(c.children as T[], id)
    if (found) return found
  }
  return undefined
}

/** The direct subcategories (children) of the given root category id. */
export function subcategoriesOf<T extends CategoryNode>(list: T[], rootId: string | null | undefined): T[] {
  const root = findCategory(list, rootId)
  return (root?.children as T[] | undefined) ?? []
}

/** Flatten the tree to `{ node, depth }` in display order (parents before children). */
export function flattenCategories<T extends CategoryNode>(list: T[], depth = 0): { node: T; depth: number }[] {
  const out: { node: T; depth: number }[] = []
  for (const c of list) {
    out.push({ node: c, depth })
    if (c.children?.length) out.push(...flattenCategories(c.children as T[], depth + 1))
  }
  return out
}
