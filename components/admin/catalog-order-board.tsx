"use client";

import { useEffect, useMemo, useState } from "react";
import { moveCatalogItem, swapCatalogItems } from "@/lib/catalog/order";
import type { CatalogAdminItem } from "@/lib/catalog/types";

const INITIAL_SHOWCASE_SIZE = 12;

type CatalogOrderBoardProps = {
  items: CatalogAdminItem[];
  busy: boolean;
  demoMode: boolean;
  onCancel: () => void;
  onArchive: (itemId: string) => Promise<void>;
  onSave: (orderedIds: string[]) => Promise<void>;
};

type ShowcaseGroup = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  start: number;
  end?: number;
};

const groups: ShowcaseGroup[] = [
  {
    key: "section-2-row-1",
    eyebrow: "Seção 2",
    title: "Fileira 1",
    description: "Os três primeiros cards abaixo do hero.",
    start: 0,
    end: 3,
  },
  {
    key: "section-2-row-2",
    eyebrow: "Seção 2",
    title: "Fileira 2",
    description: "Os três cards seguintes da primeira seção.",
    start: 3,
    end: 6,
  },
  {
    key: "section-3-row-1",
    eyebrow: "Seção 3",
    title: "Fileira 1",
    description: "Os três primeiros cards da continuação.",
    start: 6,
    end: 9,
  },
  {
    key: "section-3-row-2",
    eyebrow: "Seção 3",
    title: "Fileira 2",
    description: "Os três últimos cards da vitrine inicial.",
    start: 9,
    end: 12,
  },
  {
    key: "remaining",
    eyebrow: "Navegação lateral",
    title: "Demais cards",
    description: "Aparecem pelas setas, sem substituir os doze iniciais.",
    start: INITIAL_SHOWCASE_SIZE,
  },
];

function moveBeforeTarget(ids: string[], sourceId: string, targetId: string) {
  const targetIndex = ids.indexOf(targetId);
  return targetIndex < 0 ? ids : moveCatalogItem(ids, sourceId, targetIndex);
}

function moveBy(ids: string[], id: string, offset: -1 | 1) {
  const index = ids.indexOf(id);
  const destination = index + offset;
  return moveCatalogItem(ids, id, destination);
}

function positionDescription(index: number) {
  if (index < 3) return `Seção 2 · fileira 1 · espaço ${index + 1}`;
  if (index < 6) return `Seção 2 · fileira 2 · espaço ${index - 2}`;
  if (index < 9) return `Seção 3 · fileira 1 · espaço ${index - 5}`;
  if (index < 12) return `Seção 3 · fileira 2 · espaço ${index - 8}`;
  return `Navegação lateral · posição ${index + 1}`;
}

export function CatalogOrderBoard({
  items,
  busy,
  demoMode,
  onCancel,
  onArchive,
  onSave,
}: CatalogOrderBoardProps) {
  const initialIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );
  const [orderedIds, setOrderedIds] = useState(initialIds);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const [quickQuery, setQuickQuery] = useState("");
  const [quickSelectedId, setQuickSelectedId] = useState(initialIds[0] ?? "");
  const [quickDestination, setQuickDestination] = useState("1");
  const [confirmed, setConfirmed] = useState(false);
  const [actionCardId, setActionCardId] = useState<string | null>(null);
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const dirty = orderedIds.some((id, index) => id !== initialIds[index]);
  const quickSelected = itemById.get(quickSelectedId);
  const actionCard = actionCardId ? itemById.get(actionCardId) : undefined;
  const actionTarget = actionTargetId ? itemById.get(actionTargetId) : undefined;
  const quickSelectedIndex = orderedIds.indexOf(quickSelectedId);
  const quickMatches = useMemo(() => {
    const normalized = quickQuery.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return [];
    return items
      .filter((item) =>
        [item.product.title, item.product.category, item.product.slug].some(
          (value) => value.toLocaleLowerCase("pt-BR").includes(normalized),
        ),
      )
      .slice(0, 8);
  }, [items, quickQuery]);

  useEffect(() => {
    if (!actionCardId) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActionCardId(null);
    };
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [actionCardId]);

  const updateOrder = (next: string[]) => {
    setOrderedIds(next);
    setConfirmed(false);
  };

  const selectQuickItem = (id: string) => {
    const index = orderedIds.indexOf(id);
    if (index < 0) return;
    setQuickSelectedId(id);
    setQuickDestination(String(index + 1));
    setQuickQuery("");
  };

  const moveQuickItem = (destinationIndex: number) => {
    if (!quickSelectedId) return;
    const next = moveCatalogItem(
      orderedIds,
      quickSelectedId,
      destinationIndex,
    );
    updateOrder(next);
    const nextIndex = next.indexOf(quickSelectedId);
    setQuickDestination(String(nextIndex + 1));
  };

  const moveQuickItemToTypedPosition = () => {
    const requestedPosition = Number(quickDestination);
    if (!Number.isInteger(requestedPosition)) return;
    const destinationIndex = Math.min(
      orderedIds.length - 1,
      Math.max(0, requestedPosition - 1),
    );
    moveQuickItem(destinationIndex);
  };

  const openCardActions = (id: string) => {
    setActionCardId(id);
    setActionTargetId(null);
  };

  const closeCardActions = () => {
    if (busy) return;
    setActionCardId(null);
    setActionTargetId(null);
  };

  const moveActionCard = () => {
    if (!actionCardId || !actionTargetId) return;
    const targetIndex = orderedIds.indexOf(actionTargetId);
    if (targetIndex < 0) return;
    const next = moveCatalogItem(orderedIds, actionCardId, targetIndex);
    updateOrder(next);
    setQuickSelectedId(actionCardId);
    setQuickDestination(String(next.indexOf(actionCardId) + 1));
    closeCardActions();
  };

  const swapActionCards = () => {
    if (!actionCardId || !actionTargetId) return;
    const next = swapCatalogItems(orderedIds, actionCardId, actionTargetId);
    updateOrder(next);
    setQuickSelectedId(actionCardId);
    setQuickDestination(String(next.indexOf(actionCardId) + 1));
    closeCardActions();
  };

  const archiveActionCard = async () => {
    if (!actionCardId || !actionCard || busy || demoMode) return;
    if (
      !window.confirm(
        `Arquivar ${actionCard.product.title}? Ele sairá do site imediatamente, mas continuará guardado na aba Arquivo.`,
      )
    ) {
      return;
    }
    try {
      await onArchive(actionCardId);
      const remainingIds = orderedIds.filter((id) => id !== actionCardId);
      setOrderedIds(remainingIds);
      setConfirmed(false);
      if (quickSelectedId === actionCardId) {
        setQuickSelectedId(remainingIds[0] ?? "");
        setQuickDestination(remainingIds.length ? "1" : "");
      }
      setActionCardId(null);
      setActionTargetId(null);
    } catch {
      // The parent dashboard already exposes the protected API error.
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm("Descartar a nova ordem ainda não salva?")) {
      return;
    }
    onCancel();
  };

  const save = async () => {
    if (!dirty || !confirmed || busy || demoMode) return;
    if (
      !window.confirm(
        "Salvar esta ordem? Apenas a posição dos cards publicados será alterada.",
      )
    ) {
      return;
    }
    await onSave(orderedIds);
  };

  return (
    <section className="admin-order-workspace" aria-labelledby="catalog-order-title">
      <header className="admin-order-header">
        <div>
          <span className="admin-kicker">Organização protegida</span>
          <h1 id="catalog-order-title">Organizar vitrine</h1>
          <p>
            Encontre qualquer card pelo nome e envie direto para a posição
            desejada. Arraste ou use as setas apenas para ajustes curtos.
          </p>
        </div>
        <div className="admin-order-header__actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={cancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="admin-primary-button"
            onClick={save}
            disabled={!dirty || !confirmed || busy || demoMode}
          >
            {busy ? "Salvando ordem…" : "Salvar nova ordem"}
          </button>
        </div>
      </header>

      <div className="admin-order-safety" role="note">
        <strong>O que este modo pode fazer</strong>
        <span>Mudar somente a posição dos cards publicados.</span>
        <strong>O que ele não pode fazer</strong>
        <span>Não altera títulos, imagens, descrições, preços ou arquivos.</span>
      </div>

      <section className="admin-order-quick" aria-labelledby="quick-order-title">
        <header>
          <div>
            <span className="admin-kicker">Movimento rápido</span>
            <h2 id="quick-order-title">Buscar e posicionar</h2>
          </div>
          <p>
            Digite parte do nome, selecione o card e escolha a posição. Não é
            preciso arrastá-lo pela lista inteira.
          </p>
        </header>

        <div className="admin-order-quick__workspace">
          <div className="admin-order-quick__search">
            <label htmlFor="catalog-order-search">Encontrar card</label>
            <input
              id="catalog-order-search"
              type="search"
              value={quickQuery}
              onChange={(event) => setQuickQuery(event.target.value)}
              placeholder="Ex.: Rust19, Valorant, DayZ…"
              autoComplete="off"
            />
            {quickQuery.trim() ? (
              <div className="admin-order-quick__results" aria-live="polite">
                {quickMatches.length ? (
                  quickMatches.map((item) => {
                    const position = orderedIds.indexOf(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => selectQuickItem(item.id)}
                      >
                        <strong>{item.product.title}</strong>
                        <small>
                          Posição {position + 1} · {positionDescription(position)}
                        </small>
                      </button>
                    );
                  })
                ) : (
                  <p>Nenhum card publicado encontrado.</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="admin-order-quick__selected" aria-live="polite">
            {quickSelected ? (
              <>
                <span
                  className="admin-order-card__thumb"
                  style={{
                    backgroundImage: `url("${quickSelected.product.image.replaceAll('"', "%22")}")`,
                  }}
                  aria-hidden
                />
                <p>
                  <small>Card selecionado</small>
                  <strong>{quickSelected.product.title}</strong>
                  <span>
                    Agora em {quickSelectedIndex + 1} ·{" "}
                    {positionDescription(quickSelectedIndex)}
                  </span>
                </p>
              </>
            ) : (
              <p>Busque e selecione um card.</p>
            )}
          </div>

          <div className="admin-order-quick__destination">
            <label htmlFor="catalog-order-destination">Nova posição</label>
            <div>
              <input
                id="catalog-order-destination"
                type="number"
                min="1"
                max={orderedIds.length}
                value={quickDestination}
                onChange={(event) => setQuickDestination(event.target.value)}
                disabled={!quickSelected || busy}
              />
              <button
                type="button"
                className="admin-primary-button"
                onClick={moveQuickItemToTypedPosition}
                disabled={!quickSelected || busy}
              >
                Mover para posição
              </button>
            </div>
            <div className="admin-order-quick__shortcuts">
              <button
                type="button"
                onClick={() => moveQuickItem(0)}
                disabled={!quickSelected || quickSelectedIndex === 0 || busy}
              >
                Levar ao topo
              </button>
              <button
                type="button"
                onClick={() => moveQuickItem(orderedIds.length - 1)}
                disabled={
                  !quickSelected ||
                  quickSelectedIndex === orderedIds.length - 1 ||
                  busy
                }
              >
                Levar ao fim
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-order-groups">
        {groups.map((group) => {
          const groupIds = orderedIds.slice(group.start, group.end);
          if (group.key === "remaining" && groupIds.length === 0) return null;

          return (
            <section className="admin-order-group" key={group.key}>
              <header>
                <div>
                  <span>{group.eyebrow}</span>
                  <h2>{group.title}</h2>
                </div>
                <p>{group.description}</p>
              </header>
              <ol>
                {groupIds.map((id) => {
                  const item = itemById.get(id);
                  if (!item) return null;
                  const globalIndex = orderedIds.indexOf(id);
                  const canMoveUp = globalIndex > 0;
                  const canMoveDown = globalIndex < orderedIds.length - 1;

                  return (
                    <li
                      key={id}
                      draggable={!busy}
                      data-dragging={draggedId === id ? "true" : undefined}
                      data-drag-target={dragTargetId === id ? "true" : undefined}
                      onDragStart={(event) => {
                        setDraggedId(id);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", id);
                      }}
                      onDragOver={(event) => {
                        if (!draggedId || draggedId === id) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragTargetId(id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const sourceId =
                          draggedId || event.dataTransfer.getData("text/plain");
                        if (sourceId) {
                          updateOrder(moveBeforeTarget(orderedIds, sourceId, id));
                        }
                        setDraggedId(null);
                        setDragTargetId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragTargetId(null);
                      }}
                    >
                      <span className="admin-order-card__position">
                        {String(globalIndex + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="admin-order-card__thumb"
                        style={{
                          backgroundImage: `url("${item.product.image.replaceAll('"', "%22")}")`,
                        }}
                        aria-hidden
                      />
                      <span className="admin-order-card__identity">
                        <strong>{item.product.title}</strong>
                        <small>{item.product.category}</small>
                      </span>
                      <button
                        type="button"
                        className="admin-order-card__menu"
                        aria-label={`Abrir ações de ${item.product.title}`}
                        title="Mover, trocar ou arquivar"
                        onClick={() => openCardActions(id)}
                        disabled={busy}
                      >
                        ⋯
                      </button>
                      <span className="admin-order-card__controls">
                        <button
                          type="button"
                          aria-label={`Mover ${item.product.title} uma posição para cima`}
                          onClick={() => updateOrder(moveBy(orderedIds, id, -1))}
                          disabled={!canMoveUp || busy}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Mover ${item.product.title} uma posição para baixo`}
                          onClick={() => updateOrder(moveBy(orderedIds, id, 1))}
                          disabled={!canMoveDown || busy}
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <label className="admin-order-confirm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={!dirty || busy || demoMode}
        />
        <span aria-hidden />
        <p>
          <strong>Conferi as quatro fileiras e os doze cards iniciais.</strong>
          <small>
            O botão salvar continuará bloqueado enquanto esta confirmação não
            estiver marcada.
          </small>
        </p>
      </label>

      {demoMode ? (
        <p className="admin-order-demo-note">
          A demonstração permite testar movimentos e trocas, mas não grava no
          Supabase nem arquiva cards.
        </p>
      ) : null}

      {actionCardId && actionCard ? (
        <div
          className="admin-order-board-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeCardActions();
          }}
        >
          <section
            className="admin-order-board-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-board-dialog-title"
          >
            <header>
              <div>
                <span className="admin-kicker">Tabuleiro da vitrine</span>
                <h2 id="catalog-board-dialog-title">
                  Mover {actionCard.product.title}
                </h2>
                <p>
                  Escolha uma casa. Você pode inserir o card nessa posição ou
                  trocar diretamente com o card que já está nela.
                </p>
              </div>
              <button
                type="button"
                className="admin-order-board-dialog__close"
                onClick={closeCardActions}
                disabled={busy}
                aria-label="Fechar tabuleiro"
              >
                ×
              </button>
            </header>

            <div className="admin-order-board-dialog__legend" role="note">
              <span><i data-kind="origin" /> Card escolhido</span>
              <span><i data-kind="target" /> Destino selecionado</span>
              <span>Casas 01–12 formam a vitrine inicial</span>
            </div>

            <ol className="admin-order-minimap" aria-label="Posições da vitrine">
              {orderedIds.map((id, index) => {
                const item = itemById.get(id);
                if (!item) return null;
                const isOrigin = id === actionCardId;
                const isTarget = id === actionTargetId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={isOrigin ? "is-origin" : isTarget ? "is-target" : ""}
                      onClick={() => setActionTargetId(isOrigin ? null : id)}
                      disabled={isOrigin || busy}
                      aria-pressed={isTarget}
                      aria-label={`Posição ${index + 1}: ${item.product.title}`}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <i
                        style={{
                          backgroundImage: `url("${item.product.image.replaceAll('"', "%22")}")`,
                        }}
                        aria-hidden
                      />
                      <strong>{item.product.title}</strong>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="admin-order-board-dialog__selection" aria-live="polite">
              {actionTarget ? (
                <p>
                  Destino: <strong>{actionTarget.product.title}</strong> · posição{" "}
                  {orderedIds.indexOf(actionTarget.id) + 1}
                </p>
              ) : (
                <p>Selecione uma casa do tabuleiro para liberar as ações.</p>
              )}
            </div>

            <footer>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={moveActionCard}
                disabled={!actionTargetId || busy}
              >
                Mover para esta casa
              </button>
              <button
                type="button"
                className="admin-primary-button"
                onClick={swapActionCards}
                disabled={!actionTargetId || busy}
              >
                Trocar os dois cards
              </button>
              <button
                type="button"
                className="admin-order-board-dialog__archive"
                onClick={() => void archiveActionCard()}
                disabled={busy || demoMode}
                title={
                  demoMode
                    ? "Arquivamento desativado na demonstração"
                    : "Retira o card do site sem apagar seus dados"
                }
              >
                {busy ? "Atualizando…" : "Arquivar card"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
