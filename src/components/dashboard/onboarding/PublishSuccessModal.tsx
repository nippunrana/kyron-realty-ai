"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Download,
  Sparkles,
  ShieldCheck,
  X,
  Loader2,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { ModalMuteButton } from "./ModalMuteButton";

interface PublishSuccessModalProps {
  onClose: () => void;
  property: {
    id: number;
    title: string;
    slug: string;
    price: string | number;
    listingType: string;
    city: string;
  };
  qrCodeSvg?: string | null;
  shareUrl: string;
  isCallActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function PublishSuccessModal({
  onClose,
  property,
  qrCodeSvg,
  shareUrl,
  isCallActive,
  isMuted = false,
  onToggleMute,
}: PublishSuccessModalProps) {
  const { copied, copy } = useCopyToClipboard(2500);
  const activeQrSvg = qrCodeSvg && qrCodeSvg.trim().length > 0 ? qrCodeSvg : "";

  const handleDownloadQrSvg = () => {
    if (!activeQrSvg) return;
    const blob = new Blob([activeQrSvg], { type: "image/svg+xml" });
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
    `Price: ₹${Number(property.price).toLocaleString("en-IN")}/${property.listingType === "rent" ? "mo" : ""}\n\n` +
    `Scan the QR code or tap this link to talk 24/7 with our AI Voice Sales Agent for instant answers & viewing bookings:\n${shareUrl}`
  );
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${whatsAppText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden text-slate-900">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Right Actions: Mute Toggle (if call is active) & Close Button */}
        <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
          {isCallActive && onToggleMute && (
            <ModalMuteButton isMuted={isMuted} onToggleMute={onToggleMute} />
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            {activeQrSvg ? (
              <div
                className="w-40 h-40 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                dangerouslySetInnerHTML={{ __html: activeQrSvg }}
              />
            ) : (
              <div className="w-40 h-40 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-[10px] font-medium text-slate-500">Generating QR...</span>
              </div>
            )}
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
              onClick={() => copy(shareUrl)}
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

          {/* Primary Action Buttons: View Property & Go to Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <Link
              href={`/listings/${property.slug}`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 text-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Property</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all text-center"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-600" />
              <span>Go to Dashboard</span>
            </Link>
          </div>

          {/* WhatsApp Share CTA */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm text-center w-full"
          >
            <Share2 className="w-4 h-4" />
            <span>Share to WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
