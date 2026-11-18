# Tarefa 3.0: NPCs nos mapas e na vila

## Visão geral

Mapas passam a declarar NPCs (`B.npc`), o `World` os guarda como dados e a Vila de Pradaria recebe os 4 NPCs da fazenda. Os testes de integridade garantem que todo NPC tem fala e sprite, está em chão andável e não bloqueia caminhos.

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules. Relevantes:
- `maps-and-adventures.md#4`: API do builder; ordem de montagem.
- `folder-structure.md#5`: mapas são só dados; `World` não cria entidades.
- `code-standards.md#8`: determinismo.
- `tests.md#2`: testes iterando todos os mapas.
</rules>

<skills>
### Skills aplicáveis

Nenhuma (sprites já integrados por `/integrar-sprites`).
</skills>

<requirements>
- RF1, RF4
</requirements>

## Subtarefas

- [x] 3.1 `MapBuilder.npc(id, tx, ty, { dir, wander })`: guarda em `this.npcs`, reserva o bloco; `build()` devolve `npcs`
- [x] 3.2 `World`: `this.npcs = L.npcs || []`
- [x] 3.3 `buildVila`: Mercador (16, 26), Estalajadeira (34, 40), Velho Agricultor (45, 27, passeio 2), Jovem Aprendiz (11, 33, passeio 2)
- [x] 3.4 TI-01 e TI-02 em `tests/maps.test.mjs`

## Detalhes de implementação

TechSpec: "Contratos de dados" (NPC no layout), "Integração com o jogo" (Mapas) e "Conteúdo e arte" (posições).

## Critérios de aceitação relacionados

- CA-01, CA-02, CA-12

## Testes da tarefa

### Integração de conteúdo
- [x] TI-01 — todo NPC tem fala em `DIALOGUES` e as 6 animações
- [x] TI-02 — NPCs em chão andável, fora das saídas; o mapa continua alcançável com os NPCs bloqueando

## Arquivos relevantes

- `src/maps/builder.js`, `src/maps/adventure1.js`, `src/world.js`, `tests/maps.test.mjs`
