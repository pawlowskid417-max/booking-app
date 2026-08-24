import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const serviceId = req.nextUrl.searchParams.get("serviceId");

  let employees;

  if (serviceId) {
    employees = await db.employee.findMany({
      where: {
        isActive: true,
        services: {
          some: { serviceId }
        }
      },
      orderBy: { displayOrder: "asc" }
    });
  } else {
    employees = await db.employee.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" }
    });
  }

  return NextResponse.json({ employees });
}
