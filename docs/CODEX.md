# Protocolo obrigatório de contexto para novos chats

Este documento define o procedimento mínimo que o Codex — ou qualquer outra
IA que assuma o projeto 6DNX — deve cumprir **antes de analisar, planejar ou
alterar o repositório em um novo chat**.

O objetivo é impedir que uma conversa nova recomece o projeto do zero, repita
trabalho concluído, contradiga decisões aprovadas, perca alterações locais ou
confunda um experimento com o estado real do produto.

## Regra principal

Um novo chat **não está autorizado a modificar arquivos** enquanto não:

1. localizar e confirmar a raiz correta do repositório;
2. ler integralmente os documentos obrigatórios abaixo;
3. verificar o estado atual do Git sem alterar o worktree;
4. inspecionar os arquivos de código diretamente relacionados à tarefa;
5. declarar o entendimento do objetivo, do estado atual e do impacto esperado.

Não é suficiente confiar no histórico resumido da conversa, em screenshots
antigos ou em uma descrição isolada do usuário. A verdade operacional deve ser
reconstruída a partir da documentação atual, do código e do Git.

## Leitura obrigatória, nesta ordem

Todo novo chat deve ler integralmente:

1. [`../AGENTS.md`](../AGENTS.md) — regras operacionais autoritativas para
   agentes, segurança, validação e limites de publicação;
2. [`../README.md`](../README.md) — visão geral e estado resumido do produto;
3. [`README.md`](README.md) — índice completo da documentação;
4. [`PROJECT_STATE.md`](PROJECT_STATE.md) — onde o trabalho parou, decisões
   confirmadas, entregas realizadas e pendências;
5. [`PRODUCT.md`](PRODUCT.md) — propósito, público e verdade comercial;
6. [`DESIGN.md`](DESIGN.md) — linguagem visual, camadas, movimento e
   acessibilidade;
7. [`governance/REGRAS_DO_PROJETO.md`](governance/REGRAS_DO_PROJETO.md) —
   conjunto consolidado de regras humanas e técnicas.

Se a tarefa alterar Next.js, o agente também deve ler a documentação relevante
da versão instalada em `node_modules/next/dist/docs/` antes de escrever código.
Este projeto usa uma versão com mudanças incompatíveis com conhecimentos
genéricos ou antigos de Next.js.

## Leitura adicional por área

Depois da leitura obrigatória, carregue somente o contexto adicional relacionado
ao pedido atual:

| Área da tarefa | Contexto adicional obrigatório |
| --- | --- |
| Catálogo, cards, preços ou variações | [`CATALOG_AUDIT.md`](CATALOG_AUDIT.md), [`MAPA_EDITORIAL_31_ENTRADAS.md`](MAPA_EDITORIAL_31_ENTRADAS.md), `lib/products.ts` e `lib/product-catalog-layout.ts` |
| Checkout ou pagamentos | [`COMMERCE_ARCHITECTURE.md`](COMMERCE_ARCHITECTURE.md), [`CATALOG_PAYMENT_LAB.md`](CATALOG_PAYMENT_LAB.md) e as rotas em `app/api/checkout/` |
| Login, permissões ou entrega | [`AUTORIZACAO_AUTENTICACAO_6DNX.md`](AUTORIZACAO_AUTENTICACAO_6DNX.md) |
| Supabase ou banco de dados | [`ESTADO_BANCO_SUPABASE_6DNX.md`](ESTADO_BANCO_SUPABASE_6DNX.md), migrations e código de acesso ao banco |
| Vercel, variáveis ou publicação | [`VERCEL_ENVIRONMENT.md`](VERCEL_ENVIRONMENT.md) e [`REVIEW_HANDOFF.md`](REVIEW_HANDOFF.md) |
| Segurança | [`AUDITORIA_SEGURANCA.md`](AUDITORIA_SEGURANCA.md), rotas afetadas e limites de confiança |
| Hero, personagens, animações ou layout | `components/hero-section.tsx`, `components/cinematic-companions.tsx`, `app/globals.css` e os assets envolvidos |
| Radar de notícias | `lib/news/`, `app/api/cron/news/`, `vercel.json` e migrations relacionadas |

Screenshots em `discord-imagens/` e documentos históricos servem como evidência,
mas não substituem `lib/products.ts` como modelo executável do catálogo.

## Verificação obrigatória do repositório

Antes de editar, execute apenas verificações de leitura:

```powershell
git status --short
git branch --show-current
git log -5 --oneline --decorate
git remote -v
```

O novo chat deve identificar:

- arquivos modificados ou não rastreados;
- alterações que já pertencem ao usuário ou a outro agente;
- branch atual e commits recentes;
- remoto correto antes de qualquer futura publicação;
- possíveis trabalhos incompletos que não podem ser sobrescritos.

Um worktree sujo não deve ser limpo, restaurado ou reorganizado sem autorização
explícita. Nunca usar operações destrutivas para “voltar ao estado inicial”.

## Relatório inicial obrigatório

Antes da primeira alteração, o agente deve fornecer ao usuário um resumo curto
no seguinte formato:

```text
Contexto carregado:
- objetivo atual do 6DNX;
- ponto em que o projeto parou;
- arquivos e sistemas afetados pelo pedido;
- alterações locais que precisam ser preservadas;
- impacto e possíveis efeitos colaterais;
- validações que serão executadas.
```

Se houver contradição entre documentos, código e pedido atual, o agente deve
apontá-la antes de escolher uma interpretação. Não deve preencher lacunas
inventando preço, disponibilidade, vídeo, credencial, regra comercial ou estado
do banco.

## Regras durante a execução

- Respeitar a arquitetura e a tipagem existentes.
- Preservar alterações locais não relacionadas.
- Manter segredos fora de código, logs, screenshots, Markdown e commits.
- Não imprimir valores de `.env.local`; quando necessário, verificar somente
  nomes, presença e escopo por um processo seguro.
- Não ativar pagamento real, aplicar migration, alterar produção, fazer deploy,
  commit ou push sem autorização humana explícita.
- Fazer análise de impacto antes de modificar arquivos legados, rotas, banco,
  checkout, autenticação ou automações.
- Usar fontes oficiais e o código atual como evidência, não suposições.

## Encerramento e continuidade

Após trabalho significativo, o agente deve:

1. atualizar [`PROJECT_STATE.md`](PROJECT_STATE.md) com o que mudou e o que
   continua pendente;
2. atualizar este índice ou outros documentos afetados;
3. executar, conforme o impacto, `npm run lint`, `npx tsc --noEmit`,
   `npm run build` e validação visual em desktop e mobile;
4. registrar limitações, decisões humanas pendentes e qualquer validação que
   não pôde ser concluída;
5. informar claramente se houve ou não commit, push, migration ou deploy.

## Critério de contexto carregado

O contexto só pode ser considerado carregado quando o novo chat consegue
responder, com base em evidências:

- o que é o 6DNX;
- qual é o estado executável atual;
- onde o trabalho anterior terminou;
- quais regras são inegociáveis;
- quais arquivos controlam a área solicitada;
- o que está modificado no worktree;
- o que ainda depende de autorização ou decisão humana.

Se uma dessas respostas não estiver clara, a etapa de contexto ainda não
terminou e nenhuma alteração deve começar.
