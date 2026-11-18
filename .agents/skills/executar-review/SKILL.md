---
name: executar-review
description: Revisão de código — revisa a implementação de uma funcionalidade do jogo contra as rules do projeto, a TechSpec e as tarefas, roda os testes, corrige problemas e emite um relatório com veredito. Use quando o usuário pedir revisão de código ou conformidade com as regras. Não use para QA jogável (executar-qa) nem para implementar tarefas novas.
argument-hint: --prd slug-da-funcionalidade
---

O argumento `--prd` identifica o slug. Leia `techspec.md` e `tasks.md` em `tasks/prd-[slug]/` (e o `prd.md` quando precisar esclarecer um requisito). Gere `codereview.md` na mesma pasta.

## Fluxo

1. **Analisar** — leia o `AGENTS.md`, todas as rules, a TechSpec e as tarefas concluídas. Liste os arquivos alterados pela funcionalidade.
   **Conclua quando:** escopo, arquitetura esperada e regras aplicáveis estiverem claros.

2. **Conformidade com as rules** — confira cada arquivo alterado, com atenção especial a:
   - direção de dependências e ausência de import de `game.js` (`folder-structure.md#5`);
   - sem DOM no topo dos módulos (`javascript.md#2`);
   - balanceamento em tabelas, `dt` em vez de quadros, `game.later` em vez de `setTimeout` (`code-standards.md`);
   - dano só via `Hitbox` → `game.damage` e save atualizado nos 3 pontos (`game-architecture.md`);
   - tamanhos de arquivo/função; novas violações vão para a dívida técnica do `AGENTS.md` ou são corrigidas.
   **Conclua quando:** cada arquivo tiver sido conferido.

3. **Aderência à TechSpec e às tarefas** — módulos, contratos, integração e interface conforme especificado; toda tarefa `[x]` com código, testes e documentação.
   **Conclua quando:** cada decisão estiver confirmada ou registrada como desvio justificado.

4. **Testes** — `npm test` e uma carga rápida do jogo no preview (zero erros no console).
   **Conclua quando:** os testes passarem.

5. **Corrigir e revalidar** — corrija a causa de cada problema, ajuste ou crie testes e rode tudo de novo. Se a correção exigir mudar PRD, TechSpec ou escopo, registre como bloqueador e pergunte ao usuário.
   **Conclua quando:** não houver bloqueador aberto.

6. **Reportar** — gere o `codereview.md` com `./references/TEMPLATE.md` e o veredito: **APROVADO**, **APROVADO COM RESSALVAS** ou **REPROVADO**. Encerre servidores e overlays que você iniciou.
