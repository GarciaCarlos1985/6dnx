# Vercel environment map

The first block of `.env.local` contains the variable names intended for
Vercel. The file itself is ignored by Git and must never be committed.

## Configure now

| Variable | Production | Preview | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | required | required | Use each deployed HTTPS origin, never localhost. |
| `CRON_SECRET` | required | required | Independent 64-character random secret; not a GitHub token. |
| `DISCORD_INVITE_URL` | required | required | Public support invite. |
| `DISCORD_WEBHOOK_URL` | required | required | Server-only fallback webhook. |
| `DISCORD_TICKET_WEBHOOK_URL` | required | required | Dedicated TICKET webhook; currently mirrors the working webhook. |
| `SUPABASE_URL` | required | required | Project API URL. |
| `SUPABASE_SECRET_KEY` | required | required | Server-only; never prefix with `NEXT_PUBLIC_`. |

## Prepared for browser auth and real checkout

| Variable | Production | Preview | Current status |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | future | future | Already prepared. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | future | future | Already prepared; RLS is mandatory before use. |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | later | test key | Pending Mercado Pago application. |
| `MERCADO_PAGO_ACCESS_TOKEN` | later | test token | Pending; server-only. |
| `MERCADO_PAGO_WEBHOOK_SECRET` | later | test secret | Pending; server-only. |
| `PAYMENT_TEST_MODE` | false/absent | `true` | Never enable the internal simulator in Production. |

The optional Discord bot variables are necessary only if each paid order should
create its own private Discord channel. The current webhook-based TICKET flow
does not need them.

## Never copy to Vercel runtime

- `VERCEL_TOKEN`: local CLI credential;
- `SUPABASE_DB_URL`: direct migration/tooling connection;
- `SUPABASE_JWKS_URL`: derived tooling metadata;
- `SUPABASE_SERVICE_ROLE_KEY`: legacy fallback, unnecessary while the new
  `SUPABASE_SECRET_KEY` is configured;
- any GitHub personal access token.

After the repository is connected, add the variables in Vercel Project
Settings and choose the scopes explicitly. Do not paste the whole `.env.local`
into logs, issues, chat, or source control.
