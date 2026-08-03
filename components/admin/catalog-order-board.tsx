"use client";

import { useMemo, useState } from "react";
import type { CatalogAdminItem } from "@/lib/catalog/types";

const INITIAL_SHOWCASE_SIZE = 12;

type CatalogOrderBoardProps = {
  items: CatalogAdminItem[];
  busy: boolean;
  demoMode: boolean;
  onCancel: () => void;
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

function moveToPosition(ids: string[], sourceId: string, targetId: string) {
  if (sourceId === targetId) return ids;
  const sourceIndex = ids.indexOf(sourceId);
  const targetIndex = ids.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0) return ids;

  const next = [...ids];
  const [source] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, source);
  return next;
}

function moveBy(ids: string[], id: string, offset: -1 | 1) {
  const index = ids.indexOf(id);
  const destination = index + offset;
  if (index < 0 || destination < 0 || destination >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

export function CatalogOrderBoard({
  items,
  busy,
  demoMode,
  onCancel,
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
  const [confirmed, setConfirmed] = useState(false);
  const dirty = orderedIds.some((id, index) => id !== initialIds[index]);

  const updateOrder = (next: string[]) => {
    setOrderedIds(next);
    setConfirmed(false);
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
            Arraste os cards ou use as setas pequenas. Nada muda no site até
            você confirmar e salvar a ordem inteira.
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
                          updateOrder(moveToPosition(orderedIds, sourceId, id));
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
                      <span className="admin-order-card__drag" aria-hidden>
                        ⋮⋮
                      </span>
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
          A demonstração permite testar o arraste, mas não grava no Supabase.
        </p>
      ) : null}
    </section>
  );
}
