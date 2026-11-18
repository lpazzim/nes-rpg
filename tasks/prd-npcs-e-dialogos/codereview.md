# Revisão de código — NPCs e diálogos

## Resumo

- Data: 2026-11-17
- Veredito: **APROVADO**
- Arquivos revisados: 14
  - **Código novo:** `src/dialogues.js`, `src/dialog-runner.js`, `src/npcs.js`, `src/ui/dialog.js`.
  - **Código alterado:** `src/data.js`, `src/maps/builder.js`, `src/maps/adventure1.js`, `src/world.js`, `src/game.js`.
  - **Ferramentas:** `tools/build-sprites.js`, `tools/sprites.config.js`.
  - **Testes:** `tests/dialog.test.mjs`, `tests/maps.test.mjs`, `tests/content.test.mjs`.
  - **Documentação.**

## Conformidade com as rules

| Rule | Status | Observações |
| :--- | :--- | :--- |
| folder-structure (dependências) | OK | `dialogues.js` sem imports; `dialog-runner.js` só importa `data.js`; `npcs.js` importa `data.js`/`sprites.js`; `ui/dialog.js` importa `data.js`/`ui/ui.js`. Só `main.js` importa `game.js` |
| javascript (sem DOM no topo, ESM) | OK | Nenhum acesso a `document`/`window`/`localStorage` nos módulos novos; o `game.js` é importável no Node (usado nos testes de regressão) |
| code-standards (tamanho, dt, tabelas) | OK com ressalva | Módulos novos entre 62 e 112 linhas. Maior função: `Game.render` com 41 linhas (limite 60). Tempo sempre por `dt`, sem `setTimeout`. Números em `NPC_TUNING`/`DIALOG`. Textos do canvas sem acentos (garantido por teste). **Ressalva:** `game.js` com ~500 linhas, acima do limite de 400 (já registrado e atualizado na dívida técnica do `AGENTS.md`) |
| game-architecture (dano, save, modos) | OK | Modo `dialog` segue o padrão (classe de UI + callback). NPCs fora do combate. Save inalterado (`SAVE_VERSION` mantido; variantes usam `flags`) |
| documentation | OK | `README`, `AGENTS`, 4 rules, `CHANGELOG` e roteiro atualizados |

## Aderência à TechSpec

| Decisão | Implementada | Observações |
| :--- | :--- | :--- |
| `DialogRunner` puro separado do desenho | SIM | Testado no Node (TU-01 a TU-06) |
| Variantes por flag ("a primeira que vale") | SIM | `pickVariant`; teste exige que a última versão seja a padrão |
| Escolhas com um nível + `action` | SIM | `dialogAction` pronto para `'shop'`/`'sell'`/`'inn'` |
| Separação herói–NPC no `Game` | SIM | Corrigido o caso de distância zero (BUG-01) |
| Quebra de linha por caracteres (84) | SIM | Verificado no pior caso (3 linhas cheias) |
| `nearInteractable` pelo mais próximo | SIM | `{ kind, ref }`; vale para cristais e NPCs |
| `B.npc` reserva o bloco | SIM (desvio) | Reserva toda a área de passeio, e não só o bloco, para não nascer árvore no caminho do NPC. Melhoria |
| Aviso "E: Falar" a 40 px | SIM (desvio) | 52 px, para ficar acima do chapéu (sprites de NPC mais altos que o cristal) |
| Posições da TechSpec | SIM (desvio) | Ajustadas na tarefa 3 (Mercador ao norte da barraca, porque o balcão é virado para o sul); registrado no `task_3.md` |

## Tarefas verificadas

| Tarefa | Status | Observações |
| :--- | :--- | :--- |
| 1.0 Lógica e textos | COMPLETA | Código, TU-01 a TU-06 e TI-03 a TI-06 |
| 2.0 Entidade NPC | COMPLETA | Código, TU-07 e TU-08 |
| 3.0 NPCs nos mapas | COMPLETA | Código, TI-01 e TI-02 |
| 4.0 Integração e caixa | COMPLETA | Código e E2E-01 a E2E-09 executados |
| 5.0 Ajuste fino e docs | COMPLETA | Revalidação e documentação |

## Testes

- `npm test`: **58 passando, 0 falhando** (2 testes de regressão adicionados nesta revisão).
- Carga no navegador: sem erros no console; herói sobre o NPC é separado; conversa completa abre e fecha; save do usuário intacto.

## Problemas encontrados

| ID | Severidade | Arquivo | Descrição | Correção |
| :--- | :--- | :--- | :--- | :--- |
| BUG-01 | Média | `src/game.js` (`separateFromNpcs`) | Herói exatamente no mesmo ponto de um NPC (distância 0) não era empurrado e ficava preso dentro dele. Pode acontecer ao reviver um herói em cima de um NPC | **Aplicada:** com distância 0, empurra para baixo. Teste de regressão `BUG-01` + teste "não empurra para dentro de parede" |
| BUG-02 | Baixa | `src/dialog-runner.js` | Campo `asked` usado sem inicialização (funcionava porque `undefined` é falso) | **Aplicada:** `this.asked = false` no construtor |

## Pontos positivos

- A lógica de conversa é 100% testável sem navegador e já serve para a loja e a estalagem.
- O conteúdo (`dialogues.js`) fica separado do código e é protegido por testes (sem acentos, opções válidas, versões pós-chefe), o que é seguro para o dono do projeto editar.
- Testes de integridade iteram sobre **todos** os mapas: NPCs de aventuras futuras já nascem testados.
- A opção `dropAbove` no pipeline de sprites resolveu os títulos da folha sem edição manual.

## Recomendações

- **Antes da fase de lojas:** dividir o `game.js` (extrair interação/conversas e combate), como já previsto na dívida técnica. A loja adicionaria mais um modo e passaria das 550 linhas.
- `nearInteractable()` monta uma lista nova duas vezes por quadro (update e render). O custo é irrelevante com poucos objetos; se as cidades crescerem, calcular uma vez por quadro e reutilizar.
- `wrapText` ignora quebras de linha manuais (`\n`) nas falas. Se o dono do projeto quiser forçar uma quebra, documentar ou suportar.

## Conclusão

A implementação segue a TechSpec, com três desvios justificados e registrados, e respeita as rules. Os dois problemas encontrados foram corrigidos na causa e cobertos por testes. **APROVADO.** Próximo passo: `/executar-qa --prd npcs-e-dialogos`.
