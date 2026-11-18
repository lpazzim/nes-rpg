# Revisão de código — Loja e estalagem

## Resumo

- Data: 2026-11-17
- Veredito: **APROVADO**
- Arquivos revisados: 22
  - **Novos:** `src/combat-system.js`, `src/interaction.js`, `src/shop.js`, `src/ui/shop.js`, `tests/shop.test.mjs`, `tests/systems.test.mjs`.
  - **Alterados:** `src/game.js`, `src/items.js`, `src/dialogues.js`, `src/dialog-runner.js` (só comentários), `src/heroes.js` (1 linha), `tests/dialog.test.mjs`, `tests/content.test.mjs`.
  - **Documentação:** `README.md`, `AGENTS.md`, `CHANGELOG.md`, `prompts/README.md`, `.agents/rules/{folder-structure,game-architecture,tests}.md`.

## Conformidade com as rules

| Rule | Status | Observações |
| :--- | :--- | :--- |
| folder-structure (dependências) | OK | Só `main.js` importa `game.js`. `combat-system.js` e `interaction.js` não importam `game.js` nem um ao outro. `shop.js` só importa `items.js`. `ui/shop.js` não importa entidades nem sistemas. Sem import circular. |
| javascript (sem DOM no topo, ESM) | OK | Nenhum acesso a `document`, `window` ou `localStorage` nos módulos novos; todos são importáveis no Node (usados nos testes). JSDoc nos contratos `Wallet` e `ShopResult`. Tabelas `SHOPS`/`INNS` nunca são alteradas em jogo. |
| code-standards (tamanho, dt, tabelas) | OK | Maior arquivo novo: `combat-system.js` (165 linhas); `game.js` caiu de 498 para 323 (limite 400), com guarda automática (`TI-02`). Maior função nova: `applyDamage` (~30 linhas). Preços, limite 99 e taxa de venda em `items.js`; tempos por `dt` e `MSG_TIME`/`REST_FADE` como constantes; nenhum `setTimeout`. Textos do canvas sem acentos (testado). |
| game-architecture (dano, save, modos) | OK | Dano continua por `Hitbox` → `game.damage` → `applyDamage`. Modo `shop` segue o padrão (classe de UI + callback `closeShop`, sem alterar `mode` por conta própria). Save inalterado (`SAVE_VERSION` 1; `gold` e `inventory` já eram salvos). Fade generalizado mantém o comportamento dos mapas. |
| documentation | OK (após correção) | `README`, `CHANGELOG`, `AGENTS`, 3 rules e roteiro atualizados. Foram achadas e corrigidas 4 defasagens (ver BUG-01 a BUG-04). |

## Aderência à TechSpec

| Decisão | Implementada | Observações |
| :--- | :--- | :--- |
| Dividir `game.js` em `combat-system.js` + `interaction.js` com métodos finos no `Game` | SIM | Heróis e inimigos não mudaram. `nearInteractable`, `damage`, `explode`, `dropPickup` ficaram finos no `Game`. |
| `shop.js` puro sobre uma "carteira" (o `game` serve) | SIM | Recusas por `unknown`/`qty`/`gold`/`full`/`none`/`rested`; só altera a carteira com `ok: true`; `rested` antes de `gold`. |
| Lojas e estalagens por id de NPC (`SHOPS`, `INNS`) | SIM | Loja da vila com os 4 itens; estalagem a 20 G. |
| Tela `ShopScreen` com passos `list`/`qty`, modo `shop` | SIM | Layout e navegação conforme a TechSpec. |
| Estalagem por conversa Sim/Não + fade generalizado, cobrando antes do fade | SIM | `startTransition({ dur, onMid, onEnd })`; revividos reposicionados no meio. |
| Limite de 99 também para Poção do chão | SIM | Desvio mínimo: quando a bolsa está cheia a Poção do chão some sem aviso (aceitável). |
| `heroDown`/`enemyDown` exportados | NÃO (justificado) | Ficaram privados em `combat-system.js`: só `applyDamage` os chama. |
| Correção extra fora da TechSpec | — | `Hero` agora escolhe a animação já no construtor (carregar save com o jogo em andamento desenhava heróis sem animação). Registrado no `CHANGELOG`. |

## Tarefas verificadas

| Tarefa | Status | Observações |
| :--- | :--- | :--- |
| 1.0 Dividir o `game.js` | COMPLETA | `game.js` com 323 linhas; testes migrados; `TU-01`, `TI-02`, E2E-01. |
| 2.0 Regras da loja e da estalagem | COMPLETA | `TU-03` a `TU-14`, `TI-03`. |
| 3.0 Tela da loja | COMPLETA | `TI-04`, E2E-02 a E2E-05. |
| 4.0 Estalagem | COMPLETA | `TI-04` completo, `TI-05`, E2E-06 e troca de mapa conferida. |
| 5.0 Verificação final e documentação | COMPLETA | E2E-07 (save novo e save antigo), E2E-08 (1,1 s); `CHANGELOG` e `README`. |

## Testes

- `npm test`: **78 passando / 0 falhando** (eram 58 antes da funcionalidade).
- Carga no navegador: **sem erros**. Novo Jogo → loja (comprar e vender) → estalagem (com fade) → troca de mapa, com os erros capturados dentro da própria página.
- Segurança dos dados: os testes no navegador usaram Novo Jogo; o espaço 1 foi só lido (continuou idêntico) e o espaço de teste criado foi apagado.

## Problemas encontrados

| ID | Severidade | Arquivo:linha | Descrição | Correção |
| :--- | :--- | :--- | :--- | :--- |
| BUG-01 | Baixa | `.agents/rules/folder-structure.md:53,74` | Dizia que `shop.js` era "futura", não listava `shop.js` em `src/` nem os testes novos | Aplicada |
| BUG-02 | Baixa | `.agents/rules/tests.md:40` | Tabela de testes sem `shop.test.mjs` | Aplicada |
| BUG-03 | Baixa | `.agents/rules/game-architecture.md:130` e `AGENTS.md:88-91` | Ordem de desenho e lista de modos sem a loja; resumo de arquitetura sem a seção de loja/estalagem | Aplicada |
| BUG-04 | Baixa | `src/dialog-runner.js:7,52` | Comentários citavam a ação `'soon'`, que não existe mais | Aplicada |

## Pontos positivos

- A divisão foi feita movendo código, sem reescrever lógica, e a suíte inteira serviu de rede de segurança. A verificação no navegador pegou um import esquecido (`updateFx`) antes da entrega.
- Regras de loja puras e bem testadas, incluindo teste aleatório com semente (500 operações) garantindo ouro ≥ 0 e bolsa entre 1 e 99.
- Teste de conteúdo itera sobre todas as lojas e estalagens: uma cidade nova entra com uma linha de dados e já é verificada.
- Guarda automática de tamanho (`TI-02`) evita que o `game.js` volte a crescer sem aviso.
- Cobrança e cura da estalagem ocorrem antes do fade, então o estado fica certo mesmo se a animação for interrompida.

## Recomendações

- A lista da loja não rola: cabe 8 itens. O teste de conteúdo limita o estoque a 8, mas a lista de **venda** pode passar disso se a bolsa ganhar muitos tipos de item (equipamentos, fase 5). Implementar rolagem junto com os equipamentos.
- Poção do chão com a bolsa cheia some sem aviso; se incomodar, mostrar "Bolsa cheia" no texto flutuante.
- `heroDown` (em `combat-system.js`) muda `game.mode` e `game.overSel` direto para abrir o Game Over; se isso crescer, trocar por um método `game.gameOver()`.
- Ícones de itens (REC-01) continuam adiados; quando chegarem, a lista só precisa de uma coluna a mais.

## Conclusão

A implementação segue a TechSpec, respeita a direção de dependências e as regras de tamanho, e tem boa cobertura de testes. Os quatro problemas encontrados eram apenas de documentação e comentários e já foram corrigidos; nenhum bloqueador ficou aberto. **APROVADO.** Próxima etapa: QA jogável (`/executar-qa`).
