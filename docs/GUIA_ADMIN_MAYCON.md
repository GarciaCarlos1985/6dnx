# Guia simples do Painel Administrativo 6DNX

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

1. Abra `https://6dnx.vercel.app/admin/login`.
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

### Opção 2 — cobrança automática (futura)

1. O servidor do 6DNX cria um pedido com identificador único no Supabase.
2. O servidor pede à API oficial da carteira uma cobrança para aquele pedido.
3. O cliente paga usando os dados devolvidos pela carteira.
4. A carteira chama um webhook do 6DNX.
5. O servidor verifica a assinatura criptográfica do webhook e impede que o
   mesmo evento seja processado duas vezes.
6. Só então o pedido muda para **Pago** e o Discord recebe o aviso.

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

O que ainda não existe é o código que fica entre a loja e a Wallet: criar o
pedido no Supabase, pedir o Pix, devolver QR Code/copia e cola, receber o aviso,
validar `X-Storm-Signature` no corpo bruto e impedir eventos repetidos. Por
isso, cadastrar os segredos não ativa a compra por si só.

### Atenção ao campo “Webhook de pagamentos” da StorM

A URL de webhook do Discord colocada nesse campo está no lugar errado. O
Discord recebe notificações para a equipe; ele não sabe validar nem processar
um evento financeiro da StorM.

Enquanto a integração 6DNX não estiver implementada e publicada:

1. remova a URL do Discord do campo de webhook da StorM;
2. deixe o webhook financeiro sem destino, se o painel permitir;
3. não gere outra API key e não regenere o secret HMAC sem necessidade;
4. não coloque ainda a futura URL da 6DNX;
5. continue usando o atendimento manual e confirme o recebimento diretamente
   no painel da Wallet.

Depois de a rota existir e passar pelos testes de sandbox, o campo deverá
apontar para:

```text
https://6dnx.vercel.app/api/webhooks/storm-wallet
```

Essa URL ainda não funciona hoje. Configurá-la antes da implementação apenas
criaria eventos perdidos e uma falsa impressão de automação.

Para terminar a integração, a equipe precisa da documentação expandida da API,
sem nenhum segredo: endpoint e corpo para criar Pix, formato da resposta, ID e
estados da cobrança, expiração, consulta, eventos do webhook, cálculo exato da
assinatura HMAC, idempotência, sandbox, cancelamento e reembolso.

### O que foi retirado dos cards

Os atalhos **Download Manager** e **Instalar Drivers** foram removidos de todos
os produtos. Eles pertenciam ao fluxo de outro site e poderiam levar clientes
a arquivos que o 6DNX não controla. Se um novo botão for necessário no futuro,
ele deve ganhar nome, destino e responsabilidade aprovados pelo Maycon antes de
ser publicado.

### Posso entrar de outro computador ou de outro estado?

Sim. O painel fica na internet e não está preso ao computador em que foi
configurado. Maycon pode abrir `https://6dnx.vercel.app/admin/login` no
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

Não existe botão para criar, duplicar, excluir ou retirar produto. Isso é
intencional: a lista serve para escolher um card existente, não para alterar a
estrutura da loja por acidente.

### Área do meio

É o formulário de edição. Ele foi dividido em cinco etapas:

1. **Básico:** nome, categoria, status, frase curta e descrição;
2. **Visual:** troca segura de imagem; a paleta oficial é protegida;
3. **Conteúdo:** vídeo, recursos, compatibilidade e tutorial;
4. **Variações:** edição dos planos e preços que já existem;
5. **Revisão:** mostra o que está protegido, pede uma conferência e salva.

### Prévia da direita

Mostra como o card deverá ficar. A prévia ajuda a perceber textos compridos ou
imagens inadequadas antes de salvar. As cores não podem ser
mudadas no painel cotidiano, portanto Maycon não consegue diminuir o contraste
ou fugir da identidade 6DNX por engano.

## O que o painel impede automaticamente

Maycon não precisa decorar uma lista de “não clique”. As ações perigosas não
ficam disponíveis:

- não há botão de criar ou duplicar produto;
- não há controle para publicar, arquivar ou retirar um card;
- não há campo para trocar a rota ou a ordem do carrossel;
- não há seletor livre de cores;
- não há botão para adicionar ou apagar uma variação comercial;
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
continua rascunho e arquivado continua arquivado. Retirar ou recolocar um
produto exige uma tarefa técnica separada.

## Botões importantes

- **Revisar alterações:** leva à conferência final, sem salvar ainda;
- **Salvar campos seguros:** grava somente o conteúdo permitido;
- **Histórico:** mostra versões anteriores em modo de consulta;
- **Ver site:** abre a loja em outra aba para conferência;
- **Sair:** encerra a sessão administrativa.

## Campos que exigem cuidado

### ID do vídeo no YouTube

Cole somente os 11 caracteres finais do link. Exemplo:

```text
Link completo: https://www.youtube.com/watch?v=BqPwa1SXowE
ID correto:    BqPwa1SXowE
```

Depois escolha **Horizontal (16:9)** ou **Vertical (Shorts)**.

### Variações e preços

Cada duração ou plano é uma variação. Confira nome e valor antes de salvar. Não
coloque `R$` dentro do campo numérico; digite somente o valor. O painel permite
editar as opções existentes, mas não oferece botões para criar ou apagar uma
delas por acidente.

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
3. Se já salvou, abra **Histórico** apenas para identificar a última versão
   correta e peça assistência para restaurá-la; o botão perigoso não fica
   disponível no painel cotidiano.
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
