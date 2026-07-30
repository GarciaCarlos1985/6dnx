# 6DNX — revisão privada e continuidade

Atualizado em 2026-07-29. Este documento registra o que está pronto, o que
permanece deliberadamente inativo e como outro agente pode continuar o trabalho
permitido sem reconstruir o histórico.

## Estado de acesso

O código agora possui um modo de revisão por HTTP Basic Authentication em
`proxy.ts`. Ele protege páginas, APIs interativas, JavaScript, CSS e imagens.
Somente três superfícies ficam fora do desafio visual:

- `/robots.txt`, para comunicar `Disallow: /` aos buscadores;
- `/api/cron/*`, que continua exigindo seu próprio `CRON_SECRET`;
- `/api/webhooks/*`, que deve verificar a assinatura do provedor na própria
  rota.

Mesmo quando a senha está desativada, todas as respostas recebem
`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` e
cabeçalhos defensivos. `Cache-Control: private, no-store` é aplicado somente
durante a revisão autenticada/restrita, sem destruir o cache normal do site
quando a revisão estiver desligada. O layout também declara `noindex`, e
`app/robots.ts` bloqueia todo rastreamento.

Na Vercel, a ausência de `SITE_REVIEW_ENABLED` também ativa o bloqueio. Para
abrir o site publicamente será obrigatório definir `false` de forma explícita.

### Variáveis

Configure na Vercel, sem expor valores em Git ou no navegador:

```text
SITE_REVIEW_ENABLED=true
SITE_REVIEW_USER=6dnx
SITE_REVIEW_PASSWORD=<senha aleatória com no mínimo 16 caracteres>
```

Se o modo estiver ativo e a senha estiver ausente ou tiver menos de 16
caracteres, o site retorna `503` e permanece fechado. Production e Preview
devem usar senhas diferentes.

A auditoria técnica completa, riscos residuais e limites de atuação estão em
`AUDITORIA_SEGURANCA.md`.

### Validação antes do deploy

1. Sem credenciais, `/` deve retornar `401` com `WWW-Authenticate`.
2. Com credenciais válidas, `/` deve retornar `200`.
3. Com senha ausente ou curta, `/` deve retornar `503`.
4. `/robots.txt` deve responder sem autenticação e conter `Disallow: /`.
5. `/api/cron/news` deve continuar retornando `401` sem o Bearer correto.
6. Não faça o deploy de Production antes da revisão humana desses resultados.

### Lançamento público futuro

Definir `SITE_REVIEW_ENABLED=false` remove somente a exigência de usuário e
senha. Um lançamento público também precisa, no mesmo conjunto revisado:

- remover o `X-Robots-Tag` de revisão em `proxy.ts` (o `no-store` já é
  condicional ao modo privado);
- trocar `app/robots.ts` por regras públicas;
- retirar o bloco `robots` restritivo de `app/layout.tsx`;
- validar novamente cache, metadados, desktop, mobile e indexação.

Essa separação evita que uma variável alterada por engano publique e indexe
todo o catálogo imediatamente.

## Dados comerciais recebidos

`Produtos_Organizados.md` foi preservado sem alterações e sem corrigir preços.
Ele é uma fonte provisória de revisão, não o catálogo executável do site.

Problemas conhecidos:

- existem 31 títulos principais, mas o resumo consolidado lista 30;
- `Freezing` aparece no corpo e não aparece no resumo;
- o arquivo contém texto com codificação corrompida;
- o prompt de extração foi repetido 30 vezes dentro do conteúdo;
- um mesmo vídeo tutorial foi repetido em 26 referências;
- há possíveis associações incorretas de vídeos;
- os valores divergem de `CATALOG_AUDIT.md`, que veio dos prints do Discord.

Nenhum item, preço ou descrição desse documento foi promovido automaticamente
para o catálogo executável.

`lib/products.ts` agora contém sete serviços legítimos de referência:

- PC Performance Audit;
- Game Setup Pro;
- Aim Training Lab;
- Creator Identity Pack;
- Custom Steam Profile;
- Visual Presets;
- Stream Studio Setup.

Cinco artes originais foram criadas em `public/products/card-art/`; as artes já
existentes de Steam Profile e Visual Presets foram preservadas. Os valores
exibidos são rascunhos editoriais independentes, identificados na interface
como **referência**, e podem ser ajustados manualmente depois da aprovação do
proprietário.

## Trabalho que pode continuar

- confirmar os preços de referência, escopos e vídeos com o proprietário;
- substituir a prévia visual por vídeo próprio somente quando o material
  oficial de cada serviço estiver pronto;
- evoluir Custom Steam Profile, presets visuais permitidos, design e suporte;
- criar catálogo canônico com histórico de preço, disponibilidade e fonte;
- implementar o checkout profissional somente para itens comercialmente
  aprovados e permitidos.

## Trabalho não realizado

Itens ligados a tokens de conta, alteração de KWID, automação de mira ou
contorno de anti-cheetos não fazem mais parte do catálogo executável. O arquivo
`Produtos_Organizados.md` foi mantido apenas como material histórico de revisão
e não deve ser usado para recriar ofertas disfarçadas.

O laboratório agora transporta dois valores separados: o preço de referência
da variação e o total fixo simulado de R$ 1,00. O QR é decorativo e
deliberadamente não pagável. O checkout StorM Wallet real continua inativo.
Ainda faltam, para qualquer produto permitido:

- contrato oficial da API e ambiente sandbox;
- formato exato de criação e consulta de cobrança Pix;
- verificação documentada de `X-Storm-Signature` sobre o corpo bruto;
- tabelas de pedidos e eventos no Supabase com idempotência;
- regras de reembolso, privacidade, entrega e atendimento;
- teste ponta a ponta sem credencial live no ambiente de Preview;
- aprovação humana antes de migration, commit, push ou deploy.

Discord é notificação e suporte. Ele nunca deve ser usado como prova de
pagamento; o pedido canônico pertence ao banco e o webhook assinado confirma o
estado financeiro.
