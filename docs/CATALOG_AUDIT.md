# Auditoria do catálogo 6DNX

Fonte de verdade visual: os 45 arquivos de `discord-imagens/`, revisados em
2026-07-28. Este documento preserva o que os prints comprovam sem transformar
preço, estoque ou texto possivelmente desatualizado em dado comercial ativo.

## Famílias confirmadas

| Família do card | Produtos e variações comprovados | Evidência principal |
| --- | --- | --- |
| DayZ | Moonwalk, spow, Private, GG, Rage/Nuke, Shadow Menu e Elisium | capturas 03 a 16 |
| Arc Raiders | Private e GG Legit | capturas 17 a 20 |
| Counter-Strike 2 | Kryptos External, Horus External e Radar GC Elysium | capturas 21 a 26 |
| Contas Steam NFA | DayZ, CS2 Premier, Arc Raiders, Rust, Dead by Daylight, Squad, Scum e Arma Reforger | capturas 27 a 34 |
| Custom Steam Profile | modelos prontos, perfil sob encomenda e requisitos | capturas 35 a 44 |
| Reshades | Free Reshades e Seu Reshade | captura 45 e `reshade.jpeg` |
| Thermal | preset/configuração visual térmica | `termal.jpeg` e `reshade.jpeg` |

O modelo de catálogo mantém uma família por card e apresenta seus produtos como
variações no popup. Assim, o usuário não recebe dezenas de cards quase iguais e
a navegação lateral continua compatível com o fluxo de compra.

## Regras verificadas nas contas NFA

Os oito prints de contas repetem as mesmas instruções:

- entrar na conta e jogar;
- não finalizar a sessão;
- não mudar a senha;
- não mudar o e-mail.

Os prints exibem R$ 9,89 para DayZ e R$ 9,90 para as demais contas listadas,
com estoques diferentes por jogo. Esses valores permanecem apenas como
evidência histórica até confirmação comercial do Maycon.

## Valores visíveis nos prints

| Produto | Planos visíveis no print |
| --- | --- |
| DayZ Private | 1 dia R$ 20,34; 7 dias R$ 56,98; 30 dias R$ 108,99 |
| DayZ GG | 1 dia R$ 21,42; 7 dias R$ 59,89; 30 dias R$ 118,63 |
| DayZ Rage/Nuke | 1 dia R$ 29,90; 7 dias R$ 119,90; 30 dias R$ 249,90 |
| DayZ Shadow Menu | 1 dia R$ 10,00; 7 dias R$ 49,90; 30 dias R$ 90,00; lifetime R$ 399,00 |
| DayZ Elisium | 1 dia R$ 14,98; 7 dias R$ 49,90; 30 dias R$ 89,90; lifetime R$ 299,00 |
| Arc Raiders Private | 1 dia R$ 25,90; 7 dias R$ 129,90; 30 dias R$ 152,90 |
| Arc Raiders GG Legit | 1 dia R$ 19,90; 7 dias R$ 49,90; 30 dias R$ 99,90 |
| CS2 Kryptos | 1 dia R$ 4,99; 10 dias R$ 15,00; 30 dias R$ 29,90; lifetime R$ 120,00 |
| CS2 Horus | 2 dias R$ 4,99; 8 dias R$ 15,00; 30 dias R$ 29,90; lifetime R$ 160,00 |
| CS2 Radar GC Elysium | 1 dia R$ 25,34; 7 dias R$ 69,90; outro plano rotulado novamente como “7 dias” por R$ 160,00 |

## Inconsistências que exigem confirmação humana

- O terceiro plano do print DayZ GG aparece como “DayZ Private 30 dias”.
- O último plano do Radar GC Elysium repete “7 dias”, embora tenha outro valor.
- Estoque, detecção e preço são dados temporais; não devem ser copiados para
  produção sem validação do proprietário.

## Direção das novas artes

As novas imagens em `public/products/card-art/` são criações originais, sem
texto, logotipos ou personagens copiados. Elas representam a fantasia de cada
família e usam a paleta 6DNX: preto, grafite, vinho e vermelho-sangue. O anjo
oficial do projeto é aplicado separadamente pelo componente do card, garantindo
consistência de identidade e permitindo animação sem duplicar a imagem em cada
arquivo.
