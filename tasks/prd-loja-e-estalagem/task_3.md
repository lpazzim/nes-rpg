# Tarefa 3.0: Tela da loja ligada ao Mercador

## Visão geral

Cria a tela da loja e o modo `shop`, e liga as opções Comprar e Vender do Mercador a ela. Ao final, dá para entrar no jogo, falar com o Mercador, comprar e vender, ver o ouro mudar e voltar ao jogo com K/Esc.

<rules>
### Conformidade com o AGENTS.md e as rules

- `game-architecture.md#2`: tela nova = classe em `src/ui/` com `update(dt, input)` e `draw(ctx)` + modo no `switch`; a tela fecha por callback (`game.closeShop()`) e nunca altera `game.mode` sozinha. Teclas por `navY`/`navX`/`confirm`/`back`.
- `game-architecture.md#4` (Conversas): ações novas `shop`/`sell` tratadas em `dialogAction`.
- `game-architecture.md#7`: a tela é desenhada no passo 5 (depois do HUD, antes do fade).
- `folder-structure.md#5`: `ui/shop.js` não importa entidades nem sistemas; lê o estado pela instância `game`.
- `code-standards.md#1`: textos do canvas sem acentos.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF1.1–RF1.12
</requirements>

## Subtarefas

- [x] 3.1 Criar `src/ui/shop.js` (`ShopScreen`): passos `list`/`qty`, seletor de quantidade, itens em cinza, avisos temporários, ouro sempre visível, "Nada para vender".
- [x] 3.2 Adicionar ao `Game` o modo `shop`, `openShop(npcId, kind)` e `closeShop()`, no `update` e no `render`.
- [x] 3.3 Tratar as ações `shop` e `sell` em `dialogAction` (`interaction.js`) e trocar as opções do Mercador em `dialogues.js` (sai o `'soon'`, entram falas curtas de loja aberta).
- [x] 3.4 Adicionar TI-04 ao `content.test.mjs` (só as ações `shop`/`sell` nesta tarefa; `inn` entra na 4.0).
- [x] 3.5 Rodar `npm test` e os E2E-02 a E2E-05 (aba separada, Novo Jogo, sem gravar no espaço 1). Conferir o layout com o canvas ampliado.
- [x] 3.6 Atualizar documentação: tabela de modos de `game-architecture.md#2` (modo `shop`) e ações em `#4`.

## Detalhes de implementação

Ver `techspec.md` → "Fluxo" (Loja), "Estado do `ShopScreen`", "Interface" (posições das janelas e navegação) e "Integração com o jogo" (modo `shop`). Lista sem rolagem (até 8 itens). Confirmar num item cinza mostra o motivo em vez de abrir o seletor.

## Critérios de aceitação relacionados

- CA-02, CA-03, CA-04, CA-05, CA-06, CA-07, CA-08, CA-09

## Testes da tarefa

### Unidade
- Cobertos na 2.0 (a tela só chama `shop.js`).

### Integração de conteúdo
- [x] TI-04 — ações usadas em `DIALOGUES` são conhecidas; NPC com `shop`/`sell` tem entrada em `SHOPS`; nenhum `'soon'` no Mercador

### Ponta a ponta (navegador)
- [x] E2E-02 — E no Mercador → Comprar: modo `shop`, 4 itens com preço e "Tem", ouro visível
- [x] E2E-03 — 100 G, Poção, ↑ ×5, J: seletor para em 3, total 90, ouro 10, 6 Poções
- [x] E2E-04 — avisos "Ouro insuficiente", "Bolsa cheia" e "Nada para vender" sem mudar o estado
- [x] E2E-05 — vender 2 de 3 (+30 G); K/Esc volta passo a passo; inimigo não se move com a loja aberta

## Arquivos relevantes

- `src/ui/shop.js` (novo), `src/game.js`, `src/interaction.js`, `src/dialogues.js`
- `tests/content.test.mjs`
- `.agents/rules/game-architecture.md`
