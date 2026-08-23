import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" }
  });

  return NextResponse.json({ services });
}
