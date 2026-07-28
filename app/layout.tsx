import type { Metadata } from "next";
import { Archivo_Black, Manrope } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3127",
  ),
  title: {
    default: "6DNX — Softwares Incríveis, Seguros e Profissionais",
    template: "%s | 6DNX",
  },
  description:
    "Softwares utilitários premium para PC, checkout assistido e notícias oficiais de games e inteligência artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${archivoBlack.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
