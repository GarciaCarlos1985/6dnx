# Catálogo seguro e laboratório de pagamento

> **Snapshot histórico do simulador.** Em 2026-08-03 já existe uma fundação
> StorM server-only e houve um único PIX real autorizado de R$ 1,00. O webhook
> chegou e passou HMAC, mas a RPC original falhou e o pedido permanece
> `pending_payment`. A correção original já foi aplicada e a reconciliação
> complementar está apenas validada localmente. Para o estado vigente consulte
> `STORM_PIX_CHECKOUT.md` e `PROJECT_STATE.md`; o laboratório cenográfico
> descrito abaixo continua sendo um fluxo separado e nunca prova pagamento.

Atualizado em 29 de julho de 2026.

## O que funciona

- sete cards de serviços legítimos em `lib/products.ts`;
- cinco artes novas e originais na identidade 6DNX;
- imagem, descrição, variações e preço de referência por serviço;
- popup informativo à esquerda, card central e mídia à direita;
- fallback visual elegante quando um vídeo ainda não existe;
- checkout local de laboratório com Pix e cartão ilustrativos;
- sessão efêmera de 20 minutos e limite básico por origem;
- pedido TESTE opcional no canal Discord, sem autorizar entrega.
- botão de atendimento no Discord exibido somente depois da aprovação simulada.

O site é apenas vitrine e checkout. Ele não hospeda nem entrega arquivos. No
fluxo real futuro, um pagamento confirmado pelo backend libera somente o
direcionamento e a referência do pedido para o atendimento privado no Discord;
a equipe faz a liberação manual após conferir o estado `paid`.

## Regra financeira

`priceBRL` é somente o valor de referência exibido na vitrine. Ele é copiado
para a sessão como `referenceAmountBRL`, mas **nunca** é usado como valor de
cobrança.

O laboratório mantém `testAmountBRL = 1`. O QR desenhado na tela não codifica
uma cobrança e não pode ser pago. A interface mostra os dois valores
separadamente para evitar confusão.

## O que não está ativo

- criação de cobrança na StorM Wallet;
- webhook financeiro;
- pedido persistente no Supabase;
- idempotência, conciliação, estorno e reembolso;
- entrega automática;
- hospedagem ou download de produto;
- cartão real;
- cobrança em Production.

## Por que a carteira real continua bloqueada

O projeto ainda não possui documentação oficial verificável com contrato dos
endpoints, payloads, estados, sandbox e cálculo exato da assinatura do webhook.
As chaves live existentes não devem ser usadas para adivinhar esse protocolo.

Antes de qualquer integração real, o próximo responsável precisa:

1. obter a documentação oficial e um ambiente sandbox;
2. criar um adaptador server-only para o provedor;
3. persistir pedidos e eventos com idempotência no Supabase de homologação;
4. verificar a assinatura sobre o corpo bruto antes de atualizar o pedido;
5. testar expiração, duplicidade, falha, reembolso e reconciliação;
6. passar por revisão humana antes de DDL, deploy ou uso de credenciais live.

## Onde editar depois

- catálogo, descrições e preços: `lib/products.ts`;
- cards e popups: `components/product-showcase.tsx`;
- sessão simulada: `lib/checkout/test-store.ts`;
- tela de checkout: `components/test-checkout.tsx`;
- TICKET de laboratório: `lib/discord-notifications.ts`.
