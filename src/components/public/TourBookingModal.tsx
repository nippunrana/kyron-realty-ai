"use client";

import { Calendar, X } from "lucide-react";

interface TourBookingModalProps {
  propertyTitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function TourBookingModal({ propertyTitle, onClose, children }: TourBookingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700"
          aria-label="Close booking dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Book a Private Tour</h3>
          <p className="text-xs text-slate-500 mt-0.5">{propertyTitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
