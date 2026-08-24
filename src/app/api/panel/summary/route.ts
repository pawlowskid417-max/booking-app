import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 401 });
    }

    // Pobierz wizyty ze statusem COMPLETED (zrealizowane) lub CONFIRMED (nadchodzące)
    const appointments = await db.appointment.findMany({
      where: {
        status: { in: ["COMPLETED", "CONFIRMED"] }
      },
      include: {
        services: { include: { service: true } },
        employee: true
      }
    });

    let completedEarningsCents = 0;
    let expectedEarningsCents = 0;
    let completedCount = 0;
    let upcomingCount = 0;

    const employeeStats: Record<string, { id: string, name: string, count: number, earningsCents: number }> = {};
    const serviceStats: Record<string, { id: string, name: string, count: number }> = {};

    for (const appt of appointments) {
      // Obliczanie całkowitego kosztu wizyty
      let apptCostCents = 0;
      for (const s of appt.services) {
        apptCostCents += s.service.priceCents;
        
        // Zliczanie popularności usług
        if (appt.status === "COMPLETED") {
          if (!serviceStats[s.serviceId]) {
            serviceStats[s.serviceId] = { id: s.serviceId, name: s.service.name, count: 0 };
          }
          serviceStats[s.serviceId].count += 1;
        }
      }

      if (appt.status === "COMPLETED") {
        completedEarningsCents += apptCostCents;
        completedCount += 1;

        // Statystyki pracowników (zrealizowane)
        if (!employeeStats[appt.employeeId]) {
          employeeStats[appt.employeeId] = { 
            id: appt.employeeId, 
            name: `${appt.employee.firstName} ${appt.employee.lastName}`, 
            count: 0, 
            earningsCents: 0 
          };
        }
        employeeStats[appt.employeeId].count += 1;
        employeeStats[appt.employeeId].earningsCents += apptCostCents;
      } else if (appt.status === "CONFIRMED") {
        expectedEarningsCents += apptCostCents;
        upcomingCount += 1;
      }
    }

    // Sortuj rankingi
    const topEmployees = Object.values(employeeStats).sort((a, b) => b.count - a.count);
    const topServices = Object.values(serviceStats).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      summary: {
        completedEarningsCents,
        expectedEarningsCents,
        completedCount,
        upcomingCount,
        topEmployees,
        topServices
      }
    });

  } catch (error) {
    console.error("Błąd pobierania podsumowania:", error);
    return NextResponse.json({ error: "Błąd pobierania podsumowania" }, { status: 500 });
  }
}
