# Roteiro de implementação

Cada arquivo é o pedido de uma funcionalidade. Execute em ordem: cada um vira um PRD e passa pelo fluxo de skills antes do próximo.

## Fluxo para cada prompt

1. `/criar-prd --arquivo prompts/NN-slug.md`
2. `/criar-techspec --prd <slug>`
3. `/criar-tasks --prd <slug>`
4. `/executar-task --prd <slug>` (repita até concluir todas as tarefas)
5. `/executar-review --prd <slug>`
6. `/executar-qa --prd <slug>`

Os artefatos ficam em `tasks/prd-<slug>/`. Ao avançar uma etapa, atualize a coluna **Situação**.

## Roteiro

| Ordem | Arquivo | Slug | Depende de | Arte do usuário | Situação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | — | fase 1 (mapas e aventura 1) | — | — | Concluída (sem PRD) |
| 2 | — | fase 2 (título, save, menu) | 1 | retratos (opcional) | Concluída (sem PRD) |
| 3 | `03-npcs-e-dialogos.md` | `npcs-e-dialogos` | 2 | NPCs (entregue) | **Concluída** |
| 4 | `04-loja-e-estalagem.md` | `loja-e-estalagem` | 3 | — (ícones opcionais) | **Concluída** |
| 5 | `05-equipamentos.md` | `equipamentos` | 4 | ícones opcionais | Pendente |
| 6 | `06-aventura-2-reino-de-pedra.md` | `aventura-2-reino-de-pedra` | 5 | chefe medieval, NPCs medievais | Pendente |
| 7 | `07-aventura-3-neon.md` | `aventura-3-neon` | 6 | chefe futurista, NPCs futuristas | Pendente |
| 8 | `08-troca-de-classe.md` | `troca-de-classe` | 6 | quadros das classes (opcional) | Pendente |
| 9 | `09-polimento.md` | `polimento` | 7 | músicas e sons | Pendente |

Situações possíveis: Pendente → PRD pronto → TechSpec pronta → Tarefas prontas → Em execução → Em review → Em QA → Concluída.

## Pedidos de arte em aberto

| REC | Para | Situação |
| :--- | :--- | :--- |
| Retratos de Kaito, Rin e Aster | Menu de status (fase 2) | Pendente — o menu usa o sprite ampliado |
| NPCs da vila, do reino e da cidade futurista (12) | Prompts 3, 6 e 7 | **Entregue** (folha `npcs`) |
| Chefe medieval | Prompt 6 | Pendente |
| Chefe futurista | Prompt 7 | Pendente |
