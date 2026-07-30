# Auditoria severa de segurança e bugs — 6DNX

Auditoria pré-commit realizada em 29 de julho de 2026. Nenhum pagamento real,
webhook, migration, push ou deploy foi executado durante a revisão.

## Veredito simples

O código pode ser commitado como laboratório privado, mas **não está pronto
para venda real nem lançamento público**. O checkout real permanece ausente e
o deploy que está online ainda é uma versão anterior, publicamente acessível.

Antes de qualquer push para `main`, configure a senha de revisão na Vercel. O
novo código falha fechado na Vercel: sem configuração explícita, responderá
`503` em vez de publicar o catálogo por acidente.

## Evidências verificadas

| Verificação | Resultado |
| --- | --- |
| Segredos no working tree versionado | Nenhum padrão de alta confiança encontrado |
| Segredos no histórico Git alcançável | Nenhum padrão de alta confiança encontrado |
| `.env.local` | Ignorado pelo Git, não versionado, sem chaves duplicadas |
| Formato das chaves locais usadas | URLs, hosts e comprimentos essenciais coerentes; valores não foram exibidos |
| Dependências de produção | `npm audit --omit=dev`: 0 vulnerabilidades |
| Ferramentas de desenvolvimento | 9 alertas altos na árvore ESLint/minimatch; ver risco residual abaixo |
| Site publicado em `6dnx.vercel.app` | `200`, sem a nova proteção; deploy anterior |
| `robots.txt` publicado | `404` no deploy anterior |
| Cron sem segredo | `401`, como esperado |
| Supabase `news_articles` com chave pública | `404 PGRST205`: tabela ainda não aplicada |
| StorM Wallet na Vercel | Três variáveis live somente em Production |
| Variáveis de revisão na Vercel | Ausentes no momento da auditoria |

## Falhas corrigidas neste commit

1. **Spam no Discord:** removido o `POST /api/redirect` legado. A interface só
   usa `GET` para abrir o suporte, sem criar mensagens ou tickets.
2. **Payloads inválidos:** APIs JSON agora exigem `Content-Type:
   application/json`, limite de bytes e objeto JSON. `null`, listas e tipos
   incorretos deixam de causar erro `500`.
3. **Origem de checkout:** POSTs do laboratório exigem `Origin` exatamente
   igual ao site.
4. **Redirecionamento do cliente:** a resposta do checkout só é aceita quando
   aponta para `/checkout/test` na mesma origem.
5. **Radar de notícias:** datas, tamanhos, slugs, URLs e hosts vindos do
   Supabase/Steam são validados antes de chegar ao React.
6. **Cron:** comparação do Bearer em tempo constante, respostas `no-store` e
   erros internos removidos da resposta pública.
7. **Revisão privada:** a Vercel fica bloqueada por padrão, com cabeçalhos de
   anti-indexação, anti-iframe, MIME, referrer e permissões. `no-store` só
   substitui o cache quando a revisão privada está realmente ativa.
8. **RLS preparada:** a migration revoga escrita de `anon/authenticated`,
   concede somente leitura publicada e limita os campos ingeridos.
9. **Modal de produtos:** foco inicial/restaurado, `aria-modal`, tecla Escape,
   contenção de Tab e fundo inerte.
10. **Higiene local:** `tmp/` passou a ser ignorado e uma URL inválida de
    metadados não derruba mais o build.
11. **Memória das fontes externas:** respostas JSON da Steam/Supabase e XML
    dos feeds são lidas por stream com teto de bytes antes do parse. Campos e
    URLs também têm limites, evitando que uma origem anormal consuma memória
    sem controle.

## Riscos que continuam abertos

### Alta prioridade

- **Produção ainda pública:** o domínio atual usa um deploy anterior. A correção
  só terá efeito depois de configurar as variáveis de revisão e publicar um
  novo SHA.
- **Radar sem persistência:** `public.news_articles` não existe no Supabase.
  Hoje o site depende das fontes oficiais em tempo real e do conteúdo reserva;
  o cron não consegue manter histórico durável.
- **Segredos excessivos na Vercel:** `SUPABASE_DB_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, dados do bot Discord e variáveis Mercado Pago
  continuam cadastrados em Preview e Production apesar de não serem usados
  pelo runtime atual. Isso aumenta o impacto de uma futura falha.
- **Catálogo sem aprovação comercial:** preços, direitos de revenda, vídeos,
  regras de reembolso e autorização para cada item ainda não formam uma fonte
  canônica aprovada.

### Risco de laboratório

- O checkout usa memória do processo. Em serverless, criar e concluir uma
  sessão podem cair em instâncias diferentes e a sessão desaparecer.
- O rate limit também é por instância e não substitui Vercel Firewall/KV.
- Discord é apenas notificação. Não existe pedido persistente, idempotência,
  reconciliação, reembolso ou prova financeira.
- HTTP Basic é adequado apenas para revisão temporária; não oferece usuários
  individuais, revogação granular nem trilha de auditoria.
- A política CSP atual bloqueia incorporação em frames, mas ainda não restringe
  todas as origens de scripts, estilos e conexões. Uma CSP completa com nonce
  deve ser projetada e testada antes do lançamento público.
- O projeto ainda não possui suíte automatizada de testes unitários/E2E.

### Dependências de desenvolvimento

O audit completo reporta 9 alertas altos em `eslint`, plugins e `minimatch`,
relacionados a expansão de padrões capaz de consumir memória. Eles não entram no
bundle/runtime de produção. O `npm audit fix` disponível exige ESLint 10 e/ou
propõe downgrade incompatível de `eslint-config-next`; por isso não foi aplicado
automaticamente. Até haver atualização compatível do Next, execute lint apenas
em código/configuração confiáveis e em ambiente isolado.

## O que o Codex não resolveu — e por quê

Estas são limitações deliberadas de segurança, não tarefas esquecidas:

1. **Não ativou cobrança Pix/StorM:** não há contrato oficial da API, sandbox,
   esquema de criação/consulta, assinatura HMAC confirmada, preços canônicos,
   pedidos persistentes nem política de reembolso. Usar a chave live nessas
   condições pode cobrar pessoas ou aceitar confirmação falsa.
2. **Não aplicou a migration:** ela altera o Supabase remoto. As regras do
   projeto exigem revisão humana antes de DDL.
3. **Não enviou webhook de teste:** o `.env.local` aponta para serviços reais;
   disparar a rota criaria mensagens externas e não é necessário para uma
   auditoria de código.
4. **Não removeu variáveis da Vercel:** é uma mudança externa de credenciais e
   escopo. O proprietário deve confirmar os alvos antes da remoção.
5. **Não comparou valores Vercel x local:** variáveis Sensitive aparecem apenas
   como `Encrypted`; a plataforma não devolve o conteúdo para conferência.
6. **Não certificou Google OAuth:** o frontend ainda não implementa login. O
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` está cadastrado, mas não é consumido pelo
   código atual; o provedor efetivo está no painel Supabase.
7. **Não certificou produtos que envolvem tokens de conta, alteração de KWID ou
   contorno de anti-cheetos:** isso exige prova de propriedade, autorização do
   parceiro, análise jurídica e compatibilidade com os termos das plataformas.
   Sem isso, não é seguro conectá-los a cobrança real.
8. **Não fez push nem deploy:** esta tarefa autorizou o commit. Publicação em
   Production exige a validação humana descrita abaixo.
9. **Não concluiu a automação visual no navegador integrado:** a política de
   segurança do navegador bloqueou o controle de `http://localhost:3127`,
   embora a mesma URL tenha respondido `200` na verificação HTTP. Não houve
   tentativa de contornar o bloqueio. Build, rotas e a implementação compilada
   do modal foram validados localmente; a conferência visual humana em desktop
   e mobile continua obrigatória antes do push.

## Validações locais executadas

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- servidor público de laboratório: respostas válidas para página, asset,
  `robots.txt`, cron sem Bearer e payloads JSON inválidos/válidos;
- Vercel sem senha configurada: `503` e `private, no-store`;
- revisão configurada: `401` sem Basic, `401` com credencial errada e `200`
  com credencial válida;
- checkout sem `Origin`: `403`; `POST /api/redirect`: `405`;
- nenhum webhook real, cobrança, migration, push ou deploy foi disparado.

## Checklist obrigatório antes do próximo push

1. Na Vercel, criar em Production e Preview:
   `SITE_REVIEW_ENABLED=true`, `SITE_REVIEW_USER` e uma
   `SITE_REVIEW_PASSWORD` aleatória com 16+ caracteres.
2. Retirar de Preview as credenciais live/administrativas não necessárias,
   especialmente banco direto, service role, bot Discord e provedores de
   pagamento. Se Preview precisar delas, usar projetos e chaves separados.
3. Manter `PAYMENT_TEST_MODE` ausente/`false` em Production.
4. Revisar e aplicar a migration do Radar em ambiente controlado.
5. Testar: `401` sem Basic, `200` com Basic, `robots.txt` com `Disallow: /`,
   cron `401` sem Bearer e nenhum checkout real ativo.
6. Só então autorizar push/deploy e confirmar o SHA publicado.
