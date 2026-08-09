"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  StorefrontContent,
  StorefrontContentAdminRecord,
} from "@/lib/storefront-content/types";

type ContentField = {
  key: keyof StorefrontContent;
  label: string;
  help: string;
  maxLength: number;
  multiline?: boolean;
};

const GROUPS: Array<{
  eyebrow: string;
  title: string;
  description: string;
  fields: ContentField[];
}> = [
  {
    eyebrow: "Primeira dobra",
    title: "Hero e chamada principal",
    description:
      "Separe o slogan em três partes para manter o destaque vermelho sem exigir código.",
    fields: [
      { key: "heroHeadlineLead", label: "Início do slogan", help: "Ex.: Soluções", maxLength: 40 },
      { key: "heroHeadlineAccent", label: "Trecho em destaque", help: "Ex.: Incríveis, Seguras", maxLength: 80 },
      { key: "heroHeadlineTail", label: "Final do slogan", help: "Ex.: e Profissionais", maxLength: 60 },
      { key: "heroSupport", label: "Texto de apoio", help: "A frase menor logo abaixo do slogan.", maxLength: 220, multiline: true },
      { key: "heroCtaLabel", label: "Botão principal", help: "Texto do botão que leva ao catálogo.", maxLength: 32 },
    ],
  },
  {
    eyebrow: "Transição do hero",
    title: "Mensagem antes do catálogo",
    description: "Esse texto aparece durante a passagem cinematográfica para os produtos.",
    fields: [
      { key: "heroRevealTitle", label: "Mensagem principal", help: "Primeira parte em branco.", maxLength: 100 },
      { key: "heroRevealAccent", label: "Trecho em destaque", help: "Parte vermelha da mensagem.", maxLength: 60 },
      { key: "heroRevealSupport", label: "Texto de apoio", help: "Linha menor abaixo da mensagem.", maxLength: 100 },
    ],
  },
  {
    eyebrow: "Vitrine",
    title: "Títulos do catálogo",
    description: "Controle os dois blocos de produtos sem alterar cards, preços ou disponibilidade.",
    fields: [
      { key: "catalogTitle", label: "Título principal", help: "Ex.: Soluções 6DNX", maxLength: 80 },
      { key: "catalogDescription", label: "Descrição da vitrine", help: "Explique como navegar pelas fileiras.", maxLength: 260, multiline: true },
      { key: "continuationEyebrow", label: "Chamada da continuação", help: "Texto pequeno em vermelho.", maxLength: 60 },
      { key: "continuationTitle", label: "Título da continuação", help: "Ex.: Continue explorando", maxLength: 80 },
    ],
  },
];

async function readApi<T>(response: Response) {
  const payload = (await response.json()) as T & {
    error?: string;
    errors?: string[];
  };
  if (!response.ok) {
    const detail = payload.errors?.length
      ? `${payload.error ?? "Revise os textos"}\n• ${payload.errors.join("\n• ")}`
      : payload.error;
    throw new Error(detail || "A alteração não pôde ser concluída.");
  }
  return payload;
}

export function StorefrontContentEditor({
  initialRecord,
  userEmail,
}: {
  initialRecord: StorefrontContentAdminRecord;
  userEmail: string;
}) {
  const router = useRouter();
  const [record, setRecord] = useState(initialRecord);
  const [draft, setDraft] = useState(initialRecord.content);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const savedFingerprint = useMemo(
    () => JSON.stringify(record.content),
    [record.content],
  );
  const dirty = JSON.stringify(draft) !== savedFingerprint;
  const canSave = record.state === "ready" && dirty && confirmed && !busy;

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);

  const update = (key: keyof StorefrontContent, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
    setNotice(null);
  };

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setNotice(null);
    try {
      const payload = await readApi<{ record: StorefrontContentAdminRecord }>(
        await fetch("/api/admin/storefront-content", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            content: draft,
            expectedRevision: record.revision,
          }),
        }),
      );
      setRecord(payload.record);
      setDraft(payload.record.content);
      setConfirmed(false);
      setNotice({
        tone: "ok",
        text: "Textos salvos. A página pública já foi marcada para atualização.",
      });
      router.refresh();
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Não foi possível salvar.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-content-page">
      <header className="admin-content-topbar">
        <Link href="/admin" className="admin-topbar__brand" aria-label="Voltar aos produtos">
          <span>6</span>
          <div>
            <strong>6DNX</strong>
            <small>Central de comando</small>
          </div>
        </Link>
        <div className="admin-content-topbar__actions">
          <Link href="/" target="_blank" rel="noreferrer">Ver site ↗</Link>
          <span>{userEmail}</span>
        </div>
      </header>

      <section className="admin-content-workspace">
        <header className="admin-content-heading">
          <div>
            <span className="admin-kicker">Conteúdo institucional</span>
            <h1>Textos da vitrine</h1>
            <p>Edite os títulos do hero e do catálogo sem abrir arquivos de código.</p>
          </div>
          <div className="admin-content-heading__actions">
            <Link href="/admin" className="admin-secondary-button">Voltar aos produtos</Link>
            <button type="button" className="admin-primary-button" onClick={save} disabled={!canSave}>
              {busy ? "Salvando…" : "Salvar textos"}
            </button>
          </div>
        </header>

        {record.state !== "ready" ? (
          <div className="admin-notice admin-notice--info" role="status">
            <span>i</span>
            <p>
              <strong>Edição ainda não habilitada no banco.</strong><br />
              A prévia usa os textos atuais com segurança. Revise e aplique a migration
              <code> 20260809120000_add_storefront_content_admin.sql</code> antes do primeiro salvamento.
            </p>
          </div>
        ) : null}

        {notice ? (
          <div className={`admin-notice admin-notice--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
            <span>{notice.tone === "ok" ? "✓" : notice.tone === "error" ? "!" : "i"}</span>
            <p>{notice.text}</p>
          </div>
        ) : null}

        <div className="admin-content-layout">
          <div className="admin-content-form">
            {GROUPS.map((group) => (
              <section className="admin-form-section" key={group.title}>
                <div className="admin-section-heading">
                  <div>
                    <span className="admin-kicker">{group.eyebrow}</span>
                    <h2>{group.title}</h2>
                    <p>{group.description}</p>
                  </div>
                </div>
                <div className="admin-form-grid">
                  {group.fields.map((field) => (
                    <label className="admin-field admin-field--wide" key={field.key}>
                      <span>{field.label}</span>
                      {field.multiline ? (
                        <textarea rows={4} maxLength={field.maxLength} value={draft[field.key]} onChange={(event) => update(field.key, event.target.value)} />
                      ) : (
                        <input maxLength={field.maxLength} value={draft[field.key]} onChange={(event) => update(field.key, event.target.value)} />
                      )}
                      <small>{field.help} · {draft[field.key].length}/{field.maxLength}</small>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="admin-content-preview" aria-label="Prévia dos textos">
            <span className="admin-kicker">Prévia editorial</span>
            <h2>
              {draft.heroHeadlineLead}{" "}
              <em>{draft.heroHeadlineAccent}</em>{" "}
              {draft.heroHeadlineTail}
            </h2>
            <p>{draft.heroSupport}</p>
            <a>{draft.heroCtaLabel}</a>
            <hr />
            <h3>{draft.catalogTitle}</h3>
            <p>{draft.catalogDescription}</p>
            <small>{draft.continuationEyebrow}</small>
            <h3>{draft.continuationTitle}</h3>
            <dl>
              <div><dt>Revisão</dt><dd>#{record.revision}</dd></div>
              <div><dt>Última atualização</dt><dd>{record.updatedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(record.updatedAt)) : "Migration pendente"}</dd></div>
            </dl>
          </aside>
        </div>

        <label className="admin-review-confirm admin-content-confirm">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={!dirty || record.state !== "ready"} />
          <span aria-hidden />
          <p>
            <strong>Conferi a prévia e quero publicar estes textos.</strong>
            <small>Produtos, preços, checkout e ordem dos cards não serão alterados.</small>
          </p>
        </label>
      </section>
    </main>
  );
}
