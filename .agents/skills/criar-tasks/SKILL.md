---
name: criar-tasks
description: Tarefas — decompõe uma funcionalidade do jogo em tarefas incrementais a partir do PRD e da TechSpec em `tasks/prd-*/`. Use quando o usuário pedir para planejar a execução ou quebrar uma funcionalidade em tarefas. Não use para redigir PRD (criar-prd) nem TechSpec (criar-techspec).
argument-hint: --prd slug-da-funcionalidade
---

O argumento `--prd` identifica o slug. Obrigatórios: `tasks/prd-[slug]/prd.md` e `tasks/prd-[slug]/techspec.md`. Se faltar algum, pare e indique `/criar-prd` ou `/criar-techspec`.

Cada tarefa é uma **entrega incremental jogável ou testável**, com dependências explícitas e testes próprios. Referencie a TechSpec em vez de repetir detalhes.

## Fluxo

1. **Analisar** — leia o `AGENTS.md`, as rules, o PRD e a TechSpec. Inventarie os `CA-*`, os casos `TU-*`/`TI-*`/`E2E-*`, os `REC-*` e as skills aplicáveis (`/integrar-sprites`, `/criar-aventura`).
   **Conclua quando:** o inventário estiver completo.

2. **Propor a estrutura** — no máximo 10 tarefas, em ordem de dependência. A ordem típica é: dados e lógica com testes → integração no `Game` → interface → conteúdo (mapas, arte) → verificação. Tarefas que dependem de arte do usuário devem funcionar com placeholder e ter uma subtarefa "trocar placeholder quando REC-N chegar". Mostre a lista ao usuário e espere a aprovação.
   **Conclua quando:** o usuário aprovar.

3. **Gerar os arquivos** — em `tasks/prd-[slug]/`:
   - `tasks.md` seguindo `./references/TEMPLATE_TASKS.md`;
   - `task_[N].md` para cada tarefa, seguindo `./references/TEMPLATE_TASK.md`, com subtarefas `[N].1, [N].2…`, `CA-*` relacionados e os testes da TechSpec.
   **Conclua quando:** todo `CA-*` e todo caso de teste estiverem mapeados em alguma tarefa.

4. **Reportar** — apresente os arquivos, atualize `prompts/README.md` ("Tarefas prontas") e aguarde a confirmação antes de implementar.
