# Cadastro diário de produtos — 18/10/2026

O primeiro lote de jogos e guias (`64ba685`) não resolvia a criação cotidiana
de produtos. O usuário solicitou completar esse fluxo, preservando o painel.
Este complemento reaproveita as cinco etapas, prévia, uploads, variações,
revisões e regras comerciais existentes.

## Resultado para o administrador

- **Novo produto** aceita qualquer solução: nome, categoria e jogo opcional.
  Cria uma ficha em rascunho com identidade própria, imagem neutra, sem planos
  ou preços inventados, e abre diretamente o editor desse produto.
- **Duplicar produto** reutiliza imagens, apresentação e planos do original.
  A cópia recebe outra identidade e começa em rascunho. Não replica pedidos,
  aprovação comercial nem orientação privada do comprador.
- **Salvar rascunho** permite interromper o cadastro e retomar pelo filtro.
- **Revisar e publicar** lista pendências de descrição, imagem e opção ativa.
  Após a conferência explícita, acrescenta o produto ao fim da vitrine.
- A central **Jogos e orientações** também oferece o atalho **Novo produto**.
  As páginas públicas e os guias do primeiro lote continuam usando o catálogo.

## Impacto e proteções

`POST /api/admin/products` autentica o administrador, valida origem e limita o
payload a 4 KiB. O servidor cria a identidade; o UUID da requisição evita cópias
extras ao repetir uma tentativa. Duplicar lê o original no servidor e exige
sua revisão. O cliente não pode enviar estado publicado, ordem, slug ou preço
na solicitação inicial. A gravação usa INSERT, sem sobrescrever produtos.

A API existente de edição continua recusando mudanças estruturais. Salvar
rascunho usa essa mesma validação e revisão otimista. Publicar é uma ação
dedicada em `/api/admin/products/[id]/publication`: salva as alterações atuais,
valida o cadastro e chama a RPC `admin_publish_catalog_product`. Se essa última
etapa falhar, o rascunho já salvo fica preservado.

A RPC é `SECURITY INVOKER`, exige `auth.uid()` e a permissão administrativa de
`app_metadata`, respeita RLS e bloqueia a ordenação na mesma modalidade da RPC
existente. A posição é calculada no banco, evitando colisões entre publicações.
O histórico e a revisão usam os triggers existentes. A função não dá acesso
a anônimos nem à chave de serviço.

A migration `20261018162455_catalog_product_publication.sql` cria somente a
função e suas permissões. Não altera registros existentes. As tabelas atuais
já permitem a criação de rascunhos. Colunas opcionais de jogo e galeria só são
enviadas quando o registro/schema as oferece. Slugs antigos, preços, imagens,
pedidos, ofertas aprovadas, checkout e flags de cobrança não são modificados.
Cadastrar/publicar um produto não aprova automaticamente uma cobrança PIX.

## Evidências locais

- `npm run check`: ESLint, TypeScript, **101/101 testes** e build de produção
  com 36 páginas estáticas aprovados após os ajustes do fluxo.
- Testes de domínio cobrem dados iniciais, cópia profunda independente,
  validação do DTO, rejeição de campos forjados, compatibilidade de colunas e
  requisitos de publicação. Integram a suíte normal `npm test`.
- PostgreSQL **17.10 nativo**, isolado em diretório novo e vinculado somente a
  `127.0.0.1`, executou o schema, triggers e RLS reais do catálogo e as duas
  migrations deste upgrade. Passaram criação de rascunho, rejeição de publicação
  incompleta, conflito de revisão, publicação com histórico e posição final,
  bloqueio de usuário comum/anon e preservação integral do produto antigo e
  dos pedidos de teste. Duas conexões publicaram produtos diferentes em paralelo
  com posições distintas; duas tentativas na mesma revisão tiveram um vencedor
  e um conflito `40001`. Resultado final: cinco publicados, cinco posições.
- O Docker Desktop local falhou ao iniciar. O laboratório foi concluído com
  PostgreSQL temporário instalado fora do repositório pelo registro NPM
  (`embedded-postgres@17.10.0-beta.17`, binário PostgreSQL 17.10 Windows x64).
  Nenhuma dependência de runtime foi adicionada. O servidor do laboratório foi
  encerrado ao final; seus dados contêm apenas fixtures sintéticas.
- Fixtures reproduzíveis: `tests/catalog-authoring.bootstrap.sql` e
  `tests/catalog-authoring.integration.sql`. O runner
  `node scripts/test-catalog-authoring.mjs` reproduz o ensaio em PostgreSQL 17
  descartável quando o Docker estiver disponível. Esse runner Docker não foi
  concluído nesta máquina; a execução aprovada foi a nativa descrita acima.
- Navegador local em 1440 × 1000 e 390 × 844: cadastro vazio, bloqueio de
  publicação incompleta, edição, salvamento, plano, simulação de publicação e
  duplicação. Modal inicia no campo nome e o cadastro abre no editor também no
  celular. O original permanece selecionável sem mudanças. Não houve escrita
  no Supabase real. Capturas em `.impeccable/review/authoring-*.jpg`.
- Revisão independente: a captura mobile de duplicação foi refeita por estar
  cortada. A revisão completa seguinte pediu legibilidade da ajuda do modal,
  atualização da cláusula funcional antiga em `docs/DESIGN.md` e rastreabilidade
  do FORM. Os dois ajustes foram aplicados; FORM foi classificado como seed N/A
  pela regra de extensão local precisamente especificada do Impeccable. O
  veredito marcou os três itens **resolved**, com disposição **ship** restrita
  às correções avaliadas. Build passou novamente após a correção de CSS.
  Relatório: `.impeccable/review/authoring-finish-review.md`.

## Ativação e limites

Após autorizar a proteção e o ensaio de reversão, o proprietário autorizou a
aplicação em produção. Em 18/10/2026, 15:10 BRT, foram aplicadas e registradas:

1. `20261018061604_solution_self_service.sql`: jogo, galeria e guias do primeiro lote;
2. `20261018162455_catalog_product_publication.sql`: publicação de novos rascunhos.

O backup, a restauração das 12 tabelas, a reversão e a aplicação preservando os
dados foram comprovados. Ensaio de produto/guia no banco real usou transação
desfeita; não deixou conteúdo de teste. Consulte
[`RECUPERACAO_UPGRADE_MAYCON.md`](RECUPERACAO_UPGRADE_MAYCON.md). O painel real
está disponível em `https://www.6dnx.com.br/admin`.

Não executar `supabase db push` genérico: há histórico legado e outras migrations
fora do escopo. Nenhuma compra ou cobrança real foi criada para essa validação.

Na rota de desenvolvimento `/admin/demo`, criar, salvar, duplicar e publicar
alteram somente a sessão em memória; recarregar reinicia a simulação. Ela não
comprova persistência via API/Supabase. A prova de banco é o laboratório SQL.
Sem a nova RPC no ambiente conectado, publicar retorna indisponibilidade e
explica que o rascunho está salvo, sem fingir sucesso.
