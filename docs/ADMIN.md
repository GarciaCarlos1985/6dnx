# Painel administrativo 6DNX

## Objetivo

O painel em `/admin` transforma o catálogo em dados editáveis sem permitir que
o operador altere TypeScript, componentes, rotas de API ou segredos. Ele foi
desenhado para uma pessoa sem conhecimento de programação:

1. escolhe um produto;
2. percorre cinco etapas curtas;
3. acompanha a prévia;
4. decide entre rascunho, publicado ou arquivado;
5. salva.

O site público continua usando `lib/products.ts` como fallback. Uma falha de
rede, tabela ausente ou catálogo remoto inválido não deixa a vitrine vazia.

## O que pode ser editado

- título, categoria, frase curta e descrição;
- identificador usado pelos links internos, checkout e suporte, com validação
  restrita a letras, números e hífens;
- thumbnail local ou enviada ao bucket `product-assets`;
- cor de destaque, texto e superfície do card;
- estado comercial;
- vídeo do YouTube e orientação horizontal/vertical;
- recursos, compatibilidade, teclas e passos de tutorial;
- variações, observações, selos e preços;
- ordem editorial;
- estado de publicação;
- nota da alteração.

O `source_key` não pode ser editado. Ele é o identificador interno usado para
preservar a composição inicial do carrossel mesmo quando o slug muda.
Os seis cards que definem a página `D` e a primeira página à direita são
marcados como fixos e não podem ser despublicados pelo painel; isso evita
quebrar a navegação aprovada.

## Proteções contra erro

- autenticação por e-mail e senha via Supabase Auth;
- autorização no servidor exige `app_metadata.role = admin`;
- RLS repete a autorização dentro do banco;
- não existe política de `DELETE` para produtos;
- arquivamento é reversível;
- cada atualização gera uma revisão automática;
- gravação usa controle otimista de revisão e bloqueia sobrescrita concorrente;
- upload aceita somente JPG, PNG, WEBP ou AVIF, com teto de 5 MB;
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

### 3. Criar o primeiro administrador

Não coloque senha em Git, Markdown, chat ou variável da Vercel. No computador
local, preencha temporariamente:

```dotenv
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=
```

A senha precisa ter no mínimo 16 caracteres, letra maiúscula, minúscula, número
e símbolo. Então execute:

```powershell
npm run admin:create
```

O script usa a chave secreta somente no processo local, cria uma conta
confirmada e grava `app_metadata.role=admin`. Depois:

1. apague imediatamente `ADMIN_BOOTSTRAP_PASSWORD` de `.env.local`;
2. no Supabase Auth, desative novos cadastros públicos pelo provedor de e-mail;
3. abra `/admin/login`;
4. entre com a nova conta.

Se a conta já existir, promova-a no Supabase com uma operação administrativa
equivalente a:

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

1. Duplique um produto parecido ou crie um novo.
2. Mantenha como **Rascunho**.
3. Preencha as etapas 01 a 04.
4. Revise desktop e mobile.
5. Escreva uma nota objetiva.
6. Mude para **Publicado** e salve.
7. Confira o card e o checkout no site.

Para retirar um produto, use **Arquivado**. Não remova linhas manualmente no
banco.

## Rotas

| Rota | Finalidade |
| --- | --- |
| `/admin/login` | entrada por Supabase Auth |
| `/admin` | painel protegido |
| `/admin/demo` | demonstração visual disponível somente em desenvolvimento |
| `/api/admin/session` | validação da sessão e papel |
| `/api/admin/products` | listagem e criação |
| `/api/admin/products/[id]` | atualização com controle de revisão |
| `/api/admin/products/[id]/revisions` | histórico e restauração |
| `/api/admin/assets` | upload limitado de thumbnail |
| `/api/admin/catalog/bootstrap` | importação inicial única |

## Checklist antes de produção

- [ ] Migração revisada em branch isolada.
- [ ] Cadastro público por e-mail desativado no Supabase Auth.
- [ ] RLS testada com usuário anônimo, autenticado comum e administrador.
- [ ] Usuário comum recebe `403` nas APIs administrativas.
- [ ] Rascunho e arquivado não aparecem no site.
- [ ] Publicado aparece no card e é aceito pelo checkout.
- [ ] Duas edições simultâneas geram conflito em vez de sobrescrita.
- [ ] Restauração cria nova revisão e preserva a versão substituída.
- [ ] Upload acima de 5 MB ou MIME inválido é recusado.
- [ ] Desktop e mobile revisados.
- [ ] `npm run lint`, `npx tsc --noEmit` e `npm run build` aprovados.

## Limites deliberados

- O painel não edita código, webhooks, chaves, componentes ou SQL.
- O painel não ativa pagamento real.
- O painel não cria a primeira conta automaticamente no deploy.
- O painel não aplica a migração sozinho.
- Alterar o identificador não cria uma página pública `/produto/...` nem um
  redirecionamento histórico automático; links externos antigos devem ser
  revisados.
- O fallback estático é de contingência. Após ativação, mantenha o catálogo
  remoto completo e válido.
