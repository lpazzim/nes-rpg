---
name: criar-techspec
description: TechSpec — especificação técnica de uma funcionalidade do jogo que já tem PRD em `tasks/prd-*/prd.md`. Use quando o usuário pedir a TechSpec, a arquitetura ou o "como fazer" de uma funcionalidade com PRD. Não use sem PRD (criar-prd) nem para decompor em tarefas (criar-tasks).
argument-hint: --prd slug-da-funcionalidade
---

O argumento `--prd` identifica o slug. Sem argumento, localize a pasta em `./tasks/prd-*/`. Se `tasks/prd-[slug]/prd.md` não existir, pare e indique `/criar-prd`.

A TechSpec define **como**: módulos, contratos de dados, integração com o loop e os modos do `Game`, telas, conteúdo e testes. Referencie o PRD em vez de repeti-lo. Especifique sem implementar: código só nos exemplos de contrato. Prefira a solução mais simples que respeite as rules.

## Fluxo

1. **Analisar o PRD** — extraia requisitos (`RF*`), critérios (`CA-*`), balanceamento, recursos externos (`REC-*`) e restrições.
   **Conclua quando:** tudo isso estiver listado.

2. **Explorar o código** — leia o `AGENTS.md` e **todas** as rules em `.agents/rules/` (principalmente `game-architecture.md` e `folder-structure.md`). Leia os módulos afetados, quem os chama e os testes existentes. Para varreduras amplas, use o agente Explore.
   **Conclua quando:** puder nomear cada arquivo novo ou alterado e onde ele se encaixa na direção de dependências.

3. **Esclarecer** — pergunte ao usuário só decisões de produto que surgiram na exploração (o usuário não programa: ofereça opções com uma recomendação). Decisões técnicas são suas; registre-as em "Principais decisões".
   **Conclua quando:** não houver pergunta aberta.

4. **Redigir** — siga `./references/TEMPLATE.md` exatamente. Em "Abordagem de testes", nomeie os casos `TU-*`, `TI-*` e `E2E-*` e associe-os aos `CA-*` (ver `.agents/rules/tests.md`). Todo `CA-*` precisa de ao menos um caso de teste.
   **Conclua quando:** toda seção estiver preenchida e cada componente do passo 2 estiver especificado.

5. **Salvar e reportar** — grave em `tasks/prd-[slug]/techspec.md`, atualize `prompts/README.md` ("TechSpec pronta") e informe o caminho com um resumo de uma linha.
