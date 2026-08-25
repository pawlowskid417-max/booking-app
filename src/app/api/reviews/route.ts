import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name, rating, content, _gotcha } = await req.json();

    if (_gotcha) {
      return NextResponse.json({ success: true });
    }

    if (!name || !rating || !content) {
      return NextResponse.json({ error: "Brakujące pola" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Ocena musi być między 1 a 5" }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        name: name.trim(),
        rating,
        content: content.trim(),
        approved: false, // Domyślnie wymaga moderacji
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
