import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const employees = await db.employee.findMany({
    orderBy: { displayOrder: "asc" },
    include: { services: true }
  });

  const withServices = employees.map((e) => ({
    ...e,
    serviceIds: e.services.map((l) => l.serviceId),
  }));

  return NextResponse.json({ employees: withServices });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Tylko właściciel może dodawać pracowników" }, { status: 403 });
  }

  const { firstName, lastName, bio, photoUrl, serviceIds } = await req.json();

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "Imię i nazwisko są wymagane" }, { status: 400 });
  }

  const maxOrderRec = await db.employee.aggregate({
    _max: { displayOrder: true }
  });
  const maxOrder = maxOrderRec._max.displayOrder ?? -1;

  const employee = await db.employee.create({
    data: {
      id: randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      photoUrl: photoUrl || null,
      bio: bio?.trim() || null,
      isActive: true,
      displayOrder: maxOrder + 1,
      services: Array.isArray(serviceIds) ? {
        create: serviceIds.map((sid: string) => ({
          serviceId: sid
        }))
      } : undefined
    }
  });

  return NextResponse.json({ success: true, id: employee.id });
}
