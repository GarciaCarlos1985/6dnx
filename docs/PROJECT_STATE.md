# 6DNX project state

Last updated: 2026-08-13

## Ajuste local pós-release: atalho para o rodapé — 2026-08-13

- O atalho fixo `Últimos` agora navega diretamente até `#creditos`, mantendo o
  crédito `Desenvolvido por Developer Bicho` inteiro e centralizado na área
  visível. A antiga âncora intermediária, posicionada antes do rodapé, foi
  removida.
- O destino público do crédito continua vindo exclusivamente de
  `DEVELOPER_CREDIT_URL`, com fallback seguro para `DISCORD_INVITE_URL`; URLs de
  webhook continuam rejeitadas.

## Ajuste local pós-release: navegação lateral oculta — 2026-08-13

- As setas por fileira e os cards de prévia lateral do antigo carrossel foram
  desativados por `SHOW_ROW_CAROUSEL_CONTROLS=false`.
- O código continua preservado e reversível. A vitrine exibe os 32 cards em
  oito fileiras e mantém a busca como navegação principal.

## Release final: vitrine compacta, persistência admin e SEO — 2026-08-13

- Produção recebeu **somente** as migrations previamente autorizadas
  `20260809180000_add_commerce_coupons.sql` e
  `20260809220000_add_site_experience_studio.sql`, executadas de forma
  direcionada. O histórico remoto e os objetos principais foram conferidos;
  nenhuma outra migration pendente foi incluída e não houve `supabase db push`
  genérico.
- O Estúdio Visual agora persiste rascunhos no schema real e diferencia
  claramente estado disponível de prévia local. Controles nativos do Windows
  mantêm contraste escuro. Cupons ficam habilitados no banco sem alterar o
  checkout quando nenhum código é informado.
- A vitrine pública usa quatro cards compactos por fileira e oito fileiras,
  totalizando 32 cards visíveis no primeiro estágio. O diretório de atalhos e o
  botão `Vitrine completa` foram apenas ocultados por uma flag reversível; a
  busca permanece em destaque e filtra os cards reais. Atalhos fixos levam ao
  topo e ao final do catálogo.
- Produção passou de 21 para 32 cards publicados pela restauração de exatamente
  onze clones Rust que já existiam arquivados. A operação foi transacional e
  restrita a `source_key` explícita + título `RustN`; não regravou título,
  preço, arte, posição ou conteúdo dos 21 cards editados pelo Maycon. O trigger
  comercial existente sincronizou as variações desses clones.
- A proporção antiga de card permanece disponível como classe reversível
  `product-card--legacy-size`, mas não está aplicada à nova vitrine.
- SEO técnico agora fixa o domínio canônico em `https://www.6dnx.com.br`,
  descreve a marca e o catálogo, publica Open Graph/Twitter e dados estruturados
  de organização. `robots.txt`, `sitemap.xml`, favicon, ícones e imagem social
  deixam de receber a política privada `X-Robots-Tag`. O sitemap também deixa
  de anunciar o domínio `6dnx.vercel.app`.
- A atualização visual do resultado do Google não é instantânea: depois do
  deploy é necessário solicitar uma nova indexação no Google Search Console.
  Favicon, título e descrição são fornecidos pelo site, mas a forma final e o
  prazo de exibição pertencem ao Google.

## Diagnóstico do Estúdio Visual e Cupons — 2026-08-13

- A reprodução autenticada em `/admin/estudio` confirmou que o seletor de
  partículas alterava apenas a prévia. O botão de rascunho parecia acionável,
  porém `saveDraft()` encerrava silenciosamente quando o repositório informava
  `schema-missing`. A interface agora bloqueia esse falso salvamento, mostra
  `Salvar indisponível` e avisa explicitamente que as mudanças locais serão
  descartadas ao sair.
- O seletor nativo de densidade herdava texto claro sem declarar um esquema de
  cores. Em Windows/Chrome, a lista podia abrir branca com opções ilegíveis.
  O controle agora declara `color-scheme: dark` e cores explícitas para as
  opções, sem trocar o valor salvo ou a lógica das partículas.
- Naquele diagnóstico inicial as migrations ainda estavam ausentes. O estado
  atual e a aplicação direcionada estão registrados no checkpoint acima.

## Identidade de favicon 6DNX — release para main

- O favicon genérico da Vercel foi substituído por um recorte determinístico da
  arte oficial `public/logo-asas.png`: coroa, número 6 e asas sobre fundo
  preto/carmesim. Nenhuma marca foi redesenhada ou gerada por IA.
- `app/favicon.ico` contém tamanhos de 16 a 256 px e mantém a URL estável
  `/favicon.ico`; `app/icon.png` (512 x 512) e `app/apple-icon.png`
  (180 x 180) completam navegador, atalhos e dispositivos Apple.
- O Next.js injeta automaticamente os links de ícone no `<head>`. A home e o
  arquivo do favicon permanecem liberados para rastreamento; o Google ainda
  depende de novo rastreamento/indexação para substituir o ícone antigo nos
  resultados de pesquisa.

## Cupons comerciais + galeria demonstrativa — branch de revisão

- A branch `codex/storefront-navigation-content` agora contém o sistema de
  cupons percentuais administrado em `/admin/cupons`: código, nome interno,
  compra mínima, início, validade, status ativo/pausado/arquivado e proteção
  contra sobrescrita concorrente. O checkout aceita o código opcional, mas o
  navegador nunca informa nem calcula o preço autorizado.
- O valor original vem da oferta `approved` no servidor. A função SQL
  `create_discounted_commerce_order` recalcula o desconto, cria o pedido e
  grava uma fotografia imutável do cupom na mesma transação. Repetições com o
  mesmo `client_request_id` são serializadas antes de qualquer insert.
- Cada produto ganhou uma galeria opcional de até cinco imagens para o popup
  direito. O admin faz upload, remove e ordena as artes. A vitrine reproduz a
  sequência em loop a cada 4,5 segundos, com setas anterior/próxima, indicadores
  e respeito a `prefers-reduced-motion`. Sem imagens, permanece o fallback
  “Demonstração em preparação”.
- As migrations `20260809180000_add_commerce_coupons.sql` e
  `20260809183000_add_product_demo_gallery.sql` estão somente versionadas. Elas
  **não foram aplicadas** neste checkpoint. A primeira cria novas tabelas/RPCs;
  a segunda somente adiciona `demo_images = []` e não regrava título, preço,
  imagem, publicação ou ordem de nenhum card existente.
- O checkout sem cupom continua usando o caminho anterior e não depende dessas
  migrations. Não executar `supabase db push` genérico: conferir primeiro o
  histórico remoto e aplicar somente o conjunto explicitamente revisado e
  autorizado.
- A Slot continua pública como prévia visual. Saldo, débito de moedas, prêmio,
  giro aleatório e entrega automática permanecem desligados.
- Gates pré-commit concluídos: ESLint limpo, `next typegen && tsc --noEmit`,
  61/61 testes Node e build de produção com 29/29 páginas. A verificação no
  navegador cobriu desktop 1440x900, mobile 390x844, fallback da galeria,
  seleção de variação e a barreira de autorização de `/admin/cupons`; não houve
  erro de runtime. O único aviso observado é o aviso antigo de `sizes="100vw"`
  em `/hero-apocalypse.jpg`, fora deste escopo. Os quatro gates serão repetidos
  depois do commit e antes do push, conforme o protocolo de release solicitado.

## Storefront discovery + Discord announcements — local, pending owner review

- Branch/worktree: `codex/storefront-navigation-content` in
  `6dnx-MayconFernandes-storefront-ui`. The product-discovery work in this
  checkpoint foi commitado na mesma branch de revisão; nenhuma migration ou
  mutação de Production foi executada.
- A new `Encontre seu produto` surface sits above the catalog rows. Its search
  and shortcut buttons are derived at runtime from the same published catalog
  returned by `getPublishedCatalog()`: no product name or category is
  hard-coded. Publishing, archiving, renaming or reordering a product in the
  admin therefore updates both the cards and shortcuts together after the
  existing catalog cache invalidation.
- Search ignores casing and diacritics and covers title, category, tagline,
  description and variation metadata. Clicking a shortcut locates the product
  across all four independent carousel rows, changes only the necessary row
  page and opens the existing accessible product dialog. Closing returns focus
  to the shortcut; `Vitrine completa` clears the filter and restores row pages
  to `0,0,0,0`.
- The home navigation label `Notícias` was replaced with `Anúncios`. It opens
  the public Discord invite configured by `DISCORD_ANNOUNCEMENTS_URL`, with
  `https://discord.gg/5k9tvSerW` as the safe fallback. This is a normal public
  link, never a Discord webhook. The internal news collection/radar remains
  untouched and can continue serving its operational database-wake purpose.
- Verification: 49/49 Node tests, ESLint, strict TypeScript and Production build
  passed. Browser QA used the live local Supabase catalog (24 published cards):
  a search for `Rust16` moved row 4 to the correct page, opened that product,
  closed back to the search control and reset the full showcase. The
  390x844 viewport remained usable with a bounded two-column shortcut list.
  One pre-existing Next Image development warning remains for
  `/hero-apocalypse.jpg` using `sizes="100vw"`; this checkpoint did not change
  the hero.

## Handoff 2026-08-06 — estado real para qualquer agente que assumir

> Leia também `docs/CONSTITUICAO_TECNICA_6DNX.md` (fonte de verdade de regras
> e roadmap) e `docs/README.md`. Este arquivo é o estado operacional.

### O que JÁ está em `main` (publicado)
- Social OAuth login Google/Discord no hero (`HeroAuth`), rota `/auth/callback`,
  sessão via Supabase Auth (browser+server clients existentes). Commit `3c63770`.
- Área de usuário `/conta` (Minha Conta): saldo de moedas + Meus Pedidos,
  rota `/api/account` protegida por sessão, `lib/account` (service-role).
  Commit `0924c94`.
- Link "Minha Conta" no hero quando logado.
- Docs: `CONSTITUICAO_TECNICA_6DNX.md`, `CONTA_USUARIO_FIDELIDADE_6DNX.md`,
  `SLOT_DA_SORTE_6DNX.md`; scripts `confirm-test-payment.mjs` e
  `investigate-order-083f6810.mjs` (somente leitura).

### Migration completa de fidelidade — NÃO APLICADA (decisão do dono)
- `supabase/migrations/20260806100000_add_user_fidelity.sql` está versionada
  **mas NÃO foi aplicada em nenhum banco**. A compatibilidade emergencial
  isolada de `commerce_orders.user_id` foi aplicada depois pelo trabalho
  `ff82cac`; isso restaurou checkout e pedidos sem ativar ledger, moedas ou
  Slot. Enquanto a migration completa continuar pendente, fidelidade deve ser
  exibida como `preparing`/indisponível, nunca confundida com um saldo real.
- Aplicar exige autorização explícita + teste em transação com ROLLBACK primeiro.

### Branches e PRs abertas
- `feature/constituicao-tecnica` → **PR #12 aberta** (checklist de PR + proibições
  na Constituição). NÃO mergeada.
- `feature/seo-unblock-public-routes` → trabalho SEO em andamento (ver abaixo),
  NÃO commitada ainda.
- `codex/*` → branches antigas de trabalho anterior (histórico).

### SEO — desbloqueio em andamento (última tarefa)
- Confirmado ao vivo: produção aplica `X-Robots-Tag: noindex, nofollow,
  noarchive, nosnippet` em TODAS as páginas públicas; `robots.txt` tinha
  `disallow: "/"`; não existia `sitemap.xml`; layout raiz tinha metadata
  `robots: {index:false}` global. Site invisível ao Google.
- Branch `feature/seo-unblock-public-routes` implementa (LOCAL, sem commit):
  1. `proxy.ts` — `X-Robots-Tag` noindex apenas em rotas privadas
     (/admin, /conta, /api, /checkout); públicas (/, /noticias, /produtos)
     ficam indexáveis.
  2. `app/robots.ts` — Allow: / ; Disallow admin/api/conta/checkout.
  3. `app/sitemap.ts` (novo) — sitemap com `/` e `/noticias`.
  4. `app/layout.tsx` — removido robots global do metadata raiz.
- Aguardando revisão/aprovação do dono antes de commit/PR. NÃO está em main.

### Webhook e pagamento — confirmados
- Webhook StorM ativo em produção (GET → 405, rota existe).
- Pedido de teste R$1,00 (`c7c6ae0f…`) = `paid` com `paid_at` preenchido,
  via reconciliação (0 webhook_events). Pedido `083f6810…` = paid via webhook
  assinado (prova do caminho padrão funcional).

### Regras para quem assumir (resumo)
- NUNCA push/merge direto em `main` (push dispara deploy automático em
  produção — já ocorreu por acidente).
- Trabalhar sempre em `feature/<nome>` e aguardar revisão.
- Não aplicar migrations sem autorização explícita.
- Não tocar no painel admin (será feito por outro agente).
- Antes de qualquer coisa: ler a Constituição Técnica por inteiro.

---

## PIX creation retry hardening — isolated review branch

- Maycon confirmed the business decision to accept only PIX through StorM for
  now. No card gateway or Mercado Pago activation belongs to this scope.
- Branch `codex/storm-pix-create-claim` adds an atomic, database-backed claim
  before `POST /api/v1/payments/create`. Two requests for the same order can no
  longer both call the provider: the winner creates, while the loser waits and
  then reuses the same persisted PIX.
- Existing attempts are checked through the authenticated StorM status endpoint
  before reuse. `providerPaymentId`, `externalId` and amount remain exact-match
  requirements. PIX copia-e-cola and QR data are protected by existing RLS and
  are cleared when an order becomes paid, failed or cancelled.
- Network timeout, invalid provider response, database failure after the POST,
  or an expired creation lease are treated as **ambiguous**. That order remains
  fail-closed and cannot automatically create another PIX. Only explicit 400,
  401, 403, 404 or 422 provider rejections release a deterministic retry.
- Migration `20260808160000_add_storm_payment_creation_claim.sql` is versioned
  but **not applied**. The application change is also not deployed. Rollout must
  apply this backward-compatible migration before deploying the matching code.
  Do not use an unreviewed generic `supabase db push`: first inspect the live
  migration history because older repository migrations remain documented as
  pending, then apply only the explicitly approved, audited rollout set.
- Local validation covers the mandatory concurrent test (one provider call for
  two simultaneous requests), ambiguous-timeout lockout, existing PIX reuse and
  a PostgreSQL 16 transaction ending in `ROLLBACK`. ESLint, Next route type
  generation, strict TypeScript, all 38 Node tests and the Production build are
  green. PR review remains required before any merge or Production change.
- StorM support still needs to confirm in writing whether `Idempotency-Key` is
  guaranteed server-side. The 6DNX claim is intentionally the primary barrier
  and does not depend on that undocumented behavior.

## Live Production checkout — authoritative checkpoint for a new chat

- Real StorM PIX checkout is active on `https://www.6dnx.com.br` as of
  2026-08-04. Both Production activation flags are `true`, and the corrected
  `CHECKOUT_DATA_HASH_SECRET` is present in the active deployment. An
  origin-valid empty request to `/api/checkout` now reaches payload validation
  and returns `400 Dados do pedido inválidos` instead of the former readiness
  `503`; this smoke test creates no charge.
- GitHub PRs #9 and #10 are merged into `main`. Production deployment
  `dpl_FtiQBJLxr8z4twrS3iEo2LQr8RWg` serves merge SHA
  `d9b0c8149a404468dd11656d112cb163a85ac720` on `6dnx.com.br`,
  `www.6dnx.com.br` and `6dnx.vercel.app`.
- Supabase migrations `20260801170000`, `20260803235717` and
  `20260804030000` are applied. The published catalog currently resolves to
  154 approved server-side offers; three stale or unpriced offers are
  suspended. The browser never supplies the amount charged.
- The historical paid R$ 1.00 order
  `6DNX-c7c6ae0f-3744-4d4a-9ef2-030929ce46d7` was reconciled through the
  official StorM payment-status endpoint, without a new charge. Production now
  records the order as `paid`, the provider attempt as `COMPLETO`, and exactly
  one reconciliation event. A second reconciliation returned `paid: 0` and
  the event count remained one, proving idempotency.
- One separate `DayZ Moonwalk / Lifetime` order for R$ 22.00 remains
  `pending_payment`; it was not converted to paid by the reconciliation job.
- Production browser QA selected `DayZ Private / 1 Dia`, confirmed the
  `Comprar com PIX` control enabled, and opened the real name/CPF checkout
  form. QA stopped before submitting customer data, so it created no charge.
- Protected cron diagnostics may return a `CheckoutReadinessCode` only after
  valid `CRON_SECRET` authentication. Public checkout errors still expose no
  environment values or secret names.
- Statements below describing checkout flags, reconciliation migrations or
  offer synchronization as absent/unpublished are historical checkpoints and
  are superseded by this section.

## Local admin-productivity checkpoint — pending owner review

- A local, uncommitted admin pass adds a complete variation workflow: create,
  duplicate, edit, reorder, highlight one option, choose an option color, mark
  an option sold out, archive/reactivate it, or remove it with confirmation.
  Cards can also be marked globally `sold-out` without deleting prices or
  configuration. The limit remains 40 uniquely named options per product.
- Public rendering now hides archived variants, keeps sold-out variants visible
  and disabled, and blocks every option when the whole card is sold out. The
  server repository and the isolated checkout laboratory repeat these checks;
  this is not a client-only visual restriction.
- **Organizar vitrine** no longer preselects position 1. Search selection can be
  cleared; minimap houses select and deselect; dragging one minimap card over
  another swaps the two in the local draft. Three-dot move, exact swap,
  reversible archive, direct position, top/end shortcuts and the final review
  checkbox remain available.
- Additive migration
  `20260804120000_add_catalog_availability_controls.sql` makes commercial offer
  synchronization suspend product-level and variant-level sold-out/archived
  states. It is versioned locally but **has not been applied**. No commit, push,
  deploy or Production mutation belongs to this checkpoint before owner QA.
- Local gates completed at this checkpoint: ESLint, Next route type generation,
  strict TypeScript, production build and 33/33 Node tests. Desktop and mobile
  browser QA passed without horizontal overflow or console warnings; the
  owner still needs to review the workflow before any publication.

## Checkout UX checkpoint — 2026-08-04

- The checkout-conversion pass moved the variation selector and primary PIX
  action into a fixed purchase block immediately below the product-dialog
  header on desktop and mobile. Customers no longer need to scroll through
  descriptions, requirements or tutorials to reach the variation. A product
  with exactly one variation selects it automatically; products with multiple
  variations still require an explicit choice so the wrong option cannot be
  charged.
- Discord is a clearly secondary, optional action beside the purchase guide: a
  translucent light control with the Discord mark and `CANAL WELCOME`. The
  previous internal copy about an "approved commercial price" was removed.
- `Como funciona a compra` now always opens the branded seven-stage artwork
  that documents the intended real flow: choose card, choose variation, create
  and pay PIX, receive automatic confirmation, then open Discord for delivery
  and support. The old five-box PIX guide and the outdated flow that opened
  Discord before payment were removed.
- Read-only Production Supabase evidence confirmed why the local Moonwalk
  checkout still refuses payment: `dayz-moonwalk / Lifetime` exists at `2200`
  cents but is `draft`, not `approved`. This is an internal 6DNX commercial
  gate, not a Banco do Brasil or StorM Wallet refusal. Browser QA exercised the
  exact path with synthetic customer data; it stopped before order/provider
  creation and explicitly confirmed that no charge was created.
- The current pass is green on ESLint, strict TypeScript, all 32 tests and the
  Production build. Browser QA confirmed the new guide in the live local
  product dialog. No offer, order, payment, migration, deployment or Production
  environment value was changed; both Production checkout flags remain false.
- The remaining `offer-unavailable` failure was traced to duplicated commercial
  state: Production has 59 published products and 154 currently priced
  variants, while `commerce_offers` still had 156 `draft` rows and one
  suspended R$ 1.00 test row. Migration
  `20260804030000_sync_published_catalog_offers.sql` now makes publication the
  owner-facing sales switch: valid positive prices on published products are
  synchronized as approved server-side offers; removed/unpriced variants and
  draft/archived products are suspended. Existing orders keep their immutable
  price snapshots and the browser still cannot provide a charge amount.
- The synchronization passed 32/32 Node tests and a PostgreSQL 16 integration
  transaction covering initial approval, price change, new/removed variants,
  archive/restore and direct-function privilege denial. Migrations
  `20260801170000`, `20260803235717` and `20260804030000` were then applied by
  the official Supabase CLI. Production verification found 154 approved offers
  matching the current published priced variants, three stale/unpriced offers
  suspended, Rust1 restored from the R$ 1.00 test value to R$ 21.99, and no new
  order, payment attempt, webhook or reconciliation event.
- `STORM_WALLET_CHECKOUT_ENABLED` and
  `STORM_WALLET_PRODUCTION_APPROVED` now exist as sensitive Production-only
  Vercel variables with value `true`. Vercel applies environment changes only
  to a new deployment, so the prior Production deployment remained disabled
  while the database and Git release gates were completed.

## Prior handoff details — historical context

- The owner explicitly approved publication of the social-sharing release on
  2026-08-03. `app/opengraph-image.png` is a static 1.9:1 key art using the
  official operators, winged logo and angel; root metadata now includes
  canonical, Open Graph and large Twitter card fields. The delivery asset was
  optimized to a 1200×630 JPEG at about 159 KB. Social preview image routes are
  the only public paths exempt from `X-Robots-Tag`; every page keeps the
  `noindex`/`nofollow` policy and strict same-origin resource isolation.
- The owner explicitly authorized the public storefront launch on 2026-08-03.
  The Git-backed release publishes the current twelve-card/four-row catalog,
  responsive dialogs, admin improvements and footer copyright. Checkout code is
  included but new StorM charges remain disabled: both activation variables are
  absent/false and the public CTA falls back to Discord.
- The pre-push release gate passed: lint, generated Next route types + strict
  TypeScript, 22 tests, production build, `npm audit --omit=dev` with zero
  vulnerabilities, high-confidence secret scanning, and Playwright verification
  at 1440x1000 and 390x844. Both viewports showed no console warnings or
  horizontal overflow; the disabled state exposed no PIX button or CPF field.

- The end-to-end payment integration is **not back at the beginning**. A real
  R$ 1.00 PIX was created and paid, StorM delivered the callback to Production,
  the raw-body HMAC passed and the route called Supabase.
- The only failure in that paid test was the live RPC ambiguity
  `ON CONFLICT (order_id)`, returned as HTTP `422` with PostgreSQL `42702`.
  Production was not altered after diagnosis: the order is still
  `pending_payment`, `paid_at` is null, no webhook event was persisted and the
  offer is `suspended`.
- The authorized additive correction
  `20260803120000_fix_storm_payment_event_conflict.sql` was applied atomically
  to the Production Supabase project and registered in migration history. It
  uses `ON CONFLICT ON CONSTRAINT commerce_payment_attempts_pkey`, keeps the
  RPC executable only by `service_role`, and did not change the pending order,
  payment attempt or event count during deployment.
- StorM support answered that callbacks are not replayed and that delivery
  retries are not guaranteed. Their official operational guidance is to answer
  `2xx` quickly and combine the webhook with authenticated status polling. The
  owner therefore authorized a server-side reconciliation implementation that
  queries the already-created payment; no new charge may be created.
- Branch `codex/storm-server-reconciliation` now contains the additive, still
  **unapplied and unpublished** migration
  `20260803235717_storm_server_reconciliation.sql`, immediate reconciliation in
  the signed customer-status flow, a bounded daily fallback cron, distinct
  audit evidence and duplicate-notification protection across webhook/polling.
  The migration passed local PostgreSQL 16 tests for exact matching,
  idempotency, RLS/grants, amount mismatch and a late webhook after polling.
  The complete local gate also passed lint, generated route types + strict
  TypeScript, 28 tests, the Production build, `npm audit --omit=dev` with zero
  vulnerabilities and a high-confidence secret scan.
  Production state has not changed; tests must be reviewed before a separate
  authorization to apply or deploy.
- Responsibility split: Codex prepares, validates and—when explicitly
  authorized—applies the targeted migration, then verifies Supabase and Vercel.
  The attempted Discord OAuth login was blocked until the owner verifies an
  e-mail address or phone number. The owner authenticated the general StorM
  account and opened a private ticket in the official Discord. Support then
  confirmed that they do not replay callbacks and directed 6DNX to the official
  payment-status endpoint. No Wallet password needs to be shared. Applying the
  prepared migration, publishing the code and final Production activation are
  three separate owner decisions.
- Security hardening found during the broader audit (admin MFA/AAL2, full CSP,
  webhook freshness/rate limit, GitHub security tooling and
  retention policy) is a pre-scale backlog. It must not be presented as ten
  additional steps required to repair the already-paid R$ 1.00 test.
- No Production payment flag was enabled. The storefront release is independent
  from the pending reconciliation release and
  must keep purchases routed to Discord until both activation flags are
  explicitly approved later.
- The recreated Supabase Auth administrator was found confirmed
  but without an application role. After explicit owner authorization, it was
  promoted in the correct Production project by adding only
  `app_metadata.role = "admin"`; provider metadata was preserved and the
  password was not changed. The user must sign out and back in so a fresh JWT
  contains the new claim.
- The six-digit StorM code successfully authenticated the owner's general
  account. The private support ticket produced the definitive no-replay/polling
  guidance above; the separate Wallet password is not required and must not be
  shared.
- The **Organizar vitrine** persistence incident was traced to Production, not
  to drag-and-drop: the deployed API called
  `reorder_published_product_catalog`, but that RPC did not exist in the live
  database. Migration `20260801143000_add_catalog_ordering.sql` was first
  exercised inside a rolled-back transaction against all 59 published cards;
  direct swapping and repeated idempotent execution passed and rollback
  restored every order/revision. The owner explicitly requested the repair, so
  the exact versioned migration was then applied and recorded in Supabase.
  A no-op call confirmed the live function without changing the current order.
- The organizer UI now has a fast path: search by title/category/slug, select a
  card and move it directly to an exact position, the top or the end. Native
  drag-and-drop and one-step arrows remain only for small adjustments. Every
  card now has an actual three-dot action button that opens a responsive
  minimap: selecting a destination can either insert the card at that position
  or swap exactly two cards. The same dialog can archive the card through the
  existing revision-protected publication API; archive is immediate,
  reversible and distinct from the pending order save. The home invalidates
  both the catalog tag and `/` after catalog mutations. This UI/code update is
  local and uncommitted until the owner reviews it.
- Added a customer-facing **Como funciona a compra** control to desktop and
  mobile product details. While Production checkout remains disabled it opens
  the optimized 229 KB guide at
  `public/guides/como-comprar-6dnx.webp`, documenting the current Discord order
  path and clearly labelling automatic StorM PIX as homologation. If checkout
  is enabled later, the popup switches to the server-confirmed PIX steps and
  does not display the obsolete manual-flow artwork.
- The temporary local `Teste` presentation was not a catalog row: it was a
  development-only overlay that renamed `Rust1`. That overlay and its test were
  removed; `Rust1` and its database history remain intact.
- This organizer checkpoint passes ESLint, generated Next route types plus
  strict TypeScript, 30 Node tests, the Next.js 16.2.12 Production build and
  `npm audit --omit=dev` with zero vulnerabilities. Browser QA proved direct
  distant movement, exact two-card swap, a responsive 390 × 844 minimap with no
  horizontal overflow, a responsive purchase guide, no console warning/error
  and no `Teste` title on the local storefront.

## Current objective

Build a cinematic but usable 6DNX storefront: scroll-driven hero, persistent
character atmosphere, complete product catalog, lateral product dialogs, an
isolated test checkout, and an automated games-and-AI news area.

## Release checkpoint — 2026-08-03

- This release replaces the manual storefront snapshot with a traceable Git
  branch and the complete current UI. The signed webhook remains active; the
  authenticated reconciliation fallback is prepared locally but not yet
  applied or published.
- `/api/checkout` is deployed but returns `503` before parsing customer data
  while either activation flag is absent/false. This is intentional. Missing
  flags are the safe state and do not need to be created as literal `false`.
- The customer-facing purchase action is `Comprar pelo Discord`; the PIX modal,
  CPF field and QR Code cannot open while checkout readiness is false.
- The footer credit resolves `DEVELOPER_CREDIT_URL` first and safely falls back
  to the already configured public `DISCORD_INVITE_URL`; invalid/non-HTTPS
  values remain blocked by the public-link allowlist.
- No Supabase migration or offer-status mutation is part of the storefront
  deployment. The paid R$ 1.00 order remains pending until the separately
  reviewed reconciliation migration and code are authorized.

## Historical Production checkpoint — 2026-08-02

- `6dnx.com.br` is connected to the Vercel project. Public DNS resolves the
  apex to `216.198.79.1` and `www` to
  `f0a34a8971b25dee.vercel-dns-017.com`; HTTPS returns `308` from the apex to
  `https://www.6dnx.com.br/` and `200` from `www`.
- The commercial migration `20260801100000_create_storm_commerce.sql` was
  explicitly authorized, validated against the real PostgreSQL schema inside
  a transaction that was rolled back, then applied atomically and registered
  in Supabase migration history. It created 157 offers, all `draft`, with zero
  approved offers, orders, payment attempts or webhook events.
- All four commerce tables have RLS and admin policies. The Data API grants are
  explicit and minimal: `service_role` can perform only the repository
  operations it needs; anonymous access is denied; only `service_role` can
  execute `process_storm_payment_event`.
- A manual Production deployment, `SgiQFdWP9`, published
  `POST /api/webhooks/storm-wallet` and its server-only dependencies. Its
  Vercel build manifest confirms the route, and the active alias descends
  through redeployments `4UdVjCSEz` and `HU8y57zmL`; this snapshot is not tied
  to commit `57b7ea5` or another Git SHA. Invalid signatures return `401` with
  `Cache-Control: no-store`; `GET` returns `405`. The real checkout creation
  route remains absent (`404`).
- StorM points to `https://www.6dnx.com.br/api/webhooks/storm-wallet` and the
  newly generated HMAC secret was saved in Vercel Production. Exact
  local-secret-to-Vercel parity is now proven by the signed raw-body probe;
  the first provider-originated callback will still be observed during the
  controlled real-payment test.
- Payment creation remains deliberately disabled in Production:
  `STORM_WALLET_CHECKOUT_ENABLED` and
  `STORM_WALLET_PRODUCTION_APPROVED` are absent there.
  `STORM_WALLET_WEBHOOK_SECRET` and
  `CHECKOUT_DATA_HASH_SECRET` are project-scoped to Production rather than a
  specific deployment. The owner-controlled local real-payment test created
  one 100-cent charge for `Rust1 / 1 Dia`; the provider polling later observed
  `COMPLETO`. The test offer was immediately changed from `approved` to
  `suspended`, while the other 156 offers remain `draft`.
- The server-only webhook foundation was committed and pushed in draft PR #2.
  The larger checkout/admin/UI work remains in the dirty local worktree and
  was not included in that isolated publication.
- The webhook is active in Production through the earlier manual Vercel
  deployment. Its Git-backed replacement is available only on draft PR #2 and
  has not been merged into `main`; do not redeploy the unchanged remote `main`
  until that integration is reviewed.
- Production still serves the older storefront from that isolated snapshot:
  server-rendered HTML contains three product cards and no Developer Bicho
  footer credit. The local worktree renders twelve cards across four rows and
  includes the footer. Those broader storefront/admin changes are uncommitted,
  are not part of PR #2, and therefore cannot appear through a Git-backed
  Vercel deployment yet.
- Rotate the local `VERCEL_TOKEN`: Vercel CLI 58.4.4 echoed it in a pagination
  hint during this session, so it must be treated as exposed even though no
  value was written to source.
- The authorized HMAC homologation was attempted after the owner reported the
  rotation complete. StorM `GET /api/v1/account` returned `200` and
  `webhookConfigured=true`, but the signed no-order probe returned `401`.
  Measurement without exposing values found that local
  `STORM_WALLET_WEBHOOK_SECRET` contains a webhook URL instead of the provider
  HMAC secret, local `CHECKOUT_DATA_HASH_SECRET` has 27 characters instead of
  the required 32+, and the replacement `VERCEL_TOKEN` is rejected by Vercel.
  No payment, commit, push or local activation flag was created after this
  failed boundary.
- After the owner corrected the local HMAC and hash values, homologation passed:
  the exact signed raw body reached the Supabase RPC (`422` only because the
  synthetic order did not exist), the same signature over a tampered body was
  rejected with `401`, and a mismatched event header was rejected with `400`.
  Orders, attempts and webhook events remained at zero.
- The isolated ten-file webhook/migration/test scope was committed as `0cfc263`
  on `codex/storm-webhook-hmac`, pushed, and opened as draft PR
  `https://github.com/GarciaCarlos1985/6dnx/pull/2`. The larger dirty worktree
  remains uncommitted and unstaged.
- Commit `0ed48ed` made `npm run typecheck` generate Next.js route types before
  invoking TypeScript. The PR's GitHub Quality job and Vercel Preview are both
  green; the previous `PageProps`/`RouteContext` CI errors are resolved.
- `STORM_WALLET_CHECKOUT_ENABLED=true` is now present only in `.env.local`;
  `STORM_WALLET_PRODUCTION_APPROVED` remains absent. A local empty checkout
  request returned `400` for invalid order data instead of configuration `503`,
  proving local activation without calling StorM or creating a payment.
- For the controlled real-payment test, local development temporarily presented
  `Rust1` first as `Teste`, with only its existing `1 Dia` variation visible at
  R$ 1,00. The immutable slug/source key remained
  `rust-1-6dnx-software`; the shared catalog was untouched. That overlay has now
  been deleted and must not return. The historical offer/payment evidence is
  preserved separately from the storefront presentation.
- The replacement `VERCEL_TOKEN` is still rejected by Vercel CLI. GitHub
  publication succeeded through the separately authenticated `gh` session;
  do not rely on the local Vercel token until it is replaced again.
- The first live R$ 1,00 test moved real money and the StorM status endpoint
  reported `COMPLETO`. The real provider callback reached Production at
  10:42:55 BRT, passed the firewall, middleware, content, HMAC and event checks,
  then called the Supabase RPC; the route returned `422`. A rollback-only
  reproduction exposed PostgreSQL `42702`: output column `order_id` conflicts
  with `ON CONFLICT (order_id)` inside `process_storm_payment_event`. Replacing
  that clause with `ON CONFLICT ON CONSTRAINT commerce_payment_attempts_pkey`
  made the same input atomically produce `paid` plus one event in the test
  transaction; rollback restored `pending_payment` and zero events. Production
  is still unchanged, no paid Discord delivery is proven, and the offer remains
  `suspended`. The explicitly authorized additive RPC migration is now applied;
  request the provider resend of the original signed event before considering
  any separately audited recovery.

## Confirmed decisions

- Visual language: near-black, blood crimson, stone/metal textures, restrained
  particles, strong red contour light.
- The active hero uses the static `hero-apocalypse.jpg` backdrop, a dedicated
  Killa couple on the left, a dedicated ivory-wing angel on the right and the
  transparent `logo-asas` artwork in the center. These hero-only actors dissolve
  before the product scene appears.
- Starting at the product section, its existing Killa couple and pale-wing
  shushing angel keep their own choreography unchanged.
- The product character scene owns one reversible scroll journey from the
  section entrance to the document end; it never restarts inside the catalog.
- The character layer is fixed, pointer-transparent, and unclipped. It stays
  above section backgrounds and below all readable or interactive content.
- The hero receives the broad circular dark-crimson Sharingan beneath the
  existing scrim and scan overlay. It responds to page scroll and fine-pointer
  logo hover through independent nested rotors.
- Desktop product interaction is always information left / card center / 6DNX
  media preview right. Mobile uses one centered sheet. Video embeds are
  temporarily disabled even when a product retains a stored YouTube ID.
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
  preview, search/filters, bounded thumbnail upload, optimistic revision checks
  and automatic history. `/admin/demo` provides a development-only visual
  walkthrough without weakening production auth.
- Rebuilt the owner experience as a fail-safe daily editor. Generic creation or
  duplication, route edits, arbitrary colors, variation add/remove and content
  restoration remain absent from the normal form. The update API independently
  rejects those structural changes and history remains read-only. Any card can
  now be archived and restored without deletion. Catalog ordering lives in a
  separate protected board, never inside the product-content editor.
- Added exactly twenty full Rust derivatives (`Rust1` through `Rust20`) to the
  static catalog, preserving the source art, copy, features, compatibility,
  tutorial, variants and prices while changing only title and unique internal
  identifiers. Existing Supabase catalogs receive them through an idempotent
  admin action that defaults to one card, requires an explicit quantity,
  inserts only the next missing numbers and then disappears when complete.
- Stabilized catalog navigation for the expanded dataset. Adjacent previews no
  longer force-remount their entire stack, persistent GPU blur/backdrop filters
  were replaced by lightweight opacity shading, visible card images are lazy,
  and a short transition lock prevents rapid clicks from stacking multiple
  generations of animated image nodes in Chrome.
- Made the visual hierarchy explicit instead of relying on nested stacking
  accidents: the complete storefront sits above the fixed product characters,
  while the fine-pointer energy beam now has its own pointer-transparent layer
  above the storefront and below every product dialog. Shelf and footer arrows
  received a stronger blood-crimson glow without changing their finite pager
  behavior.
- The hero logo is served directly from the optimized static WebP with an
  above-the-fold preload. This bypasses a Chrome case where the Next image
  optimizer request remained pending even though the source asset returned
  successfully; the logo animation and exact artwork remain unchanged.
- Reworked the storefront into four independent three-card shelves. The first
  two shelves form section 2, the next two form section 3, so twelve products
  are visible on entry. Every shelf keeps finite left/right navigation and its
  own adjacent cascade; the footer keeps the global arrows and `6 D N X` pager.
  The first twelve canonical positions map exactly to those four shelves.
- Added the dedicated **Organizar vitrine** admin mode. It supports native
  drag-and-drop plus keyboard/touch-friendly up/down buttons, search and direct
  positioning, and a three-dot minimap for move, exact swap and reversible
  archive actions. It clearly labels all four initial shelves, requires an
  explicit review checkbox and saves the complete published order through one
  validated atomic RPC. The regular edit route still rejects order changes.
- Added the small footer credit **Desenvolvido por Developer Bicho**. It remains
  an honest disabled anchor with `Contato em breve` until a public HTTPS profile
  or Discord invite is supplied through `DEVELOPER_CREDIT_URL`; a Discord
  webhook must never be used as the public destination.
- Browser QA on 2026-08-01 passed at 1440x900 and 390x844: four shelves render
  exactly three current cards each, rows 1-2 stay in section 2, rows 3-4 stay in
  section 3, one row can advance and return without moving the other three,
  desktop/mobile product dialogs open and close with Escape, scroll locking is
  restored on close, and neither storefront nor admin organizer introduces
  document-level horizontal overflow. The demo organizer reorders locally and
  keeps persistence disabled. Lint, strict TypeScript, 17 tests and the
  production build also pass.
- Simplified first-admin activation for the Supabase Dashboard workflow. The
  provisioning command now promotes an existing confirmed Auth user by e-mail,
  preserves its password and provider metadata, and remains idempotent when the
  account is already an admin. Password-strength rules stay on account creation;
  the login form no longer rejects an otherwise valid existing password based
  on its length.
- Added `GUIA_ADMIN_MAYCON.md`, a plain-language operating manual focused only
  on the 6DNX catalog panel: login, the five editing stages, safe image upload,
  publication states, history recovery, protected fields and a pre-save
  checklist for a non-technical owner.
- Fixed public rendering of thumbnails uploaded by the admin panel. The Next.js
  image optimizer now derives the configured Supabase host at build time and
  allows only the public `product-assets` bucket path; the product mutation
  validator enforces the same origin and path contract. The FiveM upload was
  verified through the optimizer and in desktop/mobile catalog views.
- Added the unapplied
  `20260731090000_create_product_catalog_admin.sql` migration for catalog rows,
  immutable editorial keys, automatic revision snapshots, RLS and the 5 MB
  `product-assets` bucket. Product deletion is intentionally unavailable;
  archive and restore own the reversible workflow.
- Connected the public catalog, test checkout and safe Discord redirect to the
  published Supabase catalog. `lib/products.ts` is used only before Supabase is
  configured and during the controlled initial import; after configuration,
  remote errors or invalid/empty data fail closed instead of resurrecting the
  static catalog.
- Hardened the initial import against silent data loss: all 60 current products
  now pass the same validator used by future panel saves before any batch is
  sent to Supabase.
- Added `scripts/create-admin.mjs` and `docs/ADMIN.md`. No account was created,
  no migration was applied and no secret was written to source; those remain
  explicit human-controlled activation steps.
- Revalidated the admin pass with ESLint, strict TypeScript and a production
  Next build. Desktop QA at 1440x900 and mobile QA at 390x844 passed without
  document-level horizontal overflow; the production build returns 404 for
  `/admin/demo`, 401 for an anonymous admin session, and the public catalog
  rendered the then-current three-card entry page. The runtime
  dependency audit is clean; nine high findings remain confined to the ESLint
  development toolchain and require incompatible dependency changes.
- Added `docs/CODEX.md` as the mandatory startup protocol for every new chat.
  It defines the canonical reading order, task-specific context routes,
  read-only Git inspection, impact reporting, secret boundaries, validation,
  and handoff requirements before an agent may modify the project.
- Replaced the active video experiment with a reversible static cinematic hero.
  `hero-apocalypse.jpg` fills one natural viewport;
  `killa-casal-hero.png` and `anjo-frame-03-ivory-v2.webp` are independently
  bottom-anchored, scaled nearly to the top and hidden at the feet by the lower
  smoke bank. The former MP4 and prior logo assets remain in `public/` for a
  future manual rollback but are not mounted or downloaded by the page.
- Made the hero framing responsive to both viewport width and safe viewport
  height instead of stopping the actors and logo at fixed desktop pixel caps.
  The same composition now scales through low-height notebooks, common desktop,
  QHD, 4K and ultrawide screens while keeping the copy and CTA inside the first
  viewport. The product section and its independent actors were not changed.
- Restored hero-only fine-pointer reactions without changing the product scene:
  each actor now moves through a nested request-animation-frame-bounded parallax
  layer, receives a localized highlight, and emits a slightly extended beam
  from its chest toward the cursor. The blood-red contour is thinner, while the
  copy and CTA sit on a higher content layer with tighter spacing and stronger
  contrast. All hero pointer effects remain off for reduced motion and coarse
  pointers.
- Replaced every desktop and mobile product video embed with the existing
  branded `ProductMediaPreview`. It displays the product thumbnail, miniature
  angel and explicit "Demonstração em preparação" copy instead of contacting
  YouTube or leaving a broken player. Existing `youtubeId` and orientation data
  stay stored but are not rendered, keeping later reactivation reversible.
- Restored `public/anjo1-premium.webp`, the shared transparent angel used by
  product cards, the branded media preview and the checkout atmosphere. The
  restored binary was verified against the last tracked good version before
  publication; unrelated legacy angel files remain outside the release.
- Activated `logo-asas-optimized.webp` as the hero brand. Its transparent WebP
  copy preserves the original PNG while reducing the transfer source from
  2.71 MB to 435 KB. A crimson underglow improves separation, the existing
  fine-pointer tilt remains on the inner artwork, and scroll expansion remains
  on the outer shell so both effects compose cleanly.
- Restored the broad circular Sharingan beneath the logo and the existing
  scan/ocular effects. The hero background, actors, logo and eye share one
  reversible scroll timeline; hero actors crossfade away before the untouched
  product-section characters enter.
- Replaced the hard hero/products boundary with a broad, pointer-transparent
  smoke dissolve. Overlapping radial and vertical gradients hide the actor feet
  and meet the existing section-two background without a one-pixel divider.
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
  opening information on the left and the 6DNX media preview on the right;
  closing restores the
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
- Made the daily cron honest: collection is not reported as successful when
  Supabase persistence fails. The endpoint returns a failing status so Vercel
  Cron can expose the incident instead of showing a false green run.
- Verified one complete DayZ/spow Pix laboratory order in the production
  preview. The UI confirmed one TEST-marked message delivered to Discord.
- Verified the protected cron locally: 25 items (five each from OpenAI, Google
  AI, DayZ/Steam, ARC Raiders/Steam, and Counter-Strike 2/Steam). Collection
  passed; persistence returned 404 because the pending migration is absent.
- Overrode Next's vulnerable transitive PostCSS/Sharp versions with currently
  patched releases and rebuilt successfully. `npm audit --omit=dev` is clean,
  and all 378 installed packages have verified registry signatures.
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
- Expanded the executable storefront to 40 distinct base cards. The former DayZ
  umbrella card was separated into Spow, Moonwalk, Private, GG, Rage, Shadow
  and Elisyum; only duration or license remains inside each card as a price
  variation. The eight imported entries that had lost their documented plans
  now carry the exact reference values present in
  `docs/Produtos_Organizados.md`. All 40 runtime slugs are unique and every card
  has at least one variation. Each shelf renders three cards, always starts at
  its first page, preserves the angel/art/hover composition for every item, and
  keeps the information-left/card-center/media-preview-right interaction intact.
- The former hard-coded DayZ/CS/Arena and Tarkov/Rust/PUBG landing anchors were
  superseded by the owner-managed canonical order. No product identity is now
  structurally pinned; the layout validates duplicate identifiers and total
  product preservation before rendering.
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
- Removed the inherited **Download Manager** and **Instalar Drivers** links from
  every product detail surface. The public CTA now starts an honest manual
  order in Discord after the user selects a variation; it does not claim that
  StorM charged the customer and does not expose the R$ 1 laboratory on the
  storefront.
- Made the configured Supabase catalog fail closed: database/network/validation
  failures now render a catalog-unavailable support state instead of reviving
  archived products from `lib/products.ts`. The static source remains available
  only before Supabase is configured and for the controlled initial import.
- Hardened admin mutations and image upload. Mutations require the exact page
  origin. Uploads are streamed with a 5 MB bound, verify JPG/PNG/WEBP/AVIF magic
  bytes, and store only a detected matching MIME. The news cron now fails its
  run if persistence fails instead of reporting a false green result.
- Added focused security regression tests, a pinned GitHub Actions quality
  workflow, Dependabot and CODEOWNERS. `docs/GUIA_ADMIN_MAYCON.md` now explains
  manual versus automatic sales, closing public signup, MFA boundaries and
  safe everyday operation in nontechnical language.
- Made the payment laboratory impossible to enable in Vercel Production even
  if `PAYMENT_TEST_MODE=true` is entered by mistake. Preview still requires
  that explicit value; local development remains the only default-on context.
- Rechecked `.env.local` by variable name only after the owner cleanup: no
  bootstrap/admin login or password variable remains, no duplicate variable
  name exists, and no secret value was printed.
- Implemented the fail-closed StorM PIX foundation without making a provider
  call: cinematic desktop/mobile modal, CPF checksum/masking, same-origin
  bounded APIs, server-authoritative offers, idempotent order creation, bounded
  StorM client, token-protected polling and raw-body HMAC webhook processing.
  Polling can only report `confirming`; the transactional signed webhook is the
  sole path that can mark an order `paid` and trigger a CPF-free Discord alert.
  Enquanto a trava estiver fechada, o modal não mostra campos pessoais; ele
  explica a homologação e mantém apenas o caminho de suporte.
- Added `20260801100000_create_storm_commerce.sql`. It creates RLS-protected
  offers/orders/attempts/events and imports every existing reference value as
  `draft`, never as an approved charge. Added security regression tests and
  `STORM_PIX_CHECKOUT.md`; lint, strict TypeScript, all tests and the production
  build pass. Browser QA at 1440x900 and 390x844 confirms the fail-closed modal
  stays legible, requests no personal data, has no horizontal overflow, focuses
  its close control, closes with Escape and restores focus to `Comprar com PIX`.
  No migration, charge, deploy, commit or push was executed.
- Added the additive migration
  `20260801143000_add_catalog_ordering.sql`. It removes the obsolete fixed-card
  constraint and adds an admin-only, transaction-locked RPC that rejects
  incomplete, duplicate, stale or non-published order lists before changing any
  position. It was applied and recorded on 2026-08-03 after rollback-only
  validation proved atomicity and idempotency against the live catalog.
- Corrected the checkout artwork contract. Each product can now have an
  optional dedicated **4:5** banner (`1200 x 1500 px` recommended) uploaded from
  the admin panel. Without that banner, the existing 16:9 card thumbnail is
  shown whole over an atmospheric background instead of being stretched or
  cropped into the portrait column. The additive migration
  `20260801170000_add_checkout_banner.sql` is prepared but was not applied.
- Reconnected the local-only R$ 1,00 payment laboratory to the locked checkout
  modal. In local development it is exposed as an explicitly labelled
  simulation; Vercel Preview still requires `PAYMENT_TEST_MODE=true`, and
  Vercel Production can never expose it.
- Revalidated the live StorM configuration without creating a payment. The API
  key authenticated successfully, but the provider account reported
  `webhookConfigured=false`. The configured Supabase project returned
  `PGRST205` for `commerce_offers`, confirming that the commerce migration is
  still absent. `STORM_WALLET_CHECKOUT_ENABLED`,
  `STORM_WALLET_PRODUCTION_APPROVED` and `CHECKOUT_DATA_HASH_SECRET` are also
  absent locally. The fail-closed screen is therefore the correct current
  behavior; no paid event can yet be proven or forwarded to Discord.
- Maycon acquired `6dnx.com.br`. This is a business/domain milestone only: DNS,
  Vercel domain assignment, TLS and canonical URL behavior have not yet been
  verified. Keep `https://6dnx.vercel.app` as the runtime URL until that
  checklist passes, then promote `https://6dnx.com.br` deliberately.
- Browser QA found that the local `DEVELOPER_CREDIT_URL` had been filled with a
  Discord webhook instead of a public profile/invite. The public-link resolver
  now fails closed for HTTP destinations and every `/api/webhooks/` or
  `/api/vN/webhooks/` path, so the storefront renders the credit as disabled
  instead of leaking the credential. The already exposed Discord webhook must
  still be rotated by its owner; its value was not copied into this document.
- Final local validation for this checkpoint passed: ESLint, strict TypeScript,
  all 18 Node tests and the Next.js 16.2.12 production build. Browser review
  confirmed the banner manager at desktop and 390 x 844, no page-level
  horizontal overflow, the disabled public credit after webhook rejection and
  a valid ephemeral R$ 1,00 laboratory session. Home and `/admin/demo` both
  returned HTTP 200 after the build.

## Pending human or business input

- Approve the new static hero composition after desktop and mobile visual
  review. The retained MP4 is rollback material only and is not loaded by the
  active storefront.
- Decide later which official product videos may return. Until that approval,
  every popup uses the designed media preview and no YouTube player is mounted.
- The stored `Custom Steam Profile` video ID remains data-only; its former
  portrait embed is intentionally inactive.
- Confirm or replace each displayed reference price before enabling real
  commerce.
- The owner reports that the original batch action was already executed in the
  Supabase-backed panel and that `Rust20` was then archived successfully. This
  report confirms the reversible archive flow but was not performed by Codex;
  the revised control now defaults to one card and does not remove existing
  copies.
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
- The local branch is `main`; merge `78c3fa7` preserves both local and remote
  histories without a force-push. `carloshg-dev` is an accepted collaborator,
  but the current hardening work remains intentionally uncommitted for human
  review.
- Confirm StorM Wallet provides a sandbox or an official homologation procedure
  before enabling real payments. The current R$ 1,00 laboratory must never be
  presented as a real charge.
- The commerce migration is applied and every imported offer was confirmed as
  `draft`. Still generate an independent `CHECKOUT_DATA_HASH_SECRET` and
  approve only one human-reviewed test offer after provider homologation.
- `20260801143000_add_catalog_ordering.sql` is applied and recorded in
  Production; **Organizar vitrine** now has the database RPC required for
  persistence. Keep future order changes inside the dedicated admin route.
- Review and apply `20260801170000_add_checkout_banner.sql` after the catalog
  migrations before saving a dedicated checkout banner in the production
  panel. Existing thumbnails continue to work before it is applied.
- The three StorM credentials are populated in Vercel Production and the
  backend webhook is published. The activation/hash variables remain absent.
  Complete official signature/idempotency homologation before adding the hash
  secret or enabling either flag. The provider callback must never point to
  Discord.
- Follow `COMMERCE_ARCHITECTURE.md`: Supabase is the order source of truth,
  signed provider webhooks confirm payment, and Discord is
  notification/support, never proof of payment.
- The domain and TLS are active, with apex redirecting to `www`; the StorM
  callback now uses `www`. Keep the current `NEXT_PUBLIC_SITE_URL` decision
  until metadata/OAuth canonicalization is reviewed separately.
- Rotate the Discord webhook that was mistakenly stored in
  `DEVELOPER_CREDIT_URL`, then leave that variable empty or replace it with a
  real public HTTPS profile/invite. A webhook is a write credential and must
  never be used as a clickable footer address.
- Supabase **Allow new users to sign up** was disabled by the owner on
  2026-07-31. Manual linking and anonymous sign-in were also shown disabled;
  existing confirmed administrator accounts remain able to sign in.
- Enable MFA on the Supabase dashboard account immediately with a backup TOTP
  factor. Application-level MFA for `/admin` remains staged work: enrollment,
  challenge, recovery and `aal2` enforcement must be tested with a spare admin
  before becoming mandatory.
- The requested `i-have-adhd` plugin was not exposed by the safe plugin manager;
  project continuity is currently provided by `AGENTS.md` and this file.

## Safety status

### 2026-08-09 — Storefront navigation and editable presentation copy (isolated)

- The work remains isolated on `codex/storefront-navigation-content`; no
  commit, push, deployment, or database migration has been performed.
- The retained global `6 D N X` pager is reversibly hidden behind
  `SHOW_GLOBAL_PRODUCT_PAGER = false`; its markup and behavior were not
  deleted. Per-row arrows and adjacent-card previews now have stronger
  contrast, glow, and fine-pointer feedback while reduced-motion remains
  respected.
- A fixed, translucent white navigation bar now links to the existing Home,
  Products, News, Account, and `/slot` destinations. Google and Discord retain
  their existing authentication flows with provider-specific presentation.
- Hero and catalog presentation copy can be edited from `/admin/conteudo`.
  The public storefront fails safely to versioned defaults while
  `storefront_content` is absent; the admin editor stays read-only and explains
  that the migration is pending.
- `20260809120000_add_storefront_content_admin.sql` creates the singleton
  content row, revisions, optimistic concurrency, and least-privilege RLS. It
  is versioned for review only and **has not been applied**.
- Footer copyright and developer credit now render in white. The obsolete
  `Contato em breve` fallback was removed; the credit continues resolving the
  validated server-side `DEVELOPER_CREDIT_URL` first. Checkout, commerce
  offers, organizer behavior, StorM, and payment flags were not changed in
  this work.

### 2026-08-09 — Account resilience and Slot visual laboratory (isolated)

- `/api/account` now treats loyalty as best-effort: user orders remain the
  mandatory response, while an absent `loyalty_balances` relation (`42P01` or
  PostgREST `PGRST205`) returns `balance: null` and a `preparing` status rather
  than collapsing the complete account route. It does not invent a zero
  balance and does not create or apply the future loyalty schema.
- `/conta` was redesigned as a responsive player center with identity,
  confirmed-purchase metrics, benefit journey, order history, explicit
  anonymous/error states, and clear loyalty readiness. Purchases remain
  possible without authentication; only future account-linked benefits use
  the signed-in identity.
- Storefront, account, and Slot navigation now expose a visible `Suporte`
  action. It opens the existing server-side `/api/redirect`, which validates
  `DISCORD_INVITE_URL` and never exposes or reuses a Discord webhook.
- `/slot` is now one focused hero instead of a long presentation page. The
  top navigation and hero CTAs open accessible in-place dialogs for the
  centered cabin and for clear rules; Escape, backdrop, and close-button
  dismissal preserve the page position and lock background scroll.
- The supplied `slot-mascote.png` and `slot-modelos-mascote.png` remain as
  immutable visual references. Runtime presentation now uses four individually
  cut, transparent dragon assets (`dragon-*-v2.png`), so the mascot is no
  longer trapped inside a white rectangular sheet. The transparent dragon
  leads the hero, appears in account surfaces, and reacts inside the cabin in
  idle, anticipation, and celebration states. `slot-layout.png` remains a
  design reference in `public/slot` but is deliberately not downloaded at
  runtime.
- The cabin remains explicitly marked `PRÉVIA VISUAL` and `SEM PRÊMIO`: it
  does not call a spin endpoint, mutate balance, consume coins, select a
  random outcome, or deliver a reward.
- The future real Slot remains gated by authentication, an immutable ledger,
  server-side outcome, idempotency, provably-fair evidence, daily limits, and
  separate human authorization. No loyalty/Slot migration, runtime endpoint,
  commit, push, or deployment was performed in this checkpoint.

### 2026-08-09 — DeepSeek account/Slot audit reconciliation

- DeepSeek completed a read-only contract audit on isolated branch
  `deepseek/account-slot-contract`, based on older `origin/main` commit
  `0924c94`. Its two artifacts remain isolated and were not copied wholesale:
  the report correctly described that older snapshot, but its claims that
  `/api/account` was still coupled and that `/slot` did not exist are stale for
  the current storefront worktree.
- The useful contracts are now represented by green tests in
  `tests/account-slot-experience.test.mts`: anonymous access remains `401`,
  orders are mandatory, loyalty is best-effort and nullable, missing-relation
  codes `42P01`/`PGRST205` are recognized, and the Slot preview cannot call a
  spin endpoint or choose a random outcome in the browser.
- The proposed `PGRST204 -> []` fallback for order history was deliberately
  rejected. A missing `commerce_orders.user_id` column is a schema regression
  and must remain visible as an operational failure; returning an empty list
  would falsely tell a customer that no purchases exist. A present loyalty
  table with no row may legitimately mean a real zero balance, while a missing
  loyalty table continues to mean `null`/unavailable.
- Release integration must preserve the already isolated compatibility and
  payment-safety work (`ff82cac`, `06d9866`, `1faca6c`) before this visual
  storefront branch can be proposed for publication. No merge, migration,
  commit, push, or deployment was performed during this reconciliation.

### 2026-08-09 — PixiJS Slot vertical slice (isolated)

- The visual laboratory now uses `pixi.js@8.19.0` only after the centered
  cabin dialog is opened. The homepage, checkout and admin do not import or
  mount the WebGL canvas; no Unity or Spine runtime was added.
- `components/slot-pixi-stage.tsx` owns a code-native PixiJS scene with four
  masked columns identified by `6 D N X`, deterministic symbol rows, paylines,
  lighting, particles and transparent mascot reactions. The principal dragon
  floats and breathes continuously without a rectangular panel, while a second
  ambient cutout appears behind the reels and changes motion and visibility as
  anticipation and celebration progress. Each column now accelerates smoothly and stops on its own
  staggered schedule instead of snapping all columns at once. Movement uses
  Pixi ticker delta time, the renderer is limited to 60 FPS, reduced motion is
  honored, and render resolution remains capped at 1.6 DPR.
- `×2` and `+1` exist only as clearly labeled visual concepts in this preview;
  they have no multiplier, free-spin, balance or prize effect. No fabricated
  near-miss, false win message or deceptive odds behavior was introduced.
- Three bounded sound cues derived from the owner-supplied files are now tied
  to the same deterministic preview timeline: a button cue, one cue for each
  sequential reel stop, and a short celebration chime. Playback can begin only
  from the explicit `VER ANIMAÇÃO` user gesture, has a visible sound toggle,
  uses moderate volume, and is stopped/cleaned when the cabin closes. The
  supplied jackpot and coin-payout recordings are deliberately not referenced,
  because this laboratory has no payout or prize to announce.
- The first DeepSeek PixiJS performance audit was reconciled selectively. The
  four WebGL blur filters now use one bounded pass, coarse-pointer devices turn
  off antialiasing, cap resolution at 1.35 DPR and request low-power GPU mode,
  while desktop retains the 1.6 DPR/high-performance profile. Partial Pixi
  initialization failures now destroy the in-progress application instead of
  leaking a renderer. Responsive scene composition, asset atlasing/WebP and
  multi-session performance profiling remain future optimization work; they
  are not required to preserve the current deterministic preview contract.
- The demonstration remains intentionally non-commercial: it contains no
  `fetch`, no `/api/slot` call, no `Math.random`, no balance mutation and no
  reward decision. The visible result rows are fixed presentation fixtures;
  a future real outcome must come exclusively from the authenticated server.
- Browser QA caught and fixed a DOM ownership regression in the first draft:
  Pixi had replaced React's loading node before React removed it. React now
  retains its own nodes while Pixi appends and removes only its canvas. The
  cabin opens, animates, celebrates, closes and reopens without a new runtime
  error at desktop and at a 390 x 844 mobile viewport.
- Browser QA confirmed the staggered order `6 -> D -> N -> X`, the visible
  `Som ligado/desligado` control, and a clean interaction cycle. The complete
  46-test suite, ESLint, strict TypeScript and the
  27-route production build all pass. No commit, push, migration or deployment
  was performed for this vertical slice.

- The commerce migration and the webhook-only Production deployment were
  explicitly authorized and completed on 2026-08-02. No commit or push was
  executed; obtain fresh approval before either Git action or before enabling
  real payments.
- Every successful `main` push must be followed through the Vercel deployment
  until the production domain returns the new commit successfully.
- `.env.local` is ignored by Git and must remain secret.

### 2026-08-09 — Dual rewards administration (isolated, not released)

- The reward domain now models two independent closed wallets:
  `community` for **6DNX Coins** used in Discord missions/feedback/redemptions,
  and `slot` for the future Slot experience. They share an immutable audit
  infrastructure but never share or transfer balance.
- A new admin surface at `/admin/recompensas` searches registered users and
  shows both balances. Maycon can add/remove either balance, use the explicit
  `+10 · Compra + feedback` preset after human validation, or debit the
  documented community rewards (80/100/130/150 Coins). Every operation records
  the admin actor, reason, optional note, request UUID and before/after balance;
  retries reuse the same request UUID and cannot duplicate the adjustment.
- `20260809210000_add_dual_loyalty_wallets.sql` is versioned locally but **not
  applied in Production**. It depends on the still-pending fidelity migration, separates the
  balance primary key by wallet, adds admin-only RPCs, rejects negative
  balances and disables the legacy automatic purchase-credit trigger. The two
  migrations passed the isolated rollback/concurrency laboratory and must be
  applied in order during a separately authorized, controlled checkout
  maintenance window; do not use a generic `db push`.
- The account endpoint and `/conta` can present both balances while preserving
  the legacy Slot balance alias. Missing reward schema remains fail-soft; order
  history stays mandatory. Checkout, StorM, paid-order state and the Slot engine
  were not changed or enabled.
- Purchase + feedback remains a human-validated `+10` community action because
  no trustworthy feedback-proof integration exists yet. No automatic reward
  emission, migration application, commit, push or deployment occurred in this
  checkpoint.

### 2026-08-09 — Aline pilot identity and safe rollout boundary

- The signed-in Aline account was resolved to exactly one `auth.users` UUID in
  Production. Future reward operations must use that UUID, never a display
  name or e-mail match. The full UUID and e-mail are deliberately not copied to
  documentation, logs or browser code.
- Production still does not expose the pending loyalty schema through
  PostgREST. Therefore no Slot coin or 6DNX Coin was credited during this
  checkpoint. Aline is the selected pilot only after the migrations pass the
  controlled database gate and the admin can confirm both independent balances.
- The fidelity base migration no longer creates the unapproved automatic
  paid-order credit trigger. The dual-wallet migration also defaults to manual,
  audited adjustments. Applying either migration with a generic `db push`
  remains forbidden because older pending migrations could be included.

### 2026-08-09 — Safe Visual Studio (isolated, not released)

- `/admin/estudio` is a new organized editing surface for the approved home,
  account and Slot text fields, page color tokens, local font presets and a
  maximum of two bounded particle families. It provides local preview, saved
  draft, explicit publish confirmation and revision restore without accepting
  arbitrary CSS, HTML, scripts, URLs, particle counts or client code.
- `20260809220000_add_site_experience_studio.sql` keeps public published
  configuration, admin-only drafts and admin-only revisions in separate
  tables. Public RLS can never reveal drafts or actor UUIDs. Publish and restore
  require an authenticated admin session with AAL2, exact revision locking and
  one atomic RPC. The migration does not read or write `product_catalog`,
  checkout, commerce orders, StorM, reward wallets or the Slot outcome engine.
- Public rendering uses a versioned validator and safe defaults. A missing or
  unapplied Studio schema leaves the current site copy/theme intact. Effects
  are deterministic and bounded to 24 nodes on desktop, 10 on narrow screens
  and zero animation under `prefers-reduced-motion`.
- Automated gates passed after integration: 76/76 tests, ESLint, strict
  TypeScript and the 33-route production build. Browser verification on the
  isolated dev server confirmed the real 21-product Supabase catalog, safe
  anonymous `/conta`, the Pixi cabin with one canvas and no error overlay, and
  `/admin/estudio` redirecting an anonymous session to the protected login.
- No migration, reward credit, commit, push or deployment was performed. The
  next irreversible step is a separate human-approved, migration-specific
  rollout with rollback evidence; application publication remains a later and
  separate authorization.

### 2026-08-09 — Fidelity, dual wallets and Studio database laboratory

- The pending migrations `20260806100000_add_user_fidelity.sql`,
  `20260809210000_add_dual_loyalty_wallets.sql` and
  `20260809220000_add_site_experience_studio.sql` were validated against the
  official Supabase PostgreSQL 17.6 image in a disposable local container.
  They remain **not applied in Production**; no remote DDL, reward credit,
  checkout mutation or deployment occurred.
- Four release blockers were corrected in the versioned SQL: composed-row
  retry now uses `SELECT ... INTO`, wallet upserts target the named primary-key
  constraint, `service_role` receives explicit read privilege without client
  DML, and the fidelity base migration no longer creates the unapproved
  automatic paid-order credit trigger. Defensive drops also remove that legacy
  trigger/function pair if a drifted database contains them.
- Fidelity and dual-wallet rollback probes passed idempotent retry, AAL2 admin
  authorization, AAL1 and ordinary-user denial, independent `slot` and
  `community` balances, non-negative balance enforcement, audit visibility,
  absence of automatic purchase credit and unchanged fingerprints for
  `product_catalog`, `commerce_orders` and `commerce_offers`.
- Real multi-session probes passed: two calls with the same request UUID apply
  only once; independent concurrent credits serialize without lost updates;
  competing debits cannot make the balance negative. The Studio similarly
  accepts only one concurrent draft save/publish and rejects the stale session
  with a revision conflict rather than overwriting newer work.
- The Studio database validator now matches the TypeScript boundary for the
  48-KiB document ceiling, per-field limits, exact effect keys, dangerous or
  invisible text rejection and WCAG contrast thresholds. Public reads expose
  only the published singleton; drafts/revisions remain private and the
  migration leaves catalog and commerce fingerprints unchanged.
- Administrative authority remains claim-based
  (`app_metadata.role = admin`) plus AAL2 for financial adjustments and Studio
  publication. The operational e-mail is deliberately not hardcoded, and the
  shared account's audit identity remains its single authenticated UUID.
