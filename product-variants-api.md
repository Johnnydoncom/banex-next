# Product variants — FE update notes

## What changed

Products can now have **color / size variants**, each with its own **price** and **stock**.  
Checkout still goes through the cart — but the cart now buys a **variant**, not only a product.

Allowed attributes only: `color`, `size`.

---

## What you need to update

### 1. Product detail page

- Read `has_variants` and `variants[]` from the product response.
- If `has_variants` is true:
  - Let the user pick color/size from `variants[].attributes`
  - Add to cart with **both** `product_id` and `product_variant_id`
- If `has_variants` is false:
  - Keep current flow (`product_id` + `quantity` only)

### 2. Cart update / remove URLs (breaking)

Use **variant id** in the path, not product id:

- Old: `PUT/DELETE /api/user/cart/items/{productId}`
- New: `PUT/DELETE /api/user/cart/items/{productVariantId}`

Add-to-cart and cart sync should also send `product_variant_id` when the product has variants.

### 3. Cart UI

Cart lines now include:

- `product_variant_id`
- `variant_attributes` (e.g. `{ "color": "Red", "size": "M" }`)
- `unit_price` from the **variant**

Show the selected color/size on each cart line.

### 4. Admin / seller product create & edit

Support a `variants` array when creating variable products:

```json
{
  "variants": [
    {
      "attributes": { "color": "Red", "size": "M" },
      "price": 10000,
      "stock_quantity": 3,
      "is_default": true
    }
  ]
}
```

Simple products can keep sending `price` + `stock_quantity` as before.

### 5. Orders

Order lines may include `product_variant_id` and `variant_attributes` — show them on order detail if useful.

---

## What you can leave alone

- Product listing cards can still use top-level `price` / `in_stock`
- Checkout request shape is unchanged (it uses the cart)
- Category selection on product create is unchanged
