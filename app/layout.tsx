import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KleineKoning - Tijdregistratie",
  description: "Tijdregistratie en urenstaat export",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}

