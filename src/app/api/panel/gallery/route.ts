import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const images = await db.galleryImage.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ images });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Tylko właściciel może dodawać zdjęcia" }, { status: 403 });
  }

  const { url, alt } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL zdjęcia jest wymagany" }, { status: 400 });
  }

  const maxOrderRec = await db.galleryImage.aggregate({
    _max: { order: true }
  });
  const maxOrder = maxOrderRec._max.order ?? -1;

  const image = await db.galleryImage.create({
    data: {
      id: randomUUID(),
      url,
      alt: alt || "Portfolio",
      order: maxOrder + 1,
    }
  });

  return NextResponse.json({ success: true, image });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Tylko właściciel może zmieniać kolejność" }, { status: 403 });
  }

  const { images } = await req.json(); // Array of { id, order }
  if (!Array.isArray(images)) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  await db.$transaction(
    images.map((img: { id: string, order: number }) => 
      db.galleryImage.update({
        where: { id: img.id },
        data: { order: img.order }
      })
    )
  );

  return NextResponse.json({ success: true });
}
