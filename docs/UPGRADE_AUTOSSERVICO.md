# Upgrade de navegação e orientação 6DNX

O complemento solicitado para a rotina diária do administrador está em
[`CADASTRO_PRODUTOS.md`](CADASTRO_PRODUTOS.md): criação genérica, duplicação,
rascunho e publicação pelo editor atual. Este documento registra o primeiro lote.

Implementação isolada em `codex/maycon-self-service`, a partir de `0521dad`.
Escopo autorizado em 18/10/2026: aproveitar o editor, navegar por jogo, oferecer
páginas de soluções e acessar a orientação correspondente após uma compra.
O usuário confirmou apresentação pública e guia adicional exclusivo para
compras confirmadas. Código e SQL foram validados localmente. Commit e push na
`main` foram autorizados; a migration remota exige validação humana separada.

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

## Implementação e limites

- `/admin/orientacoes` reúne busca, filtros de pendências e ações por solução.
- `/admin/orientacoes/[id]` separa rascunho e versão publicada. O salvamento
  utiliza revisão otimista, serialização no banco e histórico imutável.
- `/jogos` e `/jogos/[slug]` agrupam somente o campo **Jogo** preenchido no
  editor atual. Categorias, títulos, preços e regras de compra são preservados.
- `/produtos/[slug]` usa os mesmos dados publicados, mídia e compra dos popups.
  Produto sem publicação não gera página pública. O título técnico genérico
  da seção foi substituído por **Recursos da solução**.
- `/conta/pedidos/[id]/guia` exige sessão válida e pedido da mesma conta com
  estado `paid`, `awaiting_discord_fulfillment` ou `delivered_manually`.
  O vínculo usa a chave estável da solução, mesmo após renomear ou arquivar.
- `product_solution_guides` e seu histórico não ficam disponíveis a anônimos
  nem a usuários comuns pela Data API. O repositório exclusivo do servidor
  só consulta `published` depois da verificação do pedido. Rascunhos não entram
  no catálogo público, sitemap ou páginas de solução.
- Compras anônimas e atendimentos feitos fora do fluxo de pedidos não ganham
  vínculo automático com uma conta. O upgrade explica essa condição antes
  do PIX. Nenhum estado financeiro é alterado para liberar o material.
- Sem guia publicado, o comprador encontra o estado de preparação e suporte.
  Sem migration, a central administrativa explica a indisponibilidade e não
  oferece salvamento fictício. Nenhum conteúdo exclusivo foi inventado.
- O vídeo no YouTube continua sujeito à privacidade do YouTube. A proteção é
  da página e do texto do guia; não é um mecanismo de DRM para o arquivo.
- Nenhuma biblioteca de execução foi adicionada. Os componentes de mídia e
  compra foram extraídos da vitrine para reutilização nas páginas completas,
  sem carregar GSAP ou a vitrine animada dentro dessas páginas.

## Evidências locais

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado, incluindo as novas rotas. É um build local sem
  ativação de pagamentos, não um deploy.
- `npm test`: 95 testes aprovados, incluindo validação de guias, agrupamento,
  acesso por proprietário/estado do pedido e destino seguro de login.
- `node scripts/test-solution-guides.mjs`: PostgreSQL 17 isolado sem rede;
  RLS/grants, conteúdo inválido, rascunho/publicação/retirada, histórico,
  conflito de revisão, concorrência real e preservação comercial aprovados.
  O script remove somente seu próprio container descartável.
- GETs locais das páginas de jogos, solução, demonstração administrativa e
  estado indisponível do guia responderam 200. Administração sem configuração
  redirecionou ao login, sem expor dados privados.
- `next start` local: páginas inexistentes e `/admin/demo` responderam 404;
  guia com `Cache-Control: private, no-store` e `X-Robots-Tag: noindex`;
  sitemap incluiu soluções e não incluiu guias privados. A mutation do guia
  negou origem externa com 403 e usuário sem sessão com 401.
- Detector estático Impeccable: zero achados primários; um aviso para a grade
  decorativa legada em `app/admin/admin.css:64`, preservada fora deste escopo.
- O navegador local foi liberado após a reabertura do aplicativo. Capturas
  reais da central e da solução foram feitas em 1440 px e 390 px, com a central
  também conferida na largura inicial de 1280 px. Busca, filtro sem resultado e
  limpeza do filtro foram exercitados. A busca foi antecipada e a lista foi
  compactada no celular; o checklist do guia foi deslocado para depois do
  formulário em telas menores.
- O Chrome, autorizado pelo usuário, concluiu as capturas de editor/prévia em
  1440/390 px. A prévia, o retorno à edição e a FAQ foram exercitados pelo
  teclado; não houve overflow horizontal. O aviso nativo de saída com alterações
  não salvas não teve confirmação visual: o navegador integrado interrompeu a
  automação nesse teste. O fluxo real de comprador autenticado continua sujeito
  à conferência em ambiente de teste com Supabase configurado.
- Revisor independente Impeccable: revisão completa solicitou duas correções,
  miniaturas e contraste dos requisitos. A rodada de veredito marcou ambas
  **resolved**, com **disposition: ship**, restrita a esses dois itens. Resultado
  registrado em `.impeccable/review/finish-review.md`.
- As primeiras duas miniaturas carregam de imediato; as demais continuam lazy.
  Artes WebP locais existentes são servidas diretamente, evitando reprocessamento
  no servidor. O otimizador local expirou com Accept WebP; a entrega direta foi
  comprovada no Chrome por arte visível e dimensões naturais. Mídia remota mantém
  a otimização do Next. Os rótulos dos requisitos usam cor clara apenas na página
  da solução, com contraste conservador acima de 9:1.

O laboratório manual `6dnx-guide-lab-20261018` foi parado e preservado após
a remoção ser bloqueada pela política de execução. Os containers criados pelo
script de teste foram removidos pelo próprio script durante sua execução.

O usuário autorizou commit e push na `main` após a conclusão em 18/10/2026.
A autorização de Git foi registrada; a migration remota é uma etapa separada.
O registro visual desta extensão está em
[`design/maycon-self-service/DESIGN.md`](design/maycon-self-service/DESIGN.md),
com sidecar local, sem substituir o sistema global de `DESIGN.md`.

## Revisar sem acessar produção

Na pasta deste worktree, execute `npm ci` se necessário e
`npx next dev --port 3135`. Sem variáveis Supabase, o catálogo público utiliza
o fallback estático e o pagamento permanece indisponível. Não copie segredos.

- `http://localhost:3135/admin/demo?view=orientacoes`: central com conteúdo
  ilustrativo claramente identificado, sem gravação.
- `http://localhost:3135/admin/demo?view=guia`: edição e prévia ilustrativas,
  com salvar/publicar desativados.
- `http://localhost:3135/jogos`: soluções disponíveis e estado sem jogos
  definidos. Para conferir agrupamentos reais, prepare um ambiente de teste.
- `http://localhost:3135/produtos/dayz-6DNX-software`: página pública de exemplo
  com o produto existente no fallback. Nenhum preço foi criado para a revisão.

As rotas de demonstração existem somente em desenvolvimento. Não contêm um
atalho para autorização administrativa em produção.

## Ativação após revisão humana

1. Conferência local desktop/mobile concluída. Validar a aplicação do SQL no
   ambiente de destino antes de ativar gravação de jogos e guias.
2. Conferir o histórico real de migrations do ambiente de destino. **Não usar
   `db push` genérico**: há migrations históricas com aplicação manual e
   registro remoto divergente. Revisar e aplicar somente
   `supabase/migrations/20261018061604_solution_self_service.sql` no destino
   explicitamente autorizado e registrar essa versão no histórico apropriado.
3. Validar o schema aditivo, grants/RLS e preservação dos dados existentes em
   um ambiente de teste. Se a coluna `demo_images` já existir, a migration
   preserva seus valores e valida o limite da galeria.
4. Conferir as configurações existentes de Auth e da conta. O servidor usa
   `SUPABASE_URL` e `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`;
   nenhum segredo pode ser publicado com prefixo `NEXT_PUBLIC_`.
   Validar o retorno OAuth em `/auth/callback?next=...` no domínio autorizado
   e nas URLs de teste permitidas. O login da Home preserva o callback anterior.
5. Commit e push do código na `main` foram autorizados pelo usuário. Conferir o
   resultado do pipeline e, após ativar o schema, o fluxo real com administrador
   e comprador de teste: salvar/publicar/retirar guia,
   confirmar que rascunho não aparece, negar outro usuário e pedido não pago.
6. Maycon preenche os jogos e prepara o conteúdo correto por solução. Só os
   guias explicitamente publicados ficam acessíveis aos compradores.
7. Manter checkout e reconciliação sob suas autorizações existentes. Este lote
   não precisa ativar pagamentos, criar PIX ou alterar pedidos reais.

Para recuar, o código anterior continua compatível com as colunas aditivas.
Não apagar tabelas, histórico ou guias para desfazer o rollout. A retirada de
publicação por solução suspende o acesso e preserva o trabalho editorial.
