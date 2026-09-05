"use client";

import { Check, Copy, Share2, X } from "lucide-react";

interface ShareListingModalProps {
  qrCodeSvg?: string | null;
  whatsAppUrl: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

export function ShareListingModal({ qrCodeSvg, whatsAppUrl, copied, onCopy, onClose }: ShareListingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700"
          aria-label="Close share dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-extrabold text-slate-900 mb-1">Share Property Listing</h3>
        <p className="text-xs text-slate-500 mb-4">Scan QR code on mobile or share via WhatsApp</p>

        {qrCodeSvg && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-4 flex items-center justify-center">
            {/* Server-generated SVG from the qrcode library, never user input */}
            <div className="w-40 h-40 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
          </div>
        )}

        <div className="space-y-2">
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share to WhatsApp</span>
          </a>

          <button
            onClick={onCopy}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Copied!" : "Copy Public Link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
