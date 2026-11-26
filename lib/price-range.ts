/**
 * Shared price-range helpers for the marketplace filter (server page + client slider).
 *
 * URL contract: `?min_price=&max_price=` (whole naira), mapped to the API's
 * `filter[min_price]` / `filter[max_price]`. A bound sitting at the slider's
 * floor/ceiling means "no limit" and is left out of the URL entirely.
 */

export const PRICE_FLOOR = 0
export const PRICE_CEIL = 20_000_000

/**
 * Slider stops. Most listings are under ₦1m, so a linear 0–20m track would give
 * ~70k per pixel and make the low end unusable. Step size grows with price instead.
 */
const BANDS: ReadonlyArray<readonly [upTo: number, step: number]> = [
  [50_000, 5_000],
  [200_000, 10_000],
  [1_000_000, 50_000],
  [5_000_000, 250_000],
  [PRICE_CEIL, 1_000_000],
]

export const PRICE_STOPS: readonly number[] = (() => {
  const stops = [PRICE_FLOOR]
  let v = PRICE_FLOOR
  for (const [upTo, step] of BANDS) {
    while (v < upTo) {
      v += step
      stops.push(v)
    }
  }
  return stops
})()

/** Index of the stop nearest to `price` (exact typed values snap visually only). */
export function stopIndexFor(price: number): number {
  let best = 0
  for (let i = 1; i < PRICE_STOPS.length; i++) {
    if (Math.abs(PRICE_STOPS[i] - price) < Math.abs(PRICE_STOPS[best] - price)) best = i
  }
  return best
}

/** A positive whole-naira amount from a query value, else undefined. */
export function parsePriceParam(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.round(n)
}

/** Parse both bounds; a reversed range (min > max) is swapped rather than rejected. */
export function parsePriceRange(minRaw: unknown, maxRaw: unknown): { min?: number; max?: number } {
  const min = parsePriceParam(minRaw)
  const max = parsePriceParam(maxRaw)
  if (min !== undefined && max !== undefined && min > max) return { min: max, max: min }
  return { min, max }
}

/** ₦5k, ₦250k, ₦1.25m, ₦20m — matches the shop's existing short labels. */
export function formatNairaShort(n: number): string {
  const trim = (v: number) => Number(v.toFixed(2)).toString()
  if (n >= 1_000_000) return `₦${trim(n / 1_000_000)}m`
  if (n >= 1_000) return `₦${trim(n / 1_000)}k`
  return `₦${n}`
}
