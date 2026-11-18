# Tarefa 4.0: Integração no jogo e caixa de diálogo

## Visão geral

Liga tudo no `Game`:
- **NPCs no mapa:** criados ao entrar no mapa, atualizados e desenhados por profundidade.
- **Colisão:** separação entre herói e NPC.
- **Interação:** a tecla E escolhe o alvo mais próximo entre cristal e NPC; o aviso "E: Falar" aparece acima do NPC.
- **Modo `dialog`:** mundo congelado durante a conversa; a caixa é desenhada por `src/ui/dialog.js`.

O resultado é jogável: dá para conversar com os 4 NPCs da vila.

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules. Relevantes:
- `game-architecture.md#2`: modo novo, teclado da caixa e callback.
- `game-architecture.md#7`: ordem de desenho.
- `folder-structure.md#5`: `ui/dialog.js` não importa `game.js`.
- `code-standards.md#4`: o `game.js` recebe só a costura (~40 linhas).
- `tests.md#4`: verificação no navegador.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF3, RF5, RF6, RF7, RF8, RF9, RF11
</requirements>

## Subtarefas

- [x] 4.1 `enterMap`: criar `game.npcs` a partir de `world.npcs`; atualizar NPCs no modo `play`; incluí-los na lista ordenada do `render`
- [x] 4.2 `separateFromNpcs()`: empurrar o herói para fora do NPC, desfazendo se colidir com o mundo
- [x] 4.3 `nearInteractable()` com o alvo **mais próximo** entre cristais e NPCs (`{ kind, ref }`); aviso "E: Salvar" / "E: Falar"
- [x] 4.4 Criar `src/ui/dialog.js` (`DialogBox`): caixa, aba de nome, texto, seta piscando, janela de escolhas, teclas via `ui/ui.js`
- [x] 4.5 Modo `dialog` no `Game`: `talkTo(npc)`, `update`/`render` do modo, fechamento (`npc.endTalk()`, `dialogAction`)
- [x] 4.6 Executar E2E-01 a E2E-09 no preview (sem mexer nos saves do usuário)

## Detalhes de implementação

TechSpec: "Fluxo", "Integração com o jogo" e "Interface".

## Critérios de aceitação relacionados

- CA-01, CA-02, CA-03, CA-04, CA-05, CA-06, CA-07, CA-08, CA-09, CA-10, CA-11

## Testes da tarefa

### Ponta a ponta (navegador)
- [x] E2E-01 — 4 NPCs na vila, com profundidade
- [x] E2E-02 — o grupo não atravessa o Mercador
- [x] E2E-03 — o Velho passeia 30 s dentro do raio
- [x] E2E-04 — E no Aprendiz abre a conversa; o mundo para; dica
- [x] E2E-05 — cristal x NPC: abre o mais próximo
- [x] E2E-06 — J completa, avança e fecha
- [x] E2E-07 — escolhas do Mercador; Esc = Sair
- [x] E2E-08 — falas pós-chefe com `flags.bosque`
- [x] E2E-09 — a fala mais longa cabe na caixa

## Arquivos relevantes

- `src/game.js`, `src/ui/dialog.js`, `src/npcs.js`, `src/dialog-runner.js`, `src/dialogues.js`
