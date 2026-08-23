import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://booking-app-one-kappa.vercel.app'),
  title: "Studio Paznokci Bella — Rezerwacja online",
  description: "Umów wizytę na manicure, pedicure i stylizację paznokci online w kilka kliknięć.",
  openGraph: {
    title: "Studio Paznokci Bella — Rezerwacja online",
    description: "Umów wizytę na manicure, pedicure i stylizację paznokci online w kilka kliknięć.",
    url: "https://studiobella.pl",
    siteName: "Studio Bella",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Paznokci Bella",
    description: "Umów wizytę na manicure, pedicure i stylizację paznokci online w kilka kliknięć.",
  },
};

import { Playfair_Display, Inter } from "next/font/google";
import { db } from "@/lib/db";

const heading = Playfair_Display({ subsets: ["latin-ext"], variable: "--font-heading", display: "swap" });
const body = Inter({ subsets: ["latin-ext"], variable: "--font-body", display: "swap" });

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await db.bookingSettings.findUnique({ where: { id: "singleton" } });
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": settings?.salonName || "Salon Paznokci",
    "telephone": settings?.salonPhone || "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": settings?.salonAddress || "",
      "addressLocality": "Polska"
    },
    ...(settings?.openingHours ? { "openingHoursSpecification": settings.openingHours } : {}),
    ...(settings?.instagramUrl ? { "sameAs": [settings.instagramUrl] } : {})
  };

  return (
    <html
      lang="pl"
      className={`h-full antialiased ${heading.variable} ${body.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
