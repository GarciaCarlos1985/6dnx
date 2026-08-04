# 6DNX commerce architecture

> **Context synchronized on 2026-08-03.** The professional flow was exercised
> with one owner-authorized real R$ 1.00 PIX. Creation, provider settlement,
> callback delivery, raw-body HMAC and the Supabase RPC call worked. The live
> RPC then failed with PostgreSQL `42702`/HTTP `422` because
> `ON CONFLICT (order_id)` is ambiguous. The fix is already applied, and StorM
> support later confirmed callbacks are not replayed. An authenticated,
> exact-match reconciliation fallback is implemented and locally validated but
> remains unapplied/unpublished. Payment creation is still disabled.

This document defines the professional purchase flow. The R$ 1,00 simulator
remains an isolated laboratory. A real StorM implementation now exists behind
database approval and explicit environment kill switches; it must not be
treated as active until the checklist in `STORM_PIX_CHECKOUT.md` passes.

## Current StorM boundary — 2026-08-02

`POST /api/checkout`, `POST /api/checkout/status` and
`POST /api/webhooks/storm-wallet` are implemented and compile. The backend uses
an exact provider-host allowlist, idempotent external IDs, bounded payloads,
minimal CPF persistence and transactional webhook processing.

Branch `codex/storm-server-reconciliation` additionally contains immediate
server-side reconciliation in `/api/checkout/status`, a bounded daily
`GET /api/cron/storm-reconciliation`, separate reconciliation evidence and a
versioned webhook RPC. These additions are locally validated but not yet
applied or deployed.

Enquanto as travas estão desligadas, o modal mostra apenas o estado de
homologação e o contato de suporte: nome e CPF não aparecem como campos até o
backend estar efetivamente apto a criar cobranças.

This does **not** mean payments are active in Production. The Supabase migration
is applied, the webhook and hash secrets are scoped to Production, and both
activation flags remain absent there. The owner-authorized `Rust1 / 1 Dia`
offer was temporarily approved for 100 cents, generated one real paid provider
charge and is now `suspended`. The order remains `pending_payment` only because
the live RPC failed; it must not be manually marked `paid`.

The Wallet callback must never point directly to Discord. After the route is
deployed and homologated, its destination is the 6DNX backend, which verifies
the HMAC signature over the raw body, persists an idempotent event and only then
sends a sanitized staff notification.

## Customer journey

1. The customer opens a product card and compares its description, video,
   current status, variations, price, and support conditions.
2. The customer selects exactly one variation. The server creates an order
   draft using the canonical catalog price; the browser never supplies the
   amount that will be charged.
3. A single-page checkout requests only the minimum buyer data required by the
   payment provider and fulfillment. StorM Wallet handles Pix server-to-server;
   card data, if cards are added later, must be tokenized by its provider and
   must never reach 6DNX servers.
4. Pix displays the StorM Wallet QR Code and copy-and-paste code. A future card
   provider can stay in the same visual flow. Both show pending, approved,
   rejected, or expired states without making the customer restart the purchase.
5. Payment approval requires provider proof obtained server-to-server: either
   a raw-body HMAC-verified webhook or an authenticated lookup of the existing
   payment with exact provider ID, external ID and amount. Redirect pages,
   screenshots and browser messages are never sufficient proof.
6. After approval, the backend records the paid order and sends one concise
   staff notification. Supabase remains the canonical financial record.
7. The confirmation page displays the official Discord destination and the
   order reference. Staff checks the paid state in the backend before releasing
   the product manually through the private Discord support flow.

The website never hosts, uploads, downloads, or automatically releases product
files. Discord is the assisted fulfillment channel after payment, not the
financial source of truth.

## Order state machine

```text
draft
  -> pending_payment
  -> paid
  -> awaiting_discord_fulfillment
  -> delivered_manually

pending_payment -> expired | cancelled
paid -> refunded | disputed
```

Ticket states are independent: `open`, `waiting_staff`, `waiting_customer`, and
`resolved`. A ticket must never be treated as proof of payment.

## Canonical data

- `product_catalog`: editorial catalog, status and reference values;
- `commerce_offers`: approved server-side price per product variation;
- `commerce_orders`: immutable commercial snapshot and minimum payer data;
- `commerce_payment_attempts`: provider ID, amount state and timestamps;
- `commerce_webhook_events`: unique event digest and idempotent result;
- `commerce_reconciliation_events`: idempotent evidence from authenticated
  provider-status lookups, kept distinct from signed callback evidence;
- `tickets` and `ticket_messages`: support history;
- `fulfillment_events`: who released manually, delivered, cancelled, or
  refunded.

Discord is a notification and support surface. It is not the order database.

## Security invariants

- Prices and product availability are validated server-side.
- Every provider request and webhook event has an idempotency key.
- Webhook signatures are verified before reading or changing an order.
- Raw card data, CVV, documents, access tokens, and database secrets are never
  logged or sent to Discord.
- Browser Supabase access uses only the publishable key plus RLS.
- Server writes use server-only credentials.
- Payment, fulfillment, refund, and ticket actions keep an audit trail.
- No executable, token, archive, or download URL is stored in the public
  frontend, emitted in a webhook notification, or released by browser state.
- Production checkout cannot be enabled until prices, videos, refund rules,
  privacy copy, and provider credentials have been approved.

## Recommended implementation phases

1. **Laboratory** — R$ 1,00 simulator and TEST-marked Discord message.
2. **Foundation** — implemented routes, modal, migration and automated security
   tests; Production remains disabled and one local-test offer is approved.
3. **Provider sandbox** — StorM sandbox credentials when available, signed
   webhook and Supabase tables. Never use a live key in Preview.
4. **Private preview** — owner validates every state, mobile UX, refunds and
   ticket handling with no real customer.
5. **Production** — approved prices, legal pages, monitoring, backups and both
   manual activation switches.
