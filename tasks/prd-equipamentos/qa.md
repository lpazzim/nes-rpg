# QA — Equipamentos

## Resumo

- Data: 2026-11-18
- Status: **APROVADO**
- Critérios de aceitação: 16 / 16
- Bugs encontrados: 1 (corrigidos: 1). Além dos 4 achados e corrigidos antes, no review.

Ambiente: preview `my-rpg`, teclado simulado e atalhos de `window.game`. O jogo foi avançado quadro a quadro (o preview pausa o relógio quando fica em segundo plano), com Novo Jogo. O espaço 1 (a sua campanha, 564 G) foi só lido e **continua idêntico** (versão 1, mesmo `savedAt`); os espaços 2 e 3, criados para o teste, foram apagados no fim.

## Critérios de aceitação

| CA | Descrição | Casos | Status | Evidência |
| :--- | :--- | :--- | :--- | :--- |
| CA-01 | Jogo novo: arma inicial equipada, outros espaços vazios | TU-01, TI-02, E2E-01 | PASSOU | Kaito `katana_gasta`, Rin `adagas_simples`, Aster `bastao_rachado`; armadura e acessório `null` |
| CA-02 | Status igual ao de hoje | TU-01, E2E-01 | PASSOU | Kaito 15/7/72/8%/0 MP, Rin 9/5/90/22%/0, Aster 12/4/68/5%/40: iguais à tabela de `HEROES` |
| CA-03 | Comparação em verde antes de confirmar | E2E-02 | PASSOU | Captura da aba Equip.: "Ataque 15 > 21" em verde, com o cursor na Katana de Aço |
| CA-04 | Confirmar troca | TU-02, TU-06, E2E-03 | PASSOU | Equipada `katana_aco`; ataque 15 → 21; Katana Gasta voltou à bolsa; aviso "Kaito equipou Katana de Aco" |
| CA-05 | Rin só vê armas de adagas | TU-03, TU-04, TI-02, E2E-04 | PASSOU | Lista da Rin: `Tirar` e `adagas_afiadas` (sem katana nem cajado, que estavam na bolsa) |
| CA-06 | "Tirar" esvazia e devolve tudo | TU-05, E2E-05 | PASSOU | Gibão equipado (defesa 7→13, velocidade 72→70, redução 5%); ao tirar: defesa 7, velocidade 72, redução 0, peça de volta à bolsa |
| CA-07 | Loja vende consumíveis e equipamentos | TI-01, TI-03, E2E-06 | PASSOU | 9 itens: Poção 30 G … Bracelete de Cobre 100 G; captura da loja |
| CA-08 | Peça equipada fora da lista de venda | E2E-07 | PASSOU | Katana de Aço equipada + 1 comprada: Vender lista 1 (a da bolsa); a equipada fica de fora |
| CA-09 | Vender dá metade do preço | TU-08, E2E-07 | PASSOU | 150 G → +75 G, "Vendeu 1 Katana de Aco (+75 G)"; a equipada continua equipada |
| CA-10 | Peça do Treant Ancião no chão, pega andando | TI-04, E2E-08 | PASSOU | Chefe derrotado → `heal` e `equip` no chão; saí da arena sem pegar (cenário do bug do review): a peça **voltou** ao reentrar; caminhei até ela: bolsa 1, flag `premio_bosque`, nada mais no chão; Coração dá defesa 9→13, crítico 8%→13%, redução 12% |
| CA-11 | Redução de dano ~17% | TU-08, TU-14, TI-05, E2E-09 | PASSOU | Gibão 5% + Coração 12% = 17%; 1000 golpes do ataque real do chefe (ATK 24), mesma defesa: 62,6 sem × 51,8 com = **queda de 17,2%** |
| CA-12 | Anel do Ímpeto enche o PODER mais rápido | TU-09, E2E-10 | PASSOU | Ganho por golpe 9 → 11,7 (×1,30); a barra enche em 9 golpes contra 12 sem o anel |
| CA-13 | Save antigo (v1) carrega e é convertido | TU-11, TU-12, TU-13, E2E-11 | PASSOU | Os dois saves v1 aparecem no título. Espaço 2 (fabricado): mapa floresta, 777 G, bolsa, flags, níveis 5, atributos idênticos, Aster ainda caído, armas iniciais. **Seu espaço 1** (564 G, nível 6) também carrega, sem alterar o arquivo |
| CA-14 | Salvar e carregar preserva o equipamento | TU-15, E2E-12 | PASSOU | Katana de Aço + Gibão + Anel equipados, salvo no cristal (espaço 3, versão 2); após recarregar a página e Continuar: mesmas 3 peças, ataque 31, defesa 18, velocidade 70, redução 5%, PODER ×1,3 |
| CA-15 | Testes de unidade do cálculo | TU-05, TU-07, TU-10, TI-05 | PASSOU | 116 testes automáticos passando |
| CA-16 | Comprar e equipar em menos de 1 minuto | E2E-13 | PASSOU | Do Mercador até a arma equipada: cerca de 27 toques de tecla (arma 25 → 31, ouro 1000 → 850). A 1 toque por segundo, fica em torno de 30 s; o relógio real da simulação não mede uma pessoa |

## Fluxos jogados (E2E)

| ID | Passos | Resultado | Observações |
| :--- | :--- | :--- | :--- |
| E2E-01 | Título → Novo Jogo → atributos | PASSOU | Teclado |
| E2E-02 | Enter → aba Equip. → lista da arma → Katana de Aço | PASSOU | Captura conferida |
| E2E-03 | Confirmar a troca | PASSOU | |
| E2E-04 | Rin: lista de armas | PASSOU | |
| E2E-05 | Equipar armadura e "Tirar" | PASSOU | |
| E2E-06 | E no Mercador → Comprar | PASSOU | Conversa de verdade |
| E2E-07 | Comprar uma segunda katana e vender | PASSOU | |
| E2E-08 | Chefe → peça → sair → voltar → pegar | PASSOU | Exercita a correção do review |
| E2E-09 | Dano com e sem a redução | PASSOU | 17,2% |
| E2E-10 | PODER com e sem o Anel | PASSOU | |
| E2E-11 | Continuar com save v1 fabricado e com o seu save | PASSOU | |
| E2E-12 | Salvar no cristal → recarregar → Continuar | PASSOU | |
| E2E-13 | Comprar e equipar | PASSOU | |

## Testes automáticos

- `npm test`: **116 passando / 0 falhando**.

## Checklist de jogo

- [x] Controles: setas, J/Enter, K e Q/E na aba Equip. e na loja; Enter agora abre a lista sem fechar o menu (corrigido no review); nenhuma tecla nova.
- [x] Legibilidade a 480x270: comparação em verde e vermelho legível; efeitos em azul; as 3 peças do Status cabem numa linha; a lista da loja agora rola (BUG-01).
- [x] Feedback: avisos "Kaito equipou ...", "Comprou ...", "Vendeu ... (+75 G)" e "+Coracao do Bosque" ao pegar a peça.
- [x] Desempenho: cerca de 4 ms por quadro (atualizar + desenhar) com a aba Equip. aberta, contra o orçamento de 16,7 ms para 60 quadros por segundo.
- [x] Save/carregamento: conferido (CA-13 e CA-14); o save antigo continua intacto.
- [x] Console sem erros: todas as execuções capturaram erros dentro da página e não registraram nenhum. As entradas antigas que a ferramenta ainda mostra são de testes anteriores à correção.

## Bugs

| ID | Descrição | Severidade | Status | Correção | Regressão |
| :--- | :--- | :--- | :--- | :--- | :--- |
| BUG-01 | A lista de venda (e a de compra) cabia 9 linhas, mas com 12 itens na bolsa os três últimos ficavam **escondidos atrás da janela de baixo**, mesmo com o cursor chegando neles. Ficou evidente depois de equipamentos entrarem na bolsa. | Média | Corrigido | `scrollTop` (função pura) mantém o cursor dentro da janela; aparecem os indicadores "^ mais" e "v mais" | Teste `BUG-01 (QA)` em `tests/shop.test.mjs` (varre subindo e descendo) e conferência na tela com 12 itens |

## Conclusão

Todos os 16 critérios de aceitação foram jogados e verificados no estado e na tela. A conversão do save protege a campanha em andamento: o save de teste no formato antigo e o seu próprio espaço 1 carregam sem perda, e o seu arquivo não foi alterado. O QA achou um problema real de uso (lista que escondia itens), corrigido e com teste de regressão. **APROVADO.**
