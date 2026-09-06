"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Laptop,
  Smartphone,
  Upload,
  Copy,
  Check,
  Trash2,
  Sparkles,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  Radio,
  ExternalLink,
} from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftId: number | null;
  uploadToken: string;
  uploadUrl: string;
  qrCodeSvg: string;
  propertyTitle?: string;
  existingImages: string[];
  onImagesUpdated: (newImages: string[]) => void;
  onProceedToFinalReview: () => void;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  draftId,
  uploadToken,
  uploadUrl,
  qrCodeSvg,
  propertyTitle,
  existingImages,
  onImagesUpdated,
  onProceedToFinalReview,
}: ImageUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"computer" | "mobile">("computer");
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [recentSyncCount, setRecentSyncCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const existingImagesRef = useRef(existingImages);

  useEffect(() => {
    existingImagesRef.current = existingImages;
  }, [existingImages]);

  // Real-time Polling: Check for incoming mobile uploads every 2.5 seconds while modal is open
  useEffect(() => {
    if (!isOpen || !draftId || !uploadToken) return;

    let isSubscribed = true;

    const pollDraftImages = async () => {
      // Pause polling if document is hidden to save resources
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const res = await fetch(
          `${BASE_PATH}/api/properties/draft/${draftId}/images?token=${encodeURIComponent(uploadToken)}`
        );
        if (!res.ok) return;
        const json = await res.json();

        if (isSubscribed && json.success && Array.isArray(json.images)) {
          const remoteImages = json.images as string[];
          const currentCount = existingImagesRef.current.length;

          // If new images arrived from mobile
          if (remoteImages.length !== currentCount || JSON.stringify(remoteImages) !== JSON.stringify(existingImagesRef.current)) {
            if (remoteImages.length > currentCount) {
              setRecentSyncCount(remoteImages.length - currentCount);
              setTimeout(() => setRecentSyncCount(0), 4500);
            }
            onImagesUpdated(remoteImages);
          }
        }
      } catch {
        // Silently tolerate transient polling network errors
      }
    };

    const intervalId = setInterval(pollDraftImages, 2500);
    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [isOpen, draftId, uploadToken, onImagesUpdated]);

  if (!isOpen) return null;

  // Handle Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Direct Upload from Computer
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !draftId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("draftId", String(draftId));
      formData.append("token", uploadToken);

      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch(`${BASE_PATH}/api/properties/upload`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        onImagesUpdated(json.images);
      } else {
        alert(json.error || "Failed to upload images.");
      }
    } catch (err) {
      console.error("Local upload error:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete Image
  const handleDeleteImage = async (imgUrl: string) => {
    if (!draftId) return;

    try {
      const res = await fetch(`${BASE_PATH}/api/properties/draft/${draftId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imgUrl, token: uploadToken }),
      });

      const json = await res.json();
      if (json.success) {
        onImagesUpdated(json.images);
      }
    } catch (err) {
      console.error("Delete image error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden text-slate-900 max-h-[92vh] flex flex-col">
        {/* Ambient Top Glows */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close / Minimize Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5 shrink-0">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stage 3: Property Photo Uplink</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Attach Property Photos
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto">
            Upload pictures directly from this computer or scan the QR code to snap and attach photos straight from your mobile device.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-2xl max-w-md mx-auto w-full mb-4 border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("computer")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "computer"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Laptop className="w-4 h-4 text-blue-600" />
            <span>This Computer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mobile")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "mobile"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Mobile Device (QR)</span>
          </button>
        </div>

        {/* Real-time Notification Banner if mobile synced photos */}
        {recentSyncCount > 0 && (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in shrink-0">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{recentSyncCount} new photo(s) synced from mobile device!</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700">Live</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {activeTab === "computer" ? (
            /* TAB 1: THIS COMPUTER */
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="desktop-file-upload-input"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/60 scale-[1.01]"
                    : "border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20"
                }`}
              >
                {isUploading ? (
                  <div className="py-2">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">Uploading photos...</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Optimizing and storing property media</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Drag & drop photos here, or <span className="text-blue-600 hover:underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports high-resolution JPEG, PNG, WebP up to 15MB each
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: MOBILE DEVICE (QR CODE) */
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
                {qrCodeSvg ? (
                  <div
                    className="w-40 h-40 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
                <span className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">
                  Scan with Mobile Camera
                </span>
              </div>

              {/* Instructions & Copy Link */}
              <div className="flex-1 min-w-0 space-y-3 text-left">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Seamless Mobile Upload</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                      Live Uplink
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    1. Open your phone camera and point it at the QR code.
                    <br />
                    2. Tap the link to open the Kyron photo uploader (no login needed).
                    <br />
                    3. Snap or pick photos — they appear live on this screen!
                  </p>
                </div>

                {/* Copy Link Input Bar */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={uploadUrl}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono truncate select-all focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={uploadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Open upload link in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ATTACHED PHOTOS GALLERY */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Attached Photos
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-200">
                  {existingImages.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>Syncing live with mobile uplink</span>
              </div>
            </div>

            {existingImages.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">No photos attached yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You can upload photos now or proceed to review and add them later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
                {existingImages.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`${propertyTitle || "Property"} - Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Cover Photo Tag */}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.2 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-white border border-white/20">
                      {idx === 0 ? "Cover" : `#${idx + 1}`}
                    </span>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(imgUrl)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-white backdrop-blur-md transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer w-full sm:w-auto"
          >
            Minimize
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onProceedToFinalReview}
              className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <span>Proceed to Final Review & Deploy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
