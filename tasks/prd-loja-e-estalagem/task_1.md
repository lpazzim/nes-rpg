# Tarefa 1.0: Dividir o `game.js` (sem mudar o jogo)

## Visão geral

Tira do `src/game.js` o combate (para `src/combat-system.js`) e a interação com cristais e NPCs (para `src/interaction.js`), como recomendou a revisão da fase de NPCs. O jogador não vê diferença nenhuma: o resultado se confere com a suíte de testes inteira verde, com o `game.js` abaixo de 400 linhas e jogando uma partida curta (lutar, conversar, usar item) sem erros no console.

<rules>
### Conformidade com o AGENTS.md e as rules

- `code-standards.md#4`: arquivo ≤ 400 linhas, função ≤ 60. É o motivo desta tarefa.
- `folder-structure.md#5`: os sistemas novos recebem `game` por parâmetro e **não importam `game.js`**; também não importam um ao outro. A camada "sistemas" entra no diagrama.
- `javascript.md#2` e `#4`: nada de DOM no topo; funções puras nomeadas (`gainXp`, `separateFromNpcs`).
- `game-architecture.md#5`: o caminho do dano (`Hitbox` → `game.damage`) continua igual; `game.damage` vira um método fino que chama `applyDamage`.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF0.1, RF0.2, RF0.3
</requirements>

## Subtarefas

- [x] 1.1 Criar `src/combat-system.js` com `applyDamage`, `heroDown`, `enemyDown`, `gainXp(heroes, n)` (pura), `explode`, `updateHitboxes`, `spawnZone`, `updateZones`, `updatePickups`, `drawPickups`, movendo o código sem reescrever a lógica.
- [x] 1.2 Criar `src/interaction.js` com `nearInteractable`, `interact`, `talkTo`, `dialogAction` e `separateFromNpcs(heroes, npcs, world)` (pura).
- [x] 1.3 Deixar no `Game` os métodos finos usados pelas entidades (`damage`, `explode`, `dropPickup`, `nearInteractable`) e manter `addHitbox`, `later`, `shake`, `announce`, `nearestEnemy`, `nearestHero`, `followerSlot`. Conferir com busca por `game\.` em `heroes.js`, `enemies.js` e `ui/*` que nenhum chamador ficou sem método.
- [x] 1.4 Migrar os testes `BUG-01` e "não empurra para dentro de parede" do `dialog.test.mjs` para chamar `separateFromNpcs` de `interaction.js`.
- [x] 1.5 Criar `tests/systems.test.mjs` com TU-01 e TI-02 (guarda de tamanho com a exceção explícita de `map/art.js`).
- [x] 1.6 Rodar `npm test` e o E2E-01 no navegador.
- [x] 1.7 Atualizar documentação: dívida técnica e arquitetura do `AGENTS.md`, `folder-structure.md` (§2 tabela de `src/`, §5 camada de sistemas), `game-architecture.md` (§4 NPCs/Conversas e §5 Combate citam os módulos novos), `tests.md` §3 (`systems.test.mjs`).

## Detalhes de implementação

Ver `techspec.md` → "Divisão do `game.js` (tarefa 1)" (tabela de linhas, destinos e métodos finos) e "Módulos novos e alterados". A ordem das chamadas em `Game.update` não muda. `this.npcs` e `this.dialog` continuam no `Game`.

## Critérios de aceitação relacionados

- CA-01

## Testes da tarefa

### Unidade
- [x] TU-01 — `gainXp` puro: XP, level up, herói caído não ganha (mesmos números de hoje)
- [x] TU-02 — `separateFromNpcs` importado de `interaction.js` (BUG-01 e parede)

### Integração de conteúdo
- [x] TI-01 — suíte inteira continua verde
- [x] TI-02 — todo `src/**/*.js` ≤ 400 linhas, exceto `map/art.js`

### Ponta a ponta (navegador)
- [x] E2E-01 — novo jogo → floresta, derrotar inimigos (dano, XP, ouro, item no chão) → vila, falar com NPC → menu, usar Poção; console sem erros

## Arquivos relevantes

- `src/game.js`, `src/combat-system.js` (novo), `src/interaction.js` (novo)
- `src/heroes.js`, `src/enemies.js` (só conferência dos chamadores)
- `tests/dialog.test.mjs`, `tests/systems.test.mjs` (novo)
- `AGENTS.md`, `.agents/rules/folder-structure.md`, `.agents/rules/game-architecture.md`, `.agents/rules/tests.md`
