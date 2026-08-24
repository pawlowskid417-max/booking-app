import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const serviceIdsParam = req.nextUrl.searchParams.get("serviceIds");

  let employees;

  if (serviceIdsParam) {
    const serviceIds = serviceIdsParam.split(",");
    
    // Używamy AND (every) by znaleźć pracownika, który ma wszystkie wybrane usługi
    employees = await db.employee.findMany({
      where: {
        isActive: true,
        AND: serviceIds.map(id => ({
          services: {
            some: { serviceId: id }
          }
        }))
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
