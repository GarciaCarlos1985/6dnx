import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublishedCatalog } from "@/lib/catalog/repository";
import { groupProductsByGame } from "@/lib/catalog/games";
import { SolutionList } from "@/components/solution-list";

export const metadata: Metadata = {
  title: "Jogos e soluções",
  description:
    "Encontre as soluções 6DNX por jogo e consulte opções, vídeos e orientação.",
  alternates: { canonical: "/jogos" },
};

export default async function GamesPage() {
  const products = await getPublishedCatalog();
  const games = groupProductsByGame(products);
  return (
    <main className="solution-page">
      <nav className="solution-nav" aria-label="Navegação">
        <Link className="solution-brand" href="/">
          6DNX
        </Link>
        <Link href="/#produtos">Vitrine</Link>
        <Link href="/conta">Minha conta</Link>
      </nav>
      <header className="games-heading">
        <h1>
          Seu jogo.
          <br />
          <span>Sua próxima solução.</span>
        </h1>
        <p>
          Conheça as opções, assista à apresentação e encontre a solução que
          procura.
        </p>
      </header>
      {games.length ? (
        <section aria-label="Navegar por jogo" className="game-directory">
          {games.map((game) => (
            <Link
              key={game.slug}
              className="game-directory-item"
              href={`/jogos/${game.slug}`}
            >
              <Image
                src={game.products[0].image}
                alt=""
                fill
                sizes="(max-width: 600px) 90vw, 340px"
              />
              <div>
                <h2>{game.name}</h2>
                <p>
                  {game.products.length}{" "}
                  {game.products.length === 1 ? "solução" : "soluções"}
                </p>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <p className="solution-empty">
          Explore abaixo as soluções disponíveis. A navegação por jogo aparece
          conforme os produtos são organizados pela equipe.
        </p>
      )}
      <section className="all-solutions">
        <h2>Todas as soluções</h2>
        {products.length ? (
          <SolutionList products={products} />
        ) : (
          <p className="solution-empty">
            O catálogo está temporariamente indisponível. Tente novamente em
            alguns instantes.
          </p>
        )}
      </section>
      <footer className="solution-footer">
        <Link href="/">Voltar ao início</Link>
        <Link href="/conta">Minhas compras e orientações</Link>
        <span>© 6DNX</span>
      </footer>
    </main>
  );
}
