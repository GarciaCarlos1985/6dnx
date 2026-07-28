# 6DNX

Vitrine comercial cinematográfica para os produtos 6DNX, com checkout de
laboratório, suporte pelo Discord e uma central editorial de games e IA.

O fluxo comercial de produção e suas regras de segurança estão definidos em
[`COMMERCE_ARCHITECTURE.md`](COMMERCE_ARCHITECTURE.md).
O mapa de variáveis e escopos da Vercel está em
[`VERCEL_ENVIRONMENT.md`](VERCEL_ENVIRONMENT.md).

## Estado atual

- Hero com narrativa de scroll em GSAP, troca sincronizada entre duas poses de cada personagem, atmosfera gerada em CSS e suporte a `prefers-reduced-motion`.
- Seis produtos, exibidos em páginas de três cards.
- Detalhes do produto sempre abertos acima do card no desktop; vídeo abre no
  lado com espaço disponível e ambos permanecem dentro da viewport.
- Checkout isolado de teste por variação, com Pix/cartão cenográficos, valor
  fixo de R$ 1,00 e notificação server-side marcada como TESTE no TICKET.
- `Radar 6DNX` na home e página completa em `/noticias`.
- Notícias oficiais de DayZ, ARC Raiders e Counter-Strike 2 via Steam Web API,
  Google AI Blog e OpenAI News via RSS.
- Persistência Supabase e sincronização diária preparadas, mas não aplicadas remotamente.

Ainda faltam dados comerciais que não devem ser inventados:

- `priceBRL` das variações em `lib/products.ts`;
- `youtubeId` de cada produto em `lib/products.ts`;
- convite real em `DISCORD_INVITE_URL`.

## Arquitetura

```text
app/
  api/redirect/       navegação segura de suporte para o Discord
  api/checkout/test/  sessões efêmeras do laboratório de pagamento
  api/cron/news/      coleta protegida por CRON_SECRET
  checkout/test/      experiência de Pix/cartão estritamente simulada
  noticias/           central editorial completa
components/
  hero-section.tsx
  product-showcase.tsx
  news-radar.tsx
lib/
  products.ts
  news/
    types.ts           contrato do domínio
    steam.ts           adaptador da fonte oficial
    official-rss.ts    Google AI + OpenAI, leitura limitada por stream
    sources.ts         agregador das fontes oficiais
    repository.ts      Supabase -> fontes oficiais -> fallback local
    seed.ts            último recurso para indisponibilidade externa
supabase/migrations/   tabela, índices, RLS e RPC idempotente
```

A home continua estática e os feeds são revalidados diariamente. O conteúdo editorial
é renderizado no servidor e envolvido em `Suspense`, portanto uma fonte lenta não
bloqueia o hero ou a vitrine. Nenhuma chave do Supabase ou webhook entra no bundle
do navegador.

### Ordem de leitura das notícias

1. `news_articles` no Supabase, quando configurado e com conteúdo publicado;
2. feeds oficiais da Steam, Google AI e OpenAI;
3. snapshot editorial local, somente se rede e banco estiverem indisponíveis.

Não há raspagem da página de resultados do Google. O Radar usa o RSS público e
oficial do Google AI Blog; isso é mais estável, permitido e não exige chave.

## Configuração local

```bash
npm install
npm run dev
```

O projeto usa `http://localhost:3127` por padrão. Copie as variáveis documentadas
em `.env.example` para `.env.local` e preencha somente no ambiente local/Vercel.

### Checkout de laboratório

O laboratório abre localmente por padrão e fica desativado na Vercel até que
`PAYMENT_TEST_MODE=true` seja configurado deliberadamente em um ambiente de
Preview. Ele não possui gateway, não pede cartão/CPF/endereço, não movimenta
dinheiro e não autoriza entrega de produto. O estado é efêmero em memória e
expira em 20 minutos.

Use `DISCORD_TICKET_WEBHOOK_URL` para isolar os pedidos TESTE no canal TICKET.
Sem essa variável, o sistema reutiliza `DISCORD_WEBHOOK_URL`.

## Ativação manual do Supabase

1. Revise `supabase/migrations/20260727010000_create_news_articles.sql`.
2. Aplique a migração no projeto Supabase de homologação.
3. Configure `SUPABASE_URL` e `SUPABASE_SECRET_KEY` apenas no servidor. A variável
   `SUPABASE_SERVICE_ROLE_KEY` existe somente como fallback para a chave JWT legada.
4. Configure um `CRON_SECRET` aleatório com pelo menos 32 caracteres na Vercel.
5. Faça uma chamada autenticada de laboratório para `/api/cron/news` e confira
   as linhas antes de habilitar a agenda.

O cron definido em `vercel.json` roda uma vez por dia, às 12:00 UTC. Não existe
GitHub Action agendado neste projeto: a agenda pertence à Vercel. Essa frequência
é compatível com o plano Hobby da Vercel. A RPC usa `external_id` como chave única,
então reexecuções não duplicam notícias e preservam os controles editoriais
(`status`, `is_featured` e `editorial_weight`).

## Segurança

- `GET /api/redirect` apenas redireciona; não dispara webhook.
- `POST /api/redirect` valida origem e produto antes da notificação.
- O checkout de teste valida produto/variação no servidor, limita sessões e
  nunca recebe dados financeiros.
- O webhook tem timeout e uma falha não prende o visitante.
- A coleta exige `Authorization: Bearer <CRON_SECRET>`.
- Cada RSS é lido por stream com teto de 1 MB e somente hosts oficiais passam.
- RLS permite leitura pública somente de notícias com `status = 'published'`.
- Escritas automatizadas passam por uma RPC liberada somente para `service_role`.

## Validação

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Antes de publicação, valide desktop e mobile e faça exatamente um teste real do
Discord, porque ele produz uma mensagem externa no canal configurado.
