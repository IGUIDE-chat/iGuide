import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface LightboxImage {
    src: string;
    alt?: string;
    label?: string;
}

interface ImageLightboxProps {
    images: LightboxImage[];
    initialIndex?: number;
    onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const hasMultiple = images.length > 1;
    const current = images[currentIndex];

    const goNext = useCallback(() => {
        setScale(1);
        setCurrentIndex((i) => (i + 1) % images.length);
    }, [images.length]);

    const goPrev = useCallback(() => {
        setScale(1);
        setCurrentIndex((i) => (i - 1 + images.length) % images.length);
    }, [images.length]);

    const toggleZoom = useCallback(() => {
        setScale((s) => (s > 1 ? 1 : 2));
    }, []);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && hasMultiple) goNext();
            if (e.key === 'ArrowLeft' && hasMultiple) goPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, goNext, goPrev, hasMultiple]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
                <div className="text-white/70 text-sm font-medium">
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
                        onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        {scale > 1 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Image */}
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentIndex}
                    src={current?.src}
                    alt={current?.alt ?? ''}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none cursor-zoom-in transition-transform duration-200"
                    style={{ transform: `scale(${scale})` }}
                />
            </AnimatePresence>

            {/* Navigation arrows */}
            {hasMultiple && (
                <>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}
        </motion.div>
    );
};

export default ImageLightbox;
