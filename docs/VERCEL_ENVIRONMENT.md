# Mapa de variáveis e segredos 6DNX

> **Estado operacional em 2026-08-03:** DNS e TLS do domínio estão válidos e o
> release público Git-backed inclui a vitrine nova, a rota de checkout e o
> webhook StorM. As flags de ativação continuam ausentes/desligadas; por isso a
> rota responde `503` e a interface compra pelo Discord.
> `STORM_WALLET_WEBHOOK_SECRET` e
> `CHECKOUT_DATA_HASH_SECRET` estão no escopo Production. Não alterar valores,
> escopos ou flags para corrigir o pedido pendente. A correção original da RPC
> já foi aplicada; a reconciliação complementar está preparada localmente, mas
> sua migration e seu código ainda não chegaram a Production. Passagens datadas
> de 2026-07-28 a 2026-08-01 são snapshots históricos, não o estado atual.

Auditoria local: 2026-07-28. Os valores nunca devem ser copiados para este
arquivo, para o GitHub, para logs ou para capturas de tela.

## 1. Vercel — necessárias para o site atual

Configure em **Project Settings > Environment Variables**.

| Variável | Production | Preview | Uso atual |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL canônica HTTPS aprovada para o deployment; domínio atual servido em `https://www.6dnx.com.br` | URL HTTPS do Preview | Metadados e URLs absolutas. Nunca use localhost na Production. |
| `DEVELOPER_CREDIT_URL` | link público HTTPS, quando fornecido | pode repetir | Destino clicável de “Developer Bicho” no rodapé. Quando ausente, o site reutiliza `DISCORD_INVITE_URL`; nunca use webhook. |
| `CRON_SECRET` | obrigatório | segredo diferente | Protege `/api/cron/news` e, depois de publicado, `/api/cron/storm-reconciliation`; use um segredo aleatório sem privilégios externos. |
| `SITE_REVIEW_ENABLED` | `true` enquanto privado | `true` enquanto privado | Ativa a senha de revisão. Na Vercel, ausente também bloqueia por segurança; somente `false` explícito abre. |
| `SITE_REVIEW_USER` | usuário privado | usuário diferente, se desejado | Usuário do desafio HTTP Basic; somente servidor. |
| `SITE_REVIEW_PASSWORD` | senha aleatória de 16+ caracteres | senha diferente | Senha do ambiente de revisão; nunca use `NEXT_PUBLIC_`. |
| `DISCORD_INVITE_URL` | obrigatório | pode repetir | Link público de suporte. |
| `DISCORD_TICKET_WEBHOOK_URL` | obrigatório | webhook de teste | Entrega dos TICKETs; somente servidor. |
| `DISCORD_WEBHOOK_URL` | opcional | opcional | Fallback do webhook de TICKET. |
| `SUPABASE_URL` | obrigatório | pode repetir | Persistência do Radar 6DNX. |
| `SUPABASE_SECRET_KEY` | obrigatório | segredo de Preview separado, se houver | Somente servidor; nunca use prefixo `NEXT_PUBLIC_`. |

`VERCEL` é injetada automaticamente pela plataforma e não deve ser cadastrada
manualmente.

## 2. Vercel — checkout StorM preparado, mas bloqueado

| Variável | Production | Preview | Quando usar |
| --- | --- | --- | --- |
| `STORM_WALLET_API_URL` | `https://wallet.stormapplications.com` | URL sandbox oficial | O código rejeita qualquer outro host, caminho ou credencial embutida. |
| `STORM_WALLET_API_KEY` | chave live | somente chave sandbox | Usada apenas pelo servidor para criar/consultar PIX. |
| `STORM_WALLET_WEBHOOK_SECRET` | segredo live | segredo sandbox diferente | Verifica `X-Storm-Signature` sobre o corpo bruto. |
| `CHECKOUT_DATA_HASH_SECRET` | segredo aleatório de 32+ caracteres | segredo diferente | Hash de CPF/fingerprint e token de polling. Nunca reutilize outra chave. |
| `STORM_WALLET_CHECKOUT_ENABLED` | `false` até homologação | `true` somente com sandbox | Kill switch de novas cobranças. |
| `STORM_WALLET_PRODUCTION_APPROVED` | `false` até aprovação final | ausente/`false` | Segunda trava obrigatória somente em Production. |
| `NEXT_PUBLIC_SUPABASE_URL` | futura | futura | Somente quando autenticação/RLS do navegador forem implementadas. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | futura | futura | É pública por design, mas exige RLS correto antes do uso. |
| `PAYMENT_TEST_MODE` | ausente/`false` | `true`, somente se desejado | Libera o simulador interno; nunca habilite na Production. |

As três credenciais StorM já estavam preenchidas em `.env.local` e cadastradas
na Vercel. Na auditoria concluída em 2026-07-28, todas estavam marcadas como
**Sensitive** e foram corrigidas para **Production somente**. Preview deve usar
somente credenciais sandbox, se a StorM fornecer esse ambiente. Em 2026-08-01,
as três novas travas ainda estavam ausentes localmente; o checkout portanto
permanece indisponível.

O cadastro das chaves não ativa pagamentos sozinho. As rotas existem, mas o
servidor exige migration aplicada, oferta individual aprovada, segredo de hash
e flags explícitas. O laboratório de R$ 1,00 continua separado.

O webhook StorM validado aponta para:

```text
https://www.6dnx.com.br/api/webhooks/storm-wallet
```

Não configure simultaneamente outro callback e não mude o destino enquanto
existir pedido pendente ou reconciliação aguardando conclusão.

O painel StorM nunca deve receber uma URL de webhook do Discord. O backend 6DNX
primeiro verifica a assinatura, valida ID/valor/estado, grava o evento uma vez e
só então envia uma notificação sanitizada para
`DISCORD_TICKET_WEBHOOK_URL`.

Em 2026-07-31, uma captura do proprietário confirmou que o campo de webhook da
StorM estava apontando diretamente para uma URL `discord.com/api/webhooks/...`.
Essa configuração é incorreta: remova esse destino e não cadastre a futura URL
6DNX até a rota existir, estar publicada e ter passado por teste de assinatura.
Se uma URL completa do Discord tiver aparecido em captura, log ou conversa,
rotacione o webhook no Discord, porque o trecho depois do ID funciona como
credencial de envio.

O contrato técnico local agora cobre criação, consulta, webhook e reconciliação.
A StorM informou que não garante reenvio automático; ainda faltam confirmação
oficial de sandbox, expiração, cancelamento, reembolso e retenção de dados.
Consulte `STORM_PIX_CHECKOUT.md`; nunca deduza regras a partir de uma chave live.

### Checkpoint atual de Production — 2026-08-03

- O lançamento público foi autorizado com pagamento automático desligado. O
  código considera a ausência de `STORM_WALLET_CHECKOUT_ENABLED` e
  `STORM_WALLET_PRODUCTION_APPROVED` exatamente como `false`; não é necessário
  cadastrar valores literais para obter o estado seguro.
- O release Git-backed contém `/api/checkout` e
  `/api/webhooks/storm-wallet`. A primeira rota falha fechada com `503`; a
  segunda continua independente das flags para aceitar callbacks assinados.
  A rota `/api/cron/storm-reconciliation` existe somente na branch local até
  nova autorização de migration e publicação.
- A vitrine mostra `Comprar pelo Discord` e não monta botão PIX, CPF ou QR Code
  enquanto o checkout estiver indisponível.

- O domínio está válido: apex `308` para `https://www.6dnx.com.br/` e `www`
  responde `200` com TLS.
- O painel StorM aponta para
  `https://www.6dnx.com.br/api/webhooks/storm-wallet`, e o segredo HMAC novo foi
  salvo como `STORM_WALLET_WEBHOOK_SECRET` em Production.
- O endpoint foi publicado isoladamente. HMAC inválido retorna `401`; `GET`
  retorna `405`.
- O release foi preparado para substituir o deployment manual por origem Git
  rastreável sem perder a rota do webhook.
- A migration comercial está aplicada. A oferta usada no teste real foi
  suspensa; existe um pedido `pending_payment`, uma tentativa do provedor e zero
  eventos persistidos porque a RPC falhou antes do commit.
- `STORM_WALLET_CHECKOUT_ENABLED` e `STORM_WALLET_PRODUCTION_APPROVED`
  continuam ausentes/desligadas em Production. `CHECKOUT_DATA_HASH_SECRET` e o
  segredo HMAC estão no escopo Production. No release novo, `/api/checkout`
  existe, porém responde `503` sem alcançar a StorM enquanto as flags estiverem
  desligadas.
- Incidentes anteriores com valores locais incorretos e token de Vercel exposto
  foram tratados antes do teste real. Não reutilize tokens antigos nem copie
  segredos entre chat, documentação e painéis.
- O HMAC e o hash corrigidos passaram na homologação criptográfica; o teste real
  confirmou a paridade do HMAC em Production. A publicação Git usa autenticação
  independente e nenhuma flag Production foi criada.

Como registro histórico, em 2026-08-01 uma checagem autenticada e somente de leitura confirmou a API key
(`GET /api/v1/account` retornou sucesso), mas a conta informou
`webhookConfigured=false`. O Supabase também informou `PGRST205` para
`commerce_offers`, pois a migration ainda não havia sido aplicada naquele
momento. Esse snapshot foi superado pelos checkpoints de 2 e 3 de agosto; as
flags continuam desligadas agora por causa da RPC pendente, não por ausência do
banco ou webhook.

## Domínio `6dnx.com.br`

Maycon adquiriu o domínio e a conexão técnica foi concluída em 2026-08-02. O
estado medido é: apex redirecionando para `www`, DNS Vercel ativo e HTTPS válido.
O callback StorM já usa `www`. Qualquer futura mudança de URL canônica,
metadados ou OAuth deve preservar esse redirecionamento e ser validada em home,
`/admin/login`, `/api/redirect`, `robots.txt` e headers antes de novo deployment.

`DEVELOPER_CREDIT_URL=` vazio é um estado seguro: o crédito aparece sem link.
Para torná-lo clicável, use uma página pública HTTPS ou convite público. Nunca
use um webhook do Discord como destino, pois webhook é uma credencial de escrita.
O frontend também aplica uma trava defensiva: endereços HTTP, URLs com
credenciais embutidas e caminhos `/api/webhooks/` (inclusive versionados) são
recusados e não viram links. Essa trava reduz o impacto de erro de configuração,
mas não recupera um webhook que já apareceu no HTML: nesse caso, rotacione-o no
Discord e atualize os ambientes.

## 3. Não precisam ficar na Vercel agora

Estas variáveis aparecem ou já apareceram no projeto Vercel, mas o código
publicado hoje não as utiliza:

- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`
- `DISCORD_TICKET_CATEGORY_ID`
- `DISCORD_SUPPORT_ROLE_ID`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_JWKS_URL`
- `SUPABASE_SERVICE_ROLE_KEY`, quando `SUPABASE_SECRET_KEY` já está configurada
- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`

Os quatro dados de bot do Discord só serão necessários se a 6DNX decidir criar
um canal privado diferente para cada compra. As três variáveis Mercado Pago
devem continuar vazias ou ser removidas enquanto a StorM for a provedora
escolhida.

Na auditoria, todas as variáveis da Vercel estavam definidas como
**Sensitive**. A API e a CLI confirmam nome e escopo, mas não devolvem seus
valores; portanto, não é possível comparar o conteúdo com `.env.local`.
Variáveis `NEXT_PUBLIC_*` serão públicas no bundle do navegador por definição e
podem ser recriadas como Plain para facilitar conferência. Isso não se aplica a
tokens, secrets, webhooks ou chaves privadas.

Na auditoria de 2026-07-29, as três variáveis `SITE_REVIEW_*` ainda não
existiam na Vercel. O domínio publicado respondia `200` e `robots.txt` retornava
`404`, confirmando que o deploy online ainda é anterior à proteção. Também
permaneciam em Preview e Production várias credenciais não utilizadas
(`SUPABASE_DB_URL`, service role, bot Discord e Mercado Pago). Antes do próximo
push, configure a revisão e reduza esses escopos conforme
`AUDITORIA_SEGURANCA.md`.

## 4. GitHub

### Repositório

Nenhum valor secreto sobe para os arquivos do repositório. O GitHub recebe
somente `.env.example`, com nomes e valores vazios. `.env.local` está ignorado
por `.gitignore` e deve continuar assim.

### GitHub Actions

Atualmente o repositório não possui `.github/workflows`, portanto não precisa de
nenhum **Actions Secret**. O Radar diário usa Vercel Cron, não GitHub Actions.
Se um workflow for criado no futuro, adicione apenas os segredos que aquele
workflow referenciar explicitamente.

Um token usado para `git push` autentica o computador/CLI. Ele não deve ser
salvo em `.env.local`, em Vercel ou em GitHub Actions.

## 5. Somente no computador local

- `VERCEL_TOKEN`: credencial da CLI para leitura/administração da Vercel;
- `SUPABASE_DB_URL`: conexão direta para migrations e ferramentas;
- `SUPABASE_JWKS_URL`: metadado de ferramentas;
- `SUPABASE_SERVICE_ROLE_KEY`: fallback legado, dispensável quando a nova
  `SUPABASE_SECRET_KEY` funciona;
- qualquer token pessoal usado pelo Git/GitHub CLI.

## 6. Outros painéis

- **StorM Wallet:** chave e secret ficam na Vercel/local; no painel StorM entra
  apenas a URL HTTPS já validada do webhook 6DNX.
- **Discord:** o webhook é criado/rotacionado no Discord e seu valor completo
  fica apenas na Vercel e em `.env.local`.
- **Supabase:** a migration
  `supabase/migrations/20260727010000_create_news_articles.sql` deve ser
  revisada e aplicada no projeto; não se “envia” chave para o painel.

## Checklist antes da próxima publicação financeira

1. Manter `NEXT_PUBLIC_SITE_URL=https://www.6dnx.com.br` em Production.
2. Manter `PAYMENT_TEST_MODE` ausente e as duas flags StorM desligadas.
3. Aplicar somente a migration de reconciliação revisada, após autorização.
4. Confirmar tabela/RLS, grants `service_role` e as três RPCs financeiras.
5. Só depois publicar a branch de reconciliação, pois o código novo chama a RPC
   versionada `process_storm_payment_event_v2`.
6. Confirmar no build publicado a rota `/api/cron/storm-reconciliation` e o
   webhook já existente.
7. Consultar/reconciliar apenas a cobrança real já criada; não gerar outro PIX.
8. Verificar pedido `paid`, evidência única, tentativa e Discord sanitizado.
9. Repetir a consulta e confirmar idempotência sem segunda notificação.
10. Somente depois decidir separadamente sobre ofertas e as duas flags de novas
    cobranças.
