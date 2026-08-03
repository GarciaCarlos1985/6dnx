# 6DNX — revisão privada e continuidade

Atualizado em 2026-08-03. Este documento registra o que está pronto, o que
permanece deliberadamente inativo e como outro agente pode continuar o trabalho
permitido sem reconstruir o histórico.

## Retomada obrigatória — estado atual

0. O proprietário autorizou o lançamento público da vitrine em 2026-08-03.
   O release Git-backed contém 12 cards em quatro fileiras, rodapé/copyright,
   painel atualizado e o webhook StorM. Novas cobranças continuam desligadas;
   quando uma variação é escolhida, o CTA público é `Comprar pelo Discord`.

1. Um PIX real de R$ 1,00 foi criado e pago. A StorM marcou a cobrança como
   concluída e enviou o callback para Production.
2. O callback passou firewall, middleware, leitura limitada do corpo, HMAC e
   contrato do evento. A falha foi exclusivamente a RPC PostgreSQL: ambiguidade
   `ON CONFLICT (order_id)`, convertida pela rota em `422`.
3. O pedido continua `pending_payment`, sem `paid_at` e sem evento persistido.
   A oferta de teste foi suspensa e novas cobranças Production continuam
   desligadas.
4. A correção por nome de constraint foi comprovada com transação e rollback e
   depois aplicada de forma atômica pela migration versionada
   `20260803120000_fix_storm_payment_event_conflict.sql`. A migration consta no
   histórico do Supabase, preservou o pedido pendente e manteve a RPC restrita
   a `service_role`.
5. Para terminar a homologação faltam somente: replay original assinado
   pela StorM e confirmação final no banco e Discord. A tentativa enviada para
   `contato@stormapplications.com` voltou como endereço inexistente. O
   proprietário autenticou a conta geral StorM e abriu um ticket privado no
   Discord oficial solicitando o replay original assinado. O provedor ainda não
   respondeu nem confirmou o reenvio. Não criar outro PIX e não reconstruir o
   pagamento manualmente.
6. O release de lançamento consolida o webhook da PR #2 e a vitrine atual numa
   branch Git-backed revisada. O snapshot manual antigo permanece apenas como
   histórico/rollback; não volte a promovê-lo como se fosse a versão atual.
7. A conta administrativa recriada existia confirmada no Supabase, mas
   sem papel. Após autorização explícita foi promovida somente com
   `app_metadata.role=admin`, preservando os metadados do provedor e sem alterar
   senha. É necessário sair e entrar novamente para renovar o claim da sessão.
8. O código de seis dígitos abriu a conta geral StorM do proprietário. O ticket
   de suporte já foi aberto no Discord oficial e aguarda resposta; a senha
   própria da Wallet não é necessária para esse pedido e não deve ser
   compartilhada.

### Responsabilidades

- **Codex:** versionar/validar a correção; aplicá-la somente após autorização;
  verificar logs, pedido, tentativa e evento.
- **Proprietário:** acompanhar o ticket privado na StorM, conferir o Discord e
  decidir qualquer ativação de Production.
- **Operação durante o lançamento:** vendas seguem pelo Discord. Não criar as
  flags de checkout como `true`, não aprovar ofertas e não gerar outro PIX para
  substituir o replay pendente.
- **Retaguarda de segurança:** MFA/AAL2, CSP, freshness/rate limit,
  reconciliação e ferramentas do GitHub são endurecimentos posteriores à
  correção do R$ 1,00, embora devam ser tratados antes de divulgação em escala.

## Checkpoint histórico de produção de 2026-08-02

Os bullets abaixo preservam a cronologia daquele dia. Em caso de divergência,
prevalece a seção **Retomada obrigatória — estado atual** acima.

- Registro.br, Vercel e TLS estão corretos: `6dnx.com.br` redireciona para
  `https://www.6dnx.com.br/`, que responde `200`.
- A migration comercial `20260801100000_create_storm_commerce.sql` foi aplicada
  e registrada após validação transacional com rollback. Existem 157 ofertas,
  sendo 156 em `draft` e somente `Rust1 / 1 Dia` aprovada por R$ 1,00 para a
  homologação real controlada. Pedidos, tentativas e eventos continuam em zero.
  As quatro tabelas possuem RLS e a RPC financeira não é executável por `anon`.
- O endpoint `POST /api/webhooks/storm-wallet` foi publicado em Production num
  deployment manual `SgiQFdWP9`, do qual descendem os redeployments
  `4UdVjCSEz` e `HU8y57zmL`; esse snapshot não está ligado ao commit
  `57b7ea5`. Assinatura inválida retorna `401` e método `GET` retorna `405`; a
  rota real de criação de checkout não foi publicada e retorna `404`.
- O painel StorM aponta somente para
  `https://www.6dnx.com.br/api/webhooks/storm-wallet`. O segredo HMAC novo foi
  salvo na Vercel e a paridade local-Vercel foi homologada com corpo bruto
  assinado. O primeiro callback originado pelo provedor será observado no teste
  real controlado.
- Pagamentos continuam desligados em Production: as duas flags StorM estão
  ausentes. `STORM_WALLET_WEBHOOK_SECRET` e `CHECKOUT_DATA_HASH_SECRET` estão
  no escopo Production do projeto. A única oferta aprovada é a homologação de
  R$ 1,00 acessível pelo checkout local; nenhuma cobrança foi criada.
- O fundamento server-only foi commitado e enviado na PR rascunho #2. O
  worktree amplo e sujo não foi incluído; o deployment Production continua
  sendo o pacote mínimo publicado anteriormente.
- Não faça redeploy automático da `main` remota ainda: a implementação está na
  PR rascunho #2, mas ainda não foi revisada nem integrada à `main`.
- O `VERCEL_TOKEN` local deve ser revogado e substituído, pois a CLI o exibiu
  acidentalmente em uma sugestão de paginação nesta sessão.
- Na tentativa autorizada de homologação seguinte, a conta StorM respondeu
  `200` e `webhookConfigured=true`, mas o evento sintético assinado retornou
  `401`. A auditoria segura confirmou três valores locais inválidos: o campo
  `STORM_WALLET_WEBHOOK_SECRET` contém uma URL de webhook, não o secret HMAC;
  `CHECKOUT_DATA_HASH_SECRET` possui apenas 27 caracteres; e o novo
  `VERCEL_TOKEN` é rejeitado pela Vercel. Nenhum pagamento, commit, push ou
  ativação local ocorreu depois desse bloqueio.
- Depois da correção do secret HMAC e do hash local, a homologação passou: corpo
  bruto exato chegou à RPC (`422` somente por pedido sintético inexistente),
  corpo adulterado retornou `401` e header divergente retornou `400`. Banco
  permaneceu com zero pedidos, tentativas e eventos.
- O escopo isolado foi commitado em `0cfc263`, enviado para
  `codex/storm-webhook-hmac` e aberto como PR rascunho #2. Alterações visuais,
  admin e migrations adicionais continuam fora desse commit.
- O commit `0ed48ed` tornou o typecheck autocontido com `next typegen`. O job
  GitHub Quality e o Preview da Vercel estão verdes; os erros de `PageProps` e
  `RouteContext` foram eliminados sem alterar as assinaturas das rotas.
- `STORM_WALLET_CHECKOUT_ENABLED=true` está somente na `.env.local`; a flag de
  aprovação Production continua ausente. Uma requisição local vazia retornou
  `400` antes de qualquer chamada ao provedor. Nenhuma cobrança foi criada.
- O novo `VERCEL_TOKEN` continua inválido segundo a Vercel CLI e ainda precisa
  ser substituído; a publicação Git usou a sessão `gh` já autenticada.

## Checkpoint adicional de 2026-08-01

- `6dnx.com.br` foi adquirido, mas ainda não foi confirmado em Vercel/DNS/TLS;
  não trocar URLs canônicas ou callbacks até essa verificação.
- O checkout ganhou banner opcional 4:5 por produto e upload dedicado no painel;
  a migration `20260801170000_add_checkout_banner.sql` está preparada e não foi
  aplicada.
- A API key StorM respondeu em leitura, porém a conta informou
  `webhookConfigured=false`; o Supabase respondeu `PGRST205` para
  `commerce_offers`. Pagamento real e aviso de pago no Discord continuam
  impossíveis de validar com segurança.
- O laboratório local de R$ 1,00 voltou a aparecer explicitamente no checkout
  bloqueado. Ele não cria PIX, não movimenta dinheiro e nunca aparece em Vercel
  Production.
- A auditoria no navegador encontrou um webhook do Discord colocado por engano
  em `DEVELOPER_CREDIT_URL`. O código agora rejeita URLs de webhook antes de
  renderizar o rodapé, mas o proprietário precisa rotacionar a credencial já
  exposta e manter nessa variável somente um perfil/invite HTTPS público ou
  valor vazio.
- Gates deste checkpoint: `npm run lint`, `npx tsc --noEmit`, 18/18 testes e
  `npm run build` passaram; o painel de banner foi revisado no desktop e em
  390 x 844 sem overflow horizontal. Nenhuma migration, cobrança, commit, push
  ou deployment foi executado.
- O worktree contém trabalho significativo ainda sem commit. Um novo chat deve
  ler `AGENTS.md`, `README.md`, `docs/README.md`, `docs/PROJECT_STATE.md`,
  `docs/DESIGN.md`, `docs/PRODUCT.md` e inspecionar `git status --short` antes
  de qualquer edição.

## Estado de acesso

O código agora possui um modo de revisão por HTTP Basic Authentication em
`proxy.ts`. Ele protege páginas, APIs interativas, JavaScript, CSS e imagens.
Somente três superfícies ficam fora do desafio visual:

- `/robots.txt`, para comunicar `Disallow: /` aos buscadores;
- `/api/cron/*`, que continua exigindo seu próprio `CRON_SECRET`;
- `/api/webhooks/*`, que deve verificar a assinatura do provedor na própria
  rota.

Mesmo quando a senha está desativada, todas as respostas recebem
`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` e
cabeçalhos defensivos. `Cache-Control: private, no-store` é aplicado somente
durante a revisão autenticada/restrita, sem destruir o cache normal do site
quando a revisão estiver desligada. O layout também declara `noindex`, e
`app/robots.ts` bloqueia todo rastreamento.

Na Vercel, a ausência de `SITE_REVIEW_ENABLED` também ativa o bloqueio. Para
abrir o site publicamente será obrigatório definir `false` de forma explícita.

### Variáveis

Configure na Vercel, sem expor valores em Git ou no navegador:

```text
SITE_REVIEW_ENABLED=true
SITE_REVIEW_USER=6dnx
SITE_REVIEW_PASSWORD=<senha aleatória com no mínimo 16 caracteres>
```

Se o modo estiver ativo e a senha estiver ausente ou tiver menos de 16
caracteres, o site retorna `503` e permanece fechado. Production e Preview
devem usar senhas diferentes.

A auditoria técnica completa, riscos residuais e limites de atuação estão em
`AUDITORIA_SEGURANCA.md`.

### Validação antes do deploy

1. Sem credenciais, `/` deve retornar `401` com `WWW-Authenticate`.
2. Com credenciais válidas, `/` deve retornar `200`.
3. Com senha ausente ou curta, `/` deve retornar `503`.
4. `/robots.txt` deve responder sem autenticação e conter `Disallow: /`.
5. `/api/cron/news` deve continuar retornando `401` sem o Bearer correto.
6. Não faça o deploy de Production antes da revisão humana desses resultados.

### Lançamento público futuro

Definir `SITE_REVIEW_ENABLED=false` remove somente a exigência de usuário e
senha. Um lançamento público também precisa, no mesmo conjunto revisado:

- remover o `X-Robots-Tag` de revisão em `proxy.ts` (o `no-store` já é
  condicional ao modo privado);
- trocar `app/robots.ts` por regras públicas;
- retirar o bloco `robots` restritivo de `app/layout.tsx`;
- validar novamente cache, metadados, desktop, mobile e indexação.

Essa separação evita que uma variável alterada por engano publique e indexe
todo o catálogo imediatamente.

## Dados comerciais recebidos

`Produtos_Organizados.md` foi preservado sem alterações e sem corrigir preços.
Ele é uma fonte provisória de revisão, não o catálogo executável do site.

Problemas conhecidos:

- existem 31 títulos principais, mas o resumo consolidado lista 30;
- `Freezing` aparece no corpo e não aparece no resumo;
- o arquivo contém texto com codificação corrompida;
- o prompt de extração foi repetido 30 vezes dentro do conteúdo;
- um mesmo vídeo tutorial foi repetido em 26 referências;
- há possíveis associações incorretas de vídeos;
- os valores divergem de `CATALOG_AUDIT.md`, que veio dos prints do Discord.

Nenhum item, preço ou descrição desse documento foi promovido automaticamente
para o catálogo executável.

`lib/products.ts` agora contém sete serviços legítimos de referência:

- PC Performance Audit;
- Game Setup Pro;
- Aim Training Lab;
- Creator Identity Pack;
- Custom Steam Profile;
- Visual Presets;
- Stream Studio Setup.

Cinco artes originais foram criadas em `public/products/card-art/`; as artes já
existentes de Steam Profile e Visual Presets foram preservadas. Os valores
exibidos são rascunhos editoriais independentes, identificados na interface
como **referência**, e podem ser ajustados manualmente depois da aprovação do
proprietário.

## Trabalho que pode continuar

- confirmar os preços de referência, escopos e vídeos com o proprietário;
- substituir a prévia visual por vídeo próprio somente quando o material
  oficial de cada serviço estiver pronto;
- evoluir Custom Steam Profile, presets visuais permitidos, design e suporte;
- criar catálogo canônico com histórico de preço, disponibilidade e fonte;
- implementar o checkout profissional somente para itens comercialmente
  aprovados e permitidos.

## Trabalho não realizado

Itens ligados a tokens de conta, alteração de KWID, automação de mira ou
contorno de anti-cheetos não fazem mais parte do catálogo executável. O arquivo
`Produtos_Organizados.md` foi mantido apenas como material histórico de revisão
e não deve ser usado para recriar ofertas disfarçadas.

O laboratório agora transporta dois valores separados: o preço de referência
da variação e o total fixo simulado de R$ 1,00. O QR é decorativo e
deliberadamente não pagável. O checkout StorM Wallet real continua inativo.
Ainda faltam, para qualquer produto permitido:

- contrato oficial da API e ambiente sandbox;
- formato exato de criação e consulta de cobrança Pix;
- verificação documentada de `X-Storm-Signature` sobre o corpo bruto;
- tabelas de pedidos e eventos no Supabase com idempotência;
- regras de reembolso, privacidade, entrega e atendimento;
- teste ponta a ponta sem credencial live no ambiente de Preview;
- aprovação humana antes de migration, commit, push ou deploy.

Discord é notificação e suporte. Ele nunca deve ser usado como prova de
pagamento; o pedido canônico pertence ao banco e o webhook assinado confirma o
estado financeiro.
