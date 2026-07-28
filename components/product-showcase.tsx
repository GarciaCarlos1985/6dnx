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
  products,
  type Product,
  type Variant,
} from "@/lib/products";
import { burstConfetti } from "@/lib/confetti";

gsap.registerPlugin(ScrollTrigger);

const PER_PAGE = 3;
const DEFAULT_PRODUCT_PAGE = 0;
const MARGIN = 12;
const GAP = 20;
const INFO_W = 360;
const INFO_MIN_W = 280;
const INFO_MIN_H = 148;
const INFO_MAX_H = 640;
const VIDEO_W = 420;
const VIDEO_MIN_W = 300;
const VIDEO_H = 280;
const PORTRAIT_VIDEO_RATIO = 478 / 849;
const WIDE_POPUP_QUERY = "(min-width: 1024px) and (min-height: 620px)";

type Box = { top: number; left: number; width: number; height: number };
type Placement = {
  info: Box;
  video: Box;
  card: DOMRect;
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
 * the left, selected card in the center, video on the right. The selected card
 * is moved to the middle column before this calculation runs.
 */
function place(card: DOMRect, portraitVideo = false): Placement {
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
  const videoW = portraitVideo
    ? Math.min(VIDEO_W, roomRight, maxVideoH * PORTRAIT_VIDEO_RATIO)
    : Math.min(VIDEO_W, roomRight);
  const videoH = portraitVideo
    ? videoW / PORTRAIT_VIDEO_RATIO
    : Math.min(VIDEO_H, maxVideoH);
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

  return { info, video, card };
}

function useProductCheckout(product: Product) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const selectVariant = (name: string) => {
    setSelectedVariant(name);
    setCheckoutError("");
  };

  const openCheckout = async () => {
    if (!selectedVariant || checkoutLoading) return;
    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/checkout/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          variantName: selectedVariant,
        }),
      });
      const payload = (await response.json()) as {
        checkoutUrl?: unknown;
        error?: unknown;
      };
      if (!response.ok || typeof payload.checkoutUrl !== "string") {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Não foi possível abrir o checkout de teste.",
        );
      }

      burstConfetti(window.innerWidth / 2, window.innerHeight / 2);
      window.setTimeout(() => window.location.assign(payload.checkoutUrl as string), 420);
    } catch (reason) {
      setCheckoutError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível abrir o checkout de teste.",
      );
      setCheckoutLoading(false);
    }
  };

  return {
    selectedVariant,
    selectVariant,
    checkoutLoading,
    checkoutError,
    openCheckout,
  };
}

/** Cords: a dim base path plus a bright dash that loops, card → popup → around it. */
function Cords({ p }: { p: Placement }) {
  const cy = p.card.top + p.card.height / 2;

  const infoStartX = p.card.left;
  const infoAnchorX = p.info.left + p.info.width;
  const infoAnchorY = clamp(cy, p.info.top, p.info.top + p.info.height);
  const infoPath = `M ${infoStartX} ${cy} C ${(infoStartX + infoAnchorX) / 2} ${cy}, ${(infoStartX + infoAnchorX) / 2} ${infoAnchorY}, ${infoAnchorX} ${infoAnchorY}`;

  const vidStartX = p.card.right;
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
        <span className="shrink-0 text-sm font-bold text-primary">
          {typeof variant.priceBRL === "number"
            ? formatBRL(variant.priceBRL)
            : "sob consulta"}
        </span>
      </button>
    </li>
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
  const checkout = useProductCheckout(product);
  const supportUrl = `/api/redirect?slug=${encodeURIComponent(product.slug)}`;

  return (
    <>
      <Cords p={placement} />

      <section
        role="dialog"
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
            className="shrink-0 border border-white/15 px-2 py-0.5 text-sm text-muted transition-colors hover:border-primary hover:text-primary"
          >
            ✕
          </button>
        </header>

        <div className="product-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className="mb-4 text-sm leading-relaxed text-muted">
            {product.description}
          </p>
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
            Variações · escolha uma opção
          </p>
          <ul className="space-y-1.5">
            {product.variants.map((v) => (
              <VariantRow
                key={v.name}
                variant={v}
                selected={checkout.selectedVariant === v.name}
                onPick={checkout.selectVariant}
              />
            ))}
          </ul>
          {checkout.checkoutError ? (
            <p role="alert" className="mt-3 text-xs leading-relaxed text-red-300">
              {checkout.checkoutError}
            </p>
          ) : null}
        </div>

        <footer className="grid border-t border-primary sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={checkout.openCheckout}
            disabled={!checkout.selectedVariant || checkout.checkoutLoading}
            className="min-h-12 bg-primary px-4 text-sm font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-transparent hover:text-primary disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          >
            {checkout.checkoutLoading
              ? "Abrindo laboratório…"
              : checkout.selectedVariant
                ? "Comprar agora · teste R$ 1"
                : "Selecione uma variação"}
          </button>
          <a
            href={supportUrl}
            className="inline-flex min-h-12 items-center justify-center border-t border-primary/50 px-4 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-muted transition-colors hover:text-ink sm:border-l sm:border-t-0"
          >
            Suporte Discord
          </a>
        </footer>
      </section>

      <section
        aria-label={`Vídeo de ${product.title}`}
        data-popup-side="right"
        className="product-popup product-popup--video-right fixed z-[80] overflow-hidden border border-primary/40 bg-black shadow-[0_0_50px_oklch(0.55_0.22_25_/_0.3)]"
        style={placement.video}
      >
        {product.youtubeId ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${product.youtubeId}`}
            title={`Vídeo de ${product.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-3xl" aria-hidden>
              ▶
            </span>
            <p className="text-sm font-bold text-ink">Vídeo não configurado</p>
            <p className="text-[0.7rem] leading-relaxed text-muted">
              Defina <code className="text-primary">youtubeId</code> deste produto
              em <code className="text-primary">lib/products.ts</code>.
            </p>
          </div>
        )}
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
}: {
  product: Product;
  open: boolean;
  obscured: boolean;
  centered: boolean;
  onOpen: (el: HTMLElement) => void;
}) {
  const from = priceFrom(product);

  return (
    <article
      data-product-card={product.slug}
      className={`product-card group relative flex min-h-[31rem] flex-col overflow-hidden rounded-[1.35rem] border bg-surface text-left transition-[border-color,box-shadow,transform,opacity] duration-500 ${
        centered ? "lg:col-start-2" : ""
      } ${
        open
          ? "z-[70] scale-[1.025] border-primary shadow-[0_0_54px_var(--primary-glow)] lg:col-start-2"
          : obscured
            ? "pointer-events-none opacity-0"
          : "reveal-up border-white/10 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_0_38px_var(--primary-glow)]"
      }`}
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

        <div className="absolute inset-x-4 top-4 z-[4] flex flex-wrap items-center justify-between gap-2">
          <span className="border border-accent/40 bg-black/70 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-accent backdrop-blur-sm">
            {product.status === "undetected" ? "Undetected" : "Updating"}
          </span>
          <span className="border border-white/15 bg-black/70 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted backdrop-blur-sm">
            {product.variants.length}{" "}
            {product.variants.length === 1 ? "variação" : "variações"}
          </span>
        </div>

        <p className="absolute bottom-4 left-4 z-[4] max-w-[62%] border-l-2 border-primary bg-black/55 px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.2em] text-ink backdrop-blur-sm">
          {product.category}
        </p>
      </div>

      <div className="product-card__body flex flex-1 flex-col p-6">
        <p className="mb-2 flex items-center gap-2 text-[0.58rem] font-bold uppercase tracking-[0.28em] text-primary/80">
          <span className="inline-block h-px w-7 bg-primary/70" aria-hidden />
          6DNX // catálogo verificado
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
            <li className="px-2 py-0.5 text-[0.7rem] text-primary">
              +{product.variants.length - 5}
            </li>
          ) : null}
        </ul>

        <p className="mb-4 text-sm text-muted">
          {from ? (
            <>
              A partir de{" "}
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
          className="inline-flex min-h-11 items-center justify-center border border-primary bg-primary px-4 text-sm font-bold uppercase tracking-[0.14em] text-ink transition-colors group-hover:bg-transparent group-hover:text-primary"
        >
          Ver detalhes
        </span>
      </div>

      <button
        type="button"
        onClick={(event) =>
          onOpen(event.currentTarget.parentElement as HTMLElement)
        }
        aria-label={`Centralizar e abrir detalhes de ${product.title}`}
        aria-expanded={open}
        className="absolute inset-0 z-[5] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
      />
    </article>
  );
}

export function ProductShowcase() {
  const [page, setPage] = useState(DEFAULT_PRODUCT_PAGE);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const pagerRef = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const originScrollRef = useRef<number | null>(null);
  const wide = useSyncExternalStore(
    subscribeToWidePopup,
    getWidePopupSnapshot,
    getWidePopupServerSnapshot,
  );

  const pages = Math.ceil(products.length / PER_PAGE);
  const overflowPageIndexes = Array.from(
    { length: Math.max(0, pages - 2) },
    (_, index) => index + 2,
  );
  const visible = useMemo(
    () => products.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [page],
  );
  const openProduct = products.find((p) => p.slug === openSlug) ?? null;
  const portraitVideo = openProduct?.videoOrientation === "portrait";
  const orderedVisible = useMemo(() => {
    if (!wide || !openSlug) return visible;
    const selectedIndex = visible.findIndex((product) => product.slug === openSlug);
    if (selectedIndex < 0 || selectedIndex === 1) return visible;

    const ordered = [...visible];
    const [selected] = ordered.splice(selectedIndex, 1);
    ordered.splice(Math.min(1, ordered.length), 0, selected);
    return ordered;
  }, [openSlug, visible, wide]);

  useEffect(() => {
    const resetRestoredPage = (event: PageTransitionEvent) => {
      if (event.persisted) setPage(DEFAULT_PRODUCT_PAGE);
    };
    window.addEventListener("pageshow", resetRestoredPage);
    return () => window.removeEventListener("pageshow", resetRestoredPage);
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pager = pagerRef.current;
    if (!section || !pager) return;

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
    setOpenSlug(null);
    setPlacement(null);
    anchorRef.current = null;
    originScrollRef.current = null;

    if (originScroll !== null) {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: originScroll,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      });
    }
  }, []);

  // Popups are viewport-anchored, so freeze the page while one is open instead
  // of recomputing on every scroll tick.
  useEffect(() => {
    if (!openSlug || (wide && !placement)) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
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
        () => setPlacement(place(card.getBoundingClientRect(), portraitVideo)),
        reducedMotion ? 0 : 460,
      );
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
    };
  }, [openSlug, portraitVideo, wide]);

  useEffect(() => {
    if (!openSlug || !wide) return;

    const syncPlacement = () => {
      if (anchorRef.current) {
        setPlacement(
          place(anchorRef.current.getBoundingClientRect(), portraitVideo),
        );
      }
    };

    window.addEventListener("resize", syncPlacement);
    window.visualViewport?.addEventListener("resize", syncPlacement);
    return () => {
      window.removeEventListener("resize", syncPlacement);
      window.visualViewport?.removeEventListener("resize", syncPlacement);
    };
  }, [openSlug, portraitVideo, wide]);

  const openCard = (slug: string, el: HTMLElement) => {
    anchorRef.current = el;
    originScrollRef.current = wide ? window.scrollY : null;
    setPlacement(null);
    setOpenSlug(slug);
  };

  const changePage = (next: number) => {
    originScrollRef.current = null;
    close();
    setPage(((next % pages) + pages) % pages);
  };

  return (
    <section
      ref={sectionRef}
      id="produtos"
      className="site-flow-section relative bg-transparent px-4 py-20 md:px-8 md:py-28"
      aria-labelledby="produtos-heading"
    >
      <div className="reveal-up relative z-[var(--z-content)] mx-auto mb-12 max-w-6xl text-center">
        <h2
          id="produtos-heading"
          className="mb-3 text-[clamp(2rem,5vw,3.25rem)] tracking-tight text-ink"
        >
          Nossos Softwares
        </h2>
        <p className="mx-auto max-w-2xl text-muted">
          Explore cada variação e teste o fluxo de compra antes da integração
          bancária real.
        </p>
      </div>

      <div
        className={`relative mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
          wide && openSlug ? "z-[80]" : "z-[var(--z-content)]"
        }`}
      >
        {orderedVisible.map((product) => (
          <Card
            key={product.slug}
            product={product}
            open={openSlug === product.slug}
            obscured={wide && openSlug !== null && openSlug !== product.slug}
            centered={orderedVisible.length === 1}
            onOpen={(el) => openCard(product.slug, el)}
          />
        ))}
      </div>

      {/* Pager: the brand mark itself is the control — 6 back, D/N the pages, X forward. */}
      <nav
        ref={pagerRef}
        className="relative z-[var(--z-content)] mx-auto mt-14 flex max-w-5xl items-center justify-center gap-3"
        aria-label="Navegar produtos"
      >
        {[...overflowPageIndexes].reverse().map((pageIndex) => (
          <button
            key={`left-${pageIndex}`}
            type="button"
            onClick={() => changePage(pageIndex)}
            aria-label={`Abrir página ${pageIndex + 1} pela esquerda`}
            className={`inline-flex size-11 items-center justify-center text-3xl leading-none transition-colors ${
              page === pageIndex
                ? "text-primary drop-shadow-[0_0_18px_var(--primary-glow)]"
                : "text-muted/50 hover:text-muted"
            }`}
          >
            ‹
          </button>
        ))}

        <button
          type="button"
          onClick={() => changePage(page - 1)}
          aria-label="Produtos anteriores"
          className="relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none text-muted transition-colors hover:text-primary"
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

        {Array.from({ length: Math.min(pages, 2) }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => changePage(i)}
            aria-label={`Página ${i + 1}`}
            aria-current={page === i}
            className={`relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none transition-colors ${
              page === i
                ? "text-primary drop-shadow-[0_0_18px_var(--primary-glow)]"
                : "text-muted/50 hover:text-muted"
            }`}
          >
            <span className="relative z-[1]">{["D", "N"][i] ?? i + 1}</span>
            <span
              aria-hidden
              data-pager-shadow={["D", "N"][i]}
              className="product-pager__shadow"
            >
              {["D", "N"][i]}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => changePage(page + 1)}
          aria-label="Próximos produtos"
          className="relative isolate inline-flex size-11 items-center justify-center text-3xl leading-none text-muted transition-colors hover:text-primary"
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

        {overflowPageIndexes.map((pageIndex) => (
          <button
            key={`right-${pageIndex}`}
            type="button"
            onClick={() => changePage(pageIndex)}
            aria-label={`Abrir página ${pageIndex + 1} pela direita`}
            aria-current={page === pageIndex ? "page" : undefined}
            className={`inline-flex size-11 items-center justify-center text-3xl leading-none transition-colors ${
              page === pageIndex
                ? "text-primary drop-shadow-[0_0_18px_var(--primary-glow)]"
                : "text-muted/50 hover:text-muted"
            }`}
          >
            ›
          </button>
        ))}
      </nav>

      {typeof document !== "undefined" && openProduct
        ? createPortal(
            <>
              <div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
                onClick={close}
                aria-hidden
              />
              {wide ? (
                placement ? (
                  <Popups
                    product={openProduct}
                    placement={placement}
                    onClose={close}
                  />
                ) : null
              ) : (
                <MobileSheet product={openProduct} onClose={close} />
              )}
            </>,
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
  const checkout = useProductCheckout(product);
  const supportUrl = `/api/redirect?slug=${encodeURIComponent(product.slug)}`;

  return (
    <section
      role="dialog"
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
          className="shrink-0 border border-white/15 px-2 py-0.5 text-sm text-muted"
        >
          ✕
        </button>
      </header>

      <div className="product-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div
          className={`w-full bg-black ${
            product.videoOrientation === "portrait"
              ? "aspect-[478/849]"
              : "aspect-video"
          }`}
        >
          {product.youtubeId ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${product.youtubeId}`}
              title={`Vídeo de ${product.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[0.7rem] text-muted">
              Vídeo não configurado — defina{" "}
              <code className="mx-1 text-primary">youtubeId</code> em products.ts
            </div>
          )}
        </div>

        <div className="px-4 py-3">
          <p className="mb-4 text-sm leading-relaxed text-muted">
            {product.description}
          </p>
          <ul className="space-y-1.5">
            {product.variants.map((v) => (
              <VariantRow
                key={v.name}
                variant={v}
                selected={checkout.selectedVariant === v.name}
                onPick={checkout.selectVariant}
              />
            ))}
          </ul>
          {checkout.checkoutError ? (
            <p role="alert" className="mt-3 text-xs leading-relaxed text-red-300">
              {checkout.checkoutError}
            </p>
          ) : null}
        </div>
      </div>

      <footer className="grid border-t border-primary">
        <button
          type="button"
          onClick={checkout.openCheckout}
          disabled={!checkout.selectedVariant || checkout.checkoutLoading}
          className="min-h-12 bg-primary px-4 text-sm font-bold uppercase tracking-[0.12em] text-ink disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
        >
          {checkout.checkoutLoading
            ? "Abrindo laboratório…"
            : checkout.selectedVariant
              ? "Comprar agora · teste R$ 1"
              : "Selecione uma variação"}
        </button>
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
