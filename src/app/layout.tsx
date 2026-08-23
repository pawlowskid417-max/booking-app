import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Paznokci Bella — Rezerwacja online",
  description: "Umów wizytę na manicure, pedicure i stylizację paznokci online w kilka kliknięć.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className="h-full antialiased"
      style={
        {
          "--font-display": "Georgia, 'Times New Roman', serif",
          "--font-body":
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
