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

function metadataBase() {
  const fallback = new URL("http://localhost:3127");
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return fallback;

  try {
    const url = new URL(configured);
    return url.protocol === "https:" ||
      ["localhost", "127.0.0.1"].includes(url.hostname)
      ? url
      : fallback;
  } catch {
    return fallback;
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: {
    default: "6DNX — Softwares Incríveis, Seguros e Profissionais",
    template: "%s | 6DNX",
  },
  description:
    "Softwares utilitários premium para PC, checkout assistido e notícias oficiais de games e inteligência artificial.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "6DNX",
    title: "6DNX — Softwares Incríveis, Seguros e Profissionais",
    description:
      "Conheça o catálogo premium 6DNX, com soluções para diferentes jogos e atendimento direto pelo Discord.",
  },
  twitter: {
    card: "summary_large_image",
    title: "6DNX — Softwares Incríveis, Seguros e Profissionais",
    description:
      "Conheça o catálogo premium 6DNX, com soluções para diferentes jogos e atendimento direto pelo Discord.",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
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
