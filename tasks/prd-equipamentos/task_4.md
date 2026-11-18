# Tarefa 4.0: Loja vende equipamentos e o chefe deixa a peça

## Visão geral

Coloca os equipamentos à venda na loja da vila e faz o Treant Ancião largar o Coração do Bosque no chão. O resultado se confere jogando: dá para comprar uma arma, vendê-la pela metade, e pegar a peça do chefe andando por cima dela.

<rules>
### Conformidade com o AGENTS.md e as rules

- `folder-structure.md#5`: `items.js` passa a importar `equipment.js` (sentido único, sem ciclo); `shop.js` continua sendo base e puro.
- `game-architecture.md#9`: o checklist "Nova loja/estalagem" ganha a menção aos equipamentos no estoque.
- `code-standards.md#5`: estoques e preços continuam em tabelas.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF4.1 a RF4.5
</requirements>

## Subtarefas

- [x] 4.1 Em `src/items.js`: `findItem(id)` procurando em `ITEMS` e `EQUIPMENT`; acrescentar os equipamentos ao estoque da loja da vila (consumíveis primeiro).
- [x] 4.2 Em `src/shop.js`: trocar `ITEMS[id]` por `findItem(id)` em `buy`, `sell`, `maxBuy`, `sellPrice` e `sellableItems`, sem mudar o comportamento dos consumíveis.
- [x] 4.3 Em `src/combat-system.js`: `dropPickup` aceita o id da peça; `updatePickups` trata `kind: 'equip'` (coloca na bolsa e mostra `+<nome>`); o chefe larga a peça de `BOSS_DROP` junto com a cura.
- [x] 4.4 Desenhar o item de equipamento no chão com cor própria, para não parecer poção.
- [x] 4.5 Adicionar `TI-03` e `TI-04` ao `content.test.mjs` e conferir que os testes de loja existentes continuam passando.
- [x] 4.6 Rodar `npm test` e os E2E-06, E2E-07 e E2E-08.

## Detalhes de implementação

Ver `techspec.md` → "Fluxo" (Comprar e vender, Peça do chefe) e "Principais decisões" (equipamento na mesma bolsa `{ id: quantidade }`). Peças equipadas não estão na bolsa, então ficam fora da lista de venda sem código extra.

## Critérios de aceitação relacionados

- CA-07, CA-08, CA-09, CA-10

## Testes da tarefa

### Unidade
- Cobertas na 1.0 (as regras de compra e venda já existem e passam a usar `findItem`).

### Integração de conteúdo
- [x] TI-03 — todo id de estoque existe; peças `shop: false` ficam fora dos estoques; a vila vende equipamento
- [x] TI-04 — `BOSS_DROP` aponta para peça existente e para uma flag de chefe que existe nos mapas

### Ponta a ponta (navegador)
- [x] E2E-06 — loja da vila mostra consumíveis e equipamentos com preço
- [x] E2E-07 — peça equipada não aparece em Vender; vender dá metade do preço
- [x] E2E-08 — derrotar o Treant Ancião e pegar o Coração do Bosque no chão

## Arquivos relevantes

- `src/items.js`, `src/shop.js`, `src/combat-system.js`
- `tests/content.test.mjs`
- `.agents/rules/game-architecture.md`
