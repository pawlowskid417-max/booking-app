"use client";

import dynamic from "next/dynamic";
import type { GalleryImage } from "@prisma/client";
import AnimatedSection from "./AnimatedSection";

const CircularGallery = dynamic(
  () => import("@/components/CircularGallery"),
  { ssr: false }
);

export default function CircularGalleryClientSection({ images }: { images: GalleryImage[] }) {
  if (!images || images.length === 0) return null;

  const items = images.map((img) => ({
    image: img.url,
    text: "Realizacja", // Zastąpienie alt tekstem na obręczy galerii
  }));

  return (
    <section className="snap-start w-full flex flex-col justify-center bg-[var(--surface)] overflow-hidden relative py-24 border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto w-full px-6 mb-12">
        <AnimatedSection>
          <h2 className="font-display text-4xl text-center text-[var(--foreground)]">Nasze realizacje</h2>
          <p className="text-center text-[var(--muted)] mt-4">Zapraszamy do obejrzenia naszych prac</p>
        </AnimatedSection>
      </div>
      <div style={{ height: "600px", position: "relative" }} className="w-full max-w-[100vw] overflow-hidden pointer-events-none">
        <CircularGallery
          items={items}
          bend={3}
          textColor="#C48F96"
          borderRadius={0.05}
        />
      </div>
    </section>
  );
}
