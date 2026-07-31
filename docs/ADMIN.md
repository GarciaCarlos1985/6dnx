# Painel administrativo 6DNX

Para o manual operacional em linguagem simples, consulte
[`GUIA_ADMIN_MAYCON.md`](GUIA_ADMIN_MAYCON.md).

## Objetivo

O painel em `/admin` transforma o catálogo em dados editáveis sem permitir que
o operador altere TypeScript, componentes, rotas de API ou segredos. Ele foi
desenhado para uma pessoa sem conhecimento de programação:

1. escolhe um produto;
2. percorre cinco etapas curtas;
3. acompanha a prévia;
4. confere o resumo protegido;
5. confirma a prévia e salva.

`lib/products.ts` é usado como origem apenas quando o Supabase ainda não foi
configurado (desenvolvimento/importação inicial). Depois de configurado, o
Supabase é a fonte de verdade: falha, resposta vazia ou catálogo remoto inválido
mostram uma indisponibilidade segura, sem ressuscitar produtos arquivados.

## O que pode ser editado

- título, categoria, frase curta e descrição;
- thumbnail local ou enviada ao bucket `product-assets`;
- estado comercial;
- vídeo do YouTube e orientação horizontal/vertical;
- recursos, compatibilidade, teclas e passos de tutorial;
- dados das variações existentes: nome, observação, selo e preço;
- nota da alteração.

O modo cotidiano não oferece criação, duplicação, restauração, publicação,
arquivamento, alteração de `slug`/`source_key`, reordenação, paleta arbitrária
ou inclusão/remoção de variações. Esses campos não apenas sumiram da interface:
a rota de atualização lê o registro atual e recusa qualquer tentativa de mudar
essa estrutura. Criar uma nova família comercial ou retirar um produto exige
revisão técnica deliberada fora do fluxo cotidiano.

## Proteções contra erro

- autenticação por e-mail e senha via Supabase Auth;
- autorização no servidor exige `app_metadata.role = admin`;
- RLS repete a autorização dentro do banco;
- não existe política de `DELETE` para produtos;
- cada atualização gera uma revisão automática;
- histórico é somente leitura no painel cotidiano;
- gravação usa controle otimista de revisão e bloqueia sobrescrita concorrente;
- a API preserva rota, ordem, publicação, paleta e quantidade de variações;
- a API de produtos não aceita criação e a API de revisões não aceita
  restauração pelo navegador;
- upload é lido em stream com teto de 5 MB e confere a assinatura real de JPG,
  PNG, WEBP ou AVIF, em vez de confiar somente no nome/MIME informado;
- imagens remotas só podem vir do próprio projeto Supabase;
- mutações validam origem para reduzir risco de CSRF;
- rotas administrativas usam cache privado `no-store`;
- nenhum segredo é enviado ao navegador.

## Ativação segura

### 1. Revisar a migração

Arquivo:

```text
supabase/migrations/20260731090000_create_product_catalog_admin.sql
```

Ela cria:

- `public.product_catalog`;
- `public.product_catalog_revisions`;
- função `public.is_catalog_admin()`;
- trigger de histórico;
- RLS;
- bucket público `product-assets` com escrita administrativa.

Não aplique direto em produção. Primeiro use uma branch/homologação do
Supabase, execute os testes deste documento e obtenha validação humana.

### 2. Conferir variáveis da Vercel

Estas quatro variáveis são necessárias no runtime da Vercel:

```dotenv
SUPABASE_URL=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`NEXT_PUBLIC_*` contém somente URL e chave publicável protegida por RLS.
`SUPABASE_SECRET_KEY` continua exclusivamente no servidor.

### 3. Criar ou promover o primeiro administrador

O caminho mais simples é o mesmo fluxo visual do Supabase:

1. abra **Authentication > Users > Add user**;
2. crie o usuário com e-mail confirmado e uma senha forte;
3. coloque somente o mesmo e-mail em `ADMIN_BOOTSTRAP_EMAIL` no computador;
4. execute `npm run admin:create` para conceder o papel administrativo.

O comando é idempotente: se a conta já existir, preserva sua senha e demais
metadados e adiciona apenas `app_metadata.role=admin`. Se ela ainda não existir,
o comando usa a senha temporária abaixo para criá-la.

Não coloque senha em Git, Markdown, chat ou variável da Vercel. No computador
local, preencha temporariamente a senha somente se o usuário ainda não existir:

```dotenv
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=
```

A senha precisa ter no mínimo 16 caracteres, letra maiúscula, minúscula, número
e símbolo. Então execute:

```powershell
npm run admin:create
```

O script usa a chave secreta somente no processo local, cria ou promove a conta
e grava `app_metadata.role=admin`. Depois:

1. apague imediatamente `ADMIN_BOOTSTRAP_PASSWORD` de `.env.local`;
2. no Supabase Auth, desative novos cadastros públicos pelo provedor de e-mail;
3. abra `/admin/login`;
4. entre com a nova conta.

No painel atual do Supabase, a trava global fica em **Authentication >
Configuration > General Configuration > Allow new users to sign up**. Desligar
essa opção preserva os usuários existentes e impede novos cadastros. O manual
do Maycon explica a conferência passo a passo.

Internamente, a promoção usa uma operação administrativa equivalente a:

```json
{
  "app_metadata": {
    "role": "admin"
  }
}
```

Nunca use `user_metadata` como fonte da permissão: o próprio usuário pode
alterá-lo. A autorização do painel lê somente `app_metadata`.

### 4. Importar o catálogo

Na primeira entrada o banco estará vazio. Clique em **Importar catálogo atual**.
A operação:

- copia todos os cards executáveis de `lib/products.ts`;
- publica cada item no mesmo estado visual atual;
- preserva os arquivos fonte;
- só funciona quando a tabela está vazia.

## Fluxo editorial recomendado

1. Escolha um produto existente.
2. Preencha somente os campos cotidianos necessários nas etapas 01 a 04.
3. Revise a prévia e os preços na etapa 05.
4. Escreva uma nota objetiva.
5. Marque a confirmação final e salve.
6. Confira o card e o atendimento pelo Discord no site.

O produto mantém automaticamente seu estado atual: publicado continua
publicado, rascunho continua rascunho e arquivado continua arquivado. Para
criar, retirar, reposicionar ou restaurar um produto, abra uma tarefa técnica;
não altere linhas manualmente no banco.

## Rotas

| Rota | Finalidade |
| --- | --- |
| `/admin/login` | entrada por Supabase Auth |
| `/admin` | painel protegido |
| `/admin/demo` | demonstração visual disponível somente em desenvolvimento |
| `/api/admin/session` | validação da sessão e papel |
| `/api/admin/products` | listagem; criação cotidiana não é aceita |
| `/api/admin/products/[id]` | atualização segura com revisão e campos estruturais protegidos |
| `/api/admin/products/[id]/revisions` | histórico somente para consulta |
| `/api/admin/assets` | upload limitado de thumbnail |
| `/api/admin/catalog/bootstrap` | importação inicial única |

## Checklist antes de produção

- [ ] Migração revisada em branch isolada.
- [x] Cadastro público por e-mail desativado no Supabase Auth (confirmado pelo proprietário em 2026-07-31).
- [ ] MFA ativado na conta que administra o projeto Supabase, com fator reserva.
- [ ] MFA do `/admin` planejado/testado em conta reserva antes de exigir `aal2`.
- [ ] RLS testada com usuário anônimo, autenticado comum e administrador.
- [ ] Usuário comum recebe `403` nas APIs administrativas.
- [ ] Rascunho e arquivado não aparecem no site.
- [ ] Publicado aparece no card e o pedido manual abre o atendimento correto.
- [ ] Duas edições simultâneas geram conflito em vez de sobrescrita.
- [ ] Tentativas de alterar rota, ordem, publicação, paleta ou quantidade de
  variações recebem erro e não gravam nada.
- [ ] Upload acima de 5 MB ou MIME inválido é recusado.
- [ ] Desktop e mobile revisados.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`
  aprovados.

## Limites deliberados

- O painel não edita código, webhooks, chaves, componentes ou SQL.
- O painel não ativa pagamento real.
- O painel não cria a primeira conta automaticamente no deploy.
- O painel não aplica a migração sozinho.
- O modo cotidiano não cria, duplica, publica, arquiva, reordena nem restaura
  produtos. Essas ações estruturais exigem revisão técnica separada.
- O fallback estático existe somente sem configuração Supabase. Após ativação,
  mantenha o catálogo remoto completo e válido; falhas ficam visíveis como
  indisponibilidade em vez de publicar dados antigos.
