"use client";

import Link from "next/link";
import { DiscordMark } from "@/components/discord-mark";
import { HeroAuth } from "@/components/hero-auth";

const navigation = [
  { href: "#inicio", label: "Início" },
  { href: "#produtos", label: "Produtos" },
  { href: "/noticias", label: "Notícias" },
  { href: "/conta", label: "Minha conta" },
] as const;

export function SiteNavigation() {
  return (
    <header className="site-navigation-shell">
      <nav className="site-navigation" aria-label="Navegação principal">
        <a className="site-navigation__brand" href="#inicio" aria-label="6DNX — início">
          <span>6</span>
          <strong>6DNX</strong>
        </a>
        <div className="site-navigation__links">
          {navigation.map((item) =>
            item.href.startsWith("#") ? (
              <a key={item.href} href={item.href} className="site-navigation__link">
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="site-navigation__link">
                {item.label}
              </Link>
            ),
          )}
          <Link href="/slot" className="site-navigation__link">
            Slot <small>prévia</small>
          </Link>
          <a
            href="/api/redirect"
            className="site-navigation__link site-navigation__link--support"
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir o suporte 6DNX no Discord"
          >
            <DiscordMark className="site-navigation__support-icon" />
            Suporte
          </a>
        </div>
        <HeroAuth />
      </nav>
    </header>
  );
}
