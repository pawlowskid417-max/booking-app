import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { isSlotStillAvailable, getBookingSettings } from "@/lib/availability";
import { sendBookingConfirmation } from "@/lib/email";
import { formatDatePL, formatPrice } from "@/lib/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CreateAppointmentBody {
  employeeId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone?: string;
  note?: string;
  _gotcha?: string;
}

export async function POST(req: NextRequest) {
  let body: CreateAppointmentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane wejściowe" }, { status: 400 });
  }

  const {
    employeeId,
    serviceId,
    date,
    time,
    clientFirstName,
    clientLastName,
    clientEmail,
    clientPhone,
    note,
    _gotcha,
  } = body;

  // HONEYPOT: if filled, act like it succeeded to trick the bot
  if (_gotcha && _gotcha.length > 0) {
    return NextResponse.json({
      success: true,
      appointment: {
        id: randomUUID(),
        status: "PENDING",
        date: date || "2099-01-01",
        time: time || "12:00",
        serviceName: "Fake Service",
        servicePrice: "0 zł",
        employeeName: "Fake Person",
        cancelToken: randomUUID(),
      },
    });
  }

  if (!employeeId || !serviceId || !date || !time) {
    return NextResponse.json({ error: "Brak wymaganych danych terminu" }, { status: 400 });
  }
  if (!clientFirstName?.trim() || !clientLastName?.trim()) {
    return NextResponse.json({ error: "Imię i nazwisko są wymagane" }, { status: 400 });
  }
  if (!clientEmail?.trim() || !EMAIL_REGEX.test(clientEmail.trim())) {
    return NextResponse.json({ error: "Podaj prawidłowy adres email" }, { status: 400 });
  }

  const service = await db.service.findFirst({
    where: { id: serviceId, isActive: true }
  });

  if (!service) {
    return NextResponse.json({ error: "Nie znaleziono wybranej usługi" }, { status: 404 });
  }

  const employee = await db.employee.findFirst({
    where: { id: employeeId, isActive: true }
  });

  if (!employee) {
    return NextResponse.json({ error: "Nie znaleziono wybranej osoby" }, { status: 404 });
  }

  const canPerform = await db.employeeService.findUnique({
    where: {
      employeeId_serviceId: { employeeId, serviceId }
    }
  });

  if (!canPerform) {
    return NextResponse.json(
      { error: "Wybrana osoba nie wykonuje tej usługi" },
      { status: 400 }
    );
  }

  if (!(await isSlotStillAvailable(employeeId, date, time, service.durationMin))) {
    return NextResponse.json(
      { error: "Ten termin został już zajęty. Wybierz inną godzinę." },
      { status: 409 }
    );
  }

  const startAt = new Date(`${date}T${time}:00.000Z`);
  const endAt = new Date(startAt.getTime() + service.durationMin * 60000);

  const settings = await getBookingSettings();
  const status = settings.autoConfirmBookings ? "CONFIRMED" : "PENDING";

  const appointmentId = randomUUID();
  const cancelToken = randomUUID();

  try {
    await db.$transaction(async (tx) => {
      const overlaps = await tx.appointment.findFirst({
        where: {
          employeeId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startAt: { lt: endAt },
          endAt: { gt: startAt }
        }
      });
      if (overlaps) {
        throw new Error("SLOT_TAKEN");
      }

      await tx.appointment.create({
        data: {
          id: appointmentId,
          employeeId,
          serviceId,
          clientFirstName: clientFirstName.trim(),
          clientLastName: clientLastName.trim(),
          clientEmail: clientEmail.trim().toLowerCase(),
          clientPhone: clientPhone?.trim() || null,
          note: note?.trim() || null,
          startAt,
          endAt,
          status,
          cancelToken
        }
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "Ten termin został już zajęty. Wybierz inną godzinę." },
        { status: 409 }
      );
    }
    throw e;
  }

  const cancelUrl = `${req.nextUrl.origin}/anuluj/${cancelToken}`;
  await sendBookingConfirmation({
    appointmentId,
    clientEmail: clientEmail.trim().toLowerCase(),
    clientFirstName: clientFirstName.trim(),
    employeeName: `${employee.firstName} ${employee.lastName}`,
    serviceName: service.name,
    dateLabel: formatDatePL(date),
    timeLabel: time,
    cancelUrl,
    salonName: settings.salonName,
  }).catch((err) => console.error("Błąd wysyłki email:", err));

  return NextResponse.json({
    success: true,
    appointment: {
      id: appointmentId,
      status,
      date,
      time,
      serviceName: service.name,
      servicePrice: formatPrice(service.priceCents),
      employeeName: `${employee.firstName} ${employee.lastName}`,
      cancelToken,
    },
  });
}
