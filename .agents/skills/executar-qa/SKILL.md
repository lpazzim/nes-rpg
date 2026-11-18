---
name: executar-qa
description: QA — valida uma funcionalidade do jogo jogando no navegador e rodando os testes, contra os critérios de aceitação do PRD; corrige os bugs encontrados com teste de regressão e gera um relatório com evidências. Use quando o usuário pedir QA ou validação de uma funcionalidade pronta. Não use para implementar tarefas novas nem para revisão de código (executar-review).
argument-hint: --prd slug-da-funcionalidade
---

O argumento `--prd` identifica o slug. Em `tasks/prd-[slug]/`, leia `prd.md`, `techspec.md` e `tasks.md`; gere e mantenha `qa.md`. O QA só é **APROVADO** quando todos os `CA-*` estiverem verificados e atendidos.

## Fluxo

1. **Montar o checklist** — um item por `CA-*`, cada um com os casos `TU-*`/`TI-*`/`E2E-*` associados na TechSpec.
   **Conclua quando:** todo `CA-*` tiver ao menos um caso associado.

2. **Preparar** — `npm test`; inicie o preview `my-rpg`, recarregue e confira zero erros no console. Use um viewport de 960x540 para inspecionar detalhes. Se o fluxo depende de um save antigo, crie-o antes da validação para testar a compatibilidade.
   **Conclua quando:** o jogo estiver na tela de título sem erros.

3. **Jogar cada fluxo (E2E)** — execute cada `E2E-*` pelo teclado simulado e pelos atalhos de `window.game` (ver `.agents/rules/tests.md#4`). Verifique o resultado **no estado** (`game.mode`, `game.world.id`, `game.inventory`...) **e na tela** (captura ampliada do canvas). Ao falhar, investigue o console e o estado antes de concluir. Registre PASSOU/FALHOU no `qa.md`.
   **Conclua quando:** todo `CA-*` com fluxo jogável estiver marcado.

4. **Checklist de jogo** — aplique o checklist de `.agents/rules/tests.md#4` (controles, legibilidade, feedback, desempenho, save, console) em cada tela nova.
   **Conclua quando:** cada item tiver sido verificado.

5. **Corrigir bugs** — para cada `BUG-*`: corrija a causa raiz, crie um teste de regressão (automático quando possível; senão, um passo E2E documentado) e registre no `qa.md`. Se exigir mudança de PRD/TechSpec/escopo, pare e pergunte ao usuário.
   **Conclua quando:** cada bug estiver corrigido ou explicitamente bloqueado.

6. **Revalidar** — repita os fluxos que falharam e `npm test`. Se algo falhar, volte ao passo 5.
   **Conclua quando:** todos os `CA-*` estiverem PASSOU.

7. **Reportar e limpar** — gere o `qa.md` com `./references/TEMPLATE.md`. As evidências são o estado verificado (valores de `window.game`) e as capturas mostradas na conversa; quando der para salvar a imagem, guarde-a em `tasks/prd-[slug]/evidences/`. Adicione a entrega ao `CHANGELOG.md` (se ainda não estiver), marque a funcionalidade como concluída em `prompts/README.md`, remova overlays, volte o viewport ao normal e encerre os servidores que você iniciou.
