import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice, formatDurationMin } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  const employees = await db.employee.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  const settings = await db.bookingSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) return null;

  return (
    <main className="flex-1">
      {/* NAVBAR */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-xl text-[var(--accent-dark)]">
            {settings.salonName}
          </span>
          <Link
            href="/rezerwacja"
            className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            Zarezerwuj wizytę
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-[var(--accent-light)]">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-[var(--accent-dark)] mb-4">
            Piękne paznokcie zaczynają się tutaj
          </h1>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto mb-8">
            Umów wizytę online w kilka kliknięć — wybierz usługę, osobę i dogodny
            termin. Bez telefonowania, bez czekania.
          </p>
          <Link
            href="/rezerwacja"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white font-medium px-8 py-3.5 rounded-full transition-colors"
          >
            Sprawdź wolne terminy
          </Link>
        </div>
      </section>

      {/* USŁUGI */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl text-[var(--accent-dark)] mb-8 text-center">
          Nasze usługi
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-lg">{s.name}</h3>
                <span className="text-[var(--accent-dark)] font-semibold whitespace-nowrap">
                  {formatPrice(s.priceCents)}
                </span>
              </div>
              {s.description && (
                <p className="text-sm text-[var(--muted)] mt-1">{s.description}</p>
              )}
              <span className="text-xs text-[var(--muted)] mt-3">
                Czas trwania: {formatDurationMin(s.durationMin)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ZESPÓŁ */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="font-display text-2xl text-[var(--accent-dark)] mb-8 text-center">
            Nasz zespół
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {employees.map((e) => (
              <div
                key={e.id}
                className="flex gap-4 items-start bg-[var(--background)] border border-[var(--border)] rounded-2xl p-5"
              >
                <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent-dark)] font-display text-xl shrink-0">
                  {e.firstName[0]}
                  {e.lastName[0]}
                </div>
                <div>
                  <h3 className="font-medium">
                    {e.firstName} {e.lastName}
                  </h3>
                  {e.bio && <p className="text-sm text-[var(--muted)] mt-1">{e.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + KONTAKT */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="font-display text-2xl text-[var(--accent-dark)] mb-4">
          Gotowa na wizytę?
        </h2>
        <p className="text-[var(--muted)] mb-8">
          Rezerwacja zajmuje mniej niż minutę.
        </p>
        <Link
          href="/rezerwacja"
          className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white font-medium px-8 py-3.5 rounded-full transition-colors"
        >
          Zarezerwuj wizytę
        </Link>

        <div className="mt-14 pt-8 border-t border-[var(--border)] text-sm text-[var(--muted)] space-y-1">
          {settings.salonAddress && <p>{settings.salonAddress}</p>}
          {settings.salonPhone && <p>Tel. {settings.salonPhone}</p>}
          {settings.contactEmail && <p>{settings.contactEmail}</p>}
        </div>
      </section>
    </main>
  );
}
