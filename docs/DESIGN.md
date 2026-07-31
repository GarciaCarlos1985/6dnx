# Design System — 6DNX

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
  owner mode deliberately omits structural controls: route, order, publication,
  arbitrary palette, creation/duplication and restoration are not clickable.
  Publication state, unsaved state and errors never depend on color alone.
- Hero: full-bleed h-screen, characters bottom-anchored L/R, brand center
- Products: auto-fit grid minmax(280px, 1fr), dark borders, no nested cards
- Product discovery: on wide fine-pointer viewports, the three active cards are
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
