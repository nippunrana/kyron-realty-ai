"use client";

import { CheckCircle2 } from "lucide-react";

export interface TourBookingFormProps {
  name: string;
  phone: string;
  date: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  success: boolean;
  successTitle: string;
  successNote?: string;
  submitLabel: string;
  busyLabel: string;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500";

/** The public tour-request form; used in the listing sidebar and in the booking modal. */
export function TourBookingForm({
  name,
  phone,
  date,
  onNameChange,
  onPhoneChange,
  onDateChange,
  onSubmit,
  isSubmitting,
  success,
  successTitle,
  successNote,
  submitLabel,
  busyLabel,
}: TourBookingFormProps) {
  if (success) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800 text-xs font-bold animate-in fade-in">
        <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
        <span className="block">{successTitle}</span>
        {successNote && <span className="block mt-0.5 text-[11px] font-medium text-slate-500">{successNote}</span>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
        <input
          type="text"
          required
          placeholder="John Doe"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
        <input
          type="tel"
          required
          placeholder="(415) 555-0199"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-600 block mb-1">Preferred Date &amp; Time</label>
        <input
          type="datetime-local"
          required
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-60"
      >
        {isSubmitting ? busyLabel : submitLabel}
      </button>
    </form>
  );
}
