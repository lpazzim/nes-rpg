---
name: executar-task
description: Tarefa — implementa a próxima tarefa não concluída de uma funcionalidade a partir do PRD, da TechSpec e do tasks.md, verificando com testes e no navegador e marcando-a como concluída. Use quando o usuário pedir para executar, implementar ou continuar uma tarefa. Não use para revisar (executar-review) nem para QA (executar-qa).
argument-hint: --prd slug-da-funcionalidade
---

O argumento `--prd` identifica o slug. Obrigatórios em `tasks/prd-[slug]/`: `prd.md`, `techspec.md` e `tasks.md`. Se faltar algum, indique a skill correspondente.

## Fluxo

1. **Selecionar** — a primeira tarefa `[ ]` do `tasks.md` cujas dependências estejam `[x]`. Abra o `task_[N].md` e leia subtarefas, `CA-*` e testes.
   **Conclua quando:** a tarefa e as subtarefas estiverem identificadas.

2. **Preparar** — leia o `AGENTS.md`, todas as rules, as seções da TechSpec citadas e o código que será tocado. Carregue as skills aplicáveis listadas na tarefa. Se a tarefa precisar de arte que ainda não chegou (`REC-*`), use o placeholder previsto e siga em frente.
   **Conclua quando:** a abordagem estiver clara.

3. **Implementar** — subtarefa por subtarefa, nesta ordem: dados e lógica pura com os testes `TU-*`/`TI-*` → integração → interface → conteúdo. Respeite os contratos de `game-architecture.md` e a direção de dependências.
   **Conclua quando:** todas as subtarefas estiverem implementadas.

4. **Verificar** —
   - `npm test` passando (inclusive os testes novos da tarefa);
   - preview `my-rpg` (`.claude/launch.json`): recarregar, conferir zero erros no console e executar os `E2E-*` da tarefa como descrito em `.agents/rules/tests.md#4`;
   - se algo falhar, corrija a causa e repita.
   **Conclua quando:** testes e verificação passarem.

5. **Concluir e limpar** — marque `[x]` nas subtarefas e nos testes do `task_[N].md` e na tarefa do `tasks.md`. Atualize a documentação afetada (ver `documentation.md`); se for a última tarefa, adicione a entrega ao `CHANGELOG.md`. Remova overlays de depuração, volte o viewport ao normal e encerre os servidores que você iniciou. Informe em uma linha o que foi entregue e qual é a próxima tarefa.
   **Conclua quando:** tudo estiver marcado e o ambiente limpo.
