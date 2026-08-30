"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Persist a wizard's serializable state to localStorage so an in-progress product
 * survives reloads/navigation, and restore it once on mount.
 *
 * IMPORTANT: pass only JSON-serializable state in `snapshot` — File objects
 * (uploaded images) cannot be stored, so keep those in separate React state and
 * leave them out of the snapshot.
 *
 * @param key       Unique localStorage key for this draft.
 * @param enabled   When false, nothing is loaded, saved, or tracked (e.g. edit mode).
 * @param snapshot  The current serializable draft state (re-passed every render).
 * @param restore   Called ONCE on mount with a previously saved snapshot, if any.
 */
export function useDraftPersistence<T>(
  key: string,
  enabled: boolean,
  snapshot: T,
  restore: (data: T) => void,
): { hasDraft: boolean; savedAt: number | null; clear: () => void } {
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const loaded = useRef(false)
  // Keep the latest restore callback without making the load effect depend on it.
  const restoreRef = useRef(restore)
  restoreRef.current = restore

  // Load once on mount.
  useEffect(() => {
    if (!enabled) { loaded.current = true; return }
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw) as { data?: T; savedAt?: number }
        if (parsed && parsed.data != null) {
          restoreRef.current(parsed.data)
          setSavedAt(parsed.savedAt ?? Date.now())
        }
      }
    } catch {
      // Corrupt/blocked storage — start clean.
    }
    loaded.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  // Persist on change (debounced), only after the initial load has run.
  const serialized = safeStringify(snapshot)
  useEffect(() => {
    if (!enabled || !loaded.current || serialized == null) return
    const t = setTimeout(() => {
      try {
        const now = Date.now()
        localStorage.setItem(key, JSON.stringify({ data: JSON.parse(serialized), savedAt: now }))
        setSavedAt(now)
      } catch {
        // Quota/blocked — ignore; the form still works, just isn't persisted.
      }
    }, 500)
    return () => clearTimeout(t)
  }, [key, enabled, serialized])

  const clear = useCallback(() => {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    setSavedAt(null)
  }, [key])

  return { hasDraft: savedAt != null, savedAt, clear }
}

function safeStringify(v: unknown): string | null {
  try { return JSON.stringify(v) } catch { return null }
}
