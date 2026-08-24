import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy");

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
      },
    });

    let sentCount = 0;
    let errorCount = 0;

    for (const appt of appointments) {
      try {
        await resend.emails.send({
          from: "Studio Paznokci <rezerwacje@twojadomena.pl>", // Zmień na docelowy adres po zweryfikowaniu w Resend
          to: appt.clientEmail,
          subject: "Przypomnienie o wizycie - Studio Paznokci",
          html: `
            <h2>Przypomnienie o wizycie</h2>
            <p>Witaj ${appt.clientFirstName},</p>
            <p>Przypominamy o Twojej nadchodzącej wizycie: <strong>${appt.services.map(s => s.service.name).join(' + ')}</strong>.</p>
            <p>Data: ${appt.startAt.toLocaleString("pl-PL")}</p>
            <p>Czekamy na Ciebie!</p>
          `,
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
