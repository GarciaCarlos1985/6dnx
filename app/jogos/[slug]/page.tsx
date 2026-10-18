import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCatalog } from "@/lib/catalog/repository";
import { groupProductsByGame } from "@/lib/catalog/games";
import { SolutionList } from "@/components/solution-list";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = groupProductsByGame(await getPublishedCatalog()).find(
    (item) => item.slug === slug,
  );
  return game
    ? {
        title: `${game.name}: soluções`,
        alternates: { canonical: `/jogos/${game.slug}` },
      }
    : { title: "Jogo não encontrado", robots: { index: false } };
}
export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const game = groupProductsByGame(await getPublishedCatalog()).find(
    (item) => item.slug === slug,
  );
  if (!game) notFound();
  return (
    <main className="solution-page">
      <nav className="solution-nav" aria-label="Navegação">
        <Link className="solution-brand" href="/">
          6DNX
        </Link>
        <Link href="/jogos">Todos os jogos</Link>
        <Link href="/conta">Minha conta</Link>
      </nav>
      <header className="games-heading">
        <h1>{game.name}</h1>
        <p>
          Compare as soluções, veja as opções disponíveis e abra a apresentação
          completa.
        </p>
      </header>
      <SolutionList products={game.products} />
      <footer className="solution-footer">
        <Link href="/jogos">Explorar outros jogos</Link>
        <span>© 6DNX</span>
      </footer>
    </main>
  );
}
