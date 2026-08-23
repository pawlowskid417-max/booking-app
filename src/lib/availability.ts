import { db } from "./db";

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

async function getWorkingWindowForDate(
  employeeId: string,
  dateStr: string
): Promise<{ start: string; end: string } | null> {
  const override = await db.dayOverride.findFirst({
    where: {
      employeeId,
      date: new Date(dateStr + "T00:00:00.000Z"),
    },
  });

  if (override) {
    if (override.type === "DAY_OFF") return null;
    if (override.type === "CUSTOM_HOURS" && override.startTime && override.endTime) {
      return { start: override.startTime, end: override.endTime };
    }
  }

  const weekday = new Date(dateStr + "T00:00:00.000Z").getUTCDay();
  const wh = await db.workingHour.findFirst({
    where: {
      employeeId,
      weekday,
      isActive: true,
    },
  });

  if (!wh) return null;
  return { start: wh.startTime, end: wh.endTime };
}

export async function getAvailableSlotsForDay(
  employeeId: string,
  dateStr: string,
  serviceDurationMin: number
): Promise<string[]> {
  const settings = await getBookingSettings();
  const { from, to } = getBookableDateRange(settings);

  if (dateStr < from || dateStr > to) return [];

  const window = await getWorkingWindowForDate(employeeId, dateStr);
  if (!window) return [];

  const dayStartMin = timeToMinutes(window.start);
  const dayEndMin = timeToMinutes(window.end);
  const step = settings.slotStepMinutes;

  const dayStartIso = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEndIso = new Date(`${dateStr}T23:59:59.999Z`);
  const existing = await db.appointment.findMany({
    where: {
      employeeId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { lt: dayEndIso },
      endAt: { gt: dayStartIso },
    },
  });

  const busyRanges = existing.map((a) => ({
    start: Math.round((a.startAt.getTime() - dayStartIso.getTime()) / 60000),
    end: Math.round((a.endAt.getTime() - dayStartIso.getTime()) / 60000),
  }));

  const now = new Date();
  const isToday = toDateStr(now) === dateStr;
  const minStartMin = isToday
    ? Math.round((now.getTime() - dayStartIso.getTime()) / 60000) + settings.minLeadTimeHours * 60
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

  const result: { date: string; hasSlots: boolean }[] = [];
  const cur = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");

  while (cur <= end) {
    const dateStr = toDateStr(cur);
    const slots = await getAvailableSlotsForDay(employeeId, dateStr, serviceDurationMin);
    result.push({ date: dateStr, hasSlots: slots.length > 0 });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}
