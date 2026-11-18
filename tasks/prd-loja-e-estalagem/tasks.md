# Tarefas — Loja e estalagem

PRD: `prd.md` · TechSpec: `techspec.md`

## Tarefas

- [x] 1.0 Dividir o `game.js` (sem mudar o jogo) — depende de: —
- [x] 2.0 Regras da loja e da estalagem com testes — depende de: 1.0
- [x] 3.0 Tela da loja ligada ao Mercador — depende de: 2.0
- [x] 4.0 Estalagem (Sim/Não, escurecer e clarear) — depende de: 2.0, 3.0
- [x] 5.0 Verificação final jogando e documentação — depende de: 3.0, 4.0

A 4.0 depende da 3.0 porque as duas mexem em `interaction.js` (`dialogAction`) e em `dialogues.js`: rodar uma depois da outra evita conflito.

## Recursos externos pendentes

| REC | Tarefa afetada | Situação |
| :--- | :--- | :--- |
| REC-01 | — (ícones opcionais; a loja usa só texto) | Adiado pelo dono do projeto |

## Cobertura

| CA | Tarefas | Testes |
| :--- | :--- | :--- |
| CA-01 | 1.0 | TU-01, TU-02, TI-01, TI-02, E2E-01 |
| CA-02 | 3.0 | TI-03, TI-04, E2E-02 |
| CA-03 | 2.0, 3.0 | TU-03, E2E-03 |
| CA-04 | 2.0, 3.0 | TU-04, E2E-03 |
| CA-05 | 2.0, 3.0 | TU-05, E2E-04 |
| CA-06 | 2.0, 3.0 | TU-06, E2E-04 |
| CA-07 | 2.0, 3.0 | TU-07, TU-08, E2E-05 |
| CA-08 | 2.0, 3.0 | TU-09, E2E-04 |
| CA-09 | 3.0 | E2E-05 |
| CA-10 | 2.0, 4.0 | TU-10, TI-04, TI-05, E2E-06 |
| CA-11 | 2.0, 4.0 | TU-11, E2E-06 |
| CA-12 | 2.0, 4.0 | TU-12, E2E-06 |
| CA-13 | 5.0 | E2E-07 |
| CA-14 | 2.0 | TU-08, TU-13, TU-14 |
| CA-15 | 5.0 | E2E-08 |
