"use client";

import { CheckCircle2, Sparkles } from "lucide-react";

export interface ChecklistItemData {
  id: string;
  label: string;
  sublabel: string;
  isComplete: boolean;
  valueDisplay: string | null;
}

interface VerificationChecklistProps {
  items: ChecklistItemData[];
  verifiedCount: number;
}

export function VerificationChecklist({
  items,
  verifiedCount,
}: VerificationChecklistProps) {
  const isFullyVerified = verifiedCount === 6;
  const pct = Math.round((verifiedCount / 6) * 100);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/20 border border-slate-200/90 shadow-xs">
      {/* Header with Circular Progress & Counter */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* Animated Circular Progress Meter */}
          <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
            <svg className="w-9 h-9 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`transition-all duration-500 ease-out ${
                  isFullyVerified ? "text-emerald-500" : "text-blue-600"
                }`}
                strokeDasharray={`${pct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span
              className={`absolute text-[11px] font-extrabold ${
                isFullyVerified ? "text-emerald-600" : "text-slate-700"
              }`}
            >
              {verifiedCount}/6
            </span>
          </div>

          <div>
            <h4 className="text-xs font-extrabold text-slate-900 leading-snug flex items-center gap-1.5">
              <span>Core Verification Checklist</span>
              {isFullyVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Ready</span>
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500">
              {isFullyVerified
                ? "All 6 core listing attributes verified by AI"
                : `${6 - verifiedCount} attributes remaining before agent deployment`}
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-colors border ${
            isFullyVerified
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          {pct}% Complete
        </div>
      </div>

      {/* 6-Point Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`p-2.5 rounded-xl border transition-all duration-300 flex items-start gap-2.5 ${
              item.isComplete
                ? "bg-white border-emerald-200/90 shadow-2xs"
                : "bg-slate-50/60 border-slate-200/60 opacity-80"
            }`}
          >
            {/* Status Icon */}
            <div className="mt-0.5 shrink-0">
              {item.isComplete ? (
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-in zoom-in-50 duration-200">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 bg-white flex items-center justify-center text-[9px] font-bold text-slate-400">
                  {idx + 1}
                </div>
              )}
            </div>

            {/* Label & Dynamic Value */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-800 truncate">
                  {item.label}
                </span>
                {item.isComplete ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/70 shrink-0">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    Pending
                  </span>
                )}
              </div>

              <div className="mt-0.5 text-[11px] truncate">
                {item.isComplete && item.valueDisplay ? (
                  <span className="font-semibold text-slate-900">
                    {item.valueDisplay}
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[10px]">
                    {item.sublabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
