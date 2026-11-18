# QA — Loja e estalagem

## Resumo

- Data: 2026-11-17
- Status: **APROVADO**
- Critérios de aceitação: 15 / 15
- Bugs encontrados: 0 (nenhum novo no QA; o defeito de animação ao carregar save e o import esquecido já tinham sido achados e corrigidos antes, durante a execução das tarefas)

Ambiente: preview `my-rpg`, viewport 960x540, teclado simulado e atalhos de `window.game`. Os testes usaram Novo Jogo. O espaço 1 (564 G) foi só lido e continuou idêntico; o espaço 2, criado para o teste, foi apagado no fim.

## Critérios de aceitação

| CA | Descrição | Casos | Status | Evidência |
| :--- | :--- | :--- | :--- | :--- |
| CA-01 | Divisão do `game.js` sem mudar o jogo | TU-01, TU-02, TI-01, TI-02, E2E-01 | PASSOU | `game.js` com 323 linhas; combate real (J): inimigo morre, ouro 10→16, XP 0→8; cura do chão e explosão funcionam; Game Over → "Carregar último save" volta ao jogo com os 3 heróis vivos; sem erros |
| CA-02 | Mercador → Comprar mostra os 4 itens, "Tem" e ouro | TI-03, TI-04, E2E-02 | PASSOU | `mode: 'shop'`; Poção 30 G (Tem 3), Poção Forte 90 G (0), Éter 60 G (1), Pena de Fênix 150 G (1); ouro "50 G" no topo; captura: itens sem condição em cinza |
| CA-03 | 100 G e 3 Poções: comprar 3 → 10 G e 6 Poções | TU-03, E2E-03 | PASSOU | ouro 10, poções 6, aviso "Comprou 3 Pocao!" |
| CA-04 | Seletor para em 3 (ouro) e em 1; total acompanha | TU-04, E2E-03 | PASSOU | ↑×5 → 3; ↓×6 → 1; captura "Quantidade: < 3 > Total: 90 G" |
| CA-05 | 20 G, Poção → "Ouro insuficiente" | TU-05, E2E-04 | PASSOU | aviso na tela; ouro 20 e poções 6 inalterados |
| CA-06 | 99 Poções → "Bolsa cheia" | TU-06, E2E-04 | PASSOU | aviso na tela; ouro 999 e poções 99 inalterados |
| CA-07 | Vender 2 de 3 → +30 G; a última some da lista | TU-07, TU-08, E2E-05 | PASSOU | "Vendeu 2 Pocao (+30 G)": ouro 30, sobra 1; última: ouro 45, chave `potion` removida |
| CA-08 | Bolsa vazia → "Nada para vender" | TU-09, E2E-04 | PASSOU | captura da tela Vender com a mensagem no centro |
| CA-09 | K volta um passo por vez; mundo parado | E2E-05 | PASSOU | qty → list → jogo; com inimigo perseguindo, posições do inimigo, do líder e `playTime` iguais após 1 s; o jogo volta a andar ao fechar |
| CA-10 | Descansar com caído e feridos, 50 G | TU-10, TI-04, TI-05, E2E-06 | PASSOU | captura da tela escurecendo; ouro 30; os 3 heróis vivos com HP e MP cheios; revivido ao lado do líder; fala "Bom dia!..." |
| CA-11 | 10 G → aviso de falta de ouro | TU-11, E2E-06 | PASSOU | "Hmm, falta ouro para o quarto..."; ouro 10, HP 5, sem fade |
| CA-12 | Grupo cheio → aviso, sem cobrar | TU-12, E2E-06 | PASSOU | "Voces parecem descansados!..."; ouro 50 |
| CA-13 | Save/carregar preserva ouro e bolsa; save antigo carrega | E2E-07 | PASSOU | salvo pelo cristal no espaço 2 (77 G, 5 Poções, 2 Poções Fortes); recarga da página + Continuar devolve os mesmos valores; espaço 1 (save antigo) carrega 564 G e fica idêntico |
| CA-14 | Regras: ouro nunca negativo, 0 a 99, entradas inválidas | TU-08, TU-13, TU-14 | PASSOU | 14 testes de loja passando, incluindo 500 operações aleatórias com semente |
| CA-15 | 3 Poções em menos de 30 s | E2E-08 | PASSOU | 1,1 s de E no Mercador até a compra (duas medições: 1,1 s e 1,1 s) |

## Fluxos jogados (E2E)

| ID | Passos | Resultado | Observações |
| :--- | :--- | :--- | :--- |
| E2E-01 | Combate real, cura do chão, explosão, Game Over e carregar | PASSOU | Sem erros na própria página |
| E2E-02 | E no Mercador → Comprar | PASSOU | Abre pela conversa de verdade |
| E2E-03 | 100 G, Poção, ↑/↓, J | PASSOU | |
| E2E-04 | Sem ouro, bolsa cheia, bolsa vazia | PASSOU | Estado inalterado em todos |
| E2E-05 | Vender, voltar com K, loja aberta na floresta | PASSOU | Mundo congelado |
| E2E-06 | Descansar: grupo cheio, sem ouro, caído + feridos | PASSOU | Fade ~1 s para cada lado |
| E2E-07 | Salvar no cristal, recarregar, Continuar; save antigo | PASSOU | Espaço de teste removido |
| E2E-08 | Cronometragem da compra | PASSOU | 1,1 s |

## Testes automáticos

- `npm test`: **78 passando / 0 falhando**.

## Checklist de jogo

- [x] Controles: setas, J e K na loja e na estalagem; E para falar; nenhuma tecla nova nem conflito.
- [x] Legibilidade a 480x270: janelas azuis legíveis, preço dourado, itens indisponíveis em cinza; sem sobrepor o HUD (a loja cobre a tela e o HUD fica por baixo).
- [x] Feedback: avisos verdes e vermelhos, ouro atualizado na hora, fade na estalagem.
- [x] Desempenho: 61 quadros por segundo com a loja aberta.
- [x] Save/carregamento: conferido (CA-13).
- [x] Console sem erros: todas as execuções capturaram erros dentro da página e não registraram nenhum. As duas entradas antigas que a ferramenta do console ainda mostra (`updateFx` e `frames`) são de antes das correções e não se repetem.

## Bugs

| ID | Descrição | Severidade | Status | Correção | Regressão |
| :--- | :--- | :--- | :--- | :--- | :--- |
| — | Nenhum bug novo encontrado no QA | — | — | — | — |

Observações (não são bugs, estão no review): a lista de venda não rola além de 8 itens (relevante com equipamentos) e uma Poção do chão some sem aviso com a bolsa cheia.

## Conclusão

Todos os 15 critérios de aceitação foram jogados e verificados no estado e na tela. A loja e a estalagem funcionam como o PRD descreve, o save antigo continua carregando, e a divisão do `game.js` não alterou o combate nem as conversas. **APROVADO.**
