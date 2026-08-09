# Checkout PIX 6DNX — StorM Wallet

> **Checkpoint de 2026-08-08:** Maycon escolheu manter a operação somente em
> PIX pela StorM. A branch isolada `codex/storm-pix-create-claim` prepara uma
> trava atômica antes da criação: uma única requisição ganha o direito de chamar
> a StorM, concorrentes aguardam e reutilizam a mesma cobrança, e timeout
> ambíguo nunca dispara um segundo POST automático. A migration
> `20260808160000_add_storm_payment_creation_claim.sql` passou em PostgreSQL 16
> com `ROLLBACK`, mas não foi aplicada; o código não foi publicado. A confirmação
> oficial da StorM sobre deduplicação de `Idempotency-Key` continua pendente. O
> rollout deve auditar o histórico remoto e aplicar o lote aprovado de forma
> direcionada; não executar `supabase db push` genérico enquanto migrations
> anteriores documentadas como pendentes continuarem no repositório.

> **Checkpoint de 2026-08-03:** o PIX real de R$ 1,00 foi pago e o webhook
> assinado chegou ao backend. HMAC e contrato passaram; a RPC retornou `422`
> por ambiguidade SQL. A migration corretiva versionada foi aplicada em
> 2026-08-03 e preservou o pedido `pending_payment`; a oferta está `suspended`
> e Production continua com criação de cobranças desligada. O suporte oficial
> informou que não reenvia webhooks e recomendou polling pelo endpoint de
> consulta. A reconciliação server-side foi implementada e validada localmente,
> mas a nova migration não foi aplicada e o código não foi publicado. As seções
> datadas abaixo preservam a cronologia da homologação.

Este documento explica a integração real preparada em 2026-08-01 e o checkpoint
operacional de 2026-08-02. O webhook e a migration comercial já existem em
Production, mas **o checkout real público não está ativado**: a rota de criação
de cobrança não foi publicada e as flags de Production continuam desligadas.
Um único PIX real de R$ 1,00 foi criado pelo checkout local autorizado; a oferta
de teste já está suspensa e não pode gerar uma segunda cobrança.

## O que foi implementado

### Frontend

- o CTA de uma variação abre um modal cinematográfico responsivo;
- com a trava desligada, o modal informa a homologação antes de exibir qualquer
  campo; assim o site não pede CPF enquanto não pode criar a cobrança;
- nome completo e CPF têm máscara e validação antes do envio;
- o navegador envia produto e variação, mas nunca decide o preço;
- o modal exibe QR Code, PIX copia e cola e confirmação progressiva;
- o polling usa `POST` e um token HMAC, evitando colocar credenciais na URL;
- um estado observado como `COMPLETO` no polling ainda aparece como
  **confirmando** na versão atualmente publicada; a branch de reconciliação
  preparada permite que o servidor liquide o pedido após conferir ID da
  cobrança, `externalId` e valor exatos no endpoint autenticado da StorM;
- depois da confirmação, o cliente segue para o Discord pelo redirect oficial.

O projeto não ganhou Framer Motion, Zod nem React Hook Form. React, TypeScript e
CSS já cobriam o comportamento necessário; evitar três dependências reduz o
JavaScript enviado ao cliente e a superfície de manutenção.

### Arte do checkout

- o banner dedicado usa proporção **4:5**;
- tamanho recomendado: **1200 x 1500 px** (960 x 1200 também funciona);
- formato recomendado: WEBP ou AVIF, com no máximo 5 MB;
- o painel oferece um upload separado da thumbnail do card;
- sem banner dedicado, a thumbnail 16:9 aparece inteira (`object-contain`) sobre
  um fundo atmosférico, sem o recorte vertical que deformava a composição.

O campo depende da migration aditiva e ainda não aplicada
`supabase/migrations/20260801170000_add_checkout_banner.sql`.

### Backend

| Rota | Responsabilidade |
| --- | --- |
| `POST /api/checkout` | valida origem/dados, busca oferta aprovada, cria pedido idempotente e solicita PIX à StorM |
| `POST /api/checkout/status` | valida token do pedido e consulta a StorM com intervalo mínimo |
| `POST /api/webhooks/storm-wallet` | lê corpo bruto limitado, verifica `X-Storm-Signature`, processa evento uma vez e notifica o Discord sem CPF |
| `GET /api/cron/storm-reconciliation` | fallback diário protegido por `CRON_SECRET`; consulta somente cobranças existentes e pendentes |

O cliente StorM aceita somente o host exato
`https://wallet.stormapplications.com`, usa timeout, proíbe redirect e limita o
tamanho das respostas. `Idempotency-Key` e `externalId` recebem o mesmo ID do
pedido.

## Fonte verdadeira do preço

`product_catalog.variants[].priceBRL` continua sendo referência editorial. Uma
cobrança usa exclusivamente `commerce_offers.amount_cents`, e apenas quando a
oferta está com `status = 'approved'`.

A migration
`supabase/migrations/20260801100000_create_storm_commerce.sql` copia as
variações atuais como **draft**. Ela nunca aprova preço automaticamente.

As tabelas novas são:

- `commerce_offers`: preço canônico e aprovação comercial;
- `commerce_orders`: fotografia imutável do que foi comprado;
- `commerce_payment_attempts`: ID e estado observados na StorM;
- `commerce_webhook_events`: deduplicação e trilha do evento assinado.
- `commerce_reconciliation_events`: evidência separada da consulta autenticada
  ao endpoint oficial, sem fingir que polling é webhook.

O RPC `process_storm_payment_event` valida ID, valor e estado dentro de uma
transação. RLS impede leitura pública e escrita pelo navegador.

## Como o CPF é tratado

1. O CPF completo entra no modal e segue por HTTPS para o backend 6DNX.
2. O backend valida os dois dígitos verificadores.
3. O CPF completo é enviado server-to-server à StorM porque o contrato exige.
4. A 6DNX não grava o CPF completo. O banco recebe um hash HMAC irreversível e
   somente os quatro últimos dígitos.
5. CPF, nome ou segredo nunca entram em logs ou mensagens do Discord.

O nome do pagador é guardado no pedido porque identifica o atendimento. Antes
do lançamento público, a política de privacidade deve informar finalidade,
retenção e canal de solicitação do titular.

## Travas de ativação

As chaves presentes não ativam cobrança. O backend exige:

```dotenv
STORM_WALLET_CHECKOUT_ENABLED=true
CHECKOUT_DATA_HASH_SECRET=<segredo aleatório de 32+ caracteres>
```

Na Vercel Production, exige também:

```dotenv
STORM_WALLET_PRODUCTION_APPROVED=true
```

Preview nunca deve receber chave live. Se a StorM não fornecer sandbox, não
use Preview para chamar a API real.

## Verificação operacional de 2026-08-02

- `20260801100000_create_storm_commerce.sql` foi validada dentro de uma
  transação com `ROLLBACK`, aplicada atomicamente e registrada no histórico de
  migrations do Supabase;
- 157 ofertas nasceram como `draft`; para o teste real controlado,
  `Rust1 / 1 Dia` foi temporariamente alterada para `approved` com
  `amount_cents = 100`. As outras 156 seguem em `draft`;
- as quatro tabelas têm RLS, o Data API rejeita acesso anônimo e
  `process_storm_payment_event` só é executável por `service_role`;
- `POST https://www.6dnx.com.br/api/webhooks/storm-wallet` está publicado e
  rejeita HMAC inválido com `401` e `Cache-Control: no-store`;
- o segredo HMAC corrigido da `.env.local` autentica o deployment: um corpo
  bruto assinado chegou à RPC, uma adulteração do mesmo corpo retornou `401` e
  um header de evento divergente retornou `400`;
- `/api/checkout` continua `404`, e
  `STORM_WALLET_CHECKOUT_ENABLED`, `STORM_WALLET_PRODUCTION_APPROVED` e
  `CHECKOUT_DATA_HASH_SECRET` continuam ausentes em Production.

Consequência naquele checkpoint: o webhook estava pronto para receber eventos,
mas nenhum caminho publicado era capaz de criar uma cobrança. O primeiro PIX
real deveria continuar local, com uma única oferta deliberadamente aprovada por
R$ 1,00 e autorização final imediatamente antes da criação. Esse teste foi
executado depois e seu resultado está registrado abaixo.

### Tentativa de homologação posterior

Uma tentativa autorizada confirmou `webhookConfigured=true` na API StorM, mas
o evento sintético assinado com o valor local recebeu `401`. Sem revelar
segredos, a inspeção mostrou que o valor local de
`STORM_WALLET_WEBHOOK_SECRET` é uma URL de webhook, não o secret HMAC do painel.
O `CHECKOUT_DATA_HASH_SECRET` local também possui somente 27 caracteres, abaixo
do mínimo de 32. A homologação permanece bloqueada e nenhuma cobrança foi
criada.

Após a correção dos dois valores, a repetição foi aprovada: o corpo bruto exato
assinado chegou à RPC e retornou `422` apenas porque o pedido sintético não
existia; alterar o valor mantendo a assinatura retornou `401`; trocar somente
`X-Storm-Event` retornou `400`. As três tabelas operacionais permaneceram
zeradas. A flag `STORM_WALLET_CHECKOUT_ENABLED=true` foi então adicionada
somente à `.env.local`, e uma requisição vazia confirmou a ativação local com
`400` de dados inválidos antes de qualquer chamada à StorM.

### Resultado do primeiro PIX real de R$ 1,00

O checkout local criou um único pedido e uma única cobrança. O banco do pagador
confirmou a transferência e o polling autenticado da StorM observou
`provider_status = 'COMPLETO'`, sem erro do provedor. Logo depois, a única oferta
de teste foi alterada de `approved` para `suspended`; as outras 156 ofertas
continuam `draft`.

O teste ponta a ponta, porém, **ainda não foi aprovado**. No checkpoint posterior:

- o pedido continuava `pending_payment`, com `paid_at` nulo;
- `commerce_payment_attempts` registrava `COMPLETO` e o horário da observação;
- `commerce_webhook_events` continuava sem evento para o pedido;
- nenhuma notificação de pedido pago no Discord estava comprovada.

O log de Production eliminou a dúvida sobre a entrega: a StorM fez o `POST` real
às 10:42:55 BRT com seu User-Agent oficial. Firewall e middleware permitiram a
requisição, e a rota chamou `process_storm_payment_event`; portanto o corpo,
HMAC e contrato do evento já tinham passado pelas guardas anteriores. A RPC
devolveu erro e a rota respondeu `422`.

Uma reprodução com os mesmos campos comerciais, feita dentro de transação com
`ROLLBACK`, encontrou a causa exata: PostgreSQL `42702`, referência ambígua à
coluna `order_id`. A função retorna uma coluna chamada `order_id` e também usa
`ON CONFLICT (order_id)` no upsert de `commerce_payment_attempts`. A correção
mínima é usar a constraint sem ambiguidade:

```sql
on conflict on constraint commerce_payment_attempts_pkey do update
```

Com somente essa alteração temporária, a reprodução retornou `paid`, inseriu um
evento e preservou o valor de 100 centavos. O rollback confirmou que o pedido
real continuou `pending_payment`, sem `paid_at` e sem evento. Nenhuma alteração
corretiva foi aplicada em Production.

Não alterar o pedido manualmente para `paid` e não liberar atendimento/produto
com base apenas em polling, captura de tela ou comprovante bancário. A migration
aditiva `20260803120000_fix_storm_payment_event_conflict.sql` foi aplicada
atomicamente e registrada no histórico do Supabase em 2026-08-03. A aplicação
preservou um pedido pendente, uma tentativa e zero eventos; a função corrigida
permanece executável somente por `service_role`.

O suporte oficial respondeu que não reenvia webhooks e que uma falha de entrega
deve ser coberta por polling no endpoint de consulta documentado na Wallet. A
senha separada da Wallet não é necessária e não deve ser compartilhada. Por
autorização do proprietário, foi preparada uma reconciliação server-side que:

- usa somente `GET /api/v1/payments/{providerPaymentId}`; nunca cria cobrança;
- exige igualdade exata de `providerPaymentId`, `externalId` e centavos;
- registra evidência distinta do webhook e muda pedido/tentativa em uma única
  transação idempotente;
- impede notificação duplicada se webhook e polling concorrerem;
- roda imediatamente no status autenticado do cliente e, como fallback, em um
  lote diário limitado e protegido por `CRON_SECRET`.

A migration `20260803235717_storm_server_reconciliation.sql` e o código estão
somente na branch local `codex/storm-server-reconciliation`. PostgreSQL 16 local
validou primeira liquidação, repetição idempotente, valor divergente, RLS,
grants e webhook tardio sem segunda transição. **Nada foi aplicado ao Supabase
de Production e nada foi publicado na Vercel.** O pedido real permanece
`pending_payment` até uma autorização posterior, após a apresentação dos gates.

## Verificação operacional de 2026-08-01

Uma consulta autenticada e somente de leitura a `GET /api/v1/account` retornou
sucesso, portanto a API key presente no ambiente é reconhecida. A mesma resposta
informou `webhookConfigured=false`. A consulta de leitura ao Supabase retornou
`PGRST205` para `commerce_offers`, isto é, a migration comercial ainda não foi
aplicada. As três variáveis de ativação/hash também permaneciam ausentes.

Consequência: a tela “O PIX ainda não foi liberado” está correta. O botão de
atendimento abre o Discord porque não existe ainda um caminho capaz de provar
um pagamento real. **Não divulgar o checkout como operacional e não habilitar
as flags neste estado.** Nenhuma cobrança foi criada durante essa verificação.

Para gerar `CHECKOUT_DATA_HASH_SECRET` no PowerShell sem reutilizar senha:

```powershell
[Convert]::ToHexString(
  [Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
).ToLower()
```

Copie somente o resultado para `.env.local` e para a variável **Sensitive** da
Vercel. Não cole o valor em chat, documentação, GitHub ou captura de tela.

## Ordem segura para ativar

1. Revisar este documento, a migration e o contrato entregue pela StorM.
2. Aplicar a migration primeiro em uma branch isolada do Supabase.
3. Confirmar que todas as linhas de `commerce_offers` nasceram como `draft`.
4. Escolher uma única oferta de teste, conferir produto/variação/valor com
   Maycon e registrar uma justificativa de aprovação.
5. Adicionar `CHECKOUT_DATA_HASH_SECRET` sem alterar as duas flags.
6. Publicar o código ainda com as flags `false` e confirmar que o checkout
   responde indisponível — esse é o teste da trava.
7. Depois de publicar e verificar o domínio definitivo, configurar no painel
   StorM o webhook backend, nunca o webhook Discord:

   ```text
   https://6dnx.com.br/api/webhooks/storm-wallet
   ```

   Enquanto `6dnx.com.br` ainda não estiver anexado e com TLS válido, use a URL
   técnica `https://6dnx.vercel.app/api/webhooks/storm-wallet` somente no teste
   controlado. Não mantenha dois destinos ativos.

8. Executar testes documentados de idempotência, assinatura correta/incorreta,
   valor divergente, evento repetido, polling e recuperação de falha.
9. Usar sandbox. Se não existir, solicitar ao provedor um procedimento oficial
   de homologação antes de qualquer cobrança live.
10. Somente depois da validação humana, definir
    `STORM_WALLET_CHECKOUT_ENABLED=true`. Em Production, a aprovação final usa a
    segunda flag.

Não aprove todas as ofertas por SQL em massa. O painel administrativo ainda não
possui uma tela comercial própria para esse campo; isso é uma etapa separada.

## Cupons de desconto — contrato server-side

O cupom é opcional. Sem código, o checkout segue exatamente o fluxo PIX já
existente. Com código, a aplicação consulta a oferta comercial aprovada e chama
uma RPC transacional que calcula o percentual dentro do PostgreSQL. O navegador
envia somente `productSlug`, `variantName` e `couponCode`; nenhum total, desconto
ou preço informado pelo cliente é aceito como fonte de verdade.

A migration `20260809180000_add_commerce_coupons.sql` cria:

- `commerce_coupons`, administrada somente por usuários com papel de admin;
- `commerce_order_discounts`, com a fotografia imutável do cupom usado;
- `quote_commerce_coupon`, somente para o backend validar a prévia;
- `create_discounted_commerce_order`, que bloqueia a oferta/cupom, recalcula o
  total, cria pedido e fotografia na mesma transação.

O valor final nunca pode chegar a zero. Cupom inativo, fora da validade ou
abaixo da compra mínima falha antes da criação do pedido e da chamada à StorM.
Depois do pedido, o fluxo de criação idempotente do PIX, webhook, reconciliação
e Discord permanece o mesmo e usa o valor final persistido no pedido.

Esta migration é versionada, mas não deve ser aplicada por `supabase db push`
genérico. Audite o histórico remoto e aplique o arquivo exato somente depois de
revisão humana. Publicar o código antes da migration não interrompe compras sem
cupom; apenas a validação de cupons responde indisponível de forma controlada.

## Estados e prova de pagamento

```text
pending_payment
  -> payment_creation_failed
  -> paid                 somente por prova server-to-server validada
  -> failed
failed -> paid            se uma prova COMPLETO válida chegar depois
```

Na versão publicada, o polling ainda apenas grava
`provider_complete_observed_at`. Na branch de reconciliação, uma consulta
autenticada feita pelo servidor pode liquidar o pedido somente depois de
conferir `providerPaymentId`, `externalId` e valor exatos dentro da RPC
transacional. O navegador nunca fornece nem aprova essa prova.

O webhook continua processando pedidos existentes mesmo quando o kill switch de
novas cobranças está desligado. Ele depende somente do segredo HMAC e da conexão
server-only com o Supabase; uma rotação do token de polling não pode impedir a
baixa de um pagamento pendente. Portanto, em incidente:

1. altere `STORM_WALLET_CHECKOUT_ENABLED=false`;
2. não apague a URL do webhook enquanto houver pedidos pendentes;
3. não entregue produto com base apenas em print ou mensagem do cliente;
4. confira `commerce_orders.status = 'paid'` e a evidência correspondente em
   webhook ou reconciliação.

## O que falta antes de abrir vendas

- aplicar/publicar a reconciliação somente após autorização específica;
- concluir o teste já pago com `paid`, evidência única e Discord sanitizado;
- monitorar falhas de entrega do webhook e o fallback de consulta;
- política de privacidade e regras de reembolso;
- tela administrativa de pedidos/ofertas e monitoramento operacional;
- aprovação humana para as flags de Production.
