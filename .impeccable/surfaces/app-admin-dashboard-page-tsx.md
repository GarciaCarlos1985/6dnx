---
version: 1
slug: "app-admin-dashboard-page-tsx"
primary_target: "app/admin/(dashboard)/page.tsx"
related_targets:
  [
    "app/admin/(dashboard)/orientacoes/page.tsx",
    "app/produtos/[slug]/page.tsx",
    "app/jogos/page.tsx",
  ]
---

# Upgrade de navegação e orientação 6DNX

Implementação isolada em `codex/maycon-self-service`, a partir de `0521dad`.
Escopo autorizado em 18/10/2026: aproveitar o editor, navegar por jogo, oferecer
páginas de soluções e acessar a orientação correspondente após uma compra.
O usuário confirmou apresentação pública e guia adicional exclusivo para
compras confirmadas. Código e SQL foram validados localmente; Git na `main`
foi autorizado. A migration remota exige validação humana separada.

## Impacto

- Catálogo: campo opcional de jogo, sem inferir agrupamento pela categoria.
- Vitrine: atalhos de jogo e links para páginas completas; popup preservado.
- Administração: central de jogos/orientações, edição de jogo e guia separado.
- Conta: acesso ao guia pelo pedido e identidade autenticada, validado no servidor.
- Banco: migration aditiva para vínculo de jogo e guias com rascunho/publicação.
  Não altera preços, IDs comerciais, estado financeiro ou conteúdo existente.
- Mídia: corrigir o título técnico fixo e incluir a coluna de galeria ausente no
  conjunto direcionado de preparação, sem reaplicar migrations pendentes.

## Direction contract

THESIS: organizar o trabalho do Maycon por solução e orientação, com ações reais e pendências legíveis.

OWN-WORLD: herdar preto, carmesim, Manrope e Archivo Black; formulários e listas operacionais da 6DNX, sem nova identidade.

STORY: selecionar jogo, comparar soluções, abrir apresentação e reencontrar o guia na compra confirmada.

FIRST VIEWPORT: central com título e busca, filtros de pendências e lista de produtos; editor com rascunho e publicação visíveis. Leitura com sumário e ação de compra lateral.

FORM: extensão determinada pelo fluxo autorizado; código nativo; seed não aplicável à composição funcional já especificada. Interação principal: preparar, revisar e publicar guia preservando a versão ativa.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Validação planejada

Tipos, lint, testes de agrupamento/validação/autorização e regressões existentes.
PostgreSQL local: papel comum/anônimo sem acesso a guias, concorrência, rascunho
sem vazamento, publicação e preservação de comércio. Navegador desktop e mobile,
incluindo estados vazios, login obrigatório, busca, edição e páginas completas.
