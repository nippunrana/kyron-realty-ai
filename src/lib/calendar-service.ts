import { and, eq, gte, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { properties, viewingAppointments, inquiriesAndLeads } from "@/db/schema";
import {
  DEFAULT_CALENDAR_TIME_ZONE,
  getOwnerCalendarAccess,
} from "@/lib/google-calendar";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
export const WORKING_HOURS_START = 10; // 10:00 AM
export const WORKING_HOURS_END = 18; // 6:00 PM (18:00)
export const SLOT_DURATION_HOURS = 1;
export const MIN_NOTICE_HOURS = 2; // 2 hours minimum advance notice for same-day

export interface CalendarSlot {
  time: string; // "10:00"
  endTime: string; // "11:00"
  label: string; // "10:00 AM - 11:00 AM"
  isoStart: string; // ISO 8601 with timezone
  isoEnd: string;
  isAvailable: boolean;
  status: "available" | "booked" | "past";
}

export interface CalendarDayAvailability {
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Today", "Tomorrow", "Friday", etc.
  formattedDate: string; // "Sep 12"
  fullDayLabel: string; // "Friday, Sep 12"
  availableCount: number;
  totalSlots: number;
  slots: CalendarSlot[];
}

export interface PropertyAvailabilityResult {
  hasCalendar: boolean;
  propertyTitle: string;
  timeZone: string;
  workingHours: {
    start: number;
    end: number;
    label: string;
  };
  days: CalendarDayAvailability[];
}

/** Formats a date in Asia/Kolkata as YYYY-MM-DD */
function formatDateInZone(date: Date, timeZone = DEFAULT_CALENDAR_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

/** Formats 24h hour into 12h label */
function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${period}`;
}

/**
 * Computes availability for a property across the next N days (default 7)
 * using Google Calendar freeBusy and local viewing_appointments.
 */
export async function getPropertyCalendarAvailability(
  propertySlugOrId: string | number,
  daysAhead = 7
): Promise<PropertyAvailabilityResult> {
  const propertyQuery =
    typeof propertySlugOrId === "number"
      ? eq(properties.id, propertySlugOrId)
      : eq(properties.slug, propertySlugOrId);

  const [prop] = await db
    .select({
      id: properties.id,
      title: properties.title,
      slug: properties.slug,
      ownerId: properties.ownerId,
    })
    .from(properties)
    .where(propertyQuery)
    .limit(1);

  if (!prop) {
    throw new Error(`Property not found: ${propertySlugOrId}`);
  }

  // Check if owner exists and has Google Calendar access
  if (!prop.ownerId) {
    return {
      hasCalendar: false,
      propertyTitle: prop.title,
      timeZone: DEFAULT_CALENDAR_TIME_ZONE,
      workingHours: {
        start: WORKING_HOURS_START,
        end: WORKING_HOURS_END,
        label: "10:00 AM – 6:00 PM IST",
      },
      days: [],
    };
  }

  const access = await getOwnerCalendarAccess(prop.ownerId);
  if (!access) {
    return {
      hasCalendar: false,
      propertyTitle: prop.title,
      timeZone: DEFAULT_CALENDAR_TIME_ZONE,
      workingHours: {
        start: WORKING_HOURS_START,
        end: WORKING_HOURS_END,
        label: "10:00 AM – 6:00 PM IST",
      },
      days: [],
    };
  }

  // Generate date list starting from today
  const now = new Date();
  const dayDates: Date[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    dayDates.push(d);
  }

  const startDateStr = formatDateInZone(dayDates[0]);
  const endDateStr = formatDateInZone(dayDates[dayDates.length - 1]);

  const timeMin = `${startDateStr}T00:00:00+05:30`;
  const timeMax = `${endDateStr}T23:59:59+05:30`;

  // 1. Query Google Calendar freeBusy
  const busyIntervals: Array<{ start: number; end: number }> = [];
  try {
    const freeBusyRes = await fetch(`${CALENDAR_API}/freeBusy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: DEFAULT_CALENDAR_TIME_ZONE,
        items: [{ id: access.calendarId }, { id: "primary" }],
      }),
    });

    if (freeBusyRes.ok) {
      const data = (await freeBusyRes.json()) as {
        calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
      };
      if (data?.calendars) {
        for (const calData of Object.values(data.calendars)) {
          if (calData.busy) {
            for (const b of calData.busy) {
              busyIntervals.push({
                start: new Date(b.start).getTime(),
                end: new Date(b.end).getTime(),
              });
            }
          }
        }
      }
    } else {
      console.warn(
        `[Calendar Service] Google freeBusy returned ${freeBusyRes.status}:`,
        await freeBusyRes.text().catch(() => "")
      );
    }
  } catch (err) {
    console.error("[Calendar Service] Error fetching freeBusy from Google:", err);
  }

  // 2. Query local DB viewing appointments
  try {
    const localAppointments = await db
      .select({
        start: viewingAppointments.scheduledStart,
        end: viewingAppointments.scheduledEnd,
      })
      .from(viewingAppointments)
      .where(
        and(
          eq(viewingAppointments.propertyId, prop.id),
          ne(viewingAppointments.status, "cancelled"),
          gte(viewingAppointments.scheduledStart, new Date(timeMin)),
          lte(viewingAppointments.scheduledEnd, new Date(timeMax))
        )
      );

    for (const appt of localAppointments) {
      busyIntervals.push({
        start: appt.start.getTime(),
        end: appt.end.getTime(),
      });
    }
  } catch (err) {
    console.warn("[Calendar Service] Error querying local appointments:", err);
  }

  // 3. Build day slots
  const nowMs = now.getTime();
  const minNoticeMs = MIN_NOTICE_HOURS * 60 * 60 * 1000;

  const days: CalendarDayAvailability[] = dayDates.map((dateObj, dayIndex) => {
    const dateStr = formatDateInZone(dateObj);
    const dayOfWeek = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: DEFAULT_CALENDAR_TIME_ZONE,
    }).format(dateObj);
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: DEFAULT_CALENDAR_TIME_ZONE,
    }).format(dateObj);

    let dayName = dayOfWeek;
    if (dayIndex === 0) dayName = "Today";
    else if (dayIndex === 1) dayName = "Tomorrow";

    const slots: CalendarSlot[] = [];

    for (let h = WORKING_HOURS_START; h < WORKING_HOURS_END; h += SLOT_DURATION_HOURS) {
      const hStr = h.toString().padStart(2, "0");
      const endH = h + SLOT_DURATION_HOURS;
      const endHStr = endH.toString().padStart(2, "0");

      const isoStart = `${dateStr}T${hStr}:00:00+05:30`;
      const isoEnd = `${dateStr}T${endHStr}:00:00+05:30`;

      const slotStartMs = new Date(isoStart).getTime();
      const slotEndMs = new Date(isoEnd).getTime();

      let status: "available" | "booked" | "past" = "available";
      let isAvailable = true;

      // Check if slot is in the past or under min notice buffer
      if (slotStartMs < nowMs + minNoticeMs) {
        status = "past";
        isAvailable = false;
      } else {
        // Check overlap with busy intervals
        const hasConflict = busyIntervals.some(
          (busy) => busy.start < slotEndMs && busy.end > slotStartMs
        );
        if (hasConflict) {
          status = "booked";
          isAvailable = false;
        }
      }

      slots.push({
        time: `${hStr}:00`,
        endTime: `${endHStr}:00`,
        label: `${formatHourLabel(h)} - ${formatHourLabel(endH)}`,
        isoStart,
        isoEnd,
        isAvailable,
        status,
      });
    }

    const availableCount = slots.filter((s) => s.isAvailable).length;

    return {
      date: dateStr,
      dayName,
      formattedDate,
      fullDayLabel: `${dayName === "Today" || dayName === "Tomorrow" ? `${dayName}, ` : ""}${dayOfWeek}, ${formattedDate}`,
      availableCount,
      totalSlots: slots.length,
      slots,
    };
  });

  return {
    hasCalendar: true,
    propertyTitle: prop.title,
    timeZone: DEFAULT_CALENDAR_TIME_ZONE,
    workingHours: {
      start: WORKING_HOURS_START,
      end: WORKING_HOURS_END,
      label: "10:00 AM – 6:00 PM IST",
    },
    days,
  };
}

export interface BookTourSlotParams {
  propertySlugOrId: string | number;
  date: string; // "YYYY-MM-DD"
  time: string; // "14:00" or "2:00 PM"
  attendeeName: string;
  attendeePhone: string;
  attendeeEmail?: string | null;
  notes?: string | null;
  voiceSessionId?: number | null;
}

export interface BookTourSlotResult {
  success: boolean;
  appointmentId?: number;
  googleEventId?: string | null;
  googleEventLink?: string | null;
  summary: {
    propertyTitle: string;
    date: string;
    time: string;
    attendeeName: string;
    attendeePhone: string;
  };
  message: string;
}

/** Converts "14:00" or "2:00 PM" or "2 PM" or "14" to HH:00 */
export function normalizeTimeFormat(rawTime: string): string {
  const clean = rawTime.trim().toLowerCase();
  const match12 = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match12) return "10:00";

  let hour = parseInt(match12[1], 10);
  const isPm = match12[3] === "pm";
  const isAm = match12[3] === "am";

  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;

  // Clamp within working hours
  if (hour < WORKING_HOURS_START) hour = WORKING_HOURS_START;
  if (hour >= WORKING_HOURS_END) hour = WORKING_HOURS_END - 1;

  return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * Books a 1-hour property tour slot on Google Calendar and saves
 * to viewing_appointments and inquiries_and_leads.
 */
export async function bookPropertyTourSlot(
  params: BookTourSlotParams
): Promise<BookTourSlotResult> {
  const {
    propertySlugOrId,
    date,
    time: rawTime,
    attendeeName,
    attendeePhone,
    attendeeEmail,
    notes,
    voiceSessionId,
  } = params;

  if (!attendeeName || !attendeePhone) {
    throw new Error("Attendee name and phone number are required for booking.");
  }

  const propertyQuery =
    typeof propertySlugOrId === "number"
      ? eq(properties.id, propertySlugOrId)
      : eq(properties.slug, propertySlugOrId);

  const [prop] = await db
    .select({
      id: properties.id,
      title: properties.title,
      slug: properties.slug,
      ownerId: properties.ownerId,
    })
    .from(properties)
    .where(propertyQuery)
    .limit(1);

  if (!prop) {
    throw new Error(`Property not found: ${propertySlugOrId}`);
  }

  const normalizedTime = normalizeTimeFormat(rawTime);
  const startHour = parseInt(normalizedTime.split(":")[0], 10);
  const endHour = startHour + SLOT_DURATION_HOURS;

  const isoStart = `${date}T${startHour.toString().padStart(2, "0")}:00:00+05:30`;
  const isoEnd = `${date}T${endHour.toString().padStart(2, "0")}:00:00+05:30`;

  const startDate = new Date(isoStart);
  const endDate = new Date(isoEnd);

  // 1. Resolve Owner's Google Calendar Access
  let googleEventId: string | null = null;
  let googleEventLink: string | null = null;

  if (prop.ownerId) {
    const access = await getOwnerCalendarAccess(prop.ownerId);
    if (access) {
      try {
        const eventPayload: Record<string, unknown> = {
          summary: `Tour: ${prop.title} - ${attendeeName.trim()}`,
          description: `Viewing appointment booked via Sarah (Kyron Realty AI Sales Agent).\n\nAttendee: ${attendeeName.trim()}\nPhone: ${attendeePhone.trim()}${
            attendeeEmail ? `\nEmail: ${attendeeEmail.trim()}` : ""
          }${notes ? `\nNotes: ${notes.trim()}` : ""}`,
          start: { dateTime: isoStart, timeZone: DEFAULT_CALENDAR_TIME_ZONE },
          end: { dateTime: isoEnd, timeZone: DEFAULT_CALENDAR_TIME_ZONE },
        };

        if (attendeeEmail && attendeeEmail.includes("@")) {
          eventPayload.attendees = [
            { email: attendeeEmail.trim(), displayName: attendeeName.trim() },
          ];
        }

        const createRes = await fetch(
          `${CALENDAR_API}/calendars/${encodeURIComponent(access.calendarId)}/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventPayload),
          }
        );

        if (createRes.ok) {
          const created = (await createRes.json()) as { id?: string; htmlLink?: string };
          googleEventId = created.id ?? null;
          googleEventLink = created.htmlLink ?? null;
        } else {
          console.error(
            `[Calendar Service] Google Event creation failed (${createRes.status}):`,
            await createRes.text().catch(() => "")
          );
        }
      } catch (calErr) {
        console.error("[Calendar Service] Error creating Google Calendar event:", calErr);
      }
    }
  }

  // 2. Insert Lead Record into inquiries_and_leads
  const [lead] = await db
    .insert(inquiriesAndLeads)
    .values({
      propertyId: prop.id,
      name: attendeeName.trim(),
      phone: attendeePhone.trim(),
      email: attendeeEmail?.trim() || null,
      intent: "tour",
      leadStatus: "viewing_scheduled",
      leadScore: 90,
      notes: notes || "Booked via Sarah live voice agent with Google Calendar sync",
    })
    .returning({ id: inquiriesAndLeads.id });

  // 3. Insert Appointment into viewing_appointments
  const [appointment] = await db
    .insert(viewingAppointments)
    .values({
      propertyId: prop.id,
      leadId: lead.id,
      voiceSessionId: voiceSessionId || null,
      tourType: "in_person",
      scheduledStart: startDate,
      scheduledEnd: endDate,
      status: "confirmed",
      attendeeName: attendeeName.trim(),
      attendeePhone: attendeePhone.trim(),
      attendeeEmail: attendeeEmail?.trim() || null,
      specialRequests: notes || null,
    })
    .returning({ id: viewingAppointments.id });

  return {
    success: true,
    appointmentId: appointment?.id,
    googleEventId,
    googleEventLink,
    summary: {
      propertyTitle: prop.title,
      date,
      time: `${formatHourLabel(startHour)} - ${formatHourLabel(endHour)}`,
      attendeeName: attendeeName.trim(),
      attendeePhone: attendeePhone.trim(),
    },
    message: "Viewing appointment confirmed and added to calendar.",
  };
}
