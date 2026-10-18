"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GuideReader } from "@/components/guide-reader";
import { productPagePath } from "@/lib/catalog/games";
import type { CatalogAdminItem } from "@/lib/catalog/types";
import type {
  GuideRecord,
  GuideMutation,
  SolutionGuide,
} from "@/lib/guides/types";
import { parseGuide, guidePublishErrors } from "@/lib/guides/validation";

export function GuideEditor({
  item,
  initialRecord,
  demoMode = false,
}: {
  item: CatalogAdminItem;
  initialRecord: GuideRecord;
  demoMode?: boolean;
}) {
  const [record, setRecord] = useState(initialRecord);
  const [draft, setDraft] = useState(initialRecord.draft);
  const [busy, setBusy] = useState<GuideMutation["action"] | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(
    null,
  );
  const [preview, setPreview] = useState(false);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(record.draft);
  const parsed = parseGuide(draft);
  const publishErrors = parsed.ok
    ? guidePublishErrors(parsed.value)
    : parsed.errors;
  const available = record.state === "ready" && !demoMode;

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);
  useEffect(() => {
    if (preview) previewHeadingRef.current?.focus();
  }, [preview]);

  function update<K extends keyof SolutionGuide>(
    key: K,
    value: SolutionGuide[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }
  const confirmLeave = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      dirty &&
      !window.confirm(
        "Há alterações no guia que ainda não foram salvas. Sair mesmo assim?",
      )
    )
      event.preventDefault();
  };
  async function save(action: GuideMutation["action"]) {
    if (!available || busy || !parsed.ok || (action !== "save" && dirty))
      return;
    if (action === "publish" && publishErrors.length) return;
    if (
      action !== "save" &&
      !window.confirm(
        action === "publish"
          ? `Publicar este guia para os compradores de ${item.product.title}?`
          : "Retirar este guia do acesso dos compradores? O rascunho e o histórico serão preservados.",
      )
    )
      return;
    setBusy(action);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${item.id}/guide`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          guide: parsed.value,
          expectedRevision: record.revision,
        }),
      });
      const payload = (await response.json()) as {
        record?: GuideRecord;
        error?: string;
        errors?: string[];
      };
      if (!response.ok || !payload.record)
        throw new Error(
          [payload.error, ...(payload.errors ?? [])]
            .filter(Boolean)
            .join(" ") || "Não foi possível salvar. Tente novamente.",
        );
      setRecord(payload.record);
      setDraft(payload.record.draft);
      setNotice({
        error: false,
        text:
          action === "save"
            ? "Rascunho salvo. A orientação publicada foi preservada."
            : action === "publish"
              ? "Guia publicado. Os compradores desta solução já podem acessá-lo na conta."
              : "Guia retirado do acesso. Seu rascunho continua salvo.",
      });
    } catch (error) {
      setNotice({
        error: true,
        text:
          error instanceof Error
            ? error.message
            : "A alteração não foi concluída.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="admin-content-page admin-guide-editor">
      <header className="admin-content-topbar">
        <Link
          className="admin-topbar__brand"
          href={
            demoMode ? "/admin/demo?view=orientacoes" : "/admin/orientacoes"
          }
          onClick={confirmLeave}
        >
          <span>6</span>
          <div>
            <strong>6DNX</strong>
            <small>Jogos e orientações</small>
          </div>
        </Link>
        <Link
          href={productPagePath(item.product)}
          target="_blank"
          className="admin-secondary-button"
        >
          Ver página pública
        </Link>
      </header>
      <section className="admin-content-workspace">
        <header className="admin-guidance-heading">
          <div>
            <h1>Guia após a compra</h1>
            <p>
              {item.product.title} ·{" "}
              {item.product.gameName || "Jogo ainda não definido"}
            </p>
          </div>
          <span
            className={`admin-guide-state ${record.published ? "is-published" : ""}`}
          >
            {record.published
              ? "Versão publicada ativa"
              : "Ainda não publicado"}
          </span>
        </header>
        <p className="admin-guide-explanation">
          Este conteúdo é exclusivo para quem tem uma compra confirmada desta
          solução na conta. O vídeo demonstrativo e os passos públicos continuam
          no editor do produto.
        </p>
        {demoMode ? (
          <p className="admin-notice admin-notice--info">
            Prévia local com conteúdo ilustrativo. Salvar e publicar estão
            desativados nesta demonstração.
          </p>
        ) : record.state !== "ready" ? (
          <p className="admin-notice admin-notice--info" role="status">
            O módulo está indisponível. Você pode preparar uma prévia, mas as
            alterações não serão guardadas ao sair. A equipe técnica precisa
            concluir a ativação.
          </p>
        ) : null}
        <div className="admin-guide-toolbar">
          <div>
            <strong>
              {dirty
                ? "Alterações não salvas"
                : record.revision
                  ? `Rascunho salvo · revisão ${record.revision}`
                  : "Novo guia"}
            </strong>
            <small>
              {record.publishedAt
                ? `Publicado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(record.publishedAt))}`
                : "Prepare, revise e publique quando estiver pronto."}
            </small>
          </div>
          <div>
            <button
              className="admin-secondary-button"
              type="button"
              ref={previewButtonRef}
              disabled={Boolean(busy)}
              onClick={() => setPreview((value) => !value)}
            >
              {preview ? "Voltar à edição" : "Conferir prévia"}
            </button>
            <button
              className="admin-secondary-button"
              type="button"
              disabled={!dirty || !parsed.ok || Boolean(busy) || !available}
              onClick={() => void save("save")}
            >
              {busy === "save" ? "Salvando…" : "Salvar rascunho"}
            </button>
            <button
              className="admin-primary-button"
              type="button"
              disabled={
                dirty ||
                !record.revision ||
                Boolean(busy) ||
                !available ||
                publishErrors.length > 0
              }
              onClick={() => void save("publish")}
            >
              {busy === "publish" ? "Publicando…" : "Publicar guia"}
            </button>
          </div>
        </div>
        {notice ? (
          <p
            className={`admin-notice admin-notice--${notice.error ? "error" : "ok"}`}
            role={notice.error ? "alert" : "status"}
          >
            {notice.text}
          </p>
        ) : null}
        {preview ? (
          <section className="admin-guide-preview solution-page">
            <h2 ref={previewHeadingRef} tabIndex={-1}>
              {draft.title || "Título do seu guia"}
            </h2>
            <p className="admin-guide-preview-label">
              Prévia do comprador · alterações ainda dependem de publicação
            </p>
            {parsed.ok ? (
              <GuideReader guide={parsed.value} />
            ) : (
              <p>Revise os campos antes de visualizar o guia.</p>
            )}
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => {
                setPreview(false);
                previewButtonRef.current?.focus();
              }}
            >
              Continuar editando
            </button>
          </section>
        ) : (
          <div className="admin-guide-form-layout" aria-busy={Boolean(busy)}>
            <fieldset className="admin-guide-fields" disabled={Boolean(busy)}>
              <section className="admin-form-section">
                <h2>Comece pela orientação</h2>
                <label className="admin-field">
                  <span>Título do guia</span>
                  <input
                    maxLength={120}
                    value={draft.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="Ex.: Primeiros passos com esta solução"
                  />
                </label>
                <label className="admin-field">
                  <span>Antes de começar</span>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={draft.introduction}
                    onChange={(event) =>
                      update("introduction", event.target.value)
                    }
                    placeholder="Explique os pré-requisitos e o que o cliente deve ter em mãos."
                  />
                </label>
                <label className="admin-field">
                  <span>Vídeo de orientação do YouTube (opcional)</span>
                  <input
                    maxLength={500}
                    value={draft.youtubeId ?? ""}
                    onChange={(event) =>
                      update("youtubeId", event.target.value || null)
                    }
                    placeholder="Link HTTPS ou ID do vídeo"
                  />
                  <small>
                    É um vídeo diferente da demonstração pública. O YouTube
                    continua responsável pela privacidade do arquivo hospedado
                    lá.
                  </small>
                </label>
              </section>
              <section className="admin-form-section">
                <div className="admin-guide-section-heading">
                  <div>
                    <h2>Passo a passo</h2>
                    <p>
                      Uma ação por passo. Diga como o cliente reconhece que deu
                      certo.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    disabled={draft.steps.length >= 80}
                    onClick={() => update("steps", [...draft.steps, ""])}
                  >
                    Adicionar passo
                  </button>
                </div>
                {draft.steps.length ? (
                  draft.steps.map((step, index) => (
                    <div className="admin-guide-step" key={index}>
                      <label className="admin-field">
                        <span>Passo {index + 1}</span>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={step}
                          onChange={(event) =>
                            update(
                              "steps",
                              draft.steps.map((value, i) =>
                                i === index ? event.target.value : value,
                              ),
                            )
                          }
                        />
                      </label>
                      <div className="admin-guide-step-actions">
                        <button
                          type="button"
                          className="admin-text-button"
                          disabled={index === 0}
                          onClick={() => {
                            const steps = [...draft.steps];
                            [steps[index - 1], steps[index]] = [
                              steps[index],
                              steps[index - 1],
                            ];
                            update("steps", steps);
                          }}
                        >
                          Mover para cima
                        </button>
                        <button
                          type="button"
                          className="admin-text-button"
                          onClick={() => {
                            if (
                              step &&
                              !window.confirm(
                                `Remover o passo ${index + 1} deste rascunho?`,
                              )
                            )
                              return;
                            update(
                              "steps",
                              draft.steps.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          Remover passo
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="admin-guide-empty">
                    Adicione o primeiro passo para começar. Nenhum tutorial
                    existente é copiado automaticamente.
                  </p>
                )}
              </section>
              <section className="admin-form-section">
                <div className="admin-guide-section-heading">
                  <div>
                    <h2>Dúvidas frequentes</h2>
                    <p>
                      Responda aqui às perguntas que mais chegam no atendimento.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    disabled={draft.questions.length >= 15}
                    onClick={() =>
                      update("questions", [
                        ...draft.questions,
                        { question: "", answer: "" },
                      ])
                    }
                  >
                    Adicionar pergunta
                  </button>
                </div>
                {draft.questions.map((question, index) => (
                  <fieldset className="admin-guide-question" key={index}>
                    <legend>Pergunta {index + 1}</legend>
                    <label className="admin-field">
                      <span>Pergunta do cliente</span>
                      <input
                        maxLength={160}
                        value={question.question}
                        onChange={(event) =>
                          update(
                            "questions",
                            draft.questions.map((item, i) =>
                              i === index
                                ? { ...item, question: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>Resposta</span>
                      <textarea
                        rows={3}
                        maxLength={2000}
                        value={question.answer}
                        onChange={(event) =>
                          update(
                            "questions",
                            draft.questions.map((item, i) =>
                              i === index
                                ? { ...item, answer: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="admin-text-button"
                      onClick={() => {
                        if (
                          (question.question || question.answer) &&
                          !window.confirm("Remover esta pergunta do rascunho?")
                        )
                          return;
                        update(
                          "questions",
                          draft.questions.filter((_, i) => i !== index),
                        );
                      }}
                    >
                      Remover pergunta
                    </button>
                  </fieldset>
                ))}
              </section>
            </fieldset>
            <aside className="admin-guide-check">
              <h2>Pronto para o cliente?</h2>
              <ul>
                <li>
                  {draft.title.trim()
                    ? "Título preenchido"
                    : "Defina um título claro"}
                </li>
                <li>
                  {draft.steps.filter((step) => step.trim()).length} passos
                  preparados
                </li>
                <li>
                  {draft.questions.length}{" "}
                  {draft.questions.length === 1
                    ? "dúvida respondida"
                    : "dúvidas respondidas"}
                </li>
                <li>Conferir se o conteúdo corresponde a esta solução</li>
                <li>Testar as instruções antes de publicar</li>
              </ul>
              <p>
                Salvar mantém a versão ativa. Publicar troca a orientação que os
                compradores acessam.
              </p>
              {publishErrors.length ? (
                <p>Para publicar: {publishErrors.join(" ")}</p>
              ) : null}
              <Link
                href={demoMode ? "/admin/demo" : `/admin?produto=${item.id}`}
                onClick={confirmLeave}
              >
                Editar apresentação pública
              </Link>
              {record.published ? (
                <button
                  type="button"
                  className="admin-text-button"
                  disabled={dirty || Boolean(busy) || !available}
                  onClick={() => void save("unpublish")}
                >
                  Retirar guia do acesso
                </button>
              ) : null}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
