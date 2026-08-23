import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const employeeId = req.nextUrl.searchParams.get("employeeId");
  if (!employeeId) return NextResponse.json({ error: "Wymagany employeeId" }, { status: 400 });

  const overrides = await db.dayOverride.findMany({
    where: { employeeId },
    orderBy: { date: 'asc' }
  });

  return NextResponse.json({ overrides });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { employeeId, date, type, startTime, endTime, note } = await req.json();

  if (!employeeId || !date || !type) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  if (user.role !== "OWNER" && user.employeeId !== employeeId) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  await db.dayOverride.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: parsedDate
      }
    },
    update: {
      type,
      startTime: startTime || null,
      endTime: endTime || null,
      note: note || null
    },
    create: {
      id: randomUUID(),
      employeeId,
      date: parsedDate,
      type,
      startTime: startTime || null,
      endTime: endTime || null,
      note: note || null
    }
  });

  return NextResponse.json({ success: true });
}
