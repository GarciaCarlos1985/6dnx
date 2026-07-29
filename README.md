# 6DNX

Vitrine comercial cinematográfica para os produtos 6DNX, com checkout de
laboratório, suporte pelo Discord e uma central editorial de games e IA.

A documentação completa está indexada em [`docs/README.md`](docs/README.md).
O fluxo comercial de produção e suas regras de segurança estão definidos em
[`docs/COMMERCE_ARCHITECTURE.md`](docs/COMMERCE_ARCHITECTURE.md).
O mapa de variáveis e escopos da Vercel está em
[`docs/VERCEL_ENVIRONMENT.md`](docs/VERCEL_ENVIRONMENT.md).

## Estado atual

- Hero com narrativa de scroll em GSAP, cinco poses de cada personagem
  distribuídas uma vez até o rodapé, atmosfera gerada em CSS e suporte a
  `prefers-reduced-motion`.
- Sete serviços de referência, exibidos em páginas de três cards.
- No desktop, informação abre à esquerda, o card selecionado permanece visível
  no centro e o vídeo ou prévia visual abre à direita. No mobile, o conteúdo
  usa uma única sheet acessível.
- Checkout isolado de teste por variação, com Pix/cartão cenográficos, valor
  fixo de R$ 1,00 e notificação server-side marcada como TESTE no TICKET.
- `Radar 6DNX` na home e página completa em `/noticias`.
- Notícias oficiais de DayZ, ARC Raiders e Counter-Strike 2 via Steam Web API,
  Google AI Blog e OpenAI News via RSS.
- Persistência Supabase e sincronização diária preparadas, mas não aplicadas remotamente.

Ainda faltam decisões comerciais que precisam de validação do proprietário:

- confirmar escopo e preços de referência de cada variação;
- adicionar somente vídeos oficiais e aprovados;
- confirmar o destino definitivo de suporte;
- aprovar políticas de atendimento, cancelamento e reembolso;
- validar provedor, banco e webhooks antes de qualquer cobrança real.

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

### Revisão privada

Enquanto o site não for público, configure `SITE_REVIEW_ENABLED=true`,
`SITE_REVIEW_USER` e uma `SITE_REVIEW_PASSWORD` aleatória com pelo menos 16
caracteres. A proteção falha fechada quando a senha está ausente ou fraca.
Cron e webhooks permanecem independentes e precisam validar seus próprios
segredos. Consulte `docs/REVIEW_HANDOFF.md` para o checklist completo.

Para o relatório pré-commit, falhas corrigidas e limitações que exigem ação
humana/externa, consulte `docs/AUDITORIA_SEGURANCA.md`.

### Checkout de laboratório

O laboratório abre localmente por padrão e fica desativado na Vercel até que
`PAYMENT_TEST_MODE=true` seja configurado deliberadamente em um ambiente de
Preview. Ele não possui gateway, não pede cartão/CPF/endereço, não movimenta
dinheiro e não autoriza entrega de produto. O estado é efêmero em memória e
expira em 20 minutos.

Use `DISCORD_TICKET_WEBHOOK_URL` para isolar os pedidos TESTE no canal TICKET.
Sem essa variável, o sistema reutiliza `DISCORD_WEBHOOK_URL`.

O catálogo atual usa valores de referência separados do total fixo de R$ 1,00
do simulador. A fronteira completa, os arquivos editáveis e os pré-requisitos
para uma futura carteira real estão em `docs/CATALOG_PAYMENT_LAB.md`.

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
