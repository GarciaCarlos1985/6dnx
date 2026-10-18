"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogAdminItem } from "@/lib/catalog/types";
import type { GuideSummary } from "@/lib/guides/types";
import { productPagePath } from "@/lib/catalog/games";
import { productMatchesSearch } from "@/lib/product-discovery";

export function GuidanceCenter({
  items,
  guides,
  available,
  demoMode = false,
}: {
  items: CatalogAdminItem[];
  guides: GuideSummary[];
  available: boolean;
  demoMode?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const summaries = useMemo(
    () => new Map(guides.map((guide) => [guide.productSourceKey, guide])),
    [guides],
  );
  const published = items.filter(
    (item) => item.publicationState === "published",
  );
  const missingGame = published.filter((item) => !item.product.gameName).length;
  const missingGuide = published.filter(
    (item) => !summaries.get(item.sourceKey)?.publishedAt,
  ).length;
  const visible = items.filter(
    (item) =>
      productMatchesSearch(item.product, query) &&
      (filter === "all" ||
        (filter === "game" && !item.product.gameName) ||
        (filter === "guide" && !summaries.get(item.sourceKey)?.publishedAt) ||
        (filter === "published" &&
          Boolean(summaries.get(item.sourceKey)?.publishedAt))),
  );
  return (
    <main className="admin-content-page admin-guidance-page">
      <header className="admin-content-topbar">
        <Link
          className="admin-topbar__brand"
          href={demoMode ? "/admin/demo" : "/admin"}
        >
          <span>6</span>
          <div>
            <strong>6DNX</strong>
            <small>Central de comando</small>
          </div>
        </Link>
        <Link
          className="admin-secondary-button"
          href={demoMode ? "/admin/demo" : "/admin"}
        >
          Voltar aos produtos
        </Link>
      </header>
      <section className="admin-content-workspace">
        <header className="admin-guidance-heading">
          <div>
            <h1>Jogos e orientações</h1>
            <p>
              Organize as soluções. Prepare a orientação uma vez e deixe cada
              cliente encontrá-la na própria compra.
            </p>
          </div>
          <Link
            href="/jogos"
            target="_blank"
            className="admin-secondary-button"
          >
            Ver navegação pública
          </Link>
        </header>
        {demoMode ? (
          <p className="admin-notice admin-notice--info">
            Demonstração local com dados ilustrativos. Nenhuma alteração é
            gravada.
          </p>
        ) : null}
        {!available ? (
          <p className="admin-notice admin-notice--info" role="status">
            O módulo de orientação ainda precisa ser preparado pela equipe
            técnica. Você pode revisar o catálogo; os guias ficam disponíveis
            após a ativação.
          </p>
        ) : null}
        <div className="admin-guidance-filters">
          <label className="admin-field">
            <span>Buscar solução ou jogo</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, jogo ou opção…"
            />
          </label>
          <label className="admin-field">
            <span>Mostrar</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Todas as soluções</option>
              <option value="game">Sem jogo definido</option>
              <option value="guide">Sem guia publicado</option>
              <option value="published">Com guia publicado</option>
            </select>
          </label>
          <span role="status">
            {visible.length} {visible.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>
        <div
          className="admin-guidance-checklist"
          aria-label="Pendências dos produtos publicados"
        >
          <div>
            <strong>
              {missingGame
                ? `${missingGame} sem jogo definido`
                : "Jogos organizados"}
            </strong>
            <p>
              O jogo reúne soluções na navegação. Categoria continua sendo o
              tipo de produto.
            </p>
            <button
              type="button"
              className="admin-text-button"
              onClick={() => setFilter("game")}
            >
              Revisar jogos
            </button>
          </div>
          <div>
            <strong>
              {missingGuide
                ? `${missingGuide} sem guia publicado`
                : "Orientações publicadas"}
            </strong>
            <p>
              O guia aparece na conta de quem tem um pedido confirmado desta
              solução.
            </p>
            <button
              type="button"
              className="admin-text-button"
              onClick={() => setFilter("guide")}
            >
              Preparar orientações
            </button>
          </div>
        </div>
        <div className="admin-guidance-list">
          <div className="admin-guidance-list-head" aria-hidden="true">
            <span>Solução / jogo</span>
            <span>Apresentação pública</span>
            <span>Guia após a compra</span>
            <span>Ações</span>
          </div>
          {visible.map((item) => {
            const guide = summaries.get(item.sourceKey);
            return (
              <article className="admin-guidance-row" key={item.id}>
                <div>
                  <h2>{item.product.title}</h2>
                  <p>{item.product.gameName || "Jogo ainda não definido"}</p>
                  <small>
                    {item.publicationState === "published"
                      ? "No ar"
                      : item.publicationState === "archived"
                        ? "Arquivado"
                        : "Rascunho"}
                  </small>
                </div>
                <div className="admin-guidance-public">
                  <span>
                    {item.product.youtubeId ? "Vídeo cadastrado" : "Sem vídeo"}
                  </span>
                  <span>
                    {item.product.tutorialSteps?.length
                      ? `${item.product.tutorialSteps.length} passos públicos`
                      : "Sem passos públicos"}
                  </span>
                </div>
                <div>
                  <span
                    className={`admin-guide-state ${guide?.publishedAt ? "is-published" : ""}`}
                  >
                    {guide?.publishedAt
                      ? "Publicado para compradores"
                      : guide
                        ? "Rascunho em preparação"
                        : "Ainda não preparado"}
                  </span>
                </div>
                <div className="admin-guidance-row-actions">
                  <Link
                    className="admin-primary-button"
                    href={
                      demoMode
                        ? "/admin/demo?view=guia"
                        : `/admin/orientacoes/${item.id}`
                    }
                  >
                    Editar guia
                  </Link>
                  <Link
                    href={
                      demoMode ? "/admin/demo" : `/admin?produto=${item.id}`
                    }
                  >
                    Editar produto e jogo
                  </Link>
                  {item.publicationState === "published" ? (
                    <Link href={productPagePath(item.product)} target="_blank">
                      Abrir página pública
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
          {!visible.length ? (
            <div className="admin-empty-state">
              <strong>Nenhuma solução neste filtro.</strong>
              <p>Experimente outro nome ou volte para todas as soluções.</p>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
