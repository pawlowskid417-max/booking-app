import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice, formatDurationMin } from "@/lib/types";
import AnimatedSection from "@/components/AnimatedSection";
import CircularGalleryClientSection from "@/components/CircularGalleryClientSection";
import GalleryClientSection from "@/components/GalleryClientSection";
import PixelBlast from "@/components/PixelBlast";
import ReviewsClientSection from "@/components/ReviewsClientSection";

export const revalidate = 60; // Odświeżaj stronę w tle co maksymalnie 60 sekund (ISR)

export default async function HomePage() {
  const [services, employees, settings, galleryImages, reviews] = await Promise.all([
    db.service.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    db.employee.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    db.bookingSettings.findUnique({
      where: { id: "singleton" },
    }),
    db.galleryImage.findMany({
      orderBy: { order: "asc" }
    }),
    db.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 6
    })
  ]);

  if (!settings) return null;

  return (
    <main className="flex-1">
      {/* NAVBAR */}
      <header className="fixed w-full top-6 left-1/2 -translate-x-1/2 z-50 px-4 max-w-5xl">
        <div className="bg-[#1a1a1a]/70 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
          <span className="font-display text-xl text-white font-medium tracking-wide">
            {settings.salonName}
          </span>
          <Link
            href="/rezerwacja"
            className="bg-white hover:bg-gray-200 text-black text-sm font-semibold px-6 py-2.5 rounded-full transition-colors shadow-sm"
          >
            Zarezerwuj wizytę
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-[var(--hero-bg)] overflow-hidden min-h-[100svh] flex items-center justify-center">
        {settings.heroImageUrl && (
          <div className="absolute inset-0 z-0">
            <Image 
              src={settings.heroImageUrl} 
              alt="Salon Hero" 
              fill 
              className="object-cover opacity-80 mix-blend-overlay"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent" />
          </div>
        )}

        <div className="absolute inset-0 z-0 pointer-events-none opacity-80">
          <PixelBlast
            variant="diamond"
            pixelSize={7}
            color="#E3BFC4"
            patternScale={7.5}
            patternDensity={1.25}
            enableRipples={false}
            rippleSpeed={0.3}
            rippleThickness={0.1}
            rippleIntensityScale={1}
            speed={1.05}
            transparent
            edgeFade={0.28}
            className=""
            style={{}}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center w-full">
          <AnimatedSection>
            <h1 className="font-display text-5xl md:text-6xl mb-6 tracking-tight leading-tight max-w-3xl mx-auto bg-gradient-to-br from-white via-white/90 to-white/30 bg-clip-text text-transparent drop-shadow-md">
              Piękne paznokcie zaczynają się tutaj
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2}>
            <p className="text-zinc-300 text-lg max-w-xl mx-auto mb-10">
              Umów wizytę online w kilka kliknięć — wybierz usługę, osobę i dogodny
              termin. Bez telefonowania, bez czekania.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={0.4}>
            <Link
              href="/rezerwacja"
              className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white font-medium px-8 py-4 rounded-full transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-0.5 duration-300"
            >
              Sprawdź wolne terminy
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* USŁUGI */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <AnimatedSection>
          <h2 className="font-display text-3xl text-[var(--foreground)] mb-10 text-center">
            Nasze usługi
          </h2>
        </AnimatedSection>
        
        <div className="grid sm:grid-cols-2 gap-5">
          {services.map((s, i) => (
            <AnimatedSection key={s.id} delay={i * 0.1}>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 flex flex-col h-full hover:border-[var(--accent)] transition-colors duration-300">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-lg text-[var(--foreground)]">{s.name}</h3>
                  <span className="text-[var(--foreground)] font-display font-medium text-lg whitespace-nowrap">
                    {formatPrice(s.priceCents)}
                  </span>
                </div>
                {s.description && (
                  <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">{s.description}</p>
                )}
                <div className="mt-auto pt-4">
                  <span className="text-xs text-[var(--muted)] bg-[var(--accent-light)] px-3 py-1.5 rounded-full inline-block">
                    ⏱ {formatDurationMin(s.durationMin)}
                  </span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ZESPÓŁ */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <AnimatedSection>
            <h2 className="font-display text-3xl text-[var(--foreground)] mb-10 text-center">
              Poznaj nasz zespół
            </h2>
          </AnimatedSection>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {employees.map((e, i) => (
              <AnimatedSection key={e.id} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center group cursor-default">
                  <div className="w-32 h-32 mb-4 rounded-full overflow-hidden bg-[var(--accent-light)] border-4 border-[var(--background)] shadow-lg group-hover:scale-105 transition-transform duration-500 relative">
                    {e.photoUrl ? (
                      <Image src={e.photoUrl} alt={`${e.firstName} ${e.lastName}`} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--accent-dark)] font-display text-4xl">
                        {e.firstName[0]}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-xl text-[var(--foreground)]">
                    {e.firstName} {e.lastName}
                  </h3>
                  {e.bio && <p className="text-sm text-[var(--muted)] mt-2">{e.bio}</p>}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* GALERIA - 3D */}
      {galleryImages.length > 0 && (
        <CircularGalleryClientSection images={galleryImages} />
      )}

      {/* GALERIA - KAFELKI */}
      {galleryImages.length > 0 && (
        <GalleryClientSection images={galleryImages} />
      )}

      {/* OPINIE */}
      <ReviewsClientSection reviews={reviews} />

      {/* CTA + STOPKA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <AnimatedSection>
          <h2 className="font-display text-3xl md:text-4xl text-[var(--foreground)] mb-6">
            Gotowa na piękne paznokcie?
          </h2>
          <p className="text-[var(--muted)] text-lg mb-10 max-w-md mx-auto">
            Wybierz usługę i znajdź dogodny termin w naszym kalendarzu online. To zajmie tylko chwilę.
          </p>
          <Link
            href="/rezerwacja"
            className="inline-block bg-[var(--foreground)] hover:bg-[var(--accent-dark)] text-white font-medium px-10 py-4 rounded-full transition-colors shadow-lg hover:-translate-y-0.5 duration-300"
          >
            Zarezerwuj wizytę
          </Link>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="mt-20 pt-10 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-[var(--muted)] text-left">
            <div>
              <h4 className="font-display text-lg text-[var(--foreground)] mb-3">Kontakt</h4>
              <p className="mb-1">{settings.salonAddress}</p>
              <p className="mb-1">Tel: {settings.salonPhone}</p>
              <p>{settings.contactEmail}</p>
              {settings.mapUrl && (
                <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-[var(--accent-dark)] hover:underline font-medium">
                  Wyznacz trasę →
                </a>
              )}
            </div>
            
            <div>
              <h4 className="font-display text-lg text-[var(--foreground)] mb-3">Godziny otwarcia</h4>
              {settings.openingHours ? (
                <div className="whitespace-pre-line leading-relaxed">
                  {settings.openingHours}
                </div>
              ) : (
                <p>Pon - Pt: 9:00 - 18:00<br/>Sobota: 9:00 - 14:00</p>
              )}
            </div>

            <div>
              <h4 className="font-display text-lg text-[var(--foreground)] mb-3">Śledź nas</h4>
              {settings.instagramUrl ? (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-[var(--foreground)] hover:text-[var(--accent-dark)] transition-colors">
                  Instagram
                </a>
              ) : (
                <p>Brak podanego linku.</p>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* PRZYKŁADOWA MAPA */}
        <AnimatedSection delay={0.4}>
          <div className="mt-16 w-full rounded-2xl overflow-hidden shadow-sm border border-[var(--border)] h-[300px] md:h-[400px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d156388.35438505525!2d20.896128698506822!3d52.23306532087541!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ecc669a869f01%3A0x72f0be2a88ead3fc!2sWarszawa!5e0!3m2!1spl!2spl!4v1700000000000!5m2!1spl!2spl" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </AnimatedSection>
      </section>
    </main>
  );
}
