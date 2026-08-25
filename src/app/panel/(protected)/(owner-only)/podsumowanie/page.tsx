import { db } from "@/lib/db";
import { formatPrice } from "@/lib/types";
import PodsumowanieClient from "./PodsumowanieClient";

export const dynamic = "force-dynamic";

export default async function PodsumowaniePage() {
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);

  // Pobieramy równolegle dane do statystyk, dzisiejsze wizyty, oraz liczby pracowników i usług
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [appointmentsForSummary, todayAppointments, employeesCount, servicesCount] = await Promise.all([
    db.appointment.findMany({
      where: {
        status: { in: ["COMPLETED", "CONFIRMED"] },
        startAt: { gte: lastYear }
      },
      include: {
        services: { include: { service: true } },
        employee: true
      }
    }),
    db.appointment.findMany({
      where: {
        startAt: { gte: todayStart }
      },
      select: { 
        id: true, 
        startAt: true, 
        status: true, 
        clientFirstName: true, 
        clientLastName: true,
        employee: { select: { firstName: true } }
      },
      orderBy: { startAt: 'asc' }
    }),
    db.employee.count({ where: { isActive: true } }),
    db.service.count({ where: { isActive: true } })
  ]);

  // Obliczamy statystyki
  let completedEarningsCents = 0;
  let expectedEarningsCents = 0;
  let completedCount = 0;
  let upcomingCount = 0;

  const employeeStats: Record<string, { id: string, name: string, count: number, earningsCents: number }> = {};
  const serviceStats: Record<string, { id: string, name: string, count: number }> = {};

  for (const appt of appointmentsForSummary) {
    let apptCostCents = 0;
    for (const s of appt.services) {
      apptCostCents += s.service.priceCents;
      
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

  const topEmployees = Object.values(employeeStats).sort((a, b) => b.count - a.count);
  const topServices = Object.values(serviceStats).sort((a, b) => b.count - a.count);

  return (
    <main className="flex-1 bg-[var(--background)] pb-12">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-8">Podsumowanie i Statystyki</h1>

        {/* Kafelki z głównymi statystykami */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-1">Zarobki (zrealizowane)</h3>
            <p className="text-3xl font-bold text-[var(--accent-dark)]">{formatPrice(completedEarningsCents)}</p>
          </div>
          
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-1">Zarobki (oczekiwane)</h3>
            <p className="text-3xl font-bold text-[var(--foreground)] opacity-80">{formatPrice(expectedEarningsCents)}</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-1">Zrealizowane wizyty</h3>
            <p className="text-3xl font-bold text-[var(--foreground)]">{completedCount}</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[var(--muted)] mb-1">Nadchodzące wizyty</h3>
            <p className="text-3xl font-bold text-[var(--foreground)] opacity-80">{upcomingCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Top Pracownicy */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-xl mb-6 text-[var(--foreground)]">Najlepsi Pracownicy</h2>
            
            {topEmployees.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Brak danych do wyświetlenia.</p>
            ) : (
              <div className="space-y-4">
                {topEmployees.map((emp, idx) => (
                  <div key={emp.id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] text-[var(--accent-dark)] flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-[var(--foreground)]">{emp.name}</h4>
                        <p className="text-xs text-[var(--muted)]">Zrealizowanych wizyt: {emp.count}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--accent-dark)]">{formatPrice(emp.earningsCents)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Usługi */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-xl mb-6 text-[var(--foreground)]">Najpopularniejsze Usługi</h2>
            
            {topServices.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Brak danych do wyświetlenia.</p>
            ) : (
              <div className="space-y-4">
                {topServices.map((srv, idx) => (
                  <div key={srv.id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--cream)] text-[var(--muted)] flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <h4 className="font-medium text-[var(--foreground)]">{srv.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--foreground)]">{srv.count} razy</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live feed wizyt */}
        <PodsumowanieClient 
          // @ts-ignore
          initialAppointments={todayAppointments}
          employeesCount={employeesCount}
          servicesCount={servicesCount}
        />
      </div>
    </main>
  );
}
