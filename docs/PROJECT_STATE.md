# 6DNX project state

Last updated: 2026-07-31

## Current objective

Build a cinematic but usable 6DNX storefront: scroll-driven hero, persistent
character atmosphere, complete product catalog, lateral product dialogs, an
isolated test checkout, and an automated games-and-AI news area.

## Confirmed decisions

- Visual language: near-black, blood crimson, stone/metal textures, restrained
  particles, strong red contour light.
- The active video hero stays free of separately mounted character cutouts.
  Starting at the product section, the Killa couple frames the left side and
  the pale-wing shushing angel frames the right side.
- The product character scene owns one reversible scroll journey from the
  section entrance to the document end; it never restarts inside the catalog.
- The character layer is fixed, pointer-transparent, and unclipped. It stays
  above section backgrounds and below all readable or interactive content.
- The hero receives the broad circular dark-crimson Sharingan beneath the
  existing scrim and scan overlay. It responds to page scroll and fine-pointer
  logo hover through independent nested rotors.
- Desktop product interaction is always information left / card center / video
  right. Mobile uses one centered sheet.
- Historical product claims remain traceable to `discord-imagens/` and
  `docs/Produtos_Organizados.md`. The 31-entry editorial map remains the
  historical source index; the executable catalog may split a confirmed source
  entry into distinct commercial families without merging their prices.
- Supabase API credentials are normalized; the `news_articles` migration is
  still pending human approval.
- The daily schedule is Vercel Cron (`0 12 * * *`), not GitHub Actions.
- Google content comes from the official Google AI Blog RSS. Never scrape
  Google Search result pages.

## Source assets

- Character masters and generated animation frames: `public/`
- Discord catalog captures: `discord-imagens/`
- Product model: `lib/products.ts`
- Hero choreography: `components/hero-section.tsx`
- Product interaction: `components/product-showcase.tsx`
- News pipeline: `lib/news/` and `supabase/migrations/`

## Completed in the current laboratory pass

- Implemented the `/admin` catalog CMS as a separate, data-driven control
  surface. It includes a branded Supabase email/password login, server-side
  `app_metadata.role=admin` authorization, guided five-step editing, live card
  preview, search/filters, duplication, draft/published/archived states,
  bounded thumbnail upload, per-card accent/text/surface colors, optimistic
  revision checks and one-click history restoration. `/admin/demo` provides a
  development-only visual walkthrough without weakening production auth.
- Added the unapplied
  `20260731090000_create_product_catalog_admin.sql` migration for catalog rows,
  immutable editorial keys, automatic revision snapshots, RLS and the 5 MB
  `product-assets` bucket. Product deletion is intentionally unavailable;
  archive and restore own the reversible workflow.
- Connected the public catalog, test checkout and safe Discord redirect to the
  published Supabase catalog. `lib/products.ts` remains the fail-safe source
  whenever configuration/schema/data is unavailable or the remote catalog
  cannot satisfy the required carousel composition.
- Hardened the initial import against silent data loss: all 40 current products
  now pass the same validator used by future panel saves before any batch is
  sent to Supabase. The six cards that anchor `D` and the first page to the
  right must remain published in the interface and in the database constraint.
- Added `scripts/create-admin.mjs` and `docs/ADMIN.md`. No account was created,
  no migration was applied and no secret was written to source; those remain
  explicit human-controlled activation steps.
- Revalidated the admin pass with ESLint, strict TypeScript and a production
  Next build. Desktop QA at 1440x900 and mobile QA at 390x844 passed without
  document-level horizontal overflow; the production build returns 404 for
  `/admin/demo`, 401 for an anonymous admin session, and the public catalog
  still opens on DayZ Private / Counter-Strike 2 / Arena Breakout. The runtime
  dependency audit is clean; nine high findings remain confined to the ESLint
  development toolchain and require incompatible dependency changes.
- Added `docs/CODEX.md` as the mandatory startup protocol for every new chat.
  It defines the canonical reading order, task-specific context routes,
  read-only Git inspection, impact reporting, secret boundaries, validation,
  and handoff requirements before an agent may modify the project.
- Added a reversible hero-video experiment using
  `public/novo-hero-final.mp4` (H.264, 1920x1080, 9.7 seconds, 3.37 MB). The footage is a
  decorative muted inline loop with reduced-motion playback protection and a
  restrained lower veil that dissolves into the same page-wide background used
  by the product section. Because the footage already carries the brand, the
  separate transparent logo overlay is currently disabled through
  `showBrandOverlay={false}`; its component, asset, accessible heading, scroll
  transform, and pointer implementation remain preserved for one-property
  reversal.
- Added an explicit video-first composition with
  `showCinematicEffects={false}` and `showVideoOverlay`. The active hero renders
  the MP4 without CSS grading, zoom, aura, smoke, ocular artwork, scanlines,
  transformation flashes, or GSAP copy fading. A separate low-opacity gradient
  veil now sits above the unmodified footage and below the copy/CTA, improving
  legibility without flattening the background. The supporting copy uses solid
  colors and glyph-local shadows and sits immediately above an accessible
  `#produtos` CTA styled as a mechanical spacebar.
- Replaced the hard hero/products boundary with a two-sided cinematic dissolve:
  the final video pixels fade into one shared near-black crimson tone while the
  product section projects a broad blurred smoke bank upward across the same
  boundary. The bridge is static, pointer-transparent, and remains below all
  copy, cards, controls, and dialogs.
- Added one page-wide, pointer-transparent atmosphere with 22 deterministic
  soot and ember particles distributed from the hero through the bottom of the
  storefront. They animate only transform and opacity, stay below the
  `z-content` layer used by headings/cards/controls/dialogs, and disappear
  entirely for `prefers-reduced-motion`.
- Preserved the explicit `beams-only` mode and mounted the full
  `CinematicCompanions` product scene after the video hero. It uses the
  optimized transparent `casal-killa.webp` on the left and
  `anjo-hero-shh-v4.webp` on the right. Both receive the established
  scroll-scrubbed scale/translation, behind-art transition pulses, aura, waist
  smoke, pointer parallax, chest-origin beams and side-specific embers or pale
  feathers. The scene stays hidden before `#produtos`, reverses on upward
  scroll, remains below cards/dialogs, and falls back to static,
  section-bounded framing on mobile or reduced motion.
- Added the crimson ocular payoff beneath the hero overlays and increased the
  marked subtitle contrast without changing the visual hierarchy.
- Moved every radial character transition pulse behind its artwork, isolated
  the local actor stacking order, and reduced the pulse peak from 0.84 to 0.42.
  Restored the earlier broad circular Sharingan, including its subtle ring
  halo, after visual review. It fades in and reversibly rotates with scroll,
  while logo hover adds an independent direction-sensitive rotation without
  transform conflicts.
- Integrated five angel poses and five operator poses with page-wide,
  scroll-scrubbed crossfades, blur, scale, and crimson transition pulses.
- Removed the duplicated hero/lower-page choreography and the hero's 260%
  pinned runway. One viewport of natural scrolling now reaches the products.
- Rebuilt the broad-wing angel frame with both wings complete
  (`public/anjo-frame-04-v2.webp`) and added complete-rifle operator stages
  (`public/operador-frame-04-v2.webp`, `public/operador-frame-05.webp`).
- Reframed the operator rest pose from the original source so the complete rifle
  and muzzle remain inside the canvas (`public/operador-premium-v2.webp`).
- Extended both characters through the product/news journey with responsive
  scale, waist smoke, feathers, embers, and looped contour light.
- Recalibrated the fine-pointer beams to emerge above each character from the
  chest, remain active over a wider proximity area, and travel slightly beyond
  the cursor while staying below product/news content. Both endpoint nodes now
  share the same discreet 7px size and reduced glow.
- Unified hero, products, and news under one static page-wide background;
  removed section divider rules and replaced the Radar's rectangular scrim with
  soft overlapping gradients.
- Replaced the hero's temporary `6DNX` text heading with the original
  "6Dorme Nois Xita" brush logo, recolored for the site palette and extracted to
  a transparent, responsive `next/image` asset. The logo now renders slightly
  larger/brighter and owns a reversible scroll expansion independent from the
  slogan and description. On fine pointers, its inner artwork follows the mouse
  with bounded 3D tilt, translation, and a slight breathing scale; the outer
  shell keeps exclusive ownership of the scroll scale so both effects compose
  smoothly and reduced-motion users receive a static logo.
- Audited all 45 files in `discord-imagens/` and recorded the seven confirmed
  product families, visible plans, NFA usage rules, prices, and source
  inconsistencies in `CATALOG_AUDIT.md`. Screenshot prices remain inactive
  until Maycon confirms them.
- Replaced Discord screenshots in the catalog cards with seven original,
  text-free 6DNX cinematic artworks. The 1440x810 WebP files total under
  650 KB and live in `public/products/card-art/`.
- Rebuilt the visual layer of every product card with a stronger cinematic
  image stage, scan texture, category label, subtle reflective sweep, and the
  official hero angel as a consistent animated miniature. The single Thermal
  card now centers itself on its overflow page.
- Made the complete card clickable. On desktop it moves to the center before
  opening information on the left and video on the right; closing restores the
  original card order and scroll position. Mobile uses one scrollable sheet.
- While desktop popups are open, the selected center card shares their visual
  layer above the backdrop/blur; sibling cards remain hidden behind the modal.
  The visible center card is an `aria-hidden`, non-focusable visual twin inside
  the body-level modal portal. This preserves the original grid position while
  keeping the dialog outside the inert page, so its information panel remains
  scrollable and the background stays correctly locked.
- Replaced the product pager's raw numeric overflow with symmetric, equal-size
  clickable arrows around the `6 D N X` core. Pages beyond `D` and `N` are
  reached sequentially through the arrow pair, while a compact non-numeric
  progress rail communicates position without changing the brand mark.
- Rebuilt the page stacking scale so the cinematic characters remain visible
  and unclipped in open space while passing behind hero copy, product cards,
  news content, controls, overlays, and dialogs. The news block also has a
  localized dark backdrop veil to preserve headline contrast.
- Added independent fine-pointer reactions for both cinematic characters:
  proximity-weighted 3D motion, a cursor-tracking local aura, and a light beam
  from a character-specific origin to the pointer. The effect is
  request-animation-frame bounded, preserves `pointer-events: none`, and is
  disabled for reduced motion or non-fine pointers.
- Made `D` the explicit default catalog page, including browser-cache
  restoration. Added reversible luminous `6 D N X` shadow clones that bloom,
  expand up to roughly 8.5x, disperse, and fade only after leaving the product
  section; the original clickable pager stays unchanged.
- Validated the final build with ESLint, TypeScript, Next production build, and
  desktop/mobile browser checks with no console warnings or errors.
- Added a local-first R$ 1,00 checkout laboratory for every catalog variation:
  simulated Pix/card only, no financial fields, 20-minute sessions, rate
  limiting, and TEST-marked Discord TICKET delivery.
- Expanded Radar 6DNX to Steam News API, Google AI Blog RSS, and OpenAI News
  RSS. RSS reads are streamed with a 1 MB ceiling and a strict host allowlist.
- Made the daily cron resilient: successful collection revalidates the site
  even when Supabase persistence is unavailable, while returning
  `storage: "source-only"` instead of falsely claiming durable storage.
- Verified one complete DayZ/spow Pix laboratory order in the production
  preview. The UI confirmed one TEST-marked message delivered to Discord.
- Verified the protected cron locally: 25 items (five each from OpenAI, Google
  AI, DayZ/Steam, ARC Raiders/Steam, and Counter-Strike 2/Steam). Collection
  passed; persistence returned 404 because the pending migration is absent.
- Overrode Next's vulnerable transitive PostCSS/Sharp versions with currently
  patched releases and rebuilt successfully. Production dependency audit is
  clean; remaining audit findings are confined to ESLint development tooling.
- Reorganized `.env.local` into Vercel runtime, future commerce, and local-only
  blocks without exposing values. The misplaced GitHub PAT was removed from
  `CRON_SECRET`, replaced with an independent random secret, and verified
  against the protected cron endpoint.
- Added `COMMERCE_ARCHITECTURE.md` and `VERCEL_ENVIRONMENT.md` as the canonical
  purchase-flow and deployment-variable references.
- Rebuilt the checkout laboratory as a cinematic sales surface: product art,
  the official angel, a three-stage purchase journey, stronger Pix/card
  presentation, clearer trust states, and responsive hierarchy. The
  non-chargeable laboratory label and fixed R$ 1,00 simulator remain explicit.
- Re-audited the 24 local environment keys without printing their values: there
  are no duplicate names, the StorM API URL/key/webhook secret are populated,
  and Mercado Pago remains intentionally empty. `VERCEL_ENVIRONMENT.md` now
  separates Production, Preview, GitHub, local tooling, and external panels.
- Confirmed 23 variables in the linked Vercel project. All are marked Sensitive,
  so Vercel exposes their names/scopes but not their values. The three live
  StorM variables are now scoped exclusively to Production; Preview has no live
  StorM credential.
- Added a fail-closed private-review boundary in `proxy.ts`. When enabled, it
  protects pages and static assets with server-only Basic credentials while
  leaving the independently authenticated cron and future webhook routes
  reachable. Global `noindex`, `Disallow: /`, private caching, environment
  guidance, and the complete continuation boundary are documented in
  `REVIEW_HANDOFF.md`.
- Preserved `Produtos_Organizados.md` as an unmodified staging reference. Its
  provisional prices were not promoted into `lib/products.ts`; the extraction
  contains 31 headings versus 30 summary entries, encoding damage, repeated
  prompts, reused videos, and conflicts with the prior Discord audit.
- Completed a severe pre-commit audit documented in
  `AUDITORIA_SEGURANCA.md`: removed the public Discord side effect, hardened
  route payloads/news URLs/cron headers, prepared least-privilege news RLS, and
  confirmed that the deployed site is still on an older public build while the
  remote `news_articles` table is still absent.
- Replaced the executable storefront catalog with seven legitimate service
  drafts, five original card artworks, explicit reference-price labels, and a
  video-safe media preview. The fixed R$ 1,00 checkout remains a non-payable
  laboratory and carries reference prices separately from its simulated total.
- Centralized explanatory Markdown under `docs/`, added `docs/README.md` and
  consolidated human-readable rules in
  `docs/governance/REGRAS_DO_PROJETO.md`. Root `AGENTS.md` and `CLAUDE.md`
  remain in place because development tools consume them automatically.
- Reconciled all 31 historical source entries one-to-one with 31 internal card
  positions in `MAPA_EDITORIAL_31_ENTRADAS.md`. Their cadastral state is
  `PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO`; this records missing documented
  approval and does not assert `false` or a commercial block.
- Expanded the executable storefront to 40 distinct cards. The former DayZ
  umbrella card was separated into Spow, Moonwalk, Private, GG, Rage, Shadow
  and Elisyum; only duration or license remains inside each card as a price
  variation. The eight imported entries that had lost their documented plans
  now carry the exact reference values present in
  `docs/Produtos_Organizados.md`. All 40 runtime slugs are unique and every card
  has at least one variation. The catalog renders three cards per page, always
  starts at `D`, preserves the angel/art/hover composition for every item, and
  keeps the information-left/card-center/video-right interaction intact.
- Reorganized the catalog around a deterministic bidirectional landing point.
  The active `D` page now opens with DayZ Private, Counter-Strike 2, and Arena
  Breakout. Every other DayZ family is paginated to the left, with any partial
  group kept at the far-left edge; the first page to the right contains Escape
  From Tarkov, Rust, and PUBG, followed by every remaining product in canonical
  source order. The layout validates required slugs, duplicate identifiers, and
  total product preservation before rendering.
- Added a finite `Adjacent Page Peek` cascade on wide fine-pointer viewports.
  Each side now exposes up to three real cards from the neighboring page as
  progressively smaller, darker depth layers. This produces an
  infinite-corridor illusion without changing the finite catalog: clicking a
  cascade advances exactly one page, with no autoplay or wraparound loop. The
  previews are absent at catalog boundaries, hidden during product dialogs,
  and disabled below 70rem to preserve the existing mobile/tablet layout.
- Unified every storefront community, purchase-support, and help action behind
  the server-side `/api/redirect` route. The route reads and validates only
  `DISCORD_INVITE_URL`; Discord webhook credentials remain server-only and are
  never rendered as browser links. The configured invite must be generated
  from the Discord `Welcome` channel for visitors to land there.

## Pending human or business input

- Decide whether the hero-video experiment replaces the established
  frame-driven hero. Before production use, approve the footage and produce a
  mobile-specific delivery if field testing shows slow startup; the current
  3.37 MB desktop MP4 is substantially lighter than the previous 6.65 MB
  candidate but is not adaptive streaming.
- Add an approved YouTube ID only when official material exists; products
  without video use the designed media preview instead of a broken player.
- `Custom Steam Profile` uses the approved vertical YouTube video
  `BqPwa1SXowE`; its popup preserves the video's portrait proportion.
- Confirm or replace each displayed reference price before enabling real
  commerce.
- Configure `SITE_REVIEW_ENABLED`, `SITE_REVIEW_USER`, and a 16+ character
  `SITE_REVIEW_PASSWORD` in Vercel before the next reviewed deployment.
- Apply the Supabase news migration only after human review.
- Replace the currently rejected Supabase server credential before testing
  durable ingestion only if it fails after migration; current key formats and
  project references are consistent. `.env.local` does not create a GitHub
  Action or transfer variables into Vercel.
- Revoke the old classic GitHub PAT in GitHub settings. It is no longer present
  in `CRON_SECRET`; no replacement GitHub token is needed unless Git
  authentication later requests one.
- The local branch is now `main`; merge `78c3fa7` preserves both local and
  remote histories without a force-push, and the latest sales/environment work
  is committed locally. `carloshg-dev` is now an accepted collaborator and a
  dry-run push confirms write permission to `GarciaCarlos1985/6dnx`.
- Confirm StorM Wallet accepts the catalog and provides sandbox documentation
  before enabling real payments. The current laboratory must never be
  presented as a real charge.
- Implement `/api/webhooks/storm-wallet`, raw-body HMAC verification, canonical
  Supabase orders, idempotency, and server-side charge creation before using
  the StorM live credentials in application code or activating the provider
  webhook.
- Follow `COMMERCE_ARCHITECTURE.md`: Supabase is the order source of truth,
  signed provider webhooks confirm payment, and Discord is
  notification/support, never proof of payment.
- The requested `i-have-adhd` plugin was not exposed by the safe plugin manager;
  project continuity is currently provided by `AGENTS.md` and this file.

## Safety status

- Commit and push to `main` were authorized, and GitHub write permission has
  been verified without mutating the remote.
- Every successful `main` push must be followed through the Vercel deployment
  until the production domain returns the new commit successfully.
- `.env.local` is ignored by Git and must remain secret.
