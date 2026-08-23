import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";

export default function BookingPage() {
  return (
    <main className="flex-1 bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-[var(--accent-dark)]">
            ← Strona główna
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
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
