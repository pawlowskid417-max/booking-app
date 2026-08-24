import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice, formatDurationMin } from "@/lib/types";
import AnimatedSection from "@/components/AnimatedSection";
import CircularGalleryClientSection from "@/components/CircularGalleryClientSection";
import PixelBlast from "@/components/PixelBlast";
import ReviewsClientSection from "@/components/ReviewsClientSection";
import ServicesTabsClient from "@/components/ServicesTabsClient";

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
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between">
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
      <section className="snap-start relative bg-[var(--hero-bg)] overflow-hidden min-h-[100svh] flex items-center justify-center">
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

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center w-full">
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 md:p-14 shadow-2xl">
            <AnimatedSection>
              <h1 className="font-display text-5xl md:text-6xl mb-6 tracking-tight leading-tight max-w-3xl mx-auto bg-gradient-to-br from-white via-white/90 to-white/30 bg-clip-text text-transparent drop-shadow-md">
                Piękne paznokcie zaczynają się tutaj
              </h1>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <p className="text-zinc-200 text-lg max-w-xl mx-auto mb-10">
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
        </div>
      </section>

      {/* USŁUGI */}
      <section className="snap-start min-h-[100svh] w-full flex flex-col justify-center max-w-5xl mx-auto px-6 py-20 relative">
        <AnimatedSection>
          <h2 className="font-display text-4xl text-[var(--foreground)] mb-12 text-center">
            Nasze usługi
          </h2>
        </AnimatedSection>
        
        <ServicesTabsClient services={services} />
      </section>

      {/* ZESPÓŁ */}
      <section className="snap-start min-h-[100svh] w-full flex flex-col justify-center bg-[var(--surface)] border-y border-[var(--border)] relative">
        <div className="max-w-5xl mx-auto px-6 py-20 w-full">
          <AnimatedSection>
            <h2 className="font-display text-4xl text-[var(--foreground)] mb-4 text-center">
              Poznaj nasz zespół
            </h2>
            <p className="text-center text-[var(--muted)] mb-16 max-w-2xl mx-auto">
              Oddaj się w ręce naszych wykwalifikowanych specjalistek, dla których praca to prawdziwa pasja.
            </p>
          </AnimatedSection>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
            {employees.map((e, i) => (
              <AnimatedSection key={e.id} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center group cursor-default bg-white/50 backdrop-blur-sm border border-[var(--border)] rounded-3xl p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full">
                  <div className="w-40 h-40 mb-6 rounded-full overflow-hidden bg-[var(--accent-light)] border-4 border-white shadow-md group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500 relative">
                    {e.photoUrl ? (
                      <Image src={e.photoUrl} alt={`${e.firstName} ${e.lastName}`} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--accent-dark)] font-display text-5xl">
                        {e.firstName[0]}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-2xl text-[var(--foreground)] font-semibold">
                    {e.firstName} {e.lastName}
                  </h3>
                  <div className="w-12 h-0.5 bg-[var(--accent)] my-4 opacity-50 rounded-full"></div>
                  {e.bio ? (
                    <p className="text-sm text-[var(--muted)] leading-relaxed">{e.bio}</p>
                  ) : (
                    <p className="text-sm text-[var(--muted)] leading-relaxed">Specjalistka ds. stylizacji paznokci, służąca profesjonalną poradą.</p>
                  )}
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

      {/* OPINIE */}
      <ReviewsClientSection reviews={reviews} />

      {/* STOPKA */}
      <section className="snap-end w-full max-w-5xl mx-auto px-6 pb-12 pt-24 text-center">
        <AnimatedSection delay={0.2}>
          <div className="border-t border-[var(--border)] pt-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-[var(--muted)] text-left items-start">
            <div>
              <h4 className="font-display text-lg text-[var(--foreground)] mb-3">Kontakt</h4>
              <p className="mb-1">{settings.salonAddress || "Brak adresu"}</p>
              <p className="mb-1">Tel: {settings.salonPhone || "Brak telefonu"}</p>
              <p>{settings.contactEmail || "Brak e-maila"}</p>
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
              <div className="flex gap-4 items-center mt-4">
                {settings.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Instagram">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17.5 6.5H17.51" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <defs>
                        <linearGradient id="ig-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#f09433" />
                          <stop offset="0.25" stopColor="#e6683c" />
                          <stop offset="0.5" stopColor="#dc2743" />
                          <stop offset="0.75" stopColor="#cc2366" />
                          <stop offset="1" stopColor="#bc1888" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </a>
                )}
                {settings.facebookUrl && (
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Facebook">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#1877F2"/>
                      <path d="M14 9.3h-1.6c-1 0-1.2.5-1.2 1.2v1.5h2.7l-.4 2.8h-2.3v7.2h-3v-7.2H6.4V12h1.8v-2c0-1.8 1.1-2.8 2.7-2.8 1.1 0 2.1.2 2.1.2v2h-1z" fill="white"/>
                    </svg>
                  </a>
                )}
                {!settings.instagramUrl && !settings.facebookUrl && (
                  <p>Brak podanych linków.</p>
                )}
              </div>
            </div>

            {/* MAPA */}
            {settings.mapIframeUrl ? (
              <div className="w-full h-[200px] md:h-full min-h-[150px] rounded-xl overflow-hidden shadow-sm border border-[var(--border)]">
                <iframe 
                  src={settings.mapIframeUrl} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            ) : (
              <div className="w-full h-[200px] md:h-full min-h-[150px] rounded-xl overflow-hidden shadow-sm border border-[var(--border)] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                Brak mapy
              </div>
            )}
          </div>
        </AnimatedSection>
      </section>
    </main>
  );
}
