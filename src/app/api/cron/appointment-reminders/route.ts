import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBookingReminder } from "@/lib/email";
import { formatDatePL } from "@/lib/types";

export async function GET(req: NextRequest) {
  // Weryfikacja CRON_SECRET od Vercel
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Znajdź rezerwacje w ciągu najbliższych 24h, dla których jeszcze nie wysłano przypomnienia
    const appointments = await db.appointment.findMany({
      where: {
        status: "CONFIRMED",
        startAt: { gte: now, lte: in24Hours },
        reminderEmailSentAt: null,
      },
      include: {
        services: { include: { service: true } },
        employee: true,
      },
    });

    let sentCount = 0;
    let errorCount = 0;

    for (const appt of appointments) {
      try {
        const serviceName = appt.services.map(s => s.service.name).join(" + ");
        const dateLabel = formatDatePL(appt.startAt.toISOString().split("T")[0]);
        const timeLabel = appt.startAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

        await sendBookingReminder({
          appointmentId: appt.id,
          clientEmail: appt.clientEmail,
          clientFirstName: appt.clientFirstName,
          employeeName: appt.employee.firstName,
          serviceName: serviceName,
          dateLabel,
          timeLabel,
          salonName: "Studio Paznokci",
        });

        await db.appointment.update({
          where: { id: appt.id },
          data: { reminderEmailSentAt: new Date() },
        });
        sentCount++;
      } catch (e) {
        errorCount++;
        console.error(`Błąd wysyłki dla wizyty ${appt.id}:`, e);
      }
    }

    return NextResponse.json({ success: true, sent: sentCount, errors: errorCount });
  } catch (error: any) {
    return NextResponse.json({ error: "Błąd serwera", details: error.message }, { status: 500 });
  }
}
