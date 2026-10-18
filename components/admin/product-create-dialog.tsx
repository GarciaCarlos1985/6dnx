"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogAdminItem } from "@/lib/catalog/types";
import type { CreateProductInput } from "@/lib/catalog/creation";

export function ProductCreateDialog({
  source,
  gameEnabled,
  demoMode,
  busy,
  onClose,
  onCreate,
}: {
  source: CatalogAdminItem | null;
  gameEnabled: boolean;
  demoMode: boolean;
  busy: boolean;
  onClose: () => void;
  onCreate: (input: CreateProductInput) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const [requestId] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState(
    source ? `${source.product.title.slice(0, 90)} (cópia)` : "",
  );
  const [category, setCategory] = useState(source?.product.category ?? "");
  const [gameName, setGameName] = useState(source?.product.gameName ?? "");
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    nameInput.current?.focus();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="admin-create-dialog"
      aria-labelledby="create-product-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await onCreate({
              requestId,
              title,
              category,
              ...(gameEnabled ? { gameName: gameName.trim() || null } : {}),
              ...(source
                ? {
                    sourceId: source.id,
                    expectedSourceRevision: source.revision,
                  }
                : {}),
            });
          } catch (reason) {
            setError(
              reason instanceof Error
                ? reason.message
                : "Não foi possível criar o rascunho.",
            );
          }
        }}
      >
        <header>
          <div>
            <h2 id="create-product-title">
              {source ? "Duplicar produto" : "Novo produto"}
            </h2>
            <p>
              {source
                ? `Usar ${source.product.title} como ponto de partida.`
                : "Comece pelo nome. Depois complete imagem, conteúdo e planos no editor."}
            </p>
          </div>
          <button
            className="admin-text-button"
            type="button"
            aria-label="Fechar cadastro"
            disabled={busy}
            onClick={onClose}
          >
            Fechar
          </button>
        </header>
        <fieldset disabled={busy}>
          <label className="admin-field">
            <span>Nome do novo produto</span>
            <input
              ref={nameInput}
              required
              maxLength={100}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: nome da nova solução"
            />
          </label>
          <label className="admin-field">
            <span>Categoria comercial</span>
            <input
              required
              maxLength={80}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Ex.: Software ou personalização"
            />
          </label>
          {gameEnabled ? (
            <label className="admin-field">
              <span>Jogo ou universo</span>
              <input
                maxLength={80}
                value={gameName}
                onChange={(event) => setGameName(event.target.value)}
                placeholder="Ex.: DayZ"
              />
              <small>
                Opcional. Agrupa este produto na navegação por jogo.
              </small>
            </label>
          ) : null}
        </fieldset>
        <div className="admin-create-summary">
          <strong>Começa como rascunho, fora da vitrine.</strong>
          <p>
            {source
              ? "Imagens, apresentação e planos serão copiados para revisão. O original e seus pedidos permanecem intactos. O guia privado é preparado separadamente para a nova solução."
              : "Nenhum preço ou plano será inventado. Você preenche os dados e decide quando publicar."}
          </p>
          {demoMode ? (
            <p>Prévia local: este cadastro existe apenas nesta sessão.</p>
          ) : null}
        </div>
        {error ? (
          <p className="admin-notice admin-notice--error" role="alert">
            {error}
          </p>
        ) : null}
        <footer>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="admin-primary-button"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Criando rascunho…"
              : source
                ? "Criar cópia e editar"
                : "Criar rascunho e editar"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
