# Revisão de código — Equipamentos

## Resumo

- Data: 2026-11-18
- Veredito: **APROVADO**
- Arquivos revisados: 24
  - **Novos:** `src/equipment.js`, `src/ui/equip.js`, `tests/equipment.test.mjs`, `tests/save.test.mjs`.
  - **Alterados:** `src/heroes.js`, `src/save.js`, `src/items.js`, `src/shop.js`, `src/combat-system.js`, `src/game.js`, `src/ui/menu.js`, `src/ui/shop.js`, `tests/content.test.mjs`, `tests/systems.test.mjs`.
  - **Documentação:** `README.md`, `AGENTS.md`, `CHANGELOG.md`, `prompts/README.md`, `.agents/rules/{folder-structure,game-architecture,maps-and-adventures,tests}.md`.

## Conformidade com as rules

| Rule | Status | Observações |
| :--- | :--- | :--- |
| folder-structure (dependências) | OK | Só `main.js` importa `game.js`. `equipment.js` não importa nada do jogo (base). `items.js` → `equipment.js` e `shop.js` → `items.js` em sentido único, sem ciclo. `ui/equip.js` só lê `equipment.js` e `ui/ui.js`. |
| javascript (sem DOM no topo, ESM) | OK | Nenhum `document`, `window` ou `localStorage` nos módulos novos; `equipment.js` e `save.js` são importáveis no Node (usados nos testes). JSDoc em `Equipped`, `EquipBonus`, `StatDiff` e na migração. `EQUIPMENT` nunca é alterada em jogo. |
| code-standards (tamanho, dt, tabelas) | OK | Maior arquivo: `heroes.js` com 356 linhas (limite 400); `equipment.js` 235; `equip.js` 124. Nenhuma função acima de 60 linhas. Preços, bônus, teto de redução e arma inicial ficam em tabelas de `equipment.js`. Sem `setTimeout`. Textos do canvas sem acentos (testado em `TI-01`). |
| game-architecture (dano, save, modos) | OK | O dano continua passando por `game.damage` → `applyDamage`; a redução do herói entra ali, depois do `calcDamage` e antes do HP, com mínimo de 1. Save atualizado nos três pontos (`newGame` via construtor, `saveGame`/`toSave`, `loadGame`/`loadSave`). `SAVE_VERSION` passou para 2 **com migração** em `migrateSave`, como a regra exige quando há progresso em andamento. Nenhum modo novo. |
| documentation | OK | `README`, `AGENTS`, `CHANGELOG` (com o aviso da conversão do save), 4 rules e roteiro atualizados. A flag nova `premio_bosque` entrou na tabela de flags. |

## Aderência à TechSpec

| Decisão | Implementada | Observações |
| :--- | :--- | :--- |
| Separar atributo próprio (`base*`) de efetivo (getters) com `bonus` pré-calculado em `recalcEquip()` | SIM | Nível soma em `base*`; equipar nunca altera `base*`. Nenhuma escrita direta sobrou nos atributos (busca em todo `src/`). |
| Equipamento na mesma bolsa `{ id: quantidade }` e `findItem` | SIM | A loja inteira foi reaproveitada; peça equipada não está na bolsa e some da lista de venda sozinha. |
| Migração v1 → v2 pura em `save.js` | SIM | Provada com `TU-11` a `TU-13` e carregando um save antigo fabricado no navegador. Nada reescreve o save em disco sozinho. |
| Aba Equip. em `src/ui/equip.js` | SIM | `menu.js` ficou com 182 linhas. |
| Redução de dano em `applyDamage` | SIM | Teto de 25% e mínimo de 1 cobertos por teste. |
| Peça do chefe como item no chão | SIM, **com reforço** | Ver BUG-01: a TechSpec não previa que ela pudesse se perder. |
| Dado `starter` em `data.js` | NÃO (justificado) | A arma inicial ficou só em `STARTER` (`equipment.js`), fonte única; duplicar em `data.js` criaria duas tabelas para manter. |
| Status com "três linhas curtas" de peças | PARCIAL (justificado) | O painel já estava cheio e as três linhas colidiam com os Golpes; ficou uma linha compacta no rodapé do painel. |
| Lista de peças sem rolagem (máx. 5) | SIM | Cobre a aventura 1; a rolagem fica como recomendação. |

## Tarefas verificadas

| Tarefa | Status | Observações |
| :--- | :--- | :--- |
| 1.0 Peças e regras puras | COMPLETA | `TU-02` a `TU-10`, `TI-01`, `TI-02`, `TI-05`. |
| 2.0 Herói com base e bônus | COMPLETA | `TU-01`, `TU-07`, `TU-09`, `TU-14`; o jogo seguiu idêntico com a arma inicial. |
| 3.0 Save versão 2 | COMPLETA | `TU-11` a `TU-15`; E2E-11 e E2E-12 com save fabricado em espaço livre. |
| 4.0 Loja e peça do chefe | COMPLETA | `TI-03`, `TI-04`; E2E-06 a E2E-08. |
| 5.0 Aba Equip. | COMPLETA | E2E-01 a E2E-05, E2E-09, E2E-10. |
| 6.0 Verificação e documentação | COMPLETA | E2E-13 em 3,3 s; documentação atualizada. |

## Testes

- `npm test`: **115 passando / 0 falhando** (eram 78 antes da funcionalidade).
- Carga no navegador: **sem erros** (novo jogo, loja, aba Equip., troca de mapa, arena do chefe).
- Segurança dos dados: o espaço 1 só foi lido; o save de teste (espaço 2) foi apagado.

## Problemas encontrados

| ID | Severidade | Arquivo:linha | Descrição | Correção |
| :--- | :--- | :--- | :--- | :--- |
| BUG-01 | **Alta** | `src/combat-system.js` (`updatePickups`), `src/game.js` (`enterMap`) | A peça do Treant Ancião era um item comum no chão: **sumia após 30 s** e era **apagada ao sair do mapa**. Como o chefe não renasce depois de derrotado, a recompensa se perdia para sempre, e quem ainda não a pegou também não a receberia no save atual (chefe já vencido). | **Aplicada:** a peça não expira; a flag `premio_bosque` marca quando foi pega; ao entrar na arena com o chefe vencido e a flag ausente, a peça volta ao chão (`restoreBossPrizes`). Pegar e vender não a faz reaparecer. 4 testes de regressão e verificação no navegador. |
| BUG-02 | Média | `src/ui/equip.js:47` | `Enter` abre a lista de peças, mas o menu também fecha com `Enter`: apertar Enter na aba Equip. abria a lista e fechava o menu no mesmo toque. Só aparecia com Enter (J funcionava). | **Aplicada:** a aba consome a tecla de confirmação. Conferido no navegador. |
| BUG-03 | Baixa | `src/ui/menu.js:23` | Trocar de aba com Q/E no meio da lista de peças deixava a aba Equip. no passo "lista" ao voltar. | **Aplicada:** `equip.reset()` ao trocar de aba. Conferido no navegador. |
| BUG-04 | Baixa | `src/ui/equip.js:8` | Import `win` sem uso. | **Aplicada.** |

## Pontos positivos

- A separação entre atributo próprio e bônus resolveu o risco central: o teste `TU-05` prova que equipar e tirar não "vaza" nada, e os getters mantêm o resto do jogo sem saber que equipamento existe.
- A conversão do save foi tratada como o maior risco e vem com teste que compara a força antes e depois (`TU-12`, `TU-15b`), além do teste no navegador com um save antigo de verdade.
- O ciclo "equipar → comparação em verde/vermelho → confirmar" é coberto por funções puras, sem depender de tela para ser testado.
- O teste de conteúdo itera sobre todas as peças: peça nova é verificada sem mexer no teste.
- O review pegou um problema de jogo (BUG-01) que nenhum teste automático teria achado, porque depende do tempo e da troca de mapa.

## Recomendações

- **Rolagem na lista de peças e na de venda:** a aba Equip. mostra no máximo 5 peças e a loja cabe 9 itens. Com as aventuras 2 e 3 vão passar disso.
- `EquipTab.options` e `compareStats` alocam listas a cada quadro enquanto a aba está aberta. É irrelevante hoje (só no menu), mas se a aba crescer vale guardar o resultado e recalcular só ao mudar a seleção.
- `compareStats` mostraria "MP máximo 0 → 10" para um herói sem magia se algum dia existir armadura ou acessório com MP. Nenhuma peça atual faz isso (o getter já ignora o bônus de MP quando o herói não usa magia); tratar junto com a primeira peça assim.
- `loadSave` não valida se a arma do save combina com o estilo do herói. Só importa para saves editados à mão.
- Ícones de equipamento (REC-01) seguem adiados.

## Conclusão

A funcionalidade segue a TechSpec e as regras do projeto, tem boa cobertura de testes e protege a campanha em andamento com uma conversão de save testada. O review encontrou um problema grave de jogo (a recompensa do chefe podia se perder para sempre) e três menores; todos foram corrigidos, com testes de regressão, e nenhum bloqueador ficou aberto. **APROVADO.** Próxima etapa: QA jogável (`/executar-qa`).
