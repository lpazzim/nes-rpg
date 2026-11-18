# Arquitetura do Jogo

Contratos e fluxos que todo código novo deve respeitar. Ao mudar algum deles, atualize esta regra.

---

## 1. Loop principal

`main.js` → `requestAnimationFrame(frame)`:

1. `dt = min(1/30, Δt)`: o passo é limitado para o jogo não "pular" depois de uma travada.
2. `game.update(dt)`, depois `game.render()`, ambos dentro de `try/catch` (o erro é registrado e o loop continua).
3. `game.input.endFrame()` limpa as teclas apertadas neste quadro.

---

## 2. Modos do `Game`

| Modo | Quem recebe o teclado | O mundo atualiza? | Desenho por cima |
| :--- | :--- | :--- | :--- |
| `title` | `TitleScreen` (e `SlotScreen` ao continuar) | Não | — |
| `play` | Heróis, atalhos (Enter/Esc menu, E interagir, P pausa, Tab troca) | Sim | HUD |
| `menu` | `Menu` | Não | Menu |
| `shop` | `ShopScreen` (`ui/shop.js`; aberta por `game.openShop(npcId, 'buy'|'sell')`) | Não | Tela da loja |
| `save` | `SlotScreen` | Não | Tela de espaços |
| `dialog` | `DialogBox` (repassa ao `DialogRunner`) | Não | Caixa de diálogo |
| `over` | Opções do Game Over | Não | Game Over |

- `game.fade` congela o mundo: escurece (`dur`), roda `onMid` com a tela preta, clareia e roda `onEnd`. Troca de mapa = `startFade` (0,3 s, `onMid` chama `enterMap`); outros usos (descanso na estalagem, 1 s) chamam `game.startTransition({ dur, onMid, onEnd })`.
- Tela nova = classe em `src/ui/` com `update(dt, input)` e `draw(ctx)`, mais um modo novo no `switch` de `Game.update`/`render`. Ao fechar, a tela chama um callback ou `game.closeX()`; ela nunca altera `game.mode` por conta própria fora disso.
- Entrada de UI usa os atalhos de `ui/ui.js`: `navY`, `navX`, `confirm` (J/Z/Enter/Espaço), `back` (K/X/Esc/Backspace).

---

## 3. Coordenadas e tamanhos

| Item | Valor |
| :--- | :--- |
| Resolução interna | 480 x 270 (`VIEW_W`, `VIEW_H`), ampliada inteira com `image-rendering: pixelated` |
| Bloco do mapa | 16 px (`TILE`) |
| Grade de colisão | 8 px (meio bloco, `CELL` em `world.js`) |
| Posição de entidade | `(x, y)` = **centro dos pés** em pixels do mundo; colisão é um quadrado de raio `r` |
| Desenho de sprite | Pés em `y + 4`; `drawFrame` alinha pela âncora `ox, oy` do quadro |
| HUD | Faixa inferior de ~38 px; não coloque informação essencial atrás dela |

---

## 4. Entidades

Contrato mínimo para qualquer coisa que luta (heróis e inimigos):

| Campo/método | Descrição |
| :--- | :--- |
| `x, y, r` | Posição dos pés e raio de colisão |
| `alive, hp, maxHp, atk, defense, crit` | Estado e atributos de combate |
| `isHero` | `true` para heróis (define o time) |
| `kbx, kby` | Empurrão acumulado (decai a cada quadro) |
| `flashT` | Tempo de flash branco ao levar dano |
| `update(dt, game)` | Lógica do quadro (movimento via `game.world.move(this, dx, dy)`) |
| `draw(ctx)` | Desenho em coordenadas do mundo (heróis recebem `isLeader`) |

Heróis também têm `power` (0–100), `mp`, `level`, `xp`, `toSave()`/`loadSave()` e `placeAt(x, y, dir)`.
Inimigos têm `d` (a definição em `ENEMIES`), `zone`, `boss`, `state` (`idle`, `chase`, `attack`, `hurt`, `block`, `hidden`, `emerge`), `onDamaged()`, `blocksFrom(src)` e `gone` (pode remover).

### Comportamentos de inimigo por flag em `ENEMIES`

| Flag | Comportamento | Animações exigidas |
| :--- | :--- | :--- |
| (todas) | idle/walk/attack/hurt/death | `idle`, `walk`, `attack`, `hurt`, `death` |
| `ambush` | Disfarçado até o herói chegar perto | `hidden`, `emerge` |
| `blocks` | Bloqueia golpes de frente | `block` |
| `ranged` | Mantém distância e atira | `bolt` (projétil), `shield` |
| `boss` | Sem "tranco" ao levar dano, barra de chefe, `scale` | — |

Inimigo novo com comportamento novo: crie uma flag, trate-a em `enemies.js`, adicione as animações exigidas em `tests/content.test.mjs` (`behaviorAnims`) e registre-a nesta tabela.

---

### NPCs (src/npcs.js)

- Criados pelo `Game` em `enterMap` a partir de `world.npcs` (dados do mapa); ficam em `game.npcs`, fora de `heroes` e `enemies` (as hitboxes os ignoram).
- Campos: `id` (folha `npcs` e `DIALOGUES`), `x, y, r`, `homeX, homeY, wander` (px), `dir`, `faceX`, `state` (`idle` | `talk`).
- Colisão com o grupo: `separateFromNpcs(heroes, npcs, world)` (`interaction.js`) empurra o herói para fora (a grade do `World` é estática).
- Interação (`src/interaction.js`): `game.nearInteractable()` (método fino) devolve o alvo **mais próximo** entre cristais e NPCs (`{ kind: 'save' | 'npc', ref }`), dentro de `NPC_TUNING.talkRange`.

### Conversas

| Parte | Arquivo | Papel |
| :--- | :--- | :--- |
| Conteúdo | `src/dialogues.js` | `name` + `talk` (versões por flag, `say`, `ask.options` com `label`, `say`, `action`) |
| Lógica | `src/dialog-runner.js` | `wrapText`, `paginate`, `pickVariant`, `DialogRunner` (`tick`, `confirm`, `move`, `cancel`, `done`, `action`) |
| Tela | `src/ui/dialog.js` | `DialogBox(runner, onClose)`: desenha e repassa as teclas |

- `talkTo(game, npc)` (`interaction.js`) abre o modo `dialog`; ao fechar, `dialogAction(game, action)` executa a ação escolhida (`'shop'` e `'sell'` abrem a loja do NPC por `game.openShop`; `'inn'` abre a estalagem: avisa se o grupo não precisa, ou pergunta Sim/Não e, ao aceitar, cobra e cura **antes** do fade; falas em `INN_LINES`).
- Ação nova: trate-a em `dialogAction` e use-a numa opção em `dialogues.js`.

## 5. Combate

Todo dano passa por uma `Hitbox` (`combat.js`) e por `game.damage(alvo, origem, hitbox)` (método fino que chama `applyDamage` em `combat-system.js`, onde também vivem mortes, XP, hitboxes, zonas e itens no chão).

| Campo da `Hitbox` | Uso |
| :--- | :--- |
| `owner`, `team` | Quem ataca (`'hero'` atinge inimigos; `'enemy'` atinge heróis) |
| `x, y, r` / `follow, ox, oy` | Área; `follow` gruda no dono com deslocamento |
| `vx, vy`, `solidStop` | Projétil; some ao bater em parede/objeto (passa sobre a água) |
| `life`, `mult`, `kb`, `crit` | Duração, multiplicador de dano, empurrão, chance de crítico |
| `pierce`, `rehit` | Atravessa alvos / acerta o mesmo alvo a cada `rehit` s |
| `onHit(t, game)`, `onEnd(game, h)` | Efeitos (lentidão, explosão) |
| `look`, `frame` | Visual (`orbBlue`, `orbRed`, `dagger`, `explosion`, `spin`, `roots`, `bolt`, ...) |

`game.damage` aplica, nesta ordem: invencibilidade/esquiva → `calcDamage` → bloqueio frontal → HP → empurrão → texto e partículas → `hurtT`/`onDamaged` → PODER do atacante → morte (`heroDown`/`enemyDown`). Não aplique dano direto em `hp` fora desse caminho, exceto efeitos de item.

---

## 6. Animação

- `Animator(sheet)` toca animações de `sprites.json` por nome: `play(name, restart)`, `frame`, `done`, `hitNow()`.
- `hitNow()` dispara uma única vez no quadro `hit` definido em `tools/sprites.config.js`. Use-o para criar a hitbox **no quadro do impacto**, e não no início da animação.
- Heróis escolhem a animação em `updateSprite`: morte > ação (`attack`, `skill`, `special`, `attack3`) > dano (`hurt`) > `walk_<dir>`/`idle_<dir>`, com `dir` em `down|up|side` e espelhamento por `faceX`.
- Ações atrasadas dentro de uma animação (ex.: a Espiral Dupla soltando os orbes) usam `game.later`.

---

## 7. Ordem de desenho

1. Chão pré-pintado (recorte da câmera) + brilho da água + objetos `flat` (escadas).
2. Itens no chão.
3. **Lista ordenada por `y`**: heróis, inimigos, NPCs e objetos em pé (árvores, casas). Isso cria a profundidade.
4. Hitboxes visíveis, partículas e textos, avisos de interação.
5. Escuridão (mapas `dark`), HUD, telas do modo atual (menu, loja, save, caixa de diálogo, game over), fade.

---

## 8. Campanha e save

Estado da campanha no `Game`: `flags`, `gold`, `inventory`, `playTime`, `heroes`, `leaderIdx`, `world`.

| Campo do save | Conteúdo |
| :--- | :--- |
| `v` | `SAVE_VERSION` (em `save.js`) |
| `savedAt` | Data em ms |
| `map`, `entry` | Mapa e entrada do **cristal** onde salvou |
| `flags` | Ex.: `{ bosque: true }` (chefe da aventura 1 derrotado) |
| `gold`, `inventory`, `playTime` | Economia e tempo |
| `heroes[]` | `Hero.toSave()`: `id, name, level, xp, hp, mp, maxHp, maxMp, atk, defense, speed, crit, power, alive` |

Regras:
1. Campo novo no estado da campanha → incluir em `saveGame`, `loadGame` e `newGame`.
2. Mudou o formato de forma incompatível → incremente `SAVE_VERSION`. Hoje saves de versão diferente são **ignorados**. Se houver jogadores com progresso, escreva uma migração em `readSave` antes de incrementar.
3. Flags têm nomes curtos em português e são documentadas em [maps-and-adventures.md](maps-and-adventures.md#6-flags-da-campanha).

---

## 9. Checklists de extensão

**Novo inimigo:** folha em `assets/source/` → `/integrar-sprites` → entrada em `ENEMIES` (todos os atributos de `content.test.mjs`) → zona em um mapa → `npm test` → jogar contra ele no preview.

**Novo item:** entrada em `ITEMS` com `use(hero)` (devolve texto ou `false`) → `ITEM_ORDER` → preço → (se for vendido) id no `stock` da loja em `SHOPS` → teste em `content.test.mjs` → usar pelo menu no preview.

**Nova loja ou estalagem:** entrada em `SHOPS` (`name`, `stock`) ou `INNS` (`price`) em `src/items.js`, usando como chave o id do NPC → no `dialogues.js`, opções com `action: 'shop'`/`'sell'` (loja) ou `'inn'` (estalagem) → `npm test` (`TI-03`) → comprar/descansar no preview.

**Nova tela de UI:** classe em `src/ui/` usando `win/text/cursor` → modo no `Game` → teclas por `navY/confirm/back` → verificação visual a 480x270.

**Novo herói:** fora do escopo atual (o grupo tem 3). Exige PRD.
