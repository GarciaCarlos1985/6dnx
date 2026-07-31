"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CatalogAdminItem,
  CatalogBootstrapState,
  CatalogMutation,
  CatalogRevision,
} from "@/lib/catalog/types";
import type { Product, ProductFeature, Variant } from "@/lib/products";
import { PINNED_CATALOG_KEYS } from "@/lib/product-catalog-layout";

type EditorTab =
  | "basic"
  | "visual"
  | "content"
  | "variants"
  | "publication";

const tabs: Array<{
  id: EditorTab;
  number: string;
  label: string;
  hint: string;
}> = [
  { id: "basic", number: "01", label: "Básico", hint: "Nome e resumo" },
  { id: "visual", number: "02", label: "Visual", hint: "Imagem e cores" },
  { id: "content", number: "03", label: "Conteúdo", hint: "Detalhes e vídeo" },
  {
    id: "variants",
    number: "04",
    label: "Variações",
    hint: "Planos e valores",
  },
  {
    id: "publication",
    number: "05",
    label: "Publicação",
    hint: "Revisar e salvar",
  },
];

const defaultTheme = {
  accentColor: "#e3062c",
  textColor: "#f7f3f4",
  surfaceColor: "#0b0708",
};

function cloneItem(item: CatalogAdminItem) {
  return structuredClone(item);
}

function fingerprint(item: CatalogAdminItem | null) {
  if (!item) return "";
  return JSON.stringify({
    product: item.product,
    publicationState: item.publicationState,
    catalogOrder: item.catalogOrder,
    revision: item.revision,
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .toLowerCase();
}

async function readApi<T>(response: Response) {
  const payload = (await response.json()) as T & {
    error?: string;
    errors?: string[];
  };
  if (!response.ok) {
    const detail = payload.errors?.length
      ? `${payload.error ?? "Revise os campos"}\n• ${payload.errors.join("\n• ")}`
      : payload.error;
    throw new Error(detail || "A operação não pôde ser concluída.");
  }
  return payload;
}

function ProductPreview({ item }: { item: CatalogAdminItem }) {
  const { product } = item;
  const accent = product.theme?.accentColor ?? defaultTheme.accentColor;
  const text = product.theme?.textColor ?? defaultTheme.textColor;
  const surface = product.theme?.surfaceColor ?? defaultTheme.surfaceColor;
  const prices = product.variants
    .map((variant) => variant.priceBRL)
    .filter((value): value is number => typeof value === "number");
  const from = prices.length ? Math.min(...prices) : null;

  return (
    <article
      className="admin-product-preview"
      style={
        {
          "--admin-card-accent": accent,
          "--admin-card-text": text,
          "--admin-card-surface": surface,
        } as React.CSSProperties
      }
    >
      <div
        className="admin-product-preview__image"
        style={{ backgroundImage: `url("${product.image.replaceAll('"', "%22")}")` }}
        role="img"
        aria-label={`Prévia da imagem de ${product.title}`}
      >
        <span className="admin-product-preview__scan" aria-hidden />
        <span className="admin-product-preview__status">
          {product.status === "available" ? "Disponível" : "Sob medida"}
        </span>
        <span className="admin-product-preview__count">
          {product.variants.length}{" "}
          {product.variants.length === 1 ? "variação" : "variações"}
        </span>
        <strong>{product.category || "Categoria"}</strong>
      </div>
      <div className="admin-product-preview__body">
        <span className="admin-product-preview__eyebrow">
          6DNX // prévia ao vivo
        </span>
        <h3>{product.title || "Título do produto"}</h3>
        <p>{product.tagline || "Uma frase curta aparecerá aqui."}</p>
        <div className="admin-product-preview__tags">
          {product.variants.slice(0, 4).map((variant, index) => (
            <span key={`${variant.name}-${index}`}>
              {variant.name || "Sem nome"}
            </span>
          ))}
          {product.variants.length > 4 ? (
            <span>+{product.variants.length - 4}</span>
          ) : null}
        </div>
        <p className="admin-product-preview__price">
          {from === null ? (
            "Preço sob consulta"
          ) : (
            <>
              Referência a partir de
              <strong>
                {from.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </>
          )}
        </p>
        <span className="admin-product-preview__button">Ver detalhes</span>
      </div>
    </article>
  );
}

function FeatureEditor({
  title,
  hint,
  items,
  onChange,
}: {
  title: string;
  hint: string;
  items: ProductFeature[];
  onChange: (items: ProductFeature[]) => void;
}) {
  const update = (
    index: number,
    key: keyof ProductFeature,
    value: string,
  ) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  return (
    <div className="admin-list-editor">
      <div className="admin-section-heading admin-section-heading--compact">
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...items, { label: "", value: "" }])}
        >
          + Adicionar
        </button>
      </div>
      {items.length ? (
        <div className="admin-list-editor__rows">
          {items.map((item, index) => (
            <div className="admin-list-editor__row" key={`${title}-${index}`}>
              <span className="admin-list-editor__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <input
                aria-label={`${title}: nome do item ${index + 1}`}
                value={item.label}
                placeholder="Nome"
                onChange={(event) => update(index, "label", event.target.value)}
              />
              <input
                aria-label={`${title}: valor do item ${index + 1}`}
                value={item.value}
                placeholder="Informação"
                onChange={(event) => update(index, "value", event.target.value)}
              />
              <button
                className="admin-icon-button"
                type="button"
                aria-label={`Remover item ${index + 1}`}
                onClick={() =>
                  onChange(items.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="admin-empty-inline">
          Nenhum item. Use “Adicionar” quando precisar.
        </p>
      )}
    </div>
  );
}

function VariantEditor({
  variants,
  onChange,
}: {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}) {
  const update = (index: number, patch: Partial<Variant>) => {
    const next = [...variants];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="admin-variant-editor">
      <div className="admin-section-heading">
        <div>
          <span className="admin-kicker">Planos comerciais</span>
          <h2>Variações e preços</h2>
          <p>
            Cada linha vira uma opção dentro do card. Produtos sem preço podem
            ficar “sob consulta”.
          </p>
        </div>
        <button
          type="button"
          className="admin-secondary-button"
          onClick={() =>
            onChange([
              ...variants,
              { name: `Nova opção ${variants.length + 1}` },
            ])
          }
        >
          + Nova variação
        </button>
      </div>

      {variants.length ? (
        <div className="admin-variant-editor__rows">
          {variants.map((variant, index) => (
            <fieldset key={`variant-${index}`}>
              <legend>Opção {String(index + 1).padStart(2, "0")}</legend>
              <label className="admin-field">
                <span>Nome da opção</span>
                <input
                  value={variant.name}
                  onChange={(event) =>
                    update(index, { name: event.target.value })
                  }
                  placeholder="Ex.: 30 dias"
                />
              </label>
              <label className="admin-field">
                <span>Preço em reais</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={variant.priceBRL ?? ""}
                  onChange={(event) =>
                    update(index, {
                      priceBRL:
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                    })
                  }
                  placeholder="Deixe vazio para sob consulta"
                />
              </label>
              <label className="admin-field">
                <span>Observação</span>
                <input
                  value={variant.note ?? ""}
                  onChange={(event) =>
                    update(index, { note: event.target.value || undefined })
                  }
                  placeholder="Ex.: Lifetime"
                />
              </label>
              <label className="admin-field">
                <span>Selo opcional</span>
                <input
                  value={variant.badge ?? ""}
                  onChange={(event) =>
                    update(index, { badge: event.target.value || undefined })
                  }
                  placeholder="Ex.: Mais vendido"
                />
              </label>
              <button
                type="button"
                className="admin-danger-link"
                onClick={() =>
                  onChange(
                    variants.filter(
                      (_, variantIndex) => variantIndex !== index,
                    ),
                  )
                }
              >
                Remover esta opção
              </button>
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="admin-empty-state admin-empty-state--compact">
          <strong>Este produto está sem variações.</strong>
          <p>Ele aparecerá como “Preço sob consulta” no site.</p>
        </div>
      )}
    </div>
  );
}

export function AdminDashboard({
  initialItems,
  initialState,
  initialMessage,
  user,
  demoMode = false,
}: {
  initialItems: CatalogAdminItem[];
  initialState: CatalogBootstrapState;
  initialMessage?: string;
  user: { id: string; email: string; role: "admin" };
  demoMode?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [catalogState, setCatalogState] = useState(initialState);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? null);
  const [draft, setDraft] = useState<CatalogAdminItem | null>(
    initialItems[0] ? cloneItem(initialItems[0]) : null,
  );
  const [savedFingerprint, setSavedFingerprint] = useState(
    fingerprint(initialItems[0] ?? null),
  );
  const [tab, setTab] = useState<EditorTab>("basic");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(initialMessage ?? "");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error" | "info">(
    initialMessage ? "error" : "info",
  );
  const [changeNote, setChangeNote] = useState("");
  const [revisions, setRevisions] = useState<CatalogRevision[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dirty = Boolean(draft && fingerprint(draft) !== savedFingerprint);
  const pinnedProduct = Boolean(
    draft && PINNED_CATALOG_KEYS.includes(draft.sourceKey),
  );
  const publishedCount = items.filter(
    (item) => item.publicationState === "published",
  ).length;
  const draftCount = items.filter(
    (item) => item.publicationState === "draft",
  ).length;

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => {
      const matchesState =
        stateFilter === "all" || item.publicationState === stateFilter;
      const matchesQuery =
        !normalized ||
        [
          item.product.title,
          item.product.category,
          item.product.slug,
        ].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalized),
        );
      return matchesState && matchesQuery;
    });
  }, [items, query, stateFilter]);

  useEffect(() => {
    const protectUnsavedWork = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", protectUnsavedWork);
    return () => window.removeEventListener("beforeunload", protectUnsavedWork);
  }, [dirty]);

  const announce = (
    message: string,
    tone: "ok" | "error" | "info" = "info",
  ) => {
    setNotice(message);
    setNoticeTone(tone);
  };

  const selectItem = (item: CatalogAdminItem) => {
    if (
      dirty &&
      !window.confirm(
        "Há alterações que ainda não foram salvas. Deseja descartá-las?",
      )
    ) {
      return;
    }
    const next = cloneItem(item);
    setSelectedId(item.id);
    setDraft(next);
    setSavedFingerprint(fingerprint(next));
    setTab("basic");
    setChangeNote("");
    setHistoryOpen(false);
    setNotice("");
  };

  const updateProduct = <K extends keyof Product>(
    key: K,
    value: Product[K],
  ) => {
    setDraft((current) =>
      current
        ? { ...current, product: { ...current.product, [key]: value } }
        : current,
    );
  };

  const save = async () => {
    if (!draft || demoMode || busy) return;
    setBusy("save");
    setNotice("");
    const mutation: CatalogMutation = {
      product: draft.product,
      publicationState: draft.publicationState,
      catalogOrder: draft.catalogOrder,
      expectedRevision: draft.revision,
      changeNote:
        changeNote.trim() ||
        `Edição pelo painel: ${tabs.find((item) => item.id === tab)?.label}`,
    };

    try {
      const payload = await readApi<{ item: CatalogAdminItem }>(
        await fetch(`/api/admin/products/${encodeURIComponent(draft.id)}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(mutation),
        }),
      );
      setItems((current) =>
        current.map((item) => (item.id === payload.item.id ? payload.item : item)),
      );
      setDraft(cloneItem(payload.item));
      setSavedFingerprint(fingerprint(payload.item));
      setChangeNote("");
      announce("Alterações salvas com segurança.", "ok");
      router.refresh();
    } catch (reason) {
      announce(
        reason instanceof Error ? reason.message : "Não foi possível salvar.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };

  const createFrom = async (source?: CatalogAdminItem) => {
    if (demoMode || busy) return;
    if (dirty && !window.confirm("Descartar alterações ainda não salvas?")) {
      return;
    }

    const suffix = Date.now().toString(36).slice(-5);
    const baseProduct: Product = source
      ? {
          ...structuredClone(source.product),
          catalogKey: undefined,
          slug: `${slugify(source.product.slug)}-copia-${suffix}`,
          title: `${source.product.title} — cópia`,
        }
      : {
          slug: `novo-produto-${suffix}`,
          title: "Novo produto",
          category: "Geral",
          tagline: "Escreva uma frase curta sobre este produto",
          description: "",
          image: "/products/card-art/game-setup-pro-6dnx.webp",
          status: "custom",
          variants: [],
          videoOrientation: "landscape",
          theme: defaultTheme,
        };
    const mutation: CatalogMutation = {
      product: baseProduct,
      publicationState: "draft",
      catalogOrder:
        items.reduce((highest, item) => Math.max(highest, item.catalogOrder), 0) +
        1,
      changeNote: source
        ? `Cópia criada a partir de ${source.product.title}`
        : "Produto criado pelo painel",
    };

    setBusy("create");
    try {
      const payload = await readApi<{ item: CatalogAdminItem }>(
        await fetch("/api/admin/products", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(mutation),
        }),
      );
      setItems((current) => [...current, payload.item]);
      setCatalogState("ready");
      selectItem(payload.item);
      announce(
        source
          ? "Cópia criada como rascunho."
          : "Novo produto criado como rascunho.",
        "ok",
      );
    } catch (reason) {
      announce(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar o produto.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };

  const bootstrap = async () => {
    if (demoMode || busy) return;
    setBusy("bootstrap");
    try {
      const payload = await readApi<{ items: CatalogAdminItem[] }>(
        await fetch("/api/admin/catalog/bootstrap", { method: "POST" }),
      );
      setItems(payload.items);
      setCatalogState("ready");
      const first = payload.items[0] ?? null;
      setSelectedId(first?.id ?? null);
      setDraft(first ? cloneItem(first) : null);
      setSavedFingerprint(fingerprint(first));
      announce(
        `${payload.items.length} produtos importados. O painel está pronto.`,
        "ok",
      );
    } catch (reason) {
      announce(
        reason instanceof Error
          ? reason.message
          : "Não foi possível importar o catálogo.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };

  const uploadImage = async (file: File) => {
    if (!draft || demoMode || busy) return;
    setBusy("upload");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("sourceKey", draft.sourceKey);
      const payload = await readApi<{ url: string }>(
        await fetch("/api/admin/assets", { method: "POST", body: form }),
      );
      updateProduct("image", payload.url);
      announce(
        "Imagem enviada. Clique em “Salvar alterações” para publicar a troca.",
        "ok",
      );
    } catch (reason) {
      announce(
        reason instanceof Error ? reason.message : "Falha ao enviar a imagem.",
        "error",
      );
    } finally {
      setBusy("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openHistory = async () => {
    if (!draft || demoMode || busy) return;
    setBusy("history");
    try {
      const payload = await readApi<{ revisions: CatalogRevision[] }>(
        await fetch(
          `/api/admin/products/${encodeURIComponent(draft.id)}/revisions`,
          { cache: "no-store" },
        ),
      );
      setRevisions(payload.revisions);
      setHistoryOpen(true);
    } catch (reason) {
      announce(
        reason instanceof Error
          ? reason.message
          : "Não foi possível abrir o histórico.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };

  const restore = async (revision: CatalogRevision) => {
    if (!draft || demoMode || busy) return;
    if (
      !window.confirm(
        `Restaurar a revisão ${revision.revision}? A versão atual continuará guardada no histórico.`,
      )
    ) {
      return;
    }

    setBusy("restore");
    try {
      const payload = await readApi<{ item: CatalogAdminItem }>(
        await fetch(
          `/api/admin/products/${encodeURIComponent(draft.id)}/revisions`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              revisionId: revision.id,
              expectedRevision: draft.revision,
            }),
          },
        ),
      );
      setItems((current) =>
        current.map((item) => (item.id === payload.item.id ? payload.item : item)),
      );
      setDraft(cloneItem(payload.item));
      setSavedFingerprint(fingerprint(payload.item));
      setHistoryOpen(false);
      announce(`Revisão ${revision.revision} restaurada.`, "ok");
    } catch (reason) {
      announce(
        reason instanceof Error
          ? reason.message
          : "Não foi possível restaurar a revisão.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };

  const logout = async () => {
    if (dirty && !window.confirm("Sair e descartar alterações não salvas?")) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  if (catalogState === "schema-missing" || catalogState === "unavailable") {
    return (
      <main className="admin-setup">
        <Link href="/" className="admin-login__back">
          ← Voltar ao site
        </Link>
        <section className="admin-setup__card">
          <span className="admin-kicker">Configuração necessária</span>
          <h1>O painel está pronto. Falta preparar o banco.</h1>
          <p>
            Nenhuma alteração foi feita no Supabase. Para manter a segurança,
            a migração precisa ser revisada e aplicada manualmente antes do
            primeiro uso.
          </p>
          <ol>
            <li>
              Revise{" "}
              <code>
                supabase/migrations/20260731090000_create_product_catalog_admin.sql
              </code>
            </li>
            <li>Aplique primeiro em uma branch isolada do Supabase.</li>
            <li>Crie a conta administrativa seguindo docs/ADMIN.md.</li>
            <li>Retorne ao painel e importe o catálogo atual.</li>
          </ol>
          {initialMessage ? (
            <details>
              <summary>Diagnóstico técnico</summary>
              <code>{initialMessage}</code>
            </details>
          ) : null}
          <div className="admin-setup__actions">
            <a className="admin-primary-button" href="/admin/demo">
              Ver demonstração local
            </a>
            <button className="admin-secondary-button" onClick={logout}>
              Sair
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (catalogState === "empty") {
    return (
      <main className="admin-setup">
        <Link href="/" className="admin-login__back">
          ← Voltar ao site
        </Link>
        <section className="admin-setup__card">
          <span className="admin-kicker">Primeira inicialização</span>
          <h1>Leve o catálogo atual para o painel.</h1>
          <p>
            A importação copia os produtos existentes para o Supabase sem
            apagar o arquivo original. O site continua com fallback automático.
          </p>
          <div className="admin-setup__facts">
            <span>
              <strong>Reversível</strong>
              O catálogo estático permanece intacto
            </span>
            <span>
              <strong>Publicado</strong>
              Os produtos entram visíveis como estão hoje
            </span>
            <span>
              <strong>Protegido</strong>
              Somente administradores podem editar
            </span>
          </div>
          {notice ? (
            <p className={`admin-notice admin-notice--${noticeTone}`}>
              {notice}
            </p>
          ) : null}
          <button
            className="admin-primary-button admin-primary-button--wide"
            onClick={bootstrap}
            disabled={Boolean(busy)}
          >
            {busy === "bootstrap"
              ? "Importando com segurança…"
              : "Importar catálogo atual"}
          </button>
          <button className="admin-text-button" onClick={logout}>
            Sair do painel
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link href="/" className="admin-topbar__brand" aria-label="Ir para o site">
          <span>6</span>
          <div>
            <strong>6DNX</strong>
            <small>Central de comando</small>
          </div>
        </Link>
        <div className="admin-topbar__health">
          <i aria-hidden />
          <span>
            Catálogo operacional
            <small>
              {publishedCount} publicados · {draftCount} rascunhos
            </small>
          </span>
        </div>
        <div className="admin-topbar__actions">
          {demoMode ? <span className="admin-demo-badge">Modo demonstração</span> : null}
          <Link href="/" target="_blank" rel="noreferrer">
            Ver site <span aria-hidden>↗</span>
          </Link>
          <button type="button" onClick={logout}>
            Sair
          </button>
          <span className="admin-avatar" aria-hidden>
            {user.email.slice(0, 1).toUpperCase()}
          </span>
        </div>
      </header>

      <aside className="admin-sidebar">
        <div className="admin-sidebar__heading">
          <div>
            <span className="admin-kicker">Catálogo</span>
            <h2>Produtos</h2>
          </div>
          <button
            type="button"
            aria-label="Criar novo produto"
            onClick={() => createFrom()}
            disabled={demoMode || Boolean(busy)}
          >
            +
          </button>
        </div>
        <label className="admin-search">
          <span aria-hidden>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar produto…"
          />
        </label>
        <div className="admin-filter-row" aria-label="Filtrar produtos">
          {[
            ["all", "Todos"],
            ["published", "No ar"],
            ["draft", "Rascunhos"],
            ["archived", "Arquivo"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={stateFilter === value ? "is-active" : ""}
              onClick={() => setStateFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <nav className="admin-product-list" aria-label="Lista de produtos">
          {filteredItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={selectedId === item.id ? "is-active" : ""}
              onClick={() => selectItem(item)}
            >
              <span
                className="admin-product-list__thumb"
                style={{
                  backgroundImage: `url("${item.product.image.replaceAll('"', "%22")}")`,
                }}
                aria-hidden
              />
              <span>
                <strong>{item.product.title}</strong>
                <small>{item.product.category}</small>
              </span>
              <i
                className={`admin-state-dot admin-state-dot--${item.publicationState}`}
                title={item.publicationState}
              />
            </button>
          ))}
          {!filteredItems.length ? (
            <p className="admin-product-list__empty">
              Nenhum produto combina com este filtro.
            </p>
          ) : null}
        </nav>
        <button
          type="button"
          className="admin-sidebar__create"
          onClick={() => createFrom()}
          disabled={demoMode || Boolean(busy)}
        >
          <span>+</span>
          <p>
            <strong>Novo produto</strong>
            <small>Começa como rascunho</small>
          </p>
        </button>
      </aside>

      {draft ? (
        <>
          <section className="admin-workspace">
            <header className="admin-editor-header">
              <div>
                <span className="admin-breadcrumb">
                  Produtos <b>/</b> {draft.product.title}
                </span>
                <div className="admin-editor-header__title">
                  <h1>{draft.product.title}</h1>
                  <span
                    className={`admin-publication-chip admin-publication-chip--${draft.publicationState}`}
                  >
                    {draft.publicationState === "published"
                      ? "Publicado"
                      : draft.publicationState === "archived"
                        ? "Arquivado"
                        : "Rascunho"}
                  </span>
                  {dirty ? (
                    <span className="admin-unsaved-chip">Não salvo</span>
                  ) : null}
                </div>
                <p>
                  Edite com calma. Nada muda no site até você salvar.
                </p>
              </div>
              <div className="admin-editor-header__actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => createFrom(draft)}
                  disabled={demoMode || Boolean(busy)}
                >
                  Duplicar
                </button>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={openHistory}
                  disabled={demoMode || Boolean(busy)}
                >
                  Histórico
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={save}
                  disabled={!dirty || demoMode || Boolean(busy)}
                >
                  {busy === "save" ? "Salvando…" : "Salvar alterações"}
                </button>
              </div>
            </header>

            {notice ? (
              <div
                className={`admin-notice admin-notice--${noticeTone}`}
                role={noticeTone === "error" ? "alert" : "status"}
              >
                <span>{noticeTone === "ok" ? "✓" : noticeTone === "error" ? "!" : "i"}</span>
                <p>{notice}</p>
                <button
                  type="button"
                  aria-label="Fechar aviso"
                  onClick={() => setNotice("")}
                >
                  ×
                </button>
              </div>
            ) : null}

            <nav className="admin-editor-tabs" aria-label="Etapas da edição">
              {tabs.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={tab === item.id ? "is-active" : ""}
                  onClick={() => setTab(item.id)}
                >
                  <span>{item.number}</span>
                  <p>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </p>
                </button>
              ))}
            </nav>

            <div className="admin-editor-body">
              {tab === "basic" ? (
                <section className="admin-form-section">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-kicker">Identidade do card</span>
                      <h2>Informações básicas</h2>
                      <p>
                        Comece pelo que o cliente vê primeiro. Textos curtos
                        deixam o card mais fácil de entender.
                      </p>
                    </div>
                    <span className="admin-help-pill">Etapa mais importante</span>
                  </div>
                  <div className="admin-form-grid">
                    <label className="admin-field admin-field--wide">
                      <span>Título do produto</span>
                      <input
                        value={draft.product.title}
                        maxLength={100}
                        onChange={(event) =>
                          updateProduct("title", event.target.value)
                        }
                      />
                      <small>{draft.product.title.length}/100 caracteres</small>
                    </label>
                    <label className="admin-field">
                      <span>Categoria</span>
                      <input
                        value={draft.product.category}
                        maxLength={80}
                        onChange={(event) =>
                          updateProduct("category", event.target.value)
                        }
                        placeholder="Ex.: DayZ"
                      />
                    </label>
                    <label className="admin-field">
                      <span>Status comercial</span>
                      <select
                        value={draft.product.status}
                        onChange={(event) =>
                          updateProduct(
                            "status",
                            event.target.value as Product["status"],
                          )
                        }
                      >
                        <option value="available">Disponível</option>
                        <option value="custom">Sob medida</option>
                      </select>
                    </label>
                    <label className="admin-field admin-field--wide">
                      <span>Frase curta do card</span>
                      <input
                        value={draft.product.tagline}
                        maxLength={160}
                        onChange={(event) =>
                          updateProduct("tagline", event.target.value)
                        }
                        placeholder="Explique o produto em uma frase"
                      />
                      <small>{draft.product.tagline.length}/160 caracteres</small>
                    </label>
                    <label className="admin-field admin-field--wide">
                      <span>Descrição completa</span>
                      <textarea
                        rows={7}
                        value={draft.product.description}
                        maxLength={4000}
                        onChange={(event) =>
                          updateProduct("description", event.target.value)
                        }
                        placeholder="Conte o que o produto oferece, para quem serve e o que o cliente precisa saber."
                      />
                      <small>
                        {draft.product.description.length}/4000 caracteres
                      </small>
                    </label>
                    <label className="admin-field admin-field--wide">
                      <span>Identificador de links (avançado)</span>
                      <div className="admin-route-field">
                        <code>ID</code>
                        <input
                          value={draft.product.slug}
                          maxLength={96}
                          onChange={(event) =>
                            updateProduct(
                              "slug",
                              event.target.value.replace(/\s+/g, "-"),
                            )
                          }
                        />
                      </div>
                      <small>
                        Usado nos links internos, checkout e suporte. Aceita
                        letras, números e hífens; a chave editorial permanece
                        intacta.
                      </small>
                    </label>
                  </div>
                </section>
              ) : null}

              {tab === "visual" ? (
                <section className="admin-form-section">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-kicker">Direção de arte</span>
                      <h2>Imagem e cores</h2>
                      <p>
                        A prévia ao lado mostra exatamente a intenção visual do
                        card antes de salvar.
                      </p>
                    </div>
                  </div>
                  <div className="admin-image-manager">
                    <div
                      className="admin-image-manager__preview"
                      style={{
                        backgroundImage: `url("${draft.product.image.replaceAll('"', "%22")}")`,
                      }}
                      aria-label="Imagem atual do produto"
                      role="img"
                    >
                      <span>Imagem atual</span>
                    </div>
                    <div>
                      <h3>Thumbnail do produto</h3>
                      <p>
                        Recomendado: WEBP ou AVIF, proporção 16:9 e até 5 MB.
                      </p>
                      <input
                        ref={fileInputRef}
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadImage(file);
                        }}
                      />
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={demoMode || Boolean(busy)}
                      >
                        {busy === "upload" ? "Enviando…" : "Substituir imagem"}
                      </button>
                      <label className="admin-field">
                        <span>Caminho atual</span>
                        <input
                          value={draft.product.image}
                          onChange={(event) =>
                            updateProduct("image", event.target.value)
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <div className="admin-color-grid">
                    <label className="admin-color-field">
                      <input
                        type="color"
                        value={
                          draft.product.theme?.accentColor ??
                          defaultTheme.accentColor
                        }
                        onChange={(event) =>
                          updateProduct("theme", {
                            ...(draft.product.theme ?? defaultTheme),
                            accentColor: event.target.value,
                          })
                        }
                      />
                      <span>
                        <strong>Cor de destaque</strong>
                        <small>Botões, contorno e pequenos detalhes</small>
                      </span>
                      <code>
                        {draft.product.theme?.accentColor ??
                          defaultTheme.accentColor}
                      </code>
                    </label>
                    <label className="admin-color-field">
                      <input
                        type="color"
                        value={
                          draft.product.theme?.surfaceColor ??
                          defaultTheme.surfaceColor
                        }
                        onChange={(event) =>
                          updateProduct("theme", {
                            ...(draft.product.theme ?? defaultTheme),
                            surfaceColor: event.target.value,
                          })
                        }
                      />
                      <span>
                        <strong>Fundo do card</strong>
                        <small>Superfície atrás das informações</small>
                      </span>
                      <code>
                        {draft.product.theme?.surfaceColor ??
                          defaultTheme.surfaceColor}
                      </code>
                    </label>
                    <label className="admin-color-field">
                      <input
                        type="color"
                        value={
                          draft.product.theme?.textColor ?? defaultTheme.textColor
                        }
                        onChange={(event) =>
                          updateProduct("theme", {
                            ...(draft.product.theme ?? defaultTheme),
                            textColor: event.target.value,
                          })
                        }
                      />
                      <span>
                        <strong>Cor do texto</strong>
                        <small>Título e informações principais</small>
                      </span>
                      <code>
                        {draft.product.theme?.textColor ?? defaultTheme.textColor}
                      </code>
                    </label>
                  </div>
                  <button
                    type="button"
                    className="admin-text-button"
                    onClick={() => updateProduct("theme", defaultTheme)}
                  >
                    Restaurar paleta padrão 6DNX
                  </button>
                </section>
              ) : null}

              {tab === "content" ? (
                <section className="admin-form-section">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-kicker">Popup de informações</span>
                      <h2>Conteúdo detalhado</h2>
                      <p>
                        Organize as informações em blocos. O painel cuida da
                        aparência e da rolagem.
                      </p>
                    </div>
                  </div>
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>ID do vídeo no YouTube</span>
                      <input
                        value={draft.product.youtubeId ?? ""}
                        maxLength={20}
                        onChange={(event) =>
                          updateProduct(
                            "youtubeId",
                            event.target.value || undefined,
                          )
                        }
                        placeholder="Ex.: BqPwa1SXowE"
                      />
                      <small>Cole somente o trecho final do link.</small>
                    </label>
                    <label className="admin-field">
                      <span>Formato do vídeo</span>
                      <select
                        value={draft.product.videoOrientation ?? "landscape"}
                        onChange={(event) =>
                          updateProduct(
                            "videoOrientation",
                            event.target
                              .value as Product["videoOrientation"],
                          )
                        }
                      >
                        <option value="landscape">Horizontal (16:9)</option>
                        <option value="portrait">Vertical (Shorts)</option>
                      </select>
                    </label>
                  </div>
                  <FeatureEditor
                    title="Recursos"
                    hint="Ex.: Drivers — Sim"
                    items={draft.product.features ?? []}
                    onChange={(value) => updateProduct("features", value)}
                  />
                  <FeatureEditor
                    title="Compatibilidade"
                    hint="Ex.: Sistema — Windows 11"
                    items={draft.product.systemSupport ?? []}
                    onChange={(value) => updateProduct("systemSupport", value)}
                  />
                  <FeatureEditor
                    title="Teclas do menu"
                    hint="Ex.: INSERT — abre o painel"
                    items={draft.product.menuKeys ?? []}
                    onChange={(value) => updateProduct("menuKeys", value)}
                  />
                  <label className="admin-field">
                    <span>Passos do tutorial</span>
                    <textarea
                      rows={9}
                      value={(draft.product.tutorialSteps ?? []).join("\n")}
                      onChange={(event) =>
                        updateProduct(
                          "tutorialSteps",
                          event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder={"Um passo por linha\nO painel numera automaticamente"}
                    />
                    <small>Use uma linha para cada passo.</small>
                  </label>
                </section>
              ) : null}

              {tab === "variants" ? (
                <VariantEditor
                  variants={draft.product.variants}
                  onChange={(value) => updateProduct("variants", value)}
                />
              ) : null}

              {tab === "publication" ? (
                <section className="admin-form-section">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-kicker">Controle editorial</span>
                      <h2>Revisar e publicar</h2>
                      <p>
                        Escolha onde o produto deve aparecer. Arquivar é
                        reversível e não apaga o histórico.
                      </p>
                    </div>
                  </div>
                  <div className="admin-publication-options">
                    {[
                      {
                        value: "draft",
                        title: "Rascunho",
                        text: "Fica salvo no painel, invisível no site.",
                      },
                      {
                        value: "published",
                        title: "Publicado",
                        text: "Aparece no catálogo público após salvar.",
                      },
                      {
                        value: "archived",
                        title: "Arquivado",
                        text: "Sai do site, mas continua recuperável.",
                      },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={
                          draft.publicationState === option.value
                            ? "is-active"
                            : ""
                        }
                      >
                        <input
                          type="radio"
                          name="publication"
                          value={option.value}
                          checked={draft.publicationState === option.value}
                          disabled={pinnedProduct && option.value !== "published"}
                          onChange={() =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    publicationState:
                                      option.value as CatalogAdminItem["publicationState"],
                                  }
                                : current,
                            )
                          }
                        />
                        <span aria-hidden />
                        <p>
                          <strong>{option.title}</strong>
                          <small>{option.text}</small>
                        </p>
                      </label>
                    ))}
                  </div>
                  {pinnedProduct ? (
                    <div className="admin-pinned-note">
                      <span aria-hidden>◆</span>
                      <p>
                        <strong>Produto fixo da navegação</strong>
                        Este card sustenta a página inicial ou a primeira página
                        à direita. Ele precisa permanecer publicado para o
                        carrossel manter a ordem aprovada.
                      </p>
                    </div>
                  ) : null}
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Ordem no catálogo</span>
                      <input
                        type="number"
                        min="0"
                        max="9999"
                        value={draft.catalogOrder}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  catalogOrder: Number(event.target.value),
                                }
                              : current,
                          )
                        }
                      />
                      <small>Números menores aparecem primeiro.</small>
                    </label>
                    <label className="admin-field">
                      <span>Nota desta alteração</span>
                      <input
                        maxLength={240}
                        value={changeNote}
                        onChange={(event) => setChangeNote(event.target.value)}
                        placeholder="Ex.: Atualizei imagem e preço de 30 dias"
                      />
                      <small>Ajuda a entender o histórico depois.</small>
                    </label>
                  </div>
                  <div className="admin-safety-check">
                    <span aria-hidden>✓</span>
                    <div>
                      <strong>Proteção contra erros ativada</strong>
                      <p>
                        A revisão {draft.revision} será preservada antes de
                        qualquer mudança. Se outra pessoa salvar primeiro, o
                        painel interrompe sua gravação e avisa.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="admin-primary-button admin-primary-button--wide"
                    onClick={save}
                    disabled={!dirty || demoMode || Boolean(busy)}
                  >
                    {busy === "save"
                      ? "Salvando com segurança…"
                      : draft.publicationState === "published"
                        ? "Salvar e manter publicado"
                        : draft.publicationState === "archived"
                          ? "Salvar e arquivar"
                          : "Salvar como rascunho"}
                  </button>
                </section>
              ) : null}
            </div>
          </section>

          <aside className="admin-preview-panel">
            <div className="admin-preview-panel__heading">
              <span>
                <i aria-hidden />
                Prévia ao vivo
              </span>
              <small>Desktop</small>
            </div>
            <ProductPreview item={draft} />
            <div className="admin-preview-panel__guidance">
              <span aria-hidden>◎</span>
              <p>
                <strong>Você está vendo uma simulação.</strong>
                O card público usa a mesma informação, preservando os efeitos e
                a responsividade do site.
              </p>
            </div>
            <dl className="admin-preview-panel__meta">
              <div>
                <dt>Identificador interno</dt>
                <dd>{draft.sourceKey}</dd>
              </div>
              <div>
                <dt>Revisão atual</dt>
                <dd>#{draft.revision}</dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(draft.updatedAt))}
                </dd>
              </div>
            </dl>
          </aside>
        </>
      ) : null}

      {historyOpen && draft ? (
        <div className="admin-history-backdrop" role="presentation">
          <section
            className="admin-history"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
          >
            <header>
              <div>
                <span className="admin-kicker">Linha do tempo</span>
                <h2 id="history-title">Histórico de {draft.product.title}</h2>
              </div>
              <button
                type="button"
                aria-label="Fechar histórico"
                onClick={() => setHistoryOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="admin-history__current">
              <span>Atual</span>
              <p>
                <strong>Revisão {draft.revision}</strong>
                <small>Esta é a versão que está sendo editada.</small>
              </p>
            </div>
            <div className="admin-history__list">
              {revisions.map((revision) => (
                <article key={revision.id}>
                  <span>#{revision.revision}</span>
                  <div>
                    <strong>{revision.snapshot.product.title}</strong>
                    <p>
                      {revision.changeNote || "Alteração sem nota"}
                    </p>
                    <small>
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(revision.createdAt))}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(revision)}
                    disabled={Boolean(busy)}
                  >
                    Restaurar
                  </button>
                </article>
              ))}
              {!revisions.length ? (
                <p className="admin-empty-inline">
                  O histórico aparecerá depois da primeira alteração salva.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
