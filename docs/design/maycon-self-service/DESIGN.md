---
name: "6DNX — extensão local de autosserviço"
description: "Registro do código entregue para cadastro diário, jogos, soluções e orientação após a compra; subordinado ao sistema global."
colors:
  admin-red: "#e3062c"
  admin-red-bright: "#ff2349"
  solution-accent: "#ff3658"
  solution-action: "#b10b2b"
  solution-action-hover: "#d30d35"
  solution-secondary: "#26151c"
  admin-panel-2: "#121011"
  admin-line: "rgb(255 255 255 / 9%)"
  admin-ink: "#f8f5f6"
  admin-help: "#b9aeb3"
  solution-bg: "#080607"
  solution-muted: "#b9b1b4"
  solution-line: "#30252a"
  white: "#fff"
typography:
  headline:
    fontFamily: "Archivo Black, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 4vw, 3.6rem)"
    lineHeight: 1.15
  title:
    fontFamily: "Archivo Black, system-ui, sans-serif"
    fontSize: "1.5rem"
    lineHeight: 1.4
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
  admin-help:
    fontSize: "0.85rem"
    lineHeight: 1.65
  label:
    fontSize: "0.7rem"
    fontWeight: 800
    letterSpacing: "0.08em"
rounded:
  square: "0"
spacing:
  compact: "0.65rem"
  base: "1rem"
  inset: "1.25rem"
  section: "1.5rem"
  wide: "2rem"
components:
  admin-primary:
    backgroundColor: "{colors.admin-red}"
    textColor: "{colors.white}"
    padding: "0.72rem 1.1rem"
  admin-secondary:
    backgroundColor: "rgb(255 255 255 / 3%)"
    textColor: "{colors.admin-ink}"
    padding: "0.72rem 1.1rem"
  field:
    backgroundColor: "rgb(0 0 0 / 26%)"
    textColor: "{colors.admin-ink}"
    rounded: "{rounded.square}"
    padding: "0.8rem 0.9rem"
  solution-primary:
    backgroundColor: "{colors.solution-action}"
    textColor: "{colors.white}"
    padding: "0.8rem 1.25rem"
  solution-secondary:
    backgroundColor: "{colors.solution-secondary}"
    textColor: "{colors.white}"
    padding: "0.8rem 1.25rem"
---

# Design System: 6DNX — extensão local de autosserviço

## Overview

**Creative North Star: "Midnight tactical club"**

Registro local da extensão entregue, subordinado a [../../DESIGN.md](../../DESIGN.md). Reutiliza o caráter aprovado da 6DNX; não substitui a identidade global nem define novas decisões criativas. O acabamento operacional observado reduz o espetáculo em favor da leitura e da edição.

Escopo: cadastro e duplicação de produto, central de orientações, editor e prévia, navegação por jogos, páginas de solução e leitor do guia. Evidência primária: `app/admin/admin.css`, `app/produtos/products.css`, `components/admin/product-create-dialog.tsx`, `components/admin/admin-dashboard.tsx`, `components/admin/guidance-center.tsx`, `components/admin/guide-editor.tsx`, `components/guide-reader.tsx` e `components/solution-list.tsx`; famílias herdadas de `app/layout.tsx` e `app/globals.css`. Contexto: `docs/PRODUCT.md`, `docs/UPGRADE_AUTOSSERVICO.md`, `docs/CADASTRO_PRODUTOS.md` e contratos em `.impeccable/surfaces/app-admin-dashboard-page-tsx.md` e `.impeccable/surfaces/catalog-authoring.md`. Valores locais repetidos são descritos como papéis deste registro, sem promover novos custom properties ao código.

**Key Characteristics:**

- Superfícies escuras, carmesim nas ações e texto claro.
- Listas com divisórias e estados nomeados.
- Formulário, checklist e leitura reorganizados por largura.
- Rascunho, salvamento e publicação com ações e estados textuais distintos.

## Colors

### Primary

Carmesim administrativo e sua variante viva identificam ações, hover e foco. O acento público, o fundo do botão público e seu hover têm valores próprios no código: não são uma conversão dos tokens OKLCH globais. O botão público secundário usa bordô escuro.

### Neutral

Preto da página pública, painel administrativo elevado por tom, texto claro e linhas discretas formam a base. O texto auxiliar da extensão administrativa usa `admin-help`; o leitor e a navegação pública usam `solution-muted`.

O estado publicado combina texto, borda verde translúcida e fundo verde translúcido; não depende apenas de cor. Seus valores completos permanecem no snippet, sem criar uma nova paleta global.

**The Estado Nomeado Rule.** Publicação, rascunho, alterações não salvas e erros recebem legenda textual; a cor suplementa a informação.

## Typography

**Display Font:** Archivo Black, com fallback system-ui/sans-serif.
**Body Font:** Manrope, com fallback system-ui/sans-serif.

A extensão mantém títulos de frase, como “Guia após a compra”, conforme os componentes entregues. Títulos públicos usam headline fluido; seções de leitura usam title. O título da central/editor é menor (1.8rem, linha 1.2), chegando a 1.5rem abaixo de 650px. Não há uma razão modular única.

Texto auxiliar administrativo usa o papel admin-help; rótulos de campo usam label em caixa alta. A prosa do guia tem medida máxima de 72ch e entrelinha 1.9; explicações administrativas usam medidas de 65–75ch. Esta medida de leitura é uma particularidade implementada da extensão.

No cadastro, o título do diálogo usa Archivo Black e a explicação usa o mesmo papel auxiliar administrativo. Ajuda de campo usa 0.75rem, também observado no editor do guia e nos destinos de produto. O título do produto mantém o tamanho fluido do editor existente; não deriva do título do diálogo.

## Layout

**Central:** filtros em três colunas, seguidos de duas caixas de pendências e lista em quatro colunas. Até 1100px o cabeçalho da lista desaparece e cada linha passa a duas colunas. Até 650px a busca e o filtro empilham; título e ações ocupam a largura da linha. As pendências continuam em duas colunas compactas, com descrições ocultas.

**Editor:** conteúdo flexível e checklist lateral de 17rem, com gap de 2rem. O checklist é sticky a 1.5rem do topo. Até 1100px fica estático depois dos campos; a barra de ações empilha. Até 650px os botões da barra formam duas colunas, com a prévia ocupando ambas.

**Público:** contêiner limitado por padding calculado para 1260px, com margem mínima de 1.25rem. Solução em conteúdo flexível e compra de 360px, gap de 2.5rem. Até 900px a compra fica estática na primeira linha. Leitor em sumário de 210px e prosa, gap de 4rem; até 900px o sumário passa a navegação horizontal com quebra de linha.

**Catálogo:** diretório com auto-fill e mínimo de 250px limitado à largura disponível. Lista de soluções com miniatura 16:10 de 180px; até 600px usa grade de 90px mais texto e ação na coluna textual. As miniaturas mantêm object-fit cover; o componente usa arquivos locais existentes, sem raster novo.

**Cadastro:** diálogo centralizado, limitado a 38rem e à largura disponível menos 2rem; altura máxima desconta 2rem do viewport dinâmico e o conteúdo rola internamente. Cabeçalho, campos e rodapé usam o mesmo inset de 1.5rem. Até 650px, a margem total cai a 1rem, o inset a 1.1rem e o rodapé empilha em ordem visual inversa, deixando criar acima de cancelar. Os botões do rodapé têm altura mínima de 44px.

**Cabeçalho do produto:** título e ações podem quebrar de linha; cada região tem base flexível de 24rem. Em largura intermediária o cabeçalho vira grade; até 680px os secundários dividem a linha e o primário ocupa uma linha inteira. O painel de prontidão reutiliza o contêiner tonal e o inset de pendências.

## Elevation & Depth

A extensão usa sobretudo tom e bordas para separar regiões. O primário administrativo herda brilho carmesim difuso e sobe 1px no hover; o campo em foco usa borda e halo. As listas e a leitura não recebem sombras de cartão. Os valores completos de sombra, foco e transição estão no sidecar.

Movimento observado: 160ms ease nos controles administrativos, 180ms ease no fundo da linha pública e 200ms ease na opacidade do diretório. Reduced motion remove as transições públicas e reduz as administrativas a 0.01ms.

O diálogo é uma camada modal nativa com backdrop preto a 80% e sombra ambiente escura. Essa elevação pertence à sobreposição; não muda a estratégia plana das listas. A borda mais visível delimita o diálogo contra o contexto escurecido.

## Shapes

Campos administrativos têm cantos retos explícitos; ações e regiões da extensão mantêm a geometria reta herdada. Bordas de 1px separam linhas, perguntas e estados. Mídia de vídeo é 16:9; miniaturas de lista e diretório são 16:10.

## Components

**Botões:** primário carmesim e secundário translúcido no admin; ações públicas preenchidas em carmesim/bordô. Controles desativados mostram opacidade reduzida e cursor de indisponibilidade. A barra do guia e ações de edição têm alvo mínimo de 44px; ações públicas têm 48px. Foco público usa contorno de 2px com afastamento de 5px; controles administrativos usam 2px de afastamento, exceto campos, cujo foco é borda/halo.

**Campos:** rótulo persistente, input/select com altura mínima de 3rem, textarea redimensionável verticalmente com mínimo de 8rem. Texto de ajuda e placeholders recebem os ajustes locais de contraste.

**Pendências e lista:** caixas com borda e painel tonal; linhas com título, estado público, estado do guia e ações reais. Busca precede as pendências; contador de resultados usa status acessível. O estado vazio oferece limpar filtros.

**Estado editorial:** chip textual distingue preparação de publicação. A barra informa alterações não salvas, revisão e publicação. Salvar, publicar e retirar acesso são ações separadas; a prévia reutiliza o leitor, com indicação textual de que depende de publicação.

**Criação e duplicação:** o mesmo diálogo nativo pede nome, categoria e jogo opcional, abre com foco no nome e bloqueia o scroll da página enquanto está aberto. Fechar e Escape respeitam o estado ocupado; erro de criação aparece como alerta no formulário. Ao criar a ficha independente em rascunho, o foco passa ao título do editor existente. A duplicação explica o que será reaproveitado e que o guia privado é preparado separadamente. A imagem neutra inicial é geometria SVG nativa, sem nova linguagem de ilustração.

**Prontidão:** painel tonal apresenta uma lista de pendências ou uma mensagem de revisão final, seguida da confirmação explícita de prévia e preços. Salvar rascunho é secundário; publicar é primário e permanece indisponível enquanto houver pendências ou faltar a confirmação. O texto diferencia manter fora do site e entrar no fim da vitrine. A demonstração identifica a operação como limitada à sessão.

**The Salvar e Publicar Rule.** Preparar e salvar um rascunho não comunica publicação. A revisão mantém salvamento secundário separado da publicação primária, com pendências e confirmação explícitas.

**Leitor:** sumário sem ícones, passos em lista ordenada, perguntas em details/summary nativos e suporte ao final. Vídeo opcional usa iframe 16:9 e link alternativo. Quebras de linha do conteúdo são preservadas.

Os nove snippets do sidecar extraem primário, secundário, campo, pendência, estado, sumário, pergunta, diálogo e prontidão. Classes são renomeadas apenas para isolamento; CSS resolve valores locais e preserva estados observados. O snippet do diálogo isola sua moldura nativa e o de prontidão isola o contêiner de conferência; os controles usam os mesmos primitivos registrados.

## Do's and Don'ts

### Do:

- **Do** preservar nomes textuais de publicação e salvamento junto da cor.
- **Do** reutilizar o mesmo leitor na prévia e no guia do comprador.
- **Do** manter sumário, checklist e ações na ordem responsiva implementada.
- **Do** manter salvar rascunho secundário e publicar primário, com pendências e confirmação legíveis.
- **Do** levar o foco do nome no cadastro ao título do editor após a criação.

### Don't:

- **Don't** tratar este registro local como substituição de docs/DESIGN.md.
- **Don't** representar rascunho ou prévia como orientação já publicada.
- **Don't** apresentar a demonstração de sessão como gravação persistente ou publicação real.

Não canonizado: kickers, grade decorativa e glyphs legados que o editor e a lista ainda carregam são defeitos ou detalhes herdados, não regras para novas superfícies. Seus estilos não entram no sistema; o cadastro não os amplia. Valores de rótulos minúsculos herdados também não viram novo token de leitura.
