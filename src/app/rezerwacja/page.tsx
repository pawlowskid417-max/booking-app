import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";

export default function BookingPage() {
  return (
    <main className="flex-1 bg-[var(--background)]">
      <header className="fixed w-full top-6 left-1/2 -translate-x-1/2 z-50 px-4 max-w-3xl">
        <div className="bg-[#1a1a1a]/70 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
          <Link href="/" className="font-display text-xl text-white tracking-wide">
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
