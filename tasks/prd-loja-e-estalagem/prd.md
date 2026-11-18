# PRD — Loja e estalagem

## Visão geral

O jogador já ganha ouro derrotando inimigos (Espantalho 6 G, Treant 10 G, Treant Ancião 250 G), mas não tem onde gastá-lo: na Vila de Pradaria, o Mercador e a Estalajadeira só dizem "volte em breve". Esta funcionalidade cria a **loja** (comprar e vender itens) e a **estalagem** (descansar pagando para recuperar o grupo), fechando o ciclo "lutar → ganhar ouro → se preparar → voltar a lutar", que é a base da economia de um RPG.

Antes de começar, o `src/game.js` (~500 linhas, acima do limite de 400 das regras) precisa ser dividido, como recomendou a revisão da fase de NPCs (`tasks/prd-npcs-e-dialogos/codereview.md`). A loja traz um modo novo e, sem a divisão, o arquivo passaria de 550 linhas. Por isso a divisão é a **primeira tarefa** desta entrega e não muda nada do que o jogador vê.

## Objetivos

- O jogador compra 3 Poções na vila, a partir do momento em que fala com o Mercador, em menos de 30 segundos.
- É impossível ficar com ouro negativo, com quantidade negativa ou com mais de 99 unidades de um item (garantido por testes de unidade).
- Saves feitos antes desta entrega continuam carregando sem perder ouro nem itens.
- `src/game.js` fica com no máximo 400 linhas depois da divisão, e todos os testes existentes continuam passando.
- Nenhum erro no console durante o fluxo completo (comprar, vender, descansar, salvar e carregar).

## Histórias de usuário

- US1: Como jogador, quero comprar itens do Mercador para me preparar antes da floresta e da dungeon.
- US2: Como jogador, quero escolher quantas unidades comprar de uma vez, vendo o preço total, para não repetir a compra item por item.
- US3: Como jogador, quero ver quanto ouro tenho e quantas unidades já carrego de cada item, para decidir o que comprar.
- US4: Como jogador, quero vender itens que sobraram pela metade do preço, para conseguir ouro numa emergência.
- US5: Como jogador, quero descansar na estalagem pagando um valor pequeno, para recuperar HP e MP e reviver aliados caídos sem gastar poções.
- US6 (borda): Como jogador sem ouro suficiente, quero um aviso claro em vez de a compra ou o descanso simplesmente não acontecer.
- US7 (borda): Como jogador com 99 unidades de um item, quero que a loja não me deixe comprar mais desse item.
- US8 (borda): Como jogador com a bolsa vazia, quero ver uma mensagem na tela de venda em vez de uma lista vazia.
- US9 (borda): Como jogador com o grupo já cheio de vida, quero ser avisado antes de pagar por um descanso que não faria diferença.

## Principais funcionalidades

### 0. Pré-requisito técnico — dividir o `game.js` (primeira tarefa)

Separar responsabilidades do `game.js` em módulos menores, como previsto na dívida técnica do `AGENTS.md`: combate (dano, hitboxes, inimigos derrotados, XP, explosões) e interação/conversas (alvo mais próximo, falar com NPC, ações do diálogo, empurrar heróis de NPCs). O comportamento do jogo não muda.

- RF0.1: O `game.js` fica com no máximo 400 linhas e nenhuma função passa de 60 linhas.
- RF0.2: Todo o jogo continua funcionando igual: combate, XP, ouro dos inimigos, conversas, cristais, troca de mapas, save.
- RF0.3: As regras de dependência de `folder-structure.md` continuam respeitadas (só `main.js` importa `game.js`), e a dívida técnica do `AGENTS.md` é atualizada.

### 1. Loja do Mercador

Ao escolher **Comprar** ou **Vender** na conversa com o Mercador, abre a tela da loja. Cada loja tem o seu estoque, definido em tabela, para que as cidades das aventuras 2 e 3 tenham lojas próprias sem código novo.

- RF1.1: Cada loja tem um estoque próprio definido em dados; a loja da vila vende Poção, Poção Forte, Éter e Pena de Fênix.
- RF1.2: A conversa com o Mercador passa a abrir a loja nas opções Comprar e Vender (as falas "em breve" são trocadas por falas de loja aberta). "Sair" encerra a conversa como hoje.
- RF1.3: **Comprar** mostra a lista do estoque com nome, preço e quantidade que o jogador já tem; a descrição do item selecionado aparece embaixo.
- RF1.4: Ao escolher um item, o jogador ajusta a quantidade com as setas (mínimo 1; máximo limitado pelo ouro disponível e pelo limite de 99 na bolsa) e vê o preço total antes de confirmar.
- RF1.5: Confirmar desconta o ouro e adiciona os itens à bolsa, com um aviso de sucesso.
- RF1.6: Sem ouro para nem 1 unidade, a loja mostra "Ouro insuficiente" e não deixa comprar. Com 99 unidades, mostra "Bolsa cheia" para aquele item.
- RF1.7: **Vender** mostra os itens da bolsa com quantidade e preço de venda (metade do preço de compra, arredondado para baixo); o jogador escolhe a quantidade (até o que tem) e confirma. Itens que chegam a 0 somem da lista.
- RF1.8: A venda aceita qualquer item da tabela de itens, mesmo os que aquela loja não vende.
- RF1.9: Com a bolsa vazia, a tela de venda mostra "Nada para vender".
- RF1.10: O ouro do jogador fica sempre visível nas telas de compra e venda.
- RF1.11: Cancelar (K/Esc) volta um passo: da quantidade para a lista, da lista para fechar a loja e voltar ao jogo.
- RF1.12: Enquanto a loja está aberta, o mundo fica congelado (como nas conversas e no menu).

### 2. Estalagem

Ao escolher **Descansar** na conversa com a Estalajadeira, o jogador vê o preço e confirma.

- RF2.1: A Estalajadeira informa o preço (20 G) e oferece Sim / Não.
- RF2.2: Confirmando com ouro suficiente: desconta 20 G, a tela escurece, o grupo recupera todo o HP e o MP, heróis caídos revivem com HP cheio, e a tela clareia com uma fala de "bom dia".
- RF2.3: Sem ouro suficiente, a Estalajadeira avisa e nada é cobrado.
- RF2.4: Com todos vivos e com HP e MP cheios, a Estalajadeira avisa que o grupo já está descansado e não cobra (o jogador pode sair).
- RF2.5: O preço fica numa tabela por estalagem, para que outras cidades tenham valores próprios.

### 3. Regras e persistência

- RF3.1: A lógica de compra, venda e descanso é pura e testada: nunca deixa ouro negativo, quantidade negativa, quantidade acima de 99 nem item desconhecido na bolsa.
- RF3.2: Ouro e bolsa continuam indo para o save como hoje; o formato do save não muda e saves antigos carregam normalmente.

## Critérios de aceitação

- CA-01: Dado o jogo atual, quando a divisão do `game.js` termina, então `npm test` passa, `game.js` tem no máximo 400 linhas e um teste de jogo completo (lutar, ganhar ouro e XP, conversar com NPC, salvar e carregar) se comporta como antes, sem erros no console. (RF0.1–RF0.3)
- CA-02: Dado o jogador ao lado do Mercador, quando aperta E e escolhe Comprar, então abre a lista com Poção (30 G), Poção Forte (90 G), Éter (60 G) e Pena de Fênix (150 G), cada um com a quantidade que ele já tem, e o ouro aparece na tela. (US1, US3, RF1.1–RF1.3, RF1.10)
- CA-03: Dado o jogador com 100 G e 3 Poções, quando escolhe Poção, sobe a quantidade para 3 e confirma, então o ouro vai para 10 G, ele passa a ter 6 Poções e aparece um aviso de compra. (US2, RF1.4, RF1.5)
- CA-04: Dado o jogador com 100 G, quando ajusta a quantidade de Poção, então a seta para cima para em 3 (máximo que o ouro paga) e a seta para baixo para em 1; o preço total acompanha. (US2, RF1.4)
- CA-05: Dado o jogador com 20 G, quando escolhe Poção (30 G), então vê "Ouro insuficiente" e o ouro e a bolsa não mudam. (US6, RF1.6)
- CA-06: Dado o jogador com 99 Poções, quando escolhe Poção, então vê "Bolsa cheia" e não compra. (US7, RF1.6)
- CA-07: Dado o jogador com 3 Poções, quando vende 2 na opção Vender, então recebe 30 G (15 G cada) e fica com 1 Poção; ao vender a última, a Poção some da lista. (US4, RF1.7)
- CA-08: Dado o jogador com a bolsa vazia, quando abre Vender, então vê "Nada para vender". (US8, RF1.9)
- CA-09: Dado a loja aberta, quando o jogador aperta K/Esc, então volta um passo por vez até o jogo, e nenhum inimigo se move enquanto a loja está aberta. (RF1.11, RF1.12)
- CA-10: Dado um herói caído e os outros feridos, com 50 G, quando o jogador escolhe Descansar e confirma, então a tela escurece e clareia, todos ficam com HP e MP cheios (o caído revive) e o ouro vai para 30 G. (US5, RF2.1, RF2.2)
- CA-11: Dado o jogador com 10 G, quando escolhe Descansar, então a Estalajadeira avisa que falta ouro e nada muda. (US6, RF2.3)
- CA-12: Dado o grupo todo vivo com HP e MP cheios, quando escolhe Descansar, então a Estalajadeira avisa que não precisa e não cobra. (US9, RF2.4)
- CA-13: Dado o jogador que comprou itens, quando salva num cristal e carrega esse save, então ouro e quantidades são os mesmos; um save feito antes desta entrega também carrega normalmente. (RF3.2)
- CA-14: Testes de unidade cobrem compra, venda e descanso: ouro nunca negativo, quantidades entre 0 e 99, item inexistente recusado, preço de venda = metade arredondada para baixo. (RF3.1)
- CA-15: Partindo da conversa com o Mercador, o jogador compra 3 Poções em menos de 30 segundos. (Objetivo)

## Experiência do jogador

- **Controles:** os mesmos do menu e das conversas — setas para mover e ajustar quantidade (cima/baixo na lista; esquerda/direita ou cima/baixo na quantidade), **J** ou **Enter** confirma, **K** ou **Esc** volta. Abre só pela conversa (tecla **E** perto do NPC). Nenhuma tecla nova.
- **Telas e layout** (480x270, janela azul no estilo das conversas e do menu):

  ```
  +--------------------------------------------------+
  | LOJA DA PRADARIA                 Ouro:   120 G  |
  +--------------------------------------------------+
  | > Pocao              30 G        Tem:  3         |
  |   Pocao Forte        90 G        Tem:  0         |
  |   Eter               60 G        Tem:  1         |
  |   Pena de Fenix     150 G        Tem:  1         |
  +--------------------------------------------------+
  | Recupera 60 HP de um aliado.                     |
  | Quantidade: < 3 >     Total: 90 G   [J] Comprar  |
  +--------------------------------------------------+
  ```

  A venda usa o mesmo layout, com o título "VENDER" e o preço de venda. Textos no canvas sem acentos (limitação da fonte atual).
- **Feedback:** aviso curto na própria janela ("Comprou 3 Pocao!", "Ouro insuficiente", "Bolsa cheia", "Vendeu 2 Pocao (+30 G)"); o ouro atualiza na hora. Na estalagem, escurecer e clarear a tela (~1 s cada) e fala de bom dia. Sons ficam para a fase de polimento.
- **Ícones:** sem ícones nesta entrega; a lista usa só texto e cores (dourado para preços, cinza para itens que não dá para comprar).
- **Persistência:** ouro e bolsa, que já vão para o save. Nada novo.

## Balanceamento

| Item | Valor inicial | Justificativa |
| :--- | :--- | :--- |
| Poção | 30 G (já definido) | ~5 Espantalhos ou 3 Treants |
| Poção Forte | 90 G (já definido) | 3x a Poção, cura ~3x mais |
| Éter | 60 G (já definido) | Só o Aster usa; mais raro de precisar |
| Pena de Fênix | 150 G (já definido) | Item de emergência; menos que o ouro do chefe (250 G) |
| Preço de venda | Metade do preço, arredondada para baixo | Padrão do gênero; evita lucro comprando e vendendo |
| Estalagem da vila | 20 G | ~3 inimigos; incentiva voltar à vila (escolha do dono do projeto) |
| Limite por item na bolsa | 99 | Padrão de RPGs de SNES (escolha do dono do projeto) |
| Ouro inicial | 50 G (já definido) | Dá para 1 Poção logo no começo |

## Recursos externos

| ID | Recurso | Necessário para | Placeholder enquanto isso | Situação |
| :--- | :--- | :--- | :--- | :--- |
| REC-01 | Ícones de itens 16x16 (Poção, Poção Forte, Éter, Pena de Fênix) | Opcional — não bloqueia nenhum CA | Lista só com texto e cores | Adiado (o dono do projeto optou por só texto nesta entrega) |

Pedido pronto, para quando o dono do projeto quiser os ícones (provavelmente junto com os equipamentos, prompt 5):

```
Preciso de: ícones de itens (loja e menu de itens)
Formato: fundo cinza liso, um ícone por célula numa grade, mesmo estilo SNES das folhas atuais
Quadros: Pocao (frasco vermelho), Pocao Forte (frasco maior, laranja), Eter (frasco azul), Pena de Fenix (pena dourada/vermelha)
Tamanho: cada ícone com 32x32 px na folha (pixels de 2x2), virando 16x16 no jogo
Enquanto isso: uso só o nome do item em texto colorido, que será trocado quando a arte chegar
```

## Restrições de alto nível

- Roda no navegador, sem build e sem dependências (ver `AGENTS.md`).
- Saves existentes continuam válidos: `SAVE_VERSION` não muda, porque ouro e bolsa já são salvos.
- A divisão do `game.js` não pode mudar comportamento; os testes existentes são a rede de segurança.
- Conteúdo original: nomes de lojas e falas próprios.
- Estoques e preços em tabelas de dados, para que as aventuras 2 e 3 adicionem lojas sem código novo.

## Fora do escopo

- Equipamentos à venda (prompt 5).
- Preços que mudam com o progresso, descontos ou negociação.
- Ícones de itens (REC-01 adiado).
- Sons da loja e da estalagem (fase de polimento).
- Lojas e estalagens das aventuras 2 e 3 (entram com cada aventura, usando as tabelas criadas aqui).
- Estalagem que também salva o jogo (o save continua nos cristais).

## Dependências

- `npcs-e-dialogos` concluído (Mercador, Estalajadeira, conversas com escolhas e a ação ao fim da conversa) — **concluído**.
- Fase 2 concluída (ouro, bolsa, menu de itens, save) — **concluída**.
