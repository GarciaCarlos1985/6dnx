---
version: 1
slug: "catalog-authoring"
primary_target: "components/admin/product-create-dialog.tsx"
related_targets: ["components/admin/admin-dashboard.tsx", "app/admin/admin.css", "components/admin/guidance-center.tsx"]
mode: "Operate"
---

# Cadastro diário no painel existente

Pedido: o usuário apontou que o primeiro lote não resolvia o cadastro de novos
produtos e pediu completar o trabalho. Preservar identidade, editor e produtos.
Autorizados criação genérica, duplicação, rascunho e publicação explícita.

THESIS: permitir que Maycon prepare uma nova solução e a publique pelo painel,
reutilizando dados existentes quando houver um produto parecido.

OWN-WORLD: herdar preto e carmesim, Manrope/Archivo Black e formulários do painel.
Extensão operacional em código nativo; sem substituir identidade ou layout geral.

STORY: Novo produto ou Duplicar → rascunho → cinco etapas e prévia → salvar →
conferir pendências → publicação separada. Guia privado preparado por solução.

FIRST VIEWPORT: atalho Novo produto na lista existente e Duplicar no editor.
Dialog protegido pede nome, categoria e jogo opcional. Após criar, foco no editor.

FORM: extensão code-led de fluxo especificado pelo usuário. Nenhuma comp aprovada,
torneio de identidade ou novo raster. Modal nativo preserva contexto e evita
mudar de produto sem salvar. Rascunho e publicação têm ações distintas.
Seed: não aplicável. `reference/new-work.md`, seção 3, determina não executar
concept-seed para uma extensão local ou pedido estreito precisamente especificado.
Este lote acrescenta ações e estados ao editor estabelecido; não cria uma página
inteira aberta a decisão de composição nem substitui o mundo visual.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Critério: criar/duplicar sem código, dados da origem intactos, status e erro claros,
cadastro incompleto bloqueado, fluxo usável em 1440 × 1000 e 390 × 844.
Prévia demo é explicitamente sintética e efêmera; não deve simular persistência real.
Limite de produção: duas migrations aguardam autorização; nenhum pedido real alterado.
