"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"

interface ImageLightboxProps {
  images: string[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
  alt?: string
}

const MAX_SCALE = 4
const MIN_SCALE = 1

/**
 * Fullscreen image viewer: shows the FULL (uncropped) image, with prev/next +
 * keyboard nav, a counter, a thumbnail strip, and zoom (double-click / wheel /
 * buttons) with drag-to-pan. Swipe changes images when not zoomed.
 */
export function ImageLightbox({ images, index, onIndexChange, onClose, alt = "" }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Pointer tracking for pan (when zoomed) and swipe (when not).
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null)

  const count = images.length
  const resetZoom = useCallback(() => { setScale(1); setOffset({ x: 0, y: 0 }) }, [])

  const go = useCallback(
    (dir: number) => {
      resetZoom()
      onIndexChange((index + dir + count) % count)
    },
    [index, count, onIndexChange, resetZoom],
  )

  useEffect(() => setMounted(true), [])

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Keyboard: Esc closes, arrows navigate, +/- zoom.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowRight") go(1)
      else if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "+" || e.key === "=") setScale((s) => Math.min(MAX_SCALE, s + 0.5))
      else if (e.key === "-") setScale((s) => Math.max(MIN_SCALE, s - 0.5))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, onClose])

  const zoomBy = (delta: number) =>
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + delta).toFixed(2)))
      if (next === 1) setOffset({ x: 0, y: 0 })
      return next
    })

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 0.3 : -0.3)
  }

  const onDoubleClick = () => {
    if (scale > 1) resetZoom()
    else setScale(2)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true
    if (scale > 1) setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    // When not zoomed, a horizontal drag acts as swipe navigation.
    if (scale === 1 && count > 1) {
      const dx = e.clientX - d.x
      if (dx <= -50) go(1)
      else if (dx >= 50) go(-1)
    }
  }

  if (!mounted) return null

  const node = (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
        onClick={onClose}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 text-white/90" onClick={(e) => e.stopPropagation()}>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tabular-nums">
            {index + 1} / {count}
          </span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => zoomBy(-0.5)} disabled={scale <= MIN_SCALE} aria-label="Zoom out"
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20 disabled:opacity-40">
              <ZoomOut className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => zoomBy(0.5)} disabled={scale >= MAX_SCALE} aria-label="Zoom in"
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20 disabled:opacity-40">
              <ZoomIn className="h-5 w-5" />
            </button>
            <button type="button" onClick={onClose} aria-label="Close"
              className="ml-1 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stage */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-14"
          onClick={(e) => e.stopPropagation()}>
          {count > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous image"
                className="absolute left-2 z-10 hidden rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:block">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next image"
                className="absolute right-2 z-10 hidden rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:block">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={images[index]}
            src={images[index]}
            alt={alt}
            draggable={false}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="max-h-full max-w-full touch-none select-none object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: drag.current ? "none" : "transform 0.15s ease-out",
              cursor: scale > 1 ? "grab" : "zoom-in",
            }}
          />
        </div>

        {/* Thumbnail strip */}
        {count > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4 scrollbar-hide" onClick={(e) => e.stopPropagation()}>
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => { resetZoom(); onIndexChange(i) }}
                aria-label={`View image ${i + 1}`}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === index ? "border-white" : "border-transparent opacity-50 hover:opacity-90"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(node, document.body)
}
