"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Expand } from "lucide-react"
import Image from "next/image"
import { ImageLightbox } from "@/components/ImageLightbox"

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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const imageUrls = sortedImages.map((img) => img.url)

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
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="Open full-size image"
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-card"
      >
        <Image
          src={sortedImages[activeIdx].url}
          alt={name}
          width={900}
          height={900}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {/* Expand affordance */}
        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
          <Expand className="h-3.5 w-3.5" /> View
        </span>
      </button>

      {lightboxOpen && (
        <ImageLightbox
          images={imageUrls}
          index={activeIdx}
          onIndexChange={setActiveIdx}
          onClose={() => setLightboxOpen(false)}
          alt={name}
        />
      )}

      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
          {sortedImages.map((img, idx) => (
            <button type="button"
              key={img.url}
              onClick={() => setActiveIdx(idx)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeIdx === idx ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
                }`}
            >
              <Image src={img.url} alt={`${name} thumbnail ${idx + 1}`} width={100} height={100} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
