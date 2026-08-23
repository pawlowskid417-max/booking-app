"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { motion } from "motion/react";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

interface GallerySectionProps {
  images: GalleryImage[];
}

export default function GalleryClientSection({ images }: GallerySectionProps) {
  const [index, setIndex] = useState(-1);

  if (!images || images.length === 0) return null;

  return (
    <>
      <section className="max-w-5xl mx-auto px-6 py-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-2xl text-[var(--accent-dark)] mb-8 text-center"
        >
          Nasze realizacje
        </motion.h2>
        
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative rounded-2xl overflow-hidden cursor-pointer break-inside-avoid"
              onClick={() => setIndex(i)}
            >
              <Image 
                src={img.url} 
                alt={img.alt || "Realizacja"} 
                width={400} 
                height={500} 
                className="w-full h-auto object-cover" 
              />
            </motion.div>
          ))}
        </div>
      </section>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={images.map((img) => ({ src: img.url, alt: img.alt }))}
      />
    </>
  );
}
