import "server-only";

type PaidOrderNotification = {
  id: string;
  productTitle: string;
  variantName: string;
  amountCents: number;
};

function ticketWebhook() {
  const configured =
    process.env.DISCORD_TICKET_WEBHOOK_URL?.trim() ||
    process.env.DISCORD_WEBHOOK_URL?.trim();
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

function formatAmountFromCents(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function saoPauloTimestamp(value = new Date()) {
  return value.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  });
}

export async function notifyDiscordPaidOrder(order: PaidOrderNotification) {
  const webhook = ticketWebhook();
  if (!webhook) return;

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "6DNX Pedidos",
        allowed_mentions: { parse: [] },
        content: "✅ **PAGAMENTO PIX CONFIRMADO PELA STORM WALLET**",
        embeds: [
          {
            title: "Pedido pronto para atendimento",
            description:
              "A confirmação veio pelo webhook assinado. Confira o pedido no painel antes da entrega.",
            color: 0xdc2626,
            fields: [
              {
                name: "🧾 Pedido",
                value: order.id.slice(0, 8).toUpperCase(),
                inline: true,
              },
              { name: "🎮 Produto", value: order.productTitle, inline: true },
              { name: "🏷️ Variação", value: order.variantName, inline: true },
              {
                name: "💰 Valor",
                value: formatAmountFromCents(order.amountCents),
                inline: true,
              },
              {
                name: "🕒 Confirmação",
                value: saoPauloTimestamp(),
                inline: false,
              },
            ],
            footer: {
              text: "6DNX · não compartilhar dados pessoais no Discord",
            },
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) {
      console.error(
        "Webhook TICKET do Discord rejeitou a notificação de pedido:",
        response.status,
      );
    }
  } catch (error) {
    console.error(
      "Falha ao enviar notificação de pedido ao TICKET do Discord:",
      error instanceof Error ? error.name : "UnknownError",
    );
  }
}
