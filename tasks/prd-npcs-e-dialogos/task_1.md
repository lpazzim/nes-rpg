# Tarefa 1.0: Lógica e textos da conversa

## Visão geral

Cria o conteúdo das falas e a máquina de estados da conversa (quebra de linha, páginas, letra a letra, escolhas, variantes por flag, ações), tudo sem desenho e coberto por testes no Node. O resultado é verificável com `npm test`.

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules. Relevantes:
- `javascript.md#2`: sem DOM no topo; os módulos precisam ser importáveis nos testes.
- `code-standards.md#1`: falas sem acentos no canvas.
- `code-standards.md#5`: constantes `DIALOG` em `data.js`.
- `folder-structure.md#5`: `dialogues.js` e `dialog-runner.js` são módulos de base.
- `tests.md#2`: AAA e testes iterando todo o conteúdo.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF7, RF9, RF10, RF11, RF12
</requirements>

## Subtarefas

- [x] 1.1 Adicionar `DIALOG` e `NPC_TUNING` em `src/data.js` (TechSpec › Constantes)
- [x] 1.2 Criar `src/dialogues.js` com os 4 NPCs da fazenda: variante `if: 'bosque'` + padrão; escolhas do Mercador (Comprar/Vender/Sair) e da Estalajadeira (Descansar/Sair) com `action: 'soon'`; dicas do Velho e do Aprendiz (TechSpec › `DIALOGUES`)
- [x] 1.3 Criar `src/dialog-runner.js`: `wrapText`, `pickVariant`, classe `DialogRunner` (`tick`, `confirm`, `move`, `cancel`, `page`, `visible`, `choices`, `done`, `action`)
- [x] 1.4 Criar `tests/dialog.test.mjs` com TU-01 a TU-06
- [x] 1.5 Adicionar TI-03 a TI-06 em `tests/content.test.mjs`

## Detalhes de implementação

TechSpec: "Contratos de dados" (`DIALOGUES`, constantes) e "Principais decisões" (runner puro, variantes, escolhas com um nível + `action`, quebra por caracteres).

## Critérios de aceitação relacionados

- CA-06, CA-07, CA-08, CA-09, CA-10, CA-11

## Testes da tarefa

### Unidade
- [x] TU-01 — `wrapText` respeita 84 caracteres e páginas de até 3 linhas
- [x] TU-02 — `pickVariant` escolhe a variante da flag ativa
- [x] TU-03 — `confirm` completa, avança e encerra
- [x] TU-04 — `tick` revela ~40 letras/s
- [x] TU-05 — escolhas com `move`/`confirm` e `cancel` = última opção
- [x] TU-06 — opção com `action` entrega a ação ao terminar

### Integração de conteúdo
- [x] TI-03 — variantes válidas (falas, 2–4 opções, rótulos ≤ 12)
- [x] TI-04 — todo NPC da vila tem variante `bosque` diferente da padrão
- [x] TI-05 — Velho e Aprendiz dão dicas (floresta, caverna ou cristal)
- [x] TI-06 — Mercador e Estalajadeira com as opções e `action: 'soon'`

## Arquivos relevantes

- `src/data.js`, `src/dialogues.js`, `src/dialog-runner.js`, `tests/dialog.test.mjs`, `tests/content.test.mjs`
