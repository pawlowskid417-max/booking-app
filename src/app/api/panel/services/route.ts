import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const services = await db.service.findMany({
    orderBy: { displayOrder: 'asc' }
  });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Tylko właściciel może dodawać usługi" }, { status: 403 });
  }

  const { name, description, durationMin, priceCents } = await req.json();

  if (!name?.trim() || !durationMin || !priceCents) {
    return NextResponse.json(
      { error: "Nazwa, czas trwania i cena są wymagane" },
      { status: 400 }
    );
  }

  const maxOrderRec = await db.service.aggregate({
    _max: { displayOrder: true }
  });
  const maxOrder = maxOrderRec._max.displayOrder ?? -1;

  const service = await db.service.create({
    data: {
      id: randomUUID(),
      name: name.trim(),
      description: description?.trim() || null,
      durationMin,
      priceCents,
      isActive: true,
      displayOrder: maxOrder + 1
    }
  });

  return NextResponse.json({ success: true, id: service.id });
}
