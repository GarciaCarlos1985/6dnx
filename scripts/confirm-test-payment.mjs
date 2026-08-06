import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// Leitura SOMENTE. Confirma o Bloco 1 (pagamento de teste R$1,00) sem mutar
// nada no banco. Nao imprime segredos nem nomes/CPF — apenas status e contagens.

function parseEnv(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

const env = parseEnv(await readFile(resolve(".env.local"), "utf8"));
const url =
  env.get("SUPABASE_URL") || env.get("NEXT_PUBLIC_SUPABASE_URL") || "";
const serviceKey =
  env.get("SUPABASE_SECRET_KEY") || env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!url || !serviceKey) {
  console.log("ERRO: SUPABASE_URL / SUPABASE_SECRET_KEY nao encontrados no .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_ORDER_ID = "c7c6ae0f-3744-4d4a-9ef2-030929ce46d7";
const TEST_EXTERNAL_ID = `6DNX-${TEST_ORDER_ID}`;

const out = {};

// Pergunta 1: o pedido R$1,00 esta 'paid' com paid_at preenchido?
{
  const { data, error } = await supabase
    .from("commerce_orders")
    .select("id, external_id, status, amount_cents, paid_at, created_at")
    .or(`id.eq.${TEST_ORDER_ID},external_id.eq.${TEST_EXTERNAL_ID}`);
  out.order_query_error = error ? error.message : null;
  out.order = (data ?? []).map((o) => ({
    id: o.id,
    external_id: o.external_id,
    status: o.status,
    amount_cents: o.amount_cents,
    paid_at: o.paid_at,
    paid_at_filled: Boolean(o.paid_at),
  }));
}

// Pergunta 2: existe linha em commerce_webhook_events pra esse pedido?
{
  const { data, error } = await supabase
    .from("commerce_webhook_events")
    .select("id, order_id, event_name, provider_status, created_at")
    .or(`order_id.eq.${TEST_ORDER_ID},external_id.eq.${TEST_EXTERNAL_ID}`);
  out.webhook_events_query_error = error ? error.message : null;
  out.webhook_events_count = (data ?? []).length;
  out.webhook_events = (data ?? []).map((e) => ({
    order_id: e.order_id,
    event_name: e.event_name,
    provider_status: e.provider_status,
    created_at: e.created_at,
  }));
}

// Tambem listo os 5 eventos mais recentes (contexto)
{
  const { data, error } = await supabase
    .from("commerce_webhook_events")
    .select("order_id, event_name, provider_status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  out.latest_events_error = error ? error.message : null;
  out.latest_webhook_events = data ?? [];
}

// Pergunta 3 (parcial): qual webhook esta configurado localmente?
out.discord_webhooks_configured = {
  DISCORD_TICKET_WEBHOOK_URL: Boolean(env.get("DISCORD_TICKET_WEBHOOK_URL")),
  DISCORD_WEBHOOK_URL: Boolean(env.get("DISCORD_WEBHOOK_URL")),
  priority_used_at_runtime:
    "DISCORD_TICKET_WEBHOOK_URL > DISCORD_WEBHOOK_URL (ver lib/checkout/paid-order-notification.ts e lib/discord-notifications.ts)",
};

console.log(JSON.stringify(out, null, 2));
