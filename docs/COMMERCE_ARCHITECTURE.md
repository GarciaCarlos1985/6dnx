# 6DNX commerce architecture

This document defines the intended professional purchase flow. The current
checkout remains a laboratory and must not be presented as a real charge.

## Current StorM boundary — 2026-07-31

The three server-only environment names are present locally and in Vercel, but
no application route consumes them and `/api/webhooks/storm-wallet` does not
exist yet. The credentials are therefore configuration material, not an active
payment integration.

The Wallet provider callback must never point directly to a Discord webhook.
The future callback is the 6DNX backend route, which verifies the HMAC signature
over the raw request body, persists an idempotent event and only then sends a
sanitized staff notification to Discord. Do not configure that future URL
until the route is deployed and tested against an official sandbox contract.

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
5. A signed provider webhook is the source of truth for payment approval. For
   StorM Wallet, the raw request body must be verified against
   `X-Storm-Signature` before processing. Redirect pages and browser messages
   are never sufficient proof of payment.
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

- `products` and `product_variants`: approved catalog, price, status, and video;
- `customers`: minimum contact data and optional Discord identity;
- `orders` and `order_items`: immutable commercial snapshot at purchase time;
- `payment_attempts`: provider ID, method, amount, status, and timestamps;
- `webhook_events`: unique provider event ID and idempotent processing result;
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

1. **Laboratory** — current R$ 1,00 simulator and TEST-marked Discord message.
2. **Provider sandbox** — StorM Wallet sandbox credentials when available,
   test Pix, signed webhook, and Supabase order tables. Never use a live key in
   Preview.
3. **Private preview** — owner validates every state, mobile UX, refunds, and
   ticket handling with no real customer.
4. **Production** — production credentials, real catalog prices, legal pages,
   monitoring, backups, and a manual kill switch.
