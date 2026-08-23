"use client";

import { useState, useRef } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass = 
    aspectRatio === "video" ? "aspect-video" : 
    aspectRatio === "square" ? "aspect-square" : 
    "aspect-[4/5]";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      onChange(newBlob.url);
    } catch (err: any) {
      setError(err.message || "Błąd wgrywania");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="mb-6">
      <span className="text-sm font-medium block mb-2">{label}</span>
      
      <div className={`relative bg-[var(--accent-light)] border border-dashed border-[var(--border)] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-[var(--muted)] hover:border-[var(--accent)] transition-colors cursor-pointer ${aspectClass}`} onClick={() => fileInputRef.current?.click()}>
        {value ? (
          <Image src={value} alt="Preview" fill className="object-cover" />
        ) : (
          <span className="text-sm">{uploading ? "Wgrywanie..." : "Kliknij, aby wgrać zdjęcie (bez limitu rozmiaru)"}</span>
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
