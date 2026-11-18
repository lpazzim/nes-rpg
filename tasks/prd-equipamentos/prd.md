# PRD — Equipamentos

## Visão geral

A aba **Equip.** do menu já existe, mas está vazia: só mostra "Arma / Armadura / Acessório" e um aviso de que a troca chega junto com as lojas. Agora que a loja e a estalagem estão prontas, o jogador tem onde gastar ouro, mas só em itens consumíveis. Esta funcionalidade dá a cada herói **três espaços de equipamento** (arma, armadura e acessório) que mudam os atributos e, em algumas peças, acrescentam um efeito simples.

Com isso o ouro ganha um segundo destino, derrotar o Treant Ancião passa a valer uma recompensa guardável, e o jogador ganha a decisão clássica do gênero: gastar agora em poções ou juntar para a arma melhor. É também a primeira entrega que muda o formato do save, então os saves existentes precisam de migração.

## Objetivos

- O jogador compra uma arma na loja e a equipa pelo menu em menos de 1 minuto.
- O cálculo de atributos (base + nível + equipamento) é coberto por testes de unidade e nunca produz atributo negativo.
- Os atributos mostrados na aba Status já somam o equipamento, e batem com o dano aplicado no combate.
- Saves feitos antes desta entrega continuam carregando, com nível, atributos e ouro preservados.
- Nenhum erro no console durante o fluxo completo (comprar, equipar, trocar, vender, salvar e carregar).

## Histórias de usuário

- US1: Como jogador, quero equipar uma arma melhor para derrotar os inimigos mais rápido.
- US2: Como jogador, quero ver quanto cada peça muda os atributos **antes** de confirmar, para escolher sem errar.
- US3: Como jogador, quero que cada herói só possa usar a arma do estilo dele, para não equipar a katana na Rin.
- US4: Como jogador, quero comprar equipamentos na loja da vila, para usar o ouro que ganhei.
- US5: Como jogador, quero uma recompensa especial por derrotar o Treant Ancião, para sentir que valeu a pena.
- US6: Como jogador, quero vender o equipamento velho, para recuperar parte do ouro.
- US7: Como jogador, quero ver no Status os atributos já com o equipamento somado, para saber minha força real.
- US8 (borda): Como jogador, quero tirar uma peça e deixar o espaço vazio, sem o jogo quebrar.
- US9 (borda): Como jogador com um save antigo, quero continuar minha campanha sem perder nível nem ouro.
- US10 (borda): Como jogador, quero que a peça equipada não apareça para vender na loja, para não vendê-la sem querer.

## Principais funcionalidades

### 1. Peças de equipamento

- RF1.1: Existem três tipos de espaço por herói: **arma**, **armadura** e **acessório**.
- RF1.2: Cada peça tem nome, tipo, preço, descrição e os atributos que altera (ataque, defesa, velocidade, crítico, MP máximo), em tabela de dados.
- RF1.3: Armas têm um **estilo** (`katana`, `daggers`, `mage`) e só podem ser equipadas pelo herói daquele estilo. Armaduras e acessórios servem para todos.
- RF1.4: Algumas peças têm um efeito simples, de dois tipos apenas: **PODER enche mais rápido** (percentual) e **reduz o dano recebido** (percentual).
- RF1.5: A redução de dano começa pequena (5%) nas peças comuns e cresce nas peças raras, até 12% na peça do chefe. Duas peças que reduzem dano somam, limitadas a 25% no total.
- RF1.6: Nenhum atributo pode ficar abaixo de 1 por causa de um equipamento (peças pesadas tiram velocidade).
- RF1.7: Esta entrega traz cerca de 15 peças: 3 armas iniciais (uma por herói), 6 armas compráveis (2 por herói), 4 armaduras, 3 acessórios e 1 peça exclusiva do Treant Ancião.

### 2. Equipamento inicial e no jogo

- RF2.1: Em um jogo novo, cada herói já começa com a arma inicial do seu estilo equipada; armadura e acessório começam vazios.
- RF2.2: A força do grupo no começo do jogo continua equivalente à de hoje (a arma inicial não deixa o início mais fraco nem mais forte).
- RF2.3: Os atributos usados no combate (ataque, defesa, velocidade, crítico, MP máximo) passam a ser **base + ganhos de nível + equipamento**.
- RF2.4: Subir de nível continua aumentando os atributos base, sem interferir no que o equipamento soma.

### 3. Aba Equip. do menu

- RF3.1: A aba Equip. mostra os três espaços do herói selecionado, com a peça equipada em cada um (ou "vazio").
- RF3.2: Ao escolher um espaço, aparece a lista das peças **compatíveis** que estão na bolsa, mais a opção "Tirar" quando há algo equipado.
- RF3.3: Com uma peça selecionada, o jogador vê a **comparação**: cada atributo que muda aparece com o valor atual, o novo valor e uma seta, em **verde** quando melhora e **vermelho** quando piora. Efeitos especiais aparecem escritos.
- RF3.4: Confirmar troca a peça: a nova sai da bolsa e a anterior volta para a bolsa.
- RF3.5: Trocar de herói na aba Equip. usa as mesmas teclas de hoje (setas), e voltar usa K/Esc, um passo por vez.
- RF3.6: A aba Status mostra os atributos já com o equipamento somado, e indica o nome das peças equipadas.

### 4. Loja e recompensa

- RF4.1: A loja da vila passa a vender equipamentos junto com os itens, numa lista única ordenada (consumíveis primeiro, depois equipamentos).
- RF4.2: Equipamentos são vendidos pela metade do preço, como os outros itens.
- RF4.3: Peças **equipadas** não aparecem na lista de venda; só as que estão na bolsa.
- RF4.4: Ao derrotar o Treant Ancião, a peça especial cai no chão junto com a cura que ele já deixa, e o grupo a pega andando por cima, com aviso na tela.
- RF4.5: Equipamentos não empilham como poções: cada unidade ocupa seu lugar na bolsa (dá para ter duas peças iguais).

### 5. Save

- RF5.1: O equipamento de cada herói vai para o save.
- RF5.2: `SAVE_VERSION` passa para 2, com **migração** dos saves da versão 1: o jogador mantém nível, experiência, ouro, bolsa, flags e posição, e recebe as armas iniciais equipadas, sem perder a força que tinha.
- RF5.3: Um save migrado pode ser salvo de novo normalmente, já na versão nova.

## Critérios de aceitação

- CA-01: Dado um jogo novo, quando o jogador abre a aba Equip., então cada herói aparece com a arma inicial do seu estilo equipada e os outros dois espaços vazios. (US1, RF2.1)
- CA-02: Dado um jogo novo, quando o jogador olha o Status, então ataque, defesa, velocidade e crítico são iguais aos de hoje (a arma inicial não muda a força). (RF2.2)
- CA-03: Dado o Kaito com a Katana Gasta e a Katana de Aço na bolsa, quando o jogador seleciona a Katana de Aço, então vê a comparação com o ataque atual e o novo em verde, antes de confirmar. (US2, RF3.3)
- CA-04: Dado o passo anterior, quando o jogador confirma, então a Katana de Aço fica equipada, a Katana Gasta volta para a bolsa e o ataque no Status sobe conforme a comparação mostrou. (US1, RF3.4, RF3.6)
- CA-05: Dada a Rin selecionada, quando o jogador abre o espaço de arma, então a lista mostra só as armas de adagas, sem a katana nem o bastão. (US3, RF1.3, RF3.2)
- CA-06: Dado um herói com armadura equipada, quando o jogador escolhe "Tirar", então o espaço fica vazio, a peça volta para a bolsa e os atributos caem conforme a comparação mostrou. (US8, RF3.2)
- CA-07: Dado o jogador na loja da vila, quando abre Comprar, então a lista mostra os consumíveis e os equipamentos à venda, cada um com preço. (US4, RF4.1)
- CA-08: Dado um equipamento na bolsa e outro igual equipado, quando o jogador abre Vender, então só o da bolsa aparece na lista. (US10, RF4.3)
- CA-09: Dado um equipamento comprado por 400 G, quando o jogador o vende, então recebe 200 G. (US6, RF4.2)
- CA-10: Dado o Treant Ancião derrotado, quando o grupo anda sobre a peça que ele deixou, então ela entra na bolsa com um aviso na tela e pode ser equipada. (US5, RF4.4)
- CA-11: Dado um herói com a armadura que reduz 5% do dano e o acessório do chefe que reduz 12%, quando ele leva um golpe, então o dano recebido é ~17% menor que sem as peças (soma limitada a 25%). (RF1.4, RF1.5)
- CA-12: Dado o acessório que acelera o PODER em 30%, quando o herói acerta golpes, então a barra enche mais rápido que sem ele. (RF1.4)
- CA-13: Dado um save feito antes desta entrega (versão 1), quando o jogador escolhe Continuar, então a campanha carrega com o mesmo nível, ouro, bolsa e mapa, com as armas iniciais equipadas e sem erro no console. (US9, RF5.2)
- CA-14: Dado um jogo com equipamentos trocados, quando o jogador salva e carrega esse save, então cada herói volta com as mesmas peças equipadas e os mesmos atributos. (RF5.1, RF5.3)
- CA-15: Testes de unidade cobrem o cálculo de atributos: base + nível + equipamento, peças que tiram atributo nunca deixam o valor abaixo de 1, equipar e desequipar não "vaza" bônus (equipar e tirar devolve o valor original) e a redução de dano respeita o limite de 25%. (RF1.6, RF2.3, RF2.4, Objetivo)
- CA-16: Partindo da loja, o jogador compra uma arma e a equipa pelo menu em menos de 1 minuto. (Objetivo)

## Experiência do jogador

- **Controles:** os mesmos de hoje, sem tecla nova. No menu, **Q/E** trocam a aba, **setas** escolhem, **J/Enter** confirma e **K/Esc** volta um passo. Na aba Equip., as setas escolhem o espaço e depois a peça; o herói é trocado como nas outras abas.
- **Telas e layout** (480x270, no painel direito do menu, que já existe):

  ```
  +-- Equipamento - Kaito ---------------------------------+
  |  Arma        Katana Gasta                              |
  | >Armadura    (vazio)                                   |
  |  Acessorio   Bracelete de Cobre                        |
  +--------------------------------------------------------+
  |  Gibao de Couro          Defesa   7 -> 13   (verde)    |
  |                          Velocid. 72 -> 70  (vermelho) |
  |                          Reduz 5% do dano recebido     |
  |  J: equipar   K: voltar                                |
  +--------------------------------------------------------+
  ```

  A lista de peças compatíveis ocupa a parte de baixo do painel, com a comparação ao lado da peça selecionada. Textos sem acentos, como no resto do jogo.
- **Feedback:** a comparação em verde e vermelho é o feedback principal; ao confirmar, um aviso curto ("Kaito equipou Katana de Aco"). A peça do chefe brilha no chão como os outros itens e mostra "+Coracao do Bosque" ao ser pega.
- **Ícones:** sem ícones nesta entrega, como na loja: só texto e cores. O pedido de arte fica registrado.
- **Persistência:** o equipamento de cada herói entra no save, que passa para a versão 2 com migração automática dos saves antigos.

## Balanceamento

Valores propostos; o ouro do Treant Ancião é 250 G e os inimigos comuns dão de 6 a 16 G.

| Peça | Tipo | Preço | Efeito |
| :--- | :--- | :--- | :--- |
| Katana Gasta / Adagas Simples / Bastão Rachado | Arma inicial | — | Sem bônus (a força de hoje) |
| Katana de Aço | Arma (Kaito) | 150 G | +6 ataque |
| Lâmina do Vento | Arma (Kaito) | 450 G | +12 ataque, +4 velocidade |
| Adagas Afiadas | Arma (Rin) | 150 G | +4 ataque, +4% crítico |
| Garras Gêmeas | Arma (Rin) | 450 G | +8 ataque, +8% crítico |
| Bastão de Cristal | Arma (Aster) | 150 G | +5 ataque, +10 MP máximo |
| Cajado Rúnico | Arma (Aster) | 450 G | +9 ataque, +20 MP máximo |
| Túnica de Viajante | Armadura | 90 G | +3 defesa |
| Gibão de Couro | Armadura | 220 G | +6 defesa, −2 velocidade, reduz 5% do dano |
| Cota de Malha | Armadura | 500 G | +11 defesa, −6 velocidade, reduz 8% do dano |
| Manto Élfico | Armadura | 380 G | +5 defesa, +6 velocidade |
| Bracelete de Cobre | Acessório | 100 G | +2 defesa, +2 ataque |
| Botas Leves | Acessório | 180 G | +8 velocidade |
| Anel do Ímpeto | Acessório | 320 G | PODER enche 30% mais rápido |
| **Coração do Bosque** | Acessório (Treant Ancião) | — (venda 150 G) | +4 defesa, +5% crítico, reduz 12% do dano |

Outras regras de balanceamento:

| Regra | Valor | Justificativa |
| :--- | :--- | :--- |
| Preço de venda | Metade, arredondada para baixo | Igual aos consumíveis |
| Limite de redução de dano | 25% somando todas as peças | Impede ficar quase imune com peças futuras |
| Atributo mínimo | 1 | Peças pesadas não podem zerar a velocidade |
| Armas iniciais | Sem bônus nenhum | Mantém o começo igual ao de hoje (RF2.2) |

## Recursos externos

| ID | Recurso | Necessário para | Placeholder enquanto isso | Situação |
| :--- | :--- | :--- | :--- | :--- |
| REC-01 | Ícones 16x16 de armas, armaduras e acessórios | Opcional — não bloqueia nenhum CA | Listas só com texto e cores | Pendente (opcional) |

Pedido pronto, para quando o dono do projeto quiser os ícones:

```
Preciso de: ícones de equipamento (aba Equip. e loja)
Formato: fundo cinza liso, um ícone por célula numa grade, mesmo estilo SNES das folhas atuais
Quadros: katana, duas adagas, bastao/cajado, tunica, gibao de couro, cota de malha, manto, bracelete, botas, anel, amuleto do bosque
Tamanho: cada ícone com 32x32 px na folha (pixels de 2x2), virando 16x16 no jogo
Enquanto isso: uso só o nome da peça em texto colorido, que será trocado quando a arte chegar
```

## Restrições de alto nível

- Roda no navegador, sem build e sem dependências (ver `AGENTS.md`).
- **Saves existentes exigem migração:** `SAVE_VERSION` passa de 1 para 2. Hoje saves de versão diferente são simplesmente ignorados, o que apagaria a campanha em andamento do dono do projeto; por isso a migração é obrigatória e precisa de teste.
- Peças, preços e bônus ficam em tabelas de dados, para que as aventuras 2 e 3 acrescentem equipamento sem código novo.
- Conteúdo original: nomes de peças próprios.
- O desenho do herói não muda com o equipamento (fora do escopo).

## Fora do escopo

- Aparência dos sprites mudando com o equipamento.
- Melhoria, forja ou encantamento de peças.
- Equipamento para os inimigos.
- Peças das aventuras 2 e 3 (entram com cada aventura, usando as tabelas criadas aqui).
- Ícones de equipamento (REC-01).
- Comparação automática de "melhor peça" ou equipar tudo de uma vez.
- Vender equipamento direto da tela de equipar (a venda continua só na loja).

## Dependências

- `loja-e-estalagem` concluído (loja com compra e venda, bolsa, ouro) — **concluído**.
- Fase 2 concluída (menu com abas Status/Itens/Equip., save em 3 espaços) — **concluída**.
