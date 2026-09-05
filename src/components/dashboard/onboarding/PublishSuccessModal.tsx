"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Share2,
  PhoneCall,
  Download,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: number;
    title: string;
    slug: string;
    price: string | number;
    listingType: string;
    city: string;
  };
  qrCodeSvg: string;
  shareUrl: string;
}

export function PublishSuccessModal({
  isOpen,
  onClose,
  property,
  qrCodeSvg,
  shareUrl,
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleDownloadQrSvg = () => {
    const blob = new Blob([qrCodeSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kyron-qr-${property.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const whatsAppText = encodeURIComponent(
    `🏡 Just Listed: ${property.title} in ${property.city}!\n` +
    `Price: $${Number(property.price).toLocaleString()}/${property.listingType === "rent" ? "mo" : ""}\n\n` +
    `Scan the QR code or tap this link to talk 24/7 with our AI Voice Sales Agent for instant answers & viewing bookings:\n${shareUrl}`
  );
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${whatsAppText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden text-slate-900">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Listing Published & Voice Agent Deployed</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Your Property is Live!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
            {property.title} is now active with 24/7 Agora Voice Sales intelligence.
          </p>
        </div>

        {/* QR Code Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 mb-6 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 mb-3 flex items-center justify-center">
            <div
              className="w-40 h-40 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
            />
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Instant Buyer Scan & Voice Call</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Print for yard signs, flyers, or open-house displays
            </p>
          </div>

          <button
            onClick={handleDownloadQrSvg}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Vector QR Code (SVG)</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Share URL Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-700 truncate border border-slate-200">
              {shareUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Primary CTA: Test Voice Call Live */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 text-center"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </a>

            <Link
              href={`/listings/${property.slug}`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 text-center"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Test Voice Agent Live</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
