import type { Metadata } from "next";
import { Archivo_Black, Manrope } from "next/font/google";
import { officialSiteOrigin } from "@/lib/site-origin";
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
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SITE_URL) {
    return fallback;
  }

  try {
    return new URL(officialSiteOrigin());
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
    "Catálogo 6DNX com soluções para DayZ, FiveM, Rust, Valorant, CS2, Arena Breakout, HWID e suporte humano pelo Discord.",
  keywords: [
    "6DNX",
    "DayZ",
    "FiveM",
    "Rust",
    "Valorant",
    "Counter-Strike 2",
    "Arena Breakout",
    "HWID",
    "Spoofer",
    "software para jogos",
  ],
  category: "technology",
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
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "6DNX — catálogo premium e atendimento especializado",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "6DNX — Softwares Incríveis, Seguros e Profissionais",
    description:
      "Conheça o catálogo premium 6DNX, com soluções para diferentes jogos e atendimento direto pelo Discord.",
    images: ["/opengraph-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${archivoBlack.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full bg-bg text-ink antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "6DNX",
              url: "https://www.6dnx.com.br/",
              logo: "https://www.6dnx.com.br/icon.png",
              description:
                "Catálogo premium de soluções para jogos e atendimento especializado pelo Discord.",
            }).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
