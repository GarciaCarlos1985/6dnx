# Estado do banco de dados e do Supabase da 6DNX

## Atualização operacional — 2026-08-03

O veredito de 29 de julho abaixo é histórico. O Supabase hoje possui catálogo,
admin e as quatro tabelas comerciais com RLS. A migration comercial foi
aplicada e um pedido real de R$ 1,00 foi criado.

| Camada | Estado atual confirmado |
| --- | --- |
| `product_catalog` | existe; leitura pública limitada a publicados e escrita administrativa protegida |
| `commerce_offers` | existe; oferta do teste real está `suspended` |
| `commerce_orders` | existe; pedido do teste está `pending_payment` |
| `commerce_payment_attempts` | existe; tentativa do provedor foi registrada |
| `commerce_webhook_events` | existe; zero eventos persistidos após a falha da RPC |
| `process_storm_payment_event` | acessível somente ao backend, mas a versão Production possui ambiguidade `ON CONFLICT (order_id)` |
| RLS `anon` | SELECT/INSERT/UPDATE/DELETE financeiros bloqueados em teste real de papel |
| Pagamento StorM | PIX pago no provedor; falta replay assinado após correção para persistir `paid` |

A correção proposta foi validada dentro de transação com rollback e preservou
idempotência. Ela ainda não foi aplicada. Não usar o snapshot antigo abaixo
para concluir que as tabelas comerciais não existem.

## Snapshot histórico — 29 de julho de 2026

Auditoria original realizada em 29 de julho de 2026.

## Veredito

O projeto Supabase está **online e respondendo**, mas o banco da aplicação
6DNX **ainda não está operacional como banco do site**.

Situação precisa:

| Camada | Estado |
| --- | --- |
| Projeto Supabase | online |
| API de autenticação | online |
| Google Provider | habilitado no Supabase |
| Tabela de notícias | não existe no projeto consultado |
| Persistência do Radar | não funciona |
| Banco de produtos | não existe |
| Banco de clientes/perfis | não existe |
| Banco de pedidos | não existe |
| Banco de pagamentos | não existe |
| Banco de tickets | não existe |
| Login Google no site | não implementado |
| Checkout persistente | não existe |
| Pagamento real | não existe |

Logo, a resposta para “o banco já está funcionando?” é:

- **sim**, a infraestrutura Supabase está acessível;
- **não**, o schema necessário à 6DNX ainda não foi aplicado;
- **não**, vendas e pagamentos ainda não usam banco;
- **não**, o Radar ainda não guarda histórico no Supabase.

## Como a auditoria foi feita

Foram usados somente procedimentos de leitura:

- inspeção do código e das migrations;
- conferência da presença das variáveis, sem imprimir seus valores;
- comparação das URLs e chaves equivalentes, sem expor segredos;
- `GET` na API REST do Supabase;
- `GET` nas configurações públicas do Supabase Auth;
- leitura do OpenAPI usando credencial server-side;
- `GET` público no site de produção;
- `GET` sem segredo no cron, para confirmar o bloqueio esperado;
- `GET` no checkout de produção com uma sessão inexistente.

Não foram executados:

- migration;
- `INSERT`;
- `UPDATE`;
- `DELETE`;
- RPC de ingestão;
- cron autenticado;
- webhook;
- cobrança;
- ticket;
- deploy.

## Evidências medidas

### Configuração local

| Verificação | Resultado |
| --- | --- |
| `SUPABASE_URL` | presente |
| `NEXT_PUBLIC_SUPABASE_URL` | presente |
| URLs pública e server-side | apontam para o mesmo projeto |
| `SUPABASE_PUBLISHABLE_KEY` | presente |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | presente |
| chaves publicáveis | correspondem |
| `SUPABASE_SECRET_KEY` | presente |
| `SUPABASE_SERVICE_ROLE_KEY` | presente |
| `SUPABASE_DB_URL` | presente |
| `SUPABASE_JWKS_URL` | presente |

`SUPABASE_SECRET_KEY` e `SUPABASE_SERVICE_ROLE_KEY` não precisam ter o mesmo
valor. A primeira usa o formato novo de segredo do Supabase; a segunda é a
credencial JWT legada de `service_role`. O código prefere a chave nova e usa a
legada somente como fallback.

### Supabase ao vivo

| Teste | Resultado |
| --- | --- |
| configurações do Supabase Auth | HTTP 200 |
| Google Provider | habilitado |
| `public.news_articles` com chave pública | HTTP 404, `PGRST205` |
| `public.news_articles` com chave secreta nova | HTTP 404, `PGRST205` |
| `public.news_articles` com JWT `service_role` | HTTP 404, `PGRST205` |
| RPC `ingest_news_articles` | não aparece no schema |
| OpenAPI com credencial server-side | HTTP 200 |

Mensagem retornada pelo Supabase:

```text
Could not find the table 'public.news_articles' in the schema cache
```

O OpenAPI server-side expõe somente a raiz e uma rotina de plataforma. Não há
tabela de aplicação exposta. Isso confirma que a migration disponível no
repositório não foi aplicada ao projeto consultado.

### Produção

| Teste | Resultado |
| --- | --- |
| `https://6dnx.vercel.app/` | HTTP 200 |
| cron sem `CRON_SECRET` | HTTP 401, comportamento correto |
| checkout de teste | HTTP 404 com “Checkout de teste desativado” |

Não foi disparado o cron com segredo, porque essa chamada tenta persistir
notícias e deixaria de ser uma auditoria estritamente passiva.

## O que o banco deveria possuir hoje

Existe uma migration versionada:

```text
supabase/migrations/20260727010000_create_news_articles.sql
```

Ela foi preparada para criar:

- tabela `public.news_articles`;
- identificadores e slugs únicos;
- validação de tamanhos e URLs HTTPS;
- categorias controladas;
- estado `draft`, `published` ou `archived`;
- índices para feed e categoria;
- RLS;
- leitura pública somente de artigos publicados;
- bloqueio de escrita para `anon` e `authenticated`;
- trigger de `updated_at`;
- RPC server-side `ingest_news_articles`;
- permissão da RPC somente para `service_role`.

O arquivo existe e a arquitetura é coerente, mas arquivo SQL no Git não altera
o Supabase por conta própria. É necessário aplicar a migration em um ambiente
controlado.

## O que acontece com as notícias agora

`lib/news/repository.ts` usa esta ordem:

1. tenta ler `news_articles` no Supabase;
2. se o banco não responder com conteúdo válido, consulta fontes oficiais;
3. se as fontes externas falharem, usa o snapshot local.

O cron configurado em `vercel.json` roda diariamente:

```text
0 12 * * *
```

Isso equivale a 12:00 UTC e, normalmente, 09:00 no horário de Brasília.

Quando a coleta funciona mas o Supabase falha, a rota retorna
`storage: "source-only"`. Assim, o Radar ainda pode mostrar notícias, mas:

- não cria histórico durável;
- perde a coleta quando a origem deixa de fornecê-la;
- não possui edição editorial persistente;
- não consegue arquivar ou destacar artigos pelo banco;
- depende da disponibilidade das fontes externas ou do snapshot local.

## Onde os dados estão hoje

| Dado | Armazenamento atual | Durabilidade |
| --- | --- | --- |
| produtos e variações | `lib/products.ts` | versionado no Git |
| preços de referência | `lib/products.ts` | versionado no Git |
| sessão do checkout | `Map` em memória do processo | efêmera |
| rate limit do checkout | `Map` em memória do processo | efêmero |
| estado `approved` do teste | memória do processo | efêmero |
| aviso ao Discord | mensagem externa | não é banco |
| notícias | fontes oficiais ou snapshot local | sem histórico no Supabase |
| clientes | inexistente | nenhuma |
| pedidos | inexistente | nenhuma |
| pagamentos | inexistente | nenhuma |
| eventos de webhook | inexistente | nenhuma |
| tickets vinculados a pedido | inexistente | nenhuma |
| auditoria administrativa | inexistente | nenhuma |

Em Vercel serverless, duas requisições podem ser atendidas por instâncias
diferentes. Por isso, uma sessão criada em memória pode desaparecer ou não ser
encontrada na requisição seguinte. Esse modelo é adequado apenas ao laboratório
local.

## Google Auth

O endpoint de configurações do Supabase confirmou o Google Provider como
habilitado. Isso comprova apenas a configuração do provedor.

O site ainda não possui:

- dependência cliente do Supabase;
- botão conectado ao fluxo OAuth real;
- callback;
- sessão;
- tabela de perfil;
- políticas para dados do cliente;
- vínculo entre usuário e pedido.

Portanto, o Auth está parcialmente preparado no painel, mas não está
funcionando como login da aplicação.

## Pagamentos

As variáveis da StorM Wallet e do Mercado Pago podem estar preenchidas, mas não
há código de integração com esses provedores.

Atualmente não existem:

- criação server-side de cobrança;
- consulta de cobrança;
- webhook financeiro;
- validação HMAC;
- tabela de pedidos;
- tabela de tentativas de pagamento;
- tabela de eventos;
- idempotência;
- reconciliação;
- cancelamento ou reembolso.

Ter uma chave no `.env.local` ou na Vercel não ativa o provedor. Uma variável
somente disponibiliza o segredo ao código; ela não cria a integração.

## Estrutura mínima futura para comércio

Uma implementação profissional deve separar pelo menos:

| Tabela | Responsabilidade |
| --- | --- |
| `profiles` | dados mínimos do usuário, separados do Supabase Auth |
| `products` | catálogo legítimo aprovado |
| `product_variants` | variações e preços canônicos |
| `orders` | pedido e estado comercial |
| `order_items` | cópia imutável do item e preço comprado |
| `payment_attempts` | tentativas criadas no provedor |
| `payment_events` | webhooks recebidos, com chave idempotente |
| `support_tickets` | vínculo entre pedido pago e atendimento |
| `audit_events` | ações administrativas e mudanças sensíveis |

Estados de pedido e pagamento devem ser separados. Exemplo:

```text
order: draft -> awaiting_payment -> paid -> in_support -> completed
payment: created -> pending -> approved | failed | expired | refunded
```

O pedido só pode chegar a `paid` após um evento autenticado e validado no
backend.

## Regras de segurança do futuro schema

- O cliente lê apenas os próprios pedidos.
- `anon` não lê pedidos, pagamentos ou tickets.
- O navegador nunca recebe `service_role`, chave secreta ou URL direta do
  Postgres.
- Preço e valor cobrado sempre vêm do backend.
- Webhooks são verificados antes de alterar o pedido.
- Eventos duplicados não executam a operação novamente.
- Dados de cartão e CVV nunca entram no banco 6DNX.
- Discord recebe apenas o mínimo necessário ao atendimento.
- Logs não contêm tokens, segredos ou dados financeiros completos.
- Mudanças administrativas possuem autor, data e motivo.

## Variáveis e destino correto

### Vercel — servidor

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `CRON_SECRET`

Devem existir somente nos ambientes que realmente precisam delas. Credenciais
live não devem ser copiadas para Preview.

### Navegador

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Essas variáveis podem chegar ao navegador, mas somente depois que RLS estiver
corretamente aplicado. “Publicável” não significa “sem controle”.

### Ferramentas locais

- `SUPABASE_SERVICE_ROLE_KEY`, se o fallback legado ainda for necessário;
- `SUPABASE_DB_URL`;
- `SUPABASE_JWKS_URL`, enquanto não houver verificação JWT no runtime;
- `VERCEL_TOKEN`.

Elas não precisam estar no runtime da Vercel apenas por existirem localmente.

### GitHub

Não existe workflow GitHub Actions ativo neste repositório. O agendamento
diário é Vercel Cron. Portanto, atualmente nenhuma chave do banco precisa ser
adicionada ao GitHub Secrets para o Radar funcionar.

Segredos nunca devem ser commitados no repositório.

## Plano seguro de ativação

### Fase 1 — Notícias

1. Criar ou escolher um projeto Supabase de homologação.
2. Revisar a migration existente.
3. Aplicar a migration somente após aprovação humana.
4. Confirmar que `anon` lê apenas `status = 'published'`.
5. Confirmar que `anon` e `authenticated` não escrevem.
6. Confirmar que a RPC aceita somente a credencial server-side.
7. Executar o cron em homologação.
8. Conferir persistência, duplicidade e atualização.
9. Somente depois repetir o processo controlado em produção.

### Fase 2 — Usuários

1. Implementar OAuth e callback.
2. Criar perfis e papéis mínimos.
3. Aplicar RLS.
4. Testar isolamento entre dois usuários.
5. Documentar exclusão e retenção de dados.

### Fase 3 — Pedidos

1. Criar schema de pedidos em homologação.
2. Persistir catálogo e preço canônico.
3. Criar pedido sem provedor financeiro.
4. Testar transições e auditoria.

### Fase 4 — Pagamento

1. Obter documentação oficial e sandbox.
2. Implementar adaptador server-only.
3. Criar webhook com assinatura validada.
4. Implementar idempotência e reconciliação.
5. Testar falha, expiração, duplicidade e reembolso.
6. Realizar revisão humana.
7. Somente então considerar credenciais live.

## Limitações desta auditoria

- Os valores das variáveis Sensitive da Vercel não foram lidos.
- Não foi feita conexão direta usando `SUPABASE_DB_URL`.
- Nenhuma migration foi aplicada.
- Nenhum cron autenticado foi executado.
- Nenhum pagamento ou webhook foi testado.

Essas limitações são intencionais: evitam alteração de produção enquanto ainda
não existe aprovação humana para DDL ou integração financeira.
