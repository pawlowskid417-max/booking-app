import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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

const heading = Playfair_Display({ subsets: ["latin-ext"], variable: "--font-heading", display: "swap" });
const body = Inter({ subsets: ["latin-ext"], variable: "--font-body", display: "swap" });

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`h-full antialiased ${heading.variable} ${body.variable}`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
