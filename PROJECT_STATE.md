# 6DNX project state

Last updated: 2026-07-28

## Current objective

Build a cinematic but usable 6DNX storefront: scroll-driven hero, persistent
character atmosphere, complete product catalog, lateral product dialogs, an
isolated test checkout, and an automated games-and-AI news area.

## Confirmed decisions

- Visual language: near-black, blood crimson, stone/metal textures, restrained
  particles, strong red contour light.
- Hero order: operator left, central 6DNX copy, angel right.
- Five poses per character are distributed once across the complete page
  scroll; the hero never restarts or consumes the whole sequence.
- The character layer is fixed, pointer-transparent, and unclipped. It stays
  above section backgrounds and below all readable or interactive content.
- The hero receives the broad circular dark-crimson Sharingan beneath the
  existing scrim and scan overlay. It responds to page scroll and fine-pointer
  logo hover through independent nested rotors.
- Desktop product interaction is always information left / card center / video
  right. Mobile uses one centered sheet.
- Product and price claims must be traceable to `discord-imagens/`.
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
- Replaced the product pager's raw numeric overflow with symmetric, equal-size
  clickable arrows around the `6 D N X` core. Each overflow page receives one
  arrow on each side, and either arrow opens its assigned product cards.
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
- Verified one complete DayZ/Spoofer Pix laboratory order in the production
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

## Pending human or business input

- Add each product's approved YouTube ID in `lib/products.ts`.
- `Custom Steam Profile` uses the approved vertical YouTube video
  `BqPwa1SXowE`; its popup preserves the video's portrait proportion.
- Confirm commercial prices before replacing `sob consulta`.
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
