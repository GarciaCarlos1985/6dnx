# Product

> **Contexto de execução — 2026-08-03:** o objetivo de produto permanece
> válido, mas Production ainda usa a vitrine antiga. A nova vitrine, o rodapé e
> o checkout estão no worktree local. Um PIX real controlado foi pago; a
> liberação de atendimento continua proibida até o backend persistir `paid`
> após a correção/replay documentados em `PROJECT_STATE.md`.

## Register

brand

## Platform

web

## Users

Jogadores de PC (foco DayZ e títulos táticos) que buscam softwares utilitários premium, com status claro (undetected / updating) e acesso rápido via Discord. Contexto: noturno, desktop, decisão rápida de compra.

## Product Purpose

Vitrine imersiva da **6DNX** — soluções para jogos apresentadas com identidade
cinematográfica. Sucesso = o visitante entende a identidade em 5s, percorre o
hero, escolhe produto e variação e inicia um pedido assistido no Discord.

O **Radar 6DNX** prolonga a relação depois da decisão de compra: reúne lançamentos,
patches e movimentos dos jogos acompanhados pela marca, sempre apontando para a
fonte original. Na home ele aparece somente depois da vitrine para não competir
com a conversão; `/noticias` concentra a experiência editorial completa.

## Positioning

Softwares utilitários de elite para PC, com presença visual cinematográfica e fluxo direto ao Discord — sem carrinho.

## Conversion & proof

- Primary CTA: iniciar pedido → `GET /api/redirect?slug=...` → Discord. A rota
  não confirma pagamento, não entrega arquivo e não dispara webhook em `GET`.
- Secondary: indicador de scroll no hero + Radar 6DNX
- Linha memorável: Softwares Incríveis, Seguros e Profissionais
- Belief ladder: (1) marca premium e segura → (2) produtos com status transparente → (3) preço claro em R$ → (4) acesso via Discord
- Proof on hand: status UNDETECTED / UPDATING nos cards; comunidade Discord

## Brand Personality

Cinemático, tático, confiante. Emoção: poder controlado + mistério (operador + anjo 6DNX).

## Anti-references

SaaS roxo-branco genérico; cream/sand editorial; grids de cards com ícones redondos; hero com vídeo Veo no lugar de scroll controlado; carrinho/e-commerce tradicional.

## Design Principles

1. Personagens emolduram o brand — o título 6DNX é o centro óptico.
2. Scroll é a narrativa: GSAP pin + scrub, não vídeo fixo.
3. Vermelho carmesim é a única voz de cor; o resto é preto puro e zinco.
4. Cards só onde há interação de produto (vitrine).
5. Menos atrito: um clique do produto ao Discord.
6. Conteúdo sem ruído: notícias oficiais, hierarquia editorial e nenhuma disputa visual com a vitrine.
7. Operação sem código: o painel administrativo edita dados validados, mostra
   uma prévia e preserva histórico; nunca reescreve arquivos da aplicação.

## Accessibility & Inclusion

WCAG AA onde possível no dark; `prefers-reduced-motion` desliga pin/scrub e mostra estado estático; foco visível nos CTAs; contraste de texto ≥ 4.5:1.
