# Tarefas — Equipamentos

PRD: `prd.md` · TechSpec: `techspec.md`

## Tarefas

- [x] 1.0 Peças e regras puras (sem mexer no jogo) — depende de: —
- [x] 2.0 Herói com força própria e bônus (jogo continua igual) — depende de: 1.0
- [x] 3.0 Save versão 2 com conversão do save antigo — depende de: 2.0
- [x] 4.0 Loja vende equipamentos e o chefe deixa a peça — depende de: 1.0, 3.0
- [x] 5.0 Aba Equip. com a comparação — depende de: 2.0, 4.0
- [x] 6.0 Verificação final e documentação — depende de: 5.0

A 3.0 vem antes das telas porque a conversão do save é o maior risco da entrega: o dono do projeto tem uma campanha em andamento, e o jogo hoje ignora saves de formato diferente.

## Recursos externos pendentes

| REC | Tarefa afetada | Situação |
| :--- | :--- | :--- |
| REC-01 | — (ícones opcionais; as listas usam só texto) | Pendente (opcional, não bloqueia) |

## Cobertura

| CA | Tarefas | Testes |
| :--- | :--- | :--- |
| CA-01 | 2.0, 5.0 | TU-01, TI-02, E2E-01 |
| CA-02 | 2.0 | TU-01, E2E-01 |
| CA-03 | 5.0 | E2E-02 |
| CA-04 | 1.0, 5.0 | TU-02, TU-06, E2E-03 |
| CA-05 | 1.0, 5.0 | TU-03, TU-04, TI-02, E2E-04 |
| CA-06 | 1.0, 5.0 | TU-05, E2E-05 |
| CA-07 | 4.0 | TI-01, TI-03, E2E-06 |
| CA-08 | 4.0 | E2E-07 |
| CA-09 | 4.0 | E2E-07 |
| CA-10 | 4.0 | TI-04, E2E-08 |
| CA-11 | 1.0, 2.0 | TU-08, TU-14, TI-05, E2E-09 |
| CA-12 | 2.0 | TU-09, E2E-10 |
| CA-13 | 3.0 | TU-11, TU-12, TU-13, E2E-11 |
| CA-14 | 3.0 | TU-15, E2E-12 |
| CA-15 | 1.0, 2.0 | TU-05, TU-07, TU-10, TI-05 |
| CA-16 | 6.0 | E2E-13 |
