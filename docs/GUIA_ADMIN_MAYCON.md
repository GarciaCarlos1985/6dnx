# Guia simples do Painel Administrativo 6DNX

> **Atualização de 2026-08-03:** o painel, a organização ampliada e a vitrine de
> doze cards já estão publicados. O banco comercial existe, mas novas cobranças
> StorM continuam desligadas e o botão público abre o Discord. O PIX real de
> R$ 1,00 permanece pendente; não altere manualmente pedido, tentativa ou evento
> e não reative a oferta de teste.

Este guia foi escrito para o Maycon operar o catálogo sem precisar entender
programação e sem correr o risco de danificar o site.

## A ideia mais importante

O painel não altera o código do site. Ele altera somente as informações dos
produtos guardadas no Supabase.

Pense assim:

- o **site** é a loja que o cliente vê;
- o **painel administrativo** é a mesa onde os produtos são organizados;
- o **Supabase Auth** é a portaria que confere e-mail e senha;
- o papel **admin** é o crachá que autoriza a entrada;
- o **Supabase Database** é a ficha onde os dados dos produtos ficam guardados;
- o **Supabase Storage** é o armário onde as imagens enviadas pelo painel ficam;
- o **Histórico** é o livro de registro das versões anteriores; no painel do
  dia a dia ele serve apenas para consulta.

## Como entrar

1. Abra `https://www.6dnx.com.br/admin/login`.
2. Digite o e-mail e a senha da conta administrativa.
3. Clique em **Entrar com segurança**.

O painel nunca pede chave da Vercel, chave do Supabase, webhook do Discord ou
chave da Wallet. Se alguma tela pedir uma dessas chaves, pare e peça ajuda.

## Como uma venda funciona hoje

Maycon precisa escolher conscientemente entre dois modos. Não existe um botão
mágico que transforme uma carteira em checkout sem que a carteira forneça uma
API oficial e um modo seguro de confirmar o pagamento.

### Opção 1 — atendimento manual (recomendada agora)

1. O cliente escolhe o produto e a variação no site.
2. O botão **Iniciar pedido no Discord** abre o atendimento.
3. Maycon confirma produto, duração e valor com o cliente.
4. Maycon envia a forma de pagamento válida por ele.
5. Maycon confere o pagamento diretamente no painel da carteira — nunca por
   captura de tela enviada pelo comprador.
6. Somente depois da confirmação Maycon organiza a entrega pelo atendimento.

Esse modo exige trabalho humano, mas é honesto e pode funcionar enquanto o
volume de pedidos é pequeno. O site não afirma que cobrou, não libera arquivo e
não trata uma mensagem do Discord como prova de pagamento.

### Opção 2 — cobrança automática (preparada, mas ainda desligada)

1. O servidor do 6DNX cria um pedido com identificador único no Supabase.
2. O servidor pede à API oficial da carteira uma cobrança para aquele pedido.
3. O cliente paga usando os dados devolvidos pela carteira.
4. A carteira chama um webhook do 6DNX; se ele falhar, o backend consulta a
   cobrança existente pelo endpoint oficial.
5. O servidor verifica a assinatura do webhook ou confere, server-to-server,
   ID da cobrança, ID externo e valor exatos, sempre com idempotência.
6. Só então o pedido muda para **Pago** e o Discord recebe um único aviso.

Esse modo é melhor para muitas vendas, mas depende de documentação oficial,
sandbox, formato da cobrança, assinatura do webhook, regras de estorno e teste
completo. Uma chave live sozinha não responde a essas perguntas. Até esse
contrato ser verificado, o fluxo manual é a decisão mais segura.

### As três chaves da StorM já foram colocadas. O que falta então?

Não falta uma quarta chave. Os três nomes têm funções diferentes:

- `STORM_WALLET_API_URL`: endereço base da API da StorM;
- `STORM_WALLET_API_KEY`: autoriza o servidor 6DNX a pedir a criação de uma
  cobrança;
- `STORM_WALLET_WEBHOOK_SECRET`: permite conferir se um aviso de pagamento
  realmente foi assinado pela StorM.

Elas já estão preparadas no computador local e na Vercel, somente no lado do
servidor. Nunca devem ser coladas no painel administrativo, em produto, no
GitHub, no Discord ou enviadas por mensagem.

O código entre a loja e a Wallet cria pedido, solicita PIX, exibe QR Code/copia
e cola, consulta o estado e valida `X-Storm-Signature` no corpo bruto. O banco
comercial e o webhook já existem. No teste real de R$ 1,00, o pagamento chegou
à última etapa, mas a função anterior do banco falhou antes de registrar `paid`.

Por isso, não altere manualmente o pedido e não ligue as flags sozinho. O
suporte informou que não reenvia callbacks. A equipe técnica preparou uma
reconciliação que consulta somente a cobrança existente, mas ela ainda depende
de autorização para migration e publicação. Só libere atendimento depois que o
banco mostrar `paid` e existir a evidência única correspondente.

### Atenção ao campo “Webhook de pagamentos” da StorM

A URL de webhook do Discord colocada nesse campo está no lugar errado. O
Discord recebe notificações para a equipe; ele não sabe validar nem processar
um evento financeiro da StorM.

O destino correto já está configurado como
`https://www.6dnx.com.br/api/webhooks/storm-wallet`. Portanto:

1. nunca substitua essa URL por um webhook do Discord;
2. não gere outra API key nem regenere o secret HMAC sem necessidade;
3. não altere o callback enquanto houver pedido pendente ou reconciliação em
   andamento;
4. não crie outra cobrança para substituir o PIX já pago;
5. continue confirmando o estado `paid` no backend antes de atender ou entregar
   no painel da Wallet.

O domínio e a rota já estão verificados. O campo deve continuar apontando para:

```text
https://www.6dnx.com.br/api/webhooks/storm-wallet
```

Para liberar a cobrança automática, a equipe ainda precisa aplicar e publicar
a reconciliação já testada, confirmar o pedido real como `paid`, validar a
notificação única e obter regras comerciais definitivas de expiração,
cancelamento e reembolso. Sandbox continua desejável, mas não se deve criar
outra cobrança para substituir o teste já pago.

### O que foi retirado dos cards

Os atalhos **Download Manager** e **Instalar Drivers** foram removidos de todos
os produtos. Eles pertenciam ao fluxo de outro site e poderiam levar clientes
a arquivos que o 6DNX não controla. Se um novo botão for necessário no futuro,
ele deve ganhar nome, destino e responsabilidade aprovados pelo Maycon antes de
ser publicado.

### Posso entrar de outro computador ou de outro estado?

Sim. O painel fica na internet e não está preso ao computador em que foi
configurado. Maycon pode abrir `https://www.6dnx.com.br/admin/login` no
computador dele, entrar com a conta administrativa e usar o mesmo catálogo.

Cada navegador mantém sua própria sessão. Por padrão, o Supabase permite que a
mesma conta esteja conectada em mais de um dispositivo. Mesmo assim, não é bom
duas pessoas editarem o mesmo produto ao mesmo tempo: uma alteração pode chegar
depois da outra e gerar conflito. O painel avisa quando a versão aberta ficou
desatualizada; nesse caso, recarregue o produto antes de continuar.

Se Carlos e Maycon forem editar o catálogo com frequência, o mais seguro é cada
um ter sua própria conta administrativa. Assim, a senha não precisa ser
compartilhada e o histórico consegue identificar melhor quem fez cada mudança.

## Fechar o cadastro público do Supabase

**Concluído em 31/07/2026:** Carlos desligou **Allow new users to sign up**.
O print também mostrou login anônimo e vinculação manual desligados. As contas
administrativas existentes continuam funcionando normalmente.

O painel já exige o crachá `admin`, portanto uma conta criada por um robô não
entra na administração. Mesmo assim, deixar o cadastro público aberto cria
usuários inúteis e aumenta spam. Para fechar sem apagar os administradores:

1. entre no projeto 6DNX no Supabase;
2. abra **Authentication**;
3. abra **Configuration** e depois **General Configuration**;
4. desligue **Allow new users to sign up**;
5. clique em **Save**;
6. saia do painel 6DNX e confirme que a conta administrativa existente ainda
   consegue entrar.

Essa opção bloqueia somente contas novas. As contas que já existem continuam
podendo fazer login. Depois, abra **Authentication > Users**, revise os usuários
e remova apenas contas desconhecidas — nunca apague Carlos ou Maycon por
engano. Não faça exclusão em massa sem conferir e-mail por e-mail.

Referência oficial: [Configuração geral do Supabase Auth](https://supabase.com/docs/guides/auth/general-configuration).

## Ativar proteção em duas etapas (MFA)

Existem duas proteções diferentes:

### 1. Conta que abre o site do Supabase

Essa é a proteção mais fácil e deve ser feita primeiro. Nas configurações da
própria conta Supabase, ative MFA com Google Authenticator, Authy, 1Password ou
aplicativo semelhante. Cadastre também um segundo fator de reserva em outro
dispositivo ou guarde o segredo em local seguro. O Supabase não entrega códigos
de recuperação; perder todos os fatores pode impedir o acesso à conta.

### 2. Login em `6dnx.vercel.app/admin`

Hoje esse login usa e-mail, senha e o papel `admin`, mas ainda não pede o código
de seis dígitos. Isso não é resolvido apenas ligando uma opção no Supabase. O
site precisa ganhar três telas: cadastrar o autenticador por QR Code, pedir o
código depois da senha e validar no servidor que a sessão chegou ao nível
`aal2`. As regras do banco também precisam exigir esse nível.

Essa segunda etapa deve ser instalada e testada primeiro com uma conta reserva.
Ativá-la pela metade pode trancar o Maycon para fora do painel. Até a tela estar
pronta, use senha longa e única, contas separadas para Carlos e Maycon, MFA na
conta do Supabase e nunca compartilhe sessão ou senha por mensagem.

Referências oficiais: [MFA da conta Supabase](https://supabase.com/docs/guides/platform/multi-factor-authentication)
e [MFA TOTP para usuários do aplicativo](https://supabase.com/docs/guides/auth/auth-mfa/totp).

## Primeira entrada

Se aparecer o botão **Importar catálogo atual**, clique nele apenas uma vez.
Ele copia os produtos que já estão no site para o painel. Não apaga os arquivos
originais e não deve ser usado novamente depois que o catálogo estiver
importado.

A importação vale para o site inteiro, não apenas para o computador que clicou
no botão. Se Carlos importar agora, Maycon já encontrará o catálogo pronto ao
entrar de outro estado. Maycon não precisará importar novamente. Para evitar
duas tentativas simultâneas, combinem quem fará a primeira importação e deixem
somente essa pessoa clicar no botão.

## O que existe na tela

### Lista da esquerda

Mostra todos os produtos. Os filtros significam:

- **Todos:** mostra tudo;
- **No ar:** produtos visíveis para os clientes;
- **Rascunhos:** produtos salvos, mas invisíveis no site;
- **Arquivo:** produtos retirados do site sem serem apagados.

Não existe botão de exclusão permanente nem criação genérica. Para cards comuns,
o botão **Arquivar card** apenas retira o produto da vitrine e mantém tudo
guardado. Qualquer card pode ser arquivado; se ele voltar depois, será colocado
no fim do catálogo para não bagunçar a ordem salva enquanto esteve fora.

### Organizar vitrine

O botão **Organizar vitrine** abre uma área separada da edição de conteúdo. Ela
mostra claramente:

1. os três cards da primeira fileira da seção 2;
2. os três cards da segunda fileira da seção 2;
3. os três cards da primeira fileira da seção 3;
4. os três cards da segunda fileira da seção 3;
5. todos os demais cards que aparecem pelas setas.

Para mover um card distante, use **Buscar e posicionar**: digite parte do nome,
selecione o resultado e informe a posição desejada. Também existem os atalhos
**Levar ao topo** e **Levar ao fim**. Arraste ou use `↑` e `↓` somente para
ajustes curtos.

Cada card tem um botão de **três pontos**. Ele abre o **Tabuleiro da vitrine**,
um minimapa com todas as posições. Nenhuma casa nasce selecionada. Clique em
uma casa para selecionar, clique de novo para desselecionar, ou arraste um card
sobre outro para trocar os dois no rascunho. Também é possível escolher outra
casa e usar:

- **Mover para esta casa:** insere o card ali e desloca os cards entre as duas
  posições;
- **Trocar os dois cards:** troca somente o card escolhido e o card da casa de
  destino;
- **Arquivar card:** retira imediatamente o card do site, sem apagar dados. Ele
  continua na aba **Arquivo** e pode ser restaurado depois.

Mover ou trocar não altera texto, imagem, preço ou arquivo. Antes de salvar,
o painel exige que você marque **Conferi as quatro fileiras e os doze cards
iniciais** e ainda mostra uma confirmação final. Se desistir, clique em
**Cancelar**; nada muda no site.

### Ação temporária Rust1–Rust20

Enquanto algum dos vinte cards estiver ausente e um card da família Rust estiver
aberto, aparece o controle **Quantidade / Criar**. Ele foi feito somente para o
lote solicitado:

1. mostra quantos dos vinte já existem;
2. começa sempre com quantidade **1**;
3. permite escolher uma quantidade maior somente de forma explícita;
4. avisa que os novos cards serão publicados e pede confirmação antes de agir;
5. copia integralmente o Rust atual, mudando apenas nome e identificadores;
6. cria somente os próximos números ausentes, sem sobrescrever edições já feitas;
7. desaparece automaticamente quando Rust1 até Rust20 estão completos.

Se quiser testar apenas um, deixe **Quantidade = 1**. Uma quantidade maior só
deve ser escolhida quando houver intenção de publicar vários cards de uma vez.
Se duas pessoas abrirem o painel, combinem quem fará isso; a API nunca
sobrescreve um número já criado.

### Área do meio

É o formulário de edição. Ele foi dividido em cinco etapas:

1. **Básico:** nome, categoria, status, frase curta e descrição;
2. **Visual:** troca segura de imagem; a paleta oficial é protegida;
3. **Conteúdo:** vídeo, recursos, compatibilidade e tutorial;
4. **Variações:** criação, edição, destaque, cor, estoque e organização dos
   planos e preços;
5. **Revisão:** mostra o que está protegido, pede uma conferência e salva.

### Prévia da direita

Mostra como o card deverá ficar. A prévia ajuda a perceber textos compridos ou
imagens inadequadas antes de salvar. As cores não podem ser
mudadas no painel cotidiano, portanto Maycon não consegue diminuir o contraste
ou fugir da identidade 6DNX por engano.

## O que o painel impede automaticamente

Maycon não precisa decorar uma lista de “não clique”. As ações perigosas não
ficam disponíveis:

- não há botão de criar ou duplicar produto genericamente;
- Rust1–Rust20 é a única duplicação assistida e começa com quantidade 1;
- arquivar exige confirmação e nunca apaga dados;
- não há campo de ordem misturado com a edição do produto; a ordem inteira só
  pode ser salva em **Organizar vitrine**;
- a paleta estrutural do card continua protegida, mas cada variação pode receber
  uma cor própria validada;
- remover uma variação exige confirmação; arquivar é a opção reversível e mais
  segura para preservar histórico/configuração;
- o histórico não possui botão de restauração;
- não existe exclusão permanente.

Essa proteção não depende apenas da aparência. Mesmo que alguém tente enviar
uma alteração estrutural diretamente para a API, o servidor compara com a
versão atual e recusa a gravação inteira.

## Forma segura de editar um produto

1. Escolha o produto na lista da esquerda.
2. Altere uma coisa de cada vez.
3. Observe a **Prévia ao vivo**.
4. Passe pelas cinco etapas e confira os dados.
5. Na etapa **Revisão**, escreva uma nota curta explicando a mudança.
6. Marque **Conferi a prévia e os preços deste produto**.
7. Clique em **Salvar campos seguros**.
8. Clique em **Ver site** e confira o resultado.

Antes de salvar, nada muda no site. O aviso **Não salvo** significa que existem
alterações apenas na tela atual.

## Como trocar uma imagem

Use sempre o botão **Substituir imagem**:

1. prepare uma imagem horizontal, de preferência `WEBP` ou `AVIF`;
2. use proporção `16:9`;
3. mantenha o arquivo abaixo de 5 MB;
4. clique em **Substituir imagem** e escolha o arquivo;
5. aguarde a mensagem de envio concluído;
6. confira a prévia;
7. abra **Revisão**, confirme a prévia e clique em **Salvar campos seguros**.

O painel envia a imagem para o **Supabase Storage** automaticamente. Maycon não
precisa abrir o Storage nem copiar endereço manualmente.

### Thumbnail do card e banner do checkout são imagens diferentes

- **Thumbnail do card:** horizontal 16:9, recomendação 1600 x 900 px;
- **Banner do checkout:** vertical 4:5, recomendação 1200 x 1500 px;
- use WEBP ou AVIF e mantenha cada arquivo abaixo de 5 MB.

Na etapa **Visual**, o primeiro botão troca a imagem horizontal do card. O bloco
**Banner vertical do checkout** troca somente a arte que aparece na lateral do
PIX. Se ainda não houver banner vertical, o checkout mostra a thumbnail inteira
sem cortá-la. O botão **Usar thumbnail do card** volta a esse modo seguro.

Não tente transformar uma arte 16:9 em 4:5 esticando-a: recorte/recomponha a
arte em 1200 x 1500 para preservar logo, personagem e textos dentro da margem.

### O que significa “imagem remota deve vir do Supabase”

Uma imagem remota é uma imagem que está na internet e possui um endereço
começando com `https://`.

Por segurança, o painel aceita imagens externas somente quando elas estão no
Storage do próprio projeto 6DNX. Isso impede que uma imagem de um site aleatório
suma, seja trocada por outra pessoa ou rastreie os visitantes.

O campo **Endereço da imagem** existe somente para mostrar onde ela está
guardada e não pode ser alterado manualmente. Use o botão **Substituir imagem**.

## O que significam os estados que aparecem na lista

- **Rascunho:** fica guardado no painel e não aparece no site;
- **Publicado:** aparece para os clientes depois de salvar;
- **Arquivado:** sai do site, mas continua guardado e pode voltar depois.

Esses estados são apenas informativos no painel cotidiano. Salvar um texto,
preço ou imagem não altera o estado: publicado continua publicado, rascunho
continua rascunho e arquivado continua arquivado. Para retirar um card comum,
clique em **Arquivar card** e confirme. Para recolocar, abra **Arquivo**, escolha
o produto e clique em **Restaurar card**.

## Botões importantes

- **Revisar alterações:** leva à conferência final, sem salvar ainda;
- **Salvar campos seguros:** grava somente o conteúdo permitido;
- **Histórico:** mostra versões anteriores em modo de consulta;
- **Arquivar card:** retira um card comum do site sem apagá-lo;
- **Restaurar card:** devolve um card arquivado ao estado que possuía antes;
- **Organizar vitrine:** muda somente a posição dos cards publicados e exige
  conferência dos doze primeiros;
- **Ver site:** abre a loja em outra aba para conferência;
- **Sair:** encerra a sessão administrativa.

## Galeria demonstrativa do popup

Na aba **Visual** de cada produto, use **Galeria demonstrativa** para enviar até
cinco imagens 16:9. Elas aparecem no popup da direita quando o cliente abre o
card. O site troca as imagens automaticamente e também mostra setas grandes
para avançar ou voltar em loop.

Na aba **Conteúdo**, o campo **Vídeo demonstrativo do YouTube** aceita o link
completo ou o ID de 11 caracteres. Quando houver vídeo e imagens, o vídeo abre
primeiro e as setas percorrem toda a apresentação. O player não inicia áudio
sozinho e oferece um link para abrir o vídeo diretamente no YouTube.

- **Adicionar imagens:** aceita JPG, PNG, WEBP ou AVIF de até 5 MB;
- **Setas da miniatura:** mudam a ordem da apresentação;
- **Remover:** retira somente aquela arte da galeria;
- galeria vazia mantém “Demonstração em preparação” e não quebra o card.

Depois de organizar, faça a revisão normal e salve o produto. A imagem principal
do card e o banner do checkout são campos separados; mexer na galeria não troca
nenhum deles.

## Cupons de desconto

Abra **Cupons de desconto** na central de comando. Um cupom possui:

- código que o cliente digita;
- nome interno da campanha;
- percentual inteiro de 1% a 90%;
- compra mínima opcional;
- data de início e validade opcionais;
- status rascunho, ativo, pausado ou arquivado.

Somente **Ativo** funciona no checkout. Prefira **Pausar** para interromper uma
campanha temporariamente e **Arquivar** para encerrar sem apagar o histórico. O
preço final é calculado pelo servidor a partir da oferta comercial aprovada; o
administrador não precisa editar preço de produto para criar uma campanha.

## Campos que exigem cuidado

### Vídeo demonstrativo do YouTube

Cole o link HTTPS completo ou somente os 11 caracteres finais. O painel
normaliza os dois formatos para o mesmo vídeo. Exemplo:

```text
Link completo: https://www.youtube.com/watch?v=BqPwa1SXowE
Também aceito: BqPwa1SXowE
```

Depois escolha **Horizontal (16:9)** ou **Vertical (Shorts)**.

### Variações e preços

Cada duração ou plano é uma variação. Confira nome e valor antes de salvar. Não
coloque `R$` dentro do campo numérico; digite somente o valor. O painel permite:

- **Nova variação:** cria outra opção comercial;
- **Duplicar:** reaproveita uma opção como ponto de partida;
- **Destacar:** mantém um único plano em evidência;
- **Cor da variação:** personaliza somente aquela opção;
- **Esgotada, mas visível:** mostra a opção ao cliente e bloqueia compra;
- **Arquivada e oculta:** guarda a opção, mas a retira da vitrine;
- **Reativar:** devolve uma opção arquivada;
- **Remover:** exclui a opção do card somente depois de confirmação;
- **Setas:** mudam a ordem das opções.

O botão **Marcar card esgotado** bloqueia todas as variações de uma vez sem
apagar preço ou configuração. Ao reativar, o estado comercial anterior volta.

## O que Maycon não deve fazer

- não editar tabelas manualmente no Supabase;
- não executar SQL encontrado na internet;
- não apagar o usuário administrador;
- não alterar `app_metadata` depois que o papel `admin` estiver correto;
- não apagar o bucket `product-assets`;
- não colar chaves, tokens, senhas ou webhooks em campos de produto;
- não salvar antes de conferir imagem, texto, variação e preço;
- não compartilhar a senha administrativa;
- não usar a conta administrativa em computador público.

## Se algo der errado

1. Não continue fazendo outras alterações.
2. Se ainda não salvou, recarregue a página e descarte a mudança.
3. Se arquivou o card errado, abra **Arquivo**, selecione o mesmo card e clique
   em **Restaurar card**. Para recuperar textos, preços ou imagens de uma revisão
   antiga, abra **Histórico** apenas para identificar a versão correta e peça
   assistência; restauração de conteúdo não fica disponível no painel cotidiano.
4. Se a conta não entrar, não crie vários usuários; peça para conferir o papel
   `admin` da conta existente.
5. Se a imagem não aparecer, não mexa no Storage; tente enviar novamente pelo
   botão **Substituir imagem**.
6. Se o site mostrar erro depois de salvar, anote qual produto foi alterado e
   peça assistência antes de mexer em outro.

## Checklist rápido antes de salvar

- [ ] Escolhi o produto correto.
- [ ] O título e a descrição estão corretos.
- [ ] A imagem aparece bem na prévia.
- [ ] O vídeo pertence ao produto certo.
- [ ] As variações e preços foram conferidos.
- [ ] Escrevi uma nota explicando a alteração.
- [ ] Marquei a confirmação somente depois de revisar a prévia e os preços.
- [ ] Vou conferir o resultado no site depois de salvar.

## Decisões que pertencem ao Maycon

- escolher se o atendimento começa manual e em qual horário alguém responde;
- informar quais meios de pagamento ele realmente consegue confirmar;
- definir quem pode entregar cada produto e em quanto tempo;
- aprovar política de reembolso e cancelamento;
- decidir quando o volume justifica automação;
- fornecer a documentação oficial e o sandbox da carteira antes da integração;
- manter uma conta administrativa própria, sem compartilhar a senha.
