# 6DNX commerce architecture

This document defines the intended professional purchase flow. The current
checkout remains a laboratory and must not be presented as a real charge.

## Customer journey

1. The customer opens a product card and compares its description, video,
   current status, variations, price, and support conditions.
2. The customer selects exactly one variation. The server creates an order
   draft using the canonical catalog price; the browser never supplies the
   amount that will be charged.
3. A single-page checkout requests only the minimum buyer data required by the
   payment provider and fulfillment. Card data is tokenized by Mercado Pago and
   never reaches 6DNX servers.
4. Pix displays a QR Code and copy-and-paste code. Card checkout stays in the
   same visual flow. Both show pending, approved, rejected, or expired states
   without making the customer restart the purchase.
5. A signed Mercado Pago webhook is the source of truth for payment approval.
   Redirect pages and browser messages are never sufficient proof of payment.
6. After approval, the order is queued for fulfillment and one support ticket
   is created. Discord receives a concise notification, while Supabase remains
   the canonical record.
7. The customer receives a private order-status URL and can follow payment,
   fulfillment, delivery, or support without repeating the purchase.

## Order state machine

```text
draft
  -> pending_payment
  -> paid
  -> awaiting_fulfillment
  -> delivered

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
- `fulfillment_events`: who released, delivered, cancelled, or refunded.

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
- Production checkout cannot be enabled until prices, videos, refund rules,
  privacy copy, and provider credentials have been approved.

## Recommended implementation phases

1. **Laboratory** — current R$ 1,00 simulator and TEST-marked Discord message.
2. **Provider sandbox** — Mercado Pago test credentials, test Pix/card, signed
   webhook, and Supabase order tables.
3. **Private preview** — owner validates every state, mobile UX, refunds, and
   ticket handling with no real customer.
4. **Production** — production credentials, real catalog prices, legal pages,
   monitoring, backups, and a manual kill switch.
