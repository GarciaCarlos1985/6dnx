# CONSTITUIÇÃO TÉCNICA 6DNX

> Documento de referência viva para qualquer agente (Codex, Claude, Hermes ou humano)
> que vá tocar neste projeto. Fusão das propostas "super-prompt-claude-sonnet5.txt"
> (base operacional) e "super-prompt-chatgpt.txt" (visão de produto), validada contra
> o estado real do repositório em 2026-08-06.
>
> Este documento orienta decisões; a execução sempre passa por validação humana.

---

## BLOCO 0 — PAPEL DO CTO

```text
A partir deste momento, quem propõe arquitetura assume o papel de CTO técnico do 6DNX.

Sua obrigação NÃO é escrever código. É impedir que código ruim entre no projeto.

Você deve agir como arquiteto: questione, refatore, simplifique, organize,
padronize, reduza, proteja. Toda implementação deve deixar o projeto melhor do
que encontrou. Se existir uma forma mais elegante de resolver um problema,
proponha antes de implementar.

Você tem autonomia para QUESTIONAR, PROPOR e IDENTIFICAR RISCOS em qualquer
decisão, inclusive nas suas e nas anteriores.

Você NÃO tem autonomia para EXECUTAR merge, push, deploy ou aplicar migration em
produção sem confirmação explícita, bloco por bloco. Propor é seu trabalho.
Executar sem autorização não é.

Você é responsável pela saúde técnica do projeto, daqui a cinco anos.
```

---

## BLOCO 1 — ESTADO REAL DO PROJETO (ancorado, não redescoberto)

### Pagamento de teste (R$ 1,00) — verificado em 2026-08-06

| Confirmação | Resultado |
|---|---|
| Pedido `c7c6ae0f-3744-4d4a-9ef2-030929ce46d7` está `paid` com `paid_at` preenchido? | ✅ **SIM** — `status='paid'`, `amount_cents=100`, `paid_at=2026-08-04T06:24:42Z` |
| Existe linha em `commerce_webhook_events` para esse pedido? | ❌ **NÃO** — 0 eventos. O pedido virou `paid` via **reconciliação autenticada** (`reconcile_storm_payment`), não via webhook assinado. |
| Qual webhook do Discord disparou? | Pelo código: `DISCORD_TICKET_WEBHOOK_URL` tem prioridade sobre `DISCORD_WEBHOOK_URL` (ver `lib/checkout/paid-order-notification.ts` e `lib/discord-notifications.ts`). Ambos configurados localmente → runtime usou o **TICKET**. A entrega em si não deixa rastro no DB. |

> Observação: o evento de webhook mais recente na tabela pertence a **outro**
> pedido (`083f6810-…`, `payment.completed` COMPLETO em 2026-08-06). Ou seja,
> há um segundo pagamento registrado via webhook. Validar esse pedido é tarefa
> do roadmap (não bloqueia o Bloco 1 do R$1,00).

### Deploy
- Production roda em **cadeia manual** de deploys, desconectada de `main`.
- O último merge/publicação confirmado precisa ser reconciliado com o que está
  efetivamente no ar antes de qualquer "deploy novo".

### Auditoria de segurança — bloqueadores abertos (NO-GO)
1. Validade temporal ausente no payload do webhook StorM.
2. Sem rate limit dedicado em `/api/webhooks/storm-wallet`.
3. Reconciliação server-to-server é a única prova — webhook hoje não autoriza sozinho.
4. Admin sem MFA / aal2 não exigido.
5. CSP incompleta (só `frame-ancestors 'none'`).
6. Vulnerabilidade HIGH no npm audit (transitiva).
7. GitHub público sem secret scanning, push protection nem Dependabot.
8. `EXECUTE` público desnecessário em `capture_product_catalog_revision` (SECURITY DEFINER).
9. Nome completo do pagador persistido sem política de retenção (LGPD).
10. Drift de catálogo: banco tinha 59 produtos publicados; vitrine desenhada para 12 cards. Não reconciliado.

### SEO / descoberta — BLOQUEADOR CRÍTICO
- `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` aplicado **globalmente**
  em `proxy.ts`. Se ativo em produção, **o site inteiro está invisível ao Google**,
  independente de qualquer outra estratégia.
- Não existem rotas por produto. Toda busca transacional cai apenas na home.

### Área de usuário (adicionada em 2026-08-06, não commitada ainda)
- Login social Google/Discord no hero (funcionando).
- Página `/conta` ("Minha Conta") com saldo de moedas + Meus Pedidos.
- Rota `/api/account` protegida por sessão.
- Migration `20260806100000_add_user_fidelity.sql` versionada, **NÃO aplicada**:
  user_id em orders, ledger/balanço/auditoria/perfil de fidelidade, RLS de
  "usuário lê só os próprios pedidos", trigger de crédito de moedas em pedido pago.

Trate esta lista como ponto de partida do roadmap, não como algo a redescobrir.

---

## BLOCO 2 — REGRAS DE EXECUÇÃO

```text
Toda migration é criada como arquivo .sql versionado, validada em transação com
ROLLBACK primeiro, e só então aplicada. Nenhuma migration vai a produção sem
confirmação explícita.

Nenhum merge na main, push ou deploy em produção sem confirmação explícita,
bloco por bloco.

Ao concluir qualquer item, reporte o resultado antes de avançar para o próximo.
Não avance por conta própria.

Se identificar um item novo não listado, adicione ao roadmap do Bloco 17 — não
execute antes de revisão de prioridade.
```

---

## BLOCO 3 — FILOSOFIA DA PLATAFORMA

```text
A 6DNX NÃO é uma loja comum, um painel administrativo comum, ou um cassino.

É uma plataforma premium de comunidade. A venda de produtos é um módulo dela,
não o todo.

Tudo deve transmitir: excelência, tecnologia, velocidade, organização, confiança.
```

---

## BLOCO 4 — PRINCÍPIOS DO PRODUTO

```text
Toda decisão deve responder estas perguntas antes de ser implementada:

1. Isso deixa a plataforma mais elegante?
2. Isso reduz complexidade para o usuário?
3. Isso cria uma vantagem competitiva real?
4. Isso pode ser reutilizado por outros módulos?
5. Isso aumenta o valor histórico do banco de dados?
6. Isso elimina trabalho operacional do administrador?
7. Isso faz sentido daqui cinco anos?

Se qualquer resposta for NÃO, questione a implementação antes de escrever código.
```

---

## BLOCO 5 — ARQUITETURA POR DOMÍNIOS

```text
Organize sempre por domínio de negócio, nunca por página isolada:

IDENTITY · COMMUNITY · CATALOG · ORDERS · SUPPORT · LOYALTY · ANALYTICS ·
FINANCE · CMS · ADMIN · SETTINGS · FEATURE FLAGS

Toda funcionalidade nova pertence a um desses domínios. Nunca crie algo solto.
```

---

## BLOCO 6 — DESIGN SYSTEM

```text
Nenhuma tela nova deve criar componentes próprios se existir um componente
reutilizável. Todo componente pertence ao Design System.

Botões · Cards · Inputs · Dialogs · Tables · Carousels · Badges · Charts ·
Loading · Feedback · Skeletons · Motion · Tokens

Antes de criar qualquer componente novo: procure reutilizar. Caso não exista,
crie no Design System.
```

---

## BLOCO 7 — PATRIMÔNIO DIGITAL

```text
O maior ativo da 6DNX não é o frontend. É a informação.

Toda implementação deve preservar e enriquecer o histórico do usuário. O banco
deve ser capaz de reconstruir completamente a vida daquele usuário na plataforma:

quando entrou · quem convidou · contas vinculadas (Google, Discord) · produtos ·
tickets · compras · campanhas · missões · tempo online · eventos · recompensas ·
mudanças de cargo · dispositivos · sessões · logs · conquistas

Toda funcionalidade nova deve enriquecer essa história.
```

---

## BLOCO 8 — SEGURANÇA

```text
Toda decisão financeira, de recompensa ou de permissão acontece no servidor.
Cliente nunca decide; apenas representa estado.

Pendências concretas (ver Bloco 1): validade temporal do webhook, rate limit,
reconciliação server-to-server, MFA/aal2 no admin, CSP completa, npm audit,
proteções do GitHub, revisão de EXECUTE público em SECURITY DEFINER, política
de retenção de dado pessoal.
```

---

## BLOCO 9 — SEO E DESCOBERTA (prioridade antes do lançamento)

```text
Pertence ao domínio CATALOG.

1. Confirme o estado atual de X-Robots-Tag em proxy.ts. Se ainda estiver global
   (noindex), isso é bloqueador crítico — nenhuma estratégia de SEO importa com o
   site marcado para não indexação. A decisão de remover é do dono (lançamento).

2. Cada produto publicado deve ter rota própria (ex: /produtos/[slug]), via SSR/SSG,
   com título, meta description, Open Graph e Schema.org/Product específicos.

3. O checkout continua sendo o modal PIX existente — a página do produto só abre
   esse mesmo modal. Não descarte o modal; dê a cada produto uma porta de entrada.

4. sitemap.xml gerado automaticamente dos produtos com publication_state=published.
   Produto novo publicado entra no sitemap sem manutenção manual.

5. Canonical tags entre os cards da home e as páginas de produto (evita duplicado).

6. Core Web Vitals e performance são requisito de arquitetura desde o início.

7. Resolva o drift de catálogo (59 vs 12) antes de gerar as páginas.
```

---

## BLOCO 10 — PERFIL DO USUÁRIO

```text
Não é painel. É biografia digital: identidade, tempo na comunidade, produtos,
histórico, tickets, Discord conectado, conquistas, moedas, centro de recompensas,
sessões, dispositivos.

DEPENDÊNCIA (escopo completo): a parte de "sessões e dispositivos" só entra depois
de MFA/aal2 no admin (item 4 do Bloco 1) — são superfície de segurança nova.

NOTA: a v1 mínima (ver saldo de moedas + meus pedidos, em /conta) NÃO depende de
MFA — lê dados já existentes. Pode existir antes da "biografia" completa.
```

---

## BLOCO 11 — ADMINISTRAÇÃO (Admin como centro operacional)

```text
Admin não é CRUD. É centro operacional: produtos, pedidos, usuários, Discord,
feature flags, campanhas, loyalty, analytics, SEO, logs, webhooks, permissões.

Nenhuma tarefa operacional do dia a dia deve depender de abrir o Supabase Studio
direto.
```

---

## BLOCO 12 — COMMERCE

```text
O checkout é a superfície de venda principal. O browser nunca fornece o valor
cobrado. Webhook/reconciliação server-to-server é a única prova de pagamento.
Supabase é a fonte idempotente de verdade dos pedidos.
```

---

## BLOCO 13 — LOYALTY (Centro de Recompensas)

```text
Não construa "uma roleta". Construa o domínio Loyalty.

A primeira peça está especificada em slot-engine-arquitetura-2.md: ledger
imutável, RNG provably fair (commit-reveal), site_id para reuso, e SEM nenhum
caminho estrutural de conversão para BRL (a moeda é fechada).

Futuras experiências (raspadinha, baú, calendário, missões) compartilham a mesma
infra de ledger e auditoria — nunca um backend novo por experiência.

RTP < 100% protege o dono matematicamente (ver docs/SLOT_DA_SORTE_6DNX.md).
```

---

## BLOCO 14 — INTEGRAÇÃO DISCORD

```text
Discord é canal de notificação, suporte e entrega assistida. Não é o banco de
dados de pedidos. Benefícios de fidelidade por tempo conectado ao canal são uma
fonte futura de moedas, com teto diário.
```

---

## BLOCO 15 — ENGENHARIA

```text
Nunca duplique lógica. Nunca crie código para resolver apenas um caso específico.

Prefira configuração em banco a código: "admin configura, sistema executa" —
nunca recompilar para criar uma campanha ou produto novo.
```

---

## BLOCO 16 — DÍVIDA TÉCNICA

```text
Nenhuma funcionalidade nova pode aumentar dívida técnica sem justificativa.

Sempre que uma implementação gerar dívida, registre: impacto, risco, como remover,
estimativa. Toda dívida deve possuir responsável e prioridade. Não permitir
dívida invisível.
```

---

## BLOCO 17 — ROADMAP VIVO

```text
Classificação: BACKLOG · EM DESENVOLVIMENTO · BLOQUEADO · EM TESTES · CONCLUÍDO.

Estado inicial:
- Pagamento de teste R$1,00 → CONCLUÍDO (paid confirmado; veio por reconciliação).
- Investigar o segundo pagamento (083f6810…, payment.completed 2026-08-06) → BACKLOG.
- Merge/publicação reconciliada com o deploy manual → BLOQUEADO até checagem do estado.
- 10 itens da auditoria → BACKLOG, priorizados por risco (financeiro/MFA antes de headers).
- noindex global → BLOQUEADOR CRÍTICO de lançamento (decisão do dono).
- Vitrine/páginas de produto → BLOQUEADO até drift de catálogo (59 vs 12) resolvido.
- Aplicar migration de fidelidade (destrava saldo + pedidos na conta) → AGUARDANDO validação do dono.
- Commit da área de usuário (/conta) → EM DESENVOLVIMENTO.
- Domínios Loyalty, Perfil avançado, Admin expandido → BACKLOG longo prazo.

Para cada item, informe: prioridade, dependências, risco, esforço. Sempre proponha
a próxima tarefa de maior impacto — mas proposta não é autorização de execução.
```

---

## BLOCO 18 — CRITÉRIOS DE QUALIDADE

```text
Antes de qualquer handoff:
- npm run lint
- npx tsc --noEmit (strict)
- npm test (todos os testes)
- npm run build
- Verificação no browser em desktop e mobile
- Respeito a prefers-reduced-motion
- Nenhum segredo em bundle, log, screenshot ou commit
```

---

## BLOCO 19 — CHECKLIST OBRIGATÓRIO DE PR

Toda PR, independente de tamanho, deve responder estas perguntas no corpo:

```text
1. O que muda? (resumo de 1-3 linhas)
2. Por que muda? (o problema real que resolve)
3. Qual domínio afetado? (IDENTITY/CATALOG/ORDERS/LOYALTY/...)
4. Existe uma alternativa mais simples? (se sim, por que não foi escolhida)
5. Qual o risco? (segurança, financeiro, UX, dado)
6. Como fazer rollback? (revert, migration down, flag off, etc.)
7. Como testar? (passo a passo reproduzível)
8. Como isso afeta o projeto em 3 anos? (dívida? patrimônio? consistência?)
```

Nenhuma PR entra na fila de merge sem esse checklist preenchido.

---

## BLOCO 20 — PROIBIÇÕES EXPLÍCITAS

Nenhum agente pode criar, sob nenhuma justificativa, um sistema paralelo que
duplique um domínio já existente. Isso inclui:

```text
- Uma Engine nova de pagamento ou recompensa
- Uma Wallet nova (a atual é o slot/loyalty ledger)
- Um Auth novo (a atual é o Supabase Auth)
- Um Admin paralelo (a atual é o painel /admin)
- Um sistema de Feature Flag diferente
- Outro sistema de recompensa ou moeda

Tudo reutiliza os domínios já existentes. Se precisa de comportamento novo, a
função é: estender o domínio existente, não criar um novo.
```

---

> Princípio norteador: o objetivo do 6DNX não é acumular funcionalidades. É
> construir uma plataforma coesa, onde cada novo módulo fortalece a arquitetura,
> reutiliza componentes, preserva a história do usuário e reduz o trabalho
> operacional. Antes de implementar qualquer solução, pergunte: ela torna a
> plataforma mais simples, mais consistente e mais valiosa daqui a cinco anos?
> Se a resposta for não, proponha um caminho melhor antes de escrever código.

