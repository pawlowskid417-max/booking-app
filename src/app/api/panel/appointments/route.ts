import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const requestedEmployeeId = req.nextUrl.searchParams.get("employeeId");
  const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0", 10);
  const take = parseInt(req.nextUrl.searchParams.get("take") || "50", 10);

  const where: any = {};

  if (user.role !== "OWNER") {
    if (!user.employeeId) {
      return NextResponse.json({ appointments: [], nextSkip: null });
    }
    where.employeeId = user.employeeId;
  } else if (requestedEmployeeId) {
    where.employeeId = requestedEmployeeId;
  }

  where.startAt = {};
  if (from) {
    where.startAt.gte = new Date(`${from}T00:00:00.000Z`);
  } else {
    // Domyślny limit to 90 dni dla przeszłych (od dzisiaj minus 90 dni)
    // UWAGA: zapytania bez "from" (np. przeszłe na dashboardzie) zostaną obcięte do ostatnich 3 miesięcy.
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    where.startAt.gte = ninetyDaysAgo;
  }
  
  if (to) {
    where.startAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const appointments = await db.appointment.findMany({
    where,
    skip,
    take,
    include: {
      employee: true,
      services: {
        include: { service: true }
      }
    },
    orderBy: { startAt: 'desc' }
  });

  const mapped = appointments.map(a => {
    const totalDuration = a.services.reduce((sum, s) => sum + s.service.durationMin, 0);
    const totalPrice = a.services.reduce((sum, s) => sum + s.service.priceCents, 0);
    const serviceNames = a.services.map(s => s.service.name).join(" + ");
    
    return {
      ...a,
      employeeFirstName: a.employee.firstName,
      employeeLastName: a.employee.lastName,
      serviceName: serviceNames,
      serviceDurationMin: totalDuration,
      servicePriceCents: totalPrice,
    };
  });

  const nextSkip = appointments.length === take ? skip + take : null;

  return NextResponse.json({ appointments: mapped, nextSkip });
}
