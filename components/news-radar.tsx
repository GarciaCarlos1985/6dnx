import Image from "next/image";
import Link from "next/link";
import { getLatestNews } from "@/lib/news/repository";
import { categoryLabels, type NewsArticle } from "@/lib/news/types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

function ArticleLink({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-24 items-center gap-4 border-t border-white/10 py-4 transition-colors hover:border-primary/70"
    >
      <span className="font-display text-2xl text-white/20 transition-colors group-hover:text-primary">
        {dateFormatter.format(new Date(article.publishedAt))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex flex-wrap items-center gap-x-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">
          {article.gameName}
          <span className="text-white/20" aria-hidden>
            /
          </span>
          <span className="text-muted">{categoryLabels[article.category]}</span>
        </span>
        <span className="line-clamp-2 font-bold leading-snug text-ink transition-colors group-hover:text-primary">
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
  );
}

function FeaturedArticle({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="group relative isolate min-h-[29rem] overflow-hidden border border-white/10 bg-surface"
    >
      {article.imageUrl ? (
        <Image
          src={article.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover opacity-40 saturate-0 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-55 group-hover:saturate-50"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_72%_32%,oklch(0.6_0.24_25_/_0.24),transparent_26%),linear-gradient(135deg,oklch(0.17_0.045_25),oklch(0.055_0_0)_68%)] transition-transform duration-700 group-hover:scale-[1.035]"
        >
          <span className="absolute -right-8 top-1/2 -translate-y-1/2 font-display text-[clamp(10rem,28vw,24rem)] leading-none text-white/[0.035]">
            AI
          </span>
          <span className="absolute inset-0 opacity-25 [background-image:linear-gradient(oklch(1_0_0_/_0.05)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0_/_0.05)_1px,transparent_1px)] [background-size:36px_36px]" />
        </span>
      )}
      <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_5%,oklch(0.08_0_0_/_0.55)_48%,oklch(0.08_0_0)_100%)]" />
      <span className="absolute left-0 top-0 h-1 w-2/3 bg-primary shadow-[0_0_30px_var(--primary-glow)]" />
      <span className="absolute right-6 top-5 font-display text-[clamp(4rem,9vw,8rem)] leading-none text-white/[0.04]">
        01
      </span>

      <span className="absolute inset-x-0 bottom-0 p-6 md:p-9">
        <span className="mb-4 flex flex-wrap items-center gap-3 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">
          <span className="border border-primary/50 bg-primary/10 px-2 py-1">
            {categoryLabels[article.category]}
          </span>
          <span>{article.gameName}</span>
          <span className="text-muted">
            {dateFormatter.format(new Date(article.publishedAt))}
          </span>
        </span>
        <span className="mb-4 block max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] leading-[0.95] tracking-[-0.045em] text-ink">
          {article.title}
        </span>
        <span className="mb-6 block max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
          {article.summary}
        </span>
        <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-ink">
          Ler na fonte
          <span
            aria-hidden
            className="text-primary transition-transform group-hover:translate-x-1"
          >
            ━↗
          </span>
        </span>
      </span>
    </a>
  );
}

export async function NewsRadar() {
  const articles = await getLatestNews(5);
  const [featured, ...timeline] = articles;
  if (!featured) return null;

  return (
    <section
      id="radar"
      aria-labelledby="radar-heading"
      className="site-flow-section relative bg-transparent px-4 py-20 md:px-8 md:py-28"
    >
      <div className="news-content-layer relative z-[var(--z-content)] mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-6 border-l border-primary pl-5 md:flex-row md:items-end md:justify-between md:pl-7">
          <div>
            <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-primary">
              Feed oficial // atualização automática
            </p>
            <h2
              id="radar-heading"
              className="text-[clamp(2.4rem,7vw,5.25rem)] leading-[0.9] tracking-[-0.055em] text-ink"
            >
              Radar 6DNX
            </h2>
          </div>
          <div className="max-w-md md:text-right">
            <p className="mb-4 text-sm leading-relaxed text-muted">
              Jogos e inteligência artificial em uma leitura diária — direto
              da Steam, Google AI e OpenAI, sem scraping de resultados.
            </p>
            <Link
              href="/noticias"
              className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:text-primary"
            >
              Abrir central de notícias <span aria-hidden>→</span>
            </Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.8fr)] lg:gap-10">
          <FeaturedArticle article={featured} />
          <div className="flex flex-col border-b border-white/10">
            <div className="flex items-center justify-between pb-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
              <span>Últimas transmissões</span>
              <span className="flex items-center gap-2 text-accent">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
                live
              </span>
            </div>
            {timeline.map((article) => (
              <ArticleLink key={article.externalId} article={article} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewsRadarSkeleton() {
  return (
    <section
      aria-label="Carregando notícias"
      className="site-flow-section relative bg-transparent px-4 py-20 md:px-8 md:py-28"
    >
      <div className="relative z-[var(--z-content)] mx-auto max-w-6xl animate-pulse">
        <div className="mb-10 h-20 w-2/3 bg-white/5" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.8fr)]">
          <div className="min-h-[29rem] bg-white/[0.035]" />
          <div className="min-h-[29rem] bg-white/[0.025]" />
        </div>
      </div>
    </section>
  );
}
