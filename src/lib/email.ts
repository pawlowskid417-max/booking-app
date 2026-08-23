import { db } from "./db";
import { randomUUID } from "crypto";

// ============================================================
// WARSTWA WYSYŁKI EMAIL
// ============================================================
// W tym demo: tylko logujemy do konsoli + zapisujemy w notification_logs
// (żeby dało się przetestować cały przepływ bez płatnego dostawcy).
//
// W PRODUKCJI podmień funkcję `sendEmailRaw` na realną wysyłkę przez:
//   - Resend (darmowy tier 3000 maili/mies.) — kilka linii kodu, patrz
//     https://resend.com/docs/send-with-nodejs
//   - albo Nodemailer + istniejąca skrzynka SMTP (Gmail/domenowa) — 0 zł
// Reszta systemu (kiedy i do kogo wysyłać) zostaje bez zmian.
// ============================================================

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmailRaw(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  // --- TRYB DEMO: logujemy zamiast realnie wysyłać ---
  console.log("=".repeat(60));
  console.log(`[EMAIL] Do: ${payload.to}`);
  console.log(`[EMAIL] Temat: ${payload.subject}`);
  console.log(`[EMAIL] Treść:\n${payload.text}`);
  console.log("=".repeat(60));

  // --- PRZYKŁAD PRODUKCYJNY Z RESEND ---
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Studio Paznokci <onboarding@resend.dev>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };

  return { ok: true };
}

async function logNotification(
  appointmentId: string,
  type: string,
  recipient: string,
  status: "SENT" | "FAILED",
  errorMessage?: string
) {
  await db.notificationLog.create({
    data: {
      id: randomUUID(),
      appointmentId,
      type,
      recipient,
      status,
      errorMessage: errorMessage ?? null,
    },
  });
}

export async function sendBookingConfirmation(params: {
  appointmentId: string;
  clientEmail: string;
  clientFirstName: string;
  employeeName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  cancelUrl: string;
  salonName: string;
}) {
  const subject = `Potwierdzenie wizyty — ${params.salonName}`;
  const text = `Cześć ${params.clientFirstName}!

Twoja wizyta została zarezerwowana:

Usługa: ${params.serviceName}
Osoba: ${params.employeeName}
Termin: ${params.dateLabel}, godz. ${params.timeLabel}

Jeśli chcesz odwołać wizytę, skorzystaj z tego linku:
${params.cancelUrl}

Do zobaczenia!
${params.salonName}`;

  const html = text.replace(/\n/g, "<br/>");

  const result = await sendEmailRaw({ to: params.clientEmail, subject, html, text });
  await logNotification(
    params.appointmentId,
    "BOOKING_CONFIRMATION",
    params.clientEmail,
    result.ok ? "SENT" : "FAILED",
    result.error
  );

  if (result.ok) {
    await db.appointment.update({
      where: { id: params.appointmentId },
      data: { confirmationEmailSentAt: new Date() },
    });
  }

  return result;
}

export async function sendBookingCancellation(params: {
  appointmentId: string;
  clientEmail: string;
  clientFirstName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  salonName: string;
  cancelledBySalon: boolean;
}) {
  const subject = `Wizyta odwołana — ${params.salonName}`;
  const text = `Cześć ${params.clientFirstName}!

${
    params.cancelledBySalon
      ? "Niestety musimy odwołać Twoją wizytę:"
      : "Twoja wizyta została anulowana zgodnie z Twoją prośbą:"
  }

Usługa: ${params.serviceName}
Termin: ${params.dateLabel}, godz. ${params.timeLabel}

${params.cancelledBySalon ? "Przepraszamy za utrudnienia — zapraszamy do rezerwacji nowego terminu." : "Zapraszamy ponownie!"}

${params.salonName}`;

  const html = text.replace(/\n/g, "<br/>");

  const result = await sendEmailRaw({ to: params.clientEmail, subject, html, text });
  await logNotification(
    params.appointmentId,
    "BOOKING_CANCELLED",
    params.clientEmail,
    result.ok ? "SENT" : "FAILED",
    result.error
  );

  return result;
}

export async function sendBookingReminder(params: {
  appointmentId: string;
  clientEmail: string;
  clientFirstName: string;
  employeeName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  salonName: string;
}) {
  const subject = `Przypomnienie o wizycie jutro — ${params.salonName}`;
  const text = `Cześć ${params.clientFirstName}!

Przypominamy o jutrzejszej wizycie:

Usługa: ${params.serviceName}
Osoba: ${params.employeeName}
Termin: ${params.dateLabel}, godz. ${params.timeLabel}

Do zobaczenia!
${params.salonName}`;

  const html = text.replace(/\n/g, "<br/>");

  const result = await sendEmailRaw({ to: params.clientEmail, subject, html, text });
  await logNotification(
    params.appointmentId,
    "BOOKING_REMINDER",
    params.clientEmail,
    result.ok ? "SENT" : "FAILED",
    result.error
  );

  if (result.ok) {
    await db.appointment.update({
      where: { id: params.appointmentId },
      data: { reminderEmailSentAt: new Date() },
    });
  }

  return result;
}
