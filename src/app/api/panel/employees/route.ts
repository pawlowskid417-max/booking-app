import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
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

  const { firstName, lastName, bio, photoUrl, serviceIds, email, password } = await req.json();

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Imię, nazwisko, email i hasło są wymagane" }, { status: 400 });
  }

  // Sprawdź czy użytkownik o tym emailu już istnieje
  const existingUser = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (existingUser) {
    return NextResponse.json({ error: "Konto z takim adresem email już istnieje" }, { status: 400 });
  }

  const maxOrderRec = await db.employee.aggregate({
    _max: { displayOrder: true }
  });
  const maxOrder = maxOrderRec._max.displayOrder ?? -1;

  const employeeId = randomUUID();
  const newUserId = randomUUID();

  // Create both in a transaction
  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: newUserId,
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        role: "EMPLOYEE",
      }
    });

    await tx.employee.create({
      data: {
        id: employeeId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        photoUrl: photoUrl || null,
        bio: bio?.trim() || null,
        isActive: true,
        displayOrder: maxOrder + 1,
        userId: newUserId,
        services: Array.isArray(serviceIds) ? {
          create: serviceIds.map((sid: string) => ({
            serviceId: sid
          }))
        } : undefined
      }
    });
  });

  return NextResponse.json({ success: true, id: employeeId });
}
