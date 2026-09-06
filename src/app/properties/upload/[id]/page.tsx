"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Sparkles,
  QrCode,
  Copy,
  Check,
  X,
} from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

import {
  WhatsAppIcon,
  buildPhotoUploadShareMessage,
} from "@/components/dashboard/onboarding/share-utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MobilePropertyUploadPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const draftId = resolvedParams.id;
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const viewParam = searchParams.get("view");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(viewParam === "qr");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch initial draft info and verify token
  useEffect(() => {
    let isMounted = true;
    async function verifyAndLoad() {
      if (!token) {
        setError("Missing access token. Please scan the QR code from your Kyron Realty desktop studio.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BASE_PATH}/api/properties/draft/${draftId}/images?token=${encodeURIComponent(token)}`);
        const json = await res.json();

        if (!isMounted) return;

        if (json.success) {
          setPropertyTitle(json.title || "Draft Property");
          setPropertyAddress(json.address || "");
          setImages(json.images || []);
          if (json.qrCodeSvg) {
            setQrCodeSvg(json.qrCodeSvg);
          }
        } else {
          setError(json.error || "Invalid or expired upload session.");
        }
      } catch {
        if (!isMounted) return;
        setError("Network error connecting to Kyron Realty studio.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    verifyAndLoad();
    return () => {
      isMounted = false;
    };
  }, [draftId, token]);

  // File Upload Handler
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadMessage("Uploading photos to Kyron Realty Studio...");

    try {
      const formData = new FormData();
      formData.append("draftId", draftId);
      formData.append("token", token);

      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append("files", selectedFiles[i]);
      }

      const res = await fetch(`${BASE_PATH}/api/properties/upload`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setImages(json.images);
        setUploadMessage(`Successfully attached ${json.uploaded?.length || selectedFiles.length} photo(s)!`);
        setTimeout(() => setUploadMessage(null), 4000);
      } else {
        alert(json.error || "Failed to upload photos.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload photos. Please check your connection and try again.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // Delete Handler
  const handleDeleteImage = async (imgUrl: string) => {
    if (!confirm("Remove this photo from the listing?")) return;

    try {
      const res = await fetch(`${BASE_PATH}/api/properties/draft/${draftId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imgUrl, token }),
      });

      const json = await res.json();
      if (json.success) {
        setImages(json.images);
      } else {
        alert(json.error || "Failed to delete photo.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete photo.");
    }
  };

  const getCleanUploadUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}?token=${encodeURIComponent(token)}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getCleanUploadUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareToWhatsApp = () => {
    const cleanUrl = getCleanUploadUrl();
    const message = buildPhotoUploadShareMessage(cleanUrl, propertyTitle);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Connecting to Onboarding Studio</h2>
        <p className="text-xs text-slate-400 mt-1">Verifying secure mobile upload session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-extrabold text-white">Upload Session Unavailable</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">{error}</p>
        <p className="text-xs text-slate-500 mt-6">
          Please keep the desktop Onboarding Studio open and scan the on-screen QR code again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">KYRON</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                REALTY AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Mobile Photo Uplink</p>
          </div>
        </div>

        {/* Actions: Show QR + Live Synced */}
        <div className="flex items-center gap-2">
          {qrCodeSvg && (
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
              title="View QR Code to scan on another device"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xs:inline sm:inline">QR Code</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Synced</span>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Property Context Card */}
        <section className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Attaching Photos To</span>
              <h2 className="text-sm font-bold text-white truncate mt-0.5">{propertyTitle}</h2>
              {propertyAddress && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{propertyAddress}</p>
              )}
            </div>
          </div>
        </section>

        {/* Upload Success Alert Toast */}
        {uploadMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{uploadMessage}</span>
          </div>
        )}

        {/* Mobile Upload Action Buttons */}
        <section className="space-y-3">
          {/* Hidden inputs for file selection and direct camera capture */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFilesSelected}
            className="hidden"
            id="mobile-gallery-input"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFilesSelected}
            className="hidden"
            id="mobile-camera-input"
          />

          {/* Primary Action: Select From Photos */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading to Studio...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                <span>Select Photos from Device</span>
              </>
            )}
          </button>

          {/* Secondary Action: Direct Camera Capture */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => cameraInputRef.current?.click()}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-slate-200 font-semibold text-xs border border-slate-700/80 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Take Photo with Camera</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Photos appear immediately on your desktop screen</span>
          </p>
        </section>

        {/* Gallery of Attached Photos */}
        <section className="flex-1 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Attached Photos</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold border border-blue-500/30">
                {images.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Tap trash to remove</span>
          </div>

          {images.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center flex flex-col items-center justify-center bg-slate-900/40">
              <Upload className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">No photos uploaded yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Take a quick photo of the property or select images from your gallery above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {images.map((imgUrl, idx) => (
                <div
                  key={`${imgUrl}-${idx}`}
                  className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Property Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Photo Index Badge */}
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                    {idx === 0 ? "Cover Photo" : `#${idx + 1}`}
                  </span>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(imgUrl)}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-slate-200 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Sticky Sync Status Footer */}
      <footer className="sticky bottom-0 z-20 backdrop-blur-md bg-slate-950/90 border-t border-slate-800/80 px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Syncing directly with your desktop browser session</span>
        </div>
      </footer>

      {/* QR Code Inspection & Sharing Modal */}
      {showQrModal && qrCodeSvg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-800 relative text-center text-slate-100">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close QR dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-white mb-1">Scan to Upload Photos</h3>
            <p className="text-xs text-slate-400 mb-4">
              Point another phone camera at this code to upload photos directly to {propertyTitle || "this property"}.
            </p>

            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-inner mb-4 flex items-center justify-center">
              <div
                className="w-44 h-44 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Upload Link"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Back to Uploader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
