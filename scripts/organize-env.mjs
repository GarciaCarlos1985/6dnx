import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const envPath = resolve(".env.local");
const original = await readFile(envPath, "utf8");
const entries = new Map();

for (const line of original.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (match) entries.set(match[1], match[2]);
}

const managedKeys = new Set([
  "NEXT_PUBLIC_SITE_URL",
  "CRON_SECRET",
  "DISCORD_INVITE_URL",
  "DISCORD_WEBHOOK_URL",
  "DISCORD_TICKET_WEBHOOK_URL",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "DISCORD_BOT_TOKEN",
  "DISCORD_GUILD_ID",
  "DISCORD_TICKET_CATEGORY_ID",
  "DISCORD_SUPPORT_ROLE_ID",
  "PAYMENT_TEST_MODE",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWKS_URL",
  "SUPABASE_DB_URL",
  "VERCEL_TOKEN",
]);

function raw(name, fallback = "") {
  return entries.get(name) ?? fallback;
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

const previousCronSecret = unquote(raw("CRON_SECRET"));
const cronWasGithubToken =
  /^(?:github_pat_|gh[pousr]_)/i.test(previousCronSecret);
const needsCronSecret = !previousCronSecret || cronWasGithubToken;
const cronSecret = needsCronSecret
  ? randomBytes(32).toString("hex")
  : raw("CRON_SECRET");
const mainDiscordWebhook = raw("DISCORD_WEBHOOK_URL");
const ticketWebhook =
  unquote(raw("DISCORD_TICKET_WEBHOOK_URL"))
    ? raw("DISCORD_TICKET_WEBHOOK_URL")
    : mainDiscordWebhook;
const supabaseUrl = raw("SUPABASE_URL");
const supabasePublishable = raw("SUPABASE_PUBLISHABLE_KEY");

const lines = [
  "# ============================================================================",
  "# VERCEL — RUNTIME DO SITE (Production + Preview)",
  "# Copie este bloco para Project > Settings > Environment Variables.",
  "# Em NEXT_PUBLIC_SITE_URL, troque localhost pela URL definitiva da Vercel.",
  "# Nunca exponha CRON_SECRET, webhooks ou chaves secretas como NEXT_PUBLIC_*.",
  "# ============================================================================",
  `NEXT_PUBLIC_SITE_URL=${raw("NEXT_PUBLIC_SITE_URL")}`,
  `CRON_SECRET=${cronSecret}`,
  "",
  "# Discord — suporte e pedidos",
  `DISCORD_INVITE_URL=${raw("DISCORD_INVITE_URL")}`,
  `DISCORD_WEBHOOK_URL=${mainDiscordWebhook}`,
  `DISCORD_TICKET_WEBHOOK_URL=${ticketWebhook}`,
  "",
  "# Supabase — runtime server-side",
  `SUPABASE_URL=${supabaseUrl}`,
  `SUPABASE_SECRET_KEY=${raw("SUPABASE_SECRET_KEY")}`,
  "",
  "# Supabase — browser/auth futura (valores públicos, mas limitados por RLS)",
  `SUPABASE_PUBLISHABLE_KEY=${supabasePublishable}`,
  `NEXT_PUBLIC_SUPABASE_URL=${raw("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)}`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${raw(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    supabasePublishable,
  )}`,
  "",
  "# Checkout real futuro — Mercado Pago TESTE primeiro",
  `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=${raw(
    "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
  )}`,
  `MERCADO_PAGO_ACCESS_TOKEN=${raw("MERCADO_PAGO_ACCESS_TOKEN")}`,
  `MERCADO_PAGO_WEBHOOK_SECRET=${raw("MERCADO_PAGO_WEBHOOK_SECRET")}`,
  "",
  "# Automação avançada de tickets Discord (opcional; ainda não usada)",
  `DISCORD_BOT_TOKEN=${raw("DISCORD_BOT_TOKEN")}`,
  `DISCORD_GUILD_ID=${raw("DISCORD_GUILD_ID")}`,
  `DISCORD_TICKET_CATEGORY_ID=${raw("DISCORD_TICKET_CATEGORY_ID")}`,
  `DISCORD_SUPPORT_ROLE_ID=${raw("DISCORD_SUPPORT_ROLE_ID")}`,
  "",
  "# Preview somente: defina PAYMENT_TEST_MODE=true na Vercel Preview.",
  "# Na Production mantenha ausente/false. Localhost já habilita o laboratório.",
  `# PAYMENT_TEST_MODE=${raw("PAYMENT_TEST_MODE", "true")}`,
  "",
  "# ============================================================================",
  "# SOMENTE FERRAMENTAS LOCAIS — NÃO COPIAR PARA O RUNTIME DA VERCEL",
  "# ============================================================================",
  `SUPABASE_SERVICE_ROLE_KEY=${raw("SUPABASE_SERVICE_ROLE_KEY")}`,
  `SUPABASE_JWKS_URL=${raw("SUPABASE_JWKS_URL")}`,
  `SUPABASE_DB_URL=${raw("SUPABASE_DB_URL")}`,
  `VERCEL_TOKEN=${raw("VERCEL_TOKEN")}`,
];

const unknownKeys = [...entries.keys()].filter((key) => !managedKeys.has(key));
if (unknownKeys.length) {
  lines.push(
    "",
    "# Variáveis preservadas que ainda não foram classificadas",
    ...unknownKeys.map((key) => `${key}=${raw(key)}`),
  );
}

await writeFile(envPath, `${lines.join("\r\n")}\r\n`, {
  encoding: "utf8",
});

console.log(
  JSON.stringify({
    organized: true,
    cronSecretRotated: needsCronSecret,
    removedGithubTokenFromCron: cronWasGithubToken,
    ticketWebhookReady: Boolean(unquote(ticketWebhook)),
    pendingProviderKeys: [
      "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
      "MERCADO_PAGO_ACCESS_TOKEN",
      "MERCADO_PAGO_WEBHOOK_SECRET",
    ].filter((key) => !unquote(raw(key))),
  }),
);
