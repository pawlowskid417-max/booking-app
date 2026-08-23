import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getAvailableSlotsForDay,
  getBookableDaysOverview,
  getBookingSettings,
  getBookableDateRange,
} from "@/lib/availability";

export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const serviceId = req.nextUrl.searchParams.get("serviceId");
  const date = req.nextUrl.searchParams.get("date");

  if (!employeeId || !serviceId) {
    return NextResponse.json(
      { error: "Wymagane parametry: employeeId, serviceId" },
      { status: 400 }
    );
  }

  const service = await db.service.findFirst({
    where: { id: serviceId, isActive: true }
  });

  if (!service) {
    return NextResponse.json({ error: "Nie znaleziono usługi" }, { status: 404 });
  }

  const settings = await getBookingSettings();
  const range = getBookableDateRange(settings);

  if (date) {
    const slots = await getAvailableSlotsForDay(employeeId, date, service.durationMin);
    return NextResponse.json({ date, slots, range });
  }

  const days = await getBookableDaysOverview(employeeId, service.durationMin);
  return NextResponse.json({ days, range });
}
