import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const employeeId = req.nextUrl.searchParams.get("employeeId");
  if (!employeeId) return NextResponse.json({ error: "Wymagany employeeId" }, { status: 400 });

  if (user.role !== "OWNER" && user.employeeId !== employeeId) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const hours = await db.workingHour.findMany({
    where: { employeeId },
    orderBy: { weekday: 'asc' }
  });

  return NextResponse.json({ workingHours: hours });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { employeeId, hours } = await req.json();

  if (!employeeId || !Array.isArray(hours)) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  if (user.role !== "OWNER" && user.employeeId !== employeeId) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  await db.$transaction(async (tx) => {
    await tx.workingHour.deleteMany({
      where: { employeeId }
    });
    
    for (const h of hours) {
      if (!h.isActive) continue;
      await tx.workingHour.create({
        data: {
          id: randomUUID(),
          employeeId,
          weekday: h.weekday,
          startTime: h.startTime,
          endTime: h.endTime,
          isActive: true
        }
      });
    }
  });

  return NextResponse.json({ success: true });
}
