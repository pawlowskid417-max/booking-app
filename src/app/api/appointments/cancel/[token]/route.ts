import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBookingCancellation } from "@/lib/email";
import { formatDatePL } from "@/lib/types";
import { getBookingSettings } from "@/lib/availability";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const appt = await db.appointment.findUnique({
    where: { cancelToken: token },
    include: { service: true }
  });

  if (!appt) {
    return NextResponse.json({ error: "Nie znaleziono rezerwacji" }, { status: 404 });
  }

  return NextResponse.json({
    appointment: {
      id: appt.id,
      status: appt.status,
      start_at: appt.startAt.toISOString(),
      client_first_name: appt.clientFirstName,
      client_email: appt.clientEmail,
      service_name: appt.service.name
    }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const appt = await db.appointment.findUnique({
    where: { cancelToken: token },
    include: { service: true }
  });

  if (!appt) {
    return NextResponse.json({ error: "Nie znaleziono rezerwacji" }, { status: 404 });
  }

  if (appt.status === "CANCELLED") {
    return NextResponse.json({ error: "Ta rezerwacja jest już anulowana" }, { status: 400 });
  }
  if (appt.status === "COMPLETED") {
    return NextResponse.json({ error: "Nie można anulować zrealizowanej wizyty" }, { status: 400 });
  }

  await db.appointment.update({
    where: { id: appt.id },
    data: { status: 'CANCELLED' }
  });

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
    cancelledBySalon: false,
  }).catch((err) => console.error("Błąd wysyłki email:", err));

  return NextResponse.json({ success: true });
}
