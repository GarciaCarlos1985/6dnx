# Mapa editorial das 31 entradas originais

> **Fonte editorial histórica.** Sincronizado em 2026-08-03: este mapa não
> representa sozinho o número atual de registros no Supabase, a ordem dos doze
> cards iniciais do worktree ou autorização de pagamento. Consulte
> `PROJECT_STATE.md` antes de usar qualquer entrada em código ou oferta real.

Atualizado em 29 de julho de 2026.

## Finalidade

Este documento reconcilia, sem perder nenhuma entrada, os 31 títulos presentes
em `Produtos_Organizados.md`. Ele serve para responder quatro perguntas:

1. qual registro original está sendo analisado;
2. qual card exclusivo pertence a esse registro;
3. qual categoria organiza o card sem fundir produtos diferentes;
4. quais dados ainda precisam ser substituídos ou comprovados antes de qualquer
   publicação.

Este é um mapa interno de revisão. Ele **não autoriza publicação, checkout,
cobrança, ticket de venda ou entrega**.

## Resultado da reconciliação

- Entradas na fonte: **31**.
- Entradas identificadas neste documento: **31 de 31**.
- Produtos/exemplos internos: **31**.
- Cards planejados: **31**.
- Relação obrigatória: **P01 = C01**, **P02 = C02** e assim sucessivamente até
  **P31 = C31**.
- Categorias editoriais: **25**.
- Produtos da mesma família, como DayZ e Warzone, permanecem em cards
  diferentes. A categoria serve apenas para organizar e filtrar.
- Os planos de 1, 7 ou 30 dias são variações do respectivo produto dentro do
  popup e não criam cards adicionais.

Os sete serviços atualmente presentes em `lib/products.ts` são um catálogo
legítimo de laboratório e independente. Eles não são renomeações automáticas
destas 31 entradas.

## Termos usados

- **Entrada**: um título `#` encontrado na fonte original.
- **Produto/exemplo**: um registro editorial identificado como `P01` a `P31`.
- **Card**: a representação visual exclusiva de um produto. Cada produto possui
  exatamente um card.
- **Categoria**: agrupamento de navegação. Uma categoria pode possuir vários
  cards sem transformar esses produtos em variações.
- **Oferta**: o produto único representado pelo card.
- **Plano**: duração encontrada na fonte, como 1, 7 ou 30 dias.
- **Preço aprovado**: valor confirmado pelo proprietário para um item legítimo.
  Nenhum valor da fonte recebe essa classificação neste documento.

## Situação cadastral

| Situação | Significado | Consequência |
| --- | --- | --- |
| `PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO` | O repositório ainda não contém a validação comercial final do proprietário para título, descrição, preço, mídia e forma de entrega | Manter como rascunho interno até a decisão do proprietário |

Esse rótulo não declara nenhum produto `false` ou comercialmente bloqueado. Ele
somente registra que a validação do proprietário ainda não está documentada no
repositório. Observações técnicas sobre finalidade, compatibilidade ou regras
de plataformas são registradas separadamente e não substituem a decisão
comercial.

## Regra definitiva dos cards

```text
31 exemplos = 31 produtos internos = 31 cards
```

Nenhum card contém dois produtos originais. Mesmo quando dois títulos
pertencem ao mesmo jogo, cada um mantém seu próprio ID, card, popup e conjunto
de planos.

| Card | Produto vinculado | Categoria | Quantidade de produtos no card |
| --- | --- | --- | ---: |
| C01 | P01 | DayZ | 1 |
| C02 | P02 | DayZ | 1 |
| C03 | P03 | Dead by Daylight | 1 |
| C04 | P04 | Deadlock | 1 |
| C05 | P05 | Delta Force | 1 |
| C06 | P06 | Escape From Tarkov | 1 |
| C07 | P07 | Farlight 84 | 1 |
| C08 | P08 | FiveM | 1 |
| C09 | P09 | Fortnite | 1 |
| C10 | P10 | Utilitário de gameplay | 1 |
| C11 | P11 | Hell Let Loose | 1 |
| C12 | P12 | Marvel Rivals | 1 |
| C13 | P13 | Meccha Chameleon | 1 |
| C14 | P14 | Overwatch 2 | 1 |
| C15 | P15 | Point Blank | 1 |
| C16 | P16 | PUBG | 1 |
| C17 | P17 | Utilitário de gameplay | 1 |
| C18 | P18 | RedM | 1 |
| C19 | P19 | Roblox | 1 |
| C20 | P20 | Rust | 1 |
| C21 | P21 | SAND: Raiders of Sophie | 1 |
| C22 | P22 | Squad | 1 |
| C23 | P23 | Sistema / KWID | 1 |
| C24 | P24 | Warzone | 1 |
| C25 | P25 | Unturned | 1 |
| C26 | P26 | Valorant | 1 |
| C27 | P27 | Warface | 1 |
| C28 | P28 | Warzone | 1 |
| C29 | P29 | Warzone | 1 |
| C30 | P30 | Warzone | 1 |
| C31 | P31 | Utilitário de gameplay | 1 |

## Conferência por categoria

| Categoria | Cards | Quantidade |
| --- | --- | ---: |
| DayZ | C01, C02 | 2 |
| Dead by Daylight | C03 | 1 |
| Deadlock | C04 | 1 |
| Delta Force | C05 | 1 |
| Escape From Tarkov | C06 | 1 |
| Farlight 84 | C07 | 1 |
| FiveM | C08 | 1 |
| Fortnite | C09 | 1 |
| Utilitário de gameplay | C10, C17, C31 | 3 |
| Hell Let Loose | C11 | 1 |
| Marvel Rivals | C12 | 1 |
| Meccha Chameleon | C13 | 1 |
| Overwatch 2 | C14 | 1 |
| Point Blank | C15 | 1 |
| PUBG | C16 | 1 |
| RedM | C18 | 1 |
| Roblox | C19 | 1 |
| Rust | C20 | 1 |
| SAND: Raiders of Sophie | C21 | 1 |
| Squad | C22 | 1 |
| Sistema / KWID | C23 | 1 |
| Warzone | C24, C28, C29, C30 | 4 |
| Unturned | C25 | 1 |
| Valorant | C26 | 1 |
| Warface | C27 | 1 |

Conferência:

- categorias: **25**;
- cards somados nas categorias: **31**;
- produtos vinculados: **31**;
- cards sem produto: **0**;
- produtos compartilhando o mesmo card: **0**.

## Matriz completa: 31 exemplos de posicionamento

Os planos abaixo registram somente as durações encontradas. Os valores
monetários continuam na fonte histórica e não são preços aprovados.

| ID | Linha | Título original | Card | Categoria | Planos encontrados | Estado |
| --- | ---: | --- | --- | --- | --- | --- |
| P01 | 1 | DayZ (Priv8 Software) | C01 | DayZ | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P02 | 101 | DayZ Dupper | C02 | DayZ | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P03 | 120 | Dead by Daylight (Priv8 Software) | C03 | Dead by Daylight | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P04 | 220 | Deadlock (Priv8 Software) | C04 | Deadlock | 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P05 | 320 | Delta Force (Priv8 Software) | C05 | Delta Force | 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P06 | 420 | Escape From Tarkov (Priv8 Software) | C06 | Escape From Tarkov | 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P07 | 512 | Farlight 84 (Priv8 Software) | C07 | Farlight 84 | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P08 | 612 | FiveM (Priv8 Software) | C08 | FiveM | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P09 | 712 | Fortnite (Priv8 Software) | C09 | Fortnite | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P10 | 812 | Freezing | C10 | Utilitário de gameplay | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P11 | 831 | Hell Let Loose (Priv8 Software) | C11 | Hell Let Loose | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P12 | 931 | Marvel Rivals (Priv8 Software) | C12 | Marvel Rivals | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P13 | 1031 | Meccha Chameleon (Priv8 Software) | C13 | Meccha Chameleon | 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P14 | 1131 | Overwatch 2 (Priv8 Software) | C14 | Overwatch 2 | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P15 | 1231 | Point Blank (Priv8 Software) | C15 | Point Blank | 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P16 | 1331 | PUBG (Priv8 Software) | C16 | PUBG | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P17 | 1431 | Recoil [IA] | C17 | Utilitário de gameplay | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P18 | 1450 | RedM (Priv8 Software) | C18 | RedM | 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P19 | 1550 | Roblox (Priv8 Software) | C19 | Roblox | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P20 | 1650 | Rust (Priv8 Software) | C20 | Rust | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P21 | 1750 | SAND: Raiders of Sophie (Priv8 Software) | C21 | SAND: Raiders of Sophie | 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P22 | 1850 | Squad (Priv8 Software) | C22 | Squad | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P23 | 1950 | spow [KWID] | C23 | Sistema / KWID | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P24 | 2002 | spow Warzone + Ranked [KWID] | C24 | Warzone | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P25 | 2021 | Unturned (Priv8 Software) | C25 | Unturned | 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P26 | 2121 | Valorant (Priv8 Software) | C26 | Valorant | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P27 | 2222 | Warface + spow (Priv8 Software) | C27 | Warface | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P28 | 2314 | Warzone [FULL + CONTROL AIM] (Priv8 Software) | C28 | Warzone | 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P29 | 2422 | Warzone [FULL] (Priv8 Software) | C29 | Warzone | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P30 | 2527 | Warzone [ESP] (Priv8 Software) | C30 | Warzone | 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |
| P31 | 2627 | Zoom [IA] | C31 | Utilitário de gameplay | 1, 7 e 30 dias | PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO |

## Fichas editoriais: 31 de 31

Cada ficha abaixo mostra exatamente o lugar em que o conteúdo legítimo deverá
ser inserido. Os títulos originais permanecem apenas como chave de
rastreabilidade interna.

### P01 — DayZ (Priv8 Software)

- Card: C01 — DayZ.
- Papel: produto único do card; os planos são as variações.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis, suporte,
  compatibilidade e limitações reais.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P02 — DayZ Dupper

- Card: C02 — DayZ.
- Papel: produto único do card; os planos são as variações.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar texto de duplicação ou exploit.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P03 — Dead by Daylight (Priv8 Software)

- Card: C03 — Dead by Daylight.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P04 — Deadlock (Priv8 Software)

- Card: C04 — Deadlock.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P05 — Delta Force (Priv8 Software)

- Card: C05 — Delta Force.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P06 — Escape From Tarkov (Priv8 Software)

- Card: C06 — Escape From Tarkov.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P07 — Farlight 84 (Priv8 Software)

- Card: C07 — Farlight 84.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P08 — FiveM (Priv8 Software)

- Card: C08 — FiveM.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P09 — Fortnite (Priv8 Software)

- Card: C09 — Fortnite.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P10 — Freezing

- Card: C10 — Utilitário de gameplay.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar a proposta de interferir em outros
  jogadores.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P11 — Hell Let Loose (Priv8 Software)

- Card: C11 — Hell Let Loose.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P12 — Marvel Rivals (Priv8 Software)

- Card: C12 — Marvel Rivals.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P13 — Meccha Chameleon (Priv8 Software)

- Card: C13 — Meccha Chameleon.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P14 — Overwatch 2 (Priv8 Software)

- Card: C14 — Overwatch 2.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P15 — Point Blank (Priv8 Software)

- Card: C15 — Point Blank.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P16 — PUBG (Priv8 Software)

- Card: C16 — PUBG.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P17 — Recoil [IA]

- Card: C17 — Utilitário de gameplay.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar a proposta de controlar recoil
  automaticamente.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P18 — RedM (Priv8 Software)

- Card: C18 — RedM.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P19 — Roblox (Priv8 Software)

- Card: C19 — Roblox.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P20 — Rust (Priv8 Software)

- Card: C20 — Rust.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P21 — SAND: Raiders of Sophie (Priv8 Software)

- Card: C21 — SAND: Raiders of Sophie.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P22 — Squad (Priv8 Software)

- Card: C22 — Squad.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P23 — spow [KWID]

- Card: C23 — Sistema / KWID.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar proposta de alteração de identidade do
  dispositivo ou evasão de anti-cheetos.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P24 — spow Warzone + Ranked [KWID]

- Card: C24 — Warzone.
- Papel: produto único do card; os planos são as variações.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar proposta de alteração de KWID ou evasão.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P25 — Unturned (Priv8 Software)

- Card: C25 — Unturned.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P26 — Valorant (Priv8 Software)

- Card: C26 — Valorant.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida, entregáveis e limitações.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P27 — Warface + spow (Priv8 Software)

- Card: C27 — Warface.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar automação, ESP, alteração de KWID ou
  evasão de anti-cheetos.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P28 — Warzone [FULL + CONTROL AIM] (Priv8 Software)

- Card: C28 — Warzone.
- Papel: produto único do card; os planos são as variações.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar automação de mira ou outras vantagens.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P29 — Warzone [FULL] (Priv8 Software)

- Card: C29 — Warzone.
- Papel: produto único do card; os planos são as variações.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: informar finalidade permitida somente após comprovação;
  a descrição atual da fonte não é publicável.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P30 — Warzone [ESP] (Priv8 Software)

- Card: C30 — Warzone.
- Papel: produto único do card; os planos são as variações.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar ESP ou outra vantagem informacional.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

### P31 — Zoom [IA]

- Card: C31 — Utilitário de gameplay.
- Papel: oferta única.
- Campo de título público: **pendente de um produto legítimo comprovado**.
- Campo de descrição: não reutilizar a proposta de mod ou vantagem indevida.
- Arte e vídeo: criar material próprio ou anexar autorização verificável.
- Estado: pendente de aprovação e documentação comercial.

## Modelo para validar ou substituir uma ficha pendente

Uma entrada pode virar produto público depois que os campos abaixo forem
preenchidos com dados reais, verificáveis e aprovados pelo proprietário:

```text
ID interno:
Nome público:
Categoria:
Finalidade legítima:
O que o cliente recebe:
O que o serviço não faz:
Compatibilidade:
Pré-requisitos:
Prazo de atendimento/entrega:
Política de suporte:
Política de cancelamento/reembolso:
Responsável comercial:
Prova de autorização ou licença:
Direitos da imagem:
Direitos do vídeo:
Variações legítimas:
Preço aprovado:
Data e autor da aprovação:
```

O cadastro final deve descrever com precisão o produto realmente vendido. Mudar
nome, imagem ou algumas palavras não substitui a confirmação de finalidade,
entrega, preço, suporte e direitos de uso.

## Como implementar depois da aprovação

1. O proprietário valida quais categorias realmente continuarão existindo.
2. Cada um dos 31 cards recebe uma ficha completa usando o modelo acima.
3. Jurídico/comercial confirma autorização de revenda e uso das marcas.
4. São produzidas artes e vídeos próprios.
5. Os preços aprovados entram primeiro no catálogo de laboratório.
6. O fluxo card → popup → checkout de teste é validado sem pagamento real.
7. Somente depois de revisão humana um item legítimo pode chegar ao catálogo
   público ou a uma integração financeira.

## Critério de conclusão

O mapa está completo quando:

- P01 a P31 aparecem uma vez cada;
- C01 a C31 aparecem uma vez cada;
- cada produto `Pxx` aponta exclusivamente para o card `Cxx`;
- a soma dos cards por categoria é 31;
- nenhum plano cria um card adicional;
- cada item público futuro possui documentação de legitimidade e direitos;
- cada ficha sem aprovação permanece identificada apenas como pendente e fora
  do checkout real.
