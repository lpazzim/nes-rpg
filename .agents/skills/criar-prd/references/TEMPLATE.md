# PRD — [Nome da funcionalidade]

## Visão geral

[Até dois parágrafos: o que a funcionalidade adiciona ao jogo, que problema de jogabilidade resolve e por que importa agora.]

## Objetivos

[Objetivos específicos e mensuráveis, por exemplo:

- O jogador compra e equipa uma arma em menos de 1 minuto na primeira cidade.
- 100% dos mapas novos passam nos testes de integridade.
- Nenhum erro no console durante o fluxo completo.]

## Histórias de usuário

- US1: Como jogador, quero [ação] para [benefício].
- US2: ...

[Cubra o fluxo principal, os secundários e os casos de borda (sem ouro, bolsa cheia, herói caído...).]

## Principais funcionalidades

[Para cada funcionalidade: o que faz, por que importa e como funciona em alto nível. Requisitos numerados:]

- RF1: ...
- RF2: ...

## Critérios de aceitação

[Comportamentos observáveis jogando ou por teste, ligados às histórias/requisitos:]

- CA-01: Dado [situação no jogo], quando [ação do jogador], então [resultado visível]. (US1, RF1)

## Experiência do jogador

- **Controles:** [teclas usadas, sem conflitar com as existentes: J/K/L, Espaço, Tab/Q, Enter/Esc, E, P, H]
- **Telas e layout:** [o que aparece na tela de 480x270; esboço em texto se ajudar]
- **Feedback:** [sons futuros, textos flutuantes, animações, banners]
- **Persistência:** [o que precisa ir para o save]

## Balanceamento

| Item | Valor inicial | Justificativa |
| :--- | :--- | :--- |
| [ex.: preço da Poção] | [30 G] | [~3 inimigos da floresta] |

## Recursos externos

| ID | Recurso | Necessário para | Placeholder enquanto isso | Situação |
| :--- | :--- | :--- | :--- | :--- |
| REC-01 | [ex.: folha do mercador] | [CA-02] | [sprite de morador genérico] | Pendente |

[Inclua o pedido pronto para o usuário, no formato de `.agents/rules/pixel-art-assets.md#6`.]

## Restrições de alto nível

- Roda no navegador, sem build e sem dependências (ver `AGENTS.md`).
- Saves existentes: [continuam válidos / exigem nova versão].
- [Outras: desempenho em mapas grandes, propriedade intelectual original.]

## Fora do escopo

- [O que não entra nesta entrega e fica para depois.]

## Dependências

- [Funcionalidades/PRDs que precisam estar prontos antes.]
