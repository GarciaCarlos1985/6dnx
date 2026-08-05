"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  formatBRL,
  isVariantSoldOut,
  priceFrom,
  productStatusLabel,
  purchasableProductVariants,
  visibleProductVariants,
  type Product,
  type Variant,
} from "@/lib/products";
import {
  buildProductCatalogLayout,
  CATALOG_CARDS_PER_ROW,
  CATALOG_VISIBLE_ROWS,
} from "@/lib/product-catalog-layout";
import { PixCheckoutModal } from "@/components/pix-checkout-modal";
import { DiscordMark } from "@/components/discord-mark";

gsap.registerPlugin(ScrollTrigger);

const PER_PAGE = CATALOG_CARDS_PER_ROW;
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
  const roomRight = Math.max(VIDEO_MIN_W, vw - card.right - GAP - MARGIN);
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
    top: clamp(centerY - videoH / 2, MARGIN, vh - videoH - MARGIN),
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

function useProductSelection(product: Product) {
  const purchasableVariants = purchasableProductVariants(product);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    () =>
      purchasableVariants.length === 1 ? purchasableVariants[0].name : null,
  );

  const selectVariant = (name: string) => {
    if (purchasableVariants.some((variant) => variant.name === name)) {
      setSelectedVariant(name);
    }
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
        style={variant.accentColor ? { borderColor: variant.accentColor } : undefined}
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

function ProductPurchasePanel({
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
            <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-white/72">
              Escolha sua opção
            </p>
            {purchasableVariants.length === 1 ? (
              <span className="text-[0.5rem] uppercase tracking-[0.12em] text-green-300/75">
                opção única selecionada
              </span>
            ) : null}
          </div>
          <ul className="product-scrollbar max-h-32 space-y-1.5 overflow-y-auto pr-0.5">
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

      <div className="mt-2 grid grid-cols-[1.15fr_.85fr] gap-2">
        <DiscordSupportLink supportUrl={supportUrl} />
        <PurchaseFlowGuide />
      </div>
    </div>
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
  checkoutAvailable,
  paymentTestAvailable,
  onClose,
}: {
  product: Product;
  placement: Placement;
  checkoutAvailable: boolean;
  paymentTestAvailable: boolean;
  onClose: () => void;
}) {
  const selection = useProductSelection(product);
  const supportUrl = `/api/redirect?slug=${encodeURIComponent(product.slug)}`;
  const [checkoutVariantName, setCheckoutVariantName] = useState<string | null>(
    null,
  );
  const checkoutTriggerRef = useRef<HTMLButtonElement>(null);
  const checkoutVariant =
    product.variants.find((variant) => variant.name === checkoutVariantName) ??
    null;

  const closeCheckout = () => {
    setCheckoutVariantName(null);
    window.requestAnimationFrame(() =>
      checkoutTriggerRef.current?.focus({ preventScroll: true }),
    );
  };

  return (
    <>
      <div
        inert={checkoutVariant ? true : undefined}
        aria-hidden={checkoutVariant ? true : undefined}
      >
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
              <h3 className="text-lg leading-tight text-ink">
                {product.title}
              </h3>
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

          <ProductPurchasePanel
            product={product}
            selectedVariant={selection.selectedVariant}
            onPick={selection.selectVariant}
            checkoutAvailable={checkoutAvailable}
            checkoutTriggerRef={checkoutTriggerRef}
            onCheckout={setCheckoutVariantName}
            supportUrl={supportUrl}
          />

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

          </div>
        </section>

        <section
          aria-label={`Prévia de ${product.title}`}
          data-popup-side="right"
          className="product-popup product-popup--video-right fixed z-[80] overflow-hidden border border-primary/40 bg-black shadow-[0_0_50px_oklch(0.55_0.22_25_/_0.3)]"
          style={placement.video}
        >
          <ProductMediaPreview product={product} />
        </section>
      </div>

      {checkoutVariant ? (
        <PixCheckoutModal
          product={product}
          variant={checkoutVariant}
          checkoutAvailable={checkoutAvailable}
          paymentTestAvailable={paymentTestAvailable}
          onClose={closeCheckout}
        />
      ) : null}
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
  const visibleVariants = visibleProductVariants(product);
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
      } ${modalClone ? "select-none" : ""}`}
    >
      <div className="product-card__visual relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-black">
        <Image
          src={product.image}
          alt=""
          fill
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

        <div className="absolute inset-x-4 top-4 z-[4] flex flex-wrap items-center gap-2">
          <span className="border border-accent/40 bg-black/70 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-accent backdrop-blur-sm">
            {productStatusLabel(product.status)}
          </span>
        </div>

        <p className="product-card__category absolute bottom-4 left-4 z-[4] max-w-[62%] border-l-2 border-primary bg-black/55 px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.2em] text-ink backdrop-blur-sm">
          {product.category}
        </p>
      </div>

      <div className="product-card__body flex flex-1 flex-col p-6">
        <p className="product-card__eyebrow mb-2 flex items-center gap-2 text-[0.58rem] font-bold uppercase tracking-[0.28em] text-primary/80">
          <span
            className="product-card__eyebrow-line inline-block h-px w-7 bg-primary/70"
            aria-hidden
          />
          6DNX // catálogo seguro
        </p>
        <h3 className="mb-1 text-2xl leading-tight text-ink">
          {product.title}
        </h3>
        <p className="mb-5 text-sm text-muted">{product.tagline}</p>

        <ul className="mb-6 flex flex-1 flex-wrap content-start gap-1.5">
          {visibleVariants.slice(0, 5).map((v) => (
            <li
              key={v.name}
              className="border border-white/10 bg-black/20 px-2 py-0.5 text-[0.7rem] text-muted"
              style={v.accentColor ? { borderColor: v.accentColor } : undefined}
            >
              {v.name}
              {v.availability === "sold-out" ? " · esgotado" : ""}
            </li>
          ))}
          {visibleVariants.length > 5 ? (
            <li className="product-card__more px-2 py-0.5 text-[0.7rem] text-primary">
              +{visibleVariants.length - 5}
            </li>
          ) : null}
        </ul>

        <p className="mb-4 text-sm text-muted">
          {from ? (
            <>
              Referência a partir de{" "}
              <span className="text-xl font-bold text-ink">
                {formatBRL(from)}
              </span>
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
  disabled,
}: {
  side: "previous" | "next";
  products: Product[];
  onNavigate: () => void;
  disabled: boolean;
}) {
  const previous = side === "previous";
  const directionLabel = previous ? "anterior" : "seguinte";
  const nearestProduct = previewProducts[0];
  const additionalProducts = Math.max(0, previewProducts.length - 1);

  return (
    <button
      type="button"
      onClick={onNavigate}
      disabled={disabled}
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

function CatalogShelfRow({
  rowIndex,
  pageIndex,
  products,
  previousProducts,
  nextProducts,
  openSlug,
  wide,
  transitioning,
  onNavigate,
  onOpen,
}: {
  rowIndex: number;
  pageIndex: number;
  products: Product[];
  previousProducts: Product[];
  nextProducts: Product[];
  openSlug: string | null;
  wide: boolean;
  transitioning: boolean;
  onNavigate: (nextPage: number) => void;
  onOpen: (
    product: Product,
    element: HTMLElement,
    trigger: HTMLButtonElement,
  ) => void;
}) {
  const orderedProducts = useMemo(() => {
    if (!wide || !openSlug) return products;
    const selectedIndex = products.findIndex(
      (product) => product.slug === openSlug,
    );
    if (selectedIndex < 0 || selectedIndex === 1 || products.length < 2) {
      return products;
    }

    const ordered = [...products];
    const [selected] = ordered.splice(selectedIndex, 1);
    ordered.splice(Math.min(1, ordered.length), 0, selected);
    return ordered;
  }, [openSlug, products, wide]);

  if (!products.length) return null;

  return (
    <div
      className="product-catalog-row"
      data-catalog-row={rowIndex + 1}
      data-catalog-row-page={pageIndex}
      aria-label={`Fileira ${rowIndex + 1} de produtos`}
    >
      <div className="product-catalog-stage relative mx-auto w-full max-w-[90rem] overflow-x-clip">
        {!openSlug && previousProducts.length > 0 ? (
          <AdjacentPagePeek
            side="previous"
            products={[...previousProducts].reverse()}
            onNavigate={() => onNavigate(pageIndex - 1)}
            disabled={transitioning}
          />
        ) : null}

        {!openSlug && nextProducts.length > 0 ? (
          <AdjacentPagePeek
            side="next"
            products={nextProducts}
            onNavigate={() => onNavigate(pageIndex + 1)}
            disabled={transitioning}
          />
        ) : null}

        <div className="pointer-events-none relative z-[var(--z-content)] mx-auto flex w-full max-w-7xl items-center justify-center gap-1.5 md:gap-2 lg:gap-8">
          <button
            type="button"
            onClick={() => onNavigate(pageIndex - 1)}
            disabled={
              previousProducts.length === 0 ||
              Boolean(openSlug) ||
              transitioning
            }
            aria-label={`Exibir cards anteriores da fileira ${rowIndex + 1}`}
            className={`catalog-row-arrow pointer-events-auto relative flex h-16 w-8 shrink-0 items-center justify-center text-5xl font-light text-primary/70 transition-[color,opacity,transform] hover:scale-105 hover:text-primary disabled:pointer-events-none disabled:opacity-15 md:h-24 md:w-16 md:text-7xl ${
              wide && openSlug ? "invisible" : ""
            }`}
          >
            ‹
          </button>

          <div className="pointer-events-auto relative grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {orderedProducts.map((product) => (
              <Card
                key={product.slug}
                product={product}
                open={openSlug === product.slug}
                obscured={
                  wide && openSlug !== null && openSlug !== product.slug
                }
                centered={orderedProducts.length === 1}
                onOpen={(element, trigger) => onOpen(product, element, trigger)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigate(pageIndex + 1)}
            disabled={
              nextProducts.length === 0 || Boolean(openSlug) || transitioning
            }
            aria-label={`Exibir próximos cards da fileira ${rowIndex + 1}`}
            className={`catalog-row-arrow pointer-events-auto relative flex h-16 w-8 shrink-0 items-center justify-center text-5xl font-light text-primary/70 transition-[color,opacity,transform] hover:scale-105 hover:text-primary disabled:pointer-events-none disabled:opacity-15 md:h-24 md:w-16 md:text-7xl ${
              wide && openSlug ? "invisible" : ""
            }`}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductShowcase({
  catalogProducts,
  checkoutAvailable,
  paymentTestAvailable,
  developerCreditUrl,
}: {
  catalogProducts: Product[];
  checkoutAvailable: boolean;
  paymentTestAvailable: boolean;
  developerCreditUrl: string | null;
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

  return (
    <ProductCatalogShowcase
      catalogProducts={catalogProducts}
      checkoutAvailable={checkoutAvailable}
      paymentTestAvailable={paymentTestAvailable}
      developerCreditUrl={developerCreditUrl}
    />
  );
}

function ProductCatalogShowcase({
  catalogProducts,
  checkoutAvailable,
  paymentTestAvailable,
  developerCreditUrl,
}: {
  catalogProducts: Product[];
  checkoutAvailable: boolean;
  paymentTestAvailable: boolean;
  developerCreditUrl: string | null;
}) {
  const productCatalog = useMemo(
    () =>
      buildProductCatalogLayout(
        catalogProducts,
        PER_PAGE,
        CATALOG_VISIBLE_ROWS,
      ),
    [catalogProducts],
  );
  const [rowPages, setRowPages] = useState<number[]>(() =>
    Array.from({ length: CATALOG_VISIBLE_ROWS }, () => 0),
  );
  const [transitioningRows, setTransitioningRows] = useState<boolean[]>(() =>
    Array.from({ length: CATALOG_VISIBLE_ROWS }, () => false),
  );
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const originScrollRef = useRef<number | null>(null);
  const rowTransitionTimerRefs = useRef<Array<number | null>>(
    Array.from({ length: CATALOG_VISIBLE_ROWS }, () => null),
  );
  const rowTransitionLocksRef = useRef<boolean[]>(
    Array.from({ length: CATALOG_VISIBLE_ROWS }, () => false),
  );
  const wide = useSyncExternalStore(
    subscribeToWidePopup,
    getWidePopupSnapshot,
    getWidePopupServerSnapshot,
  );

  const openProduct =
    catalogProducts.find((product) => product.slug === openSlug) ?? null;
  const visibleRows = productCatalog.rows.map(
    (row, rowIndex) => row[rowPages[rowIndex] ?? 0] ?? row[0] ?? [],
  );
  const visibleCount = visibleRows.reduce(
    (total, products) => total + products.length,
    0,
  );
  const maxStage = Math.max(0, productCatalog.pageCount - 1);
  const globalStage = Math.max(0, ...rowPages);
  const uniformStage = rowPages.every((page) => page === rowPages[0])
    ? rowPages[0]
    : null;
  const pageTransitioning = transitioningRows.some(Boolean);

  useEffect(() => {
    const resetRestoredPage = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setRowPages(Array.from({ length: CATALOG_VISIBLE_ROWS }, () => 0));
      }
    };
    window.addEventListener("pageshow", resetRestoredPage);
    return () => window.removeEventListener("pageshow", resetRestoredPage);
  }, []);

  useEffect(
    () => () => {
      rowTransitionTimerRefs.current.forEach((timer) => {
        if (timer !== null) window.clearTimeout(timer);
      });
      rowTransitionLocksRef.current.fill(false);
    },
    [],
  );

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
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
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
          ).filter(
            (element) =>
              element.getClientRects().length > 0 &&
              !element.closest("[inert]"),
          )
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
        if (modalRoot?.querySelector("[data-pix-checkout-root]")) return;
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

  const beginTransitions = (rowIndexes: number[]) => {
    if (!rowIndexes.length) return;
    setTransitioningRows((current) =>
      current.map((value, index) =>
        rowIndexes.includes(index) ? true : value,
      ),
    );

    rowIndexes.forEach((rowIndex) => {
      rowTransitionLocksRef.current[rowIndex] = true;
      const previousTimer = rowTransitionTimerRefs.current[rowIndex];
      if (previousTimer !== null) window.clearTimeout(previousTimer);
      rowTransitionTimerRefs.current[rowIndex] = window.setTimeout(() => {
        rowTransitionTimerRefs.current[rowIndex] = null;
        rowTransitionLocksRef.current[rowIndex] = false;
        setTransitioningRows((current) =>
          current.map((value, index) => (index === rowIndex ? false : value)),
        );
      }, 420);
    });
  };

  const closeBeforeNavigation = () => {
    if (!openSlug) return;
    originScrollRef.current = null;
    close();
  };

  const changeRowPage = (rowIndex: number, nextPage: number) => {
    const row = productCatalog.rows[rowIndex] ?? [];
    const boundedPage = clamp(nextPage, 0, Math.max(0, row.length - 1));
    if (
      !row.length ||
      rowTransitionLocksRef.current[rowIndex] ||
      boundedPage === rowPages[rowIndex]
    ) {
      return;
    }

    closeBeforeNavigation();
    setRowPages((current) =>
      current.map((page, index) => (index === rowIndex ? boundedPage : page)),
    );
    beginTransitions([rowIndex]);
  };

  const changeAllRows = (nextStage: number) => {
    if (rowTransitionLocksRef.current.some(Boolean)) return;
    const boundedStage = clamp(nextStage, 0, maxStage);
    const nextPages = productCatalog.rows.map((row) =>
      clamp(boundedStage, 0, Math.max(0, row.length - 1)),
    );
    const changedRows = nextPages.flatMap((nextPage, rowIndex) =>
      nextPage === rowPages[rowIndex] ? [] : [rowIndex],
    );
    if (!changedRows.length) return;

    closeBeforeNavigation();
    setRowPages(nextPages);
    beginTransitions(changedRows);
  };

  const renderRows = (rowIndexes: number[]) =>
    rowIndexes.map((rowIndex) => {
      const row = productCatalog.rows[rowIndex] ?? [];
      const pageIndex = clamp(
        rowPages[rowIndex] ?? 0,
        0,
        Math.max(0, row.length - 1),
      );
      return (
        <CatalogShelfRow
          key={`catalog-row-${rowIndex}`}
          rowIndex={rowIndex}
          pageIndex={pageIndex}
          products={row[pageIndex] ?? []}
          previousProducts={row[pageIndex - 1] ?? []}
          nextProducts={row[pageIndex + 1] ?? []}
          openSlug={openSlug}
          wide={wide}
          transitioning={transitioningRows[rowIndex] ?? false}
          onNavigate={(nextPage) => changeRowPage(rowIndex, nextPage)}
          onOpen={(product, element, trigger) =>
            openCard(product.slug, element, trigger)
          }
        />
      );
    });

  return (
    <div
      ref={sectionRef}
      data-catalog-row-pages={rowPages.join(",")}
      data-catalog-pages={productCatalog.pageCount}
      data-catalog-transitioning={pageTransitioning ? "true" : "false"}
      aria-busy={pageTransitioning}
      className="product-showcase-experience relative"
    >
      <section
        id="produtos"
        className="product-showcase-section site-flow-section relative bg-transparent px-2 py-20 sm:px-4 md:px-8 md:py-28"
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
            Doze soluções ficam à vista. Cada fileira possui navegação própria
            para explorar o restante do catálogo sem perder a posição.
          </p>
        </div>

        <div className="product-catalog-rows">{renderRows([0, 1])}</div>
      </section>

      <section
        id="produtos-continuacao"
        className="product-showcase-section product-showcase-section--continuation site-flow-section relative bg-transparent px-2 pb-20 pt-16 sm:px-4 md:px-8 md:pb-28 md:pt-24"
        aria-labelledby="produtos-continuacao-heading"
      >
        <div className="reveal-up relative z-[var(--z-content)] mx-auto mb-12 max-w-6xl text-center">
          <span className="text-[0.6rem] font-black uppercase tracking-[0.24em] text-primary">
            Catálogo em profundidade
          </span>
          <h2
            id="produtos-continuacao-heading"
            className="mt-3 text-[clamp(1.8rem,4vw,2.8rem)] tracking-tight text-ink"
          >
            Continue explorando
          </h2>
        </div>

        <div className="product-catalog-rows">{renderRows([2, 3])}</div>

        <nav
          ref={pagerRef}
          className="product-pager relative z-[var(--z-content)] mx-auto mt-16 flex max-w-5xl flex-col items-center gap-4"
          aria-label="Navegar por todas as fileiras de produtos"
        >
          <div className="flex items-center justify-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => changeAllRows(globalStage - 1)}
              disabled={
                globalStage === 0 || Boolean(openSlug) || pageTransitioning
              }
              aria-label="Voltar todas as fileiras"
              className="product-pager__arrow inline-flex size-11 items-center justify-center text-3xl leading-none text-primary/70 transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-20"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() => changeAllRows(globalStage - 1)}
              disabled={
                globalStage === 0 || Boolean(openSlug) || pageTransitioning
              }
              aria-label="Conjunto anterior de produtos"
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
              onClick={() => changeAllRows(0)}
              disabled={Boolean(openSlug) || pageTransitioning}
              aria-label="Voltar aos doze cards iniciais"
              aria-current={uniformStage === 0 ? "page" : undefined}
              className={`relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none transition-colors ${
                uniformStage === 0
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
              onClick={() => changeAllRows(1)}
              disabled={maxStage < 1 || Boolean(openSlug) || pageTransitioning}
              aria-label="Abrir o segundo conjunto em todas as fileiras"
              aria-current={uniformStage === 1 ? "page" : undefined}
              className={`relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none transition-colors ${
                uniformStage === 1
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
              onClick={() => changeAllRows(globalStage + 1)}
              disabled={
                globalStage >= maxStage ||
                Boolean(openSlug) ||
                pageTransitioning
              }
              aria-label="Próximo conjunto em todas as fileiras"
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
              onClick={() => changeAllRows(globalStage + 1)}
              disabled={
                globalStage >= maxStage ||
                Boolean(openSlug) ||
                pageTransitioning
              }
              aria-label="Avançar todas as fileiras"
              className="product-pager__arrow inline-flex size-11 items-center justify-center text-3xl leading-none text-primary/70 transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-20"
            >
              ›
            </button>
          </div>

          <div
            aria-hidden
            className="flex max-w-full items-center justify-center gap-1"
          >
            {Array.from({ length: productCatalog.pageCount }, (_, index) => (
              <span
                key={index}
                className={`h-px transition-[width,background-color,box-shadow] ${
                  uniformStage === index
                    ? "w-5 bg-primary shadow-[0_0_10px_var(--primary-glow)]"
                    : "w-2 bg-white/15"
                }`}
              />
            ))}
          </div>

          <p className="sr-only" aria-live="polite">
            Exibindo {visibleCount} produtos em quatro fileiras. Cada fileira
            pode estar em uma posição diferente.
          </p>
        </nav>

        <footer
          id="creditos"
          className="site-developer-credit relative z-[var(--z-content)]"
        >
          <span>© 6DNX</span>
          <span aria-hidden>·</span>
          <a
            id="developer-bicho"
            href={developerCreditUrl ?? "#creditos"}
            target={developerCreditUrl ? "_blank" : undefined}
            rel={developerCreditUrl ? "noreferrer" : undefined}
            aria-disabled={developerCreditUrl ? undefined : true}
            title={
              developerCreditUrl
                ? "Abrir contato público do Developer Bicho"
                : "O contato público será adicionado quando estiver disponível"
            }
          >
            Desenvolvido por Developer Bicho
          </a>
          {!developerCreditUrl ? <small>Contato em breve</small> : null}
        </footer>
      </section>

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
                      checkoutAvailable={checkoutAvailable}
                      paymentTestAvailable={paymentTestAvailable}
                      onClose={close}
                    />
                  </>
                ) : null
              ) : (
                <MobileSheet
                  product={openProduct}
                  checkoutAvailable={checkoutAvailable}
                  paymentTestAvailable={paymentTestAvailable}
                  onClose={close}
                />
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** Narrow screens: one centered sheet instead of side popups — the no-overflow
    rule matters more than the layout choreography here. */
function MobileSheet({
  product,
  checkoutAvailable,
  paymentTestAvailable,
  onClose,
}: {
  product: Product;
  checkoutAvailable: boolean;
  paymentTestAvailable: boolean;
  onClose: () => void;
}) {
  const selection = useProductSelection(product);
  const supportUrl = `/api/redirect?slug=${encodeURIComponent(product.slug)}`;
  const [checkoutVariantName, setCheckoutVariantName] = useState<string | null>(
    null,
  );
  const checkoutTriggerRef = useRef<HTMLButtonElement>(null);
  const checkoutVariant =
    product.variants.find((variant) => variant.name === checkoutVariantName) ??
    null;

  const closeCheckout = () => {
    setCheckoutVariantName(null);
    window.requestAnimationFrame(() =>
      checkoutTriggerRef.current?.focus({ preventScroll: true }),
    );
  };

  return (
    <>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${product.title}`}
        inert={checkoutVariant ? true : undefined}
        aria-hidden={checkoutVariant ? true : undefined}
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

        <ProductPurchasePanel
          product={product}
          selectedVariant={selection.selectedVariant}
          onPick={selection.selectVariant}
          checkoutAvailable={checkoutAvailable}
          checkoutTriggerRef={checkoutTriggerRef}
          onCheckout={setCheckoutVariantName}
          supportUrl={supportUrl}
        />

        <div className="product-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="aspect-video w-full bg-black">
            <ProductMediaPreview product={product} />
          </div>

          <div className="px-4 py-3">
            <p className="mb-4 text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          </div>
        </div>
      </section>

      {checkoutVariant ? (
        <PixCheckoutModal
          product={product}
          variant={checkoutVariant}
          checkoutAvailable={checkoutAvailable}
          paymentTestAvailable={paymentTestAvailable}
          onClose={closeCheckout}
        />
      ) : null}
    </>
  );
}
