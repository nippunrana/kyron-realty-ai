"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  X,
  Loader2,
  Mic,
  CalendarCheck,
  CalendarDays,
} from "lucide-react";
import type { CalendarDayAvailability } from "@/lib/calendar-service";

export interface BookedTourSummary {
  propertyTitle: string;
  date: string;
  time: string;
  attendeeName: string;
  attendeePhone: string;
  googleEventLink?: string | null;
}

export interface GsapCalendarHubProps {
  isOpen: boolean;
  isLoading: boolean;
  propertyTitle: string;
  days: CalendarDayAvailability[];
  selectedDate: string | null;
  bookedTour: BookedTourSummary | null;
  onClose: () => void;
  className?: string;
  isMobileTab?: boolean;
}

export function GsapCalendarHub({
  isOpen,
  isLoading,
  propertyTitle,
  days,
  selectedDate,
  bookedTour,
  onClose,
  className = "",
  isMobileTab = false,
}: GsapCalendarHubProps) {
  const slotListRef = useRef<HTMLDivElement>(null);
  const successCardRef = useRef<HTMLDivElement>(null);

  // Active day lookup
  const activeDay =
    days.find((d) => d.date === selectedDate) || days[0] || null;

  // Stagger animate slots when active day changes
  useEffect(() => {
    if (!slotListRef.current || !isOpen || bookedTour) return;

    const slotCards = slotListRef.current.querySelectorAll(".calendar-slot-card");
    if (slotCards.length > 0) {
      gsap.fromTo(
        slotCards,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          duration: 0.25,
          ease: "power2.out",
        }
      );
    }
  }, [selectedDate, isOpen, bookedTour]);

  // Animate celebratory confirmation card
  useEffect(() => {
    if (bookedTour && successCardRef.current && isOpen) {
      gsap.fromTo(
        successCardRef.current,
        { opacity: 0, scale: 0.92, y: 16 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
        }
      );
    }
  }, [bookedTour, isOpen]);

  return (
    <div
      role="region"
      aria-label="Live Property Tour Calendar"
      className={`h-full w-full bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-950/20 text-slate-900 overflow-hidden flex flex-col ${className}`}
    >
      {/* ========================================================================= */}
      {/* HEADER: Title, Working Hours & Voice Controlled Pill                      */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
                <span>Touring Schedule</span>
                {isLoading && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">{propertyTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Pure Voice Controlled Pill */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/80">
              <Mic className="w-2.5 h-2.5 text-indigo-600 animate-pulse" />
              <span>Voice Controlled</span>
            </span>

            {/* Close Button (Hidden in Mobile Tab mode) */}
            {!isMobileTab && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close calendar panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Working Hours Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[10.5px]">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Touring Hours: <strong>10:00 AM – 6:00 PM IST</strong></span>
          </div>
          <span className="text-slate-400 font-medium">1-Hour Private Slots</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7-DAY SEGMENTED DATE STRIP (Voice-Follower Indicator)                      */}
      {/* ========================================================================= */}
      {days.length > 0 && !bookedTour && (
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-white shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {days.map((day) => {
              const isActive = day.date === activeDay?.date;
              return (
                <div
                  key={day.date}
                  className={`px-2.5 py-1 rounded-xl text-center transition-all duration-150 border ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-xs shadow-indigo-600/25"
                      : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <div className="text-[10px] font-bold tracking-tight">
                    {day.dayName}
                  </div>
                  <div
                    className={`text-[9px] font-medium leading-none mt-0.5 ${
                      isActive ? "text-indigo-100" : "text-slate-400"
                    }`}
                  >
                    {day.formattedDate}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-extrabold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : day.availableCount > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {day.availableCount > 0 ? `${day.availableCount} open` : "full"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BODY: Hourly Slot Grid OR Celebratory Confirmation State                  */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {bookedTour ? (
          /* ======================================================================= */
          /* CELEBRATORY CONFIRMATION CARD                                          */
          /* ======================================================================= */
          <div
            ref={successCardRef}
            className="h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-indigo-50/70 via-white to-emerald-50/50 rounded-2xl border border-indigo-100 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wide uppercase mb-2">
              Viewing Tour Reserved
            </span>

            <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mb-1">
              You&apos;re All Set!
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Sarah has scheduled your private 1-hour walkthrough for:
            </p>

            {/* Tour Summary Details */}
            <div className="w-full max-w-sm bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs text-left mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Property:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {bookedTour.propertyTitle}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-bold text-indigo-600">
                  {bookedTour.date} • {bookedTour.time}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Attendee:</span>
                <span className="font-semibold text-slate-800">
                  {bookedTour.attendeeName} ({bookedTour.attendeePhone})
                </span>
              </div>
            </div>

            {/* Google Calendar Sync Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Added to Property Manager&apos;s Google Calendar</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Sarah is ready to continue the conversation or answer any other questions.
            </p>
          </div>
        ) : isLoading && days.length === 0 ? (
          /* Loading Skeleton */
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-800">Checking Live Availability...</p>
            <p className="text-[11px] text-slate-400">Syncing with Google Calendar</p>
          </div>
        ) : activeDay ? (
          /* Active Day Hourly Slots Grid */
          <div ref={slotListRef}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{activeDay.fullDayLabel}</span>
              </h4>
              <span className="text-[10.5px] font-semibold text-slate-500">
                {activeDay.availableCount} of {activeDay.totalSlots} slots free
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeDay.slots.map((slot) => {
                const isAvail = slot.isAvailable;
                const isBooked = slot.status === "booked";

                return (
                  <div
                    key={slot.time}
                    className={`calendar-slot-card p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-2 ${
                      isAvail
                        ? "bg-white border-slate-200/90 hover:border-indigo-300 shadow-2xs ring-1 ring-slate-900/5"
                        : isBooked
                        ? "bg-slate-50/80 border-slate-200/50 text-slate-400"
                        : "bg-slate-50/40 border-slate-100 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isAvail
                            ? "bg-indigo-50 text-indigo-600"
                            : isBooked
                            ? "bg-slate-100 text-slate-400"
                            : "bg-slate-100 text-slate-300"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-xs font-bold tracking-tight truncate ${
                            isAvail
                              ? "text-slate-900"
                              : isBooked
                              ? "text-slate-500"
                              : "text-slate-300"
                          }`}
                        >
                          {slot.label}
                        </div>
                        <div className="text-[10px] text-slate-400">1-Hour Tour</div>
                      </div>
                    </div>

                    <div>
                      {isAvail ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Available</span>
                        </span>
                      ) : isBooked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Booked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[9.5px]">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <p className="text-xs">No touring schedule found for this home.</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FOOTER: Pure Voice Help Guidance                                         */}
      {/* ========================================================================= */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium truncate">
          <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
          <span className="truncate">
            Tell Sarah which day or time you prefer (e.g. &ldquo;Book Friday at 3 PM&rdquo;)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
          Hands-free
        </span>
      </div>
    </div>
  );
}
