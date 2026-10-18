import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCatalog } from "@/lib/catalog/repository";
import { gameSlug, productPagePath } from "@/lib/catalog/games";
import {
  ProductMediaPreview,
  ProductTechnicalContent,
} from "@/components/product-detail-content";
import { SolutionPurchase } from "@/components/solution-purchase";
import { productStatusLabel } from "@/lib/products";
import { checkoutReadiness } from "@/lib/checkout/config";
import { shouldEnablePaymentTestMode } from "@/lib/security/payment-test-mode";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getPublishedCatalog()).find(
    (item) => item.slug === slug,
  );
  if (!product)
    return { title: "Solução não encontrada", robots: { index: false } };
  return {
    title: product.title,
    description: product.description || product.tagline,
    alternates: { canonical: productPagePath(product) },
    openGraph: {
      title: product.title,
      description: product.tagline,
      url: productPagePath(product),
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = (await getPublishedCatalog()).find(
    (item) => item.slug === slug,
  );
  if (!product) notFound();
  return (
    <main className="solution-page">
      <nav className="solution-nav" aria-label="Navegação da solução">
        <Link className="solution-brand" href="/">
          6DNX
        </Link>
        <Link href="/jogos">Explorar jogos</Link>
        <Link href="/conta">Minha conta</Link>
      </nav>
      <nav className="solution-breadcrumb" aria-label="Caminho">
        <Link href="/jogos">Jogos e soluções</Link>
        {product.gameName ? (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/jogos/${gameSlug(product.gameName)}`}>
              {product.gameName}
            </Link>
          </>
        ) : null}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.title}</span>
      </nav>
      <header className="solution-heading">
        <div>
          <h1>{product.title}</h1>
          <p>{product.tagline}</p>
        </div>
        <span className="solution-status">
          {productStatusLabel(product.status)}
        </span>
      </header>
      <div className="solution-layout">
        <article className="solution-detail">
          <div className="solution-media">
            <ProductMediaPreview product={product} />
          </div>
          <nav className="solution-section-nav" aria-label="Nesta página">
            <a href="#detalhes">Conheça a solução</a>
            <a href="#opcoes">Opções e valores</a>
            <Link href="/conta">Orientação após a compra</Link>
          </nav>
          <section className="solution-technical" id="detalhes">
            <h2>Detalhes e orientação pública</h2>
            <ProductTechnicalContent product={product} />
          </section>
        </article>
        <aside className="solution-purchase" id="opcoes">
          <h2>Escolha sua opção</h2>
          <SolutionPurchase
            product={product}
            checkoutAvailable={checkoutReadiness().ready}
            paymentTestAvailable={shouldEnablePaymentTestMode(process.env)}
          />
        </aside>
      </div>
      <footer className="solution-footer">
        <Link href="/jogos">Continuar explorando</Link>
        <a href="/api/redirect" target="_blank" rel="noreferrer">
          Suporte no Discord
        </a>
        <span>© 6DNX</span>
      </footer>
    </main>
  );
}
