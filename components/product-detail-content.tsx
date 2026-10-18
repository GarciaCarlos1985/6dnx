"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  formatBRL,
  isVariantSoldOut,
  purchasableProductVariants,
  visibleProductVariants,
  type Product,
  type Variant,
} from "@/lib/products";
import { DiscordMark } from "@/components/discord-mark";
import {
  normalizeYouTubeVideoId,
  youtubeNoCookieEmbedUrl,
  youtubeWatchUrl,
} from "@/lib/media/youtube";

function PurchaseFlowGuide() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeWithEscape, true);
    return () => window.removeEventListener("keydown", closeWithEscape, true);
  }, [open]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() =>
      triggerRef.current?.focus({ preventScroll: true }),
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.055] px-3 text-[0.56rem] font-bold uppercase tracking-[0.1em] text-white/75 transition-colors hover:border-white/35 hover:bg-white/10 hover:text-white focus-visible:border-white/50 focus-visible:text-white"
        aria-haspopup="dialog"
      >
        <span
          className="grid h-4 w-4 place-items-center rounded-full border border-primary/60 text-[0.55rem] text-primary"
          aria-hidden
        >
          i
        </span>
        Como funciona a compra
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] grid place-items-center bg-black/85 p-3 backdrop-blur-md"
              role="presentation"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) close();
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="purchase-flow-title"
                className="product-scrollbar max-h-[92vh] w-[min(64rem,96vw)] overflow-y-auto border border-primary/50 bg-[#080506] shadow-[0_0_70px_oklch(0.55_0.22_25_/_0.32)]"
              >
                <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
                  <div>
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.2em] text-primary">
                      Compra protegida 6DNX
                    </p>
                    <h3
                      id="purchase-flow-title"
                      className="mt-1 text-xl text-white sm:text-2xl"
                    >
                      Como funciona a compra
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    autoFocus
                    aria-label="Fechar guia de compra"
                    className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 text-lg text-muted hover:border-primary hover:text-white"
                  >
                    ×
                  </button>
                </header>

                <div className="bg-black p-2 sm:p-4">
                  <div className="overflow-hidden border border-white/10 bg-[#050203]">
                    <Image
                      src="/guides/como-comprar-6dnx-pix.webp"
                      alt="Guia em sete etapas: entrar no site, escolher o card, escolher a variação, gerar e pagar o PIX, aguardar a confirmação automática, abrir o Discord e receber entrega e suporte."
                      width={1584}
                      height={991}
                      sizes="(max-width: 1024px) 96vw, 1024px"
                      className="h-auto w-full"
                      priority={false}
                    />
                  </div>
                </div>
                <p className="border-t border-white/10 px-4 py-4 text-sm leading-relaxed text-white/72 sm:px-5">
                  A escolha e o pagamento acontecem no site. Depois da
                  confirmação automática, o Discord é aberto para entrega e
                  suporte.
                </p>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function useProductSelection(product: Product) {
  const purchasableVariants = purchasableProductVariants(product);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(() =>
    purchasableVariants.length === 1 ? purchasableVariants[0].name : null,
  );

  const selectVariant = (name: string) => {
    if (purchasableVariants.some((variant) => variant.name === name)) {
      setSelectedVariant(name);
    }
  };

  return { selectedVariant, selectVariant };
}

function VariantRow({
  variant,
  selected,
  disabled,
  onPick,
}: {
  variant: Variant;
  selected: boolean;
  disabled: boolean;
  onPick: (name: string) => void;
}) {
  const soldOut = isVariantSoldOut(variant) || disabled;
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(variant.name)}
        aria-pressed={selected}
        disabled={soldOut}
        style={
          variant.accentColor ? { borderColor: variant.accentColor } : undefined
        }
        className={`flex w-full items-center justify-between gap-3 border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          selected
            ? "border-primary bg-primary/15 shadow-[inset_3px_0_0_var(--primary)]"
            : soldOut
              ? "cursor-not-allowed border-white/8 bg-white/[0.025] opacity-55"
              : variant.highlighted
                ? "border-primary/65 bg-primary/10 shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/15"
                : "border-white/5 bg-black/40 hover:border-primary/60 hover:bg-primary/10"
        }`}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            {variant.name}
            {variant.badge ? (
              <span className="bg-primary px-1.5 py-0.5 text-[0.6rem] font-black tracking-wider text-ink">
                {variant.badge}
              </span>
            ) : null}
            {variant.highlighted && !variant.badge ? (
              <span className="bg-primary px-1.5 py-0.5 text-[0.6rem] font-black tracking-wider text-ink">
                Destaque
              </span>
            ) : null}
            {soldOut ? (
              <span className="border border-white/20 px-1.5 py-0.5 text-[0.58rem] font-black uppercase tracking-wider text-white/65">
                Esgotado
              </span>
            ) : null}
          </span>
          {variant.note ? (
            <span className="block text-[0.7rem] text-muted">
              {variant.note}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-bold text-primary">
            {typeof variant.priceBRL === "number"
              ? formatBRL(variant.priceBRL)
              : "sob consulta"}
          </span>
          {typeof variant.priceBRL === "number" ? (
            <span className="block text-[0.48rem] uppercase tracking-[0.14em] text-muted">
              referência
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function DiscordSupportLink({ supportUrl }: { supportUrl: string }) {
  return (
    <a
      href={supportUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-11 items-center gap-2.5 rounded-md border border-white/20 bg-white/[0.09] px-3 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)] transition hover:border-white/40 hover:bg-white/[0.15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5865f2]"
      aria-label="Abrir o canal Welcome da 6DNX no Discord"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#5865f2] text-white shadow-[0_0_18px_rgba(88,101,242,.35)]">
        <DiscordMark className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.47rem] font-bold uppercase tracking-[0.14em] text-white/50">
          Atendimento opcional
        </span>
        <span className="block text-[0.58rem] font-black uppercase tracking-[0.08em] text-white">
          Canal Welcome
        </span>
      </span>
    </a>
  );
}

export function ProductPurchasePanel({
  product,
  selectedVariant,
  onPick,
  checkoutAvailable,
  checkoutTriggerRef,
  onCheckout,
  supportUrl,
}: {
  product: Product;
  selectedVariant: string | null;
  onPick: (name: string) => void;
  checkoutAvailable: boolean;
  checkoutTriggerRef: RefObject<HTMLButtonElement | null>;
  onCheckout: (variantName: string) => void;
  supportUrl: string;
}) {
  const visibleVariants = visibleProductVariants(product);
  const purchasableVariants = purchasableProductVariants(product);
  const requiresVariant = visibleVariants.length > 0;
  const productSoldOut = product.status === "sold-out";
  const selectedIsPurchasable = purchasableVariants.some(
    (variant) => variant.name === selectedVariant,
  );

  return (
    <div className="shrink-0 border-b border-primary/45 bg-[linear-gradient(180deg,rgba(20,5,8,.98),rgba(6,4,5,.98))] px-4 py-3">
      {requiresVariant ? (
        <>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-white">
              Escolha sua opção
            </p>
            {purchasableVariants.length === 1 ? (
              <span className="text-[0.5rem] uppercase tracking-[0.12em] text-green-300/75">
                opção única selecionada
              </span>
            ) : null}
          </div>
          <ul className="space-y-1.5">
            {visibleVariants.map((variant) => (
              <VariantRow
                key={variant.name}
                variant={variant}
                selected={selectedVariant === variant.name}
                disabled={productSoldOut}
                onPick={onPick}
              />
            ))}
          </ul>
          <button
            ref={checkoutTriggerRef}
            type="button"
            disabled={
              !selectedVariant ||
              !selectedIsPurchasable ||
              productSoldOut ||
              !checkoutAvailable
            }
            onClick={() => {
              if (selectedVariant) onCheckout(selectedVariant);
            }}
            className="mt-2.5 flex min-h-12 w-full items-center justify-center bg-primary px-4 text-center text-[0.68rem] font-black uppercase tracking-[0.13em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:bg-white/[0.07] disabled:text-white/38"
          >
            {productSoldOut
              ? "Produto esgotado"
              : !selectedVariant
                ? "Escolha uma opção"
                : selectedIsPurchasable && checkoutAvailable
                  ? "Comprar com PIX"
                  : !selectedIsPurchasable
                    ? "Opção esgotada"
                    : "PIX temporariamente indisponível"}
          </button>
        </>
      ) : (
        <p className="rounded border border-white/10 bg-black/30 px-3 py-3 text-xs leading-relaxed text-muted">
          Este item precisa de confirmação direta com o atendimento.
        </p>
      )}

      {checkoutAvailable ? (
        <p className="mt-3 text-xs leading-relaxed text-white/75">
          Para guardar o acesso à orientação,{" "}
          <a
            className="underline underline-offset-4 hover:text-white"
            href="/conta"
          >
            entre na sua conta
          </a>{" "}
          antes de pagar. Compras sem login não são vinculadas automaticamente
          depois.
        </p>
      ) : null}

      <div className="mt-2 grid grid-cols-[1.15fr_.85fr] gap-2">
        <DiscordSupportLink supportUrl={supportUrl} />
        <PurchaseFlowGuide />
      </div>
    </div>
  );
}

export function ProductMediaPreview({ product }: { product: Product }) {
  const media = useMemo(() => {
    const items: Array<
      | { kind: "youtube"; id: string; embedUrl: string; watchUrl: string }
      | { kind: "image"; src: string }
    > = [];
    const videoId = normalizeYouTubeVideoId(product.youtubeId);
    const embedUrl = youtubeNoCookieEmbedUrl(videoId);
    const watchUrl = youtubeWatchUrl(videoId);

    if (videoId && embedUrl && watchUrl) {
      items.push({ kind: "youtube", id: videoId, embedUrl, watchUrl });
    }
    items.push(
      ...(product.demoImages ?? [])
        .filter(
          (image): image is string =>
            Boolean(image) &&
            (image.startsWith("/") || image.startsWith("https://")),
        )
        .slice(0, 5)
        .map((src) => ({ kind: "image" as const, src })),
    );
    return items;
  }, [product.demoImages, product.youtubeId]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const move = useCallback(
    (direction: -1 | 1) => {
      if (media.length < 2) return;
      setActiveIndex(
        (current) => (current + direction + media.length) % media.length,
      );
    },
    [media.length],
  );

  const visibleIndex = media.length ? activeIndex % media.length : 0;
  const activeMedia = media[visibleIndex];

  useEffect(() => {
    if (
      media.length < 2 ||
      activeMedia?.kind !== "image" ||
      paused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const interval = window.setInterval(() => move(1), 4_500);
    return () => window.clearInterval(interval);
  }, [activeMedia?.kind, media.length, move, paused]);

  if (activeMedia) {
    return (
      <div
        className="relative h-full min-h-52 overflow-hidden bg-black"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {activeMedia.kind === "youtube" ? (
          <div
            key={`${product.slug}-youtube-${activeMedia.id}`}
            className="absolute inset-0 flex items-center bg-black"
          >
            <iframe
              className="aspect-video w-full border-0"
              src={activeMedia.embedUrl}
              title={`Demonstração em vídeo — ${product.title}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <a
              href={activeMedia.watchUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-16 right-4 border border-white/35 bg-black/85 px-3 py-2 text-[0.55rem] font-black uppercase tracking-[0.16em] text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Abrir no YouTube ↗
            </a>
          </div>
        ) : (
          <div
            key={`${product.slug}-${visibleIndex}-${activeMedia.src}`}
            className="product-demo-slide absolute inset-0"
          >
            <Image
              src={activeMedia.src}
              alt={`Demonstração ${visibleIndex + 1} de ${media.length} — ${product.title}`}
              fill
              sizes="(max-width: 1023px) 92vw, 420px"
              className="object-cover"
            />
          </div>
        )}
        {activeMedia.kind === "image" ? (
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.18),transparent_48%,rgba(0,0,0,.88))]" />
        ) : null}
        <div className="pointer-events-none absolute left-4 top-4 border border-primary/65 bg-black/80 px-3 py-2 text-[0.52rem] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_28px_rgba(227,6,44,.3)]">
          6DNX // {activeMedia.kind === "youtube" ? "vídeo" : "arte"}{" "}
          {visibleIndex + 1}/{media.length}
        </div>
        {media.length > 1 ? (
          <div className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-4 pt-10">
            <button
              type="button"
              className="product-demo-arrow justify-self-start"
              onClick={() => move(-1)}
              aria-label={`Ver demonstração anterior de ${product.title}`}
            >
              <span aria-hidden>‹</span>
              Anterior
            </button>
            <div className="flex items-center gap-1.5" aria-hidden>
              {media.map((item, index) => (
                <span
                  key={
                    item.kind === "youtube" ? `youtube-${item.id}` : item.src
                  }
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                    index === visibleIndex
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-white/45"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              className="product-demo-arrow justify-self-end"
              onClick={() => move(1)}
              aria-label={`Ver próxima demonstração de ${product.title}`}
            >
              Próxima
              <span aria-hidden>›</span>
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-52 overflow-hidden bg-black">
      <Image
        src={product.image}
        alt=""
        fill
        sizes="(max-width: 1023px) 92vw, 420px"
        className="object-cover opacity-65 saturate-75"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,.92),rgba(0,0,0,.35)_58%,rgba(120,0,16,.55))]" />
      <div className="pointer-events-none absolute -bottom-10 -right-3 h-[90%] w-[38%] min-w-28">
        <Image
          src="/anjo1-premium.webp"
          alt=""
          fill
          sizes="160px"
          className="object-contain object-right-bottom opacity-85"
        />
      </div>
      <div className="relative flex h-full min-h-52 max-w-[68%] flex-col justify-end p-6">
        <span className="mb-2 text-[0.55rem] font-black uppercase tracking-[0.24em] text-primary">
          6DNX // prévia do serviço
        </span>
        <p className="text-lg font-bold text-ink">Demonstração em preparação</p>
        <p className="mt-2 text-[0.68rem] leading-relaxed text-white/55">
          A arte e a descrição já representam esta solução. O vídeo oficial
          poderá ser adicionado depois, sem deixar um player quebrado.
        </p>
      </div>
    </div>
  );
}

export function ProductTechnicalContent({ product }: { product: Product }) {
  return (
    <div className="bg-black px-4 py-3">
      {product.description && (
        <p className="mb-6 text-sm leading-relaxed text-muted">
          {product.description}
        </p>
      )}

      {product.features && product.features.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
            Recursos da solução
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {product.features.map((feature, index) => (
              <div
                key={`${feature.label}-${index}`}
                className="flex flex-col rounded-md border border-white/5 bg-black/40 p-2 shadow-[inset_0_0_12px_rgba(255,255,255,0.02)]"
              >
                <span className="mb-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-muted/80">
                  {feature.label}
                </span>
                <span
                  className={`text-[0.75rem] font-bold ${
                    feature.value.toLowerCase().includes("sim") ||
                    feature.value.toLowerCase().includes("yes") ||
                    feature.value.toLowerCase().includes("external")
                      ? "text-green-400/90"
                      : "text-ink"
                  }`}
                >
                  {feature.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.systemSupport && product.systemSupport.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
            Requisitos do Sistema
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {product.systemSupport.map((requirement, index) => (
              <div
                key={`${requirement.label}-${index}`}
                className="flex flex-col rounded-md border border-primary/20 bg-primary/[0.03] p-2"
              >
                <span className="product-requirement-label mb-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-primary/70">
                  {requirement.label}
                </span>
                <span className="text-[0.75rem] font-bold text-ink">
                  {requirement.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.menuKeys && product.menuKeys.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
            Teclas do Menu
          </h4>
          <div className="flex flex-col gap-2">
            {product.menuKeys.map((menuKey, index) => (
              <div
                key={`${menuKey.label}-${index}`}
                className="flex items-center gap-3 rounded-md border border-white/10 bg-black/60 p-2"
              >
                <span className="shrink-0 rounded bg-primary/20 px-2 py-0.5 text-[0.65rem] font-black tracking-widest text-primary">
                  {menuKey.label}
                </span>
                <span className="text-[0.7rem] leading-tight text-muted">
                  {menuKey.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.tutorialSteps && product.tutorialSteps.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
            Tutorial de Inicialização
          </h4>
          <ul className="space-y-2">
            {product.tutorialSteps.map((step, index) => (
              <li
                key={`${index}-${step}`}
                className="flex items-start gap-2.5 rounded-md border border-white/5 bg-black/20 p-2.5 text-[0.7rem] text-muted/90"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary/30 text-[0.55rem] font-black text-primary">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
