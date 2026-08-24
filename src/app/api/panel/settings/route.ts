import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const settings = await db.bookingSettings.findUnique({
    where: { id: "singleton" }
  });
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Tylko właściciel może zmieniać ustawienia" }, { status: 403 });
  }

  const body = await req.json();
  const data: any = {};

  const allowedFields = [
    "bookingWindowDays",
    "minLeadTimeHours",
    "slotStepMinutes",
    "autoConfirmBookings",
    "salonName",
    "salonPhone",
    "salonAddress",
    "contactEmail",
    "heroImageUrl",
    "instagramUrl",
    "facebookUrl",
    "address",
    "mapUrl",
    "mapIframeUrl",
    "openingHours"
  ];

  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Brak danych do aktualizacji" }, { status: 400 });
  }

  await db.bookingSettings.update({
    where: { id: "singleton" },
    data
  });

  return NextResponse.json({ success: true });
}
