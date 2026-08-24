"use client";

import { useState } from "react";
import useSWR from "swr";
import PanelNav from "@/components/PanelNav";
import ImageUpload from "@/components/ImageUpload";
import PanelLoading from "@/components/PanelLoading";
import Image from "next/image";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  order: number;
}

export default function GaleriaPage() {
  const { data, isLoading: loading, mutate } = useSWR<{ images: GalleryImage[] }>("/api/panel/gallery");
  const images = data?.images ?? [];

  const [uploadingUrl, setUploadingUrl] = useState("");
  const [altText, setAltText] = useState("");

  async function addImage() {
    if (!uploadingUrl) return;
    
    await fetch("/api/panel/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: uploadingUrl, alt: altText }),
    });
    
    setUploadingUrl("");
    setAltText("");
    mutate();
  }

  async function deleteImage(id: string) {
    if (!confirm("Na pewno usunąć to zdjęcie?")) return;
    await fetch(`/api/panel/gallery/${id}`, { method: "DELETE" });
    mutate();
  }

  async function moveUp(index: number) {
    if (index === 0) return;
    const newImages = [...images];
    const temp = newImages[index - 1].order;
    newImages[index - 1].order = newImages[index].order;
    newImages[index].order = temp;
    
    // Update backend and mutate SWR cache optimally
    newImages.sort((a, b) => a.order - b.order);
    
    await fetch("/api/panel/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: newImages.map(img => ({ id: img.id, order: img.order })) }),
    });
    mutate();
  }

  async function moveDown(index: number) {
    if (index === images.length - 1) return;
    const newImages = [...images];
    const temp = newImages[index + 1].order;
    newImages[index + 1].order = newImages[index].order;
    newImages[index].order = temp;
    
    // Update backend and mutate SWR cache optimally
    newImages.sort((a, b) => a.order - b.order);
    
    await fetch("/api/panel/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: newImages.map(img => ({ id: img.id, order: img.order })) }),
    });
    mutate();
  }

  return (
    <main className="flex-1 bg-[var(--background)]">
      
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <h1 className="font-display text-2xl text-[var(--accent-dark)] mb-6 text-center md:text-left">Galeria</h1>

        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-5 mb-8">
          <h2 className="font-medium mb-4">Dodaj zdjęcie do galerii</h2>
          <div className="space-y-4">
            <ImageUpload
              label="Wgraj nowe zdjęcie"
              value={uploadingUrl}
              onChange={setUploadingUrl}
              aspectRatio="square"
            />
            {uploadingUrl && (
              <>
                <label className="block">
                  <span className="text-sm font-medium">Tekst alternatywny (SEO/Dostępność)</span>
                  <input 
                    value={altText} 
                    onChange={e => setAltText(e.target.value)} 
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-2 mt-2" 
                    placeholder="np. Czerwony manicure hybrydowy"
                  />
                </label>
                <button
                  onClick={addImage}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white text-sm font-medium px-5 py-2.5 rounded-full"
                >
                  Zapisz zdjęcie w portfolio
                </button>
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-medium mb-4">Twoje portfolio ({images.length})</h2>
          
          {loading && <PanelLoading />}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img, index) => (
              <div key={img.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
                <div className="relative aspect-[4/5] bg-[var(--accent-light)]">
                  <Image src={img.url} alt={img.alt} fill className="object-cover" />
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="w-8 h-8 flex items-center justify-center border border-[var(--border)] rounded hover:border-[var(--accent)] disabled:opacity-30">↑</button>
                    <button onClick={() => moveDown(index)} disabled={index === images.length - 1} className="w-8 h-8 flex items-center justify-center border border-[var(--border)] rounded hover:border-[var(--accent)] disabled:opacity-30">↓</button>
                  </div>
                  <button onClick={() => deleteImage(img.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
