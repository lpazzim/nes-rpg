---
name: criar-prd
description: PRD — Documento de Requisitos de uma funcionalidade do jogo (primeira etapa do fluxo PRD → TechSpec → tasks). Use quando o usuário pedir um PRD, quiser definir escopo de uma funcionalidade nova ou executar um prompt de `prompts/`. Não use para especificação técnica (criar-techspec) nem para decompor em tarefas (criar-tasks).
argument-hint: --prompt "descrição da funcionalidade" | --arquivo prompts/NN-slug.md
---

O PRD define **o quê e por quê**: problema, experiência do jogador, critérios mensuráveis, recursos externos e escopo. Arquitetura e código ficam na TechSpec.

## Fluxo

1. **Contextualizar** — leia o `AGENTS.md`, `prompts/README.md` e o prompt indicado (se houver). Confira no código e no `CHANGELOG.md` o que já existe, para não pedir o que já está pronto.
   **Conclua quando:** souber o que a funcionalidade adiciona ao estado atual do jogo.

2. **Esclarecer** — pergunte ao usuário (`AskUserQuestion`), em linguagem simples, só o que o prompt e o código não respondem:
   - Experiência do jogador: o que ele vê, faz e sente; controles.
   - Escopo mínimo desta entrega vs. depois.
   - Arte/áudio necessários e se o usuário vai fornecê-los (senão, placeholder).
   - Números de balanceamento que ele queira impor (senão, proponha valores).
   Para referências de gênero (como algo funciona em RPGs clássicos), pesquise na web em vez de perguntar.
   **Conclua quando:** cada seção do template tiver resposta ou premissa registrada.

3. **Redigir** — leia `./references/TEMPLATE.md` desta skill e siga a estrutura exatamente. Critérios de aceitação (`CA-*`) devem ser observáveis jogando ou por teste; recursos externos ganham IDs `REC-*` com o pedido pronto no formato de `.agents/rules/pixel-art-assets.md#6`.
   **Conclua quando:** toda seção estiver preenchida com informação específica da funcionalidade.

4. **Salvar e reportar** — grave em `tasks/prd-[slug]/prd.md` (slug em kebab-case, português) e atualize a situação em `prompts/README.md` para "PRD pronto". Informe o caminho com um resumo de uma linha e liste os `REC-*` que dependem do usuário.
