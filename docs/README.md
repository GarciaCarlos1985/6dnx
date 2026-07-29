# Documentação 6DNX

Este diretório é a fonte central de documentação do projeto. O `README.md` da
raiz continua sendo a apresentação e o guia rápido; os documentos abaixo
guardam arquitetura, regras, decisões, auditorias e fontes históricas.

## Ordem recomendada de leitura

1. [`governance/REGRAS_DO_PROJETO.md`](governance/REGRAS_DO_PROJETO.md)
2. [`PRODUCT.md`](PRODUCT.md)
3. [`DESIGN.md`](DESIGN.md)
4. [`PROJECT_STATE.md`](PROJECT_STATE.md)
5. [`COMMERCE_ARCHITECTURE.md`](COMMERCE_ARCHITECTURE.md)
6. [`MAPA_EDITORIAL_31_ENTRADAS.md`](MAPA_EDITORIAL_31_ENTRADAS.md)
7. [`ESTADO_BANCO_SUPABASE_6DNX.md`](ESTADO_BANCO_SUPABASE_6DNX.md)

## Governança

| Documento | Finalidade |
| --- | --- |
| [`governance/REGRAS_DO_PROJETO.md`](governance/REGRAS_DO_PROJETO.md) | regras humanas consolidadas de produto, engenharia, segurança e validação |

`AGENTS.md` e `CLAUDE.md` permanecem na raiz porque são arquivos especiais
consumidos automaticamente pelas ferramentas de desenvolvimento. `AGENTS.md`
continua sendo a regra operacional autoritativa para agentes.

## Arquitetura

| Documento | Finalidade |
| --- | --- |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | memória operacional, decisões confirmadas, trabalho concluído e pendências |
| [`COMMERCE_ARCHITECTURE.md`](COMMERCE_ARCHITECTURE.md) | fluxo profissional de compra, estados e invariantes financeiros |

## Produto e design

| Documento | Finalidade |
| --- | --- |
| [`PRODUCT.md`](PRODUCT.md) | propósito, público, posicionamento e princípios do produto |
| [`DESIGN.md`](DESIGN.md) | paleta, tipografia, movimento, layout e direção editorial |

## Catálogo

| Documento | Finalidade |
| --- | --- |
| [`CATALOG_AUDIT.md`](CATALOG_AUDIT.md) | evidências históricas extraídas dos prints do Discord |
| [`CATALOG_PAYMENT_LAB.md`](CATALOG_PAYMENT_LAB.md) | fronteira entre catálogo, checkout de laboratório e pagamento real |
| [`MAPA_EDITORIAL_31_ENTRADAS.md`](MAPA_EDITORIAL_31_ENTRADAS.md) | regra 31 exemplos = 31 produtos = 31 cards e pendências de validação |

## Segurança e dados

| Documento | Finalidade |
| --- | --- |
| [`AUDITORIA_SEGURANCA.md`](AUDITORIA_SEGURANCA.md) | auditoria severa, riscos, limitações e checklist pré-publicação |
| [`AUTORIZACAO_AUTENTICACAO_6DNX.md`](AUTORIZACAO_AUTENTICACAO_6DNX.md) | diferença entre autenticação, autorização comercial, pagamento e entrega |
| [`ESTADO_BANCO_SUPABASE_6DNX.md`](ESTADO_BANCO_SUPABASE_6DNX.md) | estado medido do Supabase, lacunas e plano seguro de ativação |

## Operação e entrega

| Documento | Finalidade |
| --- | --- |
| [`REVIEW_HANDOFF.md`](REVIEW_HANDOFF.md) | continuidade, acesso privado e checklist de revisão |
| [`VERCEL_ENVIRONMENT.md`](VERCEL_ENVIRONMENT.md) | destino correto das variáveis entre Vercel, GitHub e computador local |

## Fontes históricas

| Documento | Finalidade |
| --- | --- |
| [`Produtos_Organizados.md`](Produtos_Organizados.md) | extração histórica recebida; não é catálogo aprovado nem fonte de autorização comercial |

`Produtos_Organizados.md` deve permanecer preservado como fonte histórica.
Correções editoriais e decisões pertencem aos demais documentos, nunca ao
arquivo-fonte.

## Regras de manutenção

- Novo documento explicativo deve entrar em `docs/`; use subpastas somente
  quando houver uma coleção que justifique a hierarquia.
- Atualize este índice ao criar, renomear ou remover documentação.
- Use caminhos relativos válidos entre documentos.
- Não coloque segredos, tokens, URLs privadas de webhook ou dados pessoais em
  Markdown.
- Mudanças relevantes também devem atualizar
  `PROJECT_STATE.md`.
- Migrations e código continuam em seus diretórios técnicos; `docs/` explica,
  mas não substitui a implementação.
