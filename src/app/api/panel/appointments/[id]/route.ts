import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendBookingCancellation } from "@/lib/email";
import { formatDatePL } from "@/lib/types";
import { getBookingSettings } from "@/lib/availability";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Nieprawidłowy status" }, { status: 400 });
  }

  const appt = await db.appointment.findUnique({
    where: { id },
    include: { service: true }
  });

  if (!appt) return NextResponse.json({ error: "Nie znaleziono rezerwacji" }, { status: 404 });

  if (user.role !== "OWNER" && appt.employeeId !== user.employeeId) {
    return NextResponse.json({ error: "Brak dostępu do tej rezerwacji" }, { status: 403 });
  }

  await db.appointment.update({
    where: { id },
    data: { status }
  });

  if (status === "CANCELLED" && appt.status !== "CANCELLED") {
    const settings = await getBookingSettings();

    const startAtStr = appt.startAt.toISOString();
    const dateStr = startAtStr.slice(0, 10);
    const timeStr = startAtStr.slice(11, 16);

    sendBookingCancellation({
      appointmentId: appt.id,
      clientEmail: appt.clientEmail,
      clientFirstName: appt.clientFirstName,
      serviceName: appt.service.name,
      dateLabel: formatDatePL(dateStr),
      timeLabel: timeStr,
      salonName: settings.salonName,
      cancelledBySalon: true,
    }).catch((err) => console.error("Błąd wysyłki email:", err));
  }

  return NextResponse.json({ success: true });
}
