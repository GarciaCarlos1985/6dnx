<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 6DNX — project memory

Read this file, `PROJECT_STATE.md`, `README.md`, `DESIGN.md`, and `PRODUCT.md`
before changing the product. Keep `PROJECT_STATE.md` current after meaningful
work so a new agent can resume without reconstructing the conversation.

## Product north star

- Premium conversion site for 6DNX with a dark, blood-crimson, cinematic visual
  language. The experience must remain legible, fast, and useful beneath the
  spectacle.
- One reversible page-wide scroll story owns the angel on the right and the
  tactical operator on the left. Five poses per character are distributed once
  from the top through the footer; never restart the sequence after the hero.
- Characters occupy a fixed atmospheric layer above section backgrounds but
  below every readable or interactive surface, including hero copy, product
  cards, news, controls, backdrops, and dialogs. Their wrapper remains
  `pointer-events: none` and `overflow: visible`; never solve asset clipping by
  promoting characters above content.
- Fine-pointer reactions belong to each actor's nested
  `.cinematic-actor__reactive` layer; the outer actor remains exclusively owned
  by the scroll timeline. Pointer work is passive and animation-frame bounded,
  beams originate at each actor's chest, render above the actor art but below
  page content, and all pointer effects honor `prefers-reduced-motion`. Both
  beam-end nodes share one small `--beam-node-size`; never style them at
  different sizes.
- The hero is one natural viewport and must not be extended with a long pinned
  runway merely to consume character frames.
- The hero's primary brand is the transparent
  `/brand/6dorme-nois-xita-hero.png` artwork. Do not replace it with a text-only
  `6DNX` heading; preserve its exact wording, brush silhouette, and aspect ratio.
  Its dedicated scroll tween must expand only the logo and reverse cleanly;
  never scale the supporting hero copy as part of that effect. Keep transform
  ownership nested: the outer logo shell belongs to scroll and the inner image
  belongs to the fine-pointer tilt/parallax reaction. Do not animate both
  interactions on the same DOM node, and always honor reduced motion.
- The homepage background is one continuous `.site-flow`; sections must not
  reintroduce top borders or one-pixel divider rules. Use broad, transparent
  overlap gradients whenever a local transition needs more separation.
- The crimson eye is code-native SVG/CSS and remains beneath the hero overlays.
  It fades in from page scroll and from fine-pointer logo hover. Scroll owns the
  outer rotor and pointer movement owns a nested rotor so their transforms
  compose. Its approved visual is the broad circular Sharingan with two subtle
  crimson rings, widely spaced tomoe, and the faint conic-line halo restored on
  2026-07-28; do not compress it back into an almond-shaped eye.
- Product truth comes from `lib/products.ts` and source captures in
  `discord-imagens/`. Never invent a price, status, video, or availability.
- Payment development starts in the isolated checkout laboratory: fixed
  simulated R$ 1,00, no card/CPF/address fields, no real gateway, ephemeral
  sessions, and Discord messages visibly marked TESTE. It is local-only by
  default and may run on Vercel Preview only with an explicit
  `PAYMENT_TEST_MODE=true`; never silently enable it in Production.
- Radar 6DNX uses only the official Steam News API, Google AI Blog RSS, and
  OpenAI News RSS. Never scrape Google Search results. Reads stay bounded and
  streamed; the daily schedule is Vercel Cron at 12:00 UTC.

## Non-negotiable interactions

- On desktop, clicking any product moves that card into the middle column,
  centers it vertically, then opens information on the left and video on the
  right. The selected card stays above the modal backdrop at the same visual
  level as the popups; sibling cards stay obscured. Closing restores the
  original product order and card position.
- On narrow screens, use one accessible centered sheet; never force the desktop
  three-column popup composition into a viewport that cannot contain it.
- Product dialogs close by button, backdrop, or Escape. While open, background
  scroll stays locked.
- The product pager keeps `6 D N X` as its visual core. Pages beyond `D` and
  `N` use equal-size, symmetric, clickable arrow pairs on the left and right;
  never render raw numeric page labels as a fallback.
- A fresh or browser-cache-restored catalog always starts on `D` (product page
  zero). User-selected pages persist only during the current mounted visit.
- The scroll exit effect animates only `aria-hidden` luminous clones of
  `6 D N X`; the original pager glyphs and controls never transform. The
  clones expand after the product section ends, disappear before the footer
  journey completes, reverse into their exact origins on upward scroll, and
  remain disabled for reduced motion.
- Keep all secrets server-only. Never expose `.env.local`, Supabase secret keys,
  Discord webhooks, or Vercel tokens in client bundles, logs, screenshots, or
  commits.
- Keep `.env.local` grouped as documented by `scripts/organize-env.mjs`: Vercel
  runtime values first and local tooling last. `VERCEL_TOKEN`,
  `SUPABASE_DB_URL`, and the legacy service-role key are local tooling/fallback
  values, not frontend variables. Never reuse a GitHub PAT as `CRON_SECRET`;
  cron authentication uses an independent random secret with no external
  privileges.

## Performance and quality gates

- Prefer bounded CSS/SVG particles and transform/opacity animation over video or
  unbounded particle runtimes.
- Character transition pulses remain inside each isolated actor stack, behind
  the artwork (`aura -> transition -> frames`), and peak at half-strength so
  they never cover a face, wing, or weapon.
- Keep strict TypeScript and the established domain structure. Do not add a new
  runtime dependency when existing React, Next.js, CSS, or GSAP solves the task.
- Respect `prefers-reduced-motion`.
- Before handoff run `npm run lint`, `npx tsc --noEmit`, `npm run build`, and
  browser verification at desktop and mobile widths.
- Do not commit, push, apply database migrations, or deploy without explicit
  human validation.
