"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";

interface PropertyPhotoModalProps {
  isOpen: boolean;
  initialIndex: number;
  images: string[];
  title: string;
  onClose: () => void;
}

export function PropertyPhotoModal({
  isOpen,
  initialIndex,
  images,
  title,
  onClose,
}: PropertyPhotoModalProps) {
  const [prevInitialIndex, setPrevInitialIndex] = useState(initialIndex);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (initialIndex !== prevInitialIndex) {
    setPrevInitialIndex(initialIndex);
    setCurrentIndex(initialIndex);
  }

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full screen photo viewer"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/10 text-white z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-slate-300 truncate max-w-xs sm:max-w-md">
            {title}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 font-mono font-bold">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close photo viewer"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <span className="hidden sm:inline text-slate-300">Close</span>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0">
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-4 sm:left-8 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/40 text-white backdrop-blur-md transition-all cursor-pointer shadow-xl hover:scale-105"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-4 sm:right-8 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/40 text-white backdrop-blur-md transition-all cursor-pointer shadow-xl hover:scale-105"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Central Display */}
        <div className="relative max-w-5xl max-h-full w-full h-full flex items-center justify-center">
          {failedImages[currentImage] ? (
            <div className="w-96 h-64 rounded-3xl bg-slate-900 border border-white/15 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Camera className="w-12 h-12 mb-3 text-slate-500" />
              <p className="text-sm font-semibold text-white mb-1">Image Preview Unavailable</p>
              <span className="text-xs text-slate-400">Photo {currentIndex + 1} of {images.length}</span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentImage}
              alt={`${title} - photo ${currentIndex + 1}`}
              onError={() => setFailedImages((prev) => ({ ...prev, [currentImage]: true }))}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-200"
            />
          )}
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-md flex justify-center z-10">
          <div className="flex items-center gap-2 overflow-x-auto max-w-3xl py-1 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to photo ${idx + 1}`}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "border-blue-500 ring-2 ring-blue-400/50 scale-105 shadow-md"
                    : "border-white/20 opacity-50 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
