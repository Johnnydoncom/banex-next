"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface ProductImageGalleryProps {
  images: { url: string; sort_order: number; is_primary: boolean }[]
  name: string
}

export function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  // Sort images so primary is first or by sort_order
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return (a.sort_order || 0) - (b.sort_order || 0)
  })

  const [activeIdx, setActiveIdx] = useState(0)

  // Fallback if no images
  if (sortedImages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card flex items-center justify-center">
          <span className="text-muted-foreground">No image available</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative flex flex-col gap-4"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
        <img
          src={sortedImages[activeIdx].url}
          alt={name}
          width={900}
          height={900}
          className="h-full w-full object-cover"
        />
      </div>

      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {sortedImages.map((img, idx) => (
            <button
              key={img.url}
              onClick={() => setActiveIdx(idx)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                activeIdx === idx ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt={`${name} thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
