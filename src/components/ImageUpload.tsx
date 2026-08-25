"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";

interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string) => void;
  aspectRatio?: "video" | "square" | "portrait";
}

export default function ImageUpload({ label, value, onChange, aspectRatio = "video" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zabezpieczenie przed wyjściem ze strony podczas wgrywania
  useEffect(() => {
    if (uploading) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Trwa wgrywanie zdjęcia. Czy na pewno chcesz opuścić stronę?";
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [uploading]);

  const aspectClass = 
    aspectRatio === "video" ? "aspect-video" : 
    aspectRatio === "square" ? "aspect-square" : 
    "aspect-[4/5]";

  async function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) return resolve(file);
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          "image/webp",
          quality
        );
      };
      
      img.onerror = () => reject(new Error("Nie można przetworzyć zdjęcia"));
      img.src = url;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const compressedFile = await compressImage(file, 2000, 0.85);
      
      const newBlob = await upload(compressedFile.name, compressedFile, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: (progressEvent) => {
          setProgress(Math.round(progressEvent.percentage));
        }
      });

      onChange(newBlob.url);
    } catch (err: any) {
      setError(err.message || "Błąd wgrywania");
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="mb-6">
      <span className="text-sm font-medium block mb-2">{label}</span>
      
      <div 
        className={`relative bg-[var(--accent-light)] border border-dashed border-[var(--border)] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-[var(--muted)] hover:border-[var(--accent)] transition-colors cursor-pointer ${aspectClass} ${uploading ? 'pointer-events-none opacity-80' : ''}`} 
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {value && !uploading ? (
          <Image src={value} alt="Preview" fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {uploading ? (
              <>
                <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-sm font-medium text-[var(--accent-dark)]">
                  Wgrywanie... {progress !== null ? `${progress}%` : ''}
                </span>
                <span className="text-xs mt-1 text-[var(--muted)]">Proszę czekać, nie zamykaj okna</span>
              </>
            ) : (
              <span className="text-xs md:text-sm px-2">Kliknij, aby wgrać zdjęcie (maks. 8MB)</span>
            )}
          </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {value && (
        <button 
          onClick={() => onChange("")} 
          className="text-xs text-red-500 hover:underline mt-2 inline-block"
        >
          Usuń zdjęcie
        </button>
      )}
    </div>
  );
}
