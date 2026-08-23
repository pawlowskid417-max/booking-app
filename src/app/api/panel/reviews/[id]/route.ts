import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 403 });
  }

  const { id } = await params;
  const { approved } = await req.json();

  try {
    const review = await db.review.update({
      where: { id },
      data: { approved },
    });
    return NextResponse.json({ success: true, review });
  } catch (e) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await db.review.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
