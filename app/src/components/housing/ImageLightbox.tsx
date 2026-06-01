/**
 * @file ./src/components/housing/ImageLightbox.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react"
import React, { useCallback, useEffect, useState } from "react"

interface LightboxImage {
  src: string
  alt?: string
  label?: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex?: number
  onClose: () => void
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const hasMultiple = images.length > 1
  const current = images[currentIndex]

  const goNext = useCallback(() => {
    setScale(1)
    setCurrentIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setScale(1)
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const toggleZoom = useCallback(() => {
    setScale((s) => (s > 1 ? 1 : 2))
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
      if (e.key === "ArrowRight" && hasMultiple) {
        goNext()
      }
      if (e.key === "ArrowLeft" && hasMultiple) {
        goPrev()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
    }
  }, [onClose, goNext, goPrev, hasMultiple])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <div className="text-sm font-medium text-white/70">
          {current?.label && <span>{current.label}</span>}
          {hasMultiple && (
            <span className="ml-2 text-white/50">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleZoom()
            }}
            className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            {scale > 1 ? (
              <ZoomOut className="size-5" />
            ) : (
              <ZoomIn className="size-5" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={current?.src}
          alt={current?.alt ?? ""}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="max-h-[85vh] max-w-[90vw] cursor-zoom-in rounded-lg object-contain transition-transform duration-200 select-none"
          style={{ transform: `scale(${scale})` }}
        />
      </AnimatePresence>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
    </motion.div>
  )
}

export default ImageLightbox
