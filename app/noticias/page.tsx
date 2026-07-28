import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLatestNews } from "@/lib/news/repository";
import { categoryLabels } from "@/lib/news/types";

export const metadata: Metadata = {
  title: "Radar 6DNX — Notícias de games e IA",
  description:
    "Lançamentos, atualizações e notícias oficiais de games e inteligência artificial acompanhados pela 6DNX.",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export default async function NewsPage() {
  const articles = await getLatestNews(18);
  const [lead, ...rest] = articles;

  return (
    <main className="min-h-screen overflow-hidden bg-bg text-ink">
      <header className="relative border-b border-white/10 px-4 pb-12 pt-7 md:px-8 md:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,var(--primary-glow),transparent_34%)] opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          <nav className="mb-16 flex items-center justify-between">
            <Link
              href="/"
              className="font-display text-2xl tracking-[-0.06em] text-ink transition-colors hover:text-primary"
            >
              6DNX
            </Link>
            <Link
              href="/#produtos"
              className="text-xs font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:text-primary"
            >
              Ver softwares
            </Link>
          </nav>

          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.32em] text-primary">
            Inteligência de campo // games + IA
          </p>
          <h1 className="max-w-5xl text-[clamp(3rem,11vw,8rem)] leading-[0.82] tracking-[-0.065em]">
            Radar
            <br />
            <span className="text-white/20">6DNX</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            O que acabou de acontecer, o que está mudando e o que chega em
            seguida. Curadoria objetiva com links para a publicação original.
          </p>
        </div>
      </header>

      {lead ? (
        <section className="px-4 py-12 md:px-8 md:py-20" aria-label="Destaque">
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative mx-auto grid min-h-[34rem] max-w-6xl overflow-hidden border border-white/10 lg:grid-cols-2"
          >
            <div className="relative min-h-64 overflow-hidden lg:min-h-full">
              {lead.imageUrl ? (
                <Image
                  src={lead.imageUrl}
                  alt=""
                  fill
                  preload
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover opacity-55 saturate-0 transition duration-700 group-hover:scale-[1.04] group-hover:saturate-50"
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_70%_30%,oklch(0.6_0.24_25_/_0.28),transparent_28%),linear-gradient(135deg,oklch(0.18_0.045_25),oklch(0.055_0_0)_70%)] transition-transform duration-700 group-hover:scale-[1.04]"
                >
                  <span className="absolute -right-8 top-1/2 -translate-y-1/2 font-display text-[clamp(12rem,30vw,28rem)] leading-none text-white/[0.035]">
                    AI
                  </span>
                  <span className="absolute inset-0 opacity-25 [background-image:linear-gradient(oklch(1_0_0_/_0.05)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0_/_0.05)_1px,transparent_1px)] [background-size:38px_38px]" />
                </span>
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-bg" />
            </div>
            <div className="relative flex flex-col justify-end p-7 md:p-12">
              <span className="mb-auto flex items-center justify-between border-b border-white/10 pb-4 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
                <span>{lead.gameName}</span>
                <span className="text-primary">{categoryLabels[lead.category]}</span>
              </span>
              <h2 className="mb-5 mt-12 text-[clamp(2.2rem,5vw,4.5rem)] leading-[0.92] tracking-[-0.05em]">
                {lead.title}
              </h2>
              <p className="mb-7 max-w-xl leading-relaxed text-muted">
                {lead.summary}
              </p>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">
                Ler publicação original <span className="text-primary">━↗</span>
              </span>
            </div>
          </a>
        </section>
      ) : null}

      <section className="px-4 pb-24 md:px-8 md:pb-32" aria-labelledby="feed-heading">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-4">
            <h2 id="feed-heading" className="text-2xl tracking-[-0.04em]">
              Todas as transmissões
            </h2>
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
              {articles.length.toString().padStart(2, "0")} entradas
            </span>
          </div>

          <ol>
            {rest.map((article, index) => (
              <li key={article.externalId}>
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid gap-4 border-b border-white/10 py-7 transition-colors hover:border-primary md:grid-cols-[4rem_10rem_minmax(0,1fr)_auto] md:items-center md:gap-7"
                >
                  <span className="font-display text-3xl text-white/10 transition-colors group-hover:text-primary">
                    {String(index + 2).padStart(2, "0")}
                  </span>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">
                    <span className="mb-1 block text-primary">{article.gameName}</span>
                    {dateFormatter.format(new Date(article.publishedAt))}
                  </span>
                  <span>
                    <span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
                      {categoryLabels[article.category]}
                    </span>
                    <span className="block text-xl font-bold leading-tight text-ink md:text-2xl">
                      {article.title}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="text-xl text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-primary"
                  >
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
