"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteAtmosphere } from "@/components/site-atmosphere";
import { experienceThemeStyle } from "@/lib/site-experience/presentation";
import {
  EXPERIENCE_EFFECT_FAMILIES,
  type ExperienceEffectFamily,
  type ExperiencePageId,
  type SiteExperienceAdminRecord,
  type SiteExperienceConfig,
} from "@/lib/site-experience/types";
import { parseSiteExperienceConfig } from "@/lib/site-experience/validation";

type Field = { key: string; label: string; maxLength: number; multiline?: boolean };

const PAGE_FIELDS: Record<ExperiencePageId, Field[]> = {
  home: [
    { key: "heroHeadlineLead", label: "Início do slogan", maxLength: 40 },
    { key: "heroHeadlineAccent", label: "Slogan em destaque", maxLength: 80 },
    { key: "heroHeadlineTail", label: "Final do slogan", maxLength: 60 },
    { key: "heroSupport", label: "Apoio do hero", maxLength: 220, multiline: true },
    { key: "heroRevealTitle", label: "Mensagem de transição", maxLength: 100 },
    { key: "heroRevealAccent", label: "Transição em destaque", maxLength: 60 },
    { key: "heroRevealSupport", label: "Apoio da transição", maxLength: 100 },
    { key: "heroCtaLabel", label: "Botão principal", maxLength: 32 },
    { key: "catalogTitle", label: "Título do catálogo", maxLength: 80 },
    { key: "catalogDescription", label: "Descrição do catálogo", maxLength: 260, multiline: true },
    { key: "continuationEyebrow", label: "Chamada da continuação", maxLength: 60 },
    { key: "continuationTitle", label: "Título da continuação", maxLength: 80 },
  ],
  account: [
    { key: "navigationLabel", label: "Nome da central", maxLength: 40 },
    { key: "anonymousEyebrow", label: "Chamada sem login", maxLength: 60 },
    { key: "anonymousTitle", label: "Título sem login", maxLength: 110 },
    { key: "anonymousSupport", label: "Explicação sem login", maxLength: 260, multiline: true },
    { key: "journeyEyebrow", label: "Chamada da jornada", maxLength: 60 },
    { key: "journeyTitle", label: "Título da jornada", maxLength: 80 },
    { key: "slotCardEyebrow", label: "Chamada da Slot", maxLength: 60 },
    { key: "slotCardTitle", label: "Título da Slot", maxLength: 80 },
    { key: "ordersEyebrow", label: "Chamada dos pedidos", maxLength: 60 },
    { key: "ordersTitle", label: "Título dos pedidos", maxLength: 80 },
  ],
  slot: [
    { key: "heroEyebrow", label: "Chamada principal", maxLength: 60 },
    { key: "heroTitle", label: "Título principal", maxLength: 70 },
    { key: "heroAccent", label: "Destaque do título", maxLength: 24 },
    { key: "heroSupport", label: "Texto de apoio", maxLength: 260, multiline: true },
    { key: "primaryAction", label: "Botão da cabine", maxLength: 40 },
    { key: "secondaryAction", label: "Botão das regras", maxLength: 40 },
    { key: "mascotLabel", label: "Legenda do mascote", maxLength: 60 },
    { key: "machineEyebrow", label: "Chamada da cabine", maxLength: 60 },
    { key: "machineTitle", label: "Título da cabine", maxLength: 90 },
    { key: "rulesEyebrow", label: "Chamada das regras", maxLength: 60 },
    { key: "rulesTitle", label: "Título das regras", maxLength: 90 },
  ],
};

const PAGE_LABELS: Record<ExperiencePageId, string> = {
  home: "Home e vitrine",
  account: "Minha conta",
  slot: "Slot 6DNX",
};

const EFFECT_LABELS: Record<ExperienceEffectFamily, string> = {
  feathers: "Penas de anjo",
  ammo: "Fragmentos de munição",
  embers: "Fagulhas incandescentes",
  sparks: "Faíscas",
  lightning: "Raios discretos",
};

async function readApi(response: Response) {
  const payload = (await response.json()) as { record?: Record<string, unknown>; error?: string; errors?: string[]; code?: string };
  if (!response.ok) {
    const details = payload.errors?.length ? ` ${payload.errors.join(" ")}` : "";
    throw new Error(`${payload.error ?? "Operação recusada."}${details}`);
  }
  return payload.record ?? {};
}

export function SiteExperienceStudio({
  initialRecord,
  userEmail,
}: {
  initialRecord: SiteExperienceAdminRecord;
  userEmail: string;
}) {
  const [record, setRecord] = useState(initialRecord);
  const [draft, setDraft] = useState(initialRecord.draft);
  const [page, setPage] = useState<ExperiencePageId>("home");
  const [busy, setBusy] = useState<"save" | "publish" | "restore" | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(record.draft);
  const validation = useMemo(() => parseSiteExperienceConfig(draft), [draft]);
  const current = draft[page];
  const persistenceReady = record.state === "ready";
  const persistenceNotice = record.state === "schema-missing"
    ? {
        title: "Prévia local — rascunho ainda não pode ser salvo.",
        text: "A migration 20260809220000_add_site_experience_studio.sql ainda não foi aplicada no banco. As alterações desta tela não serão mantidas ao sair.",
      }
    : record.state === "mfa-required"
      ? {
          title: "Confirmação de segurança necessária.",
          text: "Conclua a autenticação em dois fatores da conta administrativa antes de salvar ou publicar.",
        }
      : {
          title: "Armazenamento do Estúdio indisponível.",
          text: "A prévia continua funcionando, mas nenhum rascunho será salvo enquanto a conexão não for restabelecida.",
        };

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);

  function updateContent(key: string, value: string) {
    setDraft((previous) => ({
      ...previous,
      [page]: {
        ...previous[page],
        content: { ...previous[page].content, [key]: value },
      },
    } as SiteExperienceConfig));
    setNotice(null);
  }

  function updateTheme(key: keyof SiteExperienceConfig["home"]["theme"], value: string) {
    setDraft((previous) => ({
      ...previous,
      [page]: { ...previous[page], theme: { ...previous[page].theme, [key]: value } },
    } as SiteExperienceConfig));
    setNotice(null);
  }

  function updateDensity(value: "off" | "light" | "standard") {
    setDraft((previous) => ({
      ...previous,
      [page]: {
        ...previous[page],
        effects: {
          ...previous[page].effects,
          density: value,
          families: value === "off" ? [] : previous[page].effects.families.length
            ? previous[page].effects.families
            : ["embers"],
        },
      },
    } as SiteExperienceConfig));
    setNotice(null);
  }

  function toggleEffect(family: ExperienceEffectFamily) {
    const active = current.effects.families.includes(family);
    const next = active
      ? current.effects.families.filter((item) => item !== family)
      : [...current.effects.families, family].slice(-2);
    setDraft((previous) => ({
      ...previous,
      [page]: {
        ...previous[page],
        effects: {
          density: next.length ? (previous[page].effects.density === "off" ? "light" : previous[page].effects.density) : "off",
          families: next,
        },
      },
    } as SiteExperienceConfig));
    setNotice(null);
  }

  async function saveDraft() {
    if (!dirty || !validation.ok || !persistenceReady) return;
    setBusy("save");
    setNotice(null);
    try {
      const result = await readApi(await fetch("/api/admin/site-experience/draft", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          config: draft,
          expectedDraftRevision: record.draftRevision,
          expectedPublishedRevision: record.publishedRevision,
        }),
      }));
      const nextRevision = Number(result.draftRevision);
      setRecord((previous) => ({
        ...previous,
        draft,
        draftRevision: nextRevision,
        basePublishedRevision: Number(result.basePublishedRevision),
        updatedAt: typeof result.updatedAt === "string" ? result.updatedAt : previous.updatedAt,
      }));
      setNotice({ tone: "ok", text: "Rascunho salvo. O site público não mudou." });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível salvar." });
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (dirty || !validation.ok || record.state !== "ready") return;
    if (!window.confirm("Publicar este rascunho na Home, Conta e Slot? Produtos, preços e checkout não serão alterados.")) return;
    setBusy("publish");
    setNotice(null);
    try {
      const result = await readApi(await fetch("/api/admin/site-experience/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedDraftRevision: record.draftRevision,
          expectedPublishedRevision: record.publishedRevision,
        }),
      }));
      const publishedRevision = Number(result.publishedRevision);
      const draftRevision = Number(result.draftRevision);
      setRecord((previous) => ({
        ...previous,
        published: draft,
        draft,
        publishedRevision,
        draftRevision,
        basePublishedRevision: publishedRevision,
      }));
      setNotice({ tone: "ok", text: "Publicação concluída com histórico preservado." });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível publicar." });
    } finally {
      setBusy(null);
    }
  }

  async function restore(revision: number) {
    if (dirty || busy) return;
    setBusy("restore");
    try {
      const result = await readApi(await fetch("/api/admin/site-experience/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ revision, expectedDraftRevision: record.draftRevision, expectedPublishedRevision: record.publishedRevision }),
      }));
      const restored = result.draft;
      const parsed = parseSiteExperienceConfig(restored);
      if (!parsed.ok) throw new Error("A revisão restaurada não é válida.");
      setDraft(parsed.value);
      setRecord((previous) => ({ ...previous, draft: parsed.value, draftRevision: Number(result.draftRevision), basePublishedRevision: Number(result.basePublishedRevision) }));
      setNotice({ tone: "info", text: `Revisão #${revision} restaurada como rascunho. Revise antes de publicar.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível restaurar." });
    } finally {
      setBusy(null);
    }
  }

  const contentRecord = current.content as unknown as Record<string, string>;

  return (
    <main className="admin-content-page admin-experience-page">
      <header className="admin-content-topbar">
        <Link href="/admin" className="admin-topbar__brand"><span>6</span><div><strong>6DNX</strong><small>Central de comando</small></div></Link>
        <div className="admin-content-topbar__actions"><Link href="/" target="_blank">Ver site ↗</Link><span>{userEmail}</span></div>
      </header>

      <section className="admin-content-workspace">
        <header className="admin-content-heading">
          <div><span className="admin-kicker">Edição protegida</span><h1>Estúdio Visual 6DNX</h1><p>Conteúdo, cores, fontes e partículas com rascunho, prévia e publicação separada.</p></div>
          <div className="admin-content-heading__actions">
            <Link href="/admin" className="admin-secondary-button">Voltar ao painel</Link>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={saveDraft}
              disabled={!dirty || !validation.ok || Boolean(busy) || !persistenceReady}
              aria-describedby={!persistenceReady ? "admin-experience-persistence-notice" : undefined}
              title={!persistenceReady ? persistenceNotice.title : undefined}
            >
              {busy === "save" ? "Salvando…" : persistenceReady ? "Salvar rascunho" : "Salvar indisponível"}
            </button>
            <button type="button" className="admin-primary-button" onClick={publish} disabled={dirty || !validation.ok || Boolean(busy) || record.state !== "ready"}>{busy === "publish" ? "Publicando…" : "Publicar"}</button>
          </div>
        </header>

        {!persistenceReady ? <div id="admin-experience-persistence-notice" className="admin-notice admin-notice--info" role="status"><span>i</span><p><strong>{persistenceNotice.title}</strong><br />{persistenceNotice.text}</p></div> : null}
        {dirty && !persistenceReady ? <div className="admin-notice admin-notice--warning" role="status"><span>!</span><p><strong>Alterações somente na prévia.</strong><br />Você pode conferir o visual à direita, mas voltar ao painel ou recarregar a página descartará estas mudanças.</p></div> : null}
        {notice ? <div className={`admin-notice admin-notice--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}><span>{notice.tone === "ok" ? "✓" : notice.tone === "error" ? "!" : "i"}</span><p>{notice.text}</p></div> : null}
        {!validation.ok ? <div className="admin-notice admin-notice--error"><span>!</span><p><strong>Publicação bloqueada por segurança.</strong><br />{validation.errors.slice(0, 4).join(" ")}</p></div> : null}

        <nav className="admin-experience-tabs" aria-label="Páginas do Estúdio">
          {(Object.keys(PAGE_LABELS) as ExperiencePageId[]).map((item) => <button type="button" key={item} className={page === item ? "is-active" : ""} onClick={() => setPage(item)}>{PAGE_LABELS[item]}</button>)}
        </nav>

        <div className="admin-experience-layout">
          <div className="admin-experience-form">
            <section className="admin-form-section"><div className="admin-section-heading"><div><span className="admin-kicker">Conteúdo</span><h2>Textos seguros</h2><p>Texto simples, limites de tamanho e nenhum HTML ou script.</p></div></div><div className="admin-form-grid">
              {PAGE_FIELDS[page].map((field) => <label className="admin-field admin-field--wide" key={field.key}><span>{field.label}</span>{field.multiline ? <textarea rows={3} maxLength={field.maxLength} value={contentRecord[field.key] ?? ""} onChange={(event) => updateContent(field.key, event.target.value)} /> : <input maxLength={field.maxLength} value={contentRecord[field.key] ?? ""} onChange={(event) => updateContent(field.key, event.target.value)} />}<small>{(contentRecord[field.key] ?? "").length}/{field.maxLength}</small></label>)}
            </div></section>

            <section className="admin-form-section"><div className="admin-section-heading"><div><span className="admin-kicker">Aparência</span><h2>Paleta e tipografia</h2><p>Somente cores hexadecimais e fontes locais aprovadas.</p></div></div><div className="admin-experience-colors">
              {(["backgroundColor", "surfaceColor", "accentColor", "headingColor", "bodyColor"] as const).map((key) => <label key={key}><span>{({ backgroundColor: "Fundo", surfaceColor: "Superfície", accentColor: "Destaque", headingColor: "Títulos", bodyColor: "Texto" })[key]}</span><input type="color" value={current.theme[key]} onChange={(event) => updateTheme(key, event.target.value.toUpperCase())} /><code>{current.theme[key]}</code></label>)}
            </div><div className="admin-form-grid"><label className="admin-field"><span>Fonte dos títulos</span><select value={current.theme.displayFont} onChange={(event) => updateTheme("displayFont", event.target.value)}><option value="archivo-black">Archivo Black</option><option value="manrope">Manrope</option></select></label><label className="admin-field"><span>Fonte dos textos</span><select value={current.theme.bodyFont} onChange={(event) => updateTheme("bodyFont", event.target.value)}><option value="manrope">Manrope</option><option value="archivo-black">Archivo Black</option></select></label></div></section>

            <section className="admin-form-section"><div className="admin-section-heading"><div><span className="admin-kicker">Efeitos limitados</span><h2>Partículas de fundo</h2><p>Máximo de duas famílias. Até 24 elementos no desktop, 10 no celular e zero com movimento reduzido.</p></div></div><div className="admin-form-grid"><label className="admin-field"><span>Densidade</span><select value={current.effects.density} onChange={(event) => updateDensity(event.target.value as "off" | "light" | "standard")}><option value="off">Desligado</option><option value="light">Leve</option><option value="standard">Padrão seguro</option></select></label></div><div className="admin-effect-options">{EXPERIENCE_EFFECT_FAMILIES.map((family) => <button type="button" key={family} className={current.effects.families.includes(family) ? "is-active" : ""} onClick={() => toggleEffect(family)}>{EFFECT_LABELS[family]}</button>)}</div></section>
          </div>

          <aside className="admin-experience-preview" style={experienceThemeStyle(current.theme)}>
            <SiteAtmosphere effects={current.effects} />
            <div><span>PRÉVIA · {PAGE_LABELS[page]}</span><h2>{contentRecord[PAGE_FIELDS[page][0].key]}</h2><p>{contentRecord[PAGE_FIELDS[page].find((field) => field.multiline)?.key ?? PAGE_FIELDS[page][1].key]}</p><button type="button">{page === "home" ? contentRecord.heroCtaLabel : page === "slot" ? contentRecord.primaryAction : "Continuar"}</button><small>Produtos, preços, checkout, saldos e regras da Slot são campos protegidos.</small></div>
          </aside>
        </div>

        {record.history.length ? <section className="admin-form-section"><div className="admin-section-heading"><div><span className="admin-kicker">Histórico</span><h2>Publicações anteriores</h2><p>Restaurar cria um novo rascunho; nunca altera o público imediatamente.</p></div></div><div className="admin-experience-history">{record.history.map((item) => <button type="button" key={item.revision} disabled={dirty || Boolean(busy)} onClick={() => restore(item.revision)}><strong>Revisão #{item.revision}</strong><span>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.publishedAt))}</span></button>)}</div></section> : null}
      </section>
    </main>
  );
}
