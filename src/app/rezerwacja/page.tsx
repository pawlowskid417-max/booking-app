import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const services = await db.service.findMany({
    where: { isActive: true },
  });

  return (
    <main className="flex-1 bg-[var(--background)] h-[100dvh] overflow-hidden flex flex-col">
      <header className="fixed w-full top-6 left-1/2 -translate-x-1/2 z-50 px-4 max-w-3xl">
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-white tracking-wide">
            ← Strona główna
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-32 pb-4 flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 text-center mb-6">
          <h1 className="font-display text-2xl sm:text-3xl text-[var(--accent-dark)] mb-1">
            Zarezerwuj wizytę
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base">
            Wybierz usługi, osobę i dogodny termin.
          </p>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 pb-4">
          <BookingWizard initialServices={services} />
        </div>
      </div>
    </main>
  );
}
