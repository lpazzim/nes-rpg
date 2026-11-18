# Estrutura de Pastas

---

## 1. Raiz

```
my-rpg/
├── AGENTS.md             fonte da verdade para agentes (CLAUDE.md aponta para ele)
├── README.md             guia do jogador/dono do projeto (como rodar, controles, conteúdo)
├── CHANGELOG.md          histórico de entregas
├── index.html            página do jogo
├── server.js             servidor estático local (porta 8080)
├── package.json          scripts npm (start, test, sprites, skills:sync)
├── src/                  código do jogo (ES modules)
├── assets/               arte original e gerada
├── tools/                scripts Node (sprites, sincronização de skills)
├── tests/                testes automáticos (*.test.mjs)
├── prompts/              roteiro das próximas funcionalidades
├── tasks/                artefatos por funcionalidade (prd-<slug>/)
├── .agents/              rules/ e skills/ (fonte da verdade)
└── .claude/              launch.json (preview) e skills/ (cópia gerada; não editar à mão)
```

---

## 2. `src/`

| Caminho | Responsabilidade |
| :--- | :--- |
| `main.js` | Ponto de entrada: carrega recursos, cria o `Game`, roda o loop |
| `game.js` | Estado da campanha, modos, troca de mapa, fade, câmera, desenho da cena (delega combate e interação) |
| `combat-system.js` | Sistema de combate: dano, mortes, XP, hitboxes, zonas de inimigos, itens no chão (funções que recebem `game`) |
| `interaction.js` | Sistema de interação: tecla E, cristais, conversas e ações de diálogo (funções que recebem `game`) |
| `data.js` | **Tabelas de balanceamento**: heróis, inimigos, XP, constantes de tela |
| `items.js` | Tabela de itens e o efeito de cada um; lojas (`SHOPS`) e estalagens (`INNS`) por id de NPC |
| `shop.js` | Regras puras de comprar, vender e descansar (operam sobre `{ gold, inventory }`) |
| `equipment.js` | **Tabela das pecas** (`EQUIPMENT`) e regras puras de equipar, bonus e comparacao |
| `dialogues.js` | **Falas dos NPCs** (só texto, editável pelo dono do projeto) |
| `dialog-runner.js` | Lógica pura das conversas (páginas, letra a letra, escolhas, versões por flag) |
| `npcs.js` | Entidade `Npc` (parado/passeio, conversa, animação) |
| `save.js` | Leitura/escrita dos espaços de save |
| `input.js` | Teclado (teclas seguradas e apertadas no quadro) |
| `heroes.js` / `enemies.js` | Entidades: controle, IA, golpes, animação, desenho |
| `combat.js` | `Hitbox`, fórmula de dano, partículas e textos flutuantes |
| `sprites.js` | Carrega `sprites.json`, `Animator`, `drawFrame`, retratos |
| `font.js` | **Fonte bitmap**: desenho de cada letra, largura e escala (1x/2x/3x) |
| `world.js` | Mapa carregado: colisão, saídas, objetos visíveis, desenho do chão |
| `hud.js` | Barras do grupo, chefe, ajuda e banner |
| `map/art.js` | Arte pintada por código: blocos do chão, objetos, efeitos animados |
| `maps/builder.js` | `MapBuilder` e `makeRng` (ferramentas para montar mapas) |
| `maps/dungeon.js` | Gerador de andares de dungeon |
| `maps/adventureN.js` | Mapas de cada aventura (um arquivo por aventura) |
| `maps/index.js` | Registro `MAPS`, `NEW_GAME`, `ADVENTURES` |
| `ui/ui.js` | Componentes: janela, texto, barra, cursor, navegação |
| `ui/*.js` | Telas: `title.js`, `menu.js`, `slots.js`, `dialog.js`, `shop.js`, `equip.js` (aba do menu) |

Arquivo novo de tela vai para `ui/`; aventura nova vira `maps/adventureN.js`; sistema novo de jogo ganha arquivo próprio em `src/` (ex.: `shop.js`, `equipment.js`).

---

## 3. `assets/`

| Caminho | Conteúdo | Quem escreve |
| :--- | :--- | :--- |
| `source/` | Folhas de sprite e imagens de inspiração **originais**, como o usuário enviou | Usuário/agente (cópia) |
| `sprites/` | Atlas `<nome>.png` + `sprites.json` | **Só** `npm run sprites` |
| `portraits/` | `<id>.png` + `portraits.json` (lista de ids) | Usuário/agente |

Nomes de arquivo: `<nome>_sheet.png|webp` em `source/`, sempre em minúsculas e sem espaços.

---

## 4. `tools/`, `tests/`, `prompts/`, `tasks/`

- `tools/`: `build-sprites.js`, `detect-frames.js`, `sprites.config.js` (animações), `sync-skills.js`.
- `tests/`: `maps.test.mjs`, `content.test.mjs`, `rules.test.mjs`, `dialog.test.mjs`, `shop.test.mjs`, `systems.test.mjs`, `equipment.test.mjs`, `save.test.mjs`, `font.test.mjs`; testes novos seguem `<assunto>.test.mjs`.
- `prompts/`: `NN-<slug>.md` em ordem de execução + `README.md` com o roteiro.
- `tasks/prd-<slug>/`: `prd.md`, `techspec.md`, `tasks.md`, `task_N.md`, `codereview.md`, `qa.md`, `evidences/`.

---

## 5. Direção das dependências

```
data.js, items.js, save.js, combat.js        (base: não importam nada do jogo, exceto data.js)
        ↑
sprites.js, map/art.js                        (recursos e arte)
        ↑
heroes.js, enemies.js, maps/*, world.js, hud.js, ui/*
        ↑
combat-system.js, interaction.js               (sistemas: recebem `game` por parâmetro)
        ↑
game.js                                        (orquestra tudo)
        ↑
main.js
```

Regras:
0. Os **sistemas** (`combat-system.js`, `interaction.js`) nunca importam `game.js` nem um ao outro; recebem a instância por parâmetro.
1. **Ninguém importa `game.js`**, exceto `main.js`. Quem precisa do jogo recebe a instância por parâmetro.
2. `ui/*` não importa `heroes.js`/`enemies.js`; lê o estado pela instância `game`.
3. `maps/*` não importa `world.js` nem `game.js`; um mapa é só dados.
4. Sem import circular. Se dois módulos precisam um do outro, extraia a parte comum para um módulo de base.
