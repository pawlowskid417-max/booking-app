import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth || auth.role !== "OWNER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 401 });
    }

    const categories = await db.serviceCategory.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth || auth.role !== "OWNER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Nazwa jest wymagana" }, { status: 400 });
    }

    const name = body.name.trim();
    if (name.length === 0) {
      return NextResponse.json({ error: "Nazwa nie może być pusta" }, { status: 400 });
    }

    const category = await db.serviceCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth || auth.role !== "OWNER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 401 });
    }

    const url = new URL(req.url);
    const name = url.searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "Brak nazwy" }, { status: 400 });
    }

    await db.serviceCategory.delete({
      where: { name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
