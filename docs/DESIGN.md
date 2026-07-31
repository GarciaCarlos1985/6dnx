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

- Active storefront scene: the hero video remains visually independent; when
  `#produtos` enters, the Killa couple appears on the left and the pale-wing
  shushing angel appears on the right. Their fixed atmospheric layer stays
  below cards and dialogs while scroll owns scale/translation and fine-pointer
  movement owns only the nested reactive layer.
- Hero pose sequence: the premium 2:3 cutouts enter first, overlap through a long crimson dissolve, hold the second pose, and only then leave the viewport. All four characters share transparent edges, restrained red rim light and compatible framing.
- Atmosphere is code-native: three composited smoke gradients and 18 deterministic ash particles, with no canvas engine or video payload.
- Signature: hero scrollytelling — pin + scrub; operator ← left, angel → right, center copy scales out
- Reduced motion: no pin; characters stay framed; soft opacity only
- Product hover: border + crimson glow, 200ms ease-out

## Layout

- Admin: the catalog CMS mirrors the storefront palette but reduces spectacle
  in favor of operational clarity. Desktop uses a product rail, five-step
  editor and live preview; tablet/mobile linearize those regions without
  hiding any field. Publication state, unsaved state and errors never depend on
  color alone. Destructive deletion is absent; archive and history restoration
  are explicit.
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
  (information left, selected card center, video right); edge cards remain
  collision-aware and mobile uses one centered sheet. The sharp center card is
  a non-interactive visual twin in the same body-level modal layer as the
  popups, above the blur. The original card stays in the grid beneath the
  backdrop; never move the portal into the inert page merely to fix stacking.
- Radar: composição editorial assimétrica depois dos produtos; um destaque visual + linha cronológica, sem repetir o grid comercial
- Reference composition: kernaim.to product density, 6DNX brand voice

## Editorial layer

- Notícias usam índices grandes, filetes, datas e hierarquia tipográfica — não os cards de produto.
- Imagens oficiais entram dessaturadas e recuperam cor no hover para preservar o blackout da marca.
- Links externos são explícitos (`↗`) e a fonte original permanece soberana.
- No mobile, destaque e linha cronológica empilham sem overflow horizontal.
