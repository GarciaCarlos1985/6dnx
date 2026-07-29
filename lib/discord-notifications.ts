import "server-only";

import type { TestCheckoutSession } from "@/lib/checkout/test-store";

type DiscordDelivery = {
  delivered: boolean;
  reason?: "not-configured" | "rejected" | "network";
};

function ticketWebhook() {
  const configured =
    process.env.DISCORD_TICKET_WEBHOOK_URL?.trim() ||
    process.env.DISCORD_WEBHOOK_URL;
  if (!configured) return null;

  try {
    const url = new URL(configured);
    const allowedHosts = new Set([
      "discord.com",
      "canary.discord.com",
      "ptb.discord.com",
      "discordapp.com",
    ]);
    return url.protocol === "https:" &&
      allowedHosts.has(url.hostname) &&
      url.pathname.startsWith("/api/webhooks/")
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

async function sendTicket(payload: unknown): Promise<DiscordDelivery> {
  const webhook = ticketWebhook();
  if (!webhook) return { delivered: false, reason: "not-configured" };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) {
      console.error(
        "Webhook TICKET do Discord rejeitou a notificação:",
        response.status,
      );
      return { delivered: false, reason: "rejected" };
    }
    return { delivered: true };
  } catch (error) {
    console.error(
      "Falha ao enviar notificação ao TICKET do Discord:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { delivered: false, reason: "network" };
  }
}

function saoPauloTimestamp(value = new Date()) {
  return value.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  });
}

export async function notifyDiscordTestCheckout(
  session: TestCheckoutSession,
) {
  const method =
    session.paymentMethod === "pix"
      ? "Pix simulado"
      : "Cartão de teste";

  return sendTicket({
    username: "6DNX Checkout Lab",
    allowed_mentions: { parse: [] },
    content:
      "🧪 **NOVO PEDIDO APROVADO NO CHECKOUT DE TESTE**\nNenhum valor real foi movimentado.",
    embeds: [
      {
        title: "✅ Pagamento simulado aprovado",
        description:
          "Este ticket valida a integração site → checkout → canal TICKET.",
        color: 0xdc2626,
        fields: [
          {
            name: "🧾 Pedido",
            value: `TEST-${session.id.slice(0, 8).toUpperCase()}`,
            inline: true,
          },
          {
            name: "🎮 Produto",
            value: session.productTitle,
            inline: true,
          },
          {
            name: "🏷️ Variação",
            value: session.variantName,
            inline: true,
          },
          { name: "💳 Forma", value: method, inline: true },
          {
            name: "💰 Valor",
            value: `${session.testAmountLabel} · simulação`,
            inline: true,
          },
          {
            name: "🕒 Horário",
            value: saoPauloTimestamp(
              session.approvedAt ? new Date(session.approvedAt) : new Date(),
            ),
            inline: false,
          },
        ],
        footer: {
          text: "AMBIENTE DE TESTE · não entregar produto nem cobrar cliente",
        },
      },
    ],
  });
}
