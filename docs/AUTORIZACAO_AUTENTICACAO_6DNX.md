# Autenticação e autorização na 6DNX

> **Contexto de 2026-08-03:** autenticação administrativa e RLS já existem. Um
> PIX real foi pago, mas ainda não existe autorização de entrega porque o pedido
> permanece `pending_payment` após a RPC falhar. Somente o replay assinado,
> processado após a migration corretiva, pode produzir `paid`; comprovante,
> polling `COMPLETO` ou marcação manual não substituem essa autorização.

Atualizado em 29 de julho de 2026.

## Resposta curta

“Autotização” não é um termo usado pelo projeto. Provavelmente a palavra lida
foi **autorização** ou **autenticação**. Elas não significam a mesma coisa:

- **autenticação** responde “quem é esta pessoa ou sistema?”;
- **autorização** responde “o que essa pessoa ou sistema pode fazer?”.

No `MAPA_EDITORIAL_31_ENTRADAS.md`, a situação
`PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO` registra que a decisão comercial final
ainda não está documentada no repositório. Ela não declara o produto `false` ou
bloqueado. Autorização comercial e de propriedade intelectual é uma dimensão
separada: comprova que a 6DNX pode revender um produto e usar nome, marca,
imagem, vídeo e material do parceiro. Não é uma chave técnica nem uma
confirmação de pagamento.

## Os tipos de autorização existentes

| Tipo | Pergunta respondida | Exemplo na 6DNX | Estado atual |
| --- | --- | --- | --- |
| Autenticação do usuário | Quem é o visitante? | login com Google | provedor Google habilitado no Supabase, mas login ainda não implementado no site |
| Autorização técnica | O usuário autenticado pode ler ou alterar este dado? | RLS, papéis `anon`, `authenticated` e `service_role` | ativa no catálogo, painel e tabelas comerciais; `anon` foi testado sem acesso às tabelas financeiras |
| Autorização comercial | A 6DNX tem direito de anunciar e revender? | contrato ou permissão do parceiro | não comprovada para as 31 entradas originais |
| Autorização de mídia | A 6DNX pode usar esta imagem ou este vídeo? | licença, cessão ou conteúdo próprio | não comprovada para materiais copiados de parceiros |
| Autorização de pagamento | O provedor confirmou que o dinheiro foi recebido? | webhook assinado com estado `paid` | o provedor confirmou o PIX de R$ 1,00 e assinou o callback, mas a RPC falhou antes de persistir `paid` |
| Autorização de entrega | A equipe pode liberar o atendimento daquele pedido? | pedido persistido como `paid`, conferido pelo backend | ainda não: o pedido real segue `pending_payment` e não deve ser corrigido manualmente |
| Autorização operacional | Um sistema pode executar uma rotina protegida? | `Authorization: Bearer <CRON_SECRET>` | implementada no cron de notícias |
| Autorização de deploy | Esta mudança pode chegar à produção? | revisão humana antes de DDL, push e deploy | decisão manual do responsável |

## Autenticação não é autorização

Um login Google bem-sucedido comprova a identidade da conta Google, mas não
deve liberar automaticamente:

- alteração de produtos;
- leitura de todos os pedidos;
- confirmação de pagamentos;
- acesso a segredos;
- liberação de atendimento;
- funções administrativas.

Depois da autenticação, o backend precisa consultar o papel daquela pessoa e
aplicar políticas de acesso. Exemplos de papéis futuros:

| Papel | Permissões adequadas |
| --- | --- |
| visitante | ler apenas produtos e notícias publicados |
| cliente | ler somente os próprios pedidos |
| suporte | consultar pedidos pagos necessários ao atendimento, sem acessar segredos financeiros |
| editor | criar e revisar conteúdo, sem confirmar pagamento |
| financeiro | consultar transações e registrar reembolso conforme política |
| administrador | administrar o sistema com trilha de auditoria |
| serviço do backend | executar rotinas server-to-server estritamente necessárias |

## O significado da pendência de validação

A situação `PENDENTE_DE_VALIDACAO_DO_PROPRIETARIO` significa que ainda falta
registrar no repositório a decisão do responsável sobre:

1. falta comprovar quem é o proprietário do produto;
2. falta comprovar autorização de revenda;
3. falta comprovar direito de usar a marca do jogo;
4. falta comprovar direito de usar imagens e vídeos do parceiro;
5. falta confirmar que a oferta respeita as regras da plataforma.

A validação documental não é substituída apenas por:

- mudança do nome;
- nova arte;
- descrição mais neutra;
- retirada de palavras sensíveis;
- envio do comprador para o Discord;
- aceite verbal sem registro verificável.

O cadastro precisa descrever sua função real. Uma apresentação diferente não
comprova, por si só, autorização comercial, direitos de mídia ou conformidade.

## Fluxo profissional de compra e autorizações

O fluxo futuro correto deve ser:

1. O cliente escolhe uma variação legítima e com preço aprovado.
2. O servidor cria um pedido com identificador único.
3. O servidor envia ao provedor o valor canônico armazenado no backend.
4. O provedor cria a cobrança.
5. O provedor envia um webhook assinado.
6. O backend verifica a assinatura antes de aceitar o evento.
7. O backend registra o evento de forma idempotente.
8. Somente o estado confirmado pelo provedor muda o pedido para `paid`.
9. O Discord recebe uma notificação, mas não decide se o pedido está pago.
10. A equipe consulta o pedido no backend e inicia o atendimento.

O navegador, um print, uma mensagem no Discord e uma página de “sucesso” não
são provas de pagamento.

## O que existe hoje no código

### Acesso temporário ao site

`proxy.ts` contém uma proteção HTTP Basic para ambiente privado de revisão.
Ela é adequada apenas para impedir acesso casual durante desenvolvimento. Não
substitui contas de usuários, papéis ou auditoria.

### Cron de notícias

`app/api/cron/news/route.ts` exige:

```text
Authorization: Bearer <CRON_SECRET>
```

Esse segredo autoriza somente a execução da coleta diária. Ele não deve ser
reutilizado para login, pagamentos ou administração.

### Google

O Google Provider está habilitado no projeto Supabase consultado. Entretanto:

- não existe cliente Supabase instalado no frontend;
- não existe chamada `signInWithOAuth`;
- não existe rota de callback;
- não existe troca de código por sessão;
- não existe leitura de usuário ou sessão no site;
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` não é consumido pelo código atual.

Portanto, o painel do Google/Supabase está preparado parcialmente, mas o login
6DNX ainda não funciona como recurso do site.

### Checkout

O checkout atual usa o estado `approved`, mas esse estado significa apenas
“aprovação simulada pelo laboratório”. Ele não representa:

- Pix recebido;
- cartão autorizado;
- webhook verificado;
- pedido financeiro persistido;
- autorização real de entrega.

O QR mostrado é decorativo e o valor de R$ 1,00 é uma referência de teste.

### Discord

O Discord é canal de notificação e atendimento. Ele não deve possuir poder para:

- confirmar pagamento;
- alterar o valor do pedido;
- substituir o registro do banco;
- autorizar entrega apenas porque uma mensagem chegou.

## O que precisa existir antes do login real

- cliente Supabase compatível com a versão atual do Next.js;
- rota de callback no domínio oficial;
- sessão lida e renovada de maneira server-side;
- tabela de perfis separada da identidade do Supabase Auth;
- RLS em todas as tabelas expostas;
- papéis e permissões documentados;
- logout e revogação de sessão;
- tratamento de conta suspensa;
- logs de ações administrativas;
- política de privacidade e base legal para os dados coletados;
- testes contra leitura de pedidos de outro cliente.

## O que precisa existir antes do pagamento real

- catálogo legítimo e preços aprovados;
- tabelas persistentes de pedidos e eventos;
- integração documentada com sandbox do provedor;
- criação de cobrança somente no servidor;
- assinatura HMAC do webhook validada sobre o corpo bruto;
- idempotência para eventos duplicados;
- estados de pagamento claramente definidos;
- reconciliação periódica com o provedor;
- política de expiração, cancelamento e reembolso;
- trilha de auditoria;
- revisão humana antes de usar credenciais live.

## Regra prática

Sempre pergunte qual autorização está sendo discutida:

```text
É autorização de revenda?
É direito de usar imagem ou vídeo?
É permissão técnica no banco?
É confirmação financeira do provedor?
É permissão para atender ou entregar?
É aprovação humana para publicar?
```

Sem essa especificação, a palavra “autorizado” pode dar uma falsa sensação de
segurança.
