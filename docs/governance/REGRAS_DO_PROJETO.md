# Regras consolidadas do projeto 6DNX

> **Sincronizado em 2026-08-03:** existe uma integração StorM server-only já
> exercitada com um PIX real controlado. Ela continua desligada para novos
> clientes. A correção original da RPC já foi aplicada, a StorM informou que não
> reenvia callbacks e a reconciliação complementar está validada somente no
> worktree local. As regras abaixo devem ser lidas junto de `PROJECT_STATE.md`;
> snapshots antigos de laboratório não anulam o estado mais recente.

Atualizado em 29 de julho de 2026.

Este documento apresenta as regras em formato humano. `AGENTS.md`, mantido na
raiz, continua sendo a instrução operacional autoritativa para agentes e deve
ser consultado antes de alterar código.

## Identidade técnica

O projeto deve ser tratado como uma aplicação Next.js, TypeScript, Tailwind,
Supabase e Vercel com exigência de:

- tipagem estrita;
- arquitetura modular;
- segurança por padrão;
- desempenho previsível;
- documentação rastreável;
- validação proporcional ao risco;
- revisão humana antes de produção.

Antes de escrever código Next.js, consulte a documentação instalada em
`node_modules/next/dist/docs/`, porque a versão usada pelo projeto possui APIs e
convenções diferentes de versões anteriores.

## Protocolo de mudança

1. Ler `AGENTS.md`, o `README.md` da raiz e os documentos indicados no índice
   `docs/README.md`.
2. Realizar análise de impacto.
3. Identificar dependências, rotas, serviços, variáveis e dados afetados.
4. Preservar alterações existentes que não pertençam à tarefa.
5. Implementar dentro da arquitetura atual ou propor refatoração estruturada.
6. Validar localmente.
7. Registrar decisões importantes em
   `docs/PROJECT_STATE.md`.
8. Não aplicar migration, publicar, fazer deploy ou usar credenciais live sem
   validação humana.

## Fonte de verdade

- Produto e variações atualmente publicáveis: `lib/products.ts`.
- Evidências históricas do catálogo:
  `docs/Produtos_Organizados.md` e `discord-imagens/`.
- Regra editorial 1:1:
  `docs/MAPA_EDITORIAL_31_ENTRADAS.md`.
- Estado operacional:
  `docs/PROJECT_STATE.md`.
- Variáveis e escopos:
  `docs/VERCEL_ENVIRONMENT.md`.
- Fluxo comercial futuro:
  `docs/COMMERCE_ARCHITECTURE.md`.

Nunca inventar preço, disponibilidade, vídeo, compatibilidade, estoque ou
autorização.

## Regra dos cards

O planejamento interno obedece:

```text
31 exemplos = 31 produtos = 31 cards
```

- Cada produto `Pxx` possui exatamente o card `Cxx`.
- Categorias organizam cards; não fundem produtos.
- Planos de duração ficam dentro do popup e não criam cards.
- Um registro pode permanecer como
  `PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO`. Esse rótulo registra uma pendência
  documental: não declara o produto `false`, não define bloqueio comercial e
  não substitui a decisão do proprietário.
- Observações técnicas e de conformidade ficam separadas do estado cadastral.
- Somente produtos descritos com dados verificáveis e aprovados pelo
  proprietário podem ser ligados a um checkout real.

## Regras visuais

- Linguagem escura, cinematográfica e vermelho-sangue, sem comprometer leitura.
- O anjo fica à direita e o operador à esquerda em uma única narrativa de
  scroll reversível.
- As poses são distribuídas do hero ao rodapé; a sequência não reinicia.
- Personagens ficam acima dos fundos e abaixo de texto, cards, notícias,
  controles, overlays e diálogos.
- O wrapper dos atores permanece com `pointer-events: none` e
  `overflow: visible`.
- Efeitos de ponteiro pertencem à camada reativa interna e respeitam
  `prefers-reduced-motion`.
- O feixe nasce no peito do personagem e permanece abaixo do conteúdo.
- A marca principal do hero é
  `/brand/6dorme-nois-xita-hero.png`, preservando proporção e silhueta.
- O fundo é contínuo; não reintroduzir divisórias rígidas entre seções.
- O olho circular permanece abaixo dos overlays e combina scroll com reação
  de ponteiro em camadas diferentes.

## Interação dos produtos

- Desktop: informação à esquerda, card selecionado ao centro e vídeo à direita.
- O card selecionado permanece visível acima do backdrop.
- Fechar restaura ordem e posição originais.
- Mobile: usar uma única sheet acessível e centralizada.
- Fechamento por botão, backdrop ou Escape.
- Travar scroll enquanto o diálogo estiver aberto.
- A navegação visual preserva `6 D N X`.
- Não usar números crus como fallback de paginação.
- A entrada inicial do catálogo é `D`.
- Clones luminosos do pager são apenas decorativos e reversíveis.

## Dados, autenticação e autorização

- Segredos ficam somente no servidor.
- Chave publicável do Supabase só pode acessar dados protegidos por RLS.
- `service_role` e chave secreta nunca chegam ao navegador.
- Login comprova identidade; papéis e RLS definem autorização.
- Autorização comercial e de mídia deve ser comprovada separadamente.
- Discord é notificação e suporte, não fonte de verdade financeira.
- O banco é a fonte futura de pedidos e pagamentos.

## Pagamentos

- O laboratório cenográfico continua isolado e nunca prova pagamento.
- A integração StorM real é server-only, usa preço canônico do banco e continua
  bloqueada em Production por flags explícitas.
- Um único PIX real autorizado de R$ 1,00 comprovou criação, liquidação no
  provedor, webhook e HMAC; o pedido ainda não está `paid` porque a RPC falhou.
- Não marcar pedido manualmente como pago. A reconciliação só pode consultar a
  cobrança existente, conferir IDs/valor exatos e usar migration versionada
  aplicada mediante autorização específica.
- Valor cobrado sempre vem do backend.
- Nunca confiar em valor, estado `paid` ou redirecionamento enviados pelo
  navegador.
- Webhooks devem validar assinatura no corpo bruto.
- Eventos precisam de idempotência, reconciliação e auditoria.
- Dados brutos de cartão, CVV e segredos não entram no banco nem no Discord.

## Notícias e automação

- Usar apenas Steam News API, Google AI Blog RSS e OpenAI News RSS.
- Não raspar resultados do Google Search.
- Leituras externas permanecem limitadas por tamanho e processadas por stream.
- O cron diário pertence à Vercel e roda às 12:00 UTC.
- `CRON_SECRET` é independente de GitHub PAT, tokens e outras credenciais.
- Falha de persistência deve ser reportada; coleta sem gravação não pode ser
  apresentada como histórico durável.

## Desempenho

- Grandes feeds, logs e arquivos devem usar streams ou buffers limitados.
- Não carregar datasets grandes integralmente na memória.
- Preferir CSS, SVG e transformações de `opacity`/`transform` a vídeos ou
  runtimes de partículas ilimitados.
- Eventos de ponteiro devem ser passivos e limitados por frame.
- Não adicionar dependência de runtime quando React, Next.js, CSS ou GSAP
  resolverem adequadamente.

## Segurança

- Não expor `.env.local`, tokens, webhooks, URLs privadas ou dados pessoais.
- Não testar proteção com operações que possam gravar ou apagar dados.
- Validar Supabase por catálogos, privilégios e leituras.
- Não executar automação destrutiva.
- Não aplicar DDL ou migrations sem revisão humana.
- Credenciais live não pertencem ao Preview.
- `VERCEL_TOKEN`, `SUPABASE_DB_URL` e credencial legada de `service_role`
  permanecem como ferramentas locais enquanto não houver necessidade
  server-side comprovada.

## Qualidade mínima

Antes de uma entrega com código:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Também validar:

- desktop;
- mobile;
- teclado;
- Escape e foco dos diálogos;
- `prefers-reduced-motion`;
- console do navegador;
- ausência de overflow horizontal;
- estados de erro e indisponibilidade.

Documentação pura deve, no mínimo, passar por conferência de caminhos, links,
contagens, referências e ausência de segredos.
