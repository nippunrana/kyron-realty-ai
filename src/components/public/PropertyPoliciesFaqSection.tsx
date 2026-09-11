"use client";

import { useState } from "react";
import {
  PawPrint,
  Car,
  Zap,
  Droplets,
  ClipboardCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

interface PropertyPoliciesFaqSectionProps {
  petPolicyDetail?: string | null;
  parkingDetail?: string | null;
  utilitiesDetail?: string | null;
  washroomDetail?: string | null;
  applicationProcess?: string | null;
  faqs?: FaqItem[];
}

export function PropertyPoliciesFaqSection({
  petPolicyDetail,
  parkingDetail,
  utilitiesDetail,
  washroomDetail,
  applicationProcess,
  faqs = [],
}: PropertyPoliciesFaqSectionProps) {
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({ 0: true });

  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const policies = [
    {
      id: "pets",
      title: "Pet Policy",
      value: petPolicyDetail,
      icon: PawPrint,
      tone: "bg-amber-50 text-amber-600 border-amber-200/60",
    },
    {
      id: "parking",
      title: "Parking & Vehicle Access",
      value: parkingDetail,
      icon: Car,
      tone: "bg-blue-50 text-blue-600 border-blue-200/60",
    },
    {
      id: "utilities",
      title: "Utilities, Water & Power Backup",
      value: utilitiesDetail,
      icon: Zap,
      tone: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    },
    {
      id: "washroom",
      title: "Plumbing & Washroom Facilities",
      value: washroomDetail,
      icon: Droplets,
      tone: "bg-cyan-50 text-cyan-600 border-cyan-200/60",
    },
    {
      id: "application",
      title: "Lease Application & Move-In Process",
      value: applicationProcess,
      icon: ClipboardCheck,
      tone: "bg-purple-50 text-purple-600 border-purple-200/60",
    },
  ].filter((p) => Boolean(p.value));

  return (
    <div className="space-y-8">
      {/* Verified Building Policies Grid */}
      {policies.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Verified Building & Lease Policies
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Owner-confirmed guidelines for living and tenancy in this property.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((policy) => {
              const Icon = policy.icon;
              return (
                <div
                  key={policy.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${policy.tone}`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 mb-1">
                      {policy.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {policy.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified FAQs Accordion */}
      {faqs && faqs.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Common tenant and buyer inquiries verified directly with the property manager.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = !!openFaqIndices[idx];
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/60 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-700 shrink-0">
                        {faq.category || "General"}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {faq.question}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white/70">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
