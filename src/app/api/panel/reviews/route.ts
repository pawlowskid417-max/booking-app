import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 403 });
  }

  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}
