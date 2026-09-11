"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BadgeCheck,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Maximize2,
} from "lucide-react";
import { PropertyPhotoModal } from "./PropertyPhotoModal";
import { formatPropertyTypeLabel } from "@/lib/property-types";

interface PropertyImageGalleryProps {
  images: string[];
  title: string;
  listingType: string;
  propertyType?: string | null;
}

export function PropertyImageGallery({
  images,
  title,
  listingType,
  propertyType,
}: PropertyImageGalleryProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const railRef = useRef<HTMLDivElement | null>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const safeImages =
    images && images.length > 0
      ? images
      : [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        ];

  const currentHeroImage = safeImages[activeImageIdx] || safeImages[0];

  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 4;
    setCanScrollUp(hasOverflow && el.scrollTop > 4);
    setCanScrollDown(hasOverflow && el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, safeImages.length]);

  // Keep thumbnail scrolled into view when active index changes
  useEffect(() => {
    const target = thumbnailRefs.current[activeImageIdx];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeImageIdx]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIdx((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
  };

  const handleScrollUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    railRef.current?.scrollBy({ top: -160, behavior: "smooth" });
  };

  const handleScrollDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    railRef.current?.scrollBy({ top: 160, behavior: "smooth" });
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3.5 lg:items-stretch">
        {/* Main Cinematic Hero Container */}
        <div
          onClick={() => setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
          aria-label="View photo in fullscreen"
          className="group relative flex-1 aspect-16/10 rounded-3xl overflow-hidden bg-slate-900 shadow-md border border-slate-200/80 cursor-pointer select-none"
        >
          {failedImages[currentHeroImage] ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-slate-300 mb-3 shadow-inner">
                <Camera className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-base sm:text-lg font-bold text-white max-w-sm mb-1 line-clamp-1">
                {title}
              </p>
              <span className="text-xs text-slate-400 font-medium">Photo Preview Pending</span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentHeroImage}
              alt={title}
              onError={() => setFailedImages((prev) => ({ ...prev, [currentHeroImage]: true }))}
              className="w-full h-full object-cover select-none transition-transform duration-500 ease-out group-hover:scale-[1.01]"
            />
          )}

          {/* Top Left Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
              {listingType === "rent" ? "For Rent" : "For Sale"}
            </span>
            {propertyType && (
              <span className="px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                {formatPropertyTypeLabel(propertyType)}
              </span>
            )}
          </div>

          {/* Top Right Fullscreen Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              aria-label="Open fullscreen photo gallery"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/75 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/15 text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View All</span>
            </button>
          </div>

          {/* Hero Left & Right Navigation Arrows */}
          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous image"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900/95 active:scale-95 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next image"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900/95 active:scale-95 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Bottom Badges */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-extrabold shadow-lg pointer-events-auto">
              <BadgeCheck className="w-4 h-4 text-blue-600" />
              <span>Verified by Kyron Realty AI</span>
            </div>

            {safeImages.length > 1 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/15 text-xs font-mono font-bold shadow-lg pointer-events-auto">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {activeImageIdx + 1} / {safeImages.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Vertical Thumbnail Rail (Shows 3-4 images matching hero height) */}
        {safeImages.length > 1 && (
          <div className="hidden lg:flex lg:w-44 xl:w-48 flex-col shrink-0 rounded-3xl bg-slate-100/90 p-2 border border-slate-200/80 shadow-xs relative">
            {/* Scroll Up Button */}
            {canScrollUp && (
              <button
                type="button"
                onClick={handleScrollUp}
                aria-label="Scroll thumbnails up"
                className="w-full py-1.5 mb-1 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 shadow-2xs border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-102 active:scale-98"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}

            {/* Scrollable Thumbnails Stack */}
            <div
              ref={railRef}
              className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-2.5 py-0.5 scroll-smooth"
            >
              {safeImages.map((img, idx) => {
                const isActive = activeImageIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    ref={(el) => {
                      thumbnailRefs.current[idx] = el;
                    }}
                    onClick={() => setActiveImageIdx(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    className={`group/thumb relative aspect-4/3 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? "border-blue-600 shadow-md ring-2 ring-blue-500/25 scale-[1.02]"
                        : "border-slate-200/90 opacity-75 hover:opacity-100 hover:border-slate-300 hover:scale-[1.01]"
                    }`}
                  >
                    {failedImages[img] ? (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center text-slate-400 p-2">
                        <Camera className="w-5 h-5 opacity-60 mb-1" />
                        <span className="text-[10px] text-slate-500 font-medium">
                          Photo {idx + 1}
                        </span>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={img}
                        alt=""
                        onError={() => setFailedImages((prev) => ({ ...prev, [img]: true }))}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Subtle active indicator dot */}
                    {isActive && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll Down Button */}
            {canScrollDown && (
              <button
                type="button"
                onClick={handleScrollDown}
                aria-label="Scroll thumbnails down"
                className="w-full py-1.5 mt-1 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 shadow-2xs border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-102 active:scale-98"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile/Tablet Horizontal Strip (< lg) */}
      {safeImages.length > 1 && (
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-2.5 pb-1">
          {safeImages.map((img, idx) => {
            const isActive = activeImageIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                aria-label={`View photo ${idx + 1}`}
                className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-blue-600 shadow-sm ring-2 ring-blue-500/25 scale-105"
                    : "border-slate-200/80 opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {/* Full-Screen Modal */}
      <PropertyPhotoModal
        isOpen={isModalOpen}
        initialIndex={activeImageIdx}
        images={safeImages}
        title={title}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
