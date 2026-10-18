# Proteção e ativação do upgrade do Maycon — 18/10/2026

## Situação confirmada

O proprietário pediu backup e ensaio de reversão antes da alteração no banco.
Depois, autorizou explicitamente aplicar as migrations assim que a proteção
estivesse concluída. As duas versões foram aplicadas em uma transação, com
registro no histórico do projeto 6DNX `muwqyoeisiuwadxoiokz`:

| Versão | Conteúdo | Resultado |
| --- | --- | --- |
| `20261018061604` | Jogo, galeria e guias de solução | Aplicada |
| `20261018162455` | Publicação explícita de novos rascunhos | Aplicada |

Aplicação concluída em **18/10/2026 às 15:10:35 BRT (18:10:35 UTC)**.
Nenhuma outra migration pendente foi executada. O código funcional já está na
`main`, nos commits `64ba685` e `c2734e9`. O código anterior está em `0521dad`.

O painel real é **https://www.6dnx.com.br/admin**. `/admin/demo` em localhost
continua sendo uma demonstração efêmera; Maycon deve usar o painel real.

## Backup e ensaio concluídos

Backup privado, fora do Git e do diretório público:

```text
C:\Users\CarlosAlineBianca\6dnx-backups\pre-maycon-2026-10-18T17-48-56-251Z
```

A pasta permite acesso ao usuário Windows proprietário, SYSTEM e administradores
locais; não concede acesso a outros usuários comuns.
Contém dados privados; não anexar seus dumps, inventário ou logs a commits/PRs.

- `database.dump`: backup lógico PostgreSQL em formato custom, incluindo schema
  e dados acessíveis do banco; criado de snapshot consistente, somente leitura.
- `schema.private.sql`, `roles.private.sql`: definições e papéis sem senhas dos
  papéis. `inventory.private.json`: estado anterior e hashes por tabela.
- `code-before-upgrade-0521dad.zip`: cópia integral dos arquivos versionados da
  versão anterior, com aproximadamente 51 MB.
- `manifest.json`: tamanhos e SHA-256 dos artefatos, escopo e recibos.
- `rollback-maycon-upgrade.sql`: cópia do procedimento inverso testado.
- `recovery-verification.json`, `production-migration-receipt.json`,
  `production-verification.json`, `final-preservation-check.json`: provas do
  ensaio, aplicação e verificações posteriores.

O `pg_dump` 17.11 conectou ao PostgreSQL 17.6 de produção com TLS e certificado
CA/hostname verificados. Credenciais vieram do arquivo local existente somente
para os processos; não foram copiadas para o repositório nem impressas.

O backup restaurou **as 12 tabelas públicas da aplicação**, com os mesmos
registros e SHA-256 do snapshot. A cópia local usou PostgreSQL 17.10 em loopback,
Auth mínimo para satisfazer as chaves e funções do aplicativo, e os papéis
necessários. Não é uma comprovação de restauração de toda a plataforma Supabase:
serviços Auth/Realtime/Storage e extensões gerenciadas não foram clonados.
Arquivos binários do Storage não estão no dump; estas migrations não alteram
esses arquivos. O laboratório foi encerrado e seus dados privados ficaram na
mesma pasta protegida, sem conexão com a aplicação.

Na cópia restaurada, as duas migrations foram aplicadas e depois removidas pelo
script inverso. Schema público, funções e todos os dados originais voltaram ao
estado anterior. Passaram também repetição inofensiva do rollback e bloqueios
quando faltava aprovação ou existiam guias, histórico, jogos ou galeria novos.

## Validação de produção

- As duas versões constam de `supabase_migrations.schema_migrations`.
- Antes de aplicar, as 12 tabelas ainda correspondiam integralmente ao backup.
  Depois, continuaram com os mesmos dados; as únicas colunas novas começam vazias.
- Os **60 produtos** existentes foram preservados. Pedidos, ofertas comerciais,
  cupons, tentativas/eventos de pagamento e configurações visuais não mudaram.
- Com papel administrativo real no banco, o ensaio criou um rascunho, salvou,
  publicou, preparou e publicou um guia dentro de uma transação desfeita ao final.
  Nenhum registro de teste foi confirmado ou permaneceu no catálogo.
- Publicação incompleta, revisão antiga e papel admin forjado em `user_metadata`
  foram bloqueados. Guias/histórico têm RLS; a RPC usa `SECURITY INVOKER` e não
  permite execução anônima.
- O cache do PostgREST foi atualizado. A API pública lê os campos novos e recusa
  acesso anônimo à tabela de guias. Página de produto respondeu 200; `/admin`
  encaminha usuário sem sessão ao login; API administrativa responde 401.
- A comparação final, após o ensaio transacional, confirmou novamente conteúdo
  idêntico nas 12 tabelas anteriores e nenhuma linha de teste persistida.

Isso valida schema, permissões, persistência transacional e endpoints públicos.
Não representa uma sessão de navegador autenticada como Maycon nem uma compra
real de teste. Nenhuma cobrança, webhook, flag financeira ou publicação de um
produto real foi alterada para esta validação.

## Como reverter se solicitado depois

1. Interromper brevemente a edição e obter **novo backup** do estado mais recente.
2. Reverter os commits funcionais, na ordem `c2734e9` e `64ba685`, com `git revert`,
   revisão, testes e publicação aprovada. Não usar reset/force-push. Outros
   commits posteriores precisam ser avaliados; resolver eventuais conflitos sem
   remover pedidos nem o material de recuperação.
3. A versão anterior pode operar com as adições de schema mantidas. Essa é a
   reversão de comportamento que preserva o conteúdo preparado depois do upgrade.
4. Se o proprietário também pedir remoção do schema, conferir o destino e as
   dependências atuais, exportar/preservar qualquer conteúdo novo e revisar
   `scripts/rollback-maycon-upgrade.sql`. Esse arquivo **não é uma migration
   automática**. Exige autorização humana e a configuração explícita de sessão
   descrita no próprio cabeçalho.
5. O script recusa remover colunas/tabelas com jogos, galeria, guias ou histórico
   preenchidos. Não eliminar essa proteção: após uso real, planejar a preservação
   desses dados ou manter as estruturas aditivas. Produtos novos e seus pedidos
   nunca são apagados por esse procedimento.
6. O script usa transação, prazo de lock e `DROP` sem `CASCADE`. Não modifica o
   histórico de migrations; uma nova ativação posterior deve ser planejada como
   nova alteração revisada, sem um `db push` genérico.

Restaurar o banco inteiro a uma data antiga não é o rollback padrão: isso pode
descartar pedidos ou edições posteriores. A cópia antiga deve primeiro ser
restaurada em ambiente isolado e comparada com o estado atual.

## Ferramentas reproduzíveis

`scripts/backup-maycon-upgrade.mjs` exige origem, projeto esperado, CA, binários
PostgreSQL, runtime de laboratório e destino explícitos. Valida o projeto,
mantém a conexão de leitura e usa cursors/hashes em lotes de 128 registros.

`scripts/test-maycon-recovery.mjs` lê os artefatos privados, valida os hashes e
usa somente um novo PostgreSQL local. Recebe `--backup-dir`, `--tools-root` e
`--postgres-bin`; não aceita URL de produção. As dependências de laboratório
ficam fora do runtime do site. A instalação usada nesta execução está em:

```text
C:\Users\CarlosAlineBianca\.codex\visualizations\2026\10\18\01a14d93-89bf-7911-8439-b37c2d4dbcd8\postgres-lab-tools
```

Binários do cliente vieram do fornecedor PostgreSQL EDB; o PostgreSQL local já
estava disponível pelo pacote `embedded-postgres@17.10.0-beta.17`. Nenhuma
dependência da aplicação foi adicionada. Preserve a pasta privada de backup
em armazenamento seguro; ela está apenas neste computador, sem cópia externa
adicional comprovada.
