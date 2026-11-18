# Tarefa 2.0: Entidade NPC

## Visão geral

Cria a classe `Npc`: comportamento parado ou passeio dentro de um raio, pausas, virar para o líder ao conversar e retomar depois, animação da folha `npcs` com balanço de passo e desenho com os pés na posição. A entidade é testável no Node com um mundo simulado.

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules. Relevantes:
- `game-architecture.md#3`: pés em `y + 4` e âncora.
- `game-architecture.md#4`: contrato de entidade (sem combate).
- `game-architecture.md#6`: `Animator` com nomes `<npc>.<animação>`.
- `code-standards.md#6`: `dt` e cronômetros.
- `javascript.md#2`: sem DOM no topo.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF1, RF2, RF3
</requirements>

## Subtarefas

- [x] 2.1 Criar `src/npcs.js` com `Npc(def)`: campos `id, x, y, r, homeX, homeY, wander, dir, faceX, state`
- [x] 2.2 Passeio: escolher destino aleatório no raio, andar a `NPC_TUNING.speed`, pausar entre 1,5 e 4 s, trocar de destino após 1 s sem progresso, não iniciar passo perto de herói
- [x] 2.3 `startTalk(leader)` / `endTalk()`: estado `talk`, virar para o líder, retomar
- [x] 2.4 Animação (`idle_*`/`walk_*` com prefixo do id) e `draw(ctx)` com balanço de 1 px ao andar e espelhamento por `faceX`
- [x] 2.5 TU-07 e TU-08 em `tests/dialog.test.mjs` (preenchendo `sheets.npcs` com dados falsos)

## Detalhes de implementação

TechSpec: "Arquitetura" (`npcs.js`), "Integração com o jogo" (passeio e separação) e "Riscos" (NPC preso).

## Critérios de aceitação relacionados

- CA-03, CA-04

## Testes da tarefa

### Unidade
- [x] TU-07 — passeio nunca sai do raio em 60 s simulados
- [x] TU-08 — `startTalk` vira para o líder e para; `endTalk` retoma

## Arquivos relevantes

- `src/npcs.js`, `src/sprites.js`, `src/data.js`, `tests/dialog.test.mjs`
