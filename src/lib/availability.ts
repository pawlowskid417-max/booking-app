import { db } from "./db";
import { Appointment, DayOverride, WorkingHour } from "@prisma/client";

export interface BookingSettings {
  id: string;
  bookingWindowDays: number;
  minLeadTimeHours: number;
  slotStepMinutes: number;
  autoConfirmBookings: boolean;
  salonName: string;
  salonPhone: string | null;
  salonAddress: string | null;
  contactEmail: string | null;
}

export async function getBookingSettings(): Promise<BookingSettings> {
  const row = await db.bookingSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!row) throw new Error("Settings not found");
  return row;
}

export function getBookableDateRange(settings: BookingSettings): { from: string; to: string } {
  const now = new Date();
  const from = toDateStr(now);
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + settings.bookingWindowDays);
  const to = toDateStr(toDate);
  return { from, to };
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

interface Context {
  settings: BookingSettings;
  overrides: DayOverride[];
  workingHours: WorkingHour[];
  appointments: Appointment[];
}

function getWorkingWindowForDateFromContext(
  dateStr: string,
  ctx: Context
): { start: string; end: string } | null {
  const dateIso = dateStr + "T00:00:00.000Z";
  const dateObj = new Date(dateIso);
  
  const override = ctx.overrides.find((o) => o.date.getTime() === dateObj.getTime());

  if (override) {
    if (override.type === "DAY_OFF") return null;
    if (override.type === "CUSTOM_HOURS" && override.startTime && override.endTime) {
      return { start: override.startTime, end: override.endTime };
    }
  }

  const weekday = dateObj.getUTCDay();
  const wh = ctx.workingHours.find((w) => w.weekday === weekday && w.isActive);

  if (!wh) return null;
  return { start: wh.startTime, end: wh.endTime };
}

function getAvailableSlotsFromContext(
  dateStr: string,
  serviceDurationMin: number,
  ctx: Context
): string[] {
  const { from, to } = getBookableDateRange(ctx.settings);
  if (dateStr < from || dateStr > to) return [];

  const window = getWorkingWindowForDateFromContext(dateStr, ctx);
  if (!window) return [];

  const dayStartMin = timeToMinutes(window.start);
  const dayEndMin = timeToMinutes(window.end);
  const step = ctx.settings.slotStepMinutes;

  const dayStartIso = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEndIso = new Date(`${dateStr}T23:59:59.999Z`);
  
  const dayAppointments = ctx.appointments.filter(
    (a) => a.startAt < dayEndIso && a.endAt > dayStartIso
  );

  const busyRanges = dayAppointments.map((a) => ({
    start: Math.round((a.startAt.getTime() - dayStartIso.getTime()) / 60000),
    end: Math.round((a.endAt.getTime() - dayStartIso.getTime()) / 60000),
  }));

  const now = new Date();
  const isToday = toDateStr(now) === dateStr;
  const minStartMin = isToday
    ? Math.round((now.getTime() - dayStartIso.getTime()) / 60000) + ctx.settings.minLeadTimeHours * 60
    : -Infinity;

  const slots: string[] = [];
  for (let slotStart = dayStartMin; slotStart + serviceDurationMin <= dayEndMin; slotStart += step) {
    const slotEnd = slotStart + serviceDurationMin;
    if (slotStart < minStartMin) continue;
    const overlaps = busyRanges.some((b) => slotStart < b.end && slotEnd > b.start);
    if (overlaps) continue;
    slots.push(minutesToTime(slotStart));
  }

  return slots;
}

export async function getAvailableSlotsForDay(
  employeeId: string,
  dateStr: string,
  serviceDurationMin: number
): Promise<string[]> {
  const settings = await getBookingSettings();
  const dayStartIso = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEndIso = new Date(`${dateStr}T23:59:59.999Z`);

  const [overrides, workingHours, appointments] = await Promise.all([
    db.dayOverride.findMany({
      where: { employeeId, date: dayStartIso },
    }),
    db.workingHour.findMany({
      where: { employeeId, isActive: true },
    }),
    db.appointment.findMany({
      where: {
        employeeId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { lt: dayEndIso },
        endAt: { gt: dayStartIso },
      },
    }),
  ]);

  const ctx: Context = { settings, overrides, workingHours, appointments };
  return getAvailableSlotsFromContext(dateStr, serviceDurationMin, ctx);
}

export async function isSlotStillAvailable(
  employeeId: string,
  dateStr: string,
  time: string,
  serviceDurationMin: number
): Promise<boolean> {
  const available = await getAvailableSlotsForDay(employeeId, dateStr, serviceDurationMin);
  return available.includes(time);
}

export async function getBookableDaysOverview(
  employeeId: string,
  serviceDurationMin: number
): Promise<{ date: string; hasSlots: boolean }[]> {
  const settings = await getBookingSettings();
  const { from, to } = getBookableDateRange(settings);
  
  const fromIso = new Date(`${from}T00:00:00.000Z`);
  const toIso = new Date(`${to}T23:59:59.999Z`);

  const [overrides, workingHours, appointments] = await Promise.all([
    db.dayOverride.findMany({
      where: { 
        employeeId,
        date: { gte: fromIso, lte: toIso }
      },
    }),
    db.workingHour.findMany({
      where: { employeeId, isActive: true },
    }),
    db.appointment.findMany({
      where: {
        employeeId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { lt: toIso },
        endAt: { gt: fromIso },
      },
    }),
  ]);

  const ctx: Context = { settings, overrides, workingHours, appointments };

  const result: { date: string; hasSlots: boolean }[] = [];
  const cur = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");

  while (cur <= end) {
    const dateStr = toDateStr(cur);
    const slots = getAvailableSlotsFromContext(dateStr, serviceDurationMin, ctx);
    result.push({ date: dateStr, hasSlots: slots.length > 0 });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}
