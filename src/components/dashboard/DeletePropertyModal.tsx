"use client";

import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";

interface DeletePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  property: {
    id: number;
    title: string;
    address: string;
    listingType?: string | null;
    status?: string | null;
  } | null;
  isDeleting: boolean;
}

export function DeletePropertyModal({
  isOpen,
  onClose,
  onConfirm,
  property,
  isDeleting,
}: DeletePropertyModalProps) {
  if (!isOpen || !property) return null;

  const isDraft = property.status === "draft";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header Icon */}
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-4 shadow-sm">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Delete {isDraft ? "Draft Listing" : "Property Listing"}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete this listing? This action cannot be reversed.
          </p>

          {/* Property Info Card */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                  isDraft
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {isDraft ? "Draft" : "Published"}
              </span>
              {property.listingType && (
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  • For {property.listingType}
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {property.title}
            </div>
            <div className="text-xs text-slate-500 truncate mt-0.5">
              {property.address}
            </div>
          </div>

          {/* Warning Items */}
          <div className="mt-4 p-3.5 rounded-2xl bg-red-50/70 border border-red-100 text-left">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900/90 space-y-1">
                <p className="font-semibold text-red-950">The following data will be purged:</p>
                <ul className="list-disc pl-3.5 space-y-0.5 text-red-800/90 text-[11px]">
                  <li>Agora Conversational Voice Agent knowledge base & FAQs</li>
                  <li>Negotiation guardrails and exchange-of-value rules</li>
                  <li>Uploaded property photos and high-res vector QR uplink</li>
                  {!isDraft && <li>Lead inquiries, visitor history, and tour records</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Listing</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
