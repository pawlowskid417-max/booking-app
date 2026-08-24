import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";

export default function BookingPage() {
  return (
    <main className="flex-1 bg-[var(--background)]">
      <header className="fixed w-full top-0 left-0 z-50 border-b border-[var(--border)]/30 bg-[var(--surface)]/40 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-[var(--accent-dark)]">
            ← Strona główna
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-10">
        <h1 className="font-display text-3xl text-[var(--accent-dark)] mb-2 text-center">
          Zarezerwuj wizytę
        </h1>
        <p className="text-[var(--muted)] text-center mb-10">
          Wybierz usługę, osobę i dogodny termin.
        </p>
        <BookingWizard />
      </div>
    </main>
  );
}
