# AGENTS.md

Guia e contexto permanente para agentes de IA que atuam no repositório **my-rpg**.
Este documento é a fonte da verdade sobre a visão do projeto, a arquitetura, os comandos, o fluxo de trabalho e a definição de pronto.

As regras detalhadas ficam em [.agents/rules/](.agents/rules/) e **devem ser seguidas estritamente**:

| Regra | Assunto |
| :--- | :--- |
| [code-standards.md](.agents/rules/code-standards.md) | Estilo, tamanho de arquivos/funções, números mágicos, desempenho por quadro |
| [javascript.md](.agents/rules/javascript.md) | JavaScript moderno sem build: ES modules, imutabilidade, contratos com JSDoc |
| [folder-structure.md](.agents/rules/folder-structure.md) | Pastas, responsabilidades e direção permitida das dependências |
| [game-architecture.md](.agents/rules/game-architecture.md) | Loop, modos, entidades, combate, animação, coordenadas, desenho, save |
| [maps-and-adventures.md](.agents/rules/maps-and-adventures.md) | Construtor de mapas, blocos, saídas/entradas, dungeons, estrutura de aventura |
| [pixel-art-assets.md](.agents/rules/pixel-art-assets.md) | Estilo SNES, formato das folhas de sprite, pipeline e pedidos de arte |
| [tests.md](.agents/rules/tests.md) | Testes automáticos (node:test) e verificação no navegador |
| [documentation.md](.agents/rules/documentation.md) | Onde fica cada documento, IDs, idioma e quando atualizar cada um |

---

## 1. Visão geral

**my-rpg** (título provisório: *Ecos do Destino*) é um RPG de ação para navegador **inspirado** em *Seiken Densetsu 3* (SNES): grupo de 3 heróis em tempo real, um controlado pelo jogador e dois pela IA, barra de PODER para especiais e uma campanha em **aventuras temáticas**.

| Item | Decisão |
| :--- | :--- |
| Propriedade intelectual | **Tudo original.** Nunca usar nomes, sprites, músicas, textos ou mapas da Square Enix. Mecânicas podem ser inspiradas. |
| Heróis | Kaito (katana), Rin (duas adagas), Aster (poderes azul/vermelho). |
| Campanha | Aventuras com o roteiro **cidade → exterior → dungeon (andares) → chefe**. Aventura 1 pronta; 2 (Reino de Pedra) e 3 (Neon) planejadas. |
| Estilo visual | SNES: resolução interna 480x270, blocos de 16 px, personagens com ~39 px, cores de 15 bits. |
| Público do código | O dono do projeto não programa: documentação e mensagens ao usuário em **português simples**. |

---

## 2. Stack e princípios

| Camada | Tecnologia | Observação |
| :--- | :--- | :--- |
| Jogo | JavaScript puro (ES modules) + Canvas 2D | **Sem build, sem framework, sem dependência no navegador.** |
| Servidor local | `server.js` (Node, sem dependências) | Só serve arquivos estáticos na porta 8080. |
| Ferramentas | Node (CommonJS) em `tools/` + `sharp` (devDependency) | Conversão de sprites e manutenção. |
| Save | `localStorage` do navegador | 3 espaços, versionados por `SAVE_VERSION`. |
| Testes | `node:test` (nativo) + verificação no navegador | Sem framework de testes. |

Princípios: simplicidade primeiro; dados de jogo em tabelas (`src/data.js`, `src/items.js`, mapas em `src/maps/`); conteúdo determinístico (sementes); arte pintada uma vez e reutilizada.

---

## 3. Comandos

```sh
npm install                 # instala o sharp (só para as ferramentas de sprite)
npm start                   # servidor em http://localhost:8080
npm test                    # testes automáticos (mapas, conteúdo, regras)
npm run sprites             # converte assets/source/* em assets/sprites/*
npm run sprites -- kaito    # só uma folha
node tools/detect-frames.js <folha> previa.png   # numera os quadros de uma folha
npm run skills:sync         # copia .agents/skills para .claude/skills
```

- No Claude Code, o servidor de preview está em `.claude/launch.json` com o nome **`my-rpg`** (porta 8080).
- No PowerShell, use `;` para encadear comandos; no Git Bash, `&&`.
- Arquivos temporários (prévias, scripts de patch) vão para o scratchpad, nunca para o projeto.

---

## 4. Mapa de pastas (resumo)

Detalhes e regras de dependência em [folder-structure.md](.agents/rules/folder-structure.md).

```
src/          jogo (ES modules)        -> data.js, game.js, combat-system.js, interaction.js, equipment.js, shop.js, heroes.js, enemies.js, ui/, maps/, map/art.js
assets/       source/ (arte original), sprites/ (gerado), portraits/ (retratos do menu)
tools/        scripts Node: build-sprites, detect-frames, sprites.config, sync-skills
tests/        testes automáticos (*.test.mjs)
prompts/      roteiro das próximas funcionalidades (um prompt por PRD)
tasks/        artefatos de cada funcionalidade: tasks/prd-<slug>/
.agents/      rules/ e skills/ (fonte da verdade); .claude/skills é cópia gerada
```

---

## 5. Arquitetura em uma página

Detalhes em [game-architecture.md](.agents/rules/game-architecture.md).

1. `main.js` carrega sprites e retratos, cria o `Game` e roda o loop: `update(dt)` → `render()` → `input.endFrame()`.
2. `Game` (`game.js`) tem um **modo**: `title`, `play`, `menu`, `shop`, `save`, `dialog` ou `over`. Cada modo decide quem recebe o teclado. Trocas de mapa passam por um **fade**.
3. Um **mapa** é uma função em `src/maps/` que devolve um layout; `World` (`world.js`) o transforma em chão pintado, objetos, colisão (grade de 8 px) e saídas. Mapas montados ficam em cache.
4. **Entidades** (`Hero`, `Enemy`, `Npc`) expõem `update(dt, game)` e `draw(ctx)`. O dano sempre passa por `Hitbox` → `game.damage()`; NPCs não lutam.
5. **Conversas**: falas em `dialogues.js` (dados), lógica em `dialog-runner.js` (pura, testada) e caixa em `ui/dialog.js`; o modo `dialog` congela o mundo.
6. **Loja e estalagem**: estoques e preços em `items.js` (`SHOPS`, `INNS`, por id de NPC), regras puras em `shop.js` (testadas), tela em `ui/shop.js` (modo `shop`); a estalagem usa a conversa e `game.startTransition`. As ações `shop`/`sell`/`inn` saem das falas e são tratadas em `interaction.js`.
7. **Equipamento**: pecas em `equipment.js` (tabela + regras puras). O heroi guarda os atributos **proprios** (`baseAtk`, `baseDefense`, `baseSpeed`, `baseCrit`, `baseMaxMp`) e expoe os efetivos por getters (`atk`, `defense`...), somando o bonus recalculado em `recalcEquip()`. Equipar nunca altera o atributo proprio.
8. **Sprites** vêm de `assets/sprites/sprites.json`; `Animator` toca animações por nome (`idle_down`, `attack`...).
9. **Estado da campanha**: `flags` (chefes derrotados), `gold`, `inventory`, `playTime` e os heróis (com o equipamento). Tudo vai para o save, hoje na **versao 2**; saves da versao 1 sao convertidos em `migrateSave` (`save.js`).

### Decisões arquiteturais

| Decisão | Motivo | Alternativa descartada |
| :--- | :--- | :--- |
| JS puro no navegador | Roda sem instalar nada; fácil de testar no preview | Godot (exige instalação; não verificável pelo agente) |
| Arte do mapa pintada por código | Sem tileset pronto; estilo consistente e sem licença | Recortar imagens de inspiração |
| Folhas de sprite → pipeline automático | O usuário gera a arte; o pipeline padroniza escala, paleta e âncora | Ajuste manual quadro a quadro |
| Dungeons geradas com semente | Variedade com layout estável entre partidas e saves | Desenho manual de cada andar |
| Save no `localStorage` | Sem servidor | Arquivo/conta online |

---

## 6. Estado atual e roteiro

| Fase | Conteúdo | Situação |
| :--- | :--- | :--- |
| 1 | Troca de mapas, Aventura 1 completa, dungeons geradas | Concluída |
| 2 | Tela título, save em cristais (3 espaços), menu Status/Itens | Concluída |
| 3 | NPCs e diálogos (4 moradores na vila, conversas com escolhas) | Concluída (`tasks/prd-npcs-e-dialogos/`) |
| 4 | Loja e estalagem (compra/venda, descanso pago) e divisão do `game.js` | Concluída (`tasks/prd-loja-e-estalagem/`) |
| 5 | Equipamentos (3 espacos por heroi, loja e recompensa de chefe) e save v2 com migracao | Concluida (`tasks/prd-equipamentos/`) |
| 6+ | Aventuras 2 e 3, troca de classe, polimento | Ver [prompts/README.md](prompts/README.md) |

O histórico de entregas fica em [CHANGELOG.md](CHANGELOG.md).

---

## 7. Fluxo de trabalho com skills

Funcionalidades novas seguem o fluxo (skills em `.agents/skills/`, artefatos em `tasks/prd-<slug>/`):

```
/criar-prd → /criar-techspec → /criar-tasks → /executar-task (repetir) → /executar-review → /executar-qa
```

Skills de apoio, usadas quando a tarefa envolver o assunto:

| Skill | Quando |
| :--- | :--- |
| `/integrar-sprites` | Chegou uma folha de sprites nova (herói, inimigo, chefe, NPC) |
| `/criar-aventura` | Montar os mapas de uma aventura (cidade, exterior, dungeon, chefe) |

**Caminho curto:** correções pequenas e ajustes de balanceamento não precisam de PRD. Basta seguir as regras, rodar `npm test`, verificar no navegador e registrar no `CHANGELOG.md`.

---

## 8. Definição de pronto

Uma entrega só está pronta quando:

1. `npm test` passa sem falhas.
2. O jogo abre no preview **sem erros no console**, e o fluxo alterado foi jogado/verificado no navegador (ver [tests.md](.agents/rules/tests.md)).
3. Se a arte mudou: `npm run sprites` rodou e as animações foram conferidas na prévia.
4. Se o formato do save mudou: `SAVE_VERSION` incrementado e migração ou aviso documentados.
5. Documentação atualizada conforme [documentation.md](.agents/rules/documentation.md): `CHANGELOG.md` sempre; `README.md` se mudou algo visível ao jogador; `AGENTS.md`/rules se mudou arquitetura, comando ou padrão.
6. O viewport do preview voltou ao normal e servidores temporários foram encerrados.

---

## 9. Recursos externos (arte, áudio)

- O agente **não cria nem baixa** arte de terceiros. Arte nova vem do usuário; enquanto não chega, use **placeholders** desenhados por código e deixe isso claro.
- Ao precisar de arte, peça usando o modelo de [pixel-art-assets.md](.agents/rules/pixel-art-assets.md#6-como-pedir-arte-ao-usuário) e registre a pendência no PRD (seção "Recursos externos").
- Arte recebida vai para `assets/source/` e entra no jogo pela skill `/integrar-sprites`.

---

## 10. Depuração

- `window.game` expõe o jogo no console do navegador. Exemplos: `game.enterMap('floresta', 'caverna')`, `game.flags`, `game.heroes[0].hp = 1`, `game.leader.power = 100`.
- O canvas tem só 480x270; para inspecionar detalhes, copie o canvas com `toDataURL()` e mostre ampliado numa `<img>` com `image-rendering: pixelated` (ver [tests.md](.agents/rules/tests.md#4-verificação-no-navegador)).
- O loop principal captura exceções e registra cada erro diferente uma vez no console. Sempre leia o console depois de uma mudança.

---

## 11. Dívida técnica conhecida

| Item | Impacto | Sugestão |
| :--- | :--- | :--- |
| `src/map/art.js` (~770 linhas) | Difícil de navegar | Dividir em `map/tiles/*.js` e `map/objects/*.js` quando for mexer |
| Ataques só têm quadros de lado | Atacar para cima/baixo mostra pose lateral | Pedir quadros de ataque de frente/costas |
| Quadros 24–31 do Kaito com roupa marrom | Não usados | Pedir correção da folha |
| Texto no canvas sem acentos | Fonte do sistema | Fonte bitmap própria na fase de polimento |
| Sem lint | Estilo depende de revisão | Avaliar ESLint (devDependency) se o time crescer |
