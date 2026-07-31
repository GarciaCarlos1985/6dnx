# Mapa de variáveis e segredos 6DNX

Auditoria local: 2026-07-28. Os valores nunca devem ser copiados para este
arquivo, para o GitHub, para logs ou para capturas de tela.

## 1. Vercel — necessárias para o site atual

Configure em **Project Settings > Environment Variables**.

| Variável | Production | Preview | Uso atual |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://6dnx.vercel.app` | URL HTTPS do Preview | Metadados e URLs absolutas. Nunca use localhost na Production. |
| `CRON_SECRET` | obrigatório | segredo diferente | Protege `/api/cron/news`; use um segredo aleatório sem privilégios externos. |
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

## 2. Vercel — preparadas, mas ainda não ativadas

| Variável | Production | Preview | Quando usar |
| --- | --- | --- | --- |
| `STORM_WALLET_API_URL` | URL oficial | sandbox, se existir | Depois de validar a documentação da API StorM. |
| `STORM_WALLET_API_KEY` | chave live | somente chave sandbox | Depois de implementar criação de cobrança no backend. |
| `STORM_WALLET_WEBHOOK_SECRET` | segredo live | segredo sandbox diferente | Depois de implementar e testar a assinatura `X-Storm-Signature`. |
| `NEXT_PUBLIC_SUPABASE_URL` | futura | futura | Somente quando autenticação/RLS do navegador forem implementadas. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | futura | futura | É pública por design, mas exige RLS correto antes do uso. |
| `PAYMENT_TEST_MODE` | ausente/`false` | `true`, somente se desejado | Libera o simulador interno; nunca habilite na Production. |

As três variáveis StorM já estão preenchidas em `.env.local` e cadastradas na
Vercel. Na auditoria concluída em 2026-07-28, todas estavam marcadas como
**Sensitive** e foram corrigidas para **Production somente**. Preview deve usar
somente credenciais sandbox, se a StorM fornecer esse ambiente.

O cadastro das chaves não ativa pagamentos sozinho. Enquanto
`/api/webhooks/storm-wallet` e a criação de cobrança server-side não existirem,
o checkout continuará sendo apenas o laboratório de R$ 1,00.

O webhook futuro da StorM deverá apontar para:

```text
https://6dnx.vercel.app/api/webhooks/storm-wallet
```

Essa URL só deve ser ativada depois que a rota estiver publicada e validada. O
painel StorM nunca deve receber uma URL de webhook do Discord. O backend 6DNX
primeiro verifica a assinatura e só então envia uma notificação sanitizada para
`DISCORD_TICKET_WEBHOOK_URL`.

Em 2026-07-31, uma captura do proprietário confirmou que o campo de webhook da
StorM estava apontando diretamente para uma URL `discord.com/api/webhooks/...`.
Essa configuração é incorreta: remova esse destino e não cadastre a futura URL
6DNX até a rota existir, estar publicada e ter passado por teste de assinatura.
Se uma URL completa do Discord tiver aparecido em captura, log ou conversa,
rotacione o webhook no Discord, porque o trecho depois do ID funciona como
credencial de envio.

Não falta outra variável. O que falta é o contrato da API e a implementação:

- método/endpoint e payload para criar uma cobrança Pix;
- unidade do valor, campos obrigatórios e formato do QR/copia e cola;
- identificador, estados, expiração e consulta da cobrança;
- eventos e esquema do webhook;
- cálculo canônico da assinatura `X-Storm-Signature` sobre o corpo bruto;
- proteção contra repetição, idempotência, sandbox, cancelamento e reembolso.

Não deduza esses campos a partir de uma chave live. Peça a documentação
expandida na seção **Documentação da API** da própria Wallet e compartilhe
somente o texto técnico, nunca chaves ou secrets.

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
  apenas a URL HTTPS do webhook 6DNX, depois que a rota existir.
- **Discord:** o webhook é criado/rotacionado no Discord e seu valor completo
  fica apenas na Vercel e em `.env.local`.
- **Supabase:** a migration
  `supabase/migrations/20260727010000_create_news_articles.sql` deve ser
  revisada e aplicada no projeto; não se “envia” chave para o painel.

## Checklist antes de publicar

1. Ajustar `NEXT_PUBLIC_SITE_URL` de Production para
   `https://6dnx.vercel.app`.
2. Manter `PAYMENT_TEST_MODE` ausente em Production.
3. Retirar Preview do escopo das três variáveis StorM live.
4. Não ativar o webhook StorM antes da rota assinada existir.
5. Conceder permissão de escrita no repositório GitHub à conta autenticada.
6. Fazer o push da `main` e confirmar que a Vercel criou um deployment com o
   novo SHA.
7. Enquanto o site estiver em revisão, manter `SITE_REVIEW_ENABLED=true`,
   cadastrar uma senha forte e confirmar `401` sem credenciais / `200` com
   credenciais antes de divulgar qualquer URL.
