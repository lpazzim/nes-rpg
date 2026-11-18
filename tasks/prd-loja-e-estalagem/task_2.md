# Tarefa 2.0: Regras da loja e da estalagem com testes

## Visão geral

Cria as tabelas de lojas e estalagens e as regras puras de comprar, vender e descansar, ainda sem tela. O resultado se confere com `npm test`: os testes provam que o ouro nunca fica negativo, que nenhum item passa de 99 e que pedidos inválidos são recusados sem mexer em nada.

<rules>
### Conformidade com o AGENTS.md e as rules

- `code-standards.md#5`: preços, limite da bolsa e taxa de venda ficam em `src/items.js` (`SHOPS`, `INNS`, `MAX_STACK`, `SELL_RATE`).
- `folder-structure.md#5`: `src/shop.js` é módulo de base e só importa `items.js`.
- `javascript.md#5` e `#6`: JSDoc dos contratos `Wallet` e `ShopResult`; as tabelas nunca são alteradas em jogo.
- `tests.md#2`: TU para cada regra com número ou condição; o teste de conteúdo itera sobre **todas** as lojas.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF1.1 (estoque em dados), RF1.4–RF1.8 (regras), RF2.2–RF2.5 (regras), RF3.1
</requirements>

## Subtarefas

- [x] 2.1 Adicionar `SHOPS`, `INNS`, `MAX_STACK` e `SELL_RATE` em `src/items.js`, com a loja da vila (4 itens) e a estalagem (20 G).
- [x] 2.2 Criar `src/shop.js` com `sellPrice`, `maxBuy`, `buy`, `sell`, `sellableItems`, `needsRest` e `rest`, com as validações e motivos de recusa da TechSpec.
- [x] 2.3 Fazer `updatePickups` (em `combat-system.js`) respeitar `MAX_STACK` ao pegar Poção do chão.
- [x] 2.4 Criar `tests/shop.test.mjs` (TU-03 a TU-14) e adicionar TI-03 ao `content.test.mjs`.
- [x] 2.5 Rodar `npm test`.
- [x] 2.6 Atualizar documentação: `game-architecture.md#9` (checklist "Novo item" cita `SHOPS`) e um checklist "Nova loja/estalagem".

## Detalhes de implementação

Ver `techspec.md` → "Contratos de dados" (`SHOPS`, `INNS`, API de `src/shop.js`). A ordem das checagens de `rest` importa: `rested` antes de `gold`. Funções só alteram a carteira quando devolvem `ok: true`. TU-14 usa sequência com semente (`makeRng` de `maps/builder.js` ou um gerador local simples).

## Critérios de aceitação relacionados

- CA-03, CA-04, CA-05, CA-06, CA-07, CA-08 (regras), CA-10, CA-11, CA-12 (regras), CA-14

## Testes da tarefa

### Unidade
- [x] TU-03 — comprar 3 Poções com 100 G e 3 na bolsa
- [x] TU-04 — `maxBuy` limitado pelo ouro e pela bolsa
- [x] TU-05 — compra sem ouro recusada
- [x] TU-06 — compra com bolsa cheia (99, e 98 + 3) recusada
- [x] TU-07 — vender 2 de 3; vender a última remove a chave
- [x] TU-08 — `sellPrice` = metade arredondada para baixo
- [x] TU-09 — `sellableItems` vazio e com id desconhecido
- [x] TU-10 — `rest` cura, revive e cobra
- [x] TU-11 — `rest` sem ouro recusado
- [x] TU-12 — `rest` com grupo cheio recusado sem cobrar
- [x] TU-13 — entradas inválidas recusadas sem alterar nada
- [x] TU-14 — 500 operações com semente: ouro ≥ 0 e quantidades entre 1 e 99

### Integração de conteúdo
- [x] TI-03 — estoques apontam para itens com preço válido; chaves de `SHOPS`/`INNS` existem em `DIALOGUES`; a vila vende os 4 itens

### Ponta a ponta (navegador)
- Nenhum (sem tela nesta tarefa).

## Arquivos relevantes

- `src/items.js`, `src/shop.js` (novo), `src/combat-system.js`
- `tests/shop.test.mjs` (novo), `tests/content.test.mjs`
- `.agents/rules/game-architecture.md`
