# Design System — 6DNX

> **Contexto de publicação — 2026-08-03:** Production já serve a vitrine de
> doze cards, o rodapé e o checkout desligado com atendimento pelo Discord. A
> nova imagem social Open Graph foi validada e aprovada visualmente pelo
> proprietário para publicação.

## Mood

Midnight tactical club — blackout stage, crimson smoke, operators and stone angels framing a single brand mark.

## Color strategy

Committed: crimson carries identity (~30–40% of accent moments). Surface is pure black.

## Palette (OKLCH)

```css
:root {
  --bg: oklch(0.08 0 0);
  --surface: oklch(0.14 0 0);
  --ink: oklch(0.98 0 0);
  --muted: oklch(0.62 0 0);
  --primary: oklch(0.55 0.22 25);
  --primary-glow: oklch(0.55 0.22 25 / 0.45);
  --accent: oklch(0.72 0.17 145); /* undetected */
  --warn: oklch(0.82 0.14 95); /* updating */
}
```

## Typography

- Display: **Archivo Black** (imposing, condensed, not Inter/Space Grotesk)
- Body / UI: **Manrope** (geometric humanist, readable on dark)
- Headings: uppercase tracking tight; body: sentence case, measure ≤ 65ch

## Social sharing

- A prévia principal de WhatsApp, Discord e redes sociais usa arte estática em
  1200×630 e JPEG otimizado para não depender de uma função em tempo de
  execução nem exceder o orçamento dos geradores de miniatura.
- A composição preserva os arquivos oficiais: casal tático à esquerda, logo
  alado no centro e anjo à direita, sobre cenário pós-apocalíptico em preto,
  bordô e carmesim.
- O logo nunca deve ser reescrito por texto gerado. Open Graph e Twitter usam a
  mesma imagem e descrições curtas, com URL canônica derivada de
  `NEXT_PUBLIC_SITE_URL`.

## Motion

- Active hero scene: `hero-apocalypse.jpg` is the fixed cinematic backdrop.
  `killa-casal-hero.png` frames the left edge and
  `anjo-frame-03-ivory-v2.webp` frames the right edge. These hero-only actors
  approach the top of the viewport, remain bottom-anchored behind the copy, and
  dissolve before the independent product-scene companions become visible.
- Each hero actor owns a nested fine-pointer reaction layer with bounded 3D
  parallax, a local highlight and a chest-origin beam. The beam stays above the
  hero artwork but below the smoke seam, copy and CTA; it fades with its actor
  and is disabled for reduced motion or non-fine pointers.
- The product-section Killa couple and pale-wing shushing angel keep their
  existing scroll choreography unchanged. They remain below cards and dialogs;
  the hero actors never replace or restart that separate scene.
- The `logo-asas` artwork keeps nested transform ownership: scroll scales the
  outer shell while fine-pointer movement tilts the inner image. The broad
  circular Sharingan stays below it and composes scroll and pointer rotation.
- Atmosphere is code-native: bounded smoke, aura, ash and ember layers animate
  only transform and opacity; the hero no longer depends on a video payload.
- Signature: one-viewport hero push with reversible logo expansion, ocular
  rotation, outward character movement and a smoke dissolve into `#produtos`.
- Reduced motion: no pin; characters stay framed; soft opacity only
- Product hover: border + crimson glow, 200ms ease-out

## Layout

- Admin: the catalog CMS mirrors the storefront palette but reduces spectacle
  in favor of operational clarity. Desktop uses a product rail, five-step
  editor and live preview; tablet/mobile linearize those regions. The everyday
  owner mode deliberately omits dangerous structural controls: route, arbitrary
  palette, generic creation/duplication and content restoration are not
  clickable. Ordering is isolated in a dedicated full-catalog board with four
  named shelf groups, explicit confirmation and one atomic save. Publication
  state, unsaved state and errors never depend on color alone.
- Hero: one full-bleed safe viewport, characters bottom-anchored L/R and brand
  centered. Actor, logo, copy and CTA sizing must respond to both viewport width
  and height; fixed desktop pixel ceilings must not collapse the composition on
  QHD, 4K, ultrawide or low-height screens.
- Products: four shelves of three cards, split evenly between two continuous
  storefront sections. The first twelve canonical catalog positions fill those
  shelves in reading order. Dark borders and responsive grids preserve one card
  per column on narrow screens without horizontal document overflow.
- Product discovery: on wide fine-pointer viewports, each three-card shelf is
  flanked by restrained, clickable `Adjacent Page Peek` cascades. Each side
  fans out the adjacent page's cards in three progressively smaller, darker
  depth layers, creating an infinite-corridor illusion while navigation remains
  finite, manual, and one page per click. There is no autoplay or wraparound
  loop. The cascades stay below the active cards, hide while a product dialog
  is open, and disappear entirely on narrower screens.
- Product popups: the middle desktop card forms a three-column composition
  (information left, selected card center, branded media preview right); edge cards remain
  collision-aware and mobile uses one centered sheet. The sharp center card is
  a non-interactive visual twin in the same body-level modal layer as the
  popups, above the blur. The original card stays in the grid beneath the
  backdrop; never move the portal into the inert page merely to fix stacking.
- Product video embeds are temporarily disabled. Desktop and mobile always show
  `ProductMediaPreview` with the product artwork, 6DNX angel and the
  "Demonstração em preparação" copy. Stored YouTube IDs remain data-only so the
  change can be reversed after official approval.
- Radar: composição editorial assimétrica depois dos produtos; um destaque visual + linha cronológica, sem repetir o grid comercial
- Reference composition: kernaim.to product density, 6DNX brand voice

## Editorial layer

- Notícias usam índices grandes, filetes, datas e hierarquia tipográfica — não os cards de produto.
- Imagens oficiais entram dessaturadas e recuperam cor no hover para preservar o blackout da marca.
- Links externos são explícitos (`↗`) e a fonte original permanece soberana.
- No mobile, destaque e linha cronológica empilham sem overflow horizontal.
