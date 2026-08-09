"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CatalogOrderBoard } from "@/components/admin/catalog-order-board";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CatalogAdminItem,
  CatalogBootstrapState,
  CatalogMutation,
  CatalogRevision,
} from "@/lib/catalog/types";
import {
  isRustCloneCatalogKey,
  MAX_PRODUCT_DEMO_IMAGES,
  MAX_PRODUCT_VARIANTS,
  priceFrom,
  productStatusLabel,
  RUST_CLONE_COUNT,
  RUST_SOURCE_CATALOG_KEY,
  visibleProductVariants,
  type Product,
  type ProductFeature,
  type Variant,
} from "@/lib/products";

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
  { id: "visual", number: "02", label: "Visual", hint: "Imagem protegida" },
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
    label: "Revisão",
    hint: "Conferir e salvar",
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
  const visibleVariants = visibleProductVariants(product);
  const from = priceFrom(product);

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
          {productStatusLabel(product.status)}
        </span>
        <span className="admin-product-preview__count">
          {visibleVariants.length}{" "}
          {visibleVariants.length === 1 ? "variação" : "variações"}
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
          {visibleVariants.slice(0, 4).map((variant, index) => (
            <span
              key={`${variant.name}-${index}`}
              style={
                variant.accentColor
                  ? { borderColor: variant.accentColor, color: variant.accentColor }
                  : undefined
              }
            >
              {variant.name || "Sem nome"}
              {variant.availability === "sold-out" ? " · Esgotado" : ""}
            </span>
          ))}
          {visibleVariants.length > 4 ? (
            <span>+{visibleVariants.length - 4}</span>
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

function uniqueVariantName(variants: Variant[], seed = "Nova opção") {
  const existing = new Set(
    variants.map((variant) => variant.name.trim().toLocaleLowerCase("pt-BR")),
  );
  if (!existing.has(seed.toLocaleLowerCase("pt-BR"))) return seed;
  for (let suffix = 2; suffix <= MAX_PRODUCT_VARIANTS + 1; suffix += 1) {
    const candidate = `${seed} ${suffix}`;
    if (!existing.has(candidate.toLocaleLowerCase("pt-BR"))) return candidate;
  }
  return `${seed} ${Date.now()}`;
}

function VariantEditor({
  variants,
  productStatus,
  onChange,
  onProductStatusChange,
}: {
  variants: Variant[];
  productStatus: Product["status"];
  onChange: (variants: Variant[]) => void;
  onProductStatusChange: (status: Product["status"]) => void;
}) {
  const lastActiveStatus = useRef<"available" | "custom">(
    productStatus === "custom" ? "custom" : "available",
  );

  useEffect(() => {
    if (productStatus !== "sold-out") lastActiveStatus.current = productStatus;
  }, [productStatus]);

  const update = (index: number, patch: Partial<Variant>) => {
    const next = [...variants];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const add = (source?: Variant) => {
    if (variants.length >= MAX_PRODUCT_VARIANTS) return;
    const seed = source ? `${source.name} cópia` : "Nova opção";
    const next: Variant = source
      ? {
          ...structuredClone(source),
          name: uniqueVariantName(variants, seed),
          highlighted: undefined,
        }
      : {
          name: uniqueVariantName(variants),
          availability: "available",
        };
    onChange([...variants, next]);
  };

  const move = (index: number, offset: -1 | 1) => {
    const destination = index + offset;
    if (destination < 0 || destination >= variants.length) return;
    const next = [...variants];
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange(next);
  };

  const remove = (index: number) => {
    const variant = variants[index];
    if (
      !window.confirm(
        `Remover a variação “${variant.name}” deste card? A alteração só será efetivada depois de revisar e salvar.`,
      )
    ) {
      return;
    }
    onChange(variants.filter((_, itemIndex) => itemIndex !== index));
  };

  const toggleHighlight = (index: number) => {
    const shouldHighlight = !variants[index].highlighted;
    onChange(
      variants.map((variant, itemIndex) => ({
        ...variant,
        highlighted: shouldHighlight && itemIndex === index ? true : undefined,
      })),
    );
  };

  return (
    <div className="admin-variant-editor">
      <div className="admin-section-heading">
        <div>
          <span className="admin-kicker">Planos comerciais</span>
          <h2>Variações e preços</h2>
          <p>
            Crie e organize opções sem código. Arquivar preserva a configuração;
            esgotar mantém a opção visível, mas bloqueia novas cobranças.
          </p>
        </div>
        <div className="admin-variant-editor__header-actions">
          <button
            type="button"
            className="admin-stock-toggle"
            data-active={productStatus === "sold-out" ? "true" : undefined}
            aria-pressed={productStatus === "sold-out"}
            onClick={() =>
              onProductStatusChange(
                productStatus === "sold-out"
                  ? lastActiveStatus.current
                  : "sold-out",
              )
            }
          >
            {productStatus === "sold-out"
              ? "Esgotado ativado"
              : "Marcar card esgotado"}
          </button>
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => add()}
            disabled={variants.length >= MAX_PRODUCT_VARIANTS}
          >
            + Nova variação
          </button>
        </div>
      </div>

      <div className="admin-variant-summary" role="note">
        <strong>{variants.length}/{MAX_PRODUCT_VARIANTS} opções cadastradas</strong>
        <span>
          {variants.filter((variant) => variant.availability !== "archived").length}{" "}
          aparecem no card ·{" "}
          {variants.filter((variant) => variant.availability === "sold-out").length}{" "}
          esgotadas ·{" "}
          {variants.filter((variant) => variant.availability === "archived").length}{" "}
          arquivadas
        </span>
      </div>

      {variants.length ? (
        <div className="admin-variant-editor__rows">
          {variants.map((variant, index) => (
            <fieldset
              key={`variant-${index}`}
              data-availability={variant.availability ?? "available"}
              data-highlighted={variant.highlighted ? "true" : undefined}
            >
              <legend>
                Opção {String(index + 1).padStart(2, "0")}
                {variant.highlighted ? " · destaque" : ""}
                {variant.availability === "archived" ? " · arquivada" : ""}
              </legend>
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
              <label className="admin-field">
                <span>Disponibilidade</span>
                <select
                  value={variant.availability ?? "available"}
                  onChange={(event) =>
                    update(index, {
                      availability: event.target.value as NonNullable<
                        Variant["availability"]
                      >,
                    })
                  }
                >
                  <option value="available">Disponível para compra</option>
                  <option value="sold-out">Esgotada, mas visível</option>
                  <option value="archived">Arquivada e oculta</option>
                </select>
              </label>
              <label className="admin-field admin-variant-color">
                <span>Cor da variação</span>
                <span>
                  <input
                    type="color"
                    value={variant.accentColor ?? "#e3062c"}
                    onChange={(event) =>
                      update(index, { accentColor: event.target.value })
                    }
                    aria-label={`Cor da variação ${variant.name}`}
                  />
                  <input
                    value={variant.accentColor ?? ""}
                    maxLength={7}
                    onChange={(event) =>
                      update(index, {
                        accentColor: event.target.value || undefined,
                      })
                    }
                    placeholder="#e3062c"
                    aria-label={`Código da cor da variação ${variant.name}`}
                  />
                </span>
              </label>

              <div className="admin-variant-actions">
                <button
                  type="button"
                  data-active={variant.highlighted ? "true" : undefined}
                  aria-pressed={Boolean(variant.highlighted)}
                  onClick={() => toggleHighlight(index)}
                >
                  {variant.highlighted ? "Destaque ativo" : "Destacar"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update(index, {
                      availability:
                        variant.availability === "archived"
                          ? "available"
                          : "archived",
                    })
                  }
                >
                  {variant.availability === "archived" ? "Reativar" : "Arquivar"}
                </button>
                <button
                  type="button"
                  onClick={() => add(variant)}
                  disabled={variants.length >= MAX_PRODUCT_VARIANTS}
                >
                  Duplicar
                </button>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Mover ${variant.name} para cima`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === variants.length - 1}
                  aria-label={`Mover ${variant.name} para baixo`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="admin-variant-actions__remove"
                  onClick={() => remove(index)}
                >
                  Remover
                </button>
              </div>
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="admin-empty-state admin-empty-state--compact">
          <strong>Este produto está sem variações.</strong>
          <p>Use “Nova variação” para criar a primeira opção comercial.</p>
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
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [rustCreateCount, setRustCreateCount] = useState(1);
  const [organizingOrder, setOrganizingOrder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkoutBannerInputRef = useRef<HTMLInputElement>(null);
  const demoImagesInputRef = useRef<HTMLInputElement>(null);

  const dirty = Boolean(draft && fingerprint(draft) !== savedFingerprint);
  const publishedCount = items.filter(
    (item) => item.publicationState === "published",
  ).length;
  const draftCount = items.filter(
    (item) => item.publicationState === "draft",
  ).length;
  const rustCloneCount = items.filter((item) =>
    isRustCloneCatalogKey(item.sourceKey),
  ).length;
  const rustMissingCount = Math.max(0, RUST_CLONE_COUNT - rustCloneCount);
  const effectiveRustCreateCount = Math.min(
    Math.max(1, rustCreateCount),
    Math.max(1, rustMissingCount),
  );
  const editingRustFamily = Boolean(
    draft &&
      (draft.sourceKey === RUST_SOURCE_CATALOG_KEY ||
        isRustCloneCatalogKey(draft.sourceKey)),
  );

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
  const orderedPublishedItems = useMemo(
    () =>
      items
        .filter((item) => item.publicationState === "published")
        .sort(
          (left, right) =>
            left.catalogOrder - right.catalogOrder ||
            left.createdAt.localeCompare(right.createdAt),
        ),
    [items],
  );

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
    setReviewConfirmed(false);
    setNotice("");
  };

  const updateProduct = <K extends keyof Product>(
    key: K,
    value: Product[K],
  ) => {
    setReviewConfirmed(false);
    setDraft((current) =>
      current
        ? { ...current, product: { ...current.product, [key]: value } }
        : current,
    );
  };

  const save = async () => {
    if (!draft || demoMode || busy) return;
    if (!reviewConfirmed) {
      setTab("publication");
      announce(
        "Confira a prévia e marque a confirmação antes de salvar.",
        "info",
      );
      return;
    }
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
      setReviewConfirmed(false);
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

  const openOrderOrganizer = () => {
    if (busy || organizingOrder) return;
    if (
      dirty &&
      !window.confirm(
        "Há alterações não salvas neste produto. Descartar e abrir a organização da vitrine?",
      )
    ) {
      return;
    }
    if (draft) {
      const saved = items.find((item) => item.id === draft.id) ?? null;
      setDraft(saved ? cloneItem(saved) : null);
      setSavedFingerprint(fingerprint(saved));
      setReviewConfirmed(false);
      setChangeNote("");
    }
    setNotice("");
    setOrganizingOrder(true);
  };

  const saveCatalogOrder = async (orderedIds: string[]) => {
    if (demoMode || busy) return;
    setBusy("catalog-order");
    setNotice("");
    try {
      const payload = await readApi<{ items: CatalogAdminItem[] }>(
        await fetch("/api/admin/catalog/order", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        }),
      );
      setItems(payload.items);
      const selected =
        payload.items.find((item) => item.id === selectedId) ??
        payload.items[0] ??
        null;
      setSelectedId(selected?.id ?? null);
      setDraft(selected ? cloneItem(selected) : null);
      setSavedFingerprint(fingerprint(selected));
      setReviewConfirmed(false);
      setOrganizingOrder(false);
      announce(
        "Nova ordem salva. As quatro fileiras da vitrine já seguem esta sequência.",
        "ok",
      );
      router.refresh();
    } catch (reason) {
      announce(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar a ordem da vitrine.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };

  const archiveCatalogItem = async (itemId: string) => {
    if (demoMode || busy) return;
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item || item.publicationState !== "published") {
      throw new Error("Este card não está publicado e não pode ser arquivado aqui.");
    }

    setBusy("catalog-publication");
    setNotice("");
    try {
      const payload = await readApi<{ item: CatalogAdminItem }>(
        await fetch(
          `/api/admin/products/${encodeURIComponent(item.id)}/publication`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              action: "archive",
              expectedRevision: item.revision,
            }),
          },
        ),
      );
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === payload.item.id ? payload.item : candidate,
        ),
      );
      if (selectedId === payload.item.id) {
        setDraft(cloneItem(payload.item));
        setSavedFingerprint(fingerprint(payload.item));
        setReviewConfirmed(false);
      }
      announce(
        `${payload.item.product.title} foi arquivado e saiu da vitrine. Ele pode ser restaurado pela aba Arquivo.`,
        "ok",
      );
      router.refresh();
    } catch (reason) {
      const error =
        reason instanceof Error
          ? reason
          : new Error("Não foi possível arquivar o card.");
      announce(error.message, "error");
      throw error;
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
      setReviewConfirmed(false);
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

  const syncRustClones = async () => {
    if (demoMode || busy || rustCloneCount >= RUST_CLONE_COUNT) return;
    if (dirty) {
      announce(
        "Salve ou descarte a alteração atual antes de criar os novos cards.",
        "info",
      );
      return;
    }

    if (
      !window.confirm(
        `Criar e publicar agora ${effectiveRustCreateCount} ${effectiveRustCreateCount === 1 ? "novo card" : "novos cards"} do Rust? Os cards existentes não serão alterados.`,
      )
    ) {
      return;
    }

    setBusy("rust-clones");
    setNotice("");
    try {
      const payload = await readApi<{
        items: CatalogAdminItem[];
        createdCount: number;
      }>(
        await fetch("/api/admin/catalog/rust-clones", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ count: effectiveRustCreateCount }),
        }),
      );
      setItems(payload.items);
      const selected =
        payload.items.find((item) => item.id === selectedId) ??
        payload.items[0] ??
        null;
      setSelectedId(selected?.id ?? null);
      setDraft(selected ? cloneItem(selected) : null);
      setSavedFingerprint(fingerprint(selected));
      setReviewConfirmed(false);
      announce(
        payload.createdCount > 0
          ? `${payload.createdCount} novos cards do Rust foram criados e publicados.`
          : "Rust1 a Rust20 já estavam completos. Nenhum card foi duplicado novamente.",
        "ok",
      );
      router.refresh();
    } catch (reason) {
      announce(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar os cards do Rust.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };

  const changePublication = async () => {
    if (!draft || demoMode || busy) return;
    if (dirty) {
      announce(
        "Salve ou descarte as alterações deste produto antes de mudar sua visibilidade.",
        "info",
      );
      return;
    }

    const restoring = draft.publicationState === "archived";
    if (draft.publicationState === "draft") {
      announce("Este card já está fora da vitrine porque é um rascunho.", "info");
      return;
    }

    const question = restoring
      ? `Restaurar ${draft.product.title}? Ele voltará ao estado anterior ao arquivamento.`
      : `Arquivar ${draft.product.title}? O card sairá da vitrine, mas seus dados e histórico continuarão guardados.`;
    if (!window.confirm(question)) return;

    setBusy("publication");
    setNotice("");
    try {
      const payload = await readApi<{ item: CatalogAdminItem }>(
        await fetch(
          `/api/admin/products/${encodeURIComponent(draft.id)}/publication`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              action: restoring ? "restore" : "archive",
              expectedRevision: draft.revision,
            }),
          },
        ),
      );
      setItems((current) =>
        current.map((item) =>
          item.id === payload.item.id ? payload.item : item,
        ),
      );
      setDraft(cloneItem(payload.item));
      setSavedFingerprint(fingerprint(payload.item));
      setReviewConfirmed(false);
      setStateFilter(
        payload.item.publicationState === "archived"
          ? "archived"
          : payload.item.publicationState,
      );
      announce(
        payload.item.publicationState === "archived"
          ? "Card arquivado. Ele saiu da vitrine sem perder dados ou histórico."
          : payload.item.publicationState === "published"
            ? "Card restaurado e novamente visível na vitrine."
            : "Card restaurado como rascunho e continua fora da vitrine.",
        "ok",
      );
      router.refresh();
    } catch (reason) {
      announce(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar a visibilidade do card.",
        "error",
      );
    } finally {
      setBusy("");
    }
  };

  const uploadImage = async (
    file: File,
    slot: "card" | "checkout" = "card",
  ) => {
    if (!draft || demoMode || busy) return;
    const busyKey = slot === "checkout" ? "upload-checkout" : "upload-card";
    setBusy(busyKey);
    try {
      const payload = await readApi<{ url: string }>(
        await fetch("/api/admin/assets", {
          method: "POST",
          headers: {
            "content-type": file.type,
            "x-product-source-key": draft.sourceKey,
            "x-asset-slot": slot === "checkout" ? "checkout-banner" : "card",
          },
          body: file,
        }),
      );
      if (slot === "checkout") {
        updateProduct("checkoutBanner", payload.url);
      } else {
        updateProduct("image", payload.url);
      }
      announce(
        `${slot === "checkout" ? "Banner do checkout" : "Thumbnail"} enviado. Revise a prévia e clique em “Salvar campos seguros” para concluir.`,
        "ok",
      );
    } catch (reason) {
      announce(
        reason instanceof Error ? reason.message : "Falha ao enviar a imagem.",
        "error",
      );
    } finally {
      setBusy("");
      const input =
        slot === "checkout"
          ? checkoutBannerInputRef.current
          : fileInputRef.current;
      if (input) input.value = "";
    }
  };

  const uploadDemoImages = async (files: FileList) => {
    if (!draft || demoMode || busy || files.length === 0) return;
    const currentImages = draft.product.demoImages ?? [];
    const availableSlots = MAX_PRODUCT_DEMO_IMAGES - currentImages.length;
    if (availableSlots <= 0) {
      announce("A galeria já atingiu o limite de cinco imagens.", "info");
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    const uploaded: string[] = [];
    setBusy("upload-demo");
    try {
      for (const file of selectedFiles) {
        const payload = await readApi<{ url: string }>(
          await fetch("/api/admin/assets", {
            method: "POST",
            headers: {
              "content-type": file.type,
              "x-product-source-key": draft.sourceKey,
              "x-asset-slot": "demo-gallery",
            },
            body: file,
          }),
        );
        uploaded.push(payload.url);
      }

      updateProduct("demoImages", [...currentImages, ...uploaded]);
      announce(
        `${uploaded.length} ${uploaded.length === 1 ? "imagem adicionada" : "imagens adicionadas"}. Organize a sequência e salve o card para publicar a galeria.`,
        "ok",
      );
    } catch (reason) {
      if (uploaded.length) {
        updateProduct("demoImages", [...currentImages, ...uploaded]);
      }
      announce(
        reason instanceof Error
          ? reason.message
          : "Não foi possível enviar todas as imagens demonstrativas.",
        "error",
      );
    } finally {
      setBusy("");
      if (demoImagesInputRef.current) demoImagesInputRef.current.value = "";
    }
  };

  const moveDemoImage = (index: number, offset: -1 | 1) => {
    if (!draft) return;
    const images = [...(draft.product.demoImages ?? [])];
    const destination = index + offset;
    if (destination < 0 || destination >= images.length) return;
    [images[index], images[destination]] = [
      images[destination],
      images[index],
    ];
    updateProduct("demoImages", images);
  };

  const removeDemoImage = (index: number) => {
    if (!draft) return;
    updateProduct(
      "demoImages",
      (draft.product.demoImages ?? []).filter(
        (_image, imageIndex) => imageIndex !== index,
      ),
    );
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
          <span className="admin-safe-mode-badge">Modo seguro</span>
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
        <button
          type="button"
          className={`admin-order-entry ${organizingOrder ? "is-active" : ""}`}
          onClick={openOrderOrganizer}
          disabled={Boolean(busy) || organizingOrder}
        >
          <span aria-hidden>↕</span>
          <p>
            <strong>Organizar vitrine</strong>
            <small>Arrastar e ordenar os cards com confirmação</small>
          </p>
        </button>
        <Link href="/admin/conteudo" className="admin-content-entry">
          <span aria-hidden>✎</span>
          <p>
            <strong>Textos da vitrine</strong>
            <small>Hero, títulos e descrições do catálogo</small>
          </p>
        </Link>
        <Link href="/admin/cupons" className="admin-content-entry">
          <span aria-hidden>%</span>
          <p>
            <strong>Cupons de desconto</strong>
            <small>Códigos, percentual, validade e campanhas</small>
          </p>
        </Link>
        <nav className="admin-product-list" aria-label="Lista de produtos">
          {filteredItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={selectedId === item.id ? "is-active" : ""}
              onClick={() => selectItem(item)}
              disabled={organizingOrder}
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
      </aside>

      {organizingOrder ? (
        <section className="admin-workspace admin-workspace--order">
          <CatalogOrderBoard
            items={orderedPublishedItems}
            busy={Boolean(busy)}
            demoMode={demoMode}
            onCancel={() => setOrganizingOrder(false)}
            onArchive={archiveCatalogItem}
            onSave={saveCatalogOrder}
          />
        </section>
      ) : draft ? (
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
                {editingRustFamily && rustMissingCount > 0 ? (
                  <div className="admin-rust-create-control">
                    <label>
                      <span>Quantidade</span>
                      <select
                        value={effectiveRustCreateCount}
                        onChange={(event) =>
                          setRustCreateCount(Number(event.target.value))
                        }
                        disabled={demoMode || dirty || Boolean(busy)}
                        aria-label="Quantidade de novos cards do Rust"
                      >
                        {Array.from(
                          { length: rustMissingCount },
                          (_, index) => index + 1,
                        ).map((count) => (
                          <option key={count} value={count}>
                            {count}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={syncRustClones}
                      disabled={demoMode || dirty || Boolean(busy)}
                      title="Cria somente a quantidade escolhida; o padrão é 1"
                    >
                      {busy === "rust-clones"
                        ? "Criando cards…"
                        : `Criar ${effectiveRustCreateCount} (${rustCloneCount}/${RUST_CLONE_COUNT})`}
                    </button>
                  </div>
                ) : null}
                {draft.publicationState !== "draft" ? (
                  <button
                    type="button"
                    className={`admin-secondary-button ${
                      draft.publicationState === "archived"
                        ? "admin-restore-button"
                        : "admin-archive-button"
                    }`}
                    onClick={changePublication}
                    disabled={demoMode || dirty || Boolean(busy)}
                    title={
                      draft.publicationState === "archived"
                        ? "Recoloca o card no estado anterior"
                        : "Retira o card da vitrine sem apagar seus dados"
                    }
                  >
                    {busy === "publication"
                      ? "Atualizando…"
                      : draft.publicationState === "archived"
                        ? "Restaurar card"
                        : "Arquivar card"}
                  </button>
                ) : null}
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
                  onClick={() => setTab("publication")}
                  disabled={!dirty || demoMode || Boolean(busy)}
                >
                  Revisar alterações
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
                        <option value="sold-out">Esgotado</option>
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
                  </div>
                </section>
              ) : null}

              {tab === "visual" ? (
                <section className="admin-form-section">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-kicker">Direção de arte</span>
                      <h2>Imagem do produto</h2>
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
                          if (file) void uploadImage(file, "card");
                        }}
                      />
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={demoMode || Boolean(busy)}
                      >
                        {busy === "upload-card" ? "Enviando…" : "Substituir imagem"}
                      </button>
                      <label className="admin-field">
                        <span>Endereço da imagem</span>
                        <input
                          value={draft.product.image}
                          readOnly
                          aria-readonly="true"
                        />
                        <small>
                          Gerenciado automaticamente. Use “Substituir imagem”.
                        </small>
                      </label>
                    </div>
                  </div>
                  <div className="admin-image-manager admin-image-manager--checkout">
                    <div
                      className="admin-image-manager__preview admin-image-manager__preview--checkout"
                      style={{
                        backgroundImage: `url("${(draft.product.checkoutBanner ?? draft.product.image).replaceAll('"', "%22")}")`,
                      }}
                      aria-label="Prévia do banner vertical do checkout"
                      role="img"
                    >
                      <span>
                        {draft.product.checkoutBanner
                          ? "Banner do checkout"
                          : "Fallback da thumbnail"}
                      </span>
                    </div>
                    <div>
                      <h3>Banner vertical do checkout</h3>
                      <p>
                        Use WEBP ou AVIF em proporção 4:5. Tamanho recomendado:
                        1200 × 1500 px, até 5 MB. Essa arte aparece somente na
                        lateral do checkout PIX.
                      </p>
                      <input
                        ref={checkoutBannerInputRef}
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadImage(file, "checkout");
                        }}
                      />
                      <div className="admin-image-manager__actions">
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => checkoutBannerInputRef.current?.click()}
                          disabled={demoMode || Boolean(busy)}
                        >
                          {busy === "upload-checkout"
                            ? "Enviando…"
                            : "Substituir banner"}
                        </button>
                        {draft.product.checkoutBanner ? (
                          <button
                            type="button"
                            className="admin-secondary-button admin-secondary-button--quiet"
                            onClick={() => updateProduct("checkoutBanner", null)}
                            disabled={demoMode || Boolean(busy)}
                          >
                            Usar thumbnail do card
                          </button>
                        ) : null}
                      </div>
                      <label className="admin-field">
                        <span>Endereço do banner</span>
                        <input
                          value={draft.product.checkoutBanner ?? ""}
                          readOnly
                          aria-readonly="true"
                          placeholder="Usando a thumbnail do card"
                        />
                        <small>
                          Gerenciado automaticamente. Nunca cole links externos
                          neste campo.
                        </small>
                      </label>
                    </div>
                  </div>
                  <section className="admin-demo-gallery" aria-labelledby="demo-gallery-title">
                    <div className="admin-demo-gallery__heading">
                      <div>
                        <span className="admin-kicker">Popup de apresentação</span>
                        <h3 id="demo-gallery-title">Galeria demonstrativa</h3>
                        <p>
                          Adicione até cinco artes. No site elas avançam
                          automaticamente em loop e também podem ser navegadas
                          pelas setas.
                        </p>
                      </div>
                      <strong>
                        {(draft.product.demoImages ?? []).length}/
                        {MAX_PRODUCT_DEMO_IMAGES}
                      </strong>
                    </div>

                    <input
                      ref={demoImagesInputRef}
                      hidden
                      multiple
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(event) => {
                        if (event.target.files) {
                          void uploadDemoImages(event.target.files);
                        }
                      }}
                    />

                    {(draft.product.demoImages ?? []).length ? (
                      <ol className="admin-demo-gallery__grid">
                        {(draft.product.demoImages ?? []).map((image, index) => (
                          <li key={`${image}-${index}`}>
                            <div
                              className="admin-demo-gallery__preview"
                              style={{
                                backgroundImage: `url("${image.replaceAll('"', "%22")}")`,
                              }}
                              role="img"
                              aria-label={`Imagem demonstrativa ${index + 1}`}
                            >
                              <span>{String(index + 1).padStart(2, "0")}</span>
                            </div>
                            <div className="admin-demo-gallery__controls">
                              <button
                                type="button"
                                onClick={() => moveDemoImage(index, -1)}
                                disabled={demoMode || Boolean(busy) || index === 0}
                                aria-label={`Mover imagem ${index + 1} para trás`}
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                onClick={() => removeDemoImage(index)}
                                disabled={demoMode || Boolean(busy)}
                              >
                                Remover
                              </button>
                              <button
                                type="button"
                                onClick={() => moveDemoImage(index, 1)}
                                disabled={
                                  demoMode ||
                                  Boolean(busy) ||
                                  index === (draft.product.demoImages ?? []).length - 1
                                }
                                aria-label={`Mover imagem ${index + 1} para frente`}
                              >
                                →
                              </button>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="admin-demo-gallery__empty">
                        <strong>Nenhuma arte cadastrada.</strong>
                        <p>
                          Enquanto a galeria estiver vazia, o popup mantém a
                          mensagem “Demonstração em preparação”.
                        </p>
                      </div>
                    )}

                    <div className="admin-demo-gallery__actions">
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() => demoImagesInputRef.current?.click()}
                        disabled={
                          demoMode ||
                          Boolean(busy) ||
                          (draft.product.demoImages ?? []).length >=
                            MAX_PRODUCT_DEMO_IMAGES
                        }
                      >
                        {busy === "upload-demo"
                          ? "Enviando…"
                          : "Adicionar imagens"}
                      </button>
                      <small>
                        WEBP ou AVIF 16:9, até 5 MB por imagem. A ordem acima é
                        a ordem exibida no popup.
                      </small>
                    </div>
                  </section>
                  <div className="admin-safety-check">
                    <span aria-hidden>✓</span>
                    <div>
                      <strong>Paleta oficial protegida</strong>
                      <p>
                        Cores de fundo, texto e destaque não podem ser alteradas
                        aqui. Assim, nenhum clique acidental compromete contraste
                        ou identidade visual.
                      </p>
                    </div>
                  </div>
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
                  productStatus={draft.product.status}
                  onChange={(value) => updateProduct("variants", value)}
                  onProductStatusChange={(status) =>
                    updateProduct("status", status)
                  }
                />
              ) : null}

              {tab === "publication" ? (
                <section className="admin-form-section">
                  <div className="admin-section-heading">
                    <div>
                      <span className="admin-kicker">Última conferência</span>
                      <h2>Revisar antes de salvar</h2>
                      <p>
                        O painel salva conteúdo e opções comerciais. Rota,
                        posição, publicação e paleta estrutural permanecem
                        exatamente como estavam.
                      </p>
                    </div>
                    <span className="admin-help-pill">Estrutura controlada</span>
                  </div>
                  <div className="admin-protection-grid">
                    <article>
                      <span aria-hidden>01</span>
                      <p>
                        <strong>
                          Continua {draft.publicationState === "published"
                            ? "publicado"
                            : draft.publicationState === "archived"
                              ? "arquivado"
                              : "como rascunho"}
                        </strong>
                        <small>Salvar não coloca nem retira o card do site.</small>
                      </p>
                    </article>
                    <article>
                      <span aria-hidden>02</span>
                      <p>
                        <strong>Rota e posição intactas</strong>
                        <small>Links e ordem do carrossel não podem mudar.</small>
                      </p>
                    </article>
                    <article>
                      <span aria-hidden>03</span>
                      <p>
                        <strong>Planos preservados</strong>
                        <small>É possível editar os dados, não apagar opções.</small>
                      </p>
                    </article>
                    <article>
                      <span aria-hidden>04</span>
                      <p>
                        <strong>Versão anterior guardada</strong>
                        <small>O histórico registra cada gravação automaticamente.</small>
                      </p>
                    </article>
                  </div>
                  <div className="admin-form-grid">
                    <label className="admin-field admin-field--wide">
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
                        A revisão {draft.revision} será guardada. Se outra pessoa
                        salvar primeiro ou alguém tentar alterar a estrutura, o
                        servidor interrompe a gravação.
                      </p>
                    </div>
                  </div>
                  <label className="admin-review-confirm">
                    <input
                      type="checkbox"
                      checked={reviewConfirmed}
                      onChange={(event) =>
                        setReviewConfirmed(event.target.checked)
                      }
                    />
                    <span aria-hidden />
                    <p>
                      <strong>Conferi a prévia e os preços deste produto.</strong>
                      <small>
                        Esta confirmação libera somente o salvamento dos campos
                        seguros exibidos pelo painel.
                      </small>
                    </p>
                  </label>
                  <button
                    type="button"
                    className="admin-primary-button admin-primary-button--wide"
                    onClick={save}
                    disabled={
                      !dirty || !reviewConfirmed || demoMode || Boolean(busy)
                    }
                  >
                    {busy === "save"
                      ? "Salvando com segurança…"
                      : "Salvar campos seguros"}
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
                <small>
                  Histórico somente para consulta. Restaurações exigem
                  assistência técnica e não ficam expostas no painel cotidiano.
                </small>
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
