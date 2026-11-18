# QA — NPCs e diálogos

## Resumo

- Data: 2026-11-17
- Status: **APROVADO**
- Critérios de aceitação: **12 / 12** atendidos
- Bugs encontrados no QA: 0 (os 2 da revisão de código já estavam corrigidos e com regressão: ver `codereview.md`)
- Ambiente: preview `my-rpg` (porta 8080), aba própria com viewport de 960x540, novo jogo sem salvar; o save do usuário (espaço 1) foi lido, mas nunca alterado

## Critérios de aceitação

| CA | Descrição | Casos | Status | Evidência |
| :--- | :--- | :--- | :--- | :--- |
| CA-01 | 4 NPCs nas posições, com profundidade | TI-01, E2E-01 | PASSOU | `game.npcs` = mercador_fazenda, estalajadeira, velho_agricultor, aprendiz; capturas da praça (Mercador atrás da barraca, Aprendiz no lago) e do campo (Estalajadeira na estalagem, Velho no campo, heróis atrás das árvores) |
| CA-02 | O grupo não atravessa NPC | TI-02, E2E-02 | PASSOU | Teclado real por 1 s, pela esquerda e por cima: distância final de 11 px (mínimo 10) nos dois casos |
| CA-03 | Passeio sem sair da área nem travar | TU-07, E2E-03 | PASSOU | Velho em 30 s: 8 caminhadas, afastamento máximo de 29,9 px (raio de 32 px) |
| CA-04 | E abre a conversa; NPC se vira; mundo para | TU-08, E2E-04 | PASSOU | `mode = 'dialog'`, nome "Jovem Aprendiz", NPC virado para o líder (`side`, `faceX = -1`), `playTime` parado; captura da caixa |
| CA-05 | Interage com o mais próximo (cristal x NPC) | E2E-05 | PASSOU | Mais perto do NPC → `npc`/`dialog`; mais perto do cristal → `save`/tela de save (fechada com K, sem salvar) |
| CA-06 | J completa, avança e fecha | TU-03, TU-04, E2E-06 | PASSOU | Página em digitação completada com J; avanço; fechamento com `mode = 'play'` e NPC de volta a `idle` |
| CA-07 | Escolhas com setas/J; K/Esc = Sair | TU-05, TI-03, E2E-07 | PASSOU | Setas percorrem e dão a volta (cursor retorna ao início); Esc → "Volte sempre! E cuidado com os espantalhos." |
| CA-08 | Comprar/Vender/Descansar avisam "em breve" | TU-06, TI-06, E2E-07 | PASSOU | Falas "Volte em breve!" / "Em breve!" / "Volte em breve que eu preparo um quarto!", sem erro |
| CA-09 | Falas mudam com a flag `bosque` | TU-02, TI-04, E2E-08 | PASSOU | Os 4 NPCs usam a versão pós-chefe; confirmado também com o **save real do usuário** (que já tem `bosque`): "A vila inteira so fala da vitoria de voces!..." |
| CA-10 | Velho e Aprendiz dão dicas | TI-05, E2E-04 | PASSOU | Aprendiz: "...tocos da floresta sao treants disfarcados...", "...dentro da caverna e tao escuro..." |
| CA-11 | No máximo 3 linhas, nada fora da caixa | TU-01, TI-03, E2E-09 | PASSOU | Pior caso (3 linhas cheias): maior linha com 369 px de 432 px úteis; nome mais longo cabe na aba; captura |
| CA-12 | NPCs com sprite, em chão andável, sem bloquear caminhos | TI-01, TI-02 | PASSOU | Testes em todos os mapas registrados (5) |

## Fluxos jogados (E2E)

| ID | Passos | Resultado | Observações |
| :--- | :--- | :--- | :--- |
| E2E-01 | Novo jogo → capturas da praça e do campo | PASSOU | Profundidade correta com barracas, casas e árvores |
| E2E-02 | Andar com D e com S contra o Mercador por 1 s | PASSOU | 11 px |
| E2E-03 | 30 s simulados observando o Velho | PASSOU | 29,9 px / 32 px |
| E2E-04 | Encostar no Aprendiz → E → ler as falas | PASSOU | Mundo congelado; dicas presentes |
| E2E-05 | Mercador trazido para perto do cristal; E mais perto de cada um | PASSOU | Mercador devolvido à posição depois |
| E2E-06 | J durante a digitação, J para avançar, J até fechar | PASSOU | |
| E2E-07 | Mercador: Comprar, Vender (setas), Esc; Estalajadeira: Descansar | PASSOU | |
| E2E-08 | `flags.bosque = true` → conversar com os 4 | PASSOU | |
| E2E-09 | Página de teste com 3 linhas de 84 caracteres | PASSOU | |
| Extra | Carregar o save antigo (espaço 1, anterior aos NPCs) | PASSOU | Vila, nível 6, 564 G, `bosque` ativo, 4 NPCs presentes; save não alterado |

## Testes automáticos

- `npm test`: **58 passando, 0 falhando** (TU-01 a TU-08, TI-01 a TI-06 e as regressões BUG-01).

## Checklist de jogo

- [x] Controles: E conversa; J/Enter avança; setas escolhem; K/Esc = Sair só com escolhas na tela (Esc sem escolhas não fecha nem abre o menu); o menu volta a abrir com Enter depois da conversa
- [x] Legibilidade a 480x270: texto de 8 px nítido, aba de nome, seta de continuar e janela de escolhas sem sobrepor o texto
- [x] Feedback visual: "E: Falar" acima do NPC, NPC vira para o líder, seta piscando, cursor amarelo
- [x] Desempenho: 0,57 ms por quadro (update + render) na vila com os NPCs; orçamento de 16,7 ms
- [x] Save/carregamento: save antigo carrega com os NPCs; formato do save inalterado
- [x] Console sem erros durante todo o QA

## Bugs

| ID | Descrição | Severidade | Status | Correção | Regressão |
| :--- | :--- | :--- | :--- | :--- | :--- |
| — | Nenhum bug encontrado no QA | — | — | — | — |

## Conclusão

Os 12 critérios de aceitação foram verificados jogando e por testes automáticos, todos atendidos, inclusive a compatibilidade com o save real do usuário. A funcionalidade está pronta. **APROVADO.**

Observação para as próximas etapas (não bloqueante): o `game.js` está com ~500 linhas; a divisão recomendada na revisão deve acontecer antes da loja (`prompts/04-loja-e-estalagem.md`).
