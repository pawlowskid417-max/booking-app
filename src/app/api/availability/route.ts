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
  const serviceIdsStr = req.nextUrl.searchParams.get("serviceIds") || req.nextUrl.searchParams.get("serviceId");
  const date = req.nextUrl.searchParams.get("date");

  if (!employeeId || !serviceIdsStr) {
    return NextResponse.json(
      { error: "Wymagane parametry: employeeId, serviceIds" },
      { status: 400 }
    );
  }

  const serviceIds = serviceIdsStr.split(",");
  
  const services = await db.service.findMany({
    where: { id: { in: serviceIds }, isActive: true }
  });

  if (services.length === 0) {
    return NextResponse.json({ error: "Nie znaleziono usług" }, { status: 404 });
  }

  const totalDurationMin = services.reduce((sum, s) => sum + s.durationMin, 0);

  const settings = await getBookingSettings();
  const range = getBookableDateRange(settings);

  if (date) {
    const slots = await getAvailableSlotsForDay(employeeId, date, totalDurationMin);
    return NextResponse.json({ date, slots, range });
  }

  const days = await getBookableDaysOverview(employeeId, totalDurationMin);
  return NextResponse.json({ days, range });
}
