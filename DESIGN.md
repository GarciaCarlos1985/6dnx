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

- Hero pose sequence: the premium 2:3 cutouts enter first, overlap through a long crimson dissolve, hold the second pose, and only then leave the viewport. All four characters share transparent edges, restrained red rim light and compatible framing.
- Atmosphere is code-native: three composited smoke gradients and 18 deterministic ash particles, with no canvas engine or video payload.
- Signature: hero scrollytelling — pin + scrub; operator ← left, angel → right, center copy scales out
- Reduced motion: no pin; characters stay framed; soft opacity only
- Product hover: border + crimson glow, 200ms ease-out

## Layout

- Hero: full-bleed h-screen, characters bottom-anchored L/R, brand center
- Products: auto-fit grid minmax(280px, 1fr), dark borders, no nested cards
- Product popups: the middle desktop card forms a three-column composition (information left, selected card center, video right); edge cards remain collision-aware and mobile uses one centered sheet.
- Radar: composição editorial assimétrica depois dos produtos; um destaque visual + linha cronológica, sem repetir o grid comercial
- Reference composition: kernaim.to product density, 6DNX brand voice

## Editorial layer

- Notícias usam índices grandes, filetes, datas e hierarquia tipográfica — não os cards de produto.
- Imagens oficiais entram dessaturadas e recuperam cor no hover para preservar o blackout da marca.
- Links externos são explícitos (`↗`) e a fonte original permanece soberana.
- No mobile, destaque e linha cronológica empilham sem overflow horizontal.
