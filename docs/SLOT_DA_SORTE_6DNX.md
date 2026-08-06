# 6DNX — Slot da Sorte (Parâmetros de Produto)

> **Status:** especificação de produto para implementação do visual/UX pelo Codex.
> Backend provably fair já especificado em `slot-engine-arquitetura-2.md`. Este
> documento define **os números de negócio** (RTP, custo, prêmios, limites) e a
> **lógica de entrega** — o contrato que o front consome.
>
> Nada está ativo em produção. A slot liga/desliga por Feature Flag.

## Objetivo (decisão do dono — agradar sem "bancar a toa")

A slot deve ser percebida como recompensa/vantagem do cadastro, **nunca** como
uma forma de o site "pagar dinheiro". A proteção do dono é **estrutural**:
moeda interna fechada + RTP < 100% (matemática, não promessa).

## 1. Acesso

- **Obrigatório estar logado** (Google/Discord). Nunca anônimo.
- **Obrigatório ter saldo** de moedas >= custo do giro.
- **Limite diário** por usuário/site (evita farming e esvaziamento).

## 2. Feature Flag (interruptor de ativação)

| Flag | Valor | Efeito |
|---|---|---|
| `slot_engine` | `false` | Botão fica oculto/"em breve". Ninguém gira. |
| `slot_engine` | `true` | Botão aparece com os parâmetros abaixo. |

- **Ativação é reversível:** basta voltar a flag para `false` para congelar.
- Fluxo recomendado: ativar em sandbox → validar com poucas moedas → ajustar
  RTP/pesos → só então liberar para o público.

## 3. Onde fica e como abre

- **Botão próprio "🎰 Slot da Sorte"** na vitrine de produtos (área dos cards),
  não atrapalha o checkout.
- Abre um **modal dedicado** (mesma linguagem visual carmesim do site).
- Estado do botão quando não logado: mostra "Faça login para jogar"
  (e o login Google/Discord abre por ali).

## 4. Moedas — fontes (tudo limitado e sob controle do dono)

| Fonte | Regra | Observação |
|---|---|---|
| **Compra paga** | Pedido `paid` de cadastrado → **R$ 1 = 1 moeda** (floor) | Já implementado (migration + trigger). Só entra quem já te pagou. |
| **Login diário** (recomendado) | Pequeno bônus diário (ex. **5 moedas/dia**) | Mantém o usuário voltando; teto diário. |
| **Tempo no Discord** (futuro) | Horas conectadas → moedas, com teto diário | Requer integração com o bot. |

**Invariante anti-fraude:** moeda é interna, **não vira R$ e não tem saque**.
Como ela entra de forma limitada (via compra ou teto diário), o total de moedas
existentes no sistema é **finito e previsível** — o dono nunca "banca a toa".

## 5. Custo e limites (defaults — ajustáveis)

| Parâmetro | Default | Campo |
|---|---|---|
| Custo do giro | **10 moedas** | `slot_config.spin_cost_coins` |
| Máx. giros/dia | **20** | `slot_config.max_spins_per_day` |
| Idade mínima | **18** | `slot_config.min_age_required` |

## 6. Prêmios (o que sai da slot) e entrega

| Tipo | Prêmio | Entrega |
|---|---|---|
| **PRODUCT_KEY** | Chave/produto do catálogo (ex. 1 dia de servidor) | **Assistida:** registra "você ganhou X"; suporte 6DNX entrega pelo Discord (igual a compra). **Nunca** liberação automática. |
| **DISCORD_ROLE** | Cargo especial no servidor (ex. "Sortudo") | Automática/moderada via bot; custo zero pro dono. |
| **COINS** | Devolve moedas (ex. +5) | Crédito imediato; recicla o saldo sem sair dinheiro. |
| **NONE** | Não ganhou nada | — (o caso mais comum) |

> **Regra de entrega:** nenhum prêmio é liberado automaticamente pelo site.
> O site registra o ganho e a entrega acontece pelo canal assistido (Discord),
> mesma política da compra PIX. Isso impede a slot de "vazar" produto de forma
> não controlada.

## 7. Dificuldade = RTP (a garantia do dono)

**RTP (Retorno ao Jogador)** = % médio de moedas devolvidas em prêmios em
relação ao total girado.

| Cenário | RTP | Efeito |
|---|---|---|
| Pão-dura (protege caixa) | **60–65%** | Site retém ~35–40% das moedas. |
| **Recomendado** | **65–70%** | Equilíbrio: agrada, dono retém ~30%. |
| Liberal | 80–90% | Agrada muito, quase nada retido. |
| **Proibido** | **≥ 100%** | Slot paga mais do que recebe → dono banca a toa. |

**Por que o dono é protegido (matematicamente):** com RTP < 100%, a longo prazo
o sistema **embolsa** a diferença. Com RTP ≤ 70%, a cada 100 moedas giradas os
jogadores recebem no máximo 70 de volta (média), e ~30 são "queimadas". Não
existe cenário em que a slot dê prejuízo líquido persistente.

### Como o RTP é definido (pesos)
- Em `slot_payouts`, cada prêmio tem um `weight` (peso relativo na probabilidade).
- O RTP real é derivado **automaticamente** dos pesos + valores (função
  `slot_rtp(site_id)`), gerado a partir da verdade, não digitado à mão.
- Para ajustar a dificuldade: mexe no `weight` dos prêmios. Ex. num universo
  onde o prêmio máximo é raro, aumenta o peso dos `NONE` e dos `COINS` pequenos.

### Exemplo de configuração de pesos (RTP ≈ 65-70%, para servir de ponto de partida)
| Prêmio | Tipo | Peso (weight) | Observação |
|---|---|---|---|
| Nada | NONE | **60** | O mais comum |
| +5 moedas | COINS | **18** | Recicla pouco |
| +10 moedas | COINS | **10** | Devolve o custo do giro |
| Cargo Discord | DISCORD_ROLE | **7** | Custo zero |
| Produto (1 dia) | PRODUCT_KEY | **4** | Prêmio médio |
| Produto (7 dias) | PRODUCT_KEY | **1** | Prêmio raro |

> Estes pesos são um **default a calibrar**. O Codex/back-end consome `weight`;
> o dono ajusta os números sempre que quiser para subir/baixar a dificuldade e
> o RTP. Nada é recompilado à mão — muda na tabela.

## 8. Provably fair (anti-trapaça)

- Resultado decidido **no servidor**, numa transação (HMAC + seed secreto).
- O navegador só **anima** o resultado que o servidor já escolheu.
- **Impossível manipular via DevTools.**
- Detalhes do algoritmo: `slot-engine-arquitetura-2.md`.

## 9. Resumo da proteção do dono (argumento de venda interno)

| Medo | Proteção |
|---|---|
| "Slot pagar demais" | RTP < 100% = matemática. Site embolsa a diferença. |
| "Bancar a toa" | Moeda fechada, sem saque; entra só de forma limitada. |
| "Jogador trapacear" | RNG no servidor, provably fair. Navegador não decide. |
| "Farming / esvaziar" | Limite diário + saldo limitado por fonte. |
| "Entregar produto vazando" | Entrega assistida via Discord, nunca automática. |
| "Dificuldade errada" | `weight` + RTP configuráveis a qualquer momento. |

## 10. Fora de escopo / pendências
- Confirmação regulatória (Lei 14.790/2023, SPA/MF) — ver slot-engine doc.
- Política de verificação de idade (self-report vs. real).
- Integração do bônus de tempo no Discord (futuro).
