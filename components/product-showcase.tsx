"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  formatBRL,
  priceFrom,
  productStatusLabel,
  type Product,
  type Variant,
} from "@/lib/products";
import { buildProductCatalogLayout } from "@/lib/product-catalog-layout";

gsap.registerPlugin(ScrollTrigger);

const PER_PAGE = 3;
const MARGIN = 12;
const GAP = 20;
const INFO_W = 360;
const INFO_MIN_W = 280;
const INFO_MIN_H = 148;
const INFO_MAX_H = 640;
const VIDEO_W = 420;
const VIDEO_MIN_W = 300;
const VIDEO_H = 280;
const WIDE_POPUP_QUERY = "(min-width: 1024px) and (min-height: 620px)";

type Box = { top: number; left: number; width: number; height: number };
type Placement = {
  info: Box;
  video: Box;
  card: Box;
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

function subscribeToWidePopup(change: () => void) {
  const mediaQuery = window.matchMedia(WIDE_POPUP_QUERY);
  mediaQuery.addEventListener("change", change);
  return () => mediaQuery.removeEventListener("change", change);
}

const getWidePopupSnapshot = () => window.matchMedia(WIDE_POPUP_QUERY).matches;
const getWidePopupServerSnapshot = () => false;

/**
 * Desktop dialogs are authored as one invariant composition: information on
 * the left, selected card in the center, media preview on the right. The
 * selected card is moved to the middle column before this calculation runs.
 */
function place(card: DOMRect): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const roomLeft = Math.max(INFO_MIN_W, card.left - GAP - MARGIN);
  const roomRight = Math.max(
    VIDEO_MIN_W,
    vw - card.right - GAP - MARGIN,
  );
  const infoW = Math.min(INFO_W, roomLeft);
  const infoH = Math.min(INFO_MAX_H, Math.max(INFO_MIN_H, vh - MARGIN * 2));
  const maxVideoH = vh - MARGIN * 2;
  const videoW = Math.min(VIDEO_W, roomRight);
  const videoH = Math.min(VIDEO_H, maxVideoH);
  const centerY = card.top + card.height / 2;

  const info: Box = {
    width: infoW,
    height: infoH,
    left: clamp(card.left - GAP - infoW, MARGIN, vw - infoW - MARGIN),
    top: clamp(centerY - infoH / 2, MARGIN, vh - infoH - MARGIN),
  };
  const video: Box = {
    width: videoW,
    height: videoH,
    left: clamp(card.right + GAP, MARGIN, vw - videoW - MARGIN),
    top: clamp(
      centerY - videoH / 2,
      MARGIN,
      vh - videoH - MARGIN,
    ),
  };

  return {
    info,
    video,
    card: {
      top: card.top,
      left: card.left,
      width: card.width,
      height: card.height,
    },
  };
}

function useProductSelection() {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const selectVariant = (name: string) => {
    setSelectedVariant(name);
  };

  return { selectedVariant, selectVariant };
}

/** Cords: a dim base path plus a bright dash that loops, card → popup → around it. */
function Cords({ p }: { p: Placement }) {
  const cy = p.card.top + p.card.height / 2;

  const infoStartX = p.card.left;
  const infoAnchorX = p.info.left + p.info.width;
  const infoAnchorY = clamp(cy, p.info.top, p.info.top + p.info.height);
  const infoPath = `M ${infoStartX} ${cy} C ${(infoStartX + infoAnchorX) / 2} ${cy}, ${(infoStartX + infoAnchorX) / 2} ${infoAnchorY}, ${infoAnchorX} ${infoAnchorY}`;

  const vidStartX = p.card.left + p.card.width;
  const vidAnchorX = p.video.left;
  const vidAnchorY = clamp(cy, p.video.top, p.video.top + p.video.height);
  const vidPath = `M ${vidStartX} ${cy} C ${(vidStartX + vidAnchorX) / 2} ${cy}, ${(vidStartX + vidAnchorX) / 2} ${vidAnchorY}, ${vidAnchorX} ${vidAnchorY}`;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
      aria-hidden
    >
      {[infoPath, vidPath].map((d, i) => (
        <g key={i}>
          <path d={d} className="cord-base" />
          <path d={d} className="cord-energy" />
        </g>
      ))}
      {[p.info, p.video].map((b, i) => (
        <g key={`r${i}`}>
          <rect
            x={b.left}
            y={b.top}
            width={b.width}
            height={b.height}
            rx="10"
            className="cord-base"
          />
          <rect
            x={b.left}
            y={b.top}
            width={b.width}
            height={b.height}
            rx="10"
            className="cord-energy"
          />
        </g>
      ))}
    </svg>
  );
}

function VariantRow({
  variant,
  selected,
  onPick,
}: {
  variant: Variant;
  selected: boolean;
  onPick: (name: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(variant.name)}
        aria-pressed={selected}
        className={`flex w-full items-center justify-between gap-3 border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          selected
            ? "border-primary bg-primary/15 shadow-[inset_3px_0_0_var(--primary)]"
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
          </span>
          {variant.note ? (
            <span className="block text-[0.7rem] text-muted">{variant.note}</span>
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

function ProductMediaPreview({ product }: { product: Product }) {
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

function Popups({
  product,
  placement,
  onClose,
}: {
  product: Product;
  placement: Placement;
  onClose: () => void;
}) {
  const selection = useProductSelection();
  const supportUrl = `/api/redirect?slug=${encodeURIComponent(product.slug)}`;
  const requiresVariant = product.variants.length > 0;

  return (
    <>
      <Cords p={placement} />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${product.title}`}
        data-popup-side="left"
        className="product-popup product-popup--info-left fixed z-[80] flex flex-col overflow-hidden border border-primary/40 bg-surface/95 shadow-[0_0_50px_oklch(0.55_0.22_25_/_0.3)] backdrop-blur-md"
        style={placement.info}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <h3 className="text-lg leading-tight text-ink">{product.title}</h3>
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
              {product.tagline}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            autoFocus
            data-product-dialog-close
            className="shrink-0 border border-white/15 px-2 py-0.5 text-sm text-muted transition-colors hover:border-primary hover:text-primary"
          >
            ✕
          </button>
        </header>

        <div className="product-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {product.description && (
            <p className="mb-6 text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}

          {product.features && product.features.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
                AI Aimbot — Universal Edition
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {product.features.map((f, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-md border border-white/5 bg-black/40 p-2 shadow-[inset_0_0_12px_rgba(255,255,255,0.02)]"
                  >
                    <span className="mb-0.5 text-[0.6rem] font-medium tracking-wide text-muted/80 uppercase">
                      {f.label}
                    </span>
                    <span
                      className={`text-[0.75rem] font-bold ${
                        f.value.toLowerCase().includes("sim") ||
                        f.value.toLowerCase().includes("yes") ||
                        f.value.toLowerCase().includes("external")
                          ? "text-green-400/90"
                          : "text-ink"
                      }`}
                    >
                      {f.value}
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
                {product.systemSupport.map((f, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-md border border-primary/20 bg-primary/[0.03] p-2"
                  >
                    <span className="mb-0.5 text-[0.6rem] font-medium tracking-wide text-primary/70 uppercase">
                      {f.label}
                    </span>
                    <span className="text-[0.75rem] font-bold text-ink">
                      {f.value}
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
                {product.menuKeys.map((k, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-md border border-white/10 bg-black/60 p-2"
                  >
                    <span className="shrink-0 rounded bg-primary/20 px-2 py-0.5 text-[0.65rem] font-black tracking-widest text-primary">
                      {k.label}
                    </span>
                    <span className="text-[0.7rem] leading-tight text-muted">
                      {k.value}
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
                {product.tutorialSteps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[0.7rem] text-muted/90 rounded-md border border-white/5 bg-black/20 p-2.5"
                  >
                    <span className="flex mt-0.5 h-4 w-4 shrink-0 items-center justify-center rounded border border-primary/30 text-[0.55rem] font-black text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-6">
            <h4 className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
              Atendimento 6DNX
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href={supportUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-4 py-3 transition-colors hover:border-primary/70 hover:bg-primary/20"
              >
                <span className="text-[0.65rem] font-black uppercase tracking-widest text-primary">
                  Discord · Canal Welcome
                </span>
                <span className="text-primary text-xs">↗</span>
              </a>
              <p className="rounded-md border border-white/10 bg-black/30 px-4 py-3 text-[0.68rem] leading-relaxed text-muted">
                O pagamento e a entrega são combinados com o atendimento. O
                site não libera arquivos automaticamente.
              </p>
            </div>
          </div>

          {requiresVariant ? (
            <>
              <p className="mb-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
                Variações · escolha uma opção
              </p>
              <ul className="space-y-1.5">
                {product.variants.map((v) => (
                  <VariantRow
                    key={v.name}
                    variant={v}
                    selected={selection.selectedVariant === v.name}
                    onPick={selection.selectVariant}
                  />
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <footer className="flex flex-col border-t border-primary">
          {requiresVariant && !selection.selectedVariant ? (
            <button
              type="button"
              disabled
              className="min-h-[3.25rem] bg-white/5 px-4 text-sm font-bold uppercase tracking-[0.12em] text-muted cursor-not-allowed"
            >
              Selecione uma variação
            </button>
          ) : (
            <a
              href={supportUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[3.25rem] items-center justify-center bg-primary px-4 text-center text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-white hover:text-black"
            >
              {requiresVariant
                ? "Iniciar pedido no Discord"
                : "Consultar no Discord"}
            </a>
          )}
          <a
            href={supportUrl}
            className="flex min-h-10 items-center justify-center border-t border-primary/20 bg-black/40 px-4 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted transition-colors hover:text-white"
          >
            Dúvidas? Fale com o suporte
          </a>
        </footer>
      </section>

      <section
        aria-label={`Prévia de ${product.title}`}
        data-popup-side="right"
        className="product-popup product-popup--video-right fixed z-[80] overflow-hidden border border-primary/40 bg-black shadow-[0_0_50px_oklch(0.55_0.22_25_/_0.3)]"
        style={placement.video}
      >
        <ProductMediaPreview product={product} />
      </section>
    </>
  );
}

function Card({
  product,
  open,
  obscured,
  centered,
  onOpen,
  modalClone = false,
}: {
  product: Product;
  open: boolean;
  obscured: boolean;
  centered: boolean;
  onOpen?: (el: HTMLElement, trigger: HTMLButtonElement) => void;
  modalClone?: boolean;
}) {
  const from = priceFrom(product);
  const productTheme = product.theme ?? {
    accentColor: "#e3062c",
    textColor: "#f7f3f4",
    surfaceColor: "#0b0708",
  };

  return (
    <article
      data-product-card={modalClone ? undefined : product.slug}
      aria-hidden={modalClone ? true : undefined}
      style={
        {
          "--product-card-accent": productTheme.accentColor,
          "--product-card-text": productTheme.textColor,
          "--product-card-surface": productTheme.surfaceColor,
        } as React.CSSProperties
      }
      className={`product-card group relative flex flex-col overflow-hidden rounded-[1.35rem] border bg-surface text-left transition-[border-color,box-shadow,transform,opacity] duration-500 ${
        modalClone ? "h-full min-h-0" : "min-h-[31rem]"
      } ${centered && !modalClone ? "lg:col-start-2" : ""} ${
        open && modalClone
          ? "border-primary shadow-[0_0_54px_var(--primary-glow)]"
          : open
            ? "z-[70] scale-[1.025] border-primary shadow-[0_0_54px_var(--primary-glow)] lg:col-start-2"
            : obscured
              ? "pointer-events-none opacity-0"
              : "reveal-up border-white/10 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_0_38px_var(--primary-glow)]"
      } ${
        modalClone ? "select-none" : ""
      }`}
    >
      <div className="product-card__visual relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-black">
        <Image
          src={product.image}
          alt=""
          fill
          loading="eager"
          sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 31vw"
          className="product-card__art object-cover opacity-[0.82] saturate-[0.82] transition duration-700 group-hover:scale-[1.055] group-hover:opacity-100 group-hover:saturate-100"
        />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,oklch(0.04_0_0_/_0.2)_0%,transparent_34%,oklch(0.055_0.02_25_/_0.35)_65%,var(--surface)_100%)]" />

        <div
          aria-hidden
          className="product-card__angel absolute -bottom-[18%] right-1 z-[3] h-[112%] w-[34%] min-w-[6.25rem] max-w-[8.2rem]"
        >
          <Image
            src="/anjo1-premium.webp"
            alt=""
            fill
            sizes="132px"
            className="object-contain object-bottom"
          />
        </div>

        <div className="absolute inset-x-4 top-4 z-[4] flex flex-wrap items-center justify-between gap-2">
          <span className="border border-accent/40 bg-black/70 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-accent backdrop-blur-sm">
            {productStatusLabel(product.status)}
          </span>
          <span className="border border-white/15 bg-black/70 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted backdrop-blur-sm">
            {product.variants.length}{" "}
            {product.variants.length === 1 ? "variação" : "variações"}
          </span>
        </div>

        <p className="product-card__category absolute bottom-4 left-4 z-[4] max-w-[62%] border-l-2 border-primary bg-black/55 px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.2em] text-ink backdrop-blur-sm">
          {product.category}
        </p>
      </div>

      <div className="product-card__body flex flex-1 flex-col p-6">
        <p className="product-card__eyebrow mb-2 flex items-center gap-2 text-[0.58rem] font-bold uppercase tracking-[0.28em] text-primary/80">
          <span className="product-card__eyebrow-line inline-block h-px w-7 bg-primary/70" aria-hidden />
          6DNX // catálogo seguro
        </p>
        <h3 className="mb-1 text-2xl leading-tight text-ink">{product.title}</h3>
        <p className="mb-5 text-sm text-muted">{product.tagline}</p>

        <ul className="mb-6 flex flex-1 flex-wrap content-start gap-1.5">
          {product.variants.slice(0, 5).map((v) => (
            <li
              key={v.name}
              className="border border-white/10 bg-black/20 px-2 py-0.5 text-[0.7rem] text-muted"
            >
              {v.name}
            </li>
          ))}
          {product.variants.length > 5 ? (
            <li className="product-card__more px-2 py-0.5 text-[0.7rem] text-primary">
              +{product.variants.length - 5}
            </li>
          ) : null}
        </ul>

        <p className="mb-4 text-sm text-muted">
          {from ? (
            <>
              Referência a partir de{" "}
              <span className="text-xl font-bold text-ink">{formatBRL(from)}</span>
            </>
          ) : (
            <span className="text-base font-bold text-ink">
              Preço sob consulta
            </span>
          )}
        </p>

        <span
          aria-hidden
          className="product-card__cta inline-flex min-h-11 items-center justify-center border border-primary bg-primary px-4 text-sm font-bold uppercase tracking-[0.14em] text-ink transition-colors group-hover:bg-transparent group-hover:text-primary"
        >
          Ver detalhes
        </span>
      </div>

      {!modalClone && onOpen ? (
        <button
          type="button"
          onClick={(event) =>
            onOpen(
              event.currentTarget.parentElement as HTMLElement,
              event.currentTarget,
            )
          }
          aria-label={`Centralizar e abrir detalhes de ${product.title}`}
          aria-expanded={open}
          className="absolute inset-0 z-[5] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        />
      ) : null}
    </article>
  );
}

function SelectedProductCard({
  product,
  placement,
}: {
  product: Product;
  placement: Placement;
}) {
  return (
    <div
      data-selected-product-card={product.slug}
      aria-hidden
      className="fixed z-[70]"
      style={placement.card}
    >
      <Card
        product={product}
        open
        obscured={false}
        centered={false}
        modalClone
      />
    </div>
  );
}

function AdjacentPagePeek({
  side,
  products: previewProducts,
  onNavigate,
}: {
  side: "previous" | "next";
  products: Product[];
  onNavigate: () => void;
}) {
  const previous = side === "previous";
  const directionLabel = previous ? "anterior" : "seguinte";
  const nearestProduct = previewProducts[0];
  const additionalProducts = Math.max(0, previewProducts.length - 1);

  return (
    <button
      type="button"
      onClick={onNavigate}
      data-catalog-peek={side}
      aria-label={`Ver página ${directionLabel}, com ${previewProducts.length} ${
        previewProducts.length === 1 ? "produto" : "produtos"
      }; prévia: ${nearestProduct.title}${
        additionalProducts > 0 ? ` e mais ${additionalProducts}` : ""
      }`}
      className={`catalog-page-peek catalog-page-peek--${side}`}
    >
      {previewProducts.slice(0, 3).map((product, depth) => (
        <span
          key={product.slug}
          className={`catalog-page-peek__card catalog-page-peek__card--depth-${depth}`}
          aria-hidden
        >
          <span className="catalog-page-peek__visual">
            <Image
              src={product.image}
              alt=""
              fill
              sizes="288px"
              className="object-cover"
            />
            <span className="catalog-page-peek__visual-shade" />
          </span>
          <span className="catalog-page-peek__body">
            <span className="catalog-page-peek__eyebrow">
              6DNX //{" "}
              {previous ? "transmissão anterior" : "próxima transmissão"}
            </span>
            <strong>{product.title}</strong>
            <small>{product.category}</small>
          </span>
        </span>
      ))}
      <span className="catalog-page-peek__cue" aria-hidden>
        <span>{previous ? "‹" : "›"}</span>
        <small>mais</small>
      </span>
    </button>
  );
}

export function ProductShowcase({
  catalogProducts,
}: {
  catalogProducts: Product[];
}) {
  if (catalogProducts.length === 0) {
    return (
      <section
        id="produtos"
        className="product-showcase-section site-flow-section relative bg-transparent px-4 py-20 md:px-8 md:py-28"
        aria-labelledby="produtos-heading"
      >
        <div className="relative z-[var(--z-content)] mx-auto max-w-3xl border border-primary/35 bg-surface/90 px-6 py-12 text-center shadow-[0_0_50px_oklch(0.55_0.22_25_/_0.18)]">
          <span className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-primary">
            Catálogo protegido
          </span>
          <h2
            id="produtos-heading"
            className="mt-3 text-[clamp(2rem,5vw,3.25rem)] tracking-tight text-ink"
          >
            Produtos temporariamente indisponíveis
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/72">
            O site não vai exibir uma cópia antiga quando o banco estiver
            indisponível. Fale com o atendimento enquanto o catálogo é
            verificado.
          </p>
          <a
            href="/api/redirect"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex min-h-12 items-center justify-center bg-primary px-7 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-white hover:text-black"
          >
            Falar com o atendimento
          </a>
        </div>
      </section>
    );
  }

  return <ProductCatalogShowcase catalogProducts={catalogProducts} />;
}

function ProductCatalogShowcase({
  catalogProducts,
}: {
  catalogProducts: Product[];
}) {
  const productCatalog = useMemo(
    () => buildProductCatalogLayout(catalogProducts, PER_PAGE),
    [catalogProducts],
  );
  const defaultProductPage = productCatalog.defaultPage;
  const firstRightProductPage = productCatalog.firstRightPage;
  const [page, setPage] = useState(defaultProductPage);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const pagerRef = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const originScrollRef = useRef<number | null>(null);
  const wide = useSyncExternalStore(
    subscribeToWidePopup,
    getWidePopupSnapshot,
    getWidePopupServerSnapshot,
  );

  const pages = productCatalog.pages.length;
  const visible =
    productCatalog.pages[page] ??
    productCatalog.pages[defaultProductPage];
  const previousPage = page > 0 ? productCatalog.pages[page - 1] : null;
  const nextPage =
    page < pages - 1 ? productCatalog.pages[page + 1] : null;
  const previousPreviewProducts = previousPage
    ? [...previousPage].reverse()
    : [];
  const nextPreviewProducts = nextPage ?? [];

  const openProduct =
    catalogProducts.find((product) => product.slug === openSlug) ?? null;
  const orderedVisible = useMemo(() => {
    if (!wide || !openSlug) return visible;
    const selectedIndex = visible.findIndex(
      (product) => product.slug === openSlug,
    );
    if (selectedIndex < 0 || selectedIndex === 1 || visible.length < 2) {
      return visible;
    }

    const ordered = [...visible];
    const [selected] = ordered.splice(selectedIndex, 1);
    ordered.splice(Math.min(1, ordered.length), 0, selected);
    return ordered;
  }, [openSlug, visible, wide]);

  useEffect(() => {
    const resetRestoredPage = (event: PageTransitionEvent) => {
      if (event.persisted) setPage(defaultProductPage);
    };
    window.addEventListener("pageshow", resetRestoredPage);
    return () => window.removeEventListener("pageshow", resetRestoredPage);
  }, [defaultProductPage]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pager = pagerRef.current;
    if (!section || !pager) return;

    // Only target shadows inside the pager nav, not the big side arrows
    const shadows = Array.from(
      pager.querySelectorAll<HTMLElement>("[data-pager-shadow]"),
    );
    if (!shadows.length) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(shadows, {
        autoAlpha: 0,
        scale: 1,
        x: 0,
        y: 0,
        filter: "blur(0px)",
        transformOrigin: "50% 50%",
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "bottom bottom",
          end: "bottom 12%",
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(
          shadows,
          {
            autoAlpha: 0.9,
            scale: 1.14,
            duration: 0.1,
            stagger: { each: 0.012, from: "center" },
            ease: "power2.out",
          },
          0,
        )
        .to(
          shadows,
          {
            autoAlpha: 0.66,
            scale: (index) => (index === 1 || index === 2 ? 8.5 : 7),
            x: (index) =>
              (index - 1.5) * Math.min(window.innerWidth * 0.27, 320),
            y: (index) =>
              Math.min(window.innerHeight * (0.14 + index * 0.025), 170),
            filter: "blur(4px)",
            duration: 0.72,
            stagger: { each: 0.018, from: "center" },
            ease: "power1.inOut",
          },
          0.06,
        )
        .to(
          shadows,
          {
            autoAlpha: 0,
            filter: "blur(12px)",
            duration: 0.22,
            stagger: { each: 0.012, from: "center" },
            ease: "power2.in",
          },
          0.78,
        );
    });

    return () => mm.revert();
  }, []);

  const close = useCallback(() => {
    const originScroll = originScrollRef.current;
    const returnFocus = returnFocusRef.current;
    setOpenSlug(null);
    setPlacement(null);
    anchorRef.current = null;
    originScrollRef.current = null;
    returnFocusRef.current = null;

    window.requestAnimationFrame(() => {
      if (originScroll !== null) {
        window.scrollTo({
          top: originScroll,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }
      returnFocus?.focus({ preventScroll: true });
    });
  }, []);

  // Popups are viewport-anchored, so freeze the page while one is open instead
  // of recomputing on every scroll tick.
  useEffect(() => {
    if (!openSlug || (wide && !placement)) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    const page = sectionRef.current?.closest("main");
    const pageWasInert = page?.hasAttribute("inert") ?? false;
    const modalRoot = document.querySelector<HTMLElement>(
      "[data-product-modal-root]",
    );
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    const focusableElements = () =>
      modalRoot
        ? Array.from(
            modalRoot.querySelectorAll<HTMLElement>(focusableSelector),
          ).filter((element) => element.getClientRects().length > 0)
        : [];

    root.style.overflow = "hidden";
    page?.setAttribute("inert", "");

    const focusFrame = window.requestAnimationFrame(() => {
      modalRoot
        ?.querySelector<HTMLElement>("[data-product-dialog-close]")
        ?.focus({ preventScroll: true });
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = focusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const [first] = focusable;
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      root.style.overflow = prev;
      if (!pageWasInert) page?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
    };
  }, [openSlug, placement, wide, close]);

  useLayoutEffect(() => {
    if (!openSlug || !wide || !anchorRef.current) return;

    const card = anchorRef.current;
    let settleTimer = 0;
    const animationFrame = window.requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const targetTop = clamp(
        window.scrollY + rect.top - (window.innerHeight - rect.height) / 2,
        0,
        Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
      );
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({
        top: targetTop,
        behavior: reducedMotion ? "auto" : "smooth",
      });

      settleTimer = window.setTimeout(
        () => setPlacement(place(card.getBoundingClientRect())),
        reducedMotion ? 0 : 460,
      );
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
    };
  }, [openSlug, wide]);

  useEffect(() => {
    if (!openSlug || !wide) return;

    const syncPlacement = () => {
      if (anchorRef.current) {
        setPlacement(place(anchorRef.current.getBoundingClientRect()));
      }
    };

    window.addEventListener("resize", syncPlacement);
    window.visualViewport?.addEventListener("resize", syncPlacement);
    return () => {
      window.removeEventListener("resize", syncPlacement);
      window.visualViewport?.removeEventListener("resize", syncPlacement);
    };
  }, [openSlug, wide]);

  const openCard = (
    slug: string,
    el: HTMLElement,
    trigger: HTMLButtonElement,
  ) => {
    anchorRef.current = el;
    returnFocusRef.current = trigger;
    originScrollRef.current = wide ? window.scrollY : null;
    setPlacement(null);
    setOpenSlug(slug);
  };

  const changePage = (nextPage: number) => {
    if (openSlug) {
      originScrollRef.current = null;
      close();
    }
    setPage(clamp(nextPage, 0, pages - 1));
  };

  return (
    <section
      ref={sectionRef}
      id="produtos"
      data-catalog-page={page}
      data-catalog-pages={pages}
      data-catalog-default-page={defaultProductPage}
      className="product-showcase-section site-flow-section relative bg-transparent px-4 py-20 md:px-8 md:py-28"
      aria-labelledby="produtos-heading"
    >
      <div className="reveal-up relative z-[var(--z-content)] mx-auto mb-12 max-w-6xl text-center">
        <h2
          id="produtos-heading"
          className="mb-3 text-[clamp(2rem,5vw,3.25rem)] tracking-tight text-ink"
        >
          Soluções 6DNX
        </h2>
        <p className="mx-auto max-w-2xl text-white/72">
          Cada produto possui seu próprio card, arte 6DNX, informações e
          variações de preço.
        </p>
      </div>

      <div className="product-catalog-stage relative mx-auto w-full max-w-[90rem] overflow-x-clip">
        {!openSlug && previousPreviewProducts.length > 0 ? (
          <AdjacentPagePeek
            key={`previous-${page}`}
            side="previous"
            products={previousPreviewProducts}
            onNavigate={() => changePage(page - 1)}
          />
        ) : null}

        {!openSlug && nextPreviewProducts.length > 0 ? (
          <AdjacentPagePeek
            key={`next-${page}`}
            side="next"
            products={nextPreviewProducts}
            onNavigate={() => changePage(page + 1)}
          />
        ) : null}

        <div className="pointer-events-none relative z-[var(--z-content)] mx-auto flex w-full max-w-7xl items-center justify-center gap-2 lg:gap-8">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page === 0 || Boolean(openSlug)}
            aria-label="Exibir cards anteriores"
            data-catalog-previous
            className={`pointer-events-auto relative hidden h-24 w-16 shrink-0 items-center justify-center text-7xl font-light text-primary/70 transition-[color,opacity,transform] hover:scale-105 hover:text-primary disabled:pointer-events-none disabled:opacity-15 md:flex ${
              wide && openSlug ? "invisible" : ""
            }`}
          >
            ‹
          </button>

          <div className="pointer-events-auto relative grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {orderedVisible.map((product) => (
              <Card
                key={product.slug}
                product={product}
                open={openSlug === product.slug}
                obscured={
                  wide && openSlug !== null && openSlug !== product.slug
                }
                centered={orderedVisible.length === 1}
                onOpen={(el, trigger) => openCard(product.slug, el, trigger)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={page === pages - 1 || Boolean(openSlug)}
            aria-label="Exibir próximos cards"
            data-catalog-next
            className={`pointer-events-auto relative hidden h-24 w-16 shrink-0 items-center justify-center text-7xl font-light text-primary/70 transition-[color,opacity,transform] hover:scale-105 hover:text-primary disabled:pointer-events-none disabled:opacity-15 md:flex ${
              wide && openSlug ? "invisible" : ""
            }`}
          >
            ›
          </button>
        </div>
      </div>

      <nav
        ref={pagerRef}
        className="relative z-[var(--z-content)] mx-auto mt-14 flex max-w-5xl flex-col items-center gap-4"
        aria-label="Navegar pelos cards de produtos"
      >
        <div className="flex items-center justify-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page === 0 || Boolean(openSlug)}
            aria-label="Página anterior de produtos"
            className="inline-flex size-11 items-center justify-center text-3xl leading-none text-primary/70 transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-20"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page === 0 || Boolean(openSlug)}
            aria-label="Produtos anteriores"
            className="relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none text-muted transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-35"
          >
            <span className="relative z-[1]">6</span>
            <span
              aria-hidden
              data-pager-shadow="6"
              className="product-pager__shadow"
            >
              6
            </span>
          </button>

          <button
            type="button"
            onClick={() => changePage(defaultProductPage)}
            disabled={Boolean(openSlug)}
            aria-label="Abrir a página inicial D"
            aria-current={page === defaultProductPage ? "page" : undefined}
            className={`relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none transition-colors ${
              page === defaultProductPage
                ? "text-primary drop-shadow-[0_0_18px_var(--primary-glow)]"
                : "text-muted/55 hover:text-muted"
            }`}
          >
            <span className="relative z-[1]">D</span>
            <span
              aria-hidden
              data-pager-shadow="D"
              className="product-pager__shadow"
            >
              D
            </span>
          </button>

          <button
            type="button"
            onClick={() => changePage(firstRightProductPage)}
            disabled={
              firstRightProductPage >= pages || Boolean(openSlug)
            }
            aria-label="Abrir a página N"
            aria-current={
              page === firstRightProductPage ? "page" : undefined
            }
            className={`relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none transition-colors ${
              page === firstRightProductPage
                ? "text-primary drop-shadow-[0_0_18px_var(--primary-glow)]"
                : "text-muted/55 hover:text-muted"
            } disabled:pointer-events-none disabled:opacity-35`}
          >
            <span className="relative z-[1]">N</span>
            <span
              aria-hidden
              data-pager-shadow="N"
              className="product-pager__shadow"
            >
              N
            </span>
          </button>

          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={page === pages - 1 || Boolean(openSlug)}
            aria-label="Próximos produtos"
            className="relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none text-muted transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-35"
          >
            <span className="relative z-[1]">X</span>
            <span
              aria-hidden
              data-pager-shadow="X"
              className="product-pager__shadow"
            >
              X
            </span>
          </button>

          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={page === pages - 1 || Boolean(openSlug)}
            aria-label="Próxima página de produtos"
            className="inline-flex size-11 items-center justify-center text-3xl leading-none text-primary/70 transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-20"
          >
            ›
          </button>
        </div>

        <div
          aria-hidden
          className="flex max-w-full items-center justify-center gap-1"
        >
          {Array.from({ length: pages }, (_, index) => (
            <span
              key={index}
              className={`h-px transition-[width,background-color,box-shadow] ${
                page === index
                  ? "w-5 bg-primary shadow-[0_0_10px_var(--primary-glow)]"
                  : "w-2 bg-white/15"
              }`}
            />
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          Exibindo o grupo {page + 1} de {pages}, com{" "}
          {visible.length === 1
            ? "1 produto"
            : `${visible.length} produtos`}.
        </p>
      </nav>

      {typeof document !== "undefined" && openProduct
        ? createPortal(
            <div data-product-modal-root>
              <div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
                onClick={close}
                aria-hidden
              />
              {wide ? (
                placement ? (
                  <>
                    <SelectedProductCard
                      product={openProduct}
                      placement={placement}
                    />
                    <Popups
                      product={openProduct}
                      placement={placement}
                      onClose={close}
                    />
                  </>
                ) : null
              ) : (
                <MobileSheet product={openProduct} onClose={close} />
              )}
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

/** Narrow screens: one centered sheet instead of side popups — the no-overflow
    rule matters more than the layout choreography here. */
function MobileSheet({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const selection = useProductSelection();
  const supportUrl = `/api/redirect?slug=${encodeURIComponent(product.slug)}`;
  const requiresVariant = product.variants.length > 0;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${product.title}`}
      className="fixed left-1/2 top-1/2 z-[80] flex max-h-[86vh] w-[min(30rem,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-primary/40 bg-surface shadow-[0_0_50px_oklch(0.55_0.22_25_/_0.3)]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="text-lg leading-tight text-ink">{product.title}</h3>
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
            {product.tagline}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          autoFocus
          data-product-dialog-close
          className="shrink-0 border border-white/15 px-2 py-0.5 text-sm text-muted"
        >
          ✕
        </button>
      </header>

      <div className="product-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="aspect-video w-full bg-black">
          <ProductMediaPreview product={product} />
        </div>

        <div className="px-4 py-3">
          <p className="mb-4 text-sm leading-relaxed text-muted">
            {product.description}
          </p>
          {requiresVariant ? (
            <ul className="space-y-1.5">
              {product.variants.map((v) => (
                <VariantRow
                  key={v.name}
                  variant={v}
                  selected={selection.selectedVariant === v.name}
                  onPick={selection.selectVariant}
                />
              ))}
            </ul>
          ) : (
            <p className="rounded border border-white/10 bg-black/30 px-3 py-3 text-xs leading-relaxed text-muted">
              Este item precisa de confirmação direta com o atendimento.
            </p>
          )}
        </div>
      </div>

      <footer className="grid border-t border-primary">
        {requiresVariant && !selection.selectedVariant ? (
          <button
            type="button"
            disabled
            className="min-h-12 cursor-not-allowed bg-white/10 px-4 text-sm font-bold uppercase tracking-[0.12em] text-muted"
          >
            Selecione uma variação
          </button>
        ) : (
          <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center bg-primary px-4 text-center text-sm font-bold uppercase tracking-[0.12em] text-ink"
          >
            {requiresVariant
              ? "Iniciar pedido no Discord"
              : "Consultar no Discord"}
          </a>
        )}
        <a
          href={supportUrl}
          className="inline-flex min-h-11 items-center justify-center border-t border-primary/40 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-muted"
        >
          Suporte Discord
        </a>
      </footer>
    </section>
  );
}
